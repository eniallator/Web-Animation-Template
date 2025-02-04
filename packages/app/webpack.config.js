import BrowserSyncPlugin from "browser-sync-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import url, { URL } from "url";

const currDir = url.fileURLToPath(new URL(".", import.meta.url));

const mode = process.env.NODE_ENV ?? "development";

export default {
  devtool: mode === "development" ? "eval-source-map" : undefined,
  mode,

  entry: "./src/init.ts",

  optimization:
    mode !== "development"
      ? {
          minimize: true,
          minimizer: [
            new TerserPlugin({
              include: "public/bundle.js",
              terserOptions: { mangle: true },
            }),
          ],
        }
      : undefined,

  output: {
    path: currDir,
    publicPath: "public",
    filename: "public/bundle.js",
  },

  plugins: [
    new BrowserSyncPlugin({
      host: "localhost",
      port: 3000,
      server: {
        baseDir: "public",
        reload: ["*.ts", "*.js", "*.html", "*.css"],
      },
      reload: ["*.ts", "*.js", "*.html", "*.css"],
    }),
  ],

  resolve: {
    extensions: [".ts", ".js"],
  },

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
};
