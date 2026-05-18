(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  // Bangladeshi number format: 12,34,567 (last 3 digits, then groups of 2)
  function formatBDT(n) {
    n = Math.round(n);
    var s = String(n);
    if (s.length <= 3) return s;
    var lastThree = s.slice(-3);
    var rest = s.slice(0, -3);
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return rest + ',' + lastThree;
  }

  function calcEMI() {
    var aEl = $('calcAmount'), rEl = $('calcRate'), tEl = $('calcTenor');
    if (!aEl || !rEl || !tEl) return;

    var P = parseFloat(aEl.value);
    var annualRate = parseFloat(rEl.value);
    var years = parseFloat(tEl.value);
    var n = years * 12;
    var r = annualRate / 12 / 100;

    var emi, totalPayment, totalInterest;
    if (r === 0) {
      emi = P / n;
    } else {
      emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    }
    totalPayment = emi * n;
    totalInterest = totalPayment - P;

    var dict = (window.TRANSLATIONS &&
                window.TRANSLATIONS[document.documentElement.lang || 'en']) ||
               (window.TRANSLATIONS && window.TRANSLATIONS.en) || {};
    var yearWord = years === 1 ? (dict.calc_year || 'year') : (dict.calc_years || 'years');

    $('calcAmountVal').textContent = '৳ ' + formatBDT(P);
    $('calcRateVal').textContent   = annualRate.toFixed(2) + '%';
    $('calcTenorVal').textContent  = years + ' ' + yearWord;
    $('calcEmi').textContent       = '৳ ' + formatBDT(emi);
    $('calcInterest').textContent  = '৳ ' + formatBDT(totalInterest);
    $('calcTotal').textContent     = '৳ ' + formatBDT(totalPayment);
  }

  function bindForm() {
    var form = $('loanForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var dict = (window.TRANSLATIONS &&
                  window.TRANSLATIONS[document.documentElement.lang || 'en']) ||
                 (window.TRANSLATIONS && window.TRANSLATIONS.en) || {};
      var msg = dict.form_thanks ||
        'Thank you! Your application has been received. Our team will contact you within 24 hours.';
      var toast = document.createElement('div');
      toast.className = 'form-toast';
      toast.textContent = msg;
      document.body.appendChild(toast);
      requestAnimationFrame(function () { toast.classList.add('show'); });
      setTimeout(function () {
        toast.classList.remove('show');
        setTimeout(function () { toast.remove(); }, 300);
      }, 5000);
      form.reset();
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function init() {
    if ($('calcAmount')) {
      ['calcAmount', 'calcRate', 'calcTenor'].forEach(function (id) {
        $(id).addEventListener('input', calcEMI);
      });
      calcEMI();
    }
    bindForm();

    // Re-run calculator when language changes (to update year/years word)
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { setTimeout(calcEMI, 50); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
