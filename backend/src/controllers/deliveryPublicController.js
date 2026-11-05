import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as deliveryService from '../services/deliveryService.js';

export const getPublicDeliveryInfo = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Security headers for public delivery verification endpoint
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  const data = await deliveryService.getPublicDeliveryByToken(token, req);
  res.status(200).json(new ApiResponse(200, data, 'Delivery verification details retrieved'));
});

export const requestReceiverOTP = asyncHandler(async (req, res) => {
  const { token } = req.params;

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  const result = await deliveryService.requestReceiverOTP({ token }, req);
  res.status(200).json(new ApiResponse(200, result, 'Receiver verification OTP sent'));
});

export const confirmReceiverDelivery = asyncHandler(async (req, res) => {
  const { token } = req.params;

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  const result = await deliveryService.confirmReceiverDelivery(
    {
      token,
      ...req.body
    },
    req
  );

  res.status(200).json(new ApiResponse(200, result, result.message));
});

