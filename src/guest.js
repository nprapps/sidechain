import { encodeLegacy, decode } from "./encoding";

export default class SidechainGuest {
  constructor(options = {}) {
    var here = new URL(window.location);
    this.id = options.id || here.searchParams.get("childId");
    this.options = options;

    this.lastHeight = 0;
    this.listeners = {};

    window.addEventListener("resize", () => this.sendHeight());
    window.addEventListener("message", e => this.onMessage(e));

    if (!options.disablePolling) {
      setInterval(() => this.sendHeight(), options.polling || 300);
    }

    this.sendHeight();
  }

  sendMessage(message) {
    window.parent.postMessage(message, "*");
  }

  sendLegacy(param, value) {
    var pymFormatted = encodeLegacy(this.id, param, value);
    window.parent.postMessage(pymFormatted, "*");
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  onMessage(e) {
    var decoded = typeof e.data == "string" ? decode(e.data) : e.data;
    if (decoded.type in this.listeners) {
      this.listeners.forEach(cb => cb(decoded.value));
    }
  }

  sendHeight() {
    var height = document.documentElement.offsetHeight;
    if (this.lastHeight == height) return;
    this.lastHeight = height;
    var pymFormatted = encodeLegacy(this.id, "height", height);
    // for convenience, we just use the same format as AMP
    var ampFormatted = {
      sentinel: "amp",
      type: "embed-size",
      height
    };
    this.sendMessage(pymFormatted);
    this.sendMessage(ampFormatted);
  }
}
