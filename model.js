const convModel = tf.sequential();

// First convolutional layer with 8 filters of size 5x5 and input shape of 28x28 (assuming 28x28 image)
convModel.add(
  tf.layers.conv2d({
    inputShape: [28, 28, 1],
    filters: 8,
    kernelSize: 5,
    activation: 'relu',
  })
);

// First max-pooling layer with 2x2 window
convModel.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));

// Second convolutional layer with 16 filters of size 3x3
convModel.add(
  tf.layers.conv2d({
    filters: 16,
    kernelSize: 3,
    activation: 'relu',
  })
);

// Second max-pooling layer with 2x2 window
convModel.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));

// Flatten the output before passing to fully connected layers
convModel.add(tf.layers.flatten());

// Fully connected layer with 32 units
convModel.add(tf.layers.dense({ units: 32, activation: 'relu' }));

// Fully connected layer with 10 units (output layer)
convModel.add(tf.layers.dense({ units: 10, activation: 'softmax' }));

export default convModel;
