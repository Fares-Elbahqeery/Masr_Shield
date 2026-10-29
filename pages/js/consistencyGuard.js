/* MasrShield — ConsistencyGuard module */
(function (global) {
  "use strict";
  var RE = function () { return global.MasrShieldRiskEngine || global.riskEngine; };
  var CB = function () { return global.MasrShieldClipboard || global.clipboard; };
  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }
  var lastOrig = null, lastRew = null;
  function analyzeBoth() {
    var origText = ($("original-message") && $("original-message").value || "").trim();
    var rewText = ($("rewritten-message") && $("rewritten-message").value || "").trim();
    if (!origText || !rewText) {
      var err = $("consistency-error-message");
      if (err) { err.style.display = "block"; err.textContent = "Please enter both messages to analyze."; }
      return;
    }
    var errHide = $("consistency-error-message"); if (errHide) errHide.style.display = "none";
    var re = RE(); if (!re) return;
    var r1 = re.analyzeMessage(origText);
    var r2 = re.analyzeMessage(rewText);
    var scoreSim = 100 - Math.abs(r1.score - r2.score);
    if (scoreSim < 0) scoreSim = 0;
    if (scoreSim > 100) scoreSim = 100;
    lastOrig = { text: origText, result: r1 };
    lastRew = { text: rewText, result: r2 };
    setText("summary-original-dialect", ($("source-dialect") && $("source-dialect").value) || "Not selected");
    setText("summary-rewritten-dialect", ($("target-dialect") && $("target-dialect").value) || "Not selected");
    setText("summary-original-score", r1.score + " / 100");
    setText("summary-rewritten-score", r2.score + " / 100");
    setText("summary-original-class", r1.classification);
    var oc = $("summary-original-class"); if (oc) oc.className = "classification-badge status-" + r1.classification.toLowerCase();
    setText("summary-rewritten-class", r2.classification);
    var rc = $("summary-rewritten-class"); if (rc) rc.className = "classification-badge status-" + r2.classification.toLowerCase();
    setText("comp-score-orig", r1.score);
    setText("comp-score-rew", r2.score);
    setText("comp-score-diff", Math.abs(r1.score - r2.score));
    setText("comp-class-orig", r1.classification);
    setText("comp-class-rew", r2.classification);
    setText("comp-class-diff", r1.classification === r2.classification ? "Match" : "Mismatch");
    function has(r, id) { return r.indicators.some(function (i){return i.id===id;}); }
    function yn(b){ return b ? "Yes" : "No"; }
    setText("comp-urgency-orig", yn(has(r1,"urgency")));
    setText("comp-urgency-rew", yn(has(r2,"urgency")));
    setText("comp-urgency-diff", has(r1,"urgency")===has(r2,"urgency") ? "Same" : "Diff");
    setText("comp-impersonation-orig", yn(has(r1,"bank")));
    setText("comp-impersonation-rew", yn(has(r2,"bank")));
    setText("comp-impersonation-diff", has(r1,"bank")===has(r2,"bank") ? "Same" : "Diff");
    setText("comp-financial-orig", yn(has(r1,"money")||has(r1,"prize")));
    setText("comp-financial-rew", yn(has(r2,"money")||has(r2,"prize")));
    setText("comp-financial-diff", (has(r1,"money")||has(r1,"prize"))===(has(r2,"money")||has(r2,"prize")) ? "Same" : "Diff");
    setText("comp-cta-orig", yn(has(r1,"link")));
    setText("comp-cta-rew", yn(has(r2,"link")));
    setText("comp-cta-diff", has(r1,"link")===has(r2,"link") ? "Same" : "Diff");
    var consistent = r1.classification === r2.classification;
    setText("score-similarity-value", scoreSim);
    setText("consistency-verdict", "Status: " + (consistent ? "Consistent" : "Inconsistent"));
    var desc = $("consistency-verdict-desc");
    if (desc) desc.textContent = consistent
      ? "Both messages received the same classification."
      : "Classifications differ across this rewrite.";
    var copyBtn = $("copy-comparison-btn");
    if (copyBtn) copyBtn.disabled = false;
    window.__cg_last = { orig: lastOrig, rew: lastRew };
  }
  function clear() {
    ["original-message","rewritten-message"].forEach(function (id){ var el=$(id); if(el) el.value=""; });
    setText("summary-original-dialect","Not selected");
    setText("summary-rewritten-dialect","Not selected");
    setText("summary-original-score","— / 100");
    setText("summary-rewritten-score","— / 100");
    setText("summary-original-class","Uncertain");
    setText("summary-rewritten-class","Uncertain");
    ["comp-score-orig","comp-score-rew","comp-score-diff","comp-class-orig","comp-class-rew","comp-class-diff",
     "comp-urgency-orig","comp-urgency-rew","comp-urgency-diff","comp-impersonation-orig","comp-impersonation-rew","comp-impersonation-diff",
     "comp-financial-orig","comp-financial-rew","comp-financial-diff","comp-cta-orig","comp-cta-rew","comp-cta-diff"].forEach(function(id){ setText(id,"—"); });
    setText("consistency-verdict","Status: Not Evaluated");
    setText("score-similarity-value","—");
    var desc = $("consistency-verdict-desc");
    if (desc) desc.textContent = "Awaiting comparative submission.";
    var copyBtn = $("copy-comparison-btn"); if (copyBtn) copyBtn.disabled = true;
  }
  function copyComparison() {
    var d = window.__cg_last;
    if (!d) return;
    var r1 = d.orig.result, r2 = d.rew.result;
    var shared = r1.indicators.filter(function (i){ return r2.indicators.some(function(j){return j.id===i.id;}); }).map(function(i){return i.name;});
    var origOnly = r1.indicators.filter(function (i){ return !r2.indicators.some(function(j){return j.id===i.id;}); }).map(function(i){return i.name;});
    var rewOnly = r2.indicators.filter(function (i){ return !r1.indicators.some(function(j){return j.id===i.id;}); }).map(function(i){return i.name;});
    var report = "MasrShield ConsistencyGuard Report\n\nOriginal:\n" + d.orig.text + "\nScore: " + r1.score + "\nClass: " + r1.classification + "\n\nRewritten:\n" + d.rew.text + "\nScore: " + r2.score + "\nClass: " + r2.classification + "\n\nShared:\n" + (shared.join(", ")||"(none)") + "\nOriginal-only:\n" + (origOnly.join(", ")||"(none)") + "\nRewrite-only:\n" + (rewOnly.join(", ")||"(none)") + "\n\nScore Diff: " + Math.abs(r1.score-r2.score) + "\nClass Match: " + (r1.classification===r2.classification);
    var cb = CB(); if (cb) cb.copy(report, $("copy-comparison-btn"));
  }
  function init() {
    if (!$("consistency-form") && !$("original-message")) return;
    var btn = $("analyze-both-btn");
    var clearBtn = $("clear-consistency-btn");
    if (btn) btn.addEventListener("click", analyzeBoth);
    if (clearBtn) clearBtn.addEventListener("click", clear);
    var copyBtn = $("copy-comparison-btn");
    if (copyBtn) copyBtn.addEventListener("click", copyComparison);
    var form = $("consistency-form");
    if (form) form.addEventListener("submit", function (e){ e.preventDefault(); analyzeBoth(); });
  }
  global.ConsistencyGuard = { init: init, analyzeBoth: analyzeBoth, clear: clear };
  global.MasrShield = global.MasrShield || {};
  global.MasrShield.consistencyGuard = global.ConsistencyGuard;
})(window);
