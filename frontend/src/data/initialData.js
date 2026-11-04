// Initial & Demo dataset for LOOMUS 2.0 Textile Suite

export const FABRIC_TYPES = [
  '70*72 Plain Cambric',
  '70*68 Medium Grey',
  '60 Gram Waterjet',
  'Cotton 40s Combed',
  'Cotton 60s Compact',
  'Polyester 75D',
  'Silk Blend Chiffon',
  'Heavy Denim 14oz',
  'Rayon 30s Twill',
  'Jacquard Brocade'
];

export const LOOM_MODELS = [
  'Power Looms',
  'Water Jet Loom',
  'Airjet Loom',
  'Rapier Jacquard Loom'
];

// Completely clean by default as requested by user
export const INITIAL_MACHINES = [];
export const INITIAL_WORKERS = [];
export const INITIAL_ALARMS = [];
export const INITIAL_STOCK = [];
export const INITIAL_BROKERS = [];
export const INITIAL_READY_GOODS = [];
export const INITIAL_SALES_ORDERS = [];
export const INITIAL_CAMERAS = [];
export const INITIAL_PRODUCTION_LOGS = [];

// Demo data available on-demand if the user ever clicks "Load Demo Data"
export const DEMO_MACHINES = Array.from({ length: 50 }, (_, i) => {
  const num = i + 1;
  const id = `M-${num < 10 ? '0' + num : num}`;
  const shed = num <= 25 ? 'Shed A (Air-Jet)' : 'Shed B (Rapier)';
  
  let status = 'running';
  if (num === 4 || num === 17 || num === 38) status = 'stopped';
  else if (num === 9 || num === 22 || num === 45) status = 'idle';
  else if (num === 13) status = 'maintenance';

  const isRunning = status === 'running';
  const fabric = FABRIC_TYPES[i % FABRIC_TYPES.length];
  const targetOutput = 75;
  const currentOutput = Math.floor(Math.random() * 35 + (isRunning ? 35 : 10));
  const efficiency = Math.min(100, Math.round((currentOutput / (targetOutput * 0.7)) * 100));

  return {
    id,
    name: `Loom Unit ${num}`,
    shed,
    model: LOOM_MODELS[i % LOOM_MODELS.length],
    status,
    rpm: isRunning ? Math.floor(Math.random() * 180 + 780) : 0,
    targetRpm: 850,
    fabric,
    output: currentOutput,
    targetOutput,
    efficiency,
    temp: isRunning ? Math.floor(Math.random() * 8 + 36) : 28,
    tension: isRunning ? Math.floor(Math.random() * 12 + 62) : 0,
    pressure: isRunning ? parseFloat((Math.random() * 0.6 + 4.2).toFixed(1)) : 0,
    picksPerMin: isRunning ? Math.floor(Math.random() * 120 + 720) : 0,
    weftStops: Math.floor(Math.random() * 4),
    warpStops: Math.floor(Math.random() * 3),
    operator: `Operator ${((i % 12) + 1).toString().padStart(2, '0')}`,
    lastMaintenance: '2026-10-24'
  };
});

export const DEMO_WORKERS = [
  { id: 'W-101', name: 'Ramesh Patel', role: 'Senior Loom Master', machine: 'M-01 to M-06', shift: 'Morning (6AM - 2PM)', phone: '+91 98251 44321', status: 'active', shed: 'Shed A' },
  { id: 'W-102', name: 'Suresh Kumar', role: 'Chief Mechanic', machine: 'All Shed A', shift: 'Morning (6AM - 2PM)', phone: '+91 98790 12876', status: 'active', shed: 'Shed A' },
  { id: 'W-103', name: 'Dinesh Shah', role: 'Quality Inspector', machine: 'Floor Audit', shift: 'Morning (6AM - 2PM)', phone: '+91 99245 99812', status: 'active', shed: 'Shed B' },
  { id: 'W-104', name: 'Nilesh Joshi', role: 'Floor Supervisor', machine: 'Shed B', shift: 'Morning (6AM - 2PM)', phone: '+91 94280 33419', status: 'active', shed: 'Shed B' },
  { id: 'W-105', name: 'Prakash Rathod', role: 'Loom Operator', machine: 'M-07 to M-12', shift: 'Morning (6AM - 2PM)', phone: '+91 97123 66540', status: 'break', shed: 'Shed A' }
];

export const DEMO_ALARMS = [
  { id: 'AL-901', type: 'critical', title: 'M-04: Warp Thread Break Detected', machine: 'M-04', time: '10:42 AM', shed: 'Shed A', code: 'E-031' },
  { id: 'AL-902', type: 'warning', title: 'M-08: Main Line Low Air Pressure (2.1 bar)', machine: 'M-08', time: '09:58 AM', shed: 'Shed A', code: 'W-014' },
  { id: 'AL-903', type: 'info', title: 'M-13: Scheduled Greasing Due', machine: 'M-13', time: '08:15 AM', shed: 'Shed A', code: 'I-002' }
];

export const DEMO_STOCK = [
  { id: 'ST-01', name: 'Cotton Yarn 40s Combed', current: 1850, max: 3000, unit: 'kg', rate: 285, minThreshold: 600, category: 'Spun Cotton', supplier: 'Vardhman Textiles' },
  { id: 'ST-02', name: 'Cotton Yarn 60s Compact', current: 740, max: 2000, unit: 'kg', rate: 360, minThreshold: 500, category: 'Spun Cotton', supplier: 'Arvind Mills' },
  { id: 'ST-03', name: 'Polyester Filament 75D/36F', current: 2400, max: 3500, unit: 'kg', rate: 145, minThreshold: 800, category: 'Synthetic', supplier: 'Reliance Industries' },
  { id: 'ST-04', name: 'Heavy Denim Indigo Slub 14oz', current: 1200, max: 2500, unit: 'kg', rate: 215, minThreshold: 500, category: 'Denim', supplier: 'Mafatlal Industries' }
];

export const DEMO_BROKERS = [
  {
    id: 'BR-01',
    name: 'Mahesh Textile Agency',
    contactPerson: 'Maheshbhai Patel',
    company: 'Mahesh Fabrics Pvt Ltd',
    phone: '+91 99999 12345',
    city: 'Surat (Ring Road Market)',
    type: 'Broker',
    comm: 2.0,
    totalDeals: 142,
    activeOrders: 4,
    rating: 4.9
  },
  {
    id: 'BR-02',
    name: 'Rajesh Brothers Exports',
    contactPerson: 'Rajesh Singhania',
    company: 'RB International LLC',
    phone: '+91 98765 43210',
    city: 'Mumbai (Kalbadevi)',
    type: 'Export Buyer',
    comm: 3.5,
    totalDeals: 88,
    activeOrders: 2,
    rating: 4.8
  }
];

export const DEMO_READY_GOODS = [
  { id: 'RG-101', fabric: '70*72 Plain Cambric', qty: 3200, rollCount: 32, quality: 'A-Grade (Export)', rate: 48, location: 'Rack A-04', status: 'Ready' },
  { id: 'RG-102', fabric: '70*68 Medium Grey', qty: 4500, rollCount: 45, quality: 'A-Grade (Export)', rate: 42, location: 'Rack A-08', status: 'Ready' }
];

export const DEMO_SALES_ORDERS = [
  { id: 'ORD-8401', broker: 'Mahesh Textile Agency', buyer: 'Sona Fashions', fabric: '70*72 Plain Cambric', qty: 2500, rate: 48, total: 120000, date: '2026-10-31', deliveryDate: '2026-11-04', status: 'In Production', advance: 35000 },
  { id: 'ORD-8402', broker: 'Rajesh Brothers Exports', buyer: 'Dubai Tex FZE', fabric: 'Cotton 40s Combed', qty: 5000, rate: 64, total: 320000, date: '2026-10-30', deliveryDate: '2026-11-08', status: 'Dispatched', advance: 100000 }
];

export const DEMO_CAMERAS = [
  { id: 'cam-01', name: 'Floor 1 - Shed A (Airjet Bay 1-25)', sn: 'EV2026-AIRJET-01', user: 'admin', location: 'Shed A Overhead Cam', connected: true, ip: '192.168.1.101', fps: 30, channel: 'CH-01' },
  { id: 'cam-02', name: 'Floor 1 - Shed B (Rapier Bay 26-50)', sn: 'EV2026-RAPIER-02', user: 'admin', location: 'Shed B North Wall', connected: true, ip: '192.168.1.102', fps: 30, channel: 'CH-02' }
];

export const DEMO_PRODUCTION_LOGS = [
  { id: 'PR-901', time: '11:15 AM', machine: 'M-07', fabric: '70*72 Plain Cambric', shift: 'Morning', output: 72, target: 75, quality: 'A-Grade (Export)', defects: 0.5, operator: 'Ramesh Patel' },
  { id: 'PR-902', time: '10:45 AM', machine: 'M-12', fabric: 'Cotton 40s Combed', shift: 'Morning', output: 68, target: 70, quality: 'A-Grade (Export)', defects: 0.2, operator: 'Prakash Rathod' }
];
