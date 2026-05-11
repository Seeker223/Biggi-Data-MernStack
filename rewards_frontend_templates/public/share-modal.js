// Defensive no-op share modal script.
// Some deployments inject `/share-modal.js` globally; this prevents runtime errors
// when the expected DOM nodes are not present on the page.
(function () {
  try {
    const safe = (selector, event, handler) => {
      const el = document.querySelector(selector);
      if (!el || typeof el.addEventListener !== "function") return;
      el.addEventListener(event, handler);
    };

    // If a future share modal UI is added, wire it up safely here.
    // For now, do nothing.
    safe("[data-share-open]", "click", () => {});
    safe("[data-share-close]", "click", () => {});
  } catch {
    // ignore
  }
})();

