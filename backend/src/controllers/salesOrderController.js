import { SalesOrder, VALID_ORDER_STATUSES } from '../models/SalesOrder.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToAll } from '../services/socketService.js';

export const getSalesOrders = asyncHandler(async (req, res) => {
  const orders = await SalesOrder.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, orders, 'Sales orders retrieved'));
});

export const addSalesOrder = asyncHandler(async (req, res) => {
  const { id, broker, buyer, fabric, qty, rate, total, deliveryDate, advance } = req.body;
  if (!buyer || !fabric || !qty || !rate) {
    throw new ApiError(400, 'Buyer, fabric, quantity, and rate are required', 'VALIDATION_ERROR');
  }

  const numericQty = parseFloat(qty);
  const numericRate = parseFloat(rate);
  const computedTotal = total !== undefined ? parseFloat(total) : numericQty * numericRate;

  const newOrder = await SalesOrder.create({
    id: id || `ORD-${Date.now().toString().slice(-4)}`,
    broker: broker || 'Direct Mill Sale',
    buyer,
    fabric,
    qty: numericQty,
    rate: numericRate,
    total: computedTotal,
    date: new Date().toISOString().split('T')[0],
    deliveryDate: deliveryDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Pending',
    advance: parseFloat(advance) || 0
  });

  emitToAll('sales_order:created', newOrder);

  res.status(201).json(new ApiResponse(201, newOrder, `Sales order created: ${newOrder.id}`));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!VALID_ORDER_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid order status. Allowed: ${VALID_ORDER_STATUSES.join(', ')}`, 'VALIDATION_ERROR');
  }

  const order = await SalesOrder.findOne({ id: req.params.id });
  if (!order) throw new ApiError(404, 'Sales order not found', 'ORDER_NOT_FOUND');

  // Enforce status flow
  const isValid = SalesOrder.isValidTransition(order.status, status);
  if (!isValid) {
    throw new ApiError(
      400,
      `Invalid order status transition from "${order.status}" to "${status}"`,
      'INVALID_STATUS_TRANSITION'
    );
  }

  order.status = status;
  await order.save();

  emitToAll('sales_order:updated', order);

  res.status(200).json(new ApiResponse(200, order, `Order ${order.id} updated to ${status}`));
});

export const deleteSalesOrder = asyncHandler(async (req, res) => {
  const order = await SalesOrder.findOneAndDelete({ id: req.params.id });
  if (!order) throw new ApiError(404, 'Sales order not found', 'ORDER_NOT_FOUND');

  emitToAll('sales_order:deleted', { id: order.id });

  res.status(200).json(new ApiResponse(200, { id: order.id }, 'Order removed'));
});

