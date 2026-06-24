// design-patch.js
// Professional UI refinements — add before </body>, last script tag
// Removes AI branding, replaces emoji icons with SVGs, cleans UI chrome

(function () {
  'use strict';

  // ─── SVG icon set (18×18, Lucide-style) ─────────────────────────────────
  const ICONS = {
    dashboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`,
    appts:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14" stroke-width="2.5" stroke-linecap="round"/><line x1="12" y1="14" x2="12" y2="14" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="14" x2="16" y2="14" stroke-width="2.5" stroke-linecap="round"/><line x1="8" y1="18" x2="8" y2="18" stroke-width="2.5" stroke-linecap="round"/><line x1="12" y1="18" x2="12" y2="18" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    patients:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    finance:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
    costs:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
    inventory: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    chatbot:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    admin:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  };

  const SVG_EYE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const SVG_EYE_OFF = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  const SVG_SEND   = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  const SVG_LOGOUT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;

  // ─── Emoji strip regex ───────────────────────────────────────────────────
  const EMOJI_RE = /^([\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}✅⚠️🔐🛠️📝📋📊📅💰👥📣🤖⭐✨🔍💎⚕️🔧💉⚙️🔩🌉🦴🔑🏥🔥🌱📤📥💾🔄💸🔢➤👁🙈⏻✏️👤📦💸⭐️]\s*)+/u;

  function stripEmoji(str) { return str.replace(EMOJI_RE, '').trim(); }

  // ─── 1. Remove demo credentials box ─────────────────────────────────────
  function removeDemoBox() {
    const box = document.querySelector('.demo-box');
    if (box) box.remove();
  }

  // ─── 2. Clean static AI/Zaki branding ───────────────────────────────────
  function cleanBranding() {
    // Login subtitle (applyConfig sets this dynamically too, so we use MO below)
    const loginSub = document.getElementById('login-sub');
    if (loginSub && loginSub.textContent.includes('الذكي')) {
      loginSub.textContent = loginSub.textContent.replace('الذكي', '').replace(/\s{2,}/, ' ').trim();
    }

    // Sidebar brand subtitle
    const brandSub = document.querySelector('.brand-sub');
    if (brandSub) brandSub.textContent = 'نظام إدارة العيادة';

    // Chatbot panel title
    const chatTitle = document.querySelector('#sec-chatbot .panel-title');
    if (chatTitle) chatTitle.textContent = 'مساعد العيادة';

    // Claude AI badge → clean
    document.querySelectorAll('#sec-chatbot .badge').forEach(b => {
      if (b.textContent.includes('Claude')) b.textContent = 'مُفعَّل';
    });

    // Description text
    const chatDesc = document.querySelector('#sec-chatbot .panel-body-sm');
    if (chatDesc && chatDesc.textContent.includes('Claude')) {
      chatDesc.innerHTML = `البوت جاهز للرد على استفسارات المرضى وحجز المواعيد تلقائياً.<br>
        <span style="color:var(--teal)">✓</span> يعرف أسعار جميع الخدمات &nbsp;·&nbsp;
        <span style="color:var(--teal)">✓</span> يحجز المواعيد &nbsp;·&nbsp;
        <span style="color:var(--teal)">✓</span> يرد بالعربية العامية`;
    }

    // Chat status line
    const chatStatus = document.querySelector('.chat-bot-status');
    if (chatStatus && chatStatus.textContent.includes('Claude')) {
      chatStatus.textContent = '● متاح الآن';
    }

    // Chat avatar — replace 🦷 emoji with an SVG tooth
    const chatAvatar = document.querySelector('.chat-avatar');
    if (chatAvatar) {
      chatAvatar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:var(--teal)"><path d="M12 2C9.5 2 7 4 7 6.5c0 1 .3 2 .8 2.8L6 19c0 1.7 1.3 3 3 3 .8 0 1.5-.4 2-1 .5.6 1.2 1 2 1 1.7 0 3-1.3 3-3l-1.8-9.7c.5-.8.8-1.8.8-2.8C15 4 13.5 2 12 2z"/></svg>`;
    }
  }

  // ─── 3. Clean all panel/modal titles & buttons ───────────────────────────
  function cleanTitles() {
    document.querySelectorAll('.panel-title, .modal-title, .admin-card-title').forEach(el => {
      const cleaned = stripEmoji(el.textContent);
      if (cleaned && cleaned !== el.textContent) el.textContent = cleaned;
    });
  }

  function cleanButtons() {
    const map = {
      'save-appt-btn':    'حفظ الحجز',
      'update-appt-btn':  'تأكيد التعديل',
      'save-fin-btn':     'حفظ السجل',
      'save-patient-btn': 'حفظ المريض',
      'save-inv-btn':     'حفظ الصنف',
    };
    Object.entries(map).forEach(([id, txt]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    });
  }

  // ─── 4. Replace all eye-toggle buttons with SVG ──────────────────────────
  function cleanEyeButtons() {
    document.querySelectorAll('.eye-btn').forEach(btn => {
      if (!btn.querySelector('svg')) btn.innerHTML = SVG_EYE;
    });

    // Patch toggleEye globally so it keeps using SVGs after toggle
    if (typeof window.toggleEye === 'function') {
      const origToggleEye = window.toggleEye;
      window.toggleEye = function (id, btn) {
        const el = document.getElementById(id);
        el.type = el.type === 'password' ? 'text' : 'password';
        btn.innerHTML = el.type === 'password' ? SVG_EYE : SVG_EYE_OFF;
      };
    }

    // Patch the login eye button (it has its own inline handler)
    const loginEye = document.getElementById('eye-btn');
    if (loginEye) {
      loginEye.innerHTML = SVG_EYE;
      const origOnclick = loginEye.onclick;
      loginEye.onclick = () => {
        const p = document.getElementById('inp-pass');
        p.type = p.type === 'password' ? 'text' : 'password';
        loginEye.innerHTML = p.type === 'password' ? SVG_EYE : SVG_EYE_OFF;
      };
    }
  }

  // ─── 5. Replace chat send button icon ────────────────────────────────────
  function cleanChatSend() {
    const sendBtn = document.getElementById('chat-send');
    if (sendBtn) sendBtn.innerHTML = SVG_SEND;
  }

  // ─── 6. Replace nav emoji icons + cleanup labels ─────────────────────────
  function replaceNavIcons() {
    document.querySelectorAll('.nav-item').forEach(item => {
      const id = item.dataset.id;
      const iconEl = item.querySelector('.nav-icon');
      if (iconEl && ICONS[id]) iconEl.innerHTML = ICONS[id];

      // Rename nav labels that contain "الذكي"
      const label = item.querySelector('span:last-child');
      if (label) {
        if (label.textContent === 'البوت الذكي') label.textContent = 'المساعد';
        if (label.textContent === 'البوت') label.textContent = 'المساعد';
      }
    });

    // Logout icon
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn && !logoutBtn.querySelector('svg')) logoutBtn.innerHTML = SVG_LOGOUT;

    // User role — remove ⭐
    const roleEl = document.getElementById('u-role');
    if (roleEl) roleEl.textContent = roleEl.textContent.replace('⭐', '').trim();

    // Greeting — remove 👋
    const greetEl = document.getElementById('topbar-sub');
    if (greetEl) greetEl.textContent = greetEl.textContent.replace('👋', '').trim();
  }

  // ─── 7. Admin panel title cleanup ────────────────────────────────────────
  function cleanAdminTitle() {
    document.querySelectorAll('[style*="font-size:20px"], [style*="font-size: 20px"]').forEach(el => {
      if (el.textContent.includes('🛠️')) {
        el.textContent = el.textContent.replace('🛠️', '').trim();
      }
    });
    // Remove drop-shadow filter from admin lock emoji
    document.querySelectorAll('.admin-lock-card [style*="drop-shadow"]').forEach(el => {
      el.style.filter = 'none';
    });
  }

  // ─── 8. Clean broadcast button ───────────────────────────────────────────
  function cleanBroadcast() {
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent.trim() === '📤 إرسال الإشعار') btn.textContent = 'إرسال الإشعار';
      if (btn.textContent.trim() === '🔢 احسب الربحية')  btn.textContent = 'احسب الربحية';
      if (btn.textContent.trim() === '🔓 دخول')           btn.textContent = 'دخول';
      if (btn.textContent.trim() === '🔒 قفل')            btn.textContent = 'قفل';
    });
  }

  // ─── 9. Also fix greeting set by initApp ─────────────────────────────────
  // Override USERS greeting strings so 👋 is never written
  function patchUserGreetings() {
    if (!window.CLINIC_CONFIG) return;
    try {
      // If USERS global exists (it's not exported, so we can't access it directly)
      // Instead we watch for topbar-sub mutations and strip 👋 there
    } catch (_) {}
  }

  // ─── Run everything ───────────────────────────────────────────────────────
  function init() {
    removeDemoBox();
    cleanBranding();
    cleanTitles();
    cleanButtons();
    cleanEyeButtons();
    cleanChatSend();
    cleanBroadcast();
    patchUserGreetings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // After login: nav icons + runtime cleanup
  window.addEventListener('clinic-login', () => {
    setTimeout(() => {
      replaceNavIcons();
      cleanAdminTitle();
      cleanBranding();
      cleanBroadcast();
      // Re-clean greeting (it's set in initApp which fires just before clinic-login)
      const greetEl = document.getElementById('topbar-sub');
      if (greetEl) greetEl.textContent = greetEl.textContent.replace('👋', '').trim();
    }, 80);
  });

  // MutationObserver — catches dynamically rendered content (modals, admin sections)
  const mo = new MutationObserver(() => {
    cleanTitles();
    cleanButtons();
    cleanBroadcast();
    cleanEyeButtons();
    // Re-clean chatbot if it was just rendered
    const chatStatus = document.querySelector('.chat-bot-status');
    if (chatStatus && chatStatus.textContent.includes('Claude')) {
      chatStatus.textContent = '● متاح الآن';
    }
  });

  if (document.readyState !== 'loading') {
    mo.observe(document.body, { childList: true, subtree: true, characterData: false });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      mo.observe(document.body, { childList: true, subtree: true, characterData: false });
    });
  }

})();
