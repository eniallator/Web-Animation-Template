import webpack from "webpack";
import path from "path";

export default {
  debug: true,
  devtool: "#eval-source-map",

  entry: ["./src/main.ts"],

  output: {
    path: path.join(__dirname, "app"),
    publicPath: "/",
    filename: "dist/bundle.js",
  },

  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.NoErrorsPlugin(),
  ],

  resolve: {
    extensions: ["", ".ts", ".js"],
  },

  module: {
    loaders: [{ test: /\.ts$/, loader: "ts-loader" }],
  },
};
