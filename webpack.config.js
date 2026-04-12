import BrowserSyncPlugin from "browser-sync-webpack-plugin";
import url, { URL } from "node:url";
import TerserPlugin from "terser-webpack-plugin";

const path = url.fileURLToPath(new URL(".", import.meta.url));

const mode = process.env.NODE_ENV ?? "development";

export default {
  mode,

  entry: "./src/init.ts",

  resolve: { extensions: [".ts", ".js"] },

  output: { path, publicPath: "public", filename: "public/bundle.js" },

  ...(mode === "development"
    ? { devtool: "eval-source-map" }
    : {
        optimization: {
          minimize: true,
          minimizer: [
            new TerserPlugin({
              include: "public/bundle.js",
              terserOptions: { mangle: true },
            }),
          ],
        },
      }),

  module: {
    rules: [
      {
        test: /\.(ts|js)/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-typescript"],
          },
        },
      },
    ],
  },

  plugins: [
    new BrowserSyncPlugin({
      host: "localhost",
      port: 3000,
      server: { baseDir: "public" },
      files: ["**/*.ts"],
    }),
  ],
};
