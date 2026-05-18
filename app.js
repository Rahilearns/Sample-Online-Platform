(function () {
  "use strict";

  var STORAGE_KEY = "idlc-lang";
  var VALID = ["en", "bn"];
  var DEFAULT_LANG = "en"; // change to "bn" to default to Bengali

  function getStoredLang() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return VALID.indexOf(v) !== -1 ? v : DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;
    }
  }

  function storeLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
  }

  function applyLang(lang) {
    if (VALID.indexOf(lang) === -1) return;
    var dict = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || {};

    document.documentElement.setAttribute("lang", lang);
    document.body.setAttribute("lang", lang);

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      if (dict[key] != null) nodes[i].textContent = dict[key];
    }

    var htmlNodes = document.querySelectorAll("[data-i18n-html]");
    for (var j = 0; j < htmlNodes.length; j++) {
      var k = htmlNodes[j].getAttribute("data-i18n-html");
      if (dict[k] != null) htmlNodes[j].innerHTML = dict[k];
    }

    var btns = document.querySelectorAll(".lang-btn");
    for (var m = 0; m < btns.length; m++) {
      var on = btns[m].getAttribute("data-lang") === lang;
      btns[m].classList.toggle("active", on);
      btns[m].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function init() {
    applyLang(getStoredLang());

    var btns = document.querySelectorAll(".lang-btn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function (e) {
        var lang = e.currentTarget.getAttribute("data-lang");
        storeLang(lang);
        applyLang(lang);
      });
    }

    // Customer Login is intentionally inert for now
    var login = document.getElementById("customerLogin");
    if (login) {
      login.addEventListener("click", function (e) { e.preventDefault(); });
    }

    // Belt-and-braces: block any clicks that bubble out of the home screenshot
    var canvas = document.querySelector(".home-canvas");
    if (canvas) {
      canvas.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
      }, true);
    }

    // Graceful fallback when idlc-home.{png,jpg} is missing
    var img = document.querySelector(".home-image");
    if (img) {
      img.addEventListener("error", function onErr() {
        // try .jpg if .png failed
        if (img.dataset.tried !== "jpg" && /\.png$/i.test(img.src)) {
          img.dataset.tried = "jpg";
          img.src = img.src.replace(/\.png$/i, ".jpg");
          return;
        }
        showPlaceholder();
      });
      // also catch broken image with 0 natural width
      if (img.complete && img.naturalWidth === 0) showPlaceholder();
    }

    function showPlaceholder() {
      var existing = document.querySelector(".home-canvas");
      if (!existing) return;
      var lang = getStoredLang();
      var t = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || window.TRANSLATIONS.en;
      var ph = document.createElement("div");
      ph.className = "home-placeholder";
      ph.setAttribute("aria-hidden", "true");
      ph.innerHTML =
        '<div class="home-placeholder-inner">' +
          '<h2 data-i18n="placeholder_title">' + t.placeholder_title + '</h2>' +
          '<p data-i18n-html="placeholder_body_html">' + t.placeholder_body_html + '</p>' +
          '<p style="margin-top:12px;font-size:13px;color:var(--text-muted)" data-i18n="placeholder_tip">' + t.placeholder_tip + '</p>' +
        '</div>';
      existing.replaceWith(ph);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
