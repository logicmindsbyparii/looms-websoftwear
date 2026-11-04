import { Stock } from '../models/Stock.js';
import { StockMovement } from '../models/StockMovement.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToAll } from '../services/socketService.js';

export const getStock = asyncHandler(async (req, res) => {
  const stock = await Stock.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, stock, 'Stock levels retrieved'));
});

export const addRawMaterial = asyncHandler(async (req, res) => {
  const { material, qty, supplier, rate, unit } = req.body;
  if (!material || qty === undefined) {
    throw new ApiError(400, 'Material name and quantity are required', 'VALIDATION_ERROR');
  }

  const numericQty = parseFloat(qty);
  if (isNaN(numericQty) || numericQty <= 0) {
    throw new ApiError(400, 'Quantity must be a positive number', 'VALIDATION_ERROR');
  }

  const cleanName = material.trim();
  let item = await Stock.findOne({ name: { $regex: new RegExp(`^${cleanName}$`, 'i') } });

  if (item) {
    item.current += numericQty;
    if (supplier) item.supplier = supplier;
    if (rate) item.rate = parseFloat(rate);
    await item.save();

    await StockMovement.create({
      stockId: item.id,
      materialName: item.name,
      type: 'in',
      qty: numericQty,
      balanceAfter: item.current,
      supplierOrDepartment: supplier || item.supplier,
      recordedBy: req.user.username
    });

    emitToAll('stock:updated', item);

    return res.status(200).json(new ApiResponse(200, item, `Added ${numericQty} kg of ${item.name}`));
  }

  const newStock = await Stock.create({
    id: `ST-${Date.now().toString().slice(-4)}`,
    name: cleanName,
    current: numericQty,
    max: numericQty * 2 || 2000,
    unit: unit || 'kg',
    rate: parseFloat(rate) || 250,
    minThreshold: Math.round(numericQty * 0.25),
    category: 'Spun Yarn',
    supplier: supplier || 'Spinning Mill'
  });

  await StockMovement.create({
    stockId: newStock.id,
    materialName: newStock.name,
    type: 'in',
    qty: numericQty,
    balanceAfter: newStock.current,
    supplierOrDepartment: supplier || newStock.supplier,
    recordedBy: req.user.username
  });

  emitToAll('stock:created', newStock);

  res.status(201).json(new ApiResponse(201, newStock, `Added ${numericQty} kg of ${newStock.name}`));
});

export const deleteStock = asyncHandler(async (req, res) => {
  const stock = await Stock.findOneAndDelete({ id: req.params.id });
  if (!stock) throw new ApiError(404, 'Material stock not found', 'STOCK_NOT_FOUND');

  emitToAll('stock:deleted', { id: stock.id });

  res.status(200).json(new ApiResponse(200, { id: stock.id }, 'Material stock deleted'));
});

