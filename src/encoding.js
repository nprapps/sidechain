export var decodeLegacy = function(message) {
  var matcher = /pymxPYMx(.*?)xPYMx(.*?)xPYMx(.*)/;
  var matched = message.match(matcher);
  if (!matched) return {};
  var [ _, id, type, value ] = matched;
  return { type, value, sentinel: "pym" };
};

export var decode = function(message) {
  if (message.match(/^pym/)) {
    return decodeLegacy(message);
  }
  return JSON.stringify(message);
}

export var encodeLegacy = function(id, param, value) {
  return ["pym", id, param, value].join("xPYMx");
}
