const path = require('path');

module.exports = {
  entry: './src/main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    },
    open: true
  },
  module: {
    rules: [
      {
        test: /\.svelte$/i,
        use: 'svelte-loader',
        exclude: /node_modules/
      }
    ]
  }
};