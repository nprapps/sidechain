Sidechain
=========

Sidechain is a custom element for creating responsive iframes,
compatible with both [AMP
iframes](https://www.ampproject.org/docs/reference/components/amp-iframe)
and [Pym embeds](http://blog.apps.npr.org/pym.js/). It provides a simple
core built on modern JavaScript, and can serve as a foundation for more
elaborate use cases.

-   Uses transferable JSON for messages
-   Extremely small (&lt;4KB before GZIP and minification)
-   Based on Custom Elements v1 (polyfill version available)
-   Uses shadow DOM to isolate the iframe from parent page styling and
    JS
-   Smaller API surface area
-   AMP- and Pym-compatible on both sides

**Note: this library is still experimental and in development. Use with
optimism, but also caution.**

You can load Sidechain into your projects through the following methods:

-   Via npm, at `@nprapps/sidechain`
-   Via unpkg, at `https://unpkg.com/@nprapps/sidechain`

By default, Sidechain supports all browsers shipping the Custom Elements
V1 spec: Chrome, Firefox, and Safari. If you need to support Edge, there
is a polyfilled version available in the package at
`dist/sidechain.polyfilled.js`. To support older browsers, we recommend
creating your own package using the base version of Sidechain and the
[document-register-element
polyfill](https://github.com/WebReflection/document-register-element).

The basics
----------

Embedding a guest page with Sidechain requires two steps. First, on the
host page, include the element with a `src` attribute pointing toward
the page you want to embed:

```html
<side-chain src="guest-page.html"></side-chain>
```

Then, in your guest page, register it as a guest to start automatically
sending height updates to the host:

```javascript
Sidechain.registerGuest()
```

Code snippets
-------------

```javascript
// sending a message to an individual child
// the sentinel serves as a way to test on the other side
var host = document.querySelector("side-chain.individual");
host.sendMessage({
  sentinel: "npr",
  type: "log",
  message: "Hello from NPR"
});

// receiving a message in the child
window.addEventListener("message", function(e) {
  if (e.data.sentinel && e.data.sentinel == "npr") {
    switch (e.data.type) {
      case "log":
        console.log(e.data.message); // Hello from NPR
        break;

      default:
        console.warn(`Sidechain message with unknown type (${e.data.type}) received`);
    }
  }
});

// sending a message back up to the parent from a child
var guest = Sidechain.registerGuest();
guest.sendMessage({
  sentinel: "npr",
  type: "broadcast",
  value: "Hello from the guest!"
});

// re-broadcasting to all instances from the host page
window.addEventListener("message", function(e) {
  // only proceed on our specific messages
  if (!e.data.sentinel || e.sentinel.data != "npr") return;
  // broadcast the message back to all guest pages
  var hosts = document.querySelectorAll("side-chain");
  hosts.forEach(host => host.sendMessage(e.data));
});
```

FAQ
---

Is this an official replacement for Pym?

:   **No, not at this time.** This project is a thought experiment on
    what Pym would look like if we wrote it today, keeping the core
    small and leveraging the features built-in to modern browsers. It is
    also a way to open a conversation with community members about what
    they want and need from an updated version of Pym.

How do I scroll to an element in the guest?

:   Instead of offering a `scrollParentToChildPos()`, requiring you to
    compute the offset of the element, use the browser's native
    `Element.scrollIntoView()` method ([documentation on
    MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)).

How do I navigate the parent page?

:   If possible, for accessibility reasons, page navigations should be
    exposed as links. Use the `target="_parent"` attribute to ask the
    parent page to navigate. If you need to navigate programmatically,
    you may need to write a custom message handler for it--Sidechain
    does not make assumptions about how your single-page app
    handles routing.

Does Sidechain provide arbitrary messaging support?

:   Not really. Sending messages using `window.postMessage()` between
    guest and host pages is simple enough that it does not make sense to
    provide additional layers of abstraction. Guest/host instances do
    provide a `sendMessage()` method just for convenience (it's easier
    than having to search for and access each iframe's `contentWindow`),
    but that's it. We will, however, make available a loader library
    that demonstrates some useful functionality, such as firing
    visibility events and passing data between frames.

About the name
--------------

In audio production, a "sidechain" is a kind of mixing technique where a
signal is split into two paths: a main output that remains audible, and
a secondary output that's routed to a plugin or processing unit as a
control signal. A common use case for this is "ducking," where the
volume of a voice track is used to automatically lower the volume on a
musical track behind it.

Working at NPR, it seemed appropriate for a responsive iframe, in which
content from the guest is used to control the height of its container
(or other code) in the host page.
