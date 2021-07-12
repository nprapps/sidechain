# Sidechain

Sidechain is a custom element for creating responsive iframes, compatible with both [AMP iframes](https://www.ampproject.org/docs/reference/components/amp-iframe) and [Pym embeds](http://blog.apps.npr.org/pym.js/). It provides a simple core built on modern JavaScript, and can serve as a foundation for more elaborate use cases.

-   Uses transferable JSON for messages
-   Extremely small (&lt;4KB before GZIP and minification)
-   Based on Custom Elements v1 (polyfill version available)
-   Uses shadow DOM to isolate the iframe from parent page styling and JS
-   Smaller API surface area
-   AMP- and Pym-compatible on both sides

You can load Sidechain into your projects through the following methods:

-   Via npm, at `@nprapps/sidechain`
-   Via unpkg, at `https://unpkg.com/@nprapps/sidechain`

By default, Sidechain supports all browsers shipping the Custom Elements and Shadow DOM V1 APIs: Chrome, Firefox, and Safari. To support older browsers, we recommend creating your own package using Babel or another transpiler and the [web components polyfill](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs#how-to-use).

## The basics

Embedding a guest page with Sidechain requires two steps. First, on the host page, include the element with a `src` attribute pointing toward the page you want to embed:

```html
<side-chain src="guest-page.html"></side-chain>
```

Then, in your guest page, register it as a guest to start automatically sending height updates to the host:

```javascript
Sidechain.registerGuest()
```

## Pattern-matching for messages

When sending messages between windows, you'll probably want to set a flag value that lets you filter and respond only to messages from your particular application. Setting the `sentinel` attribute on the host, or the same option when initializing a guest, will automatically add that value to messages sent between windows.

```html
<side-chain src="..." sentinel="npr"></side-chain>
<script>
  var host = document.querySelector("side-chain");
  host.sendMessage({ type: "analytics", onscreen: "10s" });
  /*
  The actual message will look like:
    {
      sentinel: "npr",
      type: "analytics",
      onscreen: "10s"
    }
  */

  // on the guest side:
  var guest = Sidechain.registerGuest({
    sentinel: "npr"
  });
  guest.sendMessage({ hello: "world" })
</script>
```

On the receiving end, it can be tedious to write the sentinel checks in every message handler, so Sidechain includes a simple static method named `matchMessage` that accepts a pattern object and a callback, and returns a function that you can use as the window's message handler. The callback will be executed only if the pattern matches, and will receive the message data as its argument. For example, to match an NPR sentinel and a specific "type" value in the data, you could write your code like so:

```javascript
var pattern = {
  sentinel: "npr",
  type: "analytics"
};
var onNPR = Sidechain.matchMessage(pattern, function(data) {
  console.log("NPR analytics received!", data);
});
window.addEventListener("message", onNPR);
```

Pattern objects are matched shallowly using strict equality for any keys provided, so it's best to use this to match a few constant string values and leave more complicated switching logic to your listener function.

## Legacy events

If using Sidechain in a mixed Pym/Sidechain environment, you may want your guest page to be able to listen to Pym events. For example, you might have visibility analytics on the host side that the guest should dispatch to GA. Sidechain guests include an `on()` method that's similar to Pym's `onMessage()` listeners, and will specifically handle Pym-formatted messages only.

```javascript
var guest = Sidechain.registerGuest();
guest.on("on-screen", function(bucket) {
  analytics.track("on-screen", bucket);
});
```

## API details

### Element attributes

`id` - Set the ID that's used for Pym messages.

`src` - The URL for the guest page.

`sentinel` - Set a string value to be set as the "sentinel" property on message objects (only if one isn't set already).

### Element methods

`element.sendMessage(data)` - dispatches data to the guest page using the iframe's `contentWindow.postMessage()` interface.

`element.sendLegacy(type, value)` - sends a Pym-formatted message to the guest page.

### Static class methods

`Sidechain.registerGuest(options)` - returns a guest instance, which is automatically registered to update a host with its height. The options object is optional, but supports the following properties:

* `id` - set the ID for Pym messages (default: `childId` from the guest page URL search parameters)
* `disablePolling` - set to `true` to turn off automatic height updates
* `polling` - set to the number of milliseconds between height messages (default: 300)
* `sentinel` - set a default sentinel value for messages sent by `guest.sendMessage()` (only on objects, and will not override an existing sentinel)

`Sidechain.matchMessage(pattern, callback)` - returns a listener function compatible with window message events. The callback will only be executed if the message data contains the same property values as the pattern, and will be passed the message data.

### Guest instance methods

`guest.sendMessage(data)` - convenience wrapper for `window.parent.postMessage()`.

`guest.sendLegacy(type, value)` - sends a Pym-formatted message to the host page via `window.postMessage()`.

`guest.sendHeight()` - updates the host with the current guest page height. 

`guest.on(type, callback)` - registers a listener for Pym events, similar to the `child.onMessage()` function.

`guest.off(type, callback)` - unregisters a listener that was registered with `on()`. The callback is optional--if it's omitted, all listeners for that type are removed.


## Code snippets

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
// use matchMessage to automatically filter based on a pattern object
var nprMatcher = Sidechain.matchMessage({ sentinel: "npr" }, function(data) {
  switch (data.type) {
    case "log":
      console.log(data.message); // Hello from NPR
      break;

    default:
      console.warn(`Sidechain message with unknown type (${data.type}) received`);
  }
});
window.addEventListener("message", nprMatcher);

// sending a message back up to the parent from a child
var guest = Sidechain.registerGuest();
guest.sendMessage({
  sentinel: "npr",
  type: "broadcast",
  value: "Hello from the guest!"
});

// re-broadcasting to all instances from the host page
var broadcastPattern = { sentinel: "npr", type: "broadcast" };
window.addEventListener("message", Sidechain.matchMessage(broadcastPattern, function(data) {
  // broadcast the message back to all guest pages
  var hosts = document.querySelectorAll("side-chain");
  hosts.forEach(host => host.sendMessage(data));
});

// using legacy Pym events on your child page (i.e., Carebot)
guest.on("on-screen", function(bucket) {
  analytics.track("on-screen", bucket);
});

```

## FAQ

**Is this an official replacement for Pym?**

**Yes, but we're not deprecating Pym.** Sidechain was successfully used on our 2020 election pages, for our liveblogs and for results embeds on station sites. We believe it's currently stable enough for regular use, and recommend it for modern applications that use a bundler instead of a JavaScript CDN to load dependencies.

**How do I scroll to an element in the guest?**

Instead of offering a `scrollParentToChildPos()`, requiring you to compute the offset of the element, use the browser's native `Element.scrollIntoView()` method ([documentation on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)).

**How do I navigate the host page?**

If possible, for accessibility reasons, page navigations should be exposed as links. Use the `target="_parent"` attribute to ask the host page to navigate. If you need to navigate programmatically, you may need to write a custom message handler for it--Sidechain does not make assumptions about how your single-page app handles routing.

**How do I scroll the host page?**

If targeting an ID, you can use the same trick of `target="_parent"` from a link, but you'll need to make sure to explicitly provide the fully qualified URL of the host page (only providing the hash will cause the window to navigate to your guest page). For example, the following code will scroll the host page to the "#scroll-host" ID.

```javascript
var a = document.createElement("a");
a.target = "_parent";
a.href = window.parent.location.href.replace(/#.*$/, "") + "#scroll-host";
a.click();
```

Note that `window.parent.location` is only available from an iframe if the two pages share a domain. If your guest page is on a subdomain, you can set `document.domain` to match (for example, from "apps.npr.org", we can set `document.domain = "npr.org"`). Otherwise, you'll need to know the host URL ahead of time or pass it in through the embed URL.

**Does Sidechain provide arbitrary messaging support?**

Not really. Sending messages using `window.postMessage()` between guest and host pages is simple enough that it does not make sense to provide additional layers of abstraction. Guest/host instances do provide a `sendMessage()` method just for convenience (it's easier than having to search for and access each iframe's `contentWindow`), but that's it. We will, however, make available a loader library that demonstrates some useful functionality, such as firing visibility events and passing data between frames.

About the name
--------------

In audio production, a "sidechain" is a kind of mixing technique where a signal is split into two paths: a main output that remains audible, and a secondary output that's routed to a plugin or processing unit as a control signal. A common use case for this is "ducking," where the volume of a voice track is used to automatically lower the volume on a musical track behind it.

Working at NPR, it seemed appropriate for a responsive iframe, in which content from the guest is used to control the height of its container (or other code) in the host page.
