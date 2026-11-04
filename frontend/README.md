# 🏭 LOOMUS 2.0 — Ultra-Premium Textile Machine Management Suite

A modern, high-performance, modular **React + Vite + Tailwind CSS** enterprise application for textile mills and weaving factories (designed specifically for Surat, Bhiwandi, and Ahmedabad textile manufacturing standards).

---

## 🌟 Key Highlights & Design Upgrades

- **Ultra-Premium Light Theme ("Heavy / High-End Look")**: Precision typography (`Plus Jakarta Sans`, `Rajdhani`, `JetBrains Mono`), glassmorphic cards, subtle micro-borders, clean technical gradients, live telemetry animations, and high information density.
- **Dedicated Role-Based Portals**:
  1. ⚙️ **Admin Executive Suite**: Factory-wide 50-loom command center, batch Start/Stop/Emergency Stop, power consumption metrics, inventory valuation, financial sales reports, Surat broker directory, and EasyViewer Pro CCTV matrix.
  2. 👷 **Supervisor Floor Oversight**: Floor plan split by **Shed A (Air-Jet Bay 1–25)** and **Shed B (Rapier Bay 26–50)**, shift breakages & fault alerts intervention, worker attendance & bay allocations, quality compliance audit.
  3. 🔧 **Operator Industrial Touchscreen HMI**: Designed for tablet/touchscreen floor terminals with large tactile buttons (**START**, **STOP**, **INCH/JOG**, **PAUSE**), live digital RPM dials, warp tension %, air-jet pressure, meter output counter, and one-touch defect logger.
- **Animated SVG Loom Simulation**: Realistic animated heald frame, vibrating warp tension threads, moving weft shuttle projectile, and pick counter.
- **Synthesized Industrial Web Audio API**: Tactile click feedback, motor spin-up hum, alarm chimes, and emergency siren without requiring external audio downloads.
- **Legacy Backup**: Your original monolithic `index.html` has been safely archived as `legacy_index.html`.

---

## 📁 Modular Project Architecture

```
loomus-main/
├── legacy_index.html               # Safe backup of your original 1-file version
├── package.json                    # Dependencies (React 18, Lucide React, Tailwind, Vite)
├── vite.config.js                  # Fast Vite bundler configuration
├── tailwind.config.js              # Custom industrial color palette & animations
├── postcss.config.js
├── index.html                      # HTML entry with Plus Jakarta Sans & Rajdhani fonts
└── src/
    ├── main.jsx                    # React root entry
    ├── App.jsx                     # Layout shell, role router & modals
    ├── index.css                   # Tailwind base, custom scrollbar & precision grid mesh
    ├── context/
    │   └── AppContext.jsx          # Central reactive state (50 looms, alarms, stock, orders, audio)
    ├── data/
    │   └── initialData.js          # Realistic dataset with 50 looms, fabrics, brokers & cameras
    ├── utils/
    │   ├── soundEffects.js         # Web Audio API synthesized industrial sounds
    │   └── formatters.js           # Indian Rupees (₹ Lakhs/Cr) & meter formatters
    └── components/
        ├── auth/
        │   └── LoginScreen.jsx     # Modern login screen with 1-click role switcher
        ├── common/
        │   ├── Header.jsx          # Topbar with live IST clock, role selector & E-STOP
        │   ├── Sidebar.jsx         # Role-aware navigation menu & live plant status
        │   ├── LoomVisual.jsx      # Animated SVG weaving loom with shuttle
        │   ├── StatCard.jsx        # Premium KPI stat card with badges
        │   ├── MachineModal.jsx    # Deep-dive loom diagnostic modal
        │   └── Toast.jsx           # Floating system notifications
        ├── supervisor/
        │   └── SupervisorFloor.jsx # Supervisor floor oversight & shift supervision
        ├── operator/
        │   └── OperatorConsole.jsx # Operator industrial touchscreen HMI
        └── views/
            ├── DashboardView.jsx   # Master executive telemetry dashboard
            ├── MachinesView.jsx    # 50-Loom fleet grid with filters & sorting
            ├── ControlView.jsx     # Central speed RPM, tension & fabric presets
            ├── ProductionView.jsx  # Shift production batch entry & quality grading
            ├── CameraView.jsx      # EasyViewer Pro CCTV cloud & RTSP stream hub
            ├── AlarmsView.jsx      # Fault alarm center with acknowledge & testing
            ├── WorkersView.jsx     # Staff directory, attendance & machine allocation
            ├── RawMaterialView.jsx # Raw yarn stock (Cotton, Polyester, Denim, Silk)
            ├── SalesView.jsx       # Ready goods, Surat brokers CRM & sales orders
            └── AnalyticsView.jsx   # Weekly output charts, OEE & revenue analytics
```

---

## 🚀 How to Run the Project

### 1. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Build for Production
```bash
npm run build
```
Creates an optimized, compressed production bundle in the `dist/` folder.

### 3. Preview Production Build
```bash
npm run preview
```

---

## 🔑 Demo Login Credentials
- **Password**: `1234` for all roles
- **Admin**: Full mill executive authority
- **Supervisor**: Floor oversight & shift management
- **Operator**: Direct machine HMI terminal

