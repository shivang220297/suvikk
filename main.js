/* ══════════════════════════════════════════════════════════
   SUVIKK — main.js
   1. JS-ready class + Scroll Reveal (IntersectionObserver)
   2. Nav scroll shadow
   3. Custom cursor (triple touch guard — desktop only)
   4. WhatsApp bubble show/hide
   5. Lead gen popup — 30s trigger, localStorage once-per-browser
   6. Popup tab toggle (Email / WhatsApp)
   7. Popup form: validate → step 2 → copy code
   ——————————————————————————————————————————————————————————
   BACKEND NOTE (OTP integration):
   To wire up real OTP verification, replace the
   handleLeadSubmit() stub with an API call to:
     - MSG91 (India, WhatsApp OTP): msg91.com
     - Twilio Verify (email + SMS): twilio.com/verify
     - Firebase Auth (phone OTP): firebase.google.com
   The popup UI is already step-based — just insert
   an OTP input step between Step 1 and Step 2.
══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── 1. JS-READY + SCROLL REVEAL ─────────────────────── */
  document.body.classList.add('js-ready');

  var revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -30px 0px' }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ── 2. NAV SCROLL SHADOW ─────────────────────────────── */
  var nav = document.getElementById('mainNav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 3. CUSTOM CURSOR (triple touch guard) ────────────── */
  var isPointerFine  = window.matchMedia('(pointer: fine)').matches;
  var noTouchStart   = !('ontouchstart' in window);
  var noTouchPoints  = (navigator.maxTouchPoints === 0);

  if (isPointerFine && noTouchStart && noTouchPoints) {
    document.body.classList.add('has-cursor');

    var dot  = document.getElementById('cDot');
    var ring = document.getElementById('cRing');
    var mx = -200, my = -200, rx = -200, ry = -200;

    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });

    function lerp(a, b, t) { return a + (b - a) * t; }
    function loop() {
      rx = lerp(rx, mx, 0.11);
      ry = lerp(ry, my, 0.11);
      if (dot)  { dot.style.left  = mx + 'px'; dot.style.top  = my + 'px'; }
      if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.querySelectorAll('a, button, .btn, .card, .lookbook__placeholder').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        if (ring) { ring.style.width = '50px'; ring.style.height = '50px'; }
      });
      el.addEventListener('mouseleave', function () {
        if (ring) { ring.style.width = '32px'; ring.style.height = '32px'; }
      });
    });

    document.addEventListener('mouseleave', function () {
      if (dot)  dot.style.opacity  = '0';
      if (ring) ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      if (dot)  dot.style.opacity  = '1';
      if (ring) ring.style.opacity = '1';
    });
  }

  /* ── 4. WHATSAPP BUBBLE ───────────────────────────────── */
  var bubble  = document.getElementById('waBubble');
  var waFloat = document.getElementById('waFloat');

  if (bubble) {
    setTimeout(function () {
      bubble.classList.add('visible');
      setTimeout(function () { bubble.classList.remove('visible'); }, 5000);
    }, 3000);
    if (waFloat) {
      waFloat.addEventListener('click', function () {
        bubble.classList.remove('visible');
      });
    }
  }

  /* ── 5. LEAD GEN POPUP ────────────────────────────────── */
  var POPUP_KEY        = 'suvikk_lead_captured';
  var POPUP_SHOWN_KEY  = 'suvikk_popup_shown';
  var popupOverlay     = document.getElementById('leadPopupOverlay');
  var popupCloseBtn    = document.getElementById('leadPopupClose');

  function openPopup() {
    if (!popupOverlay) return;
    popupOverlay.classList.add('popup--visible');
    document.body.style.overflow = 'hidden';
    /* Mark as shown so it doesn't appear again this session */
    try { sessionStorage.setItem(POPUP_SHOWN_KEY, '1'); } catch(e) {}
  }

  function closePopup() {
    if (!popupOverlay) return;
    popupOverlay.classList.remove('popup--visible');
    document.body.style.overflow = '';
  }

  /* Only show if not already captured AND not shown this session */
  function shouldShowPopup() {
    try {
      if (localStorage.getItem(POPUP_KEY)) return false;
      if (sessionStorage.getItem(POPUP_SHOWN_KEY)) return false;
    } catch(e) {}
    return true;
  }

  /* 30-second trigger */
  if (popupOverlay && shouldShowPopup()) {
    setTimeout(function () {
      if (shouldShowPopup()) openPopup();
    }, 30000);
  }

  /* Close on overlay click */
  if (popupOverlay) {
    popupOverlay.addEventListener('click', function (e) {
      if (e.target === popupOverlay) closePopup();
    });
  }

  /* Close button */
  if (popupCloseBtn) {
    popupCloseBtn.addEventListener('click', closePopup);
  }

  /* Close on Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePopup();
  });

  /* ── 6. POPUP TAB TOGGLE (Email / WhatsApp) ───────────── */
  var tabEmail     = document.getElementById('tabEmail');
  var tabPhone     = document.getElementById('tabPhone');
  var emailField   = document.getElementById('emailField');
  var phoneField   = document.getElementById('phoneField');
  var activeTab    = 'email';

  function setActiveTab(tab) {
    activeTab = tab;
    if (tab === 'email') {
      tabEmail.classList.add('popup-tab--active');
      tabPhone.classList.remove('popup-tab--active');
      emailField.classList.remove('popup-field--hidden');
      phoneField.classList.add('popup-field--hidden');
    } else {
      tabPhone.classList.add('popup-tab--active');
      tabEmail.classList.remove('popup-tab--active');
      phoneField.classList.remove('popup-field--hidden');
      emailField.classList.add('popup-field--hidden');
    }
    clearError();
  }

  if (tabEmail) tabEmail.addEventListener('click', function () { setActiveTab('email'); });
  if (tabPhone) tabPhone.addEventListener('click', function () { setActiveTab('phone'); });

  /* ── 7. POPUP FORM SUBMIT ─────────────────────────────── */
  var submitBtn   = document.getElementById('leadSubmitBtn');
  var popupStep1  = document.getElementById('popupStep1');
  var popupStep2  = document.getElementById('popupStep2');
  var leadEmail   = document.getElementById('leadEmail');
  var leadPhone   = document.getElementById('leadPhone');

  function showError(inputEl, msg) {
    clearError();
    inputEl.classList.add('input--error');
    var err = document.createElement('p');
    err.className = 'popup-error-msg';
    err.id = 'popupErrMsg';
    err.textContent = msg;
    inputEl.parentNode.insertBefore(err, inputEl.nextSibling);
  }

  function clearError() {
    var prev = document.getElementById('popupErrMsg');
    if (prev) prev.remove();
    if (leadEmail) leadEmail.classList.remove('input--error');
    if (leadPhone) leadPhone.classList.remove('input--error');
  }

  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }
  function validatePhone(v) {
    return /^[6-9]\d{9}$/.test(v.replace(/\s/g, ''));
  }

  function handleLeadSubmit() {
    clearError();
    var value, type;

    if (activeTab === 'email') {
      value = leadEmail ? leadEmail.value : '';
      if (!validateEmail(value)) {
        showError(leadEmail, 'Please enter a valid email address.');
        return;
      }
      type = 'email';
    } else {
      value = leadPhone ? leadPhone.value : '';
      if (!validatePhone(value)) {
        showError(leadPhone, 'Please enter a valid 10-digit WhatsApp number.');
        return;
      }
      type = 'phone';
    }

    /* ─ Store lead locally ─ */
    try {
      var leads = JSON.parse(localStorage.getItem('suvikk_leads') || '[]');
      leads.push({ type: type, value: value.trim(), ts: new Date().toISOString() });
      localStorage.setItem('suvikk_leads', JSON.stringify(leads));
      localStorage.setItem(POPUP_KEY, '1');
    } catch(e) {}

    /* ─ BACKEND HOOK (optional) ─
       Replace the block below with your API call:
       fetch('https://your-api.com/leads', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ type, value })
       });
       For Formspree: fetch('https://formspree.io/f/YOUR_ID', ...)
       For MSG91 OTP:  insert OTP step here before showing Step 2.
    ─ */

    /* Show step 2 — discount code */
    if (popupStep1 && popupStep2) {
      popupStep1.classList.add('popup-step--hidden');
      popupStep2.classList.remove('popup-step--hidden');
    }
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', handleLeadSubmit);
  }

  /* Submit on Enter key in inputs */
  [leadEmail, leadPhone].forEach(function (inp) {
    if (!inp) return;
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleLeadSubmit();
    });
  });

  /* ── 8. COPY DISCOUNT CODE ────────────────────────────── */
  var copyBtn    = document.getElementById('copyCodeBtn');
  var copiedMsg  = document.getElementById('copiedMsg');
  var codeEl     = document.getElementById('discountCode');

  if (copyBtn && codeEl) {
    copyBtn.addEventListener('click', function () {
      var code = codeEl.textContent;
      navigator.clipboard.writeText(code).then(function () {
        if (copiedMsg) { copiedMsg.textContent = '✓ Code copied to clipboard!'; }
        copyBtn.textContent = 'Copied!';
        setTimeout(function () {
          copyBtn.textContent = 'Copy';
          if (copiedMsg) copiedMsg.textContent = '';
        }, 2500);
      }).catch(function () {
        /* Fallback for older browsers */
        var ta = document.createElement('textarea');
        ta.value = code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        if (copiedMsg) copiedMsg.textContent = '✓ Code copied!';
        copyBtn.textContent = 'Copied!';
        setTimeout(function () {
          copyBtn.textContent = 'Copy';
          if (copiedMsg) copiedMsg.textContent = '';
        }, 2500);
      });
    });
  }

})();
