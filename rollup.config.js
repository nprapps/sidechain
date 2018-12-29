module.exports = [{
  input: "index.js",
  output: {
    file: "dist/sidechain.js",
    format: "umd",
    name: "Sidechain",
    compact: true
  }
}, {
  input: "index.polyfilled.js",
  output: {
    file: "dist/sidechain.polyfilled.js",
    format: "umd",
    name: "Sidechain",
    compact: true
  },
  plugins: [
    require("rollup-plugin-node-resolve")()
  ]
}];
