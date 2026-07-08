(function () {
  "use strict";

  var DEMO_OTP = "1234";
  var EXISTING_NID = "5102284394";
  var EXISTING_CLIENT = {
    name: "Mahfuzul Islam",
    cif: "553577",
    email: "Imahfuzul@gmail.com"
  };
  // Eligibility rules — DBR (Debt Burden Ratio) engine
  var RATE = 13;             // annual % for eligibility + applicant-side EMI projection
  var REGRET_RATIO = 0.10;   // offer below 10% of the requested amount → regret message
  // Max allowable DBR by profession group and monthly income band.
  // Bands are [upper bound (inclusive), DBR]; income above the last finite bound
  // falls into the Infinity band.
  var DBR_BANDS = {
    A: [[60000, 0.45], [100000, 0.55], [Infinity, 0.60]], // Salaried (Govt.), Salaried (Private), Self Employed
    B: [[60000, 0.45], [100000, 0.50], [Infinity, 0.55]], // Landlord, Service Holder (NRB)
    C: [[100000, 0.45], [Infinity, 0.55]]                 // Businessperson, Businessperson (NRB)
  };
  var PROFESSION_GROUP = {
    "salaried-govt": "A", "salaried-private": "A", "self-employed": "A",
    "landlord": "B", "nrb-service": "B",
    "businessperson": "C", "nrb-business": "C"
  };
  function lookupDbr(profession, income) {
    var group = PROFESSION_GROUP[profession];
    if (!group || income <= 0) return null;
    var bands = DBR_BANDS[group];
    for (var i = 0; i < bands.length; i++) {
      if (income <= bands[i][0]) return bands[i][1];
    }
    return null;
  }

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

  // ---- Amount in words (Indian numbering: crore / lakh / thousand) ----
  var EN_ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  var EN_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function enBelowHundred(n) {
    if (n < 20) return EN_ONES[n];
    return EN_TENS[Math.floor(n / 10)] + (n % 10 ? " " + EN_ONES[n % 10] : "");
  }
  function enWords(n) {
    if (n === 0) return "Zero";
    var parts = [];
    if (n >= 1e7)  { parts.push(enWords(Math.floor(n / 1e7)) + " Crore"); n %= 1e7; }
    if (n >= 1e5)  { parts.push(enBelowHundred(Math.floor(n / 1e5)) + " Lakh"); n %= 1e5; }
    if (n >= 1000) { parts.push(enBelowHundred(Math.floor(n / 1000)) + " Thousand"); n %= 1000; }
    if (n >= 100)  { parts.push(EN_ONES[Math.floor(n / 100)] + " Hundred"); n %= 100; }
    if (n > 0) parts.push(enBelowHundred(n));
    return parts.join(" ");
  }
  var BN_BELOW_HUNDRED = ["শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ",
    "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ", "বিশ",
    "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আঠাশ", "ঊনত্রিশ", "ত্রিশ",
    "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাঁইত্রিশ", "আটত্রিশ", "ঊনচল্লিশ", "চল্লিশ",
    "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছেচল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "ঊনপঞ্চাশ", "পঞ্চাশ",
    "একান্ন", "বায়ান্ন", "তিপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "ঊনষাট", "ষাট",
    "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছেষট্টি", "সাতষট্টি", "আটষট্টি", "ঊনসত্তর", "সত্তর",
    "একাত্তর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "ঊনআশি", "আশি",
    "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "আটাশি", "ঊননব্বই", "নব্বই",
    "একানব্বই", "বিরানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই"];
  function bnWords(n) {
    if (n === 0) return BN_BELOW_HUNDRED[0];
    var parts = [];
    if (n >= 1e7)  { parts.push(bnWords(Math.floor(n / 1e7)) + " কোটি"); n %= 1e7; }
    if (n >= 1e5)  { parts.push(BN_BELOW_HUNDRED[Math.floor(n / 1e5)] + " লাখ"); n %= 1e5; }
    if (n >= 1000) { parts.push(BN_BELOW_HUNDRED[Math.floor(n / 1000)] + " হাজার"); n %= 1000; }
    if (n >= 100)  { parts.push(BN_BELOW_HUNDRED[Math.floor(n / 100)] + " শত"); n %= 100; }
    if (n > 0) parts.push(BN_BELOW_HUNDRED[n]);
    return parts.join(" ");
  }
  function amountInWords(n, lang) {
    n = Math.floor(n);
    if (lang === "bn") return bnWords(n) + " টাকা মাত্র";
    return "Taka " + enWords(n) + " Only";
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

  // ============ EMI Calculator (free-form text inputs) ============
  function calcEMI() {
    var aEl = $("calcAmount"), rEl = $("calcRate"), tEl = $("calcTenor");
    if (!aEl || !rEl || !tEl) return;

    var P = parseFloat((aEl.value || "0").replace(/,/g, "")) || 0;
    var annualRate = parseFloat(rEl.value) || 0;
    var years = parseFloat(tEl.value) || 0;

    var emi = computeEMI(P, annualRate, years);
    var totalPayment = emi * years * 12;
    var totalInterest = totalPayment - P;
    if (totalInterest < 0) totalInterest = 0;

    // Legacy display spans (only present if HTML still uses the slider layout)
    var av = $("calcAmountVal"); if (av) av.textContent = "৳ " + formatBDT(P);
    var rv = $("calcRateVal");   if (rv) rv.textContent = annualRate.toFixed(2) + "%";
    var tv = $("calcTenorVal");  if (tv) {
      var dict = getDict();
      var yw = years === 1 ? (dict.calc_year || "year") : (dict.calc_years || "years");
      tv.textContent = years + " " + yw;
    }
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
      if (el.name === "dobDay" || el.name === "dobYear") return;
      attachAutoComma(el);
    });
    var calcAmount = $("calcAmount");
    if (calcAmount && calcAmount.tagName === "INPUT" && calcAmount.type === "text") {
      attachAutoComma(calcAmount);
    }
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

  // ============ DOB (3 dropdowns) — populate + dynamic day clamping ============
  // All three start blank. Day options are only populated once both Month and Year
  // are picked; selecting an out-of-range day in a new month auto-clamps it.
  function initDobDropdowns() {
    var daySel   = document.querySelector('#otpForm select[name="dobDay"]');
    var monthSel = document.querySelector('#otpForm select[name="dobMonth"]');
    var yearSel  = document.querySelector('#otpForm select[name="dobYear"]');
    if (!daySel || !monthSel || !yearSel) return;

    function pad(n) { return n < 10 ? "0" + n : String(n); }

    function blankOption() {
      var o = document.createElement("option");
      o.value = "";
      o.hidden = true;
      o.selected = true;
      return o;
    }

    var today = new Date();
    var maxYear = today.getFullYear() - 18;
    var minYear = today.getFullYear() - 100;

    // Populate Year (blank default, then most recent → oldest)
    yearSel.innerHTML = "";
    yearSel.appendChild(blankOption());
    for (var y = maxYear; y >= minYear; y--) {
      var yOpt = document.createElement("option");
      yOpt.value = String(y);
      yOpt.textContent = String(y);
      yearSel.appendChild(yOpt);
    }

    // Day is always available (1..31 by default). Once Month is picked, the
    // range narrows to that month's max; once Year is also picked, leap-year
    // is honored. Previously-selected day is clamped if it no longer fits.
    function updateDays() {
      var prevDay = parseInt(daySel.value, 10);
      var maxDay = 31;
      if (monthSel.value) {
        var month = parseInt(monthSel.value, 10);
        if (yearSel.value) {
          var year = parseInt(yearSel.value, 10);
          maxDay = new Date(year, month, 0).getDate();
        } else {
          // No year picked yet — use the month's "max possible" (29 for Feb)
          if (month === 2) maxDay = 29;
          else if ([4, 6, 9, 11].indexOf(month) >= 0) maxDay = 30;
        }
      }
      daySel.innerHTML = "";
      daySel.appendChild(blankOption());
      for (var d = 1; d <= maxDay; d++) {
        var dOpt = document.createElement("option");
        dOpt.value = pad(d);
        dOpt.textContent = String(d);
        daySel.appendChild(dOpt);
      }
      if (prevDay && !isNaN(prevDay)) {
        var newDay = Math.min(prevDay, maxDay);
        daySel.value = pad(newDay);
      }
    }
    updateDays();
    monthSel.addEventListener("change", updateDays);
    yearSel.addEventListener("change", updateDays);
  }

  function validateDob(dobDay, dobMonth, dobYear) {
    if (!dobDay.value || !dobMonth.value || !dobYear.value) {
      var focusEl = !dobDay.value ? dobDay : (!dobMonth.value ? dobMonth : dobYear);
      return { ok: false, focus: focusEl, msg: "Please select your date of birth (day, month and year)." };
    }
    var day   = parseInt(dobDay.value,   10);
    var month = parseInt(dobMonth.value, 10);
    var year  = parseInt(dobYear.value,  10);
    var dob = new Date(year, month - 1, day);
    if (dob.getFullYear() !== year || dob.getMonth() !== month - 1 || dob.getDate() !== day) {
      return { ok: false, focus: dobDay, msg: "Please select a valid date of birth." };
    }
    var today = new Date();
    var age = today.getFullYear() - dob.getFullYear();
    var md = today.getMonth() - dob.getMonth();
    if (md < 0 || (md === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 18 || age > 100) {
      var dict = getDict();
      return { ok: false, focus: dobYear, msg: dict.dob_age_required || "Applicants must be at least 18 years of age to submit this loan application." };
    }
    return { ok: true };
  }

  // ============ OTP gate ============
  function initOtpFlow() {
    var otpForm = $("otpForm");
    if (!otpForm) return;

    var nameInput  = otpForm.querySelector('input[name="name"]');
    var phoneInput = otpForm.querySelector('input[name="phone"]');
    var dobDay     = otpForm.querySelector('select[name="dobDay"]');
    var dobMonth   = otpForm.querySelector('select[name="dobMonth"]');
    var dobYear    = otpForm.querySelector('select[name="dobYear"]');
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
        if (dobDay)    dobDay.setAttribute("disabled", "");
        if (dobMonth)  dobMonth.setAttribute("disabled", "");
        if (dobYear)   dobYear.setAttribute("disabled", "");
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
            // Scroll to the TOP of the application-form card (h2 "Application Form")
            var formCard = loanForm.closest(".loan-form-card") || loanForm.parentElement;
            setTimeout(function () {
              if (formCard) formCard.scrollIntoView({ behavior: "smooth", block: "start" });
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
      calcAmount.value = amountField.value || "";
      calcAmount.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (calcTenor && tenorField) {
      calcTenor.value = (tenorField.value || "").replace(/,/g, "");
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

  // ============ Eligibility check on Submit (DBR engine) ============
  // 1. Look up max allowable DBR from the matrix (profession × income band).
  // 2. Max total EMI = DBR × income; headroom for the new EMI = that minus existing burden.
  // 3. Back-calculate the max eligible principal at RATE over the requested tenure.
  // 4. Requested ≤ max → approve requested; otherwise offer the max —
  //    unless the max is below REGRET_RATIO of the requested amount → regret.
  function checkEligibility(form) {
    function num(name) {
      var el = form.querySelector('input[name="' + name + '"]');
      if (!el) return 0;
      return parseInt((el.value || "0").replace(/,/g, ""), 10) || 0;
    }
    var professionEl  = form.querySelector('select[name="profession"]');
    var profession    = professionEl ? professionEl.value : "";
    var income        = num("income");
    var burdenChecked = form.querySelector('input[name="hasBurden"]:checked');
    var hasBurden     = burdenChecked && burdenChecked.value === "yes";
    var monthlyBurden = hasBurden ? num("loanBurden") : 0;
    var requested     = num("amount");
    var years         = num("tenor");

    var dbr = lookupDbr(profession, income);
    if (dbr == null) return { status: "ineligible" };

    var maxNewEmi = dbr * income - monthlyBurden;
    if (maxNewEmi <= 0) return { status: "ineligible" };

    var maxLoan = Math.floor(computeMaxLoan(maxNewEmi, RATE, years));
    if (maxLoan <= 0 || maxLoan < requested * REGRET_RATIO) {
      return { status: "ineligible" };
    }
    if (requested <= maxLoan) {
      return { status: "eligible", amount: requested };
    }
    return { status: "reduced", amount: maxLoan };
  }

  var SVG_OK = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>';
  var SVG_WARN = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3L1 21h22L12 3z"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="12" y1="17" x2="12" y2="17.5"/></svg>';

  // Result of the last submission, kept so the message (amount + amount-in-words)
  // can be re-rendered in the newly selected language on toggle.
  var lastResult = null;

  function renderResultMessage() {
    if (!lastResult) return;
    if (lastResult.status !== "eligible" && lastResult.status !== "reduced") return;
    var msgEl = $("formSuccessMsg");
    if (!msgEl) return;
    var dict = getDict();
    var lang = document.documentElement.getAttribute("lang") || "en";
    var tplKey, tplFallback;
    if (lastResult.status === "eligible") {
      tplKey = "eligibility_eligible_html";
      tplFallback = "Congratulations, you are eligible for the requested loan amount of BDT <strong>{amount}</strong> ({amount_words}), subject to authenticity of your given information, further credit assessment from IDLC, and authenticity &amp; validity of the required documents.";
    } else {
      tplKey = "eligibility_reduced_html";
      tplFallback = "Congratulations, you are eligible for a maximum loan amount of BDT <strong>{amount}</strong> ({amount_words}) from IDLC, subject to authenticity of your given information, further credit assessment from IDLC, and authenticity &amp; validity of the required documents.";
    }
    var tpl = dict[tplKey] || tplFallback;
    msgEl.innerHTML = tpl
      .replace("{amount}", formatBDT(lastResult.amount || 0))
      .replace("{amount_words}", amountInWords(lastResult.amount || 0, lang));
  }

  function showResult(form, result) {
    var dict = getDict();
    var success = $("formSuccess");
    var titleEl = $("formSuccessTitle");
    var msgEl   = $("formSuccessMsg");
    var iconEl  = $("formSuccessIcon");
    var tracking= $("formSuccessTracking");
    lastResult = result;

    if (result.status === "eligible" || result.status === "reduced") {
      success.classList.remove("is-warning");
      iconEl.innerHTML = SVG_OK;
      titleEl.setAttribute("data-i18n", "app_submitted_title");
      titleEl.textContent = dict.app_submitted_title || "Application Submitted";
      // No data-i18n-html here: the message carries substituted values, so it is
      // re-rendered by renderResultMessage() on language toggle instead.
      msgEl.removeAttribute("data-i18n");
      msgEl.removeAttribute("data-i18n-html");
      renderResultMessage();
      if (tracking) tracking.hidden = false;
      var trackCode = $("trackingNumber");
      if (trackCode) trackCode.textContent = generateTrackingNumber();
    } else {
      // ineligible — show warning state with the regret message
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
            renderResultMessage();
          }, 60);
        });
      });
    }
    applyPlaceholderTranslations();
    initDobDropdowns();
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
