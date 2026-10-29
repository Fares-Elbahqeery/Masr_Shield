/* MasrShield — Message Scanner module */
(function (global) {
  "use strict";

  var RE = function () { return global.MasrShieldRiskEngine || global.riskEngine; };
  var CB = function () { return global.MasrShieldClipboard || global.clipboard; };

  function $(id) { return document.getElementById(id); }

  function renderResult(result, text) {
    var scoreEl = $("risk-score-value");
    var classEl = $("risk-classification-value");
    var empty = $("message-empty-state");
    var summaryBox = $("assessment-summary-container");
    var summaryText = $("assessment-explanation-text");
    var list = $("detected-indicators-list");
    if (scoreEl) scoreEl.textContent = result.score + " / 100";
    if (classEl) {
      classEl.textContent = result.classification;
      classEl.className = "metric-value classification-badge status-" + result.classification.toLowerCase();
    }
    if (empty) empty.style.display = "none";
    if (summaryBox) summaryBox.style.display = "block";
    if (summaryText) summaryText.textContent = result.explanation;
    if (list) {
      list.innerHTML = "";
      if (result.indicators.length === 0) {
        var li = document.createElement("li");
        li.textContent = "No indicators detected.";
        list.appendChild(li);
      } else {
        result.indicators.forEach(function (ind) {
          var li = document.createElement("li");
          li.textContent = ind.name + " — " + ind.description;
          list.appendChild(li);
        });
      }
    }
    // enable copy buttons
    var copyMsg = $("copy-message-btn");
    var copyRep = $("copy-report-btn");
    if (copyMsg) copyMsg.disabled = false;
    if (copyRep) copyRep.disabled = false;
    // store last
    window.__ms_lastMessage = text;
    window.__ms_lastResult = result;
  }

  function analyze() {
    var input = $("message-input");
    var err = $("input-error-message");
    if (!input) return;
    var text = input.value.trim();
    if (!text) {
      if (err) { err.style.display = "block"; err.textContent = "Please enter a message to analyze."; }
      return;
    }
    if (err) err.style.display = "none";
    var re = RE();
    if (!re) { if (err) { err.style.display="block"; err.textContent = "Risk engine unavailable."; } return; }
    var result = re.analyzeMessage(text);
    renderResult(result, text);
  }

  function clear() {
    var input = $("message-input");
    if (input) input.value = "";
    var empty = $("message-empty-state");
    if (empty) empty.style.display = "block";
    var summaryBox = $("assessment-summary-container");
    if (summaryBox) summaryBox.style.display = "none";
    var scoreEl = $("risk-score-value");
    if (scoreEl) scoreEl.textContent = "— / 100";
    var classEl = $("risk-classification-value");
    if (classEl) classEl.textContent = "Uncertain";
    var list = $("detected-indicators-list");
    if (list) list.innerHTML = "";
    var copyMsg = $("copy-message-btn");
    var copyRep = $("copy-report-btn");
    if (copyMsg) copyMsg.disabled = true;
    if (copyRep) copyRep.disabled = true;
  }

  function copyMessage() {
    var text = ($("message-input") && $("message-input").value) || window.__ms_lastMessage || "";
    var cb = CB();
    if (cb) cb.copy(text, $("copy-message-btn"));
  }

  function copyReport() {
    var r = window.__ms_lastResult;
    var text = window.__ms_lastMessage || "";
    var report = "MasrShield Message Analysis\n\nMessage:\n" + text + "\n\nRisk Score: " + (r ? r.score : "") + " / 100\nClassification: " + (r ? r.classification : "") + "\n\nIndicators:\n" + (r ? r.indicators.map(function (i){return "- "+i.name;}).join("\n") : "") + "\n\nExplanation:\n" + (r ? r.explanation : "");
    var cb = CB();
    if (cb) cb.copy(report, $("copy-report-btn"));
  }

  function init() {
    if (!$("message-scanner-form") && !$("message-input")) return;
    var analyzeBtn = $("analyze-message-btn");
    var clearBtn = $("clear-message-btn");
    if (analyzeBtn) analyzeBtn.addEventListener("click", analyze);
    if (clearBtn) clearBtn.addEventListener("click", clear);
    var copyMsg = $("copy-message-btn");
    var copyRep = $("copy-report-btn");
    if (copyMsg) copyMsg.addEventListener("click", copyMessage);
    if (copyRep) copyRep.addEventListener("click", copyReport);
    // form submit guard
    var form = $("message-scanner-form");
    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); analyze(); });
  }

  global.MessageScanner = { init: init, analyze: analyze, clear: clear };
  global.MasrShield = global.MasrShield || {};
  global.MasrShield.messageScanner = global.MessageScanner;
})(window);
