import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Package,
  User,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { createFactoryDispatch } from '../../api/deliveryApi';
import { apiClient } from '../../api/client';
import { openWhatsApp, buildDeliveryConfirmationLinkMessage } from '../../utils/whatsapp';
import { formatMeters } from '../../utils/formatters';

export default function CreateDispatchModal({ isOpen, onClose, onCreated, showToast }) {
  const [loading, setLoading] = useState(false);
  const [createdDispatch, setCreatedDispatch] = useState(null);

  // Form fields
  const [salesOrderId, setSalesOrderId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [fabric, setFabric] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [totalMetres, setTotalMetres] = useState('');

  // Available inventory rolls and sales orders
  const [availableRolls, setAvailableRolls] = useState([]);
  const [selectedRollIds, setSelectedRollIds] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setCreatedDispatch(null);
      // Fetch available rolls with status 'Ready'
      apiClient('/rolls?status=Ready&limit=100')
        .then(res => {
          if (res.data?.rolls) setAvailableRolls(res.data.rolls);
        })
        .catch(() => {});

      // Fetch pending / in production sales orders
      apiClient('/sales-orders')
        .then(res => {
          if (Array.isArray(res.data)) {
            setSalesOrders(res.data.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled'));
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // When a sales order is selected, auto-fill party and fabric
  const handleSelectSalesOrder = (e) => {
    const orderId = e.target.value;
    setSalesOrderId(orderId);
    if (!orderId) return;

    const found = salesOrders.find(o => o.id === orderId);
    if (found) {
      setPartyName(found.buyer || '');
      setFabric(found.fabric || '');
      setTotalMetres(found.qty?.toString() || '');
    }
  };

  // Toggle roll selection
  const toggleRoll = (roll) => {
    setSelectedRollIds(prev => {
      const exists = prev.includes(roll.id);
      const next = exists ? prev.filter(id => id !== roll.id) : [...prev, roll.id];
      // Recalculate total meters
      const sum = availableRolls
        .filter(r => next.includes(r.id))
        .reduce((acc, r) => acc + (r.metres || 0), 0);
      if (next.length > 0) {
        setTotalMetres(Math.round(sum * 100) / 100);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!partyName.trim() || !partyPhone.trim()) {
      showToast('Party Name and Phone are required', 'error');
      return;
    }
    if (!driverName.trim() || !driverPhone.trim() || !vehicleNumber.trim()) {
      showToast('Driver Name, Phone, and Vehicle Number are required', 'error');
      return;
    }
    if (!fabric.trim()) {
      showToast('Fabric specification is required', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await createFactoryDispatch({
        salesOrderId: salesOrderId || undefined,
        partyName: partyName.trim(),
        partyPhone: partyPhone.trim(),
        partyAddress: partyAddress.trim(),
        fabric: fabric.trim(),
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        rolls: selectedRollIds.length > 0 ? selectedRollIds : undefined,
        totalMetresDispatched: parseFloat(totalMetres) || undefined
      });

      const newDispatch = res.data;
      setCreatedDispatch(newDispatch);
      showToast(`Dispatch ${newDispatch.dispatchId} created successfully!`, 'success');
      if (onCreated) onCreated(newDispatch);
    } catch (err) {
      showToast(err.message || 'Failed to create dispatch', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display tracking-tight">Create Factory Dispatch</h2>
              <p className="text-xs text-slate-400 font-mono">Secure Roll Shipment & Party Delivery Assignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View after creation */}
        {createdDispatch ? (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900">Shipment Dispatched Successfully!</h3>
                <p className="text-xs text-emerald-700 mt-1">
                  Dispatch ID: <strong className="font-mono">{createdDispatch.dispatchId}</strong>
                </p>
                <p className="text-xs text-emerald-700">
                  Initial Status: <span className="font-bold">Dispatched</span> (Driver must collect & customer must verify via OTP).
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Party:</span>
                <span className="font-bold text-slate-900">{createdDispatch.partyName} ({createdDispatch.partyPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Driver & Vehicle:</span>
                <span className="font-bold text-slate-900">{createdDispatch.driver.name} • {createdDispatch.driver.vehicleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fabric & Quantity:</span>
                <span className="font-bold text-slate-900">{createdDispatch.fabric} • {formatMeters(createdDispatch.totalMetresDispatched)} ({createdDispatch.totalRollsDispatched} rolls)</span>
              </div>
            </div>

            {/* Unique Delivery Link Box */}
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-sky-900 flex items-center justify-between">
                <span>Unique Expiring Delivery Confirmation Link</span>
                <span className="text-[10px] font-mono bg-sky-100 px-2 py-0.5 rounded text-sky-700">Valid 72 hrs</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?delivery=${createdDispatch.confirmationToken}`}
                  className="flex-1 bg-white border border-sky-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/?delivery=${createdDispatch.confirmationToken}`);
                    showToast('Delivery confirmation link copied!', 'success');
                  }}
                  className="p-2 bg-white hover:bg-sky-100 text-sky-700 border border-sky-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Copy Link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-sky-700 leading-relaxed">
                Send this link to the customer via WhatsApp/SMS. When the tempo arrives, the customer opens this link to verify material and enter their mobile OTP.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const msg = buildDeliveryConfirmationLinkMessage(createdDispatch);
                  openWhatsApp({ phone: createdDispatch.partyPhone, message: msg });
                }}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Share Link on Customer WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {/* Sales Order Selection (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link Existing Sales Order (Optional)
              </label>
              <select
                value={salesOrderId}
                onChange={handleSelectSalesOrder}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Direct Mill Dispatch (No Sales Order) --</option>
                {salesOrders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.id} — {o.buyer} ({o.fabric}, {formatMeters(o.qty)})
                  </option>
                ))}
              </select>
            </div>

            {/* Party Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer / Party Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Surat Textiles Pvt Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Party Registered Mobile (For OTP) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={partyPhone}
                  onChange={(e) => setPartyPhone(e.target.value)}
                  placeholder="e.g. 98250 12345"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Delivery Address / Godown Destination
              </label>
              <input
                type="text"
                value={partyAddress}
                onChange={(e) => setPartyAddress(e.target.value)}
                placeholder="e.g. Ring Road Textile Market, Surat"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Fabric Details & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fabric Quality / Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                  placeholder="e.g. Cotton 60s Cambric"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Dispatched Metres <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  value={totalMetres}
                  onChange={(e) => setTotalMetres(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Ready Inventory Rolls Picker */}
            {availableRolls.length > 0 && (
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-indigo-600" />
                    Select Rolls from Ready Inventory ({selectedRollIds.length} selected)
                  </span>
                  {selectedRollIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedRollIds([])}
                      className="text-[11px] text-rose-600 hover:underline"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 modern-scrollbar pr-1">
                  {availableRolls.map(r => {
                    const isSelected = selectedRollIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRoll(r)}
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span className="font-mono">{r.id}</span>
                          <span className="text-slate-500 text-[11px]">({r.fabric})</span>
                        </div>
                        <span className="font-mono">{formatMeters(r.metres)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tempo Driver & Vehicle */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                Tempo Driver & Vehicle Assignment
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Driver Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Driver Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="e.g. 98251 44321"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Vehicle Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. GJ-05-AB-1234"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {loading ? 'Creating Factory Dispatch...' : 'Dispatch Shipment & Generate Party Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
