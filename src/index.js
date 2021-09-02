import { encodeLegacy, decode } from "./encoding.js";
import SidechainGuest from "./guest.js";

var template = `
<style>
:host {
  display: block;
}

:host[hidden] {
  display: none;
}

iframe {
  width: 100%;
  border: none;
}
</style>
<iframe seamless="true" scrolling="no"></iframe>`;

export class Sidechain extends HTMLElement {
  constructor() {
    super();

    var root = this.attachShadow({ mode: "open" });
    root.innerHTML = template;
    this.iframe = root.querySelector("iframe");

    this.onMessage = this.onMessage.bind(this);
  }

  connectedCallback() {
    // prevent duplicate listeners
    window.removeEventListener("message", this.onMessage);
    window.addEventListener("message", this.onMessage);
  }

  disconnectedCallback() {
    window.removeEventListener("message", this.onMessage);
  }

  static get observedAttributes() {
    return ["src", "id"];
  }

  attributeChangedCallback(attribute, was, value) {
    switch (attribute) {
      case "src":
        this.iframe.src = value;
        break;

      case "id":
        this.iframe.id = value;
    }
  }

  onMessage(e) {
    // ignore other iframes
    if (e.source != this.iframe.contentWindow) return;
    var decoded = typeof e.data == "string" ? decode(e.data) : e.data;
    if (decoded.type == "embed-size" || decoded.type == "height") {
      this.iframe.height = decoded.value || decoded.height;
    }
  }

  sendMessage(message) {
    if (typeof message == "object" && !(message instanceof Array) && this.hasAttribute("sentinel")) {
      message.sentinel = message.sentinel || this.getAttribute("sentinel");
    }
    this.iframe.contentWindow.postMessage(message, "*");
  }

  sendLegacy(param, value) {
    var pymFormatted = encodeLegacy(this.id, param, value);
    this.sendMessage(pymFormatted);
  }

  static registerGuest(options) {
    return new SidechainGuest(options);
  }

  static matchMessage(pattern, callback) {
    return function(e) {
      var { data } = e;
      for (var k in pattern) {
        if (data[k] !== pattern[k]) return;
      }
      callback(e.data, e);
    }
  }

  get src() {
    return this.getAttribute("src");
  }

  set src(value) {
    return this.setAttribute("src", value);
  }

  get sentinel() {
    return this.getAttribute("sentinel");
  }

  set sentinel(value) {
    return this.setAttribute("sentinel", value);
  }

}

Sidechain.Guest = SidechainGuest;

try {
  window.customElements.define("side-chain", Sidechain);
} catch (err) {
  console.log("Sidechain couldn't be (re)defined");
}

export default Sidechain;
