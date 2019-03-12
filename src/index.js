import { encodeLegacy, decode } from "./encoding.js";
import SidechainGuest from "./guest.js";

class Sidechain extends HTMLElement {
  constructor() {
    super();

    var iframe = this.iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.border = "none";
    iframe.setAttribute("seamless", "true");
    iframe.setAttribute("scrolling", "no");

    this.onMessage = this.onMessage.bind(this);
  }

  connectedCallback() {
    if (!this.iframe.parentElement) {
      this.style.display = "block";
      var root = this.attachShadow ? this.attachShadow({ mode: "open" }) : this;
      root.appendChild(this.iframe);
    }
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
    this.iframe.contentWindow.postMessage(message, "*");
  }

  sendLegacy(param, value) {
    var pymFormatted = encodeLegacy(this.id, param, value);
    this.iframe.contentWindow.postMessage(pymFormatted, "*");
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
      callback(e.data);
    }
  }

}

customElements.define("side-chain", Sidechain);

export default Sidechain;
