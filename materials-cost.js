// ═══════════════════════════════════════════════════
//  🧪 MATERIALS COST ENGINE — materials-cost.js
//  Adds to the existing تحليل التكاليف section:
//    1. مواد خام  — materials database
//    2. مواد لكل خدمة — assign materials per procedure
//    3. تسعير مقترح — full breakdown + suggested prices
//
//  HOW TO ADD:
//  Add this line just before </body> in index.html
//  (after chatbot-agent.js):
//  <script src="materials-cost.js"></script>
// ═══════════════════════════════════════════════════

(function () {
  'use strict';

  // ─────────────────────────────────────────────────
  //  DATA STORE  (localStorage + optional Firebase)
  // ─────────────────────────────────────────────────
  const LS_MAT  = 'dm_materials';
  const LS_PROC = 'dm_proc_materials';

  let materials = [];        // [{id, name, category, unit, pricePerUnit}]
  let procMats  = {};        // {serviceName: [{materialId, qty}]}

  function loadData() {
    try { materials = JSON.parse(localStorage.getItem(LS_MAT)  || '[]'); } catch { materials = []; }
    try { procMats  = JSON.parse(localStorage.getItem(LS_PROC) || '{}'); } catch { procMats = {}; }
  }

  function saveMats()  { localStorage.setItem(LS_MAT,  JSON.stringify(materials)); }
  function saveProcMats() { localStorage.setItem(LS_PROC, JSON.stringify(procMats)); }

  function uid() { return 'mat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }

  // ─────────────────────────────────────────────────
  //  CONFIG HELPERS
  // ─────────────────────────────────────────────────
  function getServices() {
    return (window.CLINIC_CONFIG && window.CLINIC_CONFIG.services) ? window.CLINIC_CONFIG.services : {};
  }

  function getFixedCosts() {
    return (window.CLINIC_CONFIG && window.CLINIC_CONFIG.fixedCosts) ? window.CLINIC_CONFIG.fixedCosts : {
      totalFixed: 50333, workHrsMonth: 216
    };
  }

  function getVariableCosts() {
    const vc = (window.CLINIC_CONFIG && window.CLINIC_CONFIG.variableCosts) ? window.CLINIC_CONFIG.variableCosts : {};
    return Object.values(vc).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  }

  // ─────────────────────────────────────────────────
  //  COST CALCULATOR
  // ─────────────────────────────────────────────────
  function calcCost(serviceName) {
    const svcs  = getServices();
    const svc   = svcs[serviceName] || {};
    const fc    = getFixedCosts();
    const varCost = getVariableCosts();

    const duration  = parseFloat(svc.duration)    || 30;
    const workHrs   = parseFloat(fc.workHrsMonth) || 216;
    const totalFix  = parseFloat(fc.totalFixed)   || 50333;

    const timeCost  = (duration / 60) * (totalFix / workHrs);
    const matCost   = calcMaterialCost(serviceName);

    return {
      timeCost: Math.round(timeCost * 10) / 10,
      varCost:  Math.round(varCost  * 10) / 10,
      matCost:  Math.round(matCost  * 10) / 10,
      total:    Math.round((timeCost + varCost + matCost) * 10) / 10,
    };
  }

  function calcMaterialCost(serviceName) {
    const list = procMats[serviceName] || [];
    return list.reduce((sum, pm) => {
      const mat = materials.find(m => m.id === pm.materialId);
      return sum + (mat ? parseFloat(mat.pricePerUnit) * parseFloat(pm.qty) : 0);
    }, 0);
  }

  function suggestedPrice(cost, marginPct) {
    if (cost <= 0) return 0;
    const raw = cost / (1 - marginPct / 100);
    return Math.ceil(raw / 25) * 25; // round up to nearest 25 ج
  }

  // ─────────────────────────────────────────────────
  //  CSS  (matches site's dark navy/teal theme)
  // ─────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('mc-style')) return;
    const s = document.createElement('style');
    s.id = 'mc-style';
    s.textContent = `
      .mc-panel{background:var(--navy-mid);border:1px solid var(--navy-border);border-radius:var(--r);overflow:hidden;margin-bottom:18px}
      .mc-head{padding:14px 20px;border-bottom:1px solid var(--navy-border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
      .mc-title{font-size:14px;font-weight:800;display:flex;align-items:center;gap:8px}
      .mc-body{padding:18px 20px}
      .mc-tabs{display:flex;gap:2px;background:var(--navy-light);border-radius:var(--r-sm);padding:3px;margin-bottom:18px;overflow-x:auto}
      .mc-tab{flex:1;min-width:120px;padding:8px 14px;border-radius:var(--r-xs);font-size:12px;font-weight:700;cursor:pointer;border:none;background:none;color:var(--slate);transition:all .18s;font-family:var(--font);white-space:nowrap;text-align:center}
      .mc-tab.active{background:var(--teal-dim);color:var(--teal)}
      .mc-sec{display:none}.mc-sec.active{display:block}

      .mc-table{width:100%;border-collapse:collapse;font-size:13px;margin-top:4px}
      .mc-table th{padding:9px 12px;text-align:right;font-size:11px;font-weight:700;color:var(--slate);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--navy-border);background:rgba(255,255,255,.02);white-space:nowrap}
      .mc-table td{padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle}
      .mc-table tbody tr:hover{background:rgba(255,255,255,.03)}
      .mc-table .num{font-family:var(--mono);color:var(--teal)}
      .mc-table .muted{color:var(--slate);font-size:12px}

      .mc-add-row{display:grid;gap:10px;align-items:end;margin-bottom:14px}
      .mc-add-row.cols-5{grid-template-columns:2fr 1.2fr 1fr 1fr auto}
      .mc-add-row.cols-4{grid-template-columns:2fr 1.2fr 1fr auto}
      .mc-add-row.cols-3{grid-template-columns:2fr 1.2fr auto}
      @media(max-width:900px){.mc-add-row{grid-template-columns:1fr!important}}

      .mc-pricing-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
      .mc-price-card{background:var(--navy-light);border:1px solid var(--navy-border);border-radius:var(--r);padding:16px 18px;transition:all .18s}
      .mc-price-card:hover{border-color:rgba(0,212,170,.3);transform:translateY(-1px)}
      .mc-price-card .svc-name{font-size:13px;font-weight:800;margin-bottom:10px;display:flex;align-items:center;gap:6px}
      .mc-cost-row{display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04)}
      .mc-cost-row:last-child{border-bottom:none}
      .mc-cost-row .label{color:var(--slate)}
      .mc-cost-row .val{font-family:var(--mono);font-weight:700}
      .mc-total-row{background:rgba(0,212,170,.07);border-radius:var(--r-xs);padding:8px 10px;margin:10px 0 12px;display:flex;justify-content:space-between;font-size:13px;font-weight:800}
      .mc-total-row .val{color:var(--teal);font-family:var(--mono)}
      .mc-suggest-prices{display:flex;flex-direction:column;gap:5px}
      .mc-suggest-row{display:flex;justify-content:space-between;align-items:center;padding:5px 8px;border-radius:var(--r-xs);font-size:12px}
      .mc-suggest-row.m30{background:rgba(74,222,128,.06);color:#4ADE80}
      .mc-suggest-row.m50{background:rgba(0,212,170,.08);color:var(--teal)}
      .mc-suggest-row.m70{background:rgba(245,200,66,.07);color:var(--gold)}
      .mc-suggest-row .sp{font-family:var(--mono);font-weight:800;font-size:14px}

      .mc-proc-svc{background:var(--navy);border:1px solid var(--navy-border);border-radius:var(--r-sm);margin-bottom:12px;overflow:hidden}
      .mc-proc-head{padding:10px 14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-size:13px;font-weight:700;transition:background .18s}
      .mc-proc-head:hover{background:rgba(255,255,255,.03)}
      .mc-proc-body{padding:12px 14px;border-top:1px solid var(--navy-border);display:none}
      .mc-proc-body.open{display:block}

      .mc-mat-chip{display:inline-flex;align-items:center;gap:6px;background:var(--teal-dim);color:var(--teal);border:1px solid rgba(0,212,170,.25);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;margin:3px}
      .mc-mat-chip button{background:none;border:none;cursor:pointer;color:var(--teal);font-size:13px;padding:0;line-height:1}
      .mc-mat-chip button:hover{color:var(--coral)}

      .mc-empty{text-align:center;padding:40px 20px;color:var(--slate);font-size:13px}
      .mc-empty span{display:block;font-size:32px;margin-bottom:10px;opacity:.4}

      .mc-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700}
      .mc-badge.teal{background:var(--teal-dim);color:var(--teal)}
      .mc-badge.gold{background:var(--gold-dim);color:var(--gold)}
      .mc-badge.coral{background:var(--coral-dim);color:var(--coral)}
    `;
    document.head.appendChild(s);
  }

  // ─────────────────────────────────────────────────
  //  MATERIALS DATABASE TAB
  // ─────────────────────────────────────────────────
  const MAT_CATS = ['حشوات','تخدير','مستهلكات','تعقيم','أشعة','قوالب','تركيبات','أخرى'];

  function renderMaterialsTab() {
    return `
      <div style="margin-bottom:18px">
        <div class="mc-add-row cols-5">
          <div>
            <div class="field-label">اسم المادة *</div>
            <input class="input" id="mc-mat-name" placeholder="مثال: كومبوزيت A2، إبرة تخدير"/>
          </div>
          <div>
            <div class="field-label">الفئة</div>
            <select class="input" id="mc-mat-cat">
              ${MAT_CATS.map(c => `<option>${c}</option>`).join('')}
            </select>
          </div>
          <div>
            <div class="field-label">الوحدة</div>
            <input class="input" id="mc-mat-unit" placeholder="جرام، إبرة، قطعة..."/>
          </div>
          <div>
            <div class="field-label">سعر الوحدة (ج)</div>
            <input type="number" class="input" id="mc-mat-price" placeholder="0.00" step="0.01"/>
          </div>
          <div>
            <button class="btn btn-primary" onclick="window._mc.addMaterial()">+ إضافة</button>
          </div>
        </div>
      </div>
      <div class="table-wrap">
        <table class="mc-table" id="mc-mat-table">
          <thead><tr>
            <th>#</th><th>اسم المادة</th><th>الفئة</th><th>الوحدة</th>
            <th>سعر الوحدة</th><th>إجراء</th>
          </tr></thead>
          <tbody id="mc-mat-tbody"></tbody>
        </table>
      </div>
    `;
  }

  function renderMaterialsRows() {
    const tbody = document.getElementById('mc-mat-tbody');
    if (!tbody) return;
    if (!materials.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="mc-empty"><span>🧪</span>لا توجد مواد مضافة بعد</td></tr>`;
      return;
    }
    tbody.innerHTML = materials.map((m, i) => `
      <tr>
        <td class="muted">${i + 1}</td>
        <td><strong>${m.name}</strong></td>
        <td><span class="mc-badge teal">${m.category}</span></td>
        <td class="muted">${m.unit}</td>
        <td class="num">${parseFloat(m.pricePerUnit).toFixed(2)} ج</td>
        <td>
          <button class="btn btn-danger btn-xs" onclick="window._mc.deleteMaterial('${m.id}')">حذف</button>
        </td>
      </tr>
    `).join('');
  }

  // ─────────────────────────────────────────────────
  //  PROCEDURE MATERIALS TAB
  // ─────────────────────────────────────────────────
  function renderProcedureTab() {
    const svcs = getServices();
    const names = Object.keys(svcs);
    if (!names.length) return `<div class="mc-empty"><span>⚙️</span>لا توجد خدمات في الإعدادات</div>`;

    return names.map(name => {
      const svc  = svcs[name];
      const list = procMats[name] || [];
      const matCost = calcMaterialCost(name);
      return `
        <div class="mc-proc-svc">
          <div class="mc-proc-head" onclick="window._mc.toggleProc('${escapeSQ(name)}')">
            <span>${svc.emoji || '🦷'} ${name}</span>
            <div style="display:flex;align-items:center;gap:10px">
              <span class="mc-badge ${matCost > 0 ? 'teal' : 'gold'}">
                تكلفة المواد: ${matCost.toFixed(2)} ج
              </span>
              <span style="color:var(--slate);font-size:16px">▾</span>
            </div>
          </div>
          <div class="mc-proc-body" id="proc-body-${sanitizeId(name)}">
            <div style="margin-bottom:10px">
              ${list.length ? list.map(pm => {
                const mat = materials.find(m => m.id === pm.materialId);
                if (!mat) return '';
                return `<span class="mc-mat-chip">
                  ${mat.name} × ${pm.qty} ${mat.unit}
                  = ${(parseFloat(mat.pricePerUnit) * parseFloat(pm.qty)).toFixed(2)} ج
                  <button onclick="window._mc.removeProcMat('${escapeSQ(name)}','${pm.materialId}')">✕</button>
                </span>`;
              }).join('') : `<div class="muted" style="font-size:12px;margin-bottom:8px">لا توجد مواد مضافة لهذه الخدمة</div>`}
            </div>
            <div class="mc-add-row cols-3">
              <div>
                <div class="field-label">اختر المادة</div>
                <select class="input" id="pm-mat-${sanitizeId(name)}">
                  <option value="">— اختر مادة —</option>
                  ${materials.map(m => `<option value="${m.id}">${m.name} (${m.pricePerUnit} ج/${m.unit})</option>`).join('')}
                </select>
              </div>
              <div>
                <div class="field-label">الكمية / حالة</div>
                <input type="number" class="input" id="pm-qty-${sanitizeId(name)}" placeholder="0.5" step="0.01" min="0"/>
              </div>
              <div>
                <button class="btn btn-primary btn-sm" onclick="window._mc.addProcMat('${escapeSQ(name)}')">+ إضافة</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ─────────────────────────────────────────────────
  //  SUGGESTED PRICING TAB
  // ─────────────────────────────────────────────────
  function renderPricingTab() {
    const svcs = getServices();
    const names = Object.keys(svcs);
    if (!names.length) return `<div class="mc-empty"><span>💡</span>لا توجد خدمات في الإعدادات</div>`;

    const cards = names.map(name => {
      const svc  = svcs[name];
      const c    = calcCost(name);
      const p30  = suggestedPrice(c.total, 30);
      const p50  = suggestedPrice(c.total, 50);
      const p70  = suggestedPrice(c.total, 70);
      const curr = parseFloat(svc.price) || 0;
      const margin = curr > 0 ? Math.round((1 - c.total / curr) * 100) : 0;

      return `
        <div class="mc-price-card">
          <div class="svc-name">
            <span>${svc.emoji || '🦷'}</span>
            <span>${name}</span>
            ${margin > 0 ? `<span class="mc-badge ${margin >= 50 ? 'teal' : margin >= 30 ? 'gold' : 'coral'}">${margin}%</span>` : ''}
          </div>

          <div class="mc-cost-row">
            <span class="label">⏱️ تكلفة الوقت (${svc.duration || 30} د)</span>
            <span class="val" style="color:var(--slate)">${c.timeCost.toFixed(1)} ج</span>
          </div>
          <div class="mc-cost-row">
            <span class="label">🔧 مستهلكات متغيرة</span>
            <span class="val" style="color:var(--slate)">${c.varCost.toFixed(1)} ج</span>
          </div>
          <div class="mc-cost-row">
            <span class="label">🧪 مواد خام</span>
            <span class="val" style="color:${c.matCost > 0 ? 'var(--teal)' : 'var(--slate)'}">${c.matCost.toFixed(1)} ج</span>
          </div>

          <div class="mc-total-row">
            <span>📊 إجمالي التكلفة</span>
            <span class="val">${c.total.toFixed(1)} ج</span>
          </div>

          <div style="font-size:11px;color:var(--slate);margin-bottom:8px;font-weight:700">💡 أسعار مقترحة:</div>
          <div class="mc-suggest-prices">
            <div class="mc-suggest-row m30">
              <span>هامش 30%</span>
              <span class="sp">${p30.toLocaleString('ar-EG')} ج</span>
            </div>
            <div class="mc-suggest-row m50">
              <span>هامش 50% ⭐</span>
              <span class="sp">${p50.toLocaleString('ar-EG')} ج</span>
            </div>
            <div class="mc-suggest-row m70">
              <span>هامش 70%</span>
              <span class="sp">${p70.toLocaleString('ar-EG')} ج</span>
            </div>
          </div>

          ${curr > 0 ? `
            <div style="margin-top:10px;padding:8px 10px;background:rgba(255,255,255,.03);border-radius:var(--r-xs);font-size:11px;color:var(--slate)">
              السعر الحالي: <strong style="color:${margin >= 30 ? 'var(--teal)' : 'var(--coral)'}">${curr.toLocaleString('ar-EG')} ج</strong>
              ${margin >= 0
                ? ` — ربح فعلي: <strong style="color:${margin >= 50 ? 'var(--teal)' : margin >= 30 ? 'var(--gold)' : 'var(--coral)'}">${margin}%</strong>`
                : ` — <strong style="color:var(--coral)">أقل من التكلفة! ⚠️</strong>`
              }
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      <div style="background:rgba(0,212,170,.06);border:1px solid rgba(0,212,170,.2);border-radius:var(--r-sm);padding:12px 16px;font-size:12px;color:var(--teal);margin-bottom:18px;line-height:1.9">
        <strong>كيف تُحسَب التكلفة الكاملة؟</strong><br>
        تكلفة الوقت = (مدة الخدمة ÷ 60) × (إجمالي التكاليف الثابتة ÷ ساعات العمل/شهر)<br>
        التكلفة الإجمالية = تكلفة الوقت + مستهلكات متغيرة + <strong>مواد خام (جديد)</strong><br>
        السعر المقترح = التكلفة ÷ (1 − هامش الربح %)
      </div>
      <div class="mc-pricing-grid">${cards}</div>
    `;
  }

  // ─────────────────────────────────────────────────
  //  MAIN PANEL BUILDER
  // ─────────────────────────────────────────────────
  let currentTab = 'materials';

  function buildPanel() {
    const existing = document.getElementById('mc-main-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'mc-main-panel';
    panel.className = 'mc-panel';
    panel.innerHTML = `
      <div class="mc-head">
        <div class="mc-title">🧪 مواد خام وتسعير مقترح</div>
        <button class="btn btn-primary btn-sm" onclick="window._mc.refreshAll()">🔄 تحديث الحسابات</button>
      </div>
      <div class="mc-body">
        <div class="mc-tabs">
          <button class="mc-tab ${currentTab==='materials'?'active':''}" onclick="window._mc.switchTab('materials')">🧪 إدارة المواد</button>
          <button class="mc-tab ${currentTab==='procedures'?'active':''}" onclick="window._mc.switchTab('procedures')">🦷 مواد لكل خدمة</button>
          <button class="mc-tab ${currentTab==='pricing'?'active':''}"   onclick="window._mc.switchTab('pricing')">💡 التسعير المقترح</button>
        </div>
        <div class="mc-sec ${currentTab==='materials' ?'active':''}" id="mc-sec-materials">${renderMaterialsTab()}</div>
        <div class="mc-sec ${currentTab==='procedures'?'active':''}" id="mc-sec-procedures">${renderProcedureTab()}</div>
        <div class="mc-sec ${currentTab==='pricing'   ?'active':''}" id="mc-sec-pricing">${renderPricingTab()}</div>
      </div>
    `;

    const costSec = document.getElementById('sec-costs');
    if (costSec) {
      costSec.insertBefore(panel, costSec.firstChild);
      renderMaterialsRows();
    }
  }

  // ─────────────────────────────────────────────────
  //  PUBLIC API  (window._mc)
  // ─────────────────────────────────────────────────
  window._mc = {

    switchTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.mc-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.mc-sec').forEach(s => s.classList.remove('active'));
      const activeBtn = document.querySelector(`.mc-tab:nth-child(${tab==='materials'?1:tab==='procedures'?2:3})`);
      if (activeBtn) activeBtn.classList.add('active');
      const activeSec = document.getElementById(`mc-sec-${tab}`);
      if (activeSec) {
        activeSec.classList.add('active');
        if (tab === 'materials')  renderMaterialsRows();
        if (tab === 'procedures') { activeSec.innerHTML = renderProcedureTab(); }
        if (tab === 'pricing')    { activeSec.innerHTML = renderPricingTab(); }
      }
    },

    addMaterial() {
      const name  = (document.getElementById('mc-mat-name')?.value  || '').trim();
      const cat   = (document.getElementById('mc-mat-cat')?.value   || MAT_CATS[0]);
      const unit  = (document.getElementById('mc-mat-unit')?.value  || '').trim() || 'وحدة';
      const price = parseFloat(document.getElementById('mc-mat-price')?.value || '0');
      if (!name) { alert('اكتب اسم المادة!'); return; }
      if (price <= 0) { alert('اكتب سعر الوحدة!'); return; }
      materials.push({ id: uid(), name, category: cat, unit, pricePerUnit: price });
      saveMats();
      // clear fields
      ['mc-mat-name','mc-mat-unit','mc-mat-price'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      renderMaterialsRows();
      if (window.showToast) window.showToast(`✅ تمت إضافة "${name}" للمواد`);
    },

    deleteMaterial(id) {
      if (!confirm('حذف المادة دي؟')) return;
      materials = materials.filter(m => m.id !== id);
      // remove from all procedures
      Object.keys(procMats).forEach(svc => {
        procMats[svc] = (procMats[svc] || []).filter(pm => pm.materialId !== id);
      });
      saveMats(); saveProcMats();
      renderMaterialsRows();
      if (window.showToast) window.showToast('🗑️ تم حذف المادة');
    },

    toggleProc(name) {
      const body = document.getElementById(`proc-body-${sanitizeId(name)}`);
      if (body) body.classList.toggle('open');
    },

    addProcMat(svcName) {
      const matSel = document.getElementById(`pm-mat-${sanitizeId(svcName)}`);
      const qtySel = document.getElementById(`pm-qty-${sanitizeId(svcName)}`);
      const matId  = matSel?.value;
      const qty    = parseFloat(qtySel?.value || '0');
      if (!matId) { alert('اختر مادة!'); return; }
      if (qty <= 0) { alert('اكتب الكمية!'); return; }
      if (!procMats[svcName]) procMats[svcName] = [];
      // Remove existing entry for same material, then re-add
      procMats[svcName] = procMats[svcName].filter(pm => pm.materialId !== matId);
      procMats[svcName].push({ materialId: matId, qty });
      saveProcMats();
      // Re-render procedures tab content
      const sec = document.getElementById('mc-sec-procedures');
      if (sec) sec.innerHTML = renderProcedureTab();
      // Re-open the proc body
      setTimeout(() => {
        const body = document.getElementById(`proc-body-${sanitizeId(svcName)}`);
        if (body) body.classList.add('open');
      }, 50);
      if (window.showToast) window.showToast(`✅ تمت إضافة المادة لـ "${svcName}"`);
    },

    removeProcMat(svcName, matId) {
      if (!procMats[svcName]) return;
      procMats[svcName] = procMats[svcName].filter(pm => pm.materialId !== matId);
      saveProcMats();
      const sec = document.getElementById('mc-sec-procedures');
      if (sec) { sec.innerHTML = renderProcedureTab(); }
      if (window.showToast) window.showToast('🗑️ تم حذف المادة من الخدمة');
    },

    refreshAll() {
      buildPanel();
      if (window.showToast) window.showToast('🔄 تم تحديث الحسابات');
    },
  };

  // ─────────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────────
  function sanitizeId(str) { return str.replace(/[^a-zA-Z0-9؀-ۿ]/g, '_'); }
  function escapeSQ(str)   { return str.replace(/'/g, "\\'"); }

  // ─────────────────────────────────────────────────
  //  INIT — inject when cost section becomes active
  // ─────────────────────────────────────────────────
  function tryInit() {
    loadData();
    injectCSS();

    const costSec = document.getElementById('sec-costs');
    if (!costSec) return;

    // Build panel if section is already active
    if (costSec.classList.contains('active')) {
      buildPanel();
    }

    // Watch for section becoming active
    const mo = new MutationObserver(() => {
      if (costSec.classList.contains('active') && !document.getElementById('mc-main-panel')) {
        buildPanel();
      }
    });
    mo.observe(costSec, { attributes: true, attributeFilter: ['class'] });

    // Hook the nav item click to also build
    document.addEventListener('click', e => {
      const ni = e.target.closest('[data-id="costs"]');
      if (ni) setTimeout(buildPanel, 120);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }

})();
