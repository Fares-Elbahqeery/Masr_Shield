/* ==========================================================================
   MasrShield — Risk Engine (heuristic Arabic scam / phishing analyzer)
   ========================================================================== */
(function (global) {
  "use strict";

  function normalizeArabic(s) {
    if (s == null) return "";
    var t = String(s);
    // Arabizi / digit substitutions commonly used to obfuscate Arabic
    // Only substitute digits that are NOT part of a multi-digit number
    t = t.replace(/(?<!\d)3(?!\d)/g, "ع");
    t = t.replace(/(?<!\d)7(?!\d)/g, "ح");
    t = t.replace(/(?<!\d)2(?!\d)/g, "ء");
    t = t.replace(/(?<!\d)5(?!\d)/g, "خ");
    t = t.replace(/(?<!\d)6(?!\d)/g, "ط");
    t = t.replace(/(?<!\d)8(?!\d)/g, "غ");
    t = t.replace(/(?<!\d)9(?!\d)/g, "ص");
    t = t.replace(/(?<!\d)4(?!\d)/g, "ش");
    // remove tatweel (kashida)
    t = t.replace(/ـ/g, "");
    // remove Arabic diacritics (tashkeel)
    t = t.replace(/[ً-ٰٟ]/g, "");
    // normalize alef variants
    t = t.replace(/[آأإ]/g, "ا");
    // normalize alef maqsura to yaa
    t = t.replace(/ى/g, "ي");
    // collapse repeated characters (3+ -> 2)
    t = t.replace(/(.)\1{2,}/g, "$1$1");
    // collapse whitespace
    t = t.replace(/\s+/g, " ").trim();
    return t;
  }

  function clampScore(n) {
    n = Number(n);
    if (!isFinite(n) || isNaN(n)) n = 0;
    if (n < 0) n = 0;
    if (n > 100) n = 100;
    return Math.round(n);
  }

  var INDICATORS = [
    { id: "urgency", name: "Artificial Urgency & Panic Inducement", weight: 24,
      patterns: [/\b(urgent|immediately|asap|warning|alert|notice|attention|within \d+ (hours?|minutes?|days?)|expire|suspended?|blocked?|frozen?|locked?|verify|login)\b/i,
                 /(فوري|فوراً|خلال \d+ (ساعة|ساعات|دقيقة|دقائق|يوم|أيام)|انتهاء|موقوف|محظور|مجمد|إيقاف|تجميد|تعليق|إغلاق|حظر|مشبوه|بسرعة|خلال)/] },
    { id: "credential", name: "Credential Harvesting Request", weight: 22,
      patterns: [/\b(password|passcode|otp|pin code|verification code|login credentials?|verify|login|identity|confirm)\b/i,
                 /(كلمة المرور|رمز التحقق|رمز الأمان|الرقم السري|PIN|بياناتك|تحديث البيانات|تأكيد الحساب)/i] },
    { id: "bank", name: "Bank / Authority Impersonation", weight: 22,
      patterns: [/\b(bank|ministry|police|government|official|central bank)\b/i,
                 /(بنك|وزارة|شرطة|حكومة|البنك المركزي|مؤسسة|هيئة|إدارة)/] },
    { id: "prize", name: "Prize / Lottery / Windfall Lure", weight: 16,
      patterns: [/\b(congratulations|winner|lottery|prize|free gift|reward|won)\b/i,
                 /(مبروك|الرابح|جائزة|سحب|هدية|ربحت|كسبت)/] },
    { id: "money", name: "Financial Transfer / Payment Demand", weight: 20,
      patterns: [/\b(transfer|payment|deposit|amount|fee|invoice|remittance|billing|bill)\b/i,
                 /(تحويل|إيداع|دفع|مبلغ|رسوم|فاتورة|تحويل مالي)/] },
    { id: "link", name: "Call-to-Action Link Indicator", weight: 18,
      patterns: [/\b(click (here|link)|visit|open link|tap here)\b/i, /https?:\/\//i, /www\./i,
                 /(اضغط|انقر|رابط|الرابط|زيارة|افتح)/] },
    { id: "shorturl", name: "Shortened / Obfuscated URL", weight: 22,
      patterns: [/(bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|adf\.ly|bitly)/i, /(bit\.ly|tinyurl|t\.co|goo\.gl)/i] },
    { id: "threat", name: "Threat / Legal Consequence", weight: 20,
      patterns: [/\b(legal action|lawsuit|arrest|penalty|fine|court)\b/i,
                 /(إجراء قانوني|دعوى|اعتقال|غرامة|محكمة|عقوبة)/] },
    { id: "personal", name: "Personal Data Request", weight: 14,
      patterns: [/\b(national id|iqama|civil id|passport|ssn|date of birth)\b/i,
                 /(رقم الهوية|الإقامة|جواز السفر|تاريخ الميلاد)/] },
    { id: "dialect", name: "Colloquial / Dialectal Social Engineering", weight: 8,
      patterns: [/(يا باشا|مبروك كسبت|لا تفوت|الفرصة متفوتهاش|مستنياك|بسرعة)/] }
  ];

  var DESCRIPTIONS = {
    urgency: "Demands immediate action to bypass rational scrutiny.",
    credential: "Requests passwords, OTPs, or verification codes.",
    bank: "Impersonates banks or government authorities.",
    prize: "Lures victims with prizes or rewards.",
    money: "Demands payments or transfers.",
    link: "Pushes the user toward a link.",
    threat: "Threatens legal consequences.",
    personal: "Requests IDs or personal identifiers.",
    dialect: "Uses colloquial idioms to disarm suspicion.",
    shorturl: "Uses a URL shortener to hide the true destination."
  };

  function analyzeText(text) {
    var input = normalizeArabic(text);
    if (!input) {
      return { score: 0, classification: "Uncertain", indicators: [], explanation: "No input provided." };
    }
    var found = [];
    var score = 0;
    INDICATORS.forEach(function (ind) {
      var hit = ind.patterns.some(function (re) {
        try { re.lastIndex = 0; return re.test(input); } catch (e) { return false; }
      });
      if (hit) {
        found.push({ id: ind.id, name: ind.name, description: DESCRIPTIONS[ind.id] || "" });
        score += ind.weight;
      }
    });
    if (input.length > 200) score += 4;
    // Combination rule: if link present and at least one threat/urgency indicator => High Risk
    var hasUrgency = found.some(function (i) { return i.id === "urgency"; });
    var hasThreat = found.some(function (i) { return i.id === "bank" || i.id === "threat" || i.id === "credential" || i.id === "personal" || i.id === "shorturl"; });
    var hasLink = found.some(function (i) { return i.id === "link" || i.id === "shorturl"; });
    var threatCount = found.filter(function (i) { return i.id === "urgency" || i.id === "bank" || i.id === "threat" || i.id === "credential" || i.id === "personal"; }).length;
    if (hasLink && (hasUrgency || hasThreat) && threatCount >= 1) {
      score = Math.max(score, 78);
    }
    // Shortened URL alone is high risk
    if (found.some(function (i) { return i.id === "shorturl"; })) {
      score = Math.max(score, 70);
    }
    score = clampScore(score);
    var classification;
    if (found.length === 0) classification = "Low";
    else if (score >= 70) classification = "High";
    else if (score >= 40) classification = "Medium";
    else classification = "Low";
    var explanation = found.length
      ? "Detected " + found.length + " risk indicator(s): " + found.map(function (i) { return i.name; }).join(", ") + "."
      : "No known indicators detected by the current rules.";
    return { score: score, classification: classification, indicators: found, explanation: explanation };
  }

  function analyzeMessage(text) { return analyzeText(text); }

  function analyzeUrl(raw) {
    var input = String(raw || "").trim();
    if (!input) {
      return { score: 0, classification: "Uncertain", indicators: [], components: null, verdict: "No URL provided." };
    }
    var components = null;
    var url = input;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = "http://" + url;
    var parsed = null;
    try { parsed = new URL(url); } catch (e) { parsed = null; }
    var indicators = [];
    var score = 0;
    function add(id, name, desc, w) {
      indicators.push({ id: id, name: name, description: desc });
      score += w;
    }
    if (!parsed) {
      add("invalid", "Invalid URL Syntax", "The submitted string could not be parsed as a valid URL.", 20);
    } else {
      var host = parsed.hostname.toLowerCase();
      var parts = host.split(".");
      var tld = parts.length >= 2 ? parts[parts.length - 1] : "";
      var domain = parts.length >= 2 ? parts[parts.length - 2] : host;
      var subdomain = parts.slice(0, -2).join(".");
      components = {
        protocol: parsed.protocol.replace(":", ""),
        subdomain: subdomain,
        domain: domain + (parts.length >= 2 ? "." + tld : ""),
        tld: tld,
        port: parsed.port || "default",
        path: parsed.pathname || "/",
        params: parsed.search || ""
      };
      if (parsed.protocol !== "https:") {
        add("nohttps", "Unencrypted Protocol (HTTP)", "Link uses HTTP instead of HTTPS.", 12);
      }
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
        add("iphost", "IP Address as Host", "Using a raw IP address is common in phishing.", 18);
      }
      if (host.indexOf("xn--") !== -1) {
        add("punycode", "Punycode / IDN Homograph", "Internationalized domain may disguise look-alike characters.", 18);
      }
      if (input.indexOf("@") !== -1) {
        add("at", "Credential-like @ in URL", "The @ symbol can hide the real destination host.", 20);
      }
      var badTlds = ["xyz", "top", "cam", "click", "tk", "ml", "ga", "cf", "gq", "work", "zip"];
      if (badTlds.indexOf(tld) !== -1) {
        add("badtld", "Suspicious Top-Level Domain", "TLD is overrepresented in disposable phishing campaigns.", 12);
      }
      var brands = ["bank", "paypal", "apple", "google", "microsoft", "amazon", "facebook", "instagram", "netflix"];
      brands.forEach(function (b) {
        if (subdomain.indexOf(b) !== -1 && domain.indexOf(b) === -1) {
          add("brandsub", "Brand Name in Subdomain", "A known brand appears in the subdomain but not the registered domain.", 20);
        }
      });
      if ((domain + subdomain).split("-").length - 1 >= 3) {
        add("hyphens", "Excessive Hyphenation", "Multiple hyphens often indicate deceptive domains.", 10);
      }
      if (input.length > 120) {
        add("longurl", "Unusually Long URL", "Long URLs can obscure the true destination.", 8);
      }
      if (/[?&](redirect|url|next|target|dest)=/i.test(parsed.search)) {
        add("redirect", "Redirect Parameter Detected", "Query contains a redirect target.", 12);
      }
      if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
        add("port", "Non-Standard Port", "Non-standard port may indicate a rogue host.", 10);
      }
      if (/(login|signin|verify|account|update|secure|banking)/i.test(parsed.pathname)) {
        add("credpath", "Credential-Themed Path", "Path mimics authentication endpoints.", 8);
      }
    }
    score = clampScore(score);
    var classification;
    if (indicators.length === 0) classification = "Low";
    else if (score >= 70) classification = "High";
    else if (score >= 40) classification = "Medium";
    else classification = "Low";
    var verdict = indicators.length
      ? "Suspicious structural indicators detected."
      : "No major structural anomalies detected (reputation not verified).";
    return { score: score, classification: classification, indicators: indicators, components: components, verdict: verdict };
  }

  var api = {
    analyzeMessage: analyzeMessage,
    analyzeText: analyzeText,
    analyzeUrl: analyzeUrl,
    normalizeArabic: normalizeArabic
  };

  global.MasrShieldRiskEngine = api;
  global.riskEngine = api;
  global.MasrShield = global.MasrShield || {};
  global.MasrShield.riskEngine = api;
})(window);
