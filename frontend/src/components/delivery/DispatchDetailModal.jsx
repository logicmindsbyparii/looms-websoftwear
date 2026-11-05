import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Package,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Copy,
  ExternalLink,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { fetchDispatchDetails } from '../../api/deliveryApi';
import { openWhatsApp, buildDeliveryConfirmationLinkMessage } from '../../utils/whatsapp';
import { formatMeters, formatDate } from '../../utils/formatters';

const STATUS_STEPS = [
  { key: 'Dispatched', label: 'Dispatched' },
  { key: 'Picked Up', label: 'Picked Up' },
  { key: 'In Transit', label: 'In Transit' },
  { key: 'Awaiting Receiver Confirmation', label: 'Awaiting Confirmation' },
  { key: 'Delivered', label: 'Delivered' }
];

export default function DispatchDetailModal({ dispatchId, isOpen, onClose, onOpenDispute, showToast }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (isOpen && dispatchId) {
      setLoading(true);
      fetchDispatchDetails(dispatchId)
        .then(res => setData(res.data))
        .catch(err => {
          if (showToast) showToast(err.message || 'Failed to load dispatch details', 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, dispatchId, showToast]);

  if (!isOpen) return null;

  const dispatch = data?.dispatch;
  const auditLogs = data?.auditLogs || [];
  const confirmation = data?.confirmation;

  const isDisputed = dispatch?.status === 'Delivery Disputed' || dispatch?.status === 'Partially Delivered';
  const isDelivered = dispatch?.status === 'Delivered';

  // Helper for stepper
  const getStepIndex = (status) => {
    if (status === 'Delivered' || status === 'Partially Delivered' || status === 'Delivery Disputed') return 4;
    if (status === 'Awaiting Receiver Confirmation') return 3;
    if (status === 'In Transit') return 2;
    if (status === 'Picked Up') return 1;
    return 0;
  };

  const currentStep = getStepIndex(dispatch?.status);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display tracking-tight">{dispatch?.dispatchId || dispatchId}</h2>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isDelivered ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' :
                  isDisputed ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' :
                  'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                }`}>
                  {dispatch?.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Party Delivery Tracking & Audit Trail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !dispatch ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Loading dispatch audit history...
          </div>
        ) : (
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Stepper Progress Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between relative">
                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div key={step.key} className="flex flex-col items-center z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isCompleted
                          ? isDisputed && idx === 4
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[10px] sm:text-xs mt-1.5 font-medium ${isCurrent ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                        {isDisputed && idx === 4 ? dispatch.status : step.label}
                      </span>
                    </div>
                  );
                })}
                {/* Connecting Line */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* If Disputed: Prominent Dispute Alert + Resolve Button */}
            {isDisputed && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">Delivery Discrepancy Flagged</h4>
                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                      {dispatch.disputeDetails?.reason || `Shortage: ${dispatch.receivedSummary?.shortageMetres || 0}m reported by customer.`}
                    </p>
                    {dispatch.disputeDetails?.resolved && (
                      <p className="text-[11px] text-emerald-700 font-bold mt-1">
                        ✓ Resolved: {dispatch.disputeDetails.resolutionAction} ({dispatch.disputeDetails.resolutionNote})
                      </p>
                    )}
                  </div>
                </div>
                {!dispatch.disputeDetails?.resolved && onOpenDispute && (
                  <button
                    onClick={() => onOpenDispute(dispatch)}
                    className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shrink-0 transition-colors shadow-xs"
                  >
                    Resolve Dispute
                  </button>
                )}
              </div>
            )}

            {/* Summary Cards: Customer & Driver */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Customer / Party</span>
                <div className="text-sm font-bold text-slate-900">{dispatch.partyName}</div>
                <div className="text-slate-600 font-mono">{dispatch.partyPhone}</div>
                {dispatch.partyAddress && <div className="text-slate-500">{dispatch.partyAddress}</div>}
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tempo Driver & Vehicle</span>
                <div className="text-sm font-bold text-slate-900 font-mono">{dispatch.driver.vehicleNumber}</div>
                <div className="text-slate-700">{dispatch.driver.name} ({dispatch.driver.phone})</div>
                {dispatch.currentLocation?.address && (
                  <div className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Last GPS: {dispatch.currentLocation.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dispatched vs Received Quantity Breakdown */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Material Verification Breakdown</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Dispatched Qty</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{formatMeters(dispatch.totalMetresDispatched)}</span>
                  <span className="text-[10px] text-slate-500 block">({dispatch.totalRollsDispatched} rolls)</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Received Qty</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {dispatch.receivedSummary?.actualMetresReceived != null
                      ? formatMeters(dispatch.receivedSummary.actualMetresReceived)
                      : 'Pending'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    ({dispatch.receivedSummary?.actualRollsReceived != null ? `${dispatch.receivedSummary.actualRollsReceived} rolls` : 'Pending'})
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Shortage</span>
                  <span className={`font-mono font-bold text-sm ${dispatch.receivedSummary?.shortageMetres > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {dispatch.receivedSummary?.shortageMetres != null ? formatMeters(dispatch.receivedSummary.shortageMetres) : '0m'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Receiver Stamped</span>
                  <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                    {dispatch.receivedSummary?.receiverName || 'Awaiting'}
                  </span>
                </div>
              </div>

              {/* Damaged Rolls Details if any */}
              {dispatch.receivedSummary?.damagedRolls && dispatch.receivedSummary.damagedRolls.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-rose-800">Damaged Rolls Reported:</span>
                  {dispatch.receivedSummary.damagedRolls.map((d, i) => (
                    <div key={i} className="text-rose-700">
                      • {d.rollId}: {d.damageType} — {d.description}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Share Link Action */}
            <div className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Party Link:</span>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/?delivery=${dispatch.confirmationToken}`}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-700 select-all"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/?delivery=${dispatch.confirmationToken}`);
                  if (showToast) showToast('Delivery link copied!', 'success');
                }}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold"
                title="Copy Link"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const msg = buildDeliveryConfirmationLinkMessage(dispatch);
                  openWhatsApp({ phone: dispatch.partyPhone, message: msg });
                }}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                title="Share on WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Immutable Audit Log Trail */}
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                Permanent Immutable Delivery Audit Trail ({auditLogs.length} events)
              </span>
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto modern-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-600 font-mono text-[11px] border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">Actor</th>
                      <th className="p-2.5">Status Flow</th>
                      <th className="p-2.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {auditLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 font-mono text-[11px]">
                        <td className="p-2.5 whitespace-nowrap text-slate-500">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="p-2.5 whitespace-nowrap font-bold text-slate-900">
                          {log.action}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="text-slate-800">{log.performedBy?.name || 'Party'}</span>
                          <span className="text-slate-400 block text-[10px]">({log.performedBy?.type})</span>
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          {log.statusFrom ? `${log.statusFrom} → ${log.statusTo}` : log.statusTo || '-'}
                        </td>
                        <td className="p-2.5 max-w-xs truncate text-slate-600 font-sans">
                          {log.details?.reason || log.details?.remarks || JSON.stringify(log.details || {})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
