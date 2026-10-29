/* MasrShield — Research Dashboard module */
(function (global) {
  "use strict";
  var CB = function () { return global.MasrShieldClipboard || global.clipboard; };
  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }

  function setNotAvailable() {
    setText("metric-accuracy", "Not available");
    setText("metric-precision", "Not available");
    setText("metric-recall", "Not available");
    setText("metric-f1", "Not available");
    setText("metric-consistency-rate", "Not available");
    setText("metric-fpr", "Not available");
    setText("metric-fnr", "Not available");
    setText("dataset-total-samples", "Not available");
    setText("dataset-dialect-count", "Not available");
    setText("dataset-paired-count", "Not available");
  }

  async function tryLoadData() {
    // attempt a few candidate local files
    var candidates = ["../data/research.json", "../data/benchmark.json", "data/research.json"];
    for (var i = 0; i < candidates.length; i++) {
      try {
        var res = await fetch(candidates[i]);
        if (res.ok) {
          var json = await res.json();
          return json;
        }
      } catch (e) { /* ignore */ }
    }
    return null;
  }

  function computeMetrics(data) {
    // expects data with arrays of {pred, truth} etc. If insufficient, return null
    if (!data || !Array.isArray(data.samples) || data.samples.length === 0) return null;
    var samples = data.samples;
    var tp=0, tn=0, fp=0, fn=0;
    samples.forEach(function (s) {
      var pred = !!s.predicted;
      var truth = !!s.label;
      if (pred && truth) tp++;
      else if (!pred && !truth) tn++;
      else if (pred && !truth) fp++;
      else fn++;
    });
    var total = samples.length;
    var acc = total ? (tp+tn)/total : null;
    var prec = (tp+fp) ? tp/(tp+fp) : null;
    var rec = (tp+fn) ? tp/(tp+fn) : null;
    var f1 = (prec != null && rec != null && (prec+rec)) ? 2*prec*rec/(prec+rec) : (prec === null || rec === null ? null : 0);
    var fpr = (fp+tn) ? fp/(fp+tn) : null;
    var fnr = (fn+tp) ? fn/(fn+tp) : null;
    var consistency = (typeof data.consistencyRate === "number") ? data.consistencyRate : null;
    return { accuracy: acc, precision: prec, recall: rec, f1: f1, fpr: fpr, fnr: fnr, consistency: consistency, total: total };
  }

  async function runBenchmark() {
    var empty = $("dashboard-empty-state");
    if (empty) empty.style.display = "none";
    var data = await tryLoadData();
    var m = computeMetrics(data);
    if (!m) {
      setNotAvailable();
      if (empty) empty.style.display = "block";
      return;
    }
    setText("metric-accuracy", m.accuracy != null ? Math.round(m.accuracy*100) + " %" : "Not available");
    setText("metric-precision", m.precision != null ? Math.round(m.precision*100) + " %" : "Not available");
    setText("metric-recall", m.recall != null ? Math.round(m.recall*100) + " %" : "Not available");
    setText("metric-f1", m.f1 != null ? m.f1.toFixed(3) : "Not available");
    setText("metric-consistency-rate", m.consistency != null ? Math.round(m.consistency*100) + " %" : "Not available");
    setText("metric-fpr", m.fpr != null ? Math.round(m.fpr*100) + " %" : "Not available");
    setText("metric-fnr", m.fnr != null ? Math.round(m.fnr*100) + " %" : "Not available");
    setText("dataset-total-samples", m.total + " Samples");
    // enable copy
    var copyBtn = $("copy-research-btn"); if (copyBtn) copyBtn.disabled = false;
    window.__rd_metrics = m;
  }

  function reset() {
    setNotAvailable();
    var empty = $("dashboard-empty-state");
    if (empty) empty.style.display = "block";
    var copyBtn = $("copy-research-btn"); if (copyBtn) copyBtn.disabled = true;
  }

  function copyReport() {
    var m = window.__rd_metrics;
    function fmtPct(v) { return v != null ? Math.round(v*100)+"%" : "Not available"; }
    function fmtNum(v) { return v != null ? v.toFixed(3) : "Not available"; }
    var report = "MasrShield Research Dashboard\n\n" +
      "Accuracy: " + fmtPct(m ? m.accuracy : null) + "\n" +
      "Precision: " + fmtPct(m ? m.precision : null) + "\n" +
      "Recall: " + fmtPct(m ? m.recall : null) + "\n" +
      "F1: " + fmtNum(m ? m.f1 : null) + "\n" +
      "Consistency Rate: " + (m && m.consistency != null ? Math.round(m.consistency*100)+"%" : "Not available") + "\n" +
      "FPR: " + fmtPct(m ? m.fpr : null) + "\n" +
      "FNR: " + fmtPct(m ? m.fnr : null) + "\n";
    var cb = CB(); if (cb) cb.copy(report, $("copy-research-btn"));
  }

  function loadHistory() {
    var M = global.MasrShield || {};
    var ST = M.storage;
    var entries = ST && typeof ST.load === "function" ? ST.load() : [];
    var total = entries.length;
    var msgs = entries.filter(function (e) { return e && e.type === "message"; }).length;
    var urls = entries.filter(function (e) { return e && e.type === "url"; }).length;
    setText("history-total", total);
    setText("history-messages", msgs);
    setText("history-urls", urls);
    var list = $("history-list");
    if (list) {
      list.innerHTML = "";
      if (!entries.length) {
        var li = document.createElement("li");
        li.textContent = "No analyses recorded yet.";
        list.appendChild(li);
      } else {
        entries.slice(0, 10).forEach(function (e) {
          var li = document.createElement("li");
          var when = e.timestamp ? new Date(e.timestamp).toLocaleString() : "";
          li.textContent = (e.type === "message" ? "Message" : "URL") + " — " + (e.classification || "—") + " (" + (e.score != null ? e.score : "—") + "/100) — " + when;
          list.appendChild(li);
        });
      }
    }
  }

  function init() {
    if (!$("run-benchmark-btn") && !$("metric-accuracy")) return;
    var runBtn = $("run-benchmark-btn");
    var resetBtn = $("reset-benchmark-btn");
    var copyBtn = $("copy-research-btn");
    if (runBtn) runBtn.addEventListener("click", runBenchmark);
    if (resetBtn) resetBtn.addEventListener("click", reset);
    if (copyBtn) copyBtn.addEventListener("click", copyReport);
    var clearHistBtn = $("clear-history-btn");
    if (clearHistBtn) clearHistBtn.addEventListener("click", function () {
      var M = global.MasrShield || {};
      if (M.storage && typeof M.storage.clear === "function") M.storage.clear();
      loadHistory();
    });
    // initial not available
    reset();
    loadHistory();
  }

  global.ResearchDashboard = { init: init, runBenchmark: runBenchmark, reset: reset };
  global.MasrShield = global.MasrShield || {};
  global.MasrShield.researchDashboard = global.ResearchDashboard;
})(window);
