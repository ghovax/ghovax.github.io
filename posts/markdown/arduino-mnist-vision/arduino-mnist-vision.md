For my Electronics for Applied Physics exam, I completed a master’s project using an Arduino Nano 33 BLE Sense with its camera module to capture images that were fed into a Convolutional Neural Network (CNN) trained on the MNIST dataset. The work involved interfacing with the camera module, handling serial communication protocols, preprocessing the images, and running model inference on my machine. The main technical challenge was integrating these components reliably, since any point could fail and debugging proved difficult; by implementing custom debugging and logging, I succeeded in the implementation. The code is available at this [link](https://github.com/ghovax/mnist_vision).

My implementation relied on the Arduino serial module to capture pixel grayscale images by sending capture commands over the serial port, triggering the camera to capture a frame into a buffer and stream the raw frame data back over serial. To interface with the Arduino and simplify the process, I implemented a Flask-based Python server that manages the connection, abstracts low-level operations into Python arrays, and prepares the data for processing. Processing begins by thresholding the image to create a transparency mask—lighter pixels become transparent while darker pixels remain—then resizing the image to $28 \times 28$ to match the CNN model trained earlier. In addition to matching the model's input size, pixel values are normalized to the $[0, 1]$ range and colors inverted to match the white/black convention of the dataset. The user interacts via a Next.js web interface rather than directly with the Flask API; the interface provides real-time visualization and interactivity, allowing connection, disconnection, capture, and display of the model’s prediction probabilities across all 10 digits as a bar chart, giving immediate feedback on what the model sees and how confident it is.

Rather than using the Arduino IDE, I integrated the Arduino CLI into the workflow. The command detects if the sketch has been modified; if so, the server automatically recompiles the code and flashes the updated firmware before attempting to capture images, preventing debugging issues and ensuring the system is always in the expected valid state. The hex file, together with the bootloader, is uploaded to the Arduino automatically. After flashing, the serial connection must be re-established because the Arduino resets during the upload; this is handled automatically by first closing any existing connection before flashing and then waiting for the Arduino to enumerate on the USB bus again.

Unfortunately I have no pictures of the device, as it needed to be returned to the professor, but here's what it looked like:

![](19352_18_kwadrat.webp)

### Training the CNN Model

The digital recognition model is a standard CNN trained on the MNIST dataset. 

* **Input:** $(28, 28, 1)$

For feature extraction it comprises two convolutional blocks...

* **Conv2D:** $32$ filters, $3 \times 3$ kernel, ReLU$\rightarrow (26, 26, 32)$
* **MaxPooling2D:** $2 \times 2$ pool$\rightarrow (13, 13, 32)$
* **Conv2D:** $64$ filters, $3 \times 3$ kernel, ReLU$\rightarrow (11, 11, 64)$
* **MaxPooling2D:** $2 \times 2$ pool$\rightarrow (5, 5, 64)$
* **Flatten:** Converts to $1D$$\rightarrow (1600)$
    
...followed by a classifier of fully connected layers with dropout for regularization to prevent overfitting. The data are augmented with an image generator that randomly rotates images up to 30 degrees and shifts them horizontally and vertically by up to $\pm 20\%$, which improves robustness when the digit is misaligned during camera acquisition. The model is saved as a Keras file that the Flask server loads for inference at runtime.

* **Dense:** $128$ units, ReLU, $\ell_2(0.01)$ regularization
* **BatchNormalization**
* **Dropout:** Rate $0.2$
* **Dense:** $32$ units, ReLU, $\ell_2(0.01)$ regularization
* **BatchNormalization**
* **Dropout:** Rate $0.2$
* **Dense (Output):** $10$ units, softmax activation