---
title: "Real-Time Digit Recognition on Arduino with TensorFlow"
date: "2025-05-06"
excerpt: "Building a complete handwritten digit recognition system using Arduino Nano 33 BLE Sense camera and a trained CNN model, bridging embedded vision with machine learning inference."
category: "Computer Science"
tags:
  [
    "Machine Learning",
    "Arduino",
    "TensorFlow",
    "Embedded Systems",
    "Computer Vision",
  ]
author: "Giovanni Gravili"
---

In this post, I'll walk you through my implementation of a real-time handwritten digit recognition system using the Arduino Nano 33 BLE Sense and a trained convolutional neural network. This project taught me that bridging the gap between embedded systems and machine learning requires careful attention to the entire pipeline: camera interfacing, serial communication protocols, image preprocessing, and model inference. The technical challenge lies not in any single component but in making them all work together reliably. I learned that embedded vision is fundamentally about constraints (limited memory, processing power, and bandwidth), which forces you to make deliberate choices about image resolution, data formats, and communication protocols. The combination of Arduino's low-level hardware control and Python's rich ML ecosystem proved ideal, letting me focus on the system architecture rather than fighting language limitations.

The MNIST dataset of handwritten digits is the "Hello World" of machine learning. While most implementations run on desktop computers or cloud servers, I wanted to build something that captures images in the real world and processes them in real-time. The Arduino Nano 33 BLE Sense with its built-in camera support provides just enough capability to make this interesting: capturing grayscale images at reasonable resolution while maintaining a clean USB serial interface for communication.

The challenge was to build a complete end-to-end pipeline: Arduino firmware to control the OV7670 camera module and stream raw image data over serial, Flask backend to manage Arduino communication, receive image data, and run TensorFlow inference, and a Next.js web interface to visualize predictions and probability distributions in real-time. Each component presented its own technical challenges, from managing serial port timing to preprocessing images for the CNN.

# System Architecture

The system operates as a three-tier pipeline with clear separation of concerns. At the lowest level, the Arduino Nano 33 BLE Sense runs firmware that controls the OV7670 camera module. This camera captures 176x144 pixel grayscale images (QCIF resolution), which strikes a balance between detail and data transfer speed. The firmware is remarkably simple, implementing a command-response protocol: wait for a capture command character 'c' over serial, trigger the camera to capture a frame into a buffer, and stream the raw frame data (25,344 bytes) back over serial at 115200 baud.

The middle tier is a Flask server running on the host computer. This is where the complexity lives. The server manages the serial connection to the Arduino, handling automatic port detection, connection recovery, and thread-safe access. When an image is requested, the server sends the capture command, receives the raw byte stream, reconstructs it into a 2D NumPy array, and passes it through the image processing pipeline. The processing involves thresholding to create transparency masks (lighter pixels become transparent, darker pixels remain), resizing from 176x144 to 28x28 for the MNIST model, normalizing pixel values to the 0-1 range, and inverting colors to match MNIST's white-on-black convention.

The final tier is a Next.js web interface that provides real-time visualization. Built with React and TypeScript, it communicates with the Flask backend via REST endpoints. The interface displays the raw captured image, shows the predicted digit with confidence score, and visualizes the full probability distribution across all 10 digits as a bar chart. This gives immediate feedback on what the model sees and how certain it is about its prediction.

# Camera Control and Serial Communication

The Arduino firmware demonstrates how little code is needed when you have the right hardware abstraction. The Arduino_OV767X library handles all the camera initialization and configuration, exposing a simple API for capturing frames. The entire firmware is fewer than 50 lines:

```cpp
#include <Arduino_OV767X.h>

#define IMAGE_WIDTH 176
#define IMAGE_HEIGHT 144
#define BYTES_PER_PIXEL 1
#define BYTES_PER_FRAME (IMAGE_WIDTH * IMAGE_HEIGHT * BYTES_PER_PIXEL)

uint8_t frame_buffer[BYTES_PER_FRAME];

void setup() {
  Serial.begin(115200);
  while (!Serial) { ; }

  if (!Camera.begin(QCIF, GRAYSCALE, 1)) {
    while (1);  // Halt on camera initialization failure
  }
}

void loop() {
  if (Serial.available() > 0) {
    char command = Serial.read();

    if (command == 'c') {
      Camera.readFrame(frame_buffer);
      Serial.write(frame_buffer, BYTES_PER_FRAME);
      Serial.flush();
    }
  }
}
```

The protocol is synchronous and simple. The host initiates all transfers by sending 'c', the Arduino responds with exactly 25,344 bytes, and the host waits until all bytes are received. This simplicity is deliberate: no framing overhead, no checksums, no acknowledgments. At 115200 baud with 8N1 encoding, transferring 25,344 bytes takes approximately 2.2 seconds, which is acceptable for this application.

On the Python side, receiving the image requires careful buffer management. The serial port delivers data in chunks of unpredictable size, so I implemented a receive loop with timeout protection:

```python
def receive_image_data(arduino_connection, width=176, height=144, timeout=5):
    expected_bytes = width * height
    image_buffer = bytearray(expected_bytes)
    received_bytes = 0
    start_time = time.time()

    while received_bytes < expected_bytes:
        if time.time() - start_time > timeout:
            logging.error("Timeout waiting for image data")
            return None

        data_chunk = arduino_connection.read(
            min(4096, expected_bytes - received_bytes)
        )
        if not data_chunk:
            continue

        chunk_size = len(data_chunk)
        image_buffer[received_bytes:received_bytes + chunk_size] = data_chunk
        received_bytes += chunk_size

    image_array = np.frombuffer(image_buffer, dtype=np.uint8)
    return image_array.reshape((height, width))
```

The function reads in chunks of up to 4096 bytes, accumulating them into a pre-allocated buffer. Once all bytes are received, it reshapes the flat byte array into a 2D image matrix. The timeout prevents the system from hanging indefinitely if the Arduino fails to respond.

# Building and Deploying Arduino Firmware

One of the project's more interesting technical aspects is the automated build system. Rather than requiring manual compilation and flashing through the Arduino IDE, I integrated arduino-cli into the workflow. The Flask server detects whether the Arduino sketch has changed since the last deployment by maintaining a SHA-256 hash of the source file. If the sketch is modified (or if forced by command-line flag), the server automatically compiles and flashes the updated firmware before attempting to capture images.

The compilation process uses arduino-cli with the Arduino Mbed OS Nano board core:

```python
def compile_sketch():
    sketch_path = "camera/camera.ino"
    build_path = os.path.join(os.getcwd(), "build")
    os.makedirs(build_path, exist_ok=True)

    cmd = [
        "arduino-cli",
        "compile",
        "--fqbn",
        "arduino:mbed_nano:nano33ble",
        "--build-path",
        build_path,
        "camera",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        logging.error(f"Compilation failed: {result.stderr.strip()}")
        return False
    return True
```

This generates a .hex file with bootloader that can be uploaded to the Arduino. The upload process is similarly automated:

```python
def flash_arduino(port, hex_file, timeout=30):
    if not os.path.exists(hex_file):
        logging.error("Cannot find hex file")
        return False

    cmd = [
        "arduino-cli",
        "upload",
        "-p",
        port,
        "--fqbn",
        "arduino:mbed_nano:nano33ble",
        "--input-dir",
        os.path.dirname(hex_file),
        "camera",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    return result.returncode == 0
```

After flashing, the serial connection must be re-established because the Arduino resets during the upload process. The server handles this by closing any existing connection before flashing and then waiting for the Arduino to enumerate on the USB bus again.

# Training the CNN Model

The digit recognition model is a standard convolutional neural network trained on the MNIST dataset. The architecture consists of two convolutional blocks followed by fully connected layers with dropout for regularization:

```python
model = Sequential([
    Conv2D(32, (3, 3), activation="relu", input_shape=(28, 28, 1)),
    MaxPooling2D((2, 2)),
    Conv2D(64, (3, 3), activation="relu"),
    MaxPooling2D((2, 2)),
    Flatten(input_shape=(28, 28)),
    Dense(128, activation="relu", kernel_regularizer=l2(0.01)),
    BatchNormalization(),
    Dropout(0.2),
    Dense(32, activation="relu", kernel_regularizer=l2(0.01)),
    BatchNormalization(),
    Dropout(0.2),
    Dense(10, activation="softmax"),
])
```

The first convolutional layer applies 32 filters of size 3x3, learning low-level features like edges and curves. Max pooling reduces spatial dimensions by half, from 26x26 to 13x13. The second convolutional layer applies 64 filters, learning higher-level patterns by combining features from the first layer. Another max pooling layer reduces to 5x5. The fully connected layers combine spatial features into class predictions, with L2 regularization to prevent overfitting. Batch normalization stabilizes training by normalizing layer inputs, and dropout randomly disables 20% of neurons during training to improve generalization.

Training uses data augmentation to artificially expand the dataset:

```python
datagen = ImageDataGenerator(
    rotation_range=30,
    width_shift_range=0.2,
    height_shift_range=0.2
)
datagen.fit(x_train)

history = model.fit(
    datagen.flow(x_train, y_train, batch_size=32),
    validation_data=(x_test, y_test),
    epochs=15,
    callbacks=[LearningRateScheduler(lr_schedule)]
)
```

The augmentation randomly rotates digits up to 30 degrees and shifts them up to 20% horizontally or vertically. This helps the model generalize to variations in how digits are written or positioned in the camera frame. After 15 epochs, the model achieves approximately 99% accuracy on the test set. The trained model is saved as a Keras file (mnist_cnn_model.keras) that the Flask server loads for inference.

# Image Processing Pipeline

The raw camera output is a 176x144 grayscale image where darker pixels represent ink or markings and lighter pixels represent background. To prepare this for the MNIST model, which expects 28x28 images with white digits on black backgrounds, several transformations are necessary.

First, I apply thresholding to create a transparency mask. This removes noise and focuses on the actual writing:

```python
def threshold_image(input_image, threshold: int = 100):
    input_array = np.array(input_image)
    height, width = input_array.shape
    output_array = np.zeros((height, width, 4), dtype=np.uint8)
    output_array[..., 0:3] = 0  # RGB channels set to black
    output_array[..., 3] = np.where(input_array < threshold, 255, 0)  # Alpha channel

    processed_image = Image.fromarray(output_array, mode="RGBA")
    return processed_image
```

Pixels darker than the threshold (100 out of 255) become opaque black, while lighter pixels become fully transparent. This RGBA image is then composited onto a white background before being converted to grayscale for the model.

The inference function handles all the preprocessing:

```python
def evaluate_digit(input_image):
    model = tf.keras.models.load_model("mnist_cnn_model.keras")

    # Composite transparent image onto white background
    processed_image = input_image.convert("RGBA")
    background = Image.new("RGBA", processed_image.size, (255, 255, 255, 255))
    background.paste(processed_image, mask=processed_image)
    processed_image = background.convert("L")

    # Resize to 28x28
    processed_image = processed_image.resize((28, 28), Image.Resampling.BICUBIC)

    # Normalize and invert colors
    image_array = np.array(processed_image, dtype=np.float32)
    image_array = 255 - image_array  # Invert: white digit on black background
    image_array = image_array / 255.0

    # Reshape for model input
    image_array = image_array.reshape((1, 28, 28, 1))

    # Get predictions
    probabilities = model.predict(image_array, verbose=0)
    predicted_digit = int(np.argmax(probabilities[0]))
    confidence = float(probabilities[0][predicted_digit])

    return predicted_digit, confidence, probabilities[0].tolist()
```

The model returns a 10-element probability array, one for each digit. The predicted digit is the index with the highest probability. The confidence is simply that maximum probability value. Returning the full probability distribution allows the web interface to visualize how certain the model is about each possible digit.

# Web Interface and Real-Time Visualization

The Next.js interface provides a clean, responsive UI for interacting with the system. Built with TypeScript and React, it manages three main states: connection status (disconnected, connecting, or connected), capture status (idle or loading), and prediction results (image, digit, confidence, and probabilities).

The connection flow begins when the user clicks "Connect Device". The frontend sends a POST request to the Flask server's /connect endpoint:

```typescript
const connectArduino = async () => {
  setConnectionStatus("connecting");
  setError(null);

  try {
    const response = await fetch("/api/connect", {
      method: "POST",
      headers: { Accept: "application/json" },
    });

    const data = await response.json();

    if (data.success) {
      setConnectionStatus("connected");
      toast({
        title: "Connected",
        description: `Successfully connected to port ${data.portName}`,
      });
    } else {
      throw new Error(data.errorMessage || "Failed to connect");
    }
  } catch (error) {
    setConnectionStatus("disconnected");
    setError(
      `Connection error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
```

The server responds with the detected port name if successful. Once connected, the "Capture Image" button becomes enabled. Clicking it triggers the full capture and inference pipeline:

```typescript
const captureImage = async () => {
  if (connectionStatus !== "connected") return;

  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch("/api/capture", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success && data.originalImage) {
      setImageUrl(data.originalImage);
      setProbabilities(data.probabilities);
      setPredictedDigit(data.predictedDigit);
      setConfidence(data.confidence);

      toast({
        title: "Success",
        description: "Image captured and processed successfully",
      });
    }
  } catch (error) {
    setError(
      `Capture error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    setIsLoading(false);
  }
};
```

The server returns a JSON response containing the base64-encoded captured image, predicted digit (0-9), confidence score (0-1), and the full probability distribution. The interface displays the raw image (using CSS image-rendering: pixelated to preserve the blocky aesthetic) and renders the probability distribution as a vertical bar chart with 10 columns.

Each bar's height corresponds to the probability of that digit. The bars are implemented as flexbox containers with a colored div positioned at the bottom:

```jsx
{
  probabilities.map((prob, index) => (
    <div key={index} className="relative flex flex-col h-full">
      <div className="flex-1 relative bg-secondary">
        <div
          className={prob > 0.05 ? "bg-foreground" : "bg-transparent"}
          style={{ height: `${prob * 100}%` }}
        />
      </div>
      <span className="text-center text-xs">{index}</span>
    </div>
  ));
}
```

This gives an immediate visual indication of the model's certainty. If the model predicts "7" with 95% confidence, the bar for 7 will be nearly full while the others remain near empty. If the model is uncertain (perhaps the digit is ambiguous or poorly formed), multiple bars will show significant heights.

# System Integration and Error Handling

A critical aspect of the implementation is robust error handling throughout the pipeline. Embedded systems are inherently unreliable: serial connections drop, USB cables get jostled, Arduinos reset unexpectedly. The Flask server must handle these failures gracefully.

Serial connection management uses thread-safe locking to prevent race conditions when multiple requests arrive simultaneously:

```python
serial_connection = None
serial_lock = Lock()

def get_serial_connection():
    global serial_connection

    with serial_lock:
        if serial_connection is not None and serial_connection.is_open:
            return serial_connection

        port = find_arduino_port()
        if not port:
            return None

        try:
            connection = serial.Serial(
                port=port,
                baudrate=115200,
                timeout=2,
                write_timeout=1,
            )

            if connection.is_open:
                connection.reset_input_buffer()
                connection.reset_output_buffer()
                time.sleep(0.5)  # Allow Arduino to settle after reset
                serial_connection = connection
                return connection
        except serial.SerialException as e:
            logging.error(f"Connection failed: {str(e)}")
            return None

    return None
```

If a connection fails during capture, the server attempts to recover by closing and reopening the connection. If that fails, it returns an error to the frontend, which displays it to the user. The frontend provides clear visual feedback at each stage: connection status is shown with a colored indicator (green for connected, red for disconnected), capture operations display a loading spinner, and errors are shown in alert boxes with specific messages.

The cleanup function registered with atexit ensures the serial port is properly released when the server shuts down:

```python
def cleanup():
    global serial_connection
    with serial_lock:
        if serial_connection is not None:
            try:
                serial_connection.close()
                logging.info("Closed serial connection")
            except:
                pass
            serial_connection = None

import atexit
atexit.register(cleanup)
```

This prevents the common problem of orphaned serial connections that prevent reconnection until the system is rebooted.

# Performance and Limitations

The system achieves reasonable real-time performance. A complete capture-process-predict cycle takes approximately 2-3 seconds: 2.2 seconds for serial transfer of the image, 0.1-0.3 seconds for image preprocessing, 0.2-0.5 seconds for CNN inference on CPU, and minimal overhead for Flask routing and JSON encoding. On a modern CPU, this is acceptable for interactive use.

The main bottleneck is the serial transfer. At 115200 baud, transferring 25,344 bytes is fundamentally limited by the USB serial bandwidth. Using a higher baud rate (921600 is supported by many Arduino boards) would reduce transfer time to under 0.3 seconds, but the Arduino Nano 33 BLE's USB stack becomes unreliable at those speeds in my testing. An alternative would be to reduce image resolution further, but 176x144 already pushes the lower limit of usable detail for handwritten digits.

Model inference is quite fast even on CPU because the 28x28 input is tiny by modern deep learning standards. The entire network has only about 100,000 parameters. On a GPU, inference would be under 10ms, but for a single-image pipeline, the overhead of GPU memory transfer exceeds the compute savings.

The accuracy in real-world conditions depends heavily on how the digit is presented to the camera. The MNIST dataset consists of centered, normalized digits with good contrast. Real camera images have variable lighting, perspective distortion, shadows, and positioning. The thresholding step helps by removing background, but if lighting is poor or the digit is too small in frame, accuracy suffers. In practice, with reasonable lighting and a black marker on white paper held at the right distance, the system achieves 85-90% accuracy on the first try.

# Lessons Learned

Building this system reinforced several important lessons about embedded ML systems. First, the entire pipeline matters. A highly accurate model is useless if the image preprocessing doesn't match the training distribution. I initially forgot to invert the colors (camera sees black ink as dark pixels, but MNIST has white digits on black), which caused the model to predict random garbage until I realized the mismatch.

Second, serial communication is more subtle than it appears. Early versions of the code didn't properly flush buffers or handle partial reads, leading to intermittent failures where the first few hundred bytes of the image were correct but the rest was garbage. Adding explicit buffer resets and handling chunked reads solved this.

Third, automated deployment is worth the effort. Being able to modify the Arduino code and have it automatically compile and flash on the next capture attempt made iteration much faster. Without this, I would have spent significant time manually compiling and uploading through the Arduino IDE.

Finally, visualization is crucial for debugging ML systems. The probability distribution view immediately revealed when the model was confused (multiple high-probability predictions) versus when preprocessing was wrong (uniform random probabilities). Without this feedback, diagnosing issues would have been much harder.

---

Implementing real-time digit recognition on Arduino demonstrates how accessible embedded machine learning has become. The Arduino Nano 33 BLE Sense provides just enough capability to capture images, while modern ML frameworks like TensorFlow handle the complex inference. Bridging these two worlds requires careful attention to data pipelines, communication protocols, and error handling, but the result is a satisfying end-to-end system that captures, processes, and classifies images in real-time. The project serves as a foundation for more complex embedded vision applications, from gesture recognition to quality inspection systems. Understanding how each layer works, from camera registers to convolutional filters, provides deep appreciation for the engineering that makes these systems possible.
