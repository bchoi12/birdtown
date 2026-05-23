const path = require("path");
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  entry: './ts/index.ts',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'web')
  },
  resolve: {
    extensions: [".ts", ".js"],
    // This plugin reads your baseUrl automatically
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })] 
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  },
  mode: "development",
  devtool: "source-map",
  cache: {
    type: 'filesystem'
  },
};