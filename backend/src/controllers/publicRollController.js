import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as rollService from '../services/rollService.js';

export const getPublicRoll = asyncHandler(async (req, res) => {
  const { code } = req.params;

  // Security headers for public roll verification endpoint
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  const publicData = await rollService.scanRollPublic(code);

  res.status(200).json(new ApiResponse(200, publicData, 'Roll details verified successfully'));
});

