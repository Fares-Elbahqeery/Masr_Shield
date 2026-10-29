/* MasrShield — Clipboard utility */
(function (global) {
  "use strict";

  async function copyText(text) {
    var value = String(text == null ? "" : text);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (e) { /* fall through */ }
    }
    // fallback
    try {
      var ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function showToast(message, type) {
    var host = document.getElementById("ms-toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "ms-toast-host";
      host.style.cssText = "position:fixed;bottom:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;";
      document.body.appendChild(host);
    }
    var toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = "padding:.6rem 1rem;border-radius:8px;color:#fff;font-size:.9rem;box-shadow:0 4px 12px rgba(0,0,0,.2);background:" + (type === "error" ? "#c0392b" : "#2e7d32") + ";";
    host.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2200);
  }

  var api = {
    copyText: copyText,
    showToast: showToast,
    copy: function (text, btn) {
      return copyText(text).then(function (ok) {
        if (ok) {
          showToast("Copied to clipboard.", "success");
          if (btn) {
            var prev = btn.textContent;
            btn.textContent = "Copied!";
            setTimeout(function () { btn.textContent = prev; }, 1500);
          }
        } else {
          showToast("Copy failed. Please copy manually.", "error");
        }
        return ok;
      });
    }
  };

  global.MasrShieldClipboard = api;
  global.clipboard = api;
  global.MasrShield = global.MasrShield || {};
  global.MasrShield.clipboard = api;
})(window);
