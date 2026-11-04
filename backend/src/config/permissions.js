// Role-Based Permissions Map
export const ROLES = {
  ADMIN: 'Admin',
  SUPERVISOR: 'Supervisor',
  OPERATOR: 'Operator'
};

export const PERMISSIONS = {
  // Machines
  MACHINES_READ: 'machines.read',
  MACHINES_CREATE: 'machines.create',
  MACHINES_UPDATE: 'machines.update',
  MACHINES_DELETE: 'machines.delete',
  MACHINES_CONTROL: 'machines.control',
  MACHINES_EMERGENCY: 'machines.emergency',

  // Alarms
  ALARMS_READ: 'alarms.read',
  ALARMS_CREATE: 'alarms.create',
  ALARMS_ACK: 'alarms.ack',

  // Workers
  WORKERS_READ: 'workers.read',
  WORKERS_MANAGE: 'workers.manage',

  // Stock & Ready Goods
  STOCK_READ: 'stock.read',
  STOCK_WRITE: 'stock.write',
  READY_GOODS_READ: 'ready_goods.read',
  READY_GOODS_WRITE: 'ready_goods.write',

  // Sales & Brokers
  SALES_READ: 'sales.read',
  SALES_WRITE: 'sales.write',
  BROKERS_READ: 'brokers.read',
  BROKERS_WRITE: 'brokers.write',

  // Camera
  CAMERA_VIEW: 'camera.view',
  CAMERA_MANAGE: 'camera.manage',

  // Production Logs
  PRODUCTION_READ: 'production.read',
  PRODUCTION_WRITE: 'production.write',
  PRODUCTION_DELETE: 'production.delete',

  // Analytics & Audit
  ANALYTICS_VIEW: 'analytics.view',
  AUDIT_VIEW: 'audit.view',

  // Rolls & QR Tracking
  ROLLS_READ: 'rolls.read',
  ROLLS_CREATE: 'rolls.create',
  ROLLS_MOVE: 'rolls.move',
  ROLLS_STATUS: 'rolls.status',
  ROLLS_MANAGE: 'rolls.manage',

  // Locations Master
  LOCATIONS_READ: 'locations.read',
  LOCATIONS_MANAGE: 'locations.manage',

  // Data & Settings
  DATA_EXPORT: 'data.export',
  DATA_IMPORT: 'data.import',
  DATA_CLEAR: 'data.clear',
  DATA_DEMO: 'data.demo',
  SETTINGS_MANAGE: 'settings.manage',

  // Users
  USERS_MANAGE: 'users.manage',
  VIEW_AS: 'auth.view_as'
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.SUPERVISOR]: [
    PERMISSIONS.MACHINES_READ,
    PERMISSIONS.MACHINES_CONTROL,
    PERMISSIONS.ALARMS_READ,
    PERMISSIONS.ALARMS_CREATE,
    PERMISSIONS.ALARMS_ACK,
    PERMISSIONS.WORKERS_READ,
    PERMISSIONS.WORKERS_MANAGE,
    PERMISSIONS.STOCK_READ,
    PERMISSIONS.STOCK_WRITE,
    PERMISSIONS.CAMERA_VIEW,
    PERMISSIONS.PRODUCTION_READ,
    PERMISSIONS.PRODUCTION_WRITE,
    PERMISSIONS.ROLLS_READ,
    PERMISSIONS.ROLLS_CREATE,
    PERMISSIONS.ROLLS_MOVE,
    PERMISSIONS.ROLLS_STATUS,
    PERMISSIONS.LOCATIONS_READ
  ],
  [ROLES.OPERATOR]: [
    PERMISSIONS.MACHINES_READ,
    PERMISSIONS.MACHINES_CONTROL,
    PERMISSIONS.ALARMS_READ,
    PERMISSIONS.ALARMS_ACK,
    PERMISSIONS.PRODUCTION_READ,
    PERMISSIONS.PRODUCTION_WRITE,
    PERMISSIONS.ROLLS_READ,
    PERMISSIONS.ROLLS_CREATE,
    PERMISSIONS.LOCATIONS_READ
  ]
};

export const hasPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

