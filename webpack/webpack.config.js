const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { glob } = require("glob");

module.exports = {
  mode: "production",
  // entry: {
  // background: path.resolve(__dirname, "..", "src", "background.ts"),
  // },
  entry: glob
    .sync("../src/**/*.ts", { cwd: __dirname })
    .reduce(function (obj, element) {
      const dir = element
        .replace("..\\src\\", "")
        .replace("../src/", "")
        .replace(".ts", "");

      // 번들링에서 제외할 파일
      const filter = [
        "deprecated\\deprecated",
        "module\\filter",
        "module\\func",
        "types\\type",
      ];

      if (!filter.includes(dir)) {
        obj[dir] = element;
        // console.log("target :", dir);
      }

      return obj;
    }, {}),
  output: {
    path: path.join(__dirname, "../dist"),
    filename: "[name].js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: ".", to: ".", context: "public" }],
    }),
  ],
};
