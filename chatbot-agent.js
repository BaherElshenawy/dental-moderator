// ═══════════════════════════════════════════════════
//  🦷 DENTAL CLINIC BOOKING AGENT — chatbot-agent.js
//  Drop-in enhancement for the dental-moderator site
//  Handles: New Booking · Cancellation · Reschedule
//  Writes directly to Firebase via window.FB
//
//  HOW TO ADD TO YOUR SITE:
//  Add this line just before </body> in index.html:
//  <script src="chatbot-agent.js"></script>
// ═══════════════════════════════════════════════════

(function () {
  'use strict';

  // ─────────────────────────────────────────────────
  //  SERVICES (mirrors CLINIC_CONFIG.services)
  // ─────────────────────────────────────────────────
  const SERVICES = [
    { name: 'كشف وتشخيص',   emoji: '🔍', price: 250   },
    { name: 'تنظيف الأسنان', emoji: '✨', price: 500   },
    { name: 'حشو كومبوزيت',  emoji: '🦷', price: 900   },
    { name: 'حشو أمالغم',    emoji: '⚙️', price: 700   },
    { name: 'علاج عصب',      emoji: '💉', price: 2500  },
    { name: 'خلع سن',        emoji: '🔧', price: 350   },
    { name: 'خلع جراحي',     emoji: '⚕️', price: 800   },
    { name: 'تقويم أسنان',   emoji: '😁', price: 5000  },
    { name: 'تبييض',         emoji: '⭐', price: 2000  },
    { name: 'تركيبة PFM',    emoji: '👑', price: 3500  },
    { name: 'زراعة سن',      emoji: '🔩', price: 15000 },
    { name: 'جسر أسنان',     emoji: '🌉', price: 8000  },
    { name: 'طقم أسنان',     emoji: '🦴', price: 6000  },
    { name: 'فينير',         emoji: '💎', price: 4000  },
  ];

  // Merge with CLINIC_CONFIG.services if available
  function getServices() {
    if (window.CLINIC_CONFIG && window.CLINIC_CONFIG.services) {
      return Object.entries(window.CLINIC_CONFIG.services).map(([name, v]) => ({
        name, emoji: v.emoji || '🦷', price: v.price || 0
      }));
    }
    return SERVICES;
  }

  // ─────────────────────────────────────────────────
  //  STATE MACHINE
  // ─────────────────────────────────────────────────
  let state        = 'idle';
  let bookingData  = {};
  let cancelData   = {};
  let reschedData  = {};
  let agentReady   = false;

  // ─────────────────────────────────────────────────
  //  INTENT DETECTION
  // ─────────────────────────────────────────────────
  const INTENTS = {
    booking:    ['حجز','احجز','ميعاد','كشف','علاج','عايز اجي','عايز أجي','محتاج دكتور','ألم','الم','اسنان','أسنان','حجزلي','احجزلي','عندي مشكلة','بدي'],
    cancel:     ['إلغاء','الغاء','الغي','إلغي','مش هجي','مش هيجي','مش هينفع','مش قادر','cancel','كنسل','مش جي','هلغي'],
    reschedule: ['أجل','اجل','تأجيل','تاجيل','غير الموعد','عدل','موعد تاني','وقت تاني','تغيير','بدّل','بدل','تأخير'],
    prices:     ['سعر','تمن','بكام','بقد ايه','اسعار','أسعار','تكلفة','هيكلف','التكلفة'],
    greet:      ['هاي','هالو','هلو','مرحبا','السلام','اهلا','أهلا','يا هلا','صباح','مساء','ازيك','عامل','كيفك'],
  };

  function detectIntent(msg) {
    const m = msg.trim().toLowerCase();
    for (const [intent, keywords] of Object.entries(INTENTS)) {
      if (keywords.some(k => m.includes(k))) return intent;
    }
    return 'unknown';
  }

  // ─────────────────────────────────────────────────
  //  SERVICE MATCHER
  // ─────────────────────────────────────────────────
  const SERVICE_FUZZY = {
    'كشف':'كشف وتشخيص','تشخيص':'كشف وتشخيص','فحص':'كشف وتشخيص','كشف عام':'كشف وتشخيص',
    'تنظيف':'تنظيف الأسنان','سكيلنج':'تنظيف الأسنان','نظافة':'تنظيف الأسنان',
    'حشو':'حشو كومبوزيت','فلنج':'حشو كومبوزيت','ترميم':'حشو كومبوزيت',
    'امالغم':'حشو أمالغم','أمالغم':'حشو أمالغم',
    'عصب':'علاج عصب','روت':'علاج عصب','جذر':'علاج عصب',
    'خلع':'خلع سن','قلع':'خلع سن','شيل':'خلع سن','شيل سنة':'خلع سن',
    'جراح':'خلع جراحي','خلع جراح':'خلع جراحي',
    'تقويم':'تقويم أسنان','براكيت':'تقويم أسنان','ارثوذنسي':'تقويم أسنان',
    'تبييض':'تبييض','وايتنينج':'تبييض','بياض':'تبييض',
    'pfm':'تركيبة PFM','تاج':'تركيبة PFM','كراون':'تركيبة PFM',
    'زراعة':'زراعة سن','إمبلانت':'زراعة سن','امبلانت':'زراعة سن','implant':'زراعة سن',
    'جسر':'جسر أسنان','بريدج':'جسر أسنان','bridge':'جسر أسنان',
    'طقم':'طقم أسنان','طقم أسنان':'طقم أسنان','protho':'طقم أسنان',
    'فينير':'فينير','veneer':'فينير','لومينيرز':'فينير','قشرة':'فينير',
  };

  function matchService(msg) {
    const m = msg.trim().toLowerCase();
    const svcs = getServices();
    // By number
    const num = parseInt(m);
    if (!isNaN(num) && num >= 1 && num <= svcs.length) return svcs[num - 1].name;
    // Exact name
    for (const s of svcs) if (m.includes(s.name.toLowerCase())) return s.name;
    // Fuzzy
    for (const [k, v] of Object.entries(SERVICE_FUZZY)) if (m.includes(k)) return v;
    return null;
  }

  // ─────────────────────────────────────────────────
  //  DATE & TIME PARSERS
  // ─────────────────────────────────────────────────
  function nextWeekday(target) {
    const d = new Date();
    const diff = (target - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  }

  function parseDate(msg) {
    const m = msg.trim().toLowerCase();
    const today = new Date();
    if (m.includes('بكرة') || m.includes('بكره') || m.includes('غدا') || m.includes('غداً') || m.includes('غد')) {
      const d = new Date(today); d.setDate(d.getDate() + 1);
      // Skip Friday
      if (d.getDay() === 5) d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    }
    if (m.includes('اليوم') || m.includes('دلوقتي')) return today.toISOString().split('T')[0];
    if (m.includes('السبت'))               return nextWeekday(6);
    if (m.includes('الأحد') || m.includes('الاحد'))   return nextWeekday(0);
    if (m.includes('الاثنين'))             return nextWeekday(1);
    if (m.includes('الثلاثاء'))            return nextWeekday(2);
    if (m.includes('الأربعاء') || m.includes('الاربعاء') || m.includes('الأربع')) return nextWeekday(3);
    if (m.includes('الخميس'))             return nextWeekday(4);
    // ISO date
    const iso = m.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return iso[0];
    // DD/MM or DD-MM
    const dmy = m.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (dmy) {
      const year  = dmy[3] ? (dmy[3].length === 2 ? '20' + dmy[3] : dmy[3]) : today.getFullYear();
      const month = dmy[2].padStart(2, '0');
      const day   = dmy[1].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return null;
  }

  function parseTime(msg) {
    const m = msg.trim().toLowerCase();
    if (m.includes('صباح') || m.includes('بدري') || m.includes('الصبح') || m === '9' || m.includes('9 ص')) return '09:00';
    if (m.includes('10'))  return '10:00';
    if (m.includes('11'))  return '11:00';
    if (m.includes('ظهر') || m === '12') return '12:00';
    if (m.includes('1 بعد') || m === '1') return '13:00';
    if (m.includes('2 بعد') || m.includes('العصر') || m === '2') return '14:00';
    if (m.includes('3') && (m.includes('بعد') || m.includes('عصر'))) return '15:00';
    if (m.includes('4 بعد') || m === '4') return '16:00';
    if (m.includes('مغرب') || m.includes('5 م') || m === '5') return '17:00';
    if (m.includes('6 م') || m === '6') return '18:00';
    if (m.includes('مساء') || m.includes('7 م') || m === '7') return '19:00';
    if (m.includes('8 م') || m === '8') return '20:00';
    // Parse "HH:MM" or "H م/ص"
    const t = m.match(/(\d{1,2})[:\.]?(\d{0,2})\s*(ص|م|am|pm)?/i);
    if (t) {
      let h   = parseInt(t[1]);
      let min = parseInt(t[2] || '0') || 0;
      const ap = (t[3] || '').toLowerCase();
      if ((ap === 'م' || ap === 'pm') && h < 12) h += 12;
      if ((ap === 'ص' || ap === 'am') && h === 12) h = 0;
      if (h >= 9 && h <= 21) return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
    }
    return null;
  }

  function formatDateAr(isoDate) {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate + 'T00:00:00');
      return d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return isoDate; }
  }

  // ─────────────────────────────────────────────────
  //  FIREBASE ACTIONS
  // ─────────────────────────────────────────────────
  async function fbSaveBooking(data) {
    if (!window.FB) return false;
    try {
      await window.FB.addAppointment({
        name:              data.name,
        phone:             data.phone,
        service:           data.service,
        date:              data.date,
        time:              data.time,
        status:            'جديد',
        tooth:             data.tooth  || '',
        notes:             data.notes  || '',
        source:            data.source || 'بوت الموقع',
        reminderSent:      false,
        timestamp:         new Date().toISOString(),
      });
      return true;
    } catch (e) { console.error('Agent: saveBooking failed', e); return false; }
  }

  // One-shot listener: resolves after first value, then unsubscribes
  function watchOnce(watchFn) {
    return new Promise(resolve => {
      let unsub = false;
      watchFn(data => {
        if (unsub) return;
        unsub = true;
        resolve(data);
      });
    });
  }

  async function fbCancelBooking(phone) {
    if (!window.FB) return false;
    try {
      const appts = await watchOnce(cb => window.FB.watchAppointments(cb));
      const match = appts.find(a => a.phone === phone && a.status !== 'ملغي');
      if (match && match.fbId) {
        await window.FB.updateAppointment(match.fbId, { status: 'ملغي' });
        return true;
      }
      return false;
    } catch (e) { console.error('Agent: cancelBooking failed', e); return false; }
  }

  async function fbRescheduleBooking(phone, newDate, newTime, notes) {
    if (!window.FB) return false;
    try {
      const appts = await watchOnce(cb => window.FB.watchAppointments(cb));
      const match = appts.find(a => a.phone === phone && a.status !== 'ملغي');
      if (match && match.fbId) {
        await window.FB.updateAppointment(match.fbId, {
          date:   newDate,
          time:   newTime,
          status: 'مؤجل',
          notes:  notes || '',
        });
        return true;
      }
      return false;
    } catch (e) { console.error('Agent: reschedule failed', e); return false; }
  }

  // ─────────────────────────────────────────────────
  //  CHAT UI HELPERS
  // ─────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }

  function addMsg(text, role) {
    const msgs = $('chat-msgs');
    if (!msgs) return;
    const row = document.createElement('div');
    row.className = `msg-row ${role}`;
    row.innerHTML = `<div class="msg-bubble">${text.replace(/\n/g,'<br>')}</div>`;
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const msgs = $('chat-msgs');
    if (!msgs || $('agent-typing')) return;
    const el = document.createElement('div');
    el.className = 'msg-row bot';
    el.id = 'agent-typing';
    el.innerHTML = '<div class="typing"><span class="tdot"></span><span class="tdot"></span><span class="tdot"></span></div>';
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    const el = $('agent-typing');
    if (el) el.remove();
  }

  function botReply(text, delay = 700) {
    return new Promise(resolve => {
      showTyping();
      setTimeout(() => {
        hideTyping();
        addMsg(text, 'bot');
        resolve();
      }, delay);
    });
  }

  function setQuickBtns(buttons) {
    const qb = $('quick-btns');
    if (!qb) return;
    qb.innerHTML = buttons.map(b =>
      `<button class="quick-btn" data-agent-val="${escAttr(b.value || b.label)}">${b.label}</button>`
    ).join('');
    // Wire clicks
    qb.querySelectorAll('[data-agent-val]').forEach(btn => {
      btn.onclick = () => handleUserInput(btn.getAttribute('data-agent-val'));
    });
  }

  function clearQuickBtns() {
    const qb = $('quick-btns');
    if (qb) qb.innerHTML = '';
  }

  function escAttr(s) { return String(s).replace(/"/g, '&quot;'); }

  // ─────────────────────────────────────────────────
  //  MAIN INPUT HANDLER
  // ─────────────────────────────────────────────────
  async function handleUserInput(msg) {
    msg = msg.trim();
    if (!msg) return;
    // Disable input while processing
    const sendBtn = $('chat-send');
    const inputEl = $('chat-input');
    if (sendBtn) sendBtn.disabled = true;
    if (inputEl) inputEl.value = '';
    clearQuickBtns();
    addMsg(msg, 'user');
    await processState(msg);
    if (sendBtn) sendBtn.disabled = false;
  }

  // ─────────────────────────────────────────────────
  //  STATE PROCESSOR
  // ─────────────────────────────────────────────────
  async function processState(msg) {
    const m = msg.trim().toLowerCase();

    // Global escape hatch — any state
    if (m === 'رجوع' || m === 'الغاء' || m === 'إلغاء' || m === 'cancel') {
      if (state !== 'idle') {
        state = 'idle'; bookingData = {}; cancelData = {}; reschedData = {};
        await botReply('تمام، رجعنا للقائمة الرئيسية 😊');
        showMainMenu();
        return;
      }
    }

    switch (state) {

      // ── IDLE ──────────────────────────────────────
      case 'idle': {
        const intent = detectIntent(msg);
        if (intent === 'greet' || intent === 'unknown') {
          await botReply('أهلاً وسهلاً! 😊\nأنا بوت عيادة الأسنان الذكي.\nبقدر أساعدك في إيه؟');
          showMainMenu();
        } else if (intent === 'booking')    { await startBooking();    }
        else if  (intent === 'cancel')      { await startCancel();     }
        else if  (intent === 'reschedule')  { await startReschedule(); }
        else if  (intent === 'prices')      { await showPrices();      }
        break;
      }

      // ── BOOKING: SERVICE ──────────────────────────
      case 'booking_service': {
        const svc = matchService(msg);
        if (svc) {
          bookingData.service = svc;
          state = 'booking_name';
          await botReply(`تمام! اخترت: <strong>${svc}</strong> 🦷\n\nاسمك الكامل إيه؟`);
        } else {
          await botReply('مش لاقيتها! اكتب رقم الخدمة من القائمة اللي فوق أو اسمها 👆');
        }
        break;
      }

      // ── BOOKING: NAME ─────────────────────────────
      case 'booking_name': {
        if (msg.length < 3 || /^\d+$/.test(msg)) {
          await botReply('لو سمحت اكتب اسمك الكامل (الاسم واللقب) 🙏');
          break;
        }
        bookingData.name = msg;
        state = 'booking_phone';
        await botReply(`أهلاً ${msg.split(' ')[0]}! 😊\nرقم موبايلك؟`);
        break;
      }

      // ── BOOKING: PHONE ────────────────────────────
      case 'booking_phone': {
        const phone = msg.replace(/[\s\-\+]/g, '').replace(/^2/, '').replace(/^002/, '');
        if (!/^01[0-9]{9}$/.test(phone)) {
          await botReply('الرقم مش صح! 😅\nاكتب رقم موبايل مصري مثل:\n<strong>01012345678</strong>');
          break;
        }
        bookingData.phone = phone;
        state = 'booking_date';
        await botReply('🗓️ إيه أقرب يوم يناسبك؟');
        setQuickBtns([
          { label: 'بكرة',     value: 'بكرة'     },
          { label: 'السبت',    value: 'السبت'    },
          { label: 'الأحد',    value: 'الأحد'    },
          { label: 'الاثنين',  value: 'الاثنين'  },
          { label: 'الثلاثاء', value: 'الثلاثاء' },
          { label: 'الخميس',   value: 'الخميس'   },
        ]);
        break;
      }

      // ── BOOKING: DATE ─────────────────────────────
      case 'booking_date': {
        const d = parseDate(msg);
        if (!d) {
          await botReply('مش فاهم التاريخ 😅\nجرب مثلاً: بكرة · السبت · 25/6');
          break;
        }
        bookingData.date = d;
        state = 'booking_time';
        await botReply(`📅 ${formatDateAr(d)}\n\n⏰ الوقت المناسب إيه؟`);
        setQuickBtns([
          { label: '9 الصبح',     value: '9 صباح'         },
          { label: '11 الضهر',    value: '11'              },
          { label: '1 بعد الظهر', value: '1 بعد الظهر'    },
          { label: '3 العصر',     value: '3 بعد الظهر'    },
          { label: '5 المغرب',    value: '5 مساء'          },
          { label: '7 المساء',    value: '7 مساء'          },
        ]);
        break;
      }

      // ── BOOKING: TIME ─────────────────────────────
      case 'booking_time': {
        const t = parseTime(msg);
        if (!t) {
          await botReply('مش فاهم الوقت 😅\nجرب: 10 الصبح · 3 العصر · 7 مساء');
          break;
        }
        bookingData.time = t;
        state = 'booking_tooth';
        await botReply('🦷 فيه أي تفاصيل عن المشكلة أو السنة؟\n(اختياري — اضغط <strong>تخطي</strong> لو مفيش)');
        setQuickBtns([{ label: 'تخطي', value: 'لأ' }]);
        break;
      }

      // ── BOOKING: TOOTH/NOTES ──────────────────────
      case 'booking_tooth': {
        const skip = m === 'لأ' || m === 'لا' || m === 'لأه' || m === 'no' || m === 'تخطي';
        if (!skip) bookingData.tooth = msg;
        state = 'booking_confirm';
        await showBookingSummary();
        break;
      }

      // ── BOOKING: CONFIRM ──────────────────────────
      case 'booking_confirm': {
        const yes = m.includes('تأكيد') || m.includes('أيوه') || m.includes('ايوه') || m === 'اه' || m === 'نعم' || m === 'yes' || m === 'ok' || m.includes('صح');
        const no  = m.includes('لأ') || m.includes('لا') || m === 'no' || m === 'خطأ';
        if (yes) {
          state = 'idle';
          await botReply('⏳ بيتم حجز ميعادك في قاعدة البيانات...', 400);
          const ok = await fbSaveBooking(bookingData);
          const savedData = { ...bookingData };
          bookingData = {};
          if (ok) {
            await botReply(
              `✅ تم حجز ميعادك بنجاح!\n\n` +
              `👤 ${savedData.name}\n` +
              `📅 ${formatDateAr(savedData.date)} الساعة ${savedData.time}\n` +
              `🦷 ${savedData.service}\n\n` +
              `ظهرت بياناتك في لوحة التحكم فوراً 🎉\nشوفك إن شاء الله! 😊`
            );
          } else {
            await botReply(
              `✅ تم تسجيل طلب الحجز!\n\n` +
              `📅 ${formatDateAr(savedData.date)} الساعة ${savedData.time}\n` +
              `🦷 ${savedData.service}\n\n` +
              `هيتواصل معاك أحد من العيادة لتأكيد الميعاد 😊`
            );
          }
          setQuickBtns([
            { label: '📅 حجز آخر', value: 'عايز أحجز' },
            { label: '💰 الأسعار',  value: 'الأسعار'   },
          ]);
        } else if (no) {
          state = 'idle';
          bookingData = {};
          await botReply('تمام، ألغينا الحجز ده 👍\nلو حبيت تحجز تاني، أنا هنا 😊');
          showMainMenu();
        } else {
          await botReply('قول <strong>تأكيد</strong> لو الكلام صح، أو <strong>لأ</strong> لو عايز تغير حاجة');
          setQuickBtns([
            { label: '✅ تأكيد', value: 'تأكيد' },
            { label: '❌ لأ',    value: 'لأ'     },
          ]);
        }
        break;
      }

      // ── CANCEL: IDENTITY ──────────────────────────
      case 'cancel_identity': {
        const phoneMatch = msg.match(/01[0-9]{9}/);
        if (phoneMatch) {
          cancelData.phone = phoneMatch[0];
          cancelData.name  = msg.replace(phoneMatch[0], '').replace(/[-,\/\s]/g, ' ').trim();
          state = 'cancel_reason';
          await botReply('إيه سبب الإلغاء؟\n(اختياري — اضغط <strong>تخطي</strong> لو مش حابب تقول)');
          setQuickBtns([
            { label: 'تخطي',               value: 'لأ'            },
            { label: 'ظروف طارئة',          value: 'ظروف طارئة'   },
            { label: 'تغيير في الجدول',     value: 'تغيير جدول'   },
            { label: 'أنسى أحجز وقت تاني', value: 'هحجز تاني'    },
          ]);
        } else {
          await botReply('محتاج رقم الموبايل اللي حجزت بيه 📱\nمثال:\n<strong>أحمد محمد - 01012345678</strong>');
        }
        break;
      }

      // ── CANCEL: REASON ────────────────────────────
      case 'cancel_reason': {
        const skip = m === 'لأ' || m === 'لا' || m === 'تخطي';
        if (!skip) cancelData.reason = msg;
        state = 'idle';
        await botReply('⏳ بيتم الإلغاء...', 400);
        const ok = await fbCancelBooking(cancelData.phone);
        const savedPhone = cancelData.phone;
        cancelData = {};
        if (ok) {
          await botReply('✅ تم إلغاء ميعادك بنجاح.\n\nلو حبيت تحجز تاني في أي وقت، إحنا هنا! 😊');
        } else {
          await botReply(`ممكن مش لاقينا ميعاد مسجل على رقم ${savedPhone}.\n\nلو في مشكلة اتصل بنا مباشرة 📞`);
        }
        setQuickBtns([{ label: '📅 حجز جديد', value: 'عايز أحجز' }]);
        break;
      }

      // ── RESCHEDULE: IDENTITY ──────────────────────
      case 'reschedule_identity': {
        const phoneMatch = msg.match(/01[0-9]{9}/);
        if (phoneMatch) {
          reschedData.phone = phoneMatch[0];
          reschedData.name  = msg.replace(phoneMatch[0], '').replace(/[-,\/\s]/g, ' ').trim();
          state = 'reschedule_date';
          await botReply('🗓️ إيه التاريخ الجديد اللي يناسبك؟');
          setQuickBtns([
            { label: 'بكرة',     value: 'بكرة'     },
            { label: 'السبت',    value: 'السبت'    },
            { label: 'الأحد',    value: 'الأحد'    },
            { label: 'الاثنين',  value: 'الاثنين'  },
            { label: 'الثلاثاء', value: 'الثلاثاء' },
            { label: 'الخميس',   value: 'الخميس'   },
          ]);
        } else {
          await botReply('محتاج رقم الموبايل اللي حجزت بيه 📱\nمثال: <strong>01012345678</strong>');
        }
        break;
      }

      // ── RESCHEDULE: DATE ──────────────────────────
      case 'reschedule_date': {
        const d = parseDate(msg);
        if (!d) {
          await botReply('مش فاهم التاريخ 😅\nجرب: بكرة · السبت · 25/6');
          break;
        }
        reschedData.newDate = d;
        state = 'reschedule_time';
        await botReply(`📅 ${formatDateAr(d)}\n\n⏰ الوقت الجديد إيه؟`);
        setQuickBtns([
          { label: '9 الصبح',     value: '9 صباح'      },
          { label: '11 الضهر',    value: '11'           },
          { label: '1 بعد الظهر', value: '1 بعد الظهر' },
          { label: '3 العصر',     value: '3 بعد الظهر' },
          { label: '5 المغرب',    value: '5 مساء'       },
          { label: '7 المساء',    value: '7 مساء'       },
        ]);
        break;
      }

      // ── RESCHEDULE: TIME ──────────────────────────
      case 'reschedule_time': {
        const t = parseTime(msg);
        if (!t) {
          await botReply('مش فاهم الوقت 😅\nجرب: 10 الصبح · 3 العصر · 7 مساء');
          break;
        }
        reschedData.newTime = t;
        state = 'reschedule_confirm';
        await botReply(
          `تمام! خلينا نأكد التغيير:\n\n` +
          `📅 التاريخ الجديد: <strong>${formatDateAr(reschedData.newDate)}</strong>\n` +
          `⏰ الوقت: <strong>${reschedData.newTime}</strong>\n\n` +
          `كل حاجة صح؟`
        );
        setQuickBtns([
          { label: '✅ تأكيد', value: 'تأكيد' },
          { label: '❌ لأ',    value: 'لأ'     },
        ]);
        break;
      }

      // ── RESCHEDULE: CONFIRM ───────────────────────
      case 'reschedule_confirm': {
        const yes = m.includes('تأكيد') || m.includes('أيوه') || m.includes('ايوه') || m === 'اه' || m === 'نعم' || m === 'yes' || m.includes('صح');
        if (yes) {
          state = 'idle';
          await botReply('⏳ بيتم تحديث ميعادك...', 400);
          const ok = await fbRescheduleBooking(reschedData.phone, reschedData.newDate, reschedData.newTime, '');
          const savedSched = { ...reschedData };
          reschedData = {};
          if (ok) {
            await botReply(
              `✅ تم تحديث ميعادك بنجاح!\n\n` +
              `📅 ${formatDateAr(savedSched.newDate)} الساعة ${savedSched.newTime}\n\n` +
              `شوفك إن شاء الله! 🦷😊`
            );
          } else {
            await botReply(`مش لاقينا ميعاد نغيره على رقم ${savedSched.phone}.\nاتصل بنا مباشرة لو في مشكلة 📞`);
          }
          setQuickBtns([{ label: '📅 حجز جديد', value: 'عايز أحجز' }]);
        } else {
          state = 'idle';
          reschedData = {};
          await botReply('تمام، ما اتغيرشي حاجة 👍\nلو حبيت تغير تاني، أنا هنا 😊');
          showMainMenu();
        }
        break;
      }

      default:
        state = 'idle';
        await processState(msg);
    }
  }

  // ─────────────────────────────────────────────────
  //  FLOW STARTERS
  // ─────────────────────────────────────────────────
  async function startBooking() {
    state = 'booking_service';
    bookingData = { source: 'بوت الموقع' };
    const svcs = getServices();
    const list = svcs.map((s, i) =>
      `${i + 1}. ${s.emoji} ${s.name} — ${s.price.toLocaleString('ar-EG')} ج`
    ).join('\n');
    await botReply(`📋 اختار الخدمة اللي محتاجها:\n\n${list}\n\nاكتب اسمها أو رقمها 👆`, 500);
  }

  async function startCancel() {
    state = 'cancel_identity';
    cancelData = {};
    await botReply('آسف إنك مش هتقدر تيجي! 🙏\n\nاكتب اسمك ورقم موبايلك اللي حجزت بيه:\nمثال: <strong>أحمد محمد - 01012345678</strong>');
  }

  async function startReschedule() {
    state = 'reschedule_identity';
    reschedData = {};
    await botReply('معلش، هنعدل ميعادك بسهولة 😊\n\nاكتب رقم موبايلك اللي حجزت بيه:\nمثال: <strong>01012345678</strong>');
  }

  async function showPrices() {
    const svcs = getServices();
    const list = svcs.map(s => `${s.emoji} ${s.name}: <strong>${s.price.toLocaleString('ar-EG')} ج</strong>`).join('\n');
    await botReply(`💰 أسعار الخدمات:\n\n${list}`, 400);
    setQuickBtns([{ label: '📅 احجز دلوقتي', value: 'عايز أحجز' }]);
  }

  async function showBookingSummary() {
    await botReply(
      `تمام! خلينا نأكد حجزك:\n\n` +
      `👤 الاسم: <strong>${bookingData.name}</strong>\n` +
      `📱 الموبايل: <strong>${bookingData.phone}</strong>\n` +
      `🦷 الخدمة: <strong>${bookingData.service}</strong>\n` +
      `📅 التاريخ: <strong>${formatDateAr(bookingData.date)}</strong>\n` +
      `⏰ الوقت: <strong>${bookingData.time}</strong>` +
      (bookingData.tooth ? `\n🗒️ ملاحظة: ${bookingData.tooth}` : '') +
      `\n\nكل حاجة صح؟`
    );
    setQuickBtns([
      { label: '✅ تأكيد الحجز', value: 'تأكيد' },
      { label: '❌ إلغاء',       value: 'لأ'     },
    ]);
  }

  function showMainMenu() {
    setQuickBtns([
      { label: '📅 حجز ميعاد',    value: 'عايز أحجز'        },
      { label: '❌ إلغاء موعد',   value: 'عايز ألغي'         },
      { label: '🔄 تغيير موعد',   value: 'عايز أغير موعد'   },
      { label: '💰 الأسعار',      value: 'الأسعار'            },
    ]);
  }

  // ─────────────────────────────────────────────────
  //  SYSTEM PROMPT (shown in the Admin UI)
  // ─────────────────────────────────────────────────
  const SYSTEM_PROMPT =
`أنت "دكتور بوت" — مساعد حجز ذكي لعيادة الأسنان.
تتحدث دائماً بالعامية المصرية فقط.

مسؤولياتك الثلاث فقط:
1. حجز مواعيد جديدة
2. إلغاء مواعيد
3. تغيير / تأجيل مواعيد

لكل حجز جديد تجمع: الاسم · الموبايل · الخدمة · التاريخ · الوقت.
تكتب البيانات مباشرة في Firebase Realtime Database.
لا ترد على أي أسئلة خارج نطاق المواعيد — أحل المريض للعيادة.

للطوارئ: اطلب منهم الاتصال بالعيادة مباشرة.`;

  // ─────────────────────────────────────────────────
  //  INIT — wires the chatbot section
  // ─────────────────────────────────────────────────
  function initAgent() {
    if (agentReady) return;
    const sendBtn  = $('chat-send');
    const inputEl  = $('chat-input');
    const msgsEl   = $('chat-msgs');
    const promptEl = $('prompt-display');
    const copyBtn  = $('copy-prompt-btn');
    const nameEl   = $('chatbot-name');

    if (!sendBtn || !inputEl) return; // section not yet rendered

    agentReady = true;

    // Clear old content
    if (msgsEl) msgsEl.innerHTML = '';
    clearQuickBtns();

    // Update header
    if (nameEl) nameEl.textContent = 'دكتور بوت 🦷 | بوت الحجز الذكي';

    // Show system prompt
    if (promptEl) promptEl.textContent = SYSTEM_PROMPT;
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(SYSTEM_PROMPT).then(() => {
          copyBtn.textContent = '✅ تم النسخ';
          setTimeout(() => { copyBtn.textContent = 'نسخ'; }, 2000);
        });
      };
    }

    // Wire input
    const doSend = () => {
      const v = inputEl.value.trim();
      if (v) handleUserInput(v);
    };
    sendBtn.onclick = doSend;
    inputEl.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } };

    // Welcome
    setTimeout(async () => {
      await botReply('أهلاً وسهلاً! 🦷\nأنا بوت الحجز الذكي لعيادة الأسنان.\nبقدر أساعدك في إيه؟', 600);
      showMainMenu();
    }, 300);
  }

  // ─────────────────────────────────────────────────
  //  HOOK INTO NAVIGATION
  //  Re-init when user clicks the chatbot nav item
  // ─────────────────────────────────────────────────
  function hookNavigation() {
    // Watch for the chatbot nav item being clicked
    document.addEventListener('click', e => {
      const navItem = e.target.closest('[data-id="chatbot"]');
      if (navItem) {
        agentReady = false; // allow re-init on each visit
        setTimeout(initAgent, 150);
      }
    });

    // Also watch DOM for the chatbot section becoming active
    const mo = new MutationObserver(() => {
      const sec = $('sec-chatbot');
      if (sec && sec.classList.contains('active') && !agentReady) {
        setTimeout(initAgent, 100);
      }
    });
    mo.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  // ─────────────────────────────────────────────────
  //  BOOT
  // ─────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hookNavigation);
  } else {
    hookNavigation();
  }

  // Expose for external use (e.g., WhatsApp webhook can call window.DentalAgent.saveBooking)
  window.DentalAgent = { saveBooking: fbSaveBooking, cancelBooking: fbCancelBooking, rescheduleBooking: fbRescheduleBooking };

})();
