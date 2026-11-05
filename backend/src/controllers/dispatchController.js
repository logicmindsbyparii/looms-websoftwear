import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as deliveryService from '../services/deliveryService.js';

export const createDispatch = asyncHandler(async (req, res) => {
  const dispatch = await deliveryService.createDispatch(req.body, req.user, req);
  res.status(201).json(new ApiResponse(201, dispatch, `Dispatch ${dispatch.dispatchId} created successfully`));
});

export const getDispatches = asyncHandler(async (req, res) => {
  const result = await deliveryService.getDispatches(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Dispatches retrieved'));
});

export const getDispatchDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deliveryService.getDispatchById(id);
  res.status(200).json(new ApiResponse(200, result, 'Dispatch details retrieved'));
});

export const updateTransit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, latitude, longitude, address } = req.body;
  const result = await deliveryService.driverUpdateTransit(
    { dispatchId: id, action, latitude, longitude, address },
    req.user,
    req
  );
  res.status(200).json(new ApiResponse(200, result, `Transit status updated: ${result.status}`));
});

export const resolveDispute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, resolutionNote } = req.body;
  const result = await deliveryService.resolveDispute(
    { dispatchId: id, action, resolutionNote },
    req.user,
    req
  );
  res.status(200).json(new ApiResponse(200, result, `Dispute resolved with action: ${action}`));
});

