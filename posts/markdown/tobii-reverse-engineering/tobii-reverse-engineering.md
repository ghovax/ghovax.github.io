When I encountered compatibility issues with Tobii's macOS SDK for the Eye Tracker 5, I noticed something interesting: applications like Talon Voice could access the device perfectly, despite the same licensing restrictions. This observation sparked a months-long reverse engineering project that took me through USB protocols, binary decompilation with Ghidra, and ultimately into the sophisticated multi-layered architecture Tobii employs to protect their commercial hardware. Using Ghidra's Model Context Protocol integration with Claude Code, I systematically analyzed five different binaries—DLLs, Python extensions, service executables, and authorized applications—mapping out the complete protocol stack from raw USB bulk transfers through message framing to high-level operations. The project succeeded in documenting the entire communication architecture but ultimately revealed why reverse engineering modern commercial systems is so challenging: even with the protocol structure fully understood, cryptographic protection renders the actual data inaccessible without vendor license keys. This is a story about both what's possible with modern reverse engineering tools and where the limits lie.

### Disclaimer

This work was undertaken strictly for educational and research purposes. It clearly violates Tobii's terms of service. The Tobii Eye Tracker 5 is a commercial device with licensing restrictions, and attempting to circumvent these protections for production use would be unauthorized. My motivation was purely educational: to understand how the device operates and to address an apparent incompatibility with Tobii's public macOS SDK, which is constrained by a heavy licensing model. This documentation is provided for learning purposes only as a reference for my own work. This information should not be used for any unauthorized purposes.

### The Reverse Engineering Stack

My approach relied on several key tools and techniques that proved essential for dissecting the Tobii ecosystem. I used Ghidra's Model Context Protocol integration connected to Claude Code to analyze multiple binaries. This combination allowed me to decompile functions, search for specific strings and patterns, and document findings systematically. The MCP integration meant I could ask targeted questions about function behavior and get analysis of decompiled code in real-time.

I analyzed five key binaries, each revealing different layers of the protocol: `tobii_stream_engine.dll` (the Windows SDK library implementing the high-level Stream Engine API for networked devices), `tobii_research_interop.so` (a Python C extension wrapping the tobii-research API, using the Platform Runtime Protocol), `platform_runtime_IS5LPROENTRY_MAC_x64_service` (the macOS Platform Runtime service that bridges PRP to USB), the Talon Voice binary (an authorized application that successfully communicates with the Eye Tracker 5), and `setup.sh` (the macOS service installer revealing system integration details).

Using PyUSB and libusb, I could monitor USB traffic, identify endpoints, and attempt protocol reimplementation. The Tobii Eye Tracker 5 presents itself as a USB device with vendor ID `0x2104` (Tobii AB) and product ID `0x0313` (EyeChip).

What emerged was a sophisticated four-layer architecture: USB bulk transfers (raw hardware communication), Tobii Tracker Protocol or TTP (message framing and transaction management), Platform Runtime Protocol or PRP (high-level operations, streams, and properties), and encryption and licensing (the impenetrable barrier).

### Dissecting the USB Layer

The journey began with the lowest level: USB communication. By analyzing the Talon Voice binary with Ghidra, I identified the core USB functions responsible for device interaction. The binary contained clear references to libusb functions like `libusb_open`, `libusb_claim_interface`, and `libusb_bulk_transfer`. The initial connection sequence follows a predictable pattern:

1. Scan USB buses for devices matching VID `0x2104`, PID `0x0313`
2. Call `libusb_open()` to obtain a device handle
3. Claim interface 0 with `libusb_claim_interface()`
4. Read string descriptor 3 to get the device serial number (format: `IS5FF-XXXXXXXXXXXX`)
5. Send a control transfer with `bmRequestType=0x41`, `bRequest=0x41`, `wValue=0`, `wIndex=0`, no data payload

The USB endpoints were straightforward to identify:

- Bulk IN `0x82` receives data from the device: streaming video and responses
- Bulk OUT `0x04` sends commands to the device

Decompiling the `_eye_open` function in the Talon binary revealed the exact initialization sequence:

```c
int _eye_open(libusb_device_handle **handle_out, char *serial_out) {
    libusb_device_handle *dev_handle;
    int result;

    // Open device
    result = libusb_open(device, &dev_handle);
    if (result < 0) return result;

    // Claim interface 0
    result = libusb_claim_interface(dev_handle, 0);
    if (result < 0) {
        libusb_close(dev_handle);
        return result;
    }

    // Read serial number (string descriptor 3)
    result = libusb_get_string_descriptor_ascii(dev_handle, 3, serial_out, 0x100);
    if (result < 0) {
        libusb_release_interface(dev_handle, 0);
        libusb_close(dev_handle);
        return result;
    }

    // Initial control transfer
    result = libusb_control_transfer(dev_handle, 0x41, 0x41, 0, 0, NULL, 0, 5000);
    if (result < 0) {
        libusb_release_interface(dev_handle, 0);
        libusb_close(dev_handle);
        return result;
    }

    *handle_out = dev_handle;
    return 0;
}
```

The control transfer with request `0x41` appears to be a device initialization or "wake-up" command. Without this transfer, subsequent bulk operations fail. After initialization, the device streams data continuously on the bulk IN endpoint `0x82`. I captured this data and found it consists of raw grayscale video frames from the device's infrared eye cameras (128×128 pixel images at approximately 60-120 FPS, with pixel values ranging from 0 to 255). This video stream is what the device uses internally to calculate gaze position, but it arrives unprocessed. The actual gaze coordinates are computed somewhere else in the pipeline.

### The Tobii Tracker Protocol (TTP)

The next layer up from raw USB is the Tobii Tracker Protocol (TTP), which I discovered by analyzing the Platform Runtime service binary. TTP defines how messages are structured on top of USB bulk transfers. The message format is remarkably simple:

```
Message Structure:
Offset | Size | Description
-------|------|------------
0      | 4    | Transaction ID (big-endian uint32)
4      | 4    | Data length (big-endian uint32)
8      | var  | Data payload (TTP serialized)
```

Every command sent to the device includes a transaction ID for matching requests with responses. The data payload is serialized using a custom format I'll call "Eye Tracker Protocol" (ETP), which encodes typed fields. The `_eye_cmd` function in Talon demonstrates sending a command:

```c
int _eye_cmd(libusb_device_handle *dev, const char *cmd_str, void *response_out) {
    uint32_t tid = generate_transaction_id();
    uint8_t *data_payload;
    uint32_t data_len;

    // Format command string into binary (e.g., "[u]" -> binary blob)
    format_command(cmd_str, &data_payload, &data_len);

    // Build message: tid + len + data
    uint8_t message[8 + data_len];
    *(uint32_t*)&message[0] = htonl(tid);  // Big-endian transaction ID
    *(uint32_t*)&message[4] = htonl(data_len);  // Big-endian length
    memcpy(&message[8], data_payload, data_len);

    // Send on bulk OUT endpoint 0x4
    int written;
    int result = libusb_bulk_transfer(dev, 0x04, message, 8 + data_len, &written, 5000);
    if (result < 0) return result;

    // Wait for response on bulk IN endpoint 0x82 with matching tid
    return wait_for_response(dev, tid, response_out);
}
```

The only command I could definitively identify in the binaries was `"[u]"`, which appears to be a setup or version query command. When formatted into binary by the `FUN_1003108a4` function, `"[u]"` becomes:

```
Hex: 02 00 00 00 04 00 00 00 00
```

This suggests an ETP structure like:

```
Byte 0: Type (0x02)
Bytes 1-4: Length (0x00000004)
Bytes 5-8: Value (0x00000000)
```

The response to `"[u]"` is a BSON object containing device version information. BSON (Binary JSON) appears to be Tobii's choice for structured response data. The parsing function `FUN_10030be20` extracts fields like `{"$data": version_info}` from the response.

### The Platform Runtime Protocol (PRP)

The highest abstraction layer is the Platform Runtime Protocol, which the macOS service uses to expose devices to client applications. PRP runs over Unix domain sockets or TCP connections, providing a network-transparent interface to eye trackers. By decompiling the `platform_runtime_IS5LPROENTRY_MAC_x64_service` binary and the `tobii_research_interop.so` library, I mapped out PRP's architecture. Client applications connect to the Platform Runtime service via Unix socket at `/tmp/tobii_stream_engine` (inferred from transport creation functions). The service acts as a PRP server, translating high-level PRP operations into low-level TTP messages over USB. PRP messages have a consistent header format:

```
Offset | Size | Description
-------|------|------------
0      | 4    | Magic number: 0x50525054 ("TPRP")
4      | 4    | Message length (including header)
8      | 4    | XOR checksum: length ^ 0x50525054
12     | 4    | Operation type
16+    | var  | Operation-specific data
```

The magic number and checksum provide basic message validation. The checksum is a simple XOR of the length with the magic number (not cryptographically secure, but sufficient for detecting corruption).

PRP defines 11 operation types: streaming data like gaze points, property change notifications, set device properties, get device properties, list properties, send commands (calibration, licensing, etc.), multiple streams combined, and more. The protocol supports 34 different stream types, ranging from basic gaze points to advanced wearable data: basic gaze coordinates, full 3D gaze with per-eye data, eye camera images, diagnostic images, and more than 30 other specialized streams.

Commands control device behavior and calibration: authenticate with license credentials, begin calibration procedure, collect calibration point, store license for device access, and more than 20 other commands.

The `prp_client_create` function in the interop library revealed how clients authenticate:

```c
int prp_client_create(prp_client_t **client_out,
                      const void *config_data,
                      unsigned long config_len,
                      const prp_client_config_t *config,
                      logging_setup log_setup,
                      prp_accumulator_alloc_t allocator,
                      const prp_type_license_key_t *license_key,
                      // ... more parameters) {

    // Initialize PRP client context
    prp_client_t *client = allocate_client();

    // Create transport (Unix socket to runtime service)
    client->transport = transport_create_socket_address(visibility_type_2);

    // Build connect message with authentication
    prp_message_t *connect_msg = prp_init_connect_message(
        client_id,
        application_signature,  // SHA-256 hash from SDK
        license_features,       // Required features (gaze, calibration, etc.)
        license_levels,         // License tier
        license_key             // Encrypted license key
    );

    // Send and await response
    int result = send_and_wait_response(client->transport, connect_msg);
    if (result != PRP_ERROR_NO_ERROR) {
        return result;  // PLATMOD_ERROR_UNAUTHORIZED if bad license
    }

    *client_out = client;
    return PRP_ERROR_NO_ERROR;
}
```

The critical fields here are `application_signature` and `license_key`. The signature is a cryptographic hash derived from the SDK that identifies the application. The license key is device-specific and encrypted. Without valid credentials, the runtime service rejects the connection with `PLATMOD_ERROR_UNAUTHORIZED`.

### The Encryption Barrier

This is where my reverse engineering hit an insurmountable wall. While I successfully traced the entire protocol stack from USB bulk transfers through TTP message framing to PRP high-level operations, the actual payload data (the gaze coordinates, pupil diameters, timestamps) is encrypted. The encryption happens at multiple points.

License keys are stored encrypted in device firmware. The `License Key Store` command (11) accepts an encrypted blob that only Tobii's servers can generate. These keys are unique per device, identified by serial number. Even after establishing a connection, stream data payloads are encrypted. The `receive_stream_prp` function in the interop library decrypts incoming stream packages using keys derived from the license. Without the license, the data remains opaque binary. The SDK generates application signatures using a private key held by Tobii. Reverse engineering this signature generation would require breaking their cryptographic implementation (a non-trivial task and ethically questionable).

I attempted several approaches to circumvent the encryption. I wrote Python code using PyUSB to connect directly to the device at the USB layer, bypassing the runtime service:

```python
import usb.core
import struct

# Find Tobii device
dev = usb.core.find(idVendor=0x2104, idProduct=0x0313)
dev.set_configuration()
usb.util.claim_interface(dev, 0)

# Read serial
serial = usb.util.get_string(dev, 3)
print(f"Serial: {serial}")

# Initial control transfer
dev.ctrl_transfer(0x41, 0x41, 0, 0, None)

# Send setup command "[u]"
tid = 1
data = b'\x02\x00\x00\x00\x04\x00\x00\x00\x00'
message = struct.pack(">II", tid, len(data)) + data
dev.write(0x4, message)

# Read response
response = dev.read(0x82, 0x4000, timeout=5000)
print(f"Response: {response}")
```

This code successfully connects and sends the `"[u]"` command. The device responds, but the response payload is a BSON object that, when decoded, contains version information but no gaze data. Subscribing to gaze streams requires sending additional commands that I could not fully decode without understanding the encryption scheme. I decompiled the `_usbman_start`, `manager_thread_func`, and `send_and_retrieve_response` functions to understand how the service translates PRP to USB. The process is clear: PRP stream subscriptions become TTP messages with specific operation codes (for example, `0x51` for calibration start). However, the actual data encoding uses lookup tables and cryptographic functions that depend on the loaded license. I attempted to monitor Talon Voice's USB traffic to capture a valid authenticated session. While I could see the bulk transfers, the payloads were encrypted in transit. Talon must have a valid license key embedded in its binary, but extracting and reusing it would violate both Tobii's and Talon's terms.

The reality is that Tobii's licensing model is effective. The encryption is not a superficial obfuscation but an integral part of the protocol. Breaking it would require either extracting a valid license key from an authorized application's memory during runtime or by reverse engineering Tobii's key generation algorithm, understanding how the license key is transformed into session encryption keys, and implementing the decryption algorithm to recover gaze data from stream packages. Each of these steps involves cryptographic operations designed to resist reverse engineering. Pursuing them further would cross from educational exploration into unauthorized circumvention of technical protection measures.

### What I Learned

Despite not achieving the goal of extracting gaze data, this project was deeply educational. I gained hands-on experience with several key concepts. Navigating decompiled C code, identifying function relationships, and reconstructing high-level logic from assembly became second nature. The Ghidra MCP integration with Claude Code accelerated this process significantly, allowing me to query specific functions and get analysis on demand.

Understanding how USB devices present themselves, how endpoints work, and how bulk transfers enable high-throughput data streams clarified concepts I'd only read about before. The distinction between control transfers (for commands) and bulk transfers (for data) became clear through practice. Seeing how commercial systems layer protocols (USB for transport, TTP for message framing, PRP for operations, and encryption for security) provides a model for robust communication architecture that I can apply to my own projects.

Appreciating how encryption, when properly integrated into a protocol, can effectively prevent unauthorized access even when the entire protocol structure is understood was perhaps the most important lesson. This project also taught me to recognize the line between educational reverse engineering (understanding how systems work) and unauthorized access (circumventing protections for production use).

The Tobii Eye Tracker 5's architecture is sophisticated and well-designed. The separation of concerns between the Platform Runtime service (handling PRP and licensing) and the low-level USB communication (TTP) allows Tobii to maintain control over commercial devices while still supporting research devices through open SDKs. The licensing model, while restrictive, is understandable from a business perspective: eye tracking data is valuable, and Tobii invests heavily in the algorithms that produce it. From a technical standpoint, the protocol is elegant. The use of BSON for structured data, transaction IDs for asynchronous messaging, and stream subscriptions for real-time data all represent solid engineering choices. The encryption layer, while frustrating for my purposes, demonstrates a commitment to protecting their intellectual property.

Reverse engineering the Tobii Eye Tracker 5 was a journey through multiple layers of abstraction, from raw USB packets to high-level API calls. While I successfully mapped the protocol structure and identified communication patterns, the encrypted payload layer proved to be an insurmountable barrier without Tobii's license keys. This experience reinforced an important lesson: modern commercial systems employ multi-layered security that goes beyond simple obfuscation. Understanding a protocol's structure is not the same as being able to use it without authorization. For anyone interested in eye tracking, the takeaway is clear: if you need access to commercial Tobii devices, work within their SDK and licensing model. The restrictions exist for valid reasons, and attempting to circumvent them is both technically challenging and ethically questionable. For research and educational purposes, Tobii offers research-grade devices with open SDKs that provide full access without these restrictions. The code and documentation from this project remain as a testament to what's possible with reverse engineering tools and persistence, but also as a reminder of the limits we should respect. The protocol is documented, the architecture is understood, but the data remains protected.
