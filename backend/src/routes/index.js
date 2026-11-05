import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import machineRoutes from './machineRoutes.js';
import alarmRoutes from './alarmRoutes.js';
import workerRoutes from './workerRoutes.js';
import stockRoutes from './stockRoutes.js';
import readyGoodsRoutes from './readyGoodsRoutes.js';
import brokerRoutes from './brokerRoutes.js';
import salesOrderRoutes from './salesOrderRoutes.js';
import productionLogRoutes from './productionLogRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import auditRoutes from './auditRoutes.js';
import dataRoutes from './dataRoutes.js';
import rollRoutes from './rollRoutes.js';
import locationRoutes from './locationRoutes.js';
import publicRollRoutes from './publicRollRoutes.js';
import dispatchRoutes from './dispatchRoutes.js';
import deliveryPublicRoutes from './deliveryPublicRoutes.js';

const router = Router();

// Public routes (no auth required)
router.use('/public/rolls', publicRollRoutes);
router.use('/public/delivery', deliveryPublicRoutes);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/machines', machineRoutes);
router.use('/alarms', alarmRoutes);
router.use('/workers', workerRoutes);
router.use('/stock', stockRoutes);
router.use('/ready-goods', readyGoodsRoutes);
router.use('/brokers', brokerRoutes);
router.use('/sales-orders', salesOrderRoutes);
router.use('/production-logs', productionLogRoutes);
router.use('/settings', settingsRoutes);
router.use('/audit', auditRoutes);
router.use('/data', dataRoutes);
router.use('/rolls', rollRoutes);
router.use('/locations', locationRoutes);
router.use('/dispatches', dispatchRoutes);

export default router;
