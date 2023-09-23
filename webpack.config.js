import url from "url";

const currDir = url.fileURLToPath(new URL(".", import.meta.url));

export default {
  // debug: true,
  devtool: "eval-source-map",
  mode: "development",

  entry: "./src/main.ts",

  output: {
    path: currDir,
    publicPath: "public",
    filename: "dist/bundle.js",
  },

  plugins: [
    // new webpack.optimize.OccurenceOrderPlugin(),
    // new webpack.NoErrorsPlugin(),
  ],

  resolve: {
    extensions: [".ts", ".js"],
  },

  module: {
    rules: [{ test: /\.ts$/, use: "ts-loader", exclude: /node_modules/ }],
  },
};
