import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Settings } from '../models/Settings.js';
import { Machine } from '../models/Machine.js';
import { Alarm } from '../models/Alarm.js';
import { Worker } from '../models/Worker.js';
import { Stock } from '../models/Stock.js';
import { ReadyGoods } from '../models/ReadyGoods.js';
import { Broker } from '../models/Broker.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { ProductionLog } from '../models/ProductionLog.js';
import { Location } from '../models/Location.js';
import { Roll } from '../models/Roll.js';
import { RollMovement } from '../models/RollMovement.js';
import { Counter } from '../models/Counter.js';
import { WhatsAppConfig } from '../models/WhatsAppConfig.js';
import { WhatsAppRecipient } from '../models/WhatsAppRecipient.js';
import { demoLocations, getDemoRollsAndMovements } from './rollSeeds.js';
import { connectDB } from '../config/db.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    logger.info('Starting LOOMUS 2.0 Database Seeder...');

    const salt = await bcrypt.genSalt(12);

    // 1. Admin User
    const adminUsername = (process.env.ADMIN_SEED_USERNAME || 'admin').toLowerCase();
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@Loomus2026!';
    let admin = await User.findOne({ username: adminUsername });

    if (!admin) {
      const adminHash = await bcrypt.hash(adminPassword, salt);
      admin = await User.create({
        username: adminUsername,
        displayName: process.env.ADMIN_SEED_NAME || 'Mill Administrator',
        email: 'admin@loomus.local',
        phone: process.env.ADMIN_SEED_PHONE || '+91 75675 74107',
        role: 'Admin',
        passwordHash: adminHash,
        isActive: true,
        mustChangePassword: false,
        preferredLanguage: 'en'
      });
      logger.info(`✅ Seeded Admin: "${adminUsername}" (Password: "${adminPassword}")`);
    } else {
      logger.info(`ℹ️  Admin "${adminUsername}" already exists.`);
    }

    // 2. Supervisor User
    const supervisorUsername = 'supervisor';
    const supervisorPassword = 'Supervisor@Loomus2026!';
    let supervisor = await User.findOne({ username: supervisorUsername });

    if (!supervisor) {
      const supHash = await bcrypt.hash(supervisorPassword, salt);
      supervisor = await User.create({
        username: supervisorUsername,
        displayName: 'Floor Supervisor',
        email: 'supervisor@loomus.local',
        phone: '+91 94280 33419',
        role: 'Supervisor',
        passwordHash: supHash,
        isActive: true,
        mustChangePassword: false,
        preferredLanguage: 'en'
      });
      logger.info(`✅ Seeded Supervisor: "${supervisorUsername}" (Password: "${supervisorPassword}")`);
    } else {
      logger.info(`ℹ️  Supervisor "${supervisorUsername}" already exists.`);
    }

    // 3. Operator User
    const operatorUsername = 'operator';
    const operatorPassword = 'Operator@Loomus2026!';
    let operator = await User.findOne({ username: operatorUsername });

    if (!operator) {
      const opHash = await bcrypt.hash(operatorPassword, salt);
      operator = await User.create({
        username: operatorUsername,
        displayName: 'Loom Operator',
        email: 'operator@loomus.local',
        phone: '+91 97123 66540',
        role: 'Operator',
        passwordHash: opHash,
        isActive: true,
        mustChangePassword: false,
        preferredLanguage: 'en',
        assignedMachines: ['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06']
      });
      logger.info(`✅ Seeded Operator: "${operatorUsername}" (Password: "${operatorPassword}")`);
    } else {
      logger.info(`ℹ️  Operator "${operatorUsername}" already exists.`);
    }

    // 4. Default Settings
    let settings = await Settings.findOne();
    if (!settings) {
      await Settings.create({
        plantName: 'LOOMUS Advanced Weaving Facility',
        adminWhatsAppPhone: '+91 75675 74107',
        godownWhatsAppPhone: '+91 75675 74107',
        salesWhatsAppPhone: '+91 75675 74107',
        idleTimeoutMinutes: 30,
        defaultLanguage: 'en'
      });
      logger.info('✅ Default factory settings initialized.');
    }

    // 4b. Seed WhatsApp AI Configuration & Recipient
    let waConfig = await WhatsAppConfig.findOne();
    if (!waConfig) {
      await WhatsAppConfig.create({
        isEnabled: true,
        apiToken: process.env.WHATSAPP_API_TOKEN || '',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
        webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'loomus_webhook_verify_token_secure_2026',
        apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0'
      });
      logger.info('✅ Seeded WhatsApp AI Automation Configuration.');
    }

    let defaultRecipient = await WhatsAppRecipient.findOne();
    if (!defaultRecipient) {
      await WhatsAppRecipient.create({
        id: 'REC-01',
        name: 'Mill General Manager',
        phone: process.env.WHATSAPP_ADMIN_PHONE || '+91 75675 74107',
        role: 'Admin',
        isActive: true,
        notes: 'Primary factory administration channel'
      });
      logger.info('✅ Seeded primary WhatsApp recipient (+91 75675 74107).');
    }

    // 5. Initial Factory Floor Data (50 Looms, Workers, Alarms, Stock, etc.)
    const machineCount = await Machine.countDocuments();
    if (machineCount < 10) {
      logger.info('🏭 Seeding initial 50-loom factory fleet and floor operations...');
      await Machine.deleteMany({});
      await Alarm.deleteMany({});
      await Worker.deleteMany({});
      await Stock.deleteMany({});
      await Broker.deleteMany({});
      await ReadyGoods.deleteMany({});
      await SalesOrder.deleteMany({});
      await ProductionLog.deleteMany({});
      const FABRIC_TYPES = [
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

      const LOOM_MODELS = [
        'Power Looms',
        'Water Jet Loom',
        'Airjet Loom',
        'Rapier Jacquard Loom'
      ];

      const demoMachines = Array.from({ length: 50 }, (_, i) => {
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

      const demoWorkers = [
        { id: 'W-101', name: 'Ramesh Patel', role: 'Senior Loom Master', machine: 'M-01 to M-06', shift: 'Morning (6AM - 2PM)', phone: '+91 98251 44321', status: 'active', shed: 'Shed A' },
        { id: 'W-102', name: 'Suresh Kumar', role: 'Chief Mechanic', machine: 'All Shed A', shift: 'Morning (6AM - 2PM)', phone: '+91 98790 12876', status: 'active', shed: 'Shed A' },
        { id: 'W-103', name: 'Dinesh Shah', role: 'Quality Inspector', machine: 'Floor Audit', shift: 'Morning (6AM - 2PM)', phone: '+91 99245 99812', status: 'active', shed: 'Shed B' },
        { id: 'W-104', name: 'Nilesh Joshi', role: 'Floor Supervisor', machine: 'Shed B', shift: 'Morning (6AM - 2PM)', phone: '+91 94280 33419', status: 'active', shed: 'Shed B' },
        { id: 'W-105', name: 'Prakash Rathod', role: 'Loom Operator', machine: 'M-07 to M-12', shift: 'Morning (6AM - 2PM)', phone: '+91 97123 66540', status: 'break', shed: 'Shed A' }
      ];

      const demoAlarms = [
        { id: 'AL-901', type: 'critical', title: 'M-04: Warp Thread Break Detected', machine: 'M-04', time: '10:42 AM', shed: 'Shed A', code: 'E-031' },
        { id: 'AL-902', type: 'warning', title: 'M-08: Main Line Low Air Pressure (2.1 bar)', machine: 'M-08', time: '09:58 AM', shed: 'Shed A', code: 'W-014' },
        { id: 'AL-903', type: 'info', title: 'M-13: Scheduled Greasing Due', machine: 'M-13', time: '08:15 AM', shed: 'Shed A', code: 'I-002' }
      ];

      const demoStock = [
        { id: 'ST-01', name: 'Cotton Yarn 40s Combed', current: 1850, max: 3000, unit: 'kg', rate: 285, minThreshold: 600, category: 'Spun Cotton', supplier: 'Vardhman Textiles' },
        { id: 'ST-02', name: 'Cotton Yarn 60s Compact', current: 740, max: 2000, unit: 'kg', rate: 360, minThreshold: 500, category: 'Spun Cotton', supplier: 'Arvind Mills' },
        { id: 'ST-03', name: 'Polyester Filament 75D/36F', current: 2400, max: 3500, unit: 'kg', rate: 145, minThreshold: 800, category: 'Synthetic', supplier: 'Reliance Industries' },
        { id: 'ST-04', name: 'Heavy Denim Indigo Slub 14oz', current: 1200, max: 2500, unit: 'kg', rate: 215, minThreshold: 500, category: 'Denim', supplier: 'Mafatlal Industries' }
      ];

      const demoBrokers = [
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

      const demoReadyGoods = [
        { id: 'RG-101', fabric: '70*72 Plain Cambric', qty: 3200, rollCount: 32, quality: 'A-Grade (Export)', rate: 48, location: 'Rack A-04', status: 'Ready' },
        { id: 'RG-102', fabric: '70*68 Medium Grey', qty: 4500, rollCount: 45, quality: 'A-Grade (Export)', rate: 42, location: 'Rack A-08', status: 'Ready' }
      ];

      const demoSalesOrders = [
        { id: 'ORD-8401', broker: 'Mahesh Textile Agency', buyer: 'Sona Fashions', fabric: '70*72 Plain Cambric', qty: 2500, rate: 48, total: 120000, date: '2026-10-31', deliveryDate: '2026-11-04', status: 'In Production', advance: 35000 },
        { id: 'ORD-8402', broker: 'Rajesh Brothers Exports', buyer: 'Dubai Tex FZE', fabric: 'Cotton 40s Combed', qty: 5000, rate: 64, total: 320000, date: '2026-10-30', deliveryDate: '2026-11-08', status: 'Dispatched', advance: 100000 }
      ];


seed();

