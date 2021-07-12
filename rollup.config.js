module.exports = [{
  input: "src/index.js",
  output: {
    file: "dist/sidechain.js",
    format: "umd",
    name: "Sidechain",
    compact: true,
    exports: "named"
  }
}];
