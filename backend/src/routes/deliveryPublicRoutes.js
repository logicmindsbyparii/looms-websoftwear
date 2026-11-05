import { Router } from 'express';
import {
  getPublicDeliveryInfo,
  requestReceiverOTP,
  confirmReceiverDelivery
} from '../controllers/deliveryPublicController.js';
import {
  publicDeliveryLimiter,
  otpRequestLimiter,
  otpVerifyLimiter
} from '../middlewares/rateLimiter.js';

const router = Router();

// 1. Fetch public delivery verification summary
router.get('/:token', publicDeliveryLimiter, getPublicDeliveryInfo);

// 2. Request OTP to party's registered mobile
router.post('/:token/request-otp', otpRequestLimiter, requestReceiverOTP);

// 3. Submit received quantities and verify OTP to complete delivery
router.post('/:token/confirm', otpVerifyLimiter, confirmReceiverDelivery);

export default router;
