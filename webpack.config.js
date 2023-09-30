import BrowserSyncPlugin from "browser-sync-webpack-plugin";
import url from "url";

const currDir = url.fileURLToPath(new URL(".", import.meta.url));

export default {
  devtool: "eval-source-map",
  mode: "development",

  entry: "./src/init.ts",

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
