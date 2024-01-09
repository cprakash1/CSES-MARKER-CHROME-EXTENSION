const path = require("path");
const copyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    popup: "./src/popup.js",
    content: "./src/content.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  mode: "development",
  watch: true,
  plugins: [
    new copyWebpackPlugin({
      patterns: [{ from: "static" }],
    }),
  ],
};
