const NodemonPlugin = require('nodemon-webpack-plugin');

module.exports = {
  entry: './index.ts',
  output: {
    path: __dirname + '/dist',
    filename: 'index.js',
  },

  devtool: 'source-map',
  target: 'node',

  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js'],
  },

  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader' },
      { test: /\.js$/, loader: 'source-map-loader' },
    ],
  },

  plugins: [
    new NodemonPlugin(),
  ],
};
