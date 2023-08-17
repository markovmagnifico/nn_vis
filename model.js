import * as tf from '@tensorflow/tfjs-node';

const model = tf.sequential();

// First convolutional layer with 8 filters of size 5x5 and input shape of 28x28 (assuming 28x28 image)
model.add(
  tf.layers.conv2d({
    inputShape: [28, 28, 1],
    filters: 8,
    kernelSize: 5,
    activation: 'relu',
  })
);

// First max-pooling layer with 2x2 window
model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));

// Second convolutional layer with 16 filters of size 3x3
model.add(
  tf.layers.conv2d({
    filters: 16,
    kernelSize: 3,
    activation: 'relu',
  })
);

// Second max-pooling layer with 2x2 window
model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));

// Flatten the output before passing to fully connected layers
model.add(tf.layers.flatten());

// Fully connected layer with 32 units
model.add(tf.layers.dense({ units: 32, activation: 'relu' }));

// Fully connected layer with 10 units (output layer)
model.add(tf.layers.dense({ units: 10, activation: 'softmax' }));

export default model;
