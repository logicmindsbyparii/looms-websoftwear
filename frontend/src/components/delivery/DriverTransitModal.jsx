import React, { useState } from 'react';
import {
  X,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  Navigation,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { updateDriverTransit } from '../../api/deliveryApi';

export default function DriverTransitModal({ dispatch, isOpen, onClose, onUpdated, showToast }) {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState(null);

  if (!isOpen || !dispatch) return null;

  // Handle GPS capture
  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setAddress(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
        setGpsLoading(false);
        showToast('GPS coordinates captured!', 'success');
      },
      (err) => {
        setGpsLoading(false);
        showToast(`GPS Error: ${err.message}`, 'error');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleAction = async (action) => {
    try {
      setLoading(true);
      await updateDriverTransit(dispatch.dispatchId, {
        action,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        address: address.trim() || undefined
      });
      showToast(`Transit status updated: ${action}`, 'success');
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update transit status', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display">Tempo Driver Transit Console</h3>
              <p className="text-[11px] text-slate-400 font-mono">{dispatch.dispatchId} • {dispatch.driver?.vehicleNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Strict Fraud Rule Alert Banner */}
        <div className="bg-rose-50 border-b border-rose-200 p-3.5 flex items-start gap-2.5 text-rose-900 text-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Strict Factory Security Invariant:</span> Drivers cannot mark shipments as "Delivered". Only the customer party can inspect rolls and enter their mobile OTP to complete delivery.
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Current Shipment Status */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
            <span className="text-slate-500">Current Status:</span>
            <span className="font-bold text-slate-900 font-mono px-2 py-0.5 bg-white border border-slate-200 rounded-md">
              {dispatch.status}
            </span>
          </div>

          {/* GPS Location Input */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold">Driver Live Location / Checkpoint Note</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Surat-Navsari Highway Toll Plaza"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={handleCaptureGPS}
                disabled={gpsLoading}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold flex items-center gap-1 text-slate-700 transition-colors"
                title="Get Device GPS"
              >
                <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>GPS</span>
              </button>
            </div>
          </div>

          {/* Permitted Actions */}
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Permitted Transit Actions:</div>

            {dispatch.status === 'Dispatched' && (
              <button
                onClick={() => handleAction('PICK_UP')}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Package className="w-4 h-4" />
                <span>Mark Material Picked Up from Mill</span>
              </button>
            )}

            {['Dispatched', 'Picked Up'].includes(dispatch.status) && (
              <button
                onClick={() => handleAction('START_TRANSIT')}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Truck className="w-4 h-4" />
                <span>Start Tempo Journey (In Transit)</span>
              </button>
            )}

            {['Picked Up', 'In Transit'].includes(dispatch.status) && (
              <button
                onClick={() => handleAction('UPDATE_GPS')}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <MapPin className="w-4 h-4" />
                <span>Ping GPS Location Checkpoint</span>
              </button>
            )}

            {['Picked Up', 'In Transit'].includes(dispatch.status) && (
              <button
                onClick={() => handleAction('ARRIVED')}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Arrived at Customer Destination (Awaiting Confirmation)</span>
              </button>
            )}

            {/* Deliberately Disabled Delivered Button with Explanation */}
            <button
              type="button"
              disabled
              className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 border border-dashed border-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed text-xs"
              title="Blocked: Driver cannot complete delivery"
            >
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              <span>Mark Delivered (Forbidden for Driver)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
