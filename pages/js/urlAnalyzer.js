/* MasrShield — URL Analyzer module */
(function (global) {
  "use strict";
  var RE = function () { return global.MasrShieldRiskEngine || global.riskEngine; };
  var CB = function () { return global.MasrShieldClipboard || global.clipboard; };
  function $(id) { return document.getElementById(id); }

  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }

  function renderResult(result, url) {
    var empty = $("url-empty-state");
    if (empty) empty.style.display = "none";
    setText("parsed-protocol", result.components ? result.components.protocol : "—");
    setText("parsed-subdomain", result.components ? (result.components.subdomain || "(none)") : "—");
    setText("parsed-domain", result.components ? result.components.domain : "—");
    setText("parsed-tld", result.components ? result.components.tld : "—");
    setText("parsed-port", result.components ? result.components.port : "—");
    setText("parsed-path", result.components ? result.components.path : "—");
    setText("parsed-params", result.components ? (result.components.params || "(none)") : "—");
    setText("url-risk-verdict", result.classification + " (" + result.score + "/100)");
    setText("url-confidence-level", result.indicators.length ? "Heuristic" : "Low confidence");
    setText("url-assessment-summary", result.verdict);
    var list = $("url-indicators-list");
    if (list) {
      list.innerHTML = "";
      if (!result.indicators.length) {
        var li = document.createElement("li"); li.textContent = "No heuristic indicators detected."; list.appendChild(li);
      } else {
        result.indicators.forEach(function (ind) {
          var li = document.createElement("li"); li.textContent = ind.name + " — " + ind.description; list.appendChild(li);
        });
      }
    }
    var copyUrl = $("copy-url-btn");
    var copyRep = $("copy-url-report-btn");
    if (copyUrl) copyUrl.disabled = false;
    if (copyRep) copyRep.disabled = false;
    window.__ua_lastUrl = url;
    window.__ua_lastResult = result;
  }

  function analyze() {
    var input = $("url-input");
    var err = null;
    if (!input) return;
    var url = input.value.trim();
    var err = $("url-error-message");
    if (!url) {
      if (err) { err.style.display = "block"; err.textContent = "Please enter a URL to analyze."; }
      return;
    }
    if (err) err.style.display = "none";
    var re = RE();
    if (!re) return;
    var result = re.analyzeUrl(url);
    renderResult(result, url);
    var M = global.MasrShield || {};
    if (M.storage && typeof M.storage.save === "function") {
      M.storage.save({ type: "url", timestamp: Date.now(), input: url, score: result.score, classification: result.classification, indicators: result.indicators.map(function (i) { return i.name; }) });
    }
  }

  function clear() {
    var input = $("url-input");
    if (input) input.value = "";
    var err = $("url-error-message"); if (err) err.style.display = "none";
    var err = $("url-error-message"); if (err) err.style.display = "none";
    var empty = $("url-empty-state");
    if (empty) empty.style.display = "block";
    ["parsed-protocol","parsed-subdomain","parsed-domain","parsed-tld","parsed-port","parsed-path","parsed-params"].forEach(function (id) {
      var el = $(id); if (el) el.textContent = id === "parsed-port" ? "— (Standard 80 / 443)" : "— (Awaiting input)";
    });
    setText("url-risk-verdict", "Pending Evaluation");
    setText("url-confidence-level", "Not Calculated");
    setText("url-assessment-summary", "Structural indicators have not been parsed.");
    var list = $("url-indicators-list"); if (list) list.innerHTML = "";
    var copyUrl = $("copy-url-btn"); var copyRep = $("copy-url-report-btn");
    if (copyUrl) copyUrl.disabled = true;
    if (copyRep) copyRep.disabled = true;
  }

  function copyUrl() {
    var url = ($("url-input") && $("url-input").value) || window.__ua_lastUrl || "";
    var cb = CB(); if (cb) cb.copy(url, $("copy-url-btn"));
  }

  function copyReport() {
    var r = window.__ua_lastResult; var url = window.__ua_lastUrl || "";
    var report = "MasrShield URL Analysis\n\nURL:\n" + url + "\n\nRisk Score: " + (r ? r.score : "") + " / 100\nClassification: " + (r ? r.classification : "") + "\n\nComponents:\n" + (r && r.components ? JSON.stringify(r.components, null, 2) : "") + "\n\nIndicators:\n" + (r ? r.indicators.map(function (i){return "- "+i.name;}).join("\n") : "") + "\n\nVerdict:\n" + (r ? r.verdict : "");
    var cb = CB(); if (cb) cb.copy(report, $("copy-url-report-btn"));
  }

  function init() {
    if (!$("url-analyzer-form") && !$("url-input")) return;
    var analyzeBtn = $("analyze-url-btn");
    var clearBtn = $("clear-url-btn");
    if (analyzeBtn) analyzeBtn.addEventListener("click", analyze);
    if (clearBtn) clearBtn.addEventListener("click", clear);
    var copyUrlBtn = $("copy-url-btn");
    var copyRepBtn = $("copy-url-report-btn");
    if (copyUrlBtn) copyUrlBtn.addEventListener("click", copyUrl);
    if (copyRepBtn) copyRepBtn.addEventListener("click", copyReport);
    var form = $("url-analyzer-form");
    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); analyze(); });
  }

  global.UrlAnalyzer = { init: init, analyze: analyze, clear: clear };
  global.MasrShield = global.MasrShield || {};
  global.MasrShield.urlAnalyzer = global.UrlAnalyzer;
})(window);
