const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

// Define paths for production and development
const outputPath = isDevelopment
  ? path.join(__dirname, 'dev')
  : path.join(__dirname, 'prod');

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: {
    background: path.join(__dirname, 'src/background.ts'),
    content: path.join(__dirname, 'src/content.ts'),
    popup: path.join(__dirname, 'src/popup.tsx'),
    options: path.join(__dirname, 'src/options.tsx')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@emotion/react': path.resolve(__dirname, 'node_modules/@emotion/react'),
    },
  },
  output: {
    filename: '[name].js',
    path: outputPath,
    clean: true, // Clean the output directory before emit
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new HtmlWebpackPlugin({
      template: 'src/options.html',
      filename: 'options.html',
      chunks: ['options']
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: outputPath }, // Adjust if manifest.json is not in the root
        { from: 'icons', to: path.join(outputPath, 'icons') } // This will copy the entire 'icons' folder
      ]
    }),
    new CleanWebpackPlugin(), // Clean the build directory for every build
  ],
  devtool: isDevelopment ? 'cheap-module-source-map' : false,
};
