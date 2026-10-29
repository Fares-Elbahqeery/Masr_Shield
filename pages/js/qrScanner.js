/* MasrShield — QR Scanner module */
(function (global) {
  "use strict";
  var RE = function () { return global.MasrShieldRiskEngine || global.riskEngine; };
  var CB = function () { return global.MasrShieldClipboard || global.clipboard; };
  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }
  var currentFile = null;
  function previewFile(file) {
    var box = $("qr-preview-box");
    if (!box) return;
    if (!file) { box.innerHTML = '<p class="empty-state-text">No QR image selected.</p>'; return; }
    var url = URL.createObjectURL(file);
    box.innerHTML = "";
    var img = document.createElement("img");
    img.src = url; img.alt = "QR preview";
    img.style.maxWidth = "100%"; img.style.maxHeight = "300px";
    box.appendChild(img);
  }
  function onFileChange(e) {
    currentFile = (e.target.files && e.target.files[0]) || null;
    previewFile(currentFile);
  }
  function decode() {
    var area = $("decoded-content-area");
    if (!currentFile) { if (area) area.value = "Please select an image first."; return; }
    var jsQR = global.jsQR;
    if (typeof jsQR !== "function") {
      if (area) area.value = "QR decoder is currently unavailable.";
      return;
    }
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var code = jsQR(imageData.data, imageData.width, imageData.height);
      if (!code || !code.data) {
        if (area) area.value = "No QR code detected in image.";
        return;
      }
      var data = code.data;
      if (area) area.value = data;
      var copyBtn = $("copy-qr-content-btn");
      if (copyBtn) copyBtn.disabled = false;
      handlePayload(data);
      var rep = $("copy-qr-report-btn");
      if (rep) rep.disabled = false;
    };
    img.onerror = function () { if (area) area.value = "Failed to load image."; };
    img.src = URL.createObjectURL(currentFile);
  }
  function isUrl(s) {
    try { new URL(s); return true; } catch (e) {
      return /^[a-z0-9.-]+\.[a-z]{2,}/i.test(s);
    }
  }
  function handlePayload(data) {
    var type = isUrl(data) ? "URL" : "Plain Text";
    setText("qr-payload-type", type);
    setText("qr-url-protocol", "— (Awaiting decode)");
    setText("qr-url-domain", "— (Awaiting decode)");
    setText("qr-url-path", "— (Awaiting decode)");
    setText("qr-url-redirect-risk", "— (Awaiting decode)");
    setText("qr-risk-level", "Pending");
    if (type === "URL") {
      var u = data;
      if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = "http://" + u;
      var parsed = null;
      try { parsed = new URL(u); } catch (e) { parsed = null; }
      if (parsed) {
        setText("qr-url-protocol", parsed.protocol.replace(":", ""));
        setText("qr-url-domain", parsed.hostname);
        setText("qr-url-path", parsed.pathname || "/");
        var redirectRisk = /[?&](redirect|url|next|target|dest)=/i.test(parsed.search) ? "High" : "Low";
        setText("qr-url-redirect-risk", redirectRisk);
      }
      var re = RE();
      if (re) { var result = re.analyzeUrl(data); setText("qr-risk-level", result.classification);
      var qrCls = $("qr-risk-level"); if (qrCls) qrCls.className = "metric-value classification-badge status-" + result.classification.toLowerCase();
      var qrCls = $("qr-risk-level"); if (qrCls) qrCls.className = "metric-value classification-badge status-" + result.classification.toLowerCase(); window.__qr_lastResult = result; }
    } else {
      var re2 = RE();
      if (re2) { var r2 = re2.analyzeMessage(data); setText("qr-risk-level", r2.classification);
      var qrCls2 = $("qr-risk-level"); if (qrCls2) qrCls2.className = "metric-value classification-badge status-" + r2.classification.toLowerCase();
      var qrCls2 = $("qr-risk-level"); if (qrCls2) qrCls2.className = "metric-value classification-badge status-" + r2.classification.toLowerCase(); window.__qr_lastResult = r2; }
    }
    var M = global.MasrShield || {};
    if (M.storage && typeof M.storage.save === "function" && window.__qr_lastResult) {
      M.storage.save({ type: "qr", timestamp: Date.now(), input: data, score: window.__qr_lastResult.score, classification: window.__qr_lastResult.classification, indicators: (window.__qr_lastResult.indicators || []).map(function (i) { return i.name; }) });
    }
    window.__qr_lastContent = data;
    window.__qr_lastType = type;
  }
  function clear() {
    currentFile = null;
    var input = $("qr-file-input");
    if (input) input.value = "";
    previewFile(null);
    var area = $("decoded-content-area");
    if (area) area.value = "";
    setText("qr-payload-type", "Unknown");
    setText("qr-risk-level", "Pending");
    setText("qr-url-protocol", "— (Awaiting decode)");
    setText("qr-url-domain", "— (Awaiting decode)");
    setText("qr-url-path", "— (Awaiting decode)");
    setText("qr-url-redirect-risk", "— (Awaiting decode)");
    var copyBtn = $("copy-qr-content-btn");
    if (copyBtn) copyBtn.disabled = true;
    var rep = $("copy-qr-report-btn");
    if (rep) rep.disabled = true;
  }
  function copyContent() {
    var area = $("decoded-content-area");
    var text = area ? area.value : "";
    var cb = CB(); if (cb) cb.copy(text, $("copy-qr-content-btn"));
  }
  function copyReport() {
    var content = window.__qr_lastContent || "";
    var type = window.__qr_lastType || "";
    var r = window.__qr_lastResult;
    var report = "MasrShield QR Analysis\n\nDecoded Content:\n" + content + "\n\nPayload Type: " + type + "\nRisk Level: " + (r ? r.classification : "") + "\nRisk Score: " + (r ? r.score : "") + " / 100\n\nIndicators:\n" + (r ? (r.indicators || []).map(function (i){return "- "+i.name;}).join("\n") : "");
    var cb = CB(); if (cb) cb.copy(report, $("copy-qr-report-btn"));
  }
  function init() {
    if (!$("qr-scanner-form") && !$("qr-file-input")) return;
    var input = $("qr-file-input");
    if (input) input.addEventListener("change", onFileChange);
    var area = $("decoded-content-area");
    var decBtn = $("decode-qr-btn");
    var jsQRlib = global.jsQR;
    if (typeof jsQRlib !== "function") {
      if (area) area.value = "QR decoder is currently unavailable.";
      if (decBtn) decBtn.disabled = true;
    }
    var dropZone = $("qr-preview-box");
    if (dropZone) {
      dropZone.addEventListener("dragover", function (e) { e.preventDefault(); dropZone.style.outline = "2px dashed var(--accent-primary)"; });
      dropZone.addEventListener("dragleave", function () { dropZone.style.outline = ""; });
      dropZone.addEventListener("drop", function (e) { e.preventDefault(); dropZone.style.outline = ""; var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) { currentFile = f; previewFile(f); } });
    }
    var clearBtn = $("clear-qr-btn");
    if (decBtn) decBtn.addEventListener("click", decode);
    if (clearBtn) clearBtn.addEventListener("click", clear);
    var copyContentBtn = $("copy-qr-content-btn");
    var copyRepBtn = $("copy-qr-report-btn");
    if (copyContentBtn) copyContentBtn.addEventListener("click", copyContent);
    if (copyRepBtn) copyRepBtn.addEventListener("click", copyReport);
    var form = $("qr-scanner-form");
    if (form) form.addEventListener("reset", function () { setTimeout(clear, 0); });
  }
  global.QrScanner = { init: init, decode: decode, clear: clear };
  global.MasrShield = global.MasrShield || {};
  global.MasrShield.qrScanner = global.QrScanner;
})(window);

