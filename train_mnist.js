import { readFileSync } from 'fs';
import * as tf from '@tensorflow/tfjs-node';
import model from './model.js';

class MnistDataloader {
  constructor(
    trainingImagesFilepath,
    trainingLabelsFilepath,
    testImagesFilepath,
    testLabelsFilepath
  ) {
    this.trainingImagesFilepath = trainingImagesFilepath;
    this.trainingLabelsFilepath = trainingLabelsFilepath;
    this.testImagesFilepath = testImagesFilepath;
    this.testLabelsFilepath = testLabelsFilepath;
  }

  readInt(buffer, offset) {
    return buffer.readInt32BE(offset);
  }

  readImagesLabels(imagesFilepath, labelsFilepath) {
    const labelsBuffer = readFileSync(labelsFilepath);
    const magicLabels = this.readInt(labelsBuffer, 0);
    if (magicLabels !== 2049) {
      throw new Error(
        `Magic number mismatch, expected 2049, got ${magicLabels}`
      );
    }
    const labels = Array.from(labelsBuffer.slice(8));

    const imagesBuffer = readFileSync(imagesFilepath);
    const magicImages = this.readInt(imagesBuffer, 0);
    if (magicImages !== 2051) {
      throw new Error(
        `Magic number mismatch, expected 2051, got ${magicImages}`
      );
    }
    const size = this.readInt(imagesBuffer, 4);
    const rows = this.readInt(imagesBuffer, 8);
    const cols = this.readInt(imagesBuffer, 12);

    const images = [];
    let imageOffset = 16;
    for (let i = 0; i < size; i++) {
      const img = [];
      for (let row = 0; row < rows; row++) {
        const imgRow = Array.from(
          imagesBuffer.subarray(imageOffset, imageOffset + cols)
        );
        img.push(imgRow);
        imageOffset += cols;
      }
      images.push(img);
    }

    return [images, labels];
  }

  load_data() {
    const [x_train, y_train] = this.readImagesLabels(
      this.trainingImagesFilepath,
      this.trainingLabelsFilepath
    );
    const [x_test, y_test] = this.readImagesLabels(
      this.testImagesFilepath,
      this.testLabelsFilepath
    );
    return [
      [x_train, y_train],
      [x_test, y_test],
    ];
  }
}

const inputPath = 'data/';
const trainingImagesFilepath = `${inputPath}train-images.idx3-ubyte`;
const trainingLabelsFilepath = `${inputPath}train-labels.idx1-ubyte`;
const testImagesFilepath = `${inputPath}t10k-images.idx3-ubyte`;
const testLabelsFilepath = `${inputPath}t10k-labels.idx1-ubyte`;

// Usage example
const dataLoader = new MnistDataloader(
  trainingImagesFilepath,
  trainingLabelsFilepath,
  testImagesFilepath,
  testLabelsFilepath
);
const [[x_train, y_train], [x_test, y_test]] = dataLoader.load_data();

// Convert data to Tensors
const xTrainTensor = tf.tensor(x_train, [60000, 28, 28, 1]).div(255.0);
const xTestTensor = tf.tensor(x_test, [10000, 28, 28, 1]).div(255.0);

const yTrainTensor = tf.oneHot(y_train, 10);
const yTestTensor = tf.oneHot(y_test, 10);

// Define the model
model.compile({
  optimizer: 'adam',
  loss: 'categoricalCrossentropy',
});

// Define training parameters
const BATCH_SIZE = 32;
const EPOCHS = 20;

// Train the model
model.fit(xTrainTensor, yTrainTensor, {
  epochs: EPOCHS,
  batchSize: BATCH_SIZE,
  validationData: [xTestTensor, yTestTensor],
  callbacks: {
    onEpochEnd: async (epoch, logs) => {
      console.log(
        `Epoch ${epoch + 1}/${EPOCHS}, Train Loss: ${logs.loss.toFixed(
          4
        )}, Test Loss: ${logs.val_loss.toFixed(4)}`
      );

      const savePath = `model_checkpoints/epoch_${
        epoch + 1
      }_loss_${logs.loss.toFixed(3)}_val_loss_${logs.val_loss.toFixed(3)}`;
      await model.save(`file://${savePath}`);
    },
  },
});

/*
 * Now test a loaded model
 */

// // Define the path where your model is saved
// const savedModelPath =
//   'file://model_checkpoints/mnist_epoch_10_train_loss_0.0193_test_loss_0.0351/model.json';

// // Load the model
// const loadedModel = await tf.loadLayersModel(savedModelPath);

// for (let i = 0; i < 10; i++) {
//   // Get the i-th instance from xTestTensor
//   const instance = xTestTensor.slice([i, 0, 0, 0], [1, 28, 28, 1]);

//   // Predict the i-th instance
//   const prediction = loadedModel.predict(instance);

//   // Get the predicted class
//   const predictedClass = tf.argMax(prediction, 1);

//   // Get the actual class label for the i-th instance
//   const actualClassTensor = yTestTensor.slice([i, 0], [1, 10]);
//   const actualClassLabel = tf.argMax(actualClassTensor, 1);

//   console.log(`Instance ${i + 1}`);
//   console.log(`Predicted class: ${predictedClass.dataSync()[0]}`);
//   console.log(`Actual class: ${actualClassLabel.dataSync()[0]}`);
// }
