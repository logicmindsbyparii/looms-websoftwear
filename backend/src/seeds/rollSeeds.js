import crypto from 'crypto';

export const demoLocations = [
  { id: 'LOC-FLR-A', name: 'Production Floor Shed A', code: 'FLR-A', type: 'floor', shed: 'Shed A', isActive: true },
  { id: 'LOC-FLR-B', name: 'Production Floor Shed B', code: 'FLR-B', type: 'floor', shed: 'Shed B', isActive: true },
  { id: 'LOC-RCK-01', name: 'Rack A-01', code: 'RCK-01', type: 'rack', shed: 'Main Shed', isActive: true },
  { id: 'LOC-RCK-02', name: 'Rack A-02', code: 'RCK-02', type: 'rack', shed: 'Main Shed', isActive: true },
  { id: 'LOC-RCK-03', name: 'Rack A-03', code: 'RCK-03', type: 'rack', shed: 'Main Shed', isActive: true },
  { id: 'LOC-RCK-04', name: 'Rack A-04', code: 'RCK-04', type: 'rack', shed: 'Main Shed', isActive: true },
  { id: 'LOC-RCK-05', name: 'Rack A-05', code: 'RCK-05', type: 'rack', shed: 'Main Shed', isActive: true },
  { id: 'LOC-RCK-06', name: 'Rack A-06', code: 'RCK-06', type: 'rack', shed: 'Main Shed', isActive: true },
  { id: 'LOC-RCK-07', name: 'Rack A-07', code: 'RCK-07', type: 'rack', shed: 'Main Shed', isActive: true },
  { id: 'LOC-RCK-08', name: 'Rack A-08', code: 'RCK-08', type: 'rack', shed: 'Main Shed', isActive: true },
  { id: 'LOC-RCK-09', name: 'Rack A-09', code: 'RCK-09', type: 'rack', shed: 'Main Shed', isActive: true },
  { id: 'LOC-RCK-10', name: 'Rack A-10', code: 'RCK-10', type: 'rack', shed: 'Main Shed', isActive: true },
  { id: 'LOC-GDN-01', name: 'Finished Godown', code: 'FIN-GDN', type: 'godown', shed: 'Main Shed', isActive: true },
  { id: 'LOC-DSP-01', name: 'Dispatch Bay', code: 'DSP-BAY', type: 'dispatch', shed: 'Main Shed', isActive: true },
  { id: 'LOC-JBW-01', name: 'Job Work Out', code: 'JBW-OUT', type: 'jobwork', shed: 'Job Work Facility', isActive: true }
];

export function getDemoRollsAndMovements(adminUserId) {
  const year = new Date().getFullYear();
  const demoDefs = [
    { seq: 1, machineId: 'M-01', machineName: 'Loom #01 (Airjet)', shed: 'Shed A', fabric: '70*72 Plain Cambric', metres: 102.50, locationId: 'LOC-RCK-04', status: 'Ready', operator: 'Ramesh Patel' },
    { seq: 2, machineId: 'M-01', machineName: 'Loom #01 (Airjet)', shed: 'Shed A', fabric: '70*72 Plain Cambric', metres: 98.40, locationId: 'LOC-RCK-04', status: 'Ready', operator: 'Ramesh Patel' },
    { seq: 3, machineId: 'M-02', machineName: 'Loom #02 (Airjet)', shed: 'Shed A', fabric: '70*68 Medium Grey', metres: 120.00, locationId: 'LOC-RCK-08', status: 'Reserved', orderId: 'ORD-8401', operator: 'Ramesh Patel' },
    { seq: 4, machineId: 'M-03', machineName: 'Loom #03 (Airjet)', shed: 'Shed A', fabric: '60 Gram Waterjet', metres: 115.25, locationId: 'LOC-RCK-01', status: 'Ready', operator: 'Suresh Kumar' },
    { seq: 5, machineId: 'M-04', machineName: 'Loom #04 (Airjet)', shed: 'Shed A', fabric: 'Cotton 40s Combed', metres: 105.00, locationId: 'LOC-GDN-01', status: 'Ready', operator: 'Suresh Kumar' },
    { seq: 6, machineId: 'M-05', machineName: 'Loom #05 (Airjet)', shed: 'Shed A', fabric: '70*72 Plain Cambric', metres: 85.50, locationId: 'LOC-DSP-01', status: 'Dispatched', orderId: 'ORD-8402', operator: 'Ramesh Patel' },
    { seq: 7, machineId: 'M-07', machineName: 'Loom #07 (Airjet)', shed: 'Shed A', fabric: '70*72 Plain Cambric', metres: 72.00, locationId: 'LOC-RCK-04', status: 'Ready', operator: 'Ramesh Patel' },
    { seq: 8, machineId: 'M-12', machineName: 'Loom #12 (Airjet)', shed: 'Shed A', fabric: 'Cotton 40s Combed', metres: 68.00, locationId: 'LOC-RCK-02', status: 'Hold', operator: 'Prakash Rathod' },
    { seq: 9, machineId: 'M-15', machineName: 'Loom #15 (Airjet)', shed: 'Shed A', fabric: 'Rayon 30s Twill', metres: 110.00, locationId: 'LOC-RCK-05', status: 'Ready', operator: 'Prakash Rathod' },
    { seq: 10, machineId: 'M-20', machineName: 'Loom #20 (Airjet)', shed: 'Shed A', fabric: 'Cotton 60s Compact', metres: 95.80, locationId: 'LOC-GDN-01', status: 'Ready', operator: 'Suresh Kumar' },
    { seq: 11, machineId: 'M-26', machineName: 'Loom #26 (Rapier)', shed: 'Shed B', fabric: 'Heavy Denim 14oz', metres: 80.00, locationId: 'LOC-RCK-09', status: 'Ready', operator: 'Mukeshbhai' },
    { seq: 12, machineId: 'M-28', machineName: 'Loom #28 (Rapier)', shed: 'Shed B', fabric: 'Jacquard Brocade', metres: 60.50, locationId: 'LOC-RCK-10', status: 'Reserved', orderId: 'ORD-8401', operator: 'Mukeshbhai' },
    { seq: 13, machineId: 'M-30', machineName: 'Loom #30 (Rapier)', shed: 'Shed B', fabric: 'Polyester 75D', metres: 130.00, locationId: 'LOC-JBW-01', status: 'Ready', operator: 'Mukeshbhai' },
    { seq: 14, machineId: 'M-35', machineName: 'Loom #35 (Rapier)', shed: 'Shed B', fabric: 'Silk Blend Chiffon', metres: 75.20, locationId: 'LOC-RCK-03', status: 'Rejected', operator: 'Mukeshbhai' },
    { seq: 15, machineId: 'M-40', machineName: 'Loom #40 (Rapier)', shed: 'Shed B', fabric: '70*68 Medium Grey', metres: 100.00, locationId: 'LOC-GDN-01', status: 'Ready', operator: 'Ramesh Patel' }
  ];

  const rolls = [];
  const movements = [];

  demoDefs.forEach((def, index) => {
    const id = `TK-${year}-${String(def.seq).padStart(6, '0')}`;
    const qrToken = crypto.randomBytes(16).toString('base64url');
    const createdDate = new Date(Date.now() - (15 - index) * 3600 * 1000 * 4);

    rolls.push({
      id,
      qrToken,
      fabric: def.fabric,
      quality: def.status === 'Rejected' ? 'B-Grade (Local)' : 'A-Grade (Export)',
      metres: def.metres,
      originalMetres: def.metres,
      machineId: def.machineId,
      machineName: def.machineName,
      machineShed: def.shed,
      machineModel: def.shed === 'Shed A' ? 'Toyota JAT810 Airjet' : 'Picanol OptiMax Rapier',
      locationId: def.locationId,
      status: def.status,
      shift: 'Morning',
      operator: def.operator,
      orderId: def.orderId || null,
      producedAt: createdDate,
      createdBy: adminUserId || null,
      scanCount: index < 5 ? (index + 1) * 2 : 0,
      lastScannedAt: index < 5 ? new Date() : null,
      qrVersion: 1
    });

    // Initial created movement
    movements.push({
      rollId: id,
      type: 'created',
      toLocationId: def.shed === 'Shed A' ? 'LOC-FLR-A' : 'LOC-FLR-B',
      toStatus: 'Ready',
      metresAfter: def.metres,
      note: `Roll cut and logged from machine ${def.machineName}`,
      byUserId: adminUserId || null,
      byName: def.operator,
      at: createdDate
    });

    // If moved to rack/godown/bay, add transfer movement
    if (def.locationId !== 'LOC-FLR-A' && def.locationId !== 'LOC-FLR-B') {
      movements.push({
        rollId: id,
        type: 'transfer',
        fromLocationId: def.shed === 'Shed A' ? 'LOC-FLR-A' : 'LOC-FLR-B',
        toLocationId: def.locationId,
        fromStatus: 'Ready',
        toStatus: 'Ready',
        note: `Moved to storage location ${def.locationId}`,
        byUserId: adminUserId || null,
        byName: 'Floor Supervisor',
        at: new Date(createdDate.getTime() + 1800 * 1000)
      });
    }

    // Status change movement if reserved, dispatched, hold, or rejected
    if (def.status !== 'Ready') {
      movements.push({
        rollId: id,
        type: 'status_change',
        fromStatus: 'Ready',
        toStatus: def.status,
        note: def.status === 'Reserved'
          ? `Allocated to sales order ${def.orderId}`
          : def.status === 'Dispatched'
          ? `Dispatched with invoice on order ${def.orderId}`
          : def.status === 'Hold'
          ? 'Hold: quality inspection check on weft tension'
          : 'Rejected: excessive yarn warp break defects',
        byUserId: adminUserId || null,
        byName: 'Floor Supervisor',
        at: new Date(createdDate.getTime() + 3600 * 1000)
      });
    }
  });

  return { rolls, movements };
}

