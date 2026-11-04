/* Shared standalone HTML appearance control; works without storage. */
(() => {
  "use strict";
  const root = document.documentElement;
  const control = document.getElementById("design-mode");
  const valid = value => ["system", "light", "dark"].includes(value);
  const key = "design-mode:" + (root.dataset.design || "custom");
  const system = matchMedia("(prefers-color-scheme: dark)");
  let stored;
  try { stored = localStorage.getItem(key); } catch { /* Optional on file://. */ }
  let mode = valid(root.dataset.mode) ? root.dataset.mode : valid(stored) ? stored : "system";
  const apply = () => {
    root.dataset.mode = mode;
    if (control) control.value = mode;
    root.dispatchEvent(new CustomEvent("designmodechange", {
      bubbles: true,
      detail: { preference: mode, resolved: mode === "system" ? (system.matches ? "dark" : "light") : mode },
    }));
  };
  if (control) control.addEventListener("change", () => {
    mode = valid(control.value) ? control.value : "system";
    try { localStorage.setItem(key, mode); } catch { /* Switching still works. */ }
    apply();
  });
  system.addEventListener("change", () => { if (mode === "system") apply(); });
  apply();
})();
