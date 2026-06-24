/**
 * social-connect.js — Social Media Connections Panel
 * Adds WhatsApp / Facebook / Instagram connection cards to the dental system.
 * Credentials are stored in Firebase under settings/social_connections.
 */

(function () {
  'use strict';

  /* ─── Firebase helpers (reuse app's existing instance) ─────────────────── */
  function getDB() {
    return window.firebase && window.firebase.database
      ? window.firebase.database()
      : null;
  }

  function saveToFirebase(platform, data) {
    const db = getDB();
    if (!db) return;
    db.ref('settings/social_connections/' + platform).set(data);
  }

  function loadFromFirebase(callback) {
    const db = getDB();
    if (!db) { callback({}); return; }
    db.ref('settings/social_connections').once('value', snap => {
      callback(snap.val() || {});
    });
  }

  /* ─── SVG Icons ──────────────────────────────────────────────────────────── */
  const ICONS = {
    whatsapp: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.554 4.107 1.523 5.832L0 24l6.336-1.499A11.925 11.925 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.012-1.373l-.36-.213-3.733.882.936-3.618-.235-.372A9.818 9.818 0 112 12a9.818 9.818 0 0110 9.818z"/>
    </svg>`,
    facebook: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.027 4.388 11.02 10.125 11.927V15.563H7.078v-3.49h3.047V9.43c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.093 24 18.1 24 12.073z"/>
    </svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>`,
    link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>`,
    unlink: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>`,
  };

  /* ─── Styles ─────────────────────────────────────────────────────────────── */
  const css = `
    /* Nav item */
    .sc-nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-radius: 10px; cursor: pointer;
      color: var(--text-secondary, #8a9cc4); font-size: 14px;
      transition: all .2s; margin-bottom: 4px; direction: rtl;
    }
    .sc-nav-item:hover, .sc-nav-item.active {
      background: var(--primary-alpha, rgba(99,102,241,.15));
      color: var(--primary, #6366f1);
    }
    .sc-nav-item svg { width: 20px; height: 20px; flex-shrink: 0; }

    /* Section */
    #sec-social {
      padding: 24px; display: none; flex-direction: column; gap: 20px;
      animation: scFadeIn .3s ease;
    }
    #sec-social.sc-visible { display: flex; }
    @keyframes scFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }

    .sc-header {
      font-size: 22px; font-weight: 700;
      color: var(--text-primary, #e2e8f0); direction: rtl; margin-bottom: 4px;
    }
    .sc-subheader {
      font-size: 13px; color: var(--text-secondary, #8a9cc4); direction: rtl;
    }

    /* Cards grid */
    .sc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .sc-card {
      background: var(--card-bg, #1e2a45);
      border: 1px solid var(--border, rgba(255,255,255,.08));
      border-radius: 16px; padding: 24px;
      display: flex; flex-direction: column; gap: 16px;
      transition: border-color .2s, box-shadow .2s;
    }
    .sc-card:hover {
      border-color: rgba(255,255,255,.15);
      box-shadow: 0 4px 24px rgba(0,0,0,.2);
    }
    .sc-card.connected { border-color: rgba(74,222,128,.3); }

    .sc-card-top {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .sc-card-brand { display: flex; align-items: center; gap: 12px; }
    .sc-brand-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .sc-brand-icon svg { width: 24px; height: 24px; color: #fff; }
    .sc-brand-name { font-size: 16px; font-weight: 700; color: var(--text-primary, #e2e8f0); }
    .sc-brand-sub  { font-size: 12px; color: var(--text-secondary, #8a9cc4); margin-top: 2px; }

    /* Status badge */
    .sc-status {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
      white-space: nowrap;
    }
    .sc-status.connected   { background: rgba(74,222,128,.15); color: #4ade80; }
    .sc-status.disconnected{ background: rgba(248,113,113,.12); color: #f87171; }
    .sc-status-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

    /* Form inside card */
    .sc-form { display: flex; flex-direction: column; gap: 10px; }
    .sc-label {
      font-size: 12px; color: var(--text-secondary, #8a9cc4);
      direction: rtl; margin-bottom: 2px;
    }
    .sc-input {
      width: 100%; padding: 10px 14px; border-radius: 10px; font-size: 13px;
      background: var(--input-bg, rgba(255,255,255,.05));
      border: 1px solid var(--border, rgba(255,255,255,.1));
      color: var(--text-primary, #e2e8f0); outline: none; direction: ltr;
      box-sizing: border-box; transition: border-color .2s;
    }
    .sc-input:focus { border-color: var(--primary, #6366f1); }
    .sc-input::placeholder { color: var(--text-muted, #4a5578); }

    .sc-btn {
      padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600;
      cursor: pointer; border: none; display: flex; align-items: center;
      justify-content: center; gap: 8px; transition: opacity .2s, transform .15s;
    }
    .sc-btn:active { transform: scale(.97); }
    .sc-btn svg { width: 16px; height: 16px; }

    .sc-btn-connect    { background: var(--primary, #6366f1); color: #fff; }
    .sc-btn-disconnect { background: rgba(248,113,113,.15); color: #f87171; border: 1px solid rgba(248,113,113,.3); }

    .sc-info {
      font-size: 11px; color: var(--text-secondary, #8a9cc4);
      direction: rtl; line-height: 1.6;
      padding: 10px 12px; border-radius: 8px;
      background: rgba(255,255,255,.03); border: 1px dashed rgba(255,255,255,.08);
    }

    /* Notice box */
    .sc-notice {
      background: rgba(99,102,241,.08); border: 1px solid rgba(99,102,241,.2);
      border-radius: 12px; padding: 16px 20px; direction: rtl; line-height: 1.7;
      font-size: 13px; color: var(--text-secondary, #8a9cc4);
    }
    .sc-notice strong { color: var(--text-primary, #e2e8f0); }
  `;

  /* ─── Inject CSS ─────────────────────────────────────────────────────────── */
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ─── Build Section HTML ─────────────────────────────────────────────────── */
  function buildSection() {
    const sec = document.createElement('section');
    sec.id = 'sec-social';
    sec.className = 'section';  // so the app's nav system hides it when switching sections
    sec.innerHTML = `
      <div>
        <div class="sc-header">ربط المنصات الاجتماعية</div>
        <div class="sc-subheader">اربط العيادة بحسابات التواصل الاجتماعي لاستقبال الحجوزات عبرها</div>
      </div>

      <div class="sc-grid">

        <!-- WhatsApp Card -->
        <div class="sc-card" id="sc-card-whatsapp">
          <div class="sc-card-top">
            <div class="sc-card-brand">
              <div class="sc-brand-icon" style="background:linear-gradient(135deg,#25D366,#128C7E)">
                ${ICONS.whatsapp}
              </div>
              <div>
                <div class="sc-brand-name">واتساب</div>
                <div class="sc-brand-sub">WhatsApp Business</div>
              </div>
            </div>
            <span class="sc-status disconnected" id="sc-status-whatsapp">
              <span class="sc-status-dot"></span> غير متصل
            </span>
          </div>
          <div class="sc-form" id="sc-form-whatsapp">
            <div>
              <div class="sc-label">رقم الواتساب (مع كود الدولة)</div>
              <input class="sc-input" id="sc-phone-whatsapp" type="tel" placeholder="+201012345678" dir="ltr"/>
            </div>
            <div>
              <div class="sc-label">رابط Webhook (اختياري)</div>
              <input class="sc-input" id="sc-webhook-whatsapp" type="url" placeholder="https://hook.make.com/..." dir="ltr"/>
            </div>
            <button class="sc-btn sc-btn-connect" onclick="scConnect('whatsapp')">
              ${ICONS.link} ربط الحساب
            </button>
          </div>
          <div class="sc-info">
            ستظهر أيقونة الواتساب للمرضى للتواصل على الرقم المحدد.
            للردود التلقائية استخدم <strong>Make / Zapier</strong> مع رابط Webhook.
          </div>
        </div>

        <!-- Facebook Card -->
        <div class="sc-card" id="sc-card-facebook">
          <div class="sc-card-top">
            <div class="sc-card-brand">
              <div class="sc-brand-icon" style="background:linear-gradient(135deg,#1877F2,#0a58ca)">
                ${ICONS.facebook}
              </div>
              <div>
                <div class="sc-brand-name">فيسبوك</div>
                <div class="sc-brand-sub">Facebook Page</div>
              </div>
            </div>
            <span class="sc-status disconnected" id="sc-status-facebook">
              <span class="sc-status-dot"></span> غير متصل
            </span>
          </div>
          <div class="sc-form" id="sc-form-facebook">
            <div>
              <div class="sc-label">بريد الحساب أو اسم الصفحة</div>
              <input class="sc-input" id="sc-email-facebook" type="text" placeholder="clinic@example.com  أو  baher.clinic" dir="ltr"/>
            </div>
            <div>
              <div class="sc-label">رابط صفحة فيسبوك</div>
              <input class="sc-input" id="sc-page-facebook" type="url" placeholder="https://facebook.com/yourpage" dir="ltr"/>
            </div>
            <button class="sc-btn sc-btn-connect" onclick="scConnect('facebook')">
              ${ICONS.link} ربط الصفحة
            </button>
          </div>
          <div class="sc-info">
            سيتمكن المرضى من مراسلة العيادة عبر ماسنجر فيسبوك.
            للردود التلقائية وصّل صفحتك بـ <strong>Make / Zapier + Messenger API</strong>.
          </div>
        </div>

        <!-- Instagram Card -->
        <div class="sc-card" id="sc-card-instagram">
          <div class="sc-card-top">
            <div class="sc-card-brand">
              <div class="sc-brand-icon" style="background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)">
                ${ICONS.instagram}
              </div>
              <div>
                <div class="sc-brand-name">إنستغرام</div>
                <div class="sc-brand-sub">Instagram Business</div>
              </div>
            </div>
            <span class="sc-status disconnected" id="sc-status-instagram">
              <span class="sc-status-dot"></span> غير متصل
            </span>
          </div>
          <div class="sc-form" id="sc-form-instagram">
            <div>
              <div class="sc-label">اسم المستخدم</div>
              <input class="sc-input" id="sc-user-instagram" type="text" placeholder="@baher.dental" dir="ltr"/>
            </div>
            <div>
              <div class="sc-label">البريد الإلكتروني للحساب</div>
              <input class="sc-input" id="sc-email-instagram" type="email" placeholder="clinic@example.com" dir="ltr"/>
            </div>
            <button class="sc-btn sc-btn-connect" onclick="scConnect('instagram')">
              ${ICONS.link} ربط الحساب
            </button>
          </div>
          <div class="sc-info">
            سيظهر رابط إنستغرام للمرضى. للردود التلقائية على DMs استخدم
            <strong>Instagram Graph API</strong> مع Make أو Zapier.
          </div>
        </div>

      </div><!-- /sc-grid -->

      <div class="sc-notice">
        <strong>📌 ملاحظة مهمة:</strong>
        هذه الشاشة تحفظ بيانات الربط في قاعدة البيانات وتعرض أزرار التواصل للمرضى.
        الردود التلقائية الكاملة تحتاج إلى ربط خارجي عبر
        <strong>Make.com</strong> أو <strong>Zapier</strong> مع واجهات برمجة كل منصة.
        راسلنا لمساعدتك في الإعداد.
      </div>
    `;
    return sec;
  }

  /* ─── Connect / Disconnect logic ─────────────────────────────────────────── */
  window.scConnect = function (platform) {
    let data = {};
    let valid = false;

    if (platform === 'whatsapp') {
      const phone   = document.getElementById('sc-phone-whatsapp').value.trim();
      const webhook = document.getElementById('sc-webhook-whatsapp').value.trim();
      if (!phone) { alert('من فضلك أدخل رقم الواتساب'); return; }
      data = { phone, webhook, connectedAt: Date.now() };
      valid = true;
    } else if (platform === 'facebook') {
      const email = document.getElementById('sc-email-facebook').value.trim();
      const page  = document.getElementById('sc-page-facebook').value.trim();
      if (!email) { alert('من فضلك أدخل البريد أو اسم الصفحة'); return; }
      data = { email, page, connectedAt: Date.now() };
      valid = true;
    } else if (platform === 'instagram') {
      const user  = document.getElementById('sc-user-instagram').value.trim();
      const email = document.getElementById('sc-email-instagram').value.trim();
      if (!user) { alert('من فضلك أدخل اسم المستخدم'); return; }
      data = { user, email, connectedAt: Date.now() };
      valid = true;
    }

    if (!valid) return;

    saveToFirebase(platform, data);
    updateCardUI(platform, data, true);
  };

  window.scDisconnect = function (platform) {
    if (!confirm('هل تريد إلغاء ربط هذه المنصة؟')) return;
    saveToFirebase(platform, null);
    updateCardUI(platform, null, false);
  };

  function updateCardUI(platform, data, connected) {
    const card   = document.getElementById('sc-card-' + platform);
    const status = document.getElementById('sc-status-' + platform);
    const form   = document.getElementById('sc-form-' + platform);
    if (!card) return;

    if (connected && data) {
      card.classList.add('connected');
      status.className = 'sc-status connected';
      status.innerHTML = '<span class="sc-status-dot"></span> متصل';

      // Swap form to a connected state (show saved value + disconnect btn)
      let saved = '';
      if (platform === 'whatsapp') saved = data.phone;
      else if (platform === 'facebook') saved = data.email || data.page;
      else if (platform === 'instagram') saved = data.user;

      form.innerHTML = `
        <div style="font-size:13px;color:var(--text-secondary,#8a9cc4);direction:rtl;">
          <span style="color:var(--text-primary,#e2e8f0);font-weight:600;">${saved}</span>
          &nbsp;— مرتبط بنجاح ✅
        </div>
        <button class="sc-btn sc-btn-disconnect" onclick="scDisconnect('${platform}')">
          ${ICONS.unlink} إلغاء الربط
        </button>`;
    } else {
      card.classList.remove('connected');
      status.className = 'sc-status disconnected';
      status.innerHTML = '<span class="sc-status-dot"></span> غير متصل';
      // Restore inputs by re-rendering the whole section
      const secOld = document.getElementById('sec-social');
      if (secOld) {
        const wasVisible = secOld.style.display !== 'none';
        const secNew = buildSection();
        secNew.className = 'section';
        secNew.style.display = wasVisible ? 'flex' : 'none';
        secOld.replaceWith(secNew);
        loadSavedData();   // reload Firebase state
      }
    }
  }

  /* ─── Load saved data on init ────────────────────────────────────────────── */
  function loadSavedData() {
    loadFromFirebase(saved => {
      ['whatsapp', 'facebook', 'instagram'].forEach(p => {
        if (saved[p]) updateCardUI(p, saved[p], true);
      });
    });
  }

  /* ─── Nav item ───────────────────────────────────────────────────────────── */
  function buildNavItem() {
    const div = document.createElement('div');
    div.className = 'nav-item';
    div.dataset.id = 'social';
    div.id = 'sc-nav-btn';
    div.innerHTML = `
      <span class="nav-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <circle cx="9" cy="10" r="1" fill="currentColor"/>
          <circle cx="12" cy="10" r="1" fill="currentColor"/>
          <circle cx="15" cy="10" r="1" fill="currentColor"/>
        </svg>
      </span>
      <span class="nav-label">التواصل الاجتماعي</span>`;
    div.addEventListener('click', scShowSection);
    return div;
  }

  /* ─── Show/hide section ──────────────────────────────────────────────────── */
  window.scShowSection = function () {
    // Hide all sections the same way the app does
    document.querySelectorAll('.section').forEach(s => { s.style.display = 'none'; });

    // Show our section as flex
    const sec = document.getElementById('sec-social');
    if (sec) { sec.style.display = 'flex'; }

    // Deactivate other nav items, activate ours
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navBtn = document.getElementById('sc-nav-btn');
    if (navBtn) navBtn.classList.add('active');
  };

  /* ─── Inject everything ──────────────────────────────────────────────────── */
  function inject() {
    // Don't inject twice
    if (document.getElementById('sec-social')) return;

    // Find nav container — the app uses nav#sb-nav > div.nav-item
    const nav = document.querySelector('#sb-nav, nav.sidebar-nav');
    if (!nav) { setTimeout(inject, 500); return; }

    // Find content area — the app uses #content-area
    const contentArea = document.querySelector('#content-area, .content, main');
    if (!contentArea) { setTimeout(inject, 500); return; }

    // Add nav item
    nav.appendChild(buildNavItem());

    // Add section (hidden by default, same as other sections)
    const sec = buildSection();
    sec.style.display = 'none';
    contentArea.appendChild(sec);

    // Load Firebase data
    loadSavedData();
  }

  if (document.readyState !== 'loading') {
    inject();
  } else {
    document.addEventListener('DOMContentLoaded', inject);
  }

  // Also try after clinic-login event fires (same pattern as other add-ons)
  document.addEventListener('clinic-login', () => {
    setTimeout(inject, 600);
  });

})();
