/* MasrShield — Application coordinator (app.js) */
(function (global) {
  "use strict";

  var MasrShield = global.MasrShield || {};
  global.MasrShield = MasrShield;

  MasrShield.storage = MasrShield.storage || {
    KEY: "masrshield_analysis_history",
    MAX: 50,
    load: function () {
      try {
        var raw = global.localStorage ? global.localStorage.getItem(MasrShield.storage.KEY) : null;
        if (!raw) return [];
        var arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        return arr;
      } catch (e) {
        console.error("[MasrShield] storage load error", e);
        return [];
      }
    },
    save: function (entry) {
      try {
        if (!global.localStorage) return false;
        var arr = MasrShield.storage.load();
        arr.unshift(entry);
        if (arr.length > MasrShield.storage.MAX) arr = arr.slice(0, MasrShield.storage.MAX);
        global.localStorage.setItem(MasrShield.storage.KEY, JSON.stringify(arr));
        return true;
      } catch (e) {
        console.error("[MasrShield] storage save error", e);
        return false;
      }
    },
    clear: function () {
      try { if (global.localStorage) global.localStorage.removeItem(MasrShield.storage.KEY); } catch (e) {}
    }
  };

  function currentPage() {
    var path = (global.location && global.location.pathname) || "";
    var file = path.split("/").pop().split("\\").pop() || "index.html";

  MasrShield.utils = MasrShield.utils || {
    $: function (id) { return document.getElementById(id); },
    on: function (el, ev, fn) { if (el) el.addEventListener(ev, fn); },
    safe: function (fn, label) {
      try { fn(); } catch (e) { console.error("[MasrShield]" + (label ? " " + label : ""), e); }
    }
  };

    if (!file || file === "") file = "index.html";
    // Vercel cleanUrls serve pages without extension; normalize to filename
    if (file.indexOf(".") === -1) file = file + ".html";
    var map = {
      "index.html": "home",
      "message-scanner.html": "message-scanner",
      "url-analyzer.html": "url-analyzer",
      "screenshot-scanner.html": "screenshot-scanner",
      "qr-scanner.html": "qr-scanner",
      "consistency-guard.html": "consistency-guard",
      "research-dashboard.html": "research-dashboard"
    };
    return map[file] || "home";
  }

  function initNav() {
    var page = currentPage();
    // update active nav links
    var links = document.querySelectorAll(".nav-link, .footer-link");
    links.forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var base = href.split("/").pop().split("\\").pop();
      // map href basename to page
      var targetPage = null;
      var m = {
        "index.html": "home",
        "message-scanner.html": "message-scanner",
        "url-analyzer.html": "url-analyzer",
        "screenshot-scanner.html": "screenshot-scanner",
        "qr-scanner.html": "qr-scanner",
        "consistency-guard.html": "consistency-guard",
        "research-dashboard.html": "research-dashboard"
      };
      targetPage = m[base];
      if (targetPage && targetPage === page) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      }
    });
    // mobile nav toggle (if any)
    var toggle = document.querySelector("[data-nav-toggle], #nav-toggle, .nav-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var nav = document.querySelector(".main-navigation, .nav-list");
        if (nav) {
          var open = nav.classList.toggle("is-open");
          toggle.setAttribute("aria-expanded", open ? "true" : "false");
        }
      });
    }
  }

  function initPage(page) {
    var M = global.MasrShield || {};
    function tryInit(obj, label) {
      if (obj && typeof obj.init === "function") {
        MasrShield.utils.safe(function () { obj.init(); }, label);
      }
    }
    switch (page) {
      case "home":
        break;
      case "message-scanner":
        tryInit(M.messageScanner || global.MessageScanner, "MessageScanner");
        break;
      case "url-analyzer":
        tryInit(M.urlAnalyzer || global.UrlAnalyzer, "UrlAnalyzer");
        break;
      case "screenshot-scanner":
        tryInit(M.screenshotScanner || global.ScreenshotScanner, "ScreenshotScanner");
        break;
      case "qr-scanner":
        tryInit(M.qrScanner || global.QrScanner, "QrScanner");
        break;
      case "consistency-guard":
        tryInit(M.consistencyGuard || global.ConsistencyGuard, "ConsistencyGuard");
        break;
      case "research-dashboard":
        tryInit(M.researchDashboard || global.ResearchDashboard, "ResearchDashboard");
        break;
    }
  }

  function init() {
    var page = currentPage();
    MasrShield.page = page;
    MasrShield.utils.safe(initNav, "initNav");
    MasrShield.utils.safe(function () { initPage(page); }, "initPage");
    // notify
    if (global.console) console.info("[MasrShield] initialized page:", page);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  MasrShield.app = { init: init, currentPage: currentPage };
  global.MasrShield = MasrShield;
})(window);
