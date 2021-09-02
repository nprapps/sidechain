import { encodeLegacy, decode } from "./encoding.js";

export default class SidechainGuest {
  constructor(options = {}) {
    var here = new URL(window.location);
    this.id = options.id || here.searchParams.get("childId");
    this.options = options;

    this.lastHeight = 0;
    this.listeners = {};

    this.sendHeight = this.sendHeight.bind(this);
    this.onMessage = this.onMessage.bind(this);

    window.addEventListener("resize", this.sendHeight);
    window.addEventListener("message", this.onMessage);

    if (!options.disablePolling) {
      this.interval = setInterval(() => this.sendHeight(), options.polling || 300);
    }

    this.sendHeight();
  }

  unregister() {
    window.removeEventListener("resize", this.sendHeight);
    window.removeEventListener("message", this.onMessage);
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  sendMessage(message) {
    if (typeof message == "object" && !(message instanceof Array)) {
      if (this.options.sentinel && !message.sentinel) {
        message.sentinel = this.options.sentinel;
      }
    }
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

  off(event, callback) {
    if (!callback) {
      delete this.listeners[event];
    } else {
      this.listeners[event] = this.listeners[event].filter(c => c != callback);
    }
  }

  onMessage(e) {
    var decoded = typeof e.data == "string" ? decode(e.data) : e.data;
    if (decoded.sentinel == "pym" && decoded.type in this.listeners) {
      this.listeners[decoded.type].forEach(cb => cb(decoded.value));
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
