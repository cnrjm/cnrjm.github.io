const webpack = require('webpack');
const dotenv = require('dotenv');

module.exports = {
  entry: './script.js',
  output: {
    filename: 'bundle.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(dotenv.config().parsed)
    })
  ]
};