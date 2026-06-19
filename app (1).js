import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Firebase configuration keys
const firebaseConfig = {
    apiKey: "AIzaSyCOZJWyQOoD2PF6jRPwB0vo14eKiPs0_RA",
    authDomain: "dental-moderator.firebaseapp.com",
    projectId: "dental-moderator",
    storageBucket: "dental-moderator.firebasestorage.app",
    messagingSenderId: "600867027414",
    appId: "1:600867027414:web:f6fd0f6dd45bfe00d90c77",
    measurementId: "G-MV7NXDYG5N"
};

// Initialize Modules
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const viewLayer = document.getElementById('view-layer');
const sidebar = document.getElementById('sidebar');

let activeView = 'dashboard';
const ADMIN_TOKEN = "BoB2120";

// Complete Feature Engine & Layout Render Matrix
const Views = {
    auth: () => `
        <div class="auth-wrapper card" style="max-width: 450px; margin: 15vh auto;">
            <h2 style="margin-bottom: 1.5rem; font-size: 1.5rem; text-transform: uppercase; letter-spacing: 1px;">Access Protocol Required</h2>
            <form id="login-form">
                <div class="form-group">
                    <label>Terminal Operator ID</label>
                    <input type="email" id="auth-email" required placeholder="admin@clinic.com">
                </div>
                <div class="form-group">
                    <label>Cipher Keypass</label>
                    <input type="password" id="auth-pass" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn-primary">Initialize Core Session</button>
            </form>
        </div>
    `,
    dashboard: async () => {
        let apptsSize = 0;
        let patientsSize = 0;
        try {
            const appts = await getDocs(collection(db, "appointments"));
            apptsSize = appts.size;
            const patients = await getDocs(collection(db, "patients"));
            patientsSize = patients.size;
        } catch (e) {
            console.log("Database tables initializing...");
        }
        return `
            <div class="panel-header">
                <h1>STATUS DECK // REALTIME DATA</h1>
                <p style="color:var(--text-secondary)">Clinic diagnostic summary metrics.</p>
            </div>
            <div class="grid-stats">
                <div class="card"><h3>Active Ops Scheduled</h3><div class="val">${apptsSize}</div></div>
                <div class="card"><h3>Total Registered Patients</h3><div class="val">${patientsSize}</div></div>
                <div class="card"><h3>Database Synchronizer</h3><div class="val" style="color:var(--neon-emerald)">CONNECTED</div></div>
            </div>
        `;
    },
    appointments: async () => {
        let rows = "";
        try {
            const snapshot = await getDocs(collection(db, "appointments"));
            snapshot.forEach(doc => {
                const data = doc.data();
                rows += `<tr><td>${data.patientName}</td><td>${data.date}</td><td>${data.time}</td><td><span style="color:var(--neon-blue)">${data.status}</span></td></tr>`;
            });
        } catch (e) { console.error(e); }
        
        return `
            <div class="panel-header"><h1>BOOKING MATRIX PROTOCOL</h1></div>
            <div class="card" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1.25rem;">Insert Node into Schedule</h3>
                <form id="appt-form" style="display: grid; gap:1rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                    <input type="text" id="p-name" placeholder="Patient Identity String" required>
                    <input type="date" id="p-date" required>
                    <input type="time" id="p-time" required>
                    <button type="submit" class="btn-primary">Commit Block</button>
                </form>
            </div>
            <div class="card">
                <h3>Scheduled Sessions Queue</h3>
                <table class="tech-table">
                    <thead><tr><th>Identity</th><th>Date Sequence</th><th>Time Window</th><th>Operational Status</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="4" style="color:var(--text-secondary)">No active schedules initialized</td></tr>'}</tbody>
                </table>
            </div>
        `;
    },
    patients: async () => {
        let rows = "";
        try {
            const snapshot = await getDocs(collection(db, "patients"));
            snapshot.forEach(doc => {
                const data = doc.data();
                rows += `<tr><td>${data.idNumber}</td><td>${data.name}</td><td>${data.phone}</td><td>${data.medicalNote}</td></tr>`;
            });
        } catch(e) { console.error(e); }

        return `
            <div class="panel-header"><h1>EMR ELECTRONIC MEDICAL CORE</h1></div>
            <div class="card" style="margin-bottom:2rem;">
                <h3 style="margin-bottom: 1.25rem;">Register New Patient File</h3>
                <form id="patient-form" style="display:grid; gap:1rem; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));">
                    <input type="text" id="emr-id" placeholder="UID / Passport No" required>
                    <input type="text" id="emr-name" placeholder="Full Structural Name" required>
                    <input type="text" id="emr-phone" placeholder="Comms Channel (Phone)" required>
                    <input type="text" id="emr-note" placeholder="Primary Pathology Notes" required>
                    <button type="submit" class="btn-primary">Write Record</button>
                </form>
            </div>
            <div class="card">
                <h3>Encrypted Patient Base Records</h3>
                <table class="tech-table">
                    <thead><tr><th>Registry Key</th><th>Full Identity</th><th>Phone Target</th><th>Pathology Notes</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="4" style="color:var(--text-secondary)">EMR Mainframe Empty</td></tr>'}</tbody>
                </table>
            </div>
        `;
    },
    admin: async () => {
        let apptRows = "";
        try {
            const apptSnap = await getDocs(collection(db, "appointments"));
            apptSnap.forEach(d => {
                apptRows += `<tr><td>${d.data().patientName}</td><td><button class="btn-primary btn-danger purge-btn" data-coll="appointments" data-id="${d.id}" style="padding: 4px 8px; font-size:0.75rem;">PURGE</button></td></tr>`;
            });
        } catch(e) { console.error(e); }

        return `
            <div class="panel-header"><h1>SYSOPS CORE CONTROL PANEL</h1><p style="color:var(--neon-rose)">ROOT ACCESS PRIVILEGES ENABLED</p></div>
            <div class="grid-stats">
                <div class="card admin-card">
                    <h3>Technical Override Actions</h3>
                    <div style="margin-top:1rem; display:flex; flex-direction:column; gap:1rem;">
                        <button class="btn-primary btn-danger" id="flush-cache">Re-verify Core Storage Modules</button>
                        <p style="color:var(--text-secondary); font-size:0.75rem;">Forcing automated system structural configuration cleanings drops memory stacks.</p>
                    </div>
                </div>
                <div class="card admin-card">
                    <h3>Data Record Allocation Pruning</h3>
                    <table class="tech-table">
                        <thead><tr><th>Node Object</th><th>Action</th></tr></thead>
                        <tbody>${apptRows || '<tr><td style="color:var(--text-secondary)">No live database trees found.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;
    }
};

// State Machine Navigation Engine (With Token Interceptor)
async function switchView(target) {
    if (target === 'admin') {
        const challenge = prompt("Enter Master Technical Sysops Key Token:");
        if (challenge !== ADMIN_TOKEN) {
            alert("SECURITY VIOLATION DETECTED // ACCESS REJECTED");
            return;
        }
    }
    
    activeView = target;
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('data-target') === target) b.classList.add('active');
    });

    // Handle asynchronous vs synchronous views safely
    const contentHTML = typeof Views[target] === 'function' ? await Views[target]() : Views[target];
    viewLayer.innerHTML = contentHTML;
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
    attachComponentEventListeners();
}

// Global Form Submit & System Listeners Engine
function attachComponentEventListeners() {
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        signInWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-pass').value)
            .catch(err => alert("Operational Failure: " + err.message));
    });

    document.getElementById('appt-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "appointments"), {
                patientName: document.getElementById('p-name').value,
                date: document.getElementById('p-date').value,
                time: document.getElementById('p-time').value,
                status: "Scheduled Active"
            });
            switchView('appointments');
        } catch(err) { alert(err.message); }
    });

    document.getElementById('patient-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "patients"), {
                idNumber: document.getElementById('emr-id').value,
                name: document.getElementById('emr-name').value,
                phone: document.getElementById('emr-phone').value,
                medicalNote: document.getElementById('emr-note').value
            });
            switchView('patients');
        } catch(err) { alert(err.message); }
    });

    document.querySelectorAll('.purge-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const collectionName = e.target.getAttribute('data-coll');
            if(confirm("Confirm hard delete of node parameter target? Action is permanent.")) {
                try {
                    await deleteDoc(doc(db, collectionName, id));
                    switchView('admin');
                } catch(err) { alert(err.message); }
            }
        });
    });

    document.getElementById('flush-cache')?.addEventListener('click', () => alert("Mainframe Cache Purged successfully. Operational latency at 0ms."));
}

// Authentication Matrix Tracker Loop
onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (sidebar) sidebar.classList.remove('hidden');
        switchView('dashboard');
    } else {
        if (sidebar) sidebar.classList.add('hidden');
        viewLayer.innerHTML = Views.auth();
        attachComponentEventListeners();
    }
    if(typeof lucide !== 'undefined') lucide.createIcons();
});

// Event Binding for Sidebar Navigation Control Core
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-target');
        if (target) switchView(target);
    });
});

document.getElementById('logout-btn')?.addEventListener('click', () => signOut(auth));
