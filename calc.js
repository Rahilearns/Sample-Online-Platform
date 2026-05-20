(function () {
  "use strict";

  var DEMO_OTP = "1234";
  var EXISTING_NID = "5102284394";
  var EXISTING_CLIENT = {
    name: "Mahfuzul Islam",
    cif: "553577",
    email: "Imahfuzul@gmail.com"
  };

  function $(id) { return document.getElementById(id); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function getDict() {
    return (window.TRANSLATIONS &&
            window.TRANSLATIONS[document.documentElement.lang || "en"]) ||
           (window.TRANSLATIONS && window.TRANSLATIONS.en) || {};
  }

  // Bangladeshi number format: 12,34,567
  function formatBDT(n) {
    n = Math.round(n);
    var s = String(n);
    if (s.length <= 3) return s;
    var lastThree = s.slice(-3);
    var rest = s.slice(0, -3);
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return rest + "," + lastThree;
  }

  // ============ EMI Calculator ============
  function calcEMI() {
    var aEl = $("calcAmount"), rEl = $("calcRate"), tEl = $("calcTenor");
    if (!aEl || !rEl || !tEl) return;
    var P = parseFloat(aEl.value);
    var annualRate = parseFloat(rEl.value);
    var years = parseFloat(tEl.value);
    var n = years * 12;
    var r = annualRate / 12 / 100;
    var emi;
    if (r === 0) emi = P / n;
    else emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    var totalPayment = emi * n;
    var totalInterest = totalPayment - P;
    var dict = getDict();
    var yearWord = years === 1 ? (dict.calc_year || "year") : (dict.calc_years || "years");
    $("calcAmountVal").textContent = "৳ " + formatBDT(P);
    $("calcRateVal").textContent   = annualRate.toFixed(2) + "%";
    $("calcTenorVal").textContent  = years + " " + yearWord;
    $("calcEmi").textContent       = "৳ " + formatBDT(emi);
    $("calcInterest").textContent  = "৳ " + formatBDT(totalInterest);
    $("calcTotal").textContent     = "৳ " + formatBDT(totalPayment);
  }

  function showToast(text, isError) {
    var toast = document.createElement("div");
    toast.className = "form-toast";
    if (isError) toast.style.background = "#a23";
    toast.textContent = text;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add("show"); });
    setTimeout(function () {
      toast.classList.remove("show");
      setTimeout(function () { toast.remove(); }, 300);
    }, 4500);
  }

  // ============ Auto-comma formatter ============
  function attachAutoComma(input) {
    function reformat() {
      var oldValue  = input.value;
      var oldCursor = input.selectionStart || oldValue.length;
      var digitsBeforeCursor = oldValue.slice(0, oldCursor).replace(/\D/g, "").length;
      var raw = oldValue.replace(/\D/g, "");
      var formatted = raw === "" ? "" : formatBDT(parseInt(raw, 10));
      if (formatted === oldValue) return;
      input.value = formatted;
      var newCursor = 0, seen = 0;
      while (newCursor < formatted.length && seen < digitsBeforeCursor) {
        if (/\d/.test(formatted.charAt(newCursor))) seen++;
        newCursor++;
      }
      try { input.setSelectionRange(newCursor, newCursor); } catch (e) {}
    }
    input.addEventListener("input", reformat);
    if (input.value && /\d/.test(input.value)) reformat();
  }

  function initAutoComma() {
    $$('#loanForm input[inputmode="numeric"]').forEach(attachAutoComma);
  }

  // ============ Read purpose + mode from URL into hidden inputs, chip & title ============
  function initContextFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var purpose = params.get("purpose");
    var mode    = params.get("mode");
    if (purpose) {
      $$('input[name="purpose"]').forEach(function (el) { el.value = purpose; });
    }
    if (mode) {
      $$('input[name="financingMode"]').forEach(function (el) { el.value = mode; });
    }
    // Chip shows just the purpose (mode now lives in the H1)
    var chip = $("contextChip");
    if (chip && purpose) chip.textContent = purpose;
    // Append " | <mode> Financing" to the H1 product title
    if (mode) {
      var modeEl = $("titleMode");
      if (modeEl) {
        var key = mode === "Islamic" ? "modal_financing_islamic" : "modal_financing_conventional";
        modeEl.setAttribute("data-i18n", key);
        var dict = getDict();
        modeEl.textContent = dict[key] || (mode + " Financing");
      }
      var sep = document.querySelector(".apply-title .title-sep");
      if (sep) sep.hidden = false;
    }
  }

  // ============ Progress bar ============
  function initProgressBar() {
    var form = $("loanForm");
    var fill = $("formProgressFill");
    var text = $("formProgressText");
    if (!form || !fill || !text) return;

    function update() {
      var requiredNames = new Set();
      form.querySelectorAll("[required]").forEach(function (el) {
        requiredNames.add(el.name);
      });
      // Monthly loan burden only counts when hasBurden = yes
      var burdenChecked = form.querySelector('input[name="hasBurden"]:checked');
      var hasBurden = burdenChecked && burdenChecked.value === "yes";
      if (!hasBurden) requiredNames.delete("loanBurden");

      var filled = 0;
      requiredNames.forEach(function (name) {
        var els = form.querySelectorAll('[name="' + name + '"]');
        if (!els.length) return;
        var first = els[0];
        var has = false;
        if (first.type === "radio") {
          has = form.querySelector('input[name="' + name + '"]:checked') !== null;
        } else if (first.type === "checkbox") {
          has = first.checked;
        } else {
          has = first.value.trim() !== "";
        }
        if (has) filled++;
      });

      var pct = requiredNames.size ? Math.round(filled / requiredNames.size * 100) : 0;
      fill.style.width = pct + "%";
      text.textContent = pct + "%";
    }

    form.addEventListener("input", update);
    form.addEventListener("change", update);
    update();
  }

  // ============ Tracking number ============
  function generateTrackingNumber() {
    var d = new Date();
    var yy = String(d.getFullYear()).slice(-2);
    var mm = String(d.getMonth() + 1);
    if (mm.length < 2) mm = "0" + mm;
    var dd = String(d.getDate());
    if (dd.length < 2) dd = "0" + dd;
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var rand = "";
    for (var i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return "IDLC-" + yy + mm + dd + "-" + rand;
  }

  // ============ DOB bounds (18+ to 100) ============
  function initDobBounds() {
    var dob = document.querySelector('#otpForm input[name="dob"]');
    if (!dob) return;
    function fmt(d) {
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1);
      var da = String(d.getDate());
      if (m.length < 2) m = "0" + m;
      if (da.length < 2) da = "0" + da;
      return y + "-" + m + "-" + da;
    }
    var today = new Date();
    var max = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    var min = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    dob.setAttribute("max", fmt(max));
    dob.setAttribute("min", fmt(min));
  }

  // ============ Existing-client API simulation ============
  // If NID matches EXISTING_NID, pre-fill name/cif/email in loanForm; otherwise
  // copy name from the OTP gate (so the visitor doesn't re-type it).
  function applyClientLookup(otpForm, loanForm) {
    var nidInput  = otpForm.querySelector('input[name="nid"]');
    var nameOtp   = otpForm.querySelector('input[name="name"]');
    var nameLoan  = loanForm.querySelector('input[name="name"]');
    var cifInput  = loanForm.querySelector('input[name="cif"]');
    var emailInput= loanForm.querySelector('input[name="email"]');
    if (!nidInput) return;
    var nid = nidInput.value.trim();
    if (nid === EXISTING_NID) {
      if (nameLoan)   nameLoan.value   = EXISTING_CLIENT.name;
      if (cifInput)   cifInput.value   = EXISTING_CLIENT.cif;
      if (emailInput) emailInput.value = EXISTING_CLIENT.email;
    } else {
      // Carry over the name from OTP gate so the visitor doesn't retype it
      if (nameOtp && nameLoan && !nameLoan.value) nameLoan.value = nameOtp.value;
    }
  }

  // ============ OTP gate & multi-stage form ============
  function initOtpFlow() {
    var otpForm = $("otpForm");
    if (!otpForm) return;

    var nameInput  = otpForm.querySelector('input[name="name"]');
    var phoneInput = otpForm.querySelector('input[name="phone"]');
    var otpGroup   = otpForm.querySelector(".otp-group");
    var otpBoxes   = otpForm.querySelectorAll(".otp-boxes input");
    var otpError   = otpForm.querySelector(".otp-error");
    var otpBtn     = $("otpBtn");
    var loanForm   = $("loanForm");
    var stage      = "request";

    otpBoxes.forEach(function (box, idx) {
      box.addEventListener("input", function () {
        box.value = box.value.replace(/\D/g, "").slice(0, 1);
        box.classList.toggle("filled", !!box.value);
        if (box.value && idx < otpBoxes.length - 1) otpBoxes[idx + 1].focus();
      });
      box.addEventListener("keydown", function (e) {
        if (e.key === "Backspace" && !box.value && idx > 0) otpBoxes[idx - 1].focus();
      });
      box.addEventListener("paste", function (e) {
        e.preventDefault();
        var pasted = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 4);
        for (var i = 0; i < pasted.length && i < otpBoxes.length; i++) {
          otpBoxes[i].value = pasted[i];
          otpBoxes[i].classList.add("filled");
        }
        if (pasted.length === 4) otpBoxes[3].focus();
        else otpBoxes[Math.min(pasted.length, otpBoxes.length - 1)].focus();
      });
    });

    otpForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var dict = getDict();

      if (stage === "request") {
        if (nameInput && !nameInput.value.trim()) {
          nameInput.focus();
          showToast("Please enter your name.", true);
          return;
        }
        var nidInput = otpForm.querySelector('input[name="nid"]');
        if (nidInput && !/^[0-9]{10,17}$/.test(nidInput.value.trim())) {
          nidInput.focus();
          showToast("Please enter a valid NID number (10, 13, or 17 digits).", true);
          return;
        }
        var dobInput = otpForm.querySelector('input[name="dob"]');
        if (dobInput) {
          if (!dobInput.value) {
            dobInput.focus();
            showToast("Please enter your date of birth.", true);
            return;
          }
          var dob = new Date(dobInput.value);
          var today = new Date();
          var age = today.getFullYear() - dob.getFullYear();
          var monthDiff = today.getMonth() - dob.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
          if (isNaN(dob.getTime()) || age < 18 || age > 100) {
            dobInput.focus();
            showToast("Applicant must be at least 18 years old.", true);
            return;
          }
        }
        if (!/^01[0-9]{9}$/.test(phoneInput.value)) {
          phoneInput.focus();
          showToast("Please enter a valid Bangladeshi mobile number (01XXXXXXXXX).", true);
          return;
        }
        if (nameInput)  nameInput.setAttribute("readonly", "");
        if (nidInput)   nidInput.setAttribute("readonly", "");
        if (dobInput)   dobInput.setAttribute("readonly", "");
        phoneInput.setAttribute("readonly", "");
        otpGroup.hidden = false;
        otpError.hidden = true;
        otpBtn.textContent = dict.submit_otp || "Submit OTP";
        otpBtn.setAttribute("data-i18n", "submit_otp");
        stage = "verify";
        setTimeout(function () { otpBoxes[0].focus(); }, 80);
      } else {
        var entered = "";
        otpBoxes.forEach(function (box) { entered += box.value; });
        if (entered === DEMO_OTP) {
          otpForm.hidden = true;
          if (loanForm) {
            applyClientLookup(otpForm, loanForm);
            loanForm.hidden = false;
            // re-format auto-comma fields after population
            $$('#loanForm input[inputmode="numeric"]').forEach(function (el) {
              if (el.value && /\d/.test(el.value)) {
                el.dispatchEvent(new Event("input", { bubbles: true }));
              }
            });
            // refresh progress bar
            loanForm.dispatchEvent(new Event("input", { bubbles: true }));
            var firstField = loanForm.querySelector(".form-group");
            setTimeout(function () {
              if (firstField) firstField.scrollIntoView({ behavior: "smooth", block: "start" });
              else loanForm.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 80);
          }
        } else {
          otpError.hidden = false;
          otpBoxes.forEach(function (box) {
            box.value = "";
            box.classList.remove("filled");
          });
          otpBoxes[0].focus();
        }
      }
    });
  }

  // ============ Loan-burden Y/N toggle (show/hide Monthly Loan Burden) ============
  function initBurdenToggle() {
    var radios = $$('input[name="hasBurden"]');
    var burdenGroup = $("burdenGroup");
    if (!radios.length || !burdenGroup) return;
    radios.forEach(function (radio) {
      radio.addEventListener("change", function () {
        var show = radio.checked && radio.value === "yes";
        burdenGroup.hidden = !show;
        var inp = burdenGroup.querySelector("input");
        if (inp) {
          if (show) inp.setAttribute("required", "");
          else { inp.removeAttribute("required"); inp.value = ""; }
        }
      });
    });
  }

  // ============ Info button tooltips ============
  function initInfoButtons() {
    var btns = $$(".info-btn");
    if (!btns.length) return;
    var currentTip = null;
    function hideTip() { if (currentTip) { currentTip.remove(); currentTip = null; } }
    function showTip(btn) {
      hideTip();
      var key = btn.getAttribute("data-info");
      var dict = getDict();
      var text = (key && dict[key]) || btn.getAttribute("title") || "";
      if (!text) return;
      var tip = document.createElement("div");
      tip.className = "info-tooltip";
      tip.textContent = text;
      document.body.appendChild(tip);
      var rect = btn.getBoundingClientRect();
      var tipRect = tip.getBoundingClientRect();
      var top = rect.bottom + window.scrollY + 8;
      var left = rect.right - tipRect.width;
      if (left < 8) left = 8;
      tip.style.top = top + "px";
      tip.style.left = left + "px";
      currentTip = tip;
    }
    btns.forEach(function (btn) {
      btn.addEventListener("mouseenter", function () { showTip(btn); });
      btn.addEventListener("mouseleave", hideTip);
      btn.addEventListener("focus", function () { showTip(btn); });
      btn.addEventListener("blur", hideTip);
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (currentTip) hideTip();
        else showTip(btn);
      });
    });
    document.addEventListener("click", hideTip);
    document.addEventListener("scroll", hideTip, true);
    window.addEventListener("resize", hideTip);
  }

  // ============ Final submission: two declarations, tracking, success ============
  function initLoanForm() {
    var form = $("loanForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var dec1 = form.querySelector('input[name="declaration1"]');
      var dec2 = form.querySelector('input[name="declaration2"]');
      if ((dec1 && !dec1.checked) || (dec2 && !dec2.checked)) {
        var dict = getDict();
        showToast(dict.declarations_required || "Please accept both declarations to continue.", true);
        if (dec1 && !dec1.checked) dec1.focus();
        else if (dec2 && !dec2.checked) dec2.focus();
        return;
      }
      var success = $("formSuccess");
      var trackEl = $("trackingNumber");
      if (trackEl) trackEl.textContent = generateTrackingNumber();
      form.hidden = true;
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  function init() {
    initContextFromUrl();
    if ($("calcAmount")) {
      ["calcAmount", "calcRate", "calcTenor"].forEach(function (id) {
        $(id).addEventListener("input", calcEMI);
      });
      calcEMI();
      $$(".lang-btn").forEach(function (btn) {
        btn.addEventListener("click", function () { setTimeout(calcEMI, 60); });
      });
    }
    initDobBounds();
    initOtpFlow();
    initBurdenToggle();
    initInfoButtons();
    initAutoComma();
    initProgressBar();
    initLoanForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
