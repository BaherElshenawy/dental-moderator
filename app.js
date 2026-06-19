import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

// Connection config block
const firebaseConfig = {
    apiKey: "AIzaSyCOZJWyQOoD2PF6jRPwB0vo14eKiPs0_RA",
    authDomain: "dental-moderator.firebaseapp.com",
    databaseURL: "https://dental-moderator-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "dental-moderator",
    storageBucket: "dental-moderator.firebasestorage.app",
    messagingSenderId: "600867027414",
    appId: "1:600867027414:web:f6fd0f6dd45bfe00d90c77",
    measurementId: "G-MV7NXDYG5N"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const viewLayer = document.getElementById('view-layer');
let activeView = 'dashboard';

// Sub-views template structures
const Views = {
    dashboard: () => `
        <div class="panel">
            <div class="panel-header"><h3>لوحة التحكم والتشخيص المباشر</h3></div>
            <div class="panel-body">
                <p>مرحباً بك في لوحة تحكم عيادة الأسنان. استخدم القائمة الجانبية للتنقل وإضافة البيانات مباشرة بقاعدة البيانات السحابية.</p>
            </div>
        </div>
    `,
    appointments: () => `
        <div class="panel">
            <div class="panel-header"><h3>📅 حجز ميعاد جديد</h3></div>
            <div class="panel-body">
                <form id="appointmentForm" class="form-grid">
                    <div>
                        <label style="display:block;margin-bottom:5px;">اسم المريض</label>
                        <input type="text" id="app-patient" class="input" placeholder="اسم المريض بالكامل" required />
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:5px;">التاريخ والوقت</label>
                        <input type="datetime-local" id="app-date" class="input" required />
                    </div>
                    <div style="grid-column: span 2;">
                        <button type="submit" class="btn btn-primary">حفظ الموعد بنجاح</button>
                    </div>
                </form>
            </div>
        </div>
    `,
    patients: () => `
        <div class="panel">
            <div class="panel-header"><h3>👤 إضافة سجل مريض جديد</h3></div>
            <div class="panel-body">
                <form id="patientForm" class="form-grid">
                    <div>
                        <label style="display:block;margin-bottom:5px;">اسم المريض الجديد</label>
                        <input type="text" id="pat-name" class="input" placeholder="الاسم ثلاثي" required />
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:5px;">رقم الهاتف</label>
                        <input type="tel" id="pat-phone" class="input" placeholder="01xxxxxxxxx" required />
                    </div>
                    <div style="grid-column: span 2;">
                        <button type="submit" class="btn btn-primary">تسجيل بيانات المريض</button>
                    </div>
                </form>
            </div>
        </div>
    `,
    finance: () => `
        <div class="panel">
            <div class="panel-header"><h3>💵 إضافة سجل مالي جديد</h3></div>
            <div class="panel-body">
                <form id="financeForm" class="form-grid">
                    <div>
                        <label style="display:block;margin-bottom:5px;">القيمة المالية (EGP)</label>
                        <input type="number" id="fin-amount" class="input" placeholder="0.00" required />
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:5px;">نوع السجل المالي</label>
                        <select id="fin-type" class="input">
                            <option value="إيرادات">إيرادات العيادة</option>
                            <option value="مصروفات">مصروفات تشغيلية</option>
                        </select>
                    </div>
                    <div style="grid-column: span 2;">
                        <button type="submit" class="btn btn-primary">تأكيد وإضافة المعاملة</button>
                    </div>
                </form>
            </div>
        </div>
    `
};

function switchView(target) {
    activeView = target;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const currentNavItem = document.querySelector(`[data-target="${target}"]`);
    if(currentNavItem) currentNavItem.classList.add('active');
    
    viewLayer.innerHTML = Views[target]();
    bindFormListeners();
}

function bindFormListeners() {
    // 1. 📅 APPOINTMENT SUBMISSION
    const appForm = document.getElementById('appointmentForm');
    if(appForm) {
        appForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                patientName: document.getElementById('app-patient').value.trim(),
                timestamp: document.getElementById('app-date').value,
                createdAt: new Date().toISOString()
            };
            try {
                if(window.FB) {
                    await window.FB.addAppointment(data);
                } else {
                    const r = push(ref(db, "appointments"));
                    await set(r, data);
                }
                appForm.reset();
                if(window.showToast) window.showToast("📅 تم حفظ الموعد الجديد بنجاح!");
            } catch(err) { alert("خطأ أثناء الاتصال: " + err.message); }
        });
    }

    // 2. 👤 NEW PATIENT SUBMISSION
    const patForm = document.getElementById('patientForm');
    if(patForm) {
        patForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('pat-name').value.trim(),
                phone: document.getElementById('pat-phone').value.trim(),
                createdAt: new Date().toISOString()
            };
            try {
                if(window.FB) {
                    await window.FB.addPatient(data);
                } else {
                    const r = push(ref(db, "patients"));
                    await set(r, data);
                }
                patForm.reset();
                if(window.showToast) window.showToast("👤 تم حفظ سجل المريض الجديد بنجاح!");
            } catch(err) { alert("خطأ أثناء الاتصال: " + err.message); }
        });
    }

    // 3. 💵 FINANCIAL SUBMISSION
    const finForm = document.getElementById('financeForm');
    if(finForm) {
        finForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                amount: parseFloat(document.getElementById('fin-amount').value),
                type: document.getElementById('fin-type').value,
                createdAt: new Date().toISOString()
            };
            try {
                if(window.FB) {
                    await window.FB.addFinance(data);
                } else {
                    const r = push(ref(db, "finance"));
                    await set(r, data);
                }
                finForm.reset();
                if(window.showToast) window.showToast("💵 تم تسجيل السجل المالي بنجاح!");
            } catch(err) { alert("خطأ أثناء الاتصال: " + err.message); }
        });
    }
}

// Global UI Navigation hooks
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-target');
        if (target) switchView(target);
    });
});

window.addEventListener('clinic-login', () => {
    switchView('dashboard');
});

// Boot verification sequence
const session = sessionStorage.getItem('currentUser');
if (session) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').classList.add('visible');
    switchView('dashboard');
}
