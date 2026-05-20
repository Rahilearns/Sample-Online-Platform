(function () {
  "use strict";

  var DEMO_OTP = "1234";
  var EXISTING_NID = "5102284394";
  var EXISTING_CLIENT = {
    name: "Mahfuzul Islam",
    cif: "553577",
    email: "Imahfuzul@gmail.com"
  };
  // Eligibility rules
  var RATE = 13;             // annual % for eligibility + applicant-side EMI projection
  var THRESHOLD = 0.70;      // total monthly load must be <= 70% of monthly income
  var MIN_LOAN = 2500000;    // BDT 25 lakh — minimum proposed loan if requested exceeds eligibility

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

  // EMI: P × r × (1+r)^n / ((1+r)^n − 1)  — zero-safe
  function computeEMI(P, annualRate, years) {
    var n = years * 12;
    var r = annualRate / 12 / 100;
    if (P <= 0 || n <= 0) return 0;
    if (r === 0) return P / n;
    return P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  }
  // Inverse: max loan principal for a given EMI ceiling
  function computeMaxLoan(maxEmi, annualRate, years) {
    var n = years * 12;
    var r = annualRate / 12 / 100;
    if (maxEmi <= 0 || n <= 0) return 0;
    if (r === 0) return maxEmi * n;
    return maxEmi * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
  }

  // ============ EMI Calculator (live sliders) ============
  function calcEMI() {
    var aEl = $("calcAmount"), rEl = $("calcRate"), tEl = $("calcTenor");
    if (!aEl || !rEl || !tEl) return;

    var P = parseFloat(aEl.value) || 0;
    var annualRate = parseFloat(rEl.value) || 0;
    var years = parseFloat(tEl.value) || 0;

    var emi = computeEMI(P, annualRate, years);
    var totalPayment = emi * years * 12;
    var totalInterest = totalPayment - P;
    if (totalInterest < 0) totalInterest = 0;

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
    $$('#loanForm input[inputmode="numeric"]').forEach(function (el) {
      // skip DOB day/year (small numbers, no commas)
      if (el.name === "dobDay" || el.name === "dobYear") return;
      attachAutoComma(el);
    });
  }

  // ============ URL params → hidden inputs + chip + title mode ============
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
    var chip = $("contextChip");
    if (chip && purpose) chip.textContent = purpose;
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
    var mm = String(d.getMonth() + 1); if (mm.length < 2) mm = "0" + mm;
    var dd = String(d.getDate());      if (dd.length < 2) dd = "0" + dd;
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var rand = "";
    for (var i = 0; i < 4; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
    return "IDLC-" + yy + mm + dd + "-" + rand;
  }

  // ============ Existing-client API simulation ============
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
      if (nameOtp && nameLoan && !nameLoan.value) nameLoan.value = nameOtp.value;
    }
  }

  // ============ DOB (3 fields) validation helper ============
  function validateDob(dobDay, dobMonth, dobYear) {
    var day   = parseInt(dobDay.value,   10);
    var month = parseInt(dobMonth.value, 10);
    var year  = parseInt(dobYear.value,  10);
    if (!day || !month || !year) {
      return { ok: false, focus: !day ? dobDay : (!month ? dobMonth : dobYear), msg: "Please enter your date of birth (day, month, and year)." };
    }
    var dob = new Date(year, month - 1, day);
    if (dob.getFullYear() !== year || dob.getMonth() !== month - 1 || dob.getDate() !== day) {
      return { ok: false, focus: dobDay, msg: "Please enter a valid date of birth." };
    }
    var today = new Date();
    var age = today.getFullYear() - dob.getFullYear();
    var md = today.getMonth() - dob.getMonth();
    if (md < 0 || (md === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 18 || age > 100) {
      return { ok: false, focus: dobYear, msg: "Applicant must be at least 18 years old." };
    }
    return { ok: true };
  }

  // ============ OTP gate ============
  function initOtpFlow() {
    var otpForm = $("otpForm");
    if (!otpForm) return;

    var nameInput  = otpForm.querySelector('input[name="name"]');
    var phoneInput = otpForm.querySelector('input[name="phone"]');
    var dobDay     = otpForm.querySelector('input[name="dobDay"]');
    var dobMonth   = otpForm.querySelector('select[name="dobMonth"]');
    var dobYear    = otpForm.querySelector('input[name="dobYear"]');
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
          nameInput.focus(); showToast("Please enter your name.", true); return;
        }
        var nidInput = otpForm.querySelector('input[name="nid"]');
        if (nidInput && !/^[0-9]{10,17}$/.test(nidInput.value.trim())) {
          nidInput.focus();
          showToast("Please enter a valid NID number (10, 13, or 17 digits).", true);
          return;
        }
        if (dobDay && dobMonth && dobYear) {
          var dobCheck = validateDob(dobDay, dobMonth, dobYear);
          if (!dobCheck.ok) { dobCheck.focus.focus(); showToast(dobCheck.msg, true); return; }
        }
        if (!/^01[0-9]{9}$/.test(phoneInput.value)) {
          phoneInput.focus();
          showToast("Please enter a valid Bangladeshi mobile number (01XXXXXXXXX).", true);
          return;
        }

        if (nameInput) nameInput.setAttribute("readonly", "");
        if (nidInput)  nidInput.setAttribute("readonly", "");
        if (dobDay)    dobDay.setAttribute("readonly", "");
        if (dobMonth)  dobMonth.setAttribute("disabled", "");
        if (dobYear)   dobYear.setAttribute("readonly", "");
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
            $$('#loanForm input[inputmode="numeric"]').forEach(function (el) {
              if (el.value && /\d/.test(el.value) && el.name !== "dobDay" && el.name !== "dobYear") {
                el.dispatchEvent(new Event("input", { bubbles: true }));
              }
            });
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

  // ============ Loan-burden Y/N toggle ============
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

  // ============ Sync EMI calculator from form fields ============
  // When the visitor types into Expected Loan Amount or Loan Term, mirror those
  // values into the calculator sliders (rate is locked to RATE for the projection).
  // The applicant can still drag the sliders afterwards without touching the form.
  function syncCalcFromForm() {
    var loanForm = $("loanForm");
    if (!loanForm || loanForm.hidden) return;
    var amountField = loanForm.querySelector('input[name="amount"]');
    var tenorField  = loanForm.querySelector('input[name="tenor"]');
    var calcAmount  = $("calcAmount");
    var calcTenor   = $("calcTenor");
    var calcRate    = $("calcRate");
    if (calcAmount && amountField) {
      var amt = parseInt((amountField.value || "").replace(/,/g, ""), 10) || 0;
      // clamp to slider's max
      var maxA = parseFloat(calcAmount.max) || amt;
      calcAmount.value = Math.min(amt, maxA);
    }
    if (calcTenor && tenorField) {
      var t = parseInt((tenorField.value || "").replace(/,/g, ""), 10) || 0;
      var maxT = parseFloat(calcTenor.max) || t;
      calcTenor.value = Math.min(t, maxT);
    }
    if (calcRate) calcRate.value = RATE;
    calcEMI();
  }
  function initFormCalcSync() {
    var loanForm = $("loanForm");
    if (!loanForm) return;
    var amt = loanForm.querySelector('input[name="amount"]');
    var ten = loanForm.querySelector('input[name="tenor"]');
    if (amt) amt.addEventListener("input", syncCalcFromForm);
    if (ten) ten.addEventListener("input", syncCalcFromForm);
  }

  // ============ Eligibility check on Submit ============
  function checkEligibility(form) {
    function num(name) {
      var el = form.querySelector('input[name="' + name + '"]');
      if (!el) return 0;
      return parseInt((el.value || "0").replace(/,/g, ""), 10) || 0;
    }
    var income          = num("income");
    var burdenChecked   = form.querySelector('input[name="hasBurden"]:checked');
    var hasBurden       = burdenChecked && burdenChecked.value === "yes";
    var monthlyBurden   = hasBurden ? num("loanBurden") : 0;
    var expectedAmount  = num("amount");
    var years           = num("tenor");
    var maxLoad         = income * THRESHOLD;

    // Even before computing new EMI, if existing burden already exceeds 70%, reject
    if (monthlyBurden > maxLoad) return { status: "over_burden" };

    var newEmi    = computeEMI(expectedAmount, RATE, years);
    var totalLoad = newEmi + monthlyBurden;

    if (totalLoad <= maxLoad) {
      return { status: "eligible", amount: expectedAmount };
    }

    // Requested amount is too high. Find the max loan that still fits the threshold.
    var roomForNewEmi = maxLoad - monthlyBurden;
    if (roomForNewEmi <= 0) return { status: "over_burden" };

    var maxLoan = computeMaxLoan(roomForNewEmi, RATE, years);
    maxLoan = Math.floor(maxLoan / 1000) * 1000;  // round down to nearest BDT 1,000

    if (maxLoan >= MIN_LOAN) {
      return { status: "reduced", amount: maxLoan };
    }
    return { status: "ineligible" };
  }

  var SVG_OK = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>';
  var SVG_WARN = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3L1 21h22L12 3z"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="12" y1="17" x2="12" y2="17.5"/></svg>';

  function showResult(form, result) {
    var dict = getDict();
    var success = $("formSuccess");
    var titleEl = $("formSuccessTitle");
    var msgEl   = $("formSuccessMsg");
    var iconEl  = $("formSuccessIcon");
    var tracking= $("formSuccessTracking");

    if (result.status === "eligible" || result.status === "reduced") {
      success.classList.remove("is-warning");
      iconEl.innerHTML = SVG_OK;
      titleEl.setAttribute("data-i18n", "app_submitted_title");
      titleEl.textContent = dict.app_submitted_title || "Application Submitted";
      var amountText = formatBDT(result.amount || 0);
      var tpl = dict.eligibility_eligible_html ||
        "Congratulations, you are eligible for the requested loan amount of BDT <strong>{amount}</strong>, subject to authenticity of your given information, further credit assessment from IDLC, and authenticity &amp; validity of the required documents.";
      msgEl.removeAttribute("data-i18n");
      msgEl.setAttribute("data-i18n-html", "eligibility_eligible_html");
      msgEl.dataset.amount = amountText;
      msgEl.innerHTML = tpl.replace("{amount}", amountText);
      if (tracking) tracking.hidden = false;
      var trackCode = $("trackingNumber");
      if (trackCode) trackCode.textContent = generateTrackingNumber();
    } else {
      // over_burden or ineligible — show warning state
      success.classList.add("is-warning");
      iconEl.innerHTML = SVG_WARN;
      titleEl.setAttribute("data-i18n", "app_ineligible_title");
      titleEl.textContent = dict.app_ineligible_title || "Application Could Not Be Processed";
      msgEl.removeAttribute("data-i18n-html");
      msgEl.setAttribute("data-i18n", "eligibility_ineligible");
      msgEl.textContent = dict.eligibility_ineligible ||
        "Your monthly income will not cover your loan burden and IDLC's risk appetite.";
      if (tracking) tracking.hidden = true;
    }

    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  }

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
      var result = checkEligibility(form);
      showResult(form, result);
    });
  }

  // Translate dynamic placeholders that use `data-i18n-placeholder`
  function applyPlaceholderTranslations() {
    var dict = getDict();
    $$('input[data-i18n-placeholder], select[data-i18n-placeholder], textarea[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (key && dict[key] != null) el.setAttribute("placeholder", dict[key]);
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
        btn.addEventListener("click", function () {
          setTimeout(function () {
            calcEMI();
            applyPlaceholderTranslations();
          }, 60);
        });
      });
    }
    applyPlaceholderTranslations();
    initOtpFlow();
    initBurdenToggle();
    initInfoButtons();
    initAutoComma();
    initProgressBar();
    initFormCalcSync();
    initLoanForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
