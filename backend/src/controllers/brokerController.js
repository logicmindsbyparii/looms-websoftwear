import { Broker } from '../models/Broker.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emitToAll } from '../services/socketService.js';

export const getBrokers = asyncHandler(async (req, res) => {
  const brokers = await Broker.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, brokers, 'Brokers retrieved'));
});

export const addBroker = asyncHandler(async (req, res) => {
  const { id, name, contactPerson, company, phone, city, type, comm, rating } = req.body;
  if (!name) throw new ApiError(400, 'Broker name is required', 'VALIDATION_ERROR');

  const newBroker = await Broker.create({
    id: id || `BR-${Date.now().toString().slice(-4)}`,
    name,
    contactPerson: contactPerson || '',
    company: company || '',
    phone: phone || '',
    city: city || 'Surat',
    type: type || 'Broker',
    comm: parseFloat(comm) || 2.0,
    totalDeals: 0,
    activeOrders: 0,
    rating: parseFloat(rating) || 5.0
  });

  emitToAll('broker:created', newBroker);

  res.status(201).json(new ApiResponse(201, newBroker, `Broker ${newBroker.name} registered successfully`));
});

export const deleteBroker = asyncHandler(async (req, res) => {
  const broker = await Broker.findOneAndDelete({ id: req.params.id });
  if (!broker) throw new ApiError(404, 'Broker not found', 'BROKER_NOT_FOUND');

  emitToAll('broker:deleted', { id: broker.id });

  res.status(200).json(new ApiResponse(200, { id: broker.id }, 'Broker removed'));
});

