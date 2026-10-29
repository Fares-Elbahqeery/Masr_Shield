/* MasrShield — Screenshot Scanner module */
(function (global) {
  "use strict";
  var RE = function () { return global.MasrShieldRiskEngine || global.riskEngine; };
  var CB = function () { return global.MasrShieldClipboard || global.clipboard; };
  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }

  var currentFile = null;

  function previewFile(file) {
    var box = $("screenshot-preview");
    if (!box) return;
    if (!file) { box.innerHTML = '<p class="empty-state-text">No image uploaded.</p>'; return; }
    var url = URL.createObjectURL(file);
    box.innerHTML = "";
    var img = document.createElement("img");
    img.src = url;
    img.alt = "Screenshot preview";
    img.style.maxWidth = "100%";
    img.style.maxHeight = "300px";
    box.appendChild(img);
  }

  function onFileChange(e) {
    var file = (e.target.files && e.target.files[0]) || null;
    currentFile = file;
    previewFile(file);
  }

  function extract() {
    var area = $("extracted-text-area");
    var status = $("ocr-status-note");
    if (!currentFile) {
      if (status) status.textContent = "Please select an image first.";
      return;
    }
    var T = global.Tesseract;
    if (!T || typeof T.recognize !== "function") {
      if (status) status.textContent = "OCR is currently unavailable.";
      return;
    }
    if (status) status.textContent = "Running OCR...";
    T.recognize(currentFile, "ara+eng", {
      logger: function (m) { if (status && m && m.status) status.textContent = m.status + (m.progress ? " " + Math.round(m.progress * 100) + "%" : ""); }
    }).then(function (res) {
      var text = (res && res.data && res.data.text) ? res.data.text : "";
      if (area) area.value = text;
      var conf = (res && res.data && typeof res.data.confidence === "number") ? Math.round(res.data.confidence) : null;
      setText("ocr-confidence-score", conf != null ? conf + " / 100%" : "— / 100%");
      if (status) status.textContent = "OCR complete.";
      var copyBtn = $("copy-extracted-btn");
      if (copyBtn) copyBtn.disabled = !text;
    }).catch(function (err) {
      if (status) status.textContent = "OCR failed: " + (err && err.message ? err.message : err);
      console.error(err);
    });
  }

  function analyzeExtracted() {
    var area = $("extracted-text-area");
    var text = area ? area.value.trim() : "";
    if (!text) return;
    var re = RE();
    if (!re) return;
    var result = re.analyzeMessage(text);
    // display in screenshot results: classification + indicators
    setText("screenshot-risk-classification", result.classification);
    var clsEl = $("screenshot-risk-classification"); if (clsEl) clsEl.className = "metric-value classification-badge status-" + result.classification.toLowerCase();
    setText("screenshot-risk-score", result.score + " / 100");
    var list = $("screenshot-indicators-list");
    if (list) {
      list.innerHTML = "";
      if (!result.indicators.length) {
        var li = document.createElement("li"); li.textContent = "No indicators detected."; list.appendChild(li);
      } else {
        result.indicators.forEach(function (ind) {
          var li = document.createElement("li"); li.textContent = ind.name + " — " + ind.description; list.appendChild(li);
        });
      }
    }
    var copyBtn = $("copy-screenshot-report-btn");
    if (copyBtn) copyBtn.disabled = false;
    window.__ss_lastText = text;
    window.__ss_lastResult = result;
  }

  function copyExtracted() {
    var area = $("extracted-text-area");
    var text = area ? area.value : "";
    var cb = CB(); if (cb) cb.copy(text, $("copy-extracted-btn"));
  }

  function copyReport() {
    var r = window.__ss_lastResult; var text = window.__ss_lastText || "";
    var report = "MasrShield Screenshot Analysis\n\nExtracted Text:\n" + text + "\n\nRisk Score: " + (r ? r.score : "") + " / 100\nClassification: " + (r ? r.classification : "") + "\n\nIndicators:\n" + (r ? r.indicators.map(function (i){return "- "+i.name;}).join("\n") : "") + "\n\nExplanation:\n" + (r ? r.explanation : "");
    var cb = CB(); if (cb) cb.copy(report, $("copy-screenshot-report-btn"));
  }

  function clear() {
    currentFile = null;
    var input = $("screenshot-file");
    if (input) input.value = "";
    previewFile(null);
    var area = $("extracted-text-area");
    if (area) area.value = "";
    setText("ocr-confidence-score", "— / 100%");
    setText("screenshot-risk-classification", "Awaiting Input");
    setText("screenshot-risk-score", "— / 100");
    var list = $("screenshot-indicators-list"); if (list) list.innerHTML = "";
    var copyExt = $("copy-extracted-btn"); if (copyExt) copyExt.disabled = true;
    var copyRep = $("copy-screenshot-report-btn"); if (copyRep) copyRep.disabled = true;
  }

  function init() {
    if (!$("screenshot-upload-form") && !$("screenshot-file")) return;
    var input = $("screenshot-file");
    if (input) input.addEventListener("change", onFileChange);
    var status = $("ocr-status-note");
    var extractBtn = $("extract-text-btn");
    var T = global.Tesseract;
    if (!T || typeof T.recognize !== "function") {
      if (status) status.textContent = "OCR is currently unavailable.";
      if (extractBtn) extractBtn.disabled = true;
    }
    var dropZone = $("screenshot-preview");
    if (dropZone) {
      dropZone.addEventListener("dragover", function (e) { e.preventDefault(); dropZone.style.outline = "2px dashed var(--accent-primary)"; });
      dropZone.addEventListener("dragleave", function () { dropZone.style.outline = ""; });
      dropZone.addEventListener("drop", function (e) { e.preventDefault(); dropZone.style.outline = ""; var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) { currentFile = f; previewFile(f); } });
    }
    var clearBtn = $("clear-screenshot-btn");
    var analyzeBtn = $("analyze-extracted-btn");
    if (extractBtn) extractBtn.addEventListener("click", extract);
    if (clearBtn) clearBtn.addEventListener("click", clear);
    if (analyzeBtn) analyzeBtn.addEventListener("click", analyzeExtracted);
    var copyExt = $("copy-extracted-btn");
    var copyRep = $("copy-screenshot-report-btn");
    if (copyExt) copyExt.addEventListener("click", copyExtracted);
    if (copyRep) copyRep.addEventListener("click", copyReport);
    var form = $("screenshot-upload-form");
    if (form) form.addEventListener("reset", function () { setTimeout(clear, 0); });
  }

  global.ScreenshotScanner = { init: init, extract: extract, clear: clear };
  global.MasrShield = global.MasrShield || {};
  global.MasrShield.screenshotScanner = global.ScreenshotScanner;
})(window);
