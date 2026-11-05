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
export const INITIAL_PRODUCTION_LOGS = [];

// Demo data available on-demand if the user ever clicks "Load Demo Data"
export const DEMO_MACHINES = Array.from({ length: 50 }, (_, i) => {
  const num = i + 1;
  const id = `M-${num < 10 ? '0' + num : num}`;
  const shed = num <= 25 ? 'Shed A (Air-Jet)' : 'Shed B (Rapier)';
  
  let status = 'running';
  let rpm = 780 + Math.floor(Math.random() * 40);
  let efficiency = 88 + Math.floor(Math.random() * 8);

  if (i === 4 || i === 18) {
    status = 'stopped';
    rpm = 0;
    efficiency = 45;
  } else if (i === 11 || i === 31) {
    status = 'maintenance';
    rpm = 0;
    efficiency = 60;
  }

  return {
    id,
    name: `Toyota JAT810 #${num}`,
    shed,
    model: LOOM_MODELS[i % LOOM_MODELS.length],
    status,
    rpm,
    efficiency,
    output: status === 'running' ? Math.floor(80 + Math.random() * 40) : 0,
    warpStops: Math.floor(Math.random() * 4),
    weftStops: Math.floor(Math.random() * 6),
    fabric: i % 2 === 0 ? '70*72 Plain Cambric' : '70*68 Medium Grey',
    operator: i % 3 === 0 ? 'Ramesh Patel' : i % 3 === 1 ? 'Prakash Rathod' : 'Mahesh Parmar',
    shift: 'Morning'
  };
});

export const DEMO_WORKERS = [
  { id: 'W-01', name: 'Ramesh Patel', role: 'Weaver Master', shift: 'Morning', assignedMachines: ['M-01', 'M-02', 'M-03', 'M-04'], efficiency: 94, attendance: 'present' },
  { id: 'W-02', name: 'Prakash Rathod', role: 'Airjet Operator', shift: 'Morning', assignedMachines: ['M-05', 'M-06', 'M-07', 'M-08'], efficiency: 91, attendance: 'present' },
  { id: 'W-03', name: 'Mahesh Parmar', role: 'Rapier Operator', shift: 'Evening', assignedMachines: ['M-26', 'M-27', 'M-28', 'M-29'], efficiency: 88, attendance: 'present' },
  { id: 'W-04', name: 'Suresh Vankar', role: 'Beam Gaiter / Fitter', shift: 'Night', assignedMachines: ['M-10', 'M-11', 'M-12'], efficiency: 96, attendance: 'present' }
];

export const DEMO_ALARMS = [
  { id: 'ALM-101', machineId: 'M-05', type: 'warp', title: 'Warp Yarn Breakage - Dropper Sensor 4 Active', time: '11:42 AM', severity: 'critical', active: true },
  { id: 'ALM-102', machineId: 'M-19', type: 'weft', title: 'Weft Insertion Failure (Feeder Sensor Error)', time: '11:28 AM', severity: 'warning', active: true },
  { id: 'ALM-103', machineId: 'M-34', type: 'lube', title: 'Low Sump Oil Pressure Detected (Pump #2)', time: '10:55 AM', severity: 'warning', active: true }
];

export const DEMO_STOCK = [
  { id: 'STK-01', item: '40s Combed Cotton Yarn (Warp)', count: '40s Ne', supplier: 'Vardhman Textiles Ltd', stockKg: 4200, minKg: 1500, status: 'good' },
  { id: 'STK-02', item: '60s Compact Cotton Yarn (Weft)', count: '60s Ne', supplier: 'Alok Industries', stockKg: 1100, minKg: 1200, status: 'low' },
  { id: 'STK-03', item: '75D Polyester DTY Yarn', count: '75D/36F', supplier: 'Reliance Industries', stockKg: 6800, minKg: 2000, status: 'good' }
];

export const DEMO_BROKERS = [
  { id: 'BRK-01', name: 'Mahesh Textile Agency', firm: 'M.K. Textiles Surat', phone: '+91 98251 12345', commPercent: 1.0, activeOrders: 4 },
  { id: 'BRK-02', name: 'Rajesh Brothers Exports', firm: 'Rajesh Cotton Syndicate', phone: '+91 98795 67890', commPercent: 1.25, activeOrders: 2 }
];

export const DEMO_READY_GOODS = [
  { id: 'RG-101', fabric: '70*72 Plain Cambric', qty: 3200, rollCount: 32, quality: 'A-Grade (Export)', rate: 48, location: 'Rack A-04', status: 'Ready' },
  { id: 'RG-102', fabric: '70*68 Medium Grey', qty: 4500, rollCount: 45, quality: 'A-Grade (Export)', rate: 42, location: 'Rack A-08', status: 'Ready' }
];

export const DEMO_SALES_ORDERS = [
  { id: 'ORD-8401', broker: 'Mahesh Textile Agency', buyer: 'Sona Fashions', fabric: '70*72 Plain Cambric', qty: 2500, rate: 48, total: 120000, date: '2026-10-31', deliveryDate: '2026-11-04', status: 'In Production', advance: 35000 },
  { id: 'ORD-8402', broker: 'Rajesh Brothers Exports', buyer: 'Dubai Tex FZE', fabric: 'Cotton 40s Combed', qty: 5000, rate: 64, total: 320000, date: '2026-10-30', deliveryDate: '2026-11-08', status: 'Dispatched', advance: 100000 }
];

export const DEMO_PRODUCTION_LOGS = [
  { id: 'PR-901', time: '11:15 AM', machine: 'M-07', fabric: '70*72 Plain Cambric', shift: 'Morning', output: 72, target: 75, quality: 'A-Grade (Export)', defects: 0.5, operator: 'Ramesh Patel' },
  { id: 'PR-902', time: '10:45 AM', machine: 'M-12', fabric: 'Cotton 40s Combed', shift: 'Morning', output: 68, target: 70, quality: 'A-Grade (Export)', defects: 0.2, operator: 'Prakash Rathod' }
];
