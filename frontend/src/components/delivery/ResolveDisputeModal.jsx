import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { resolveDeliveryDispute } from '../../api/deliveryApi';
import { formatMeters } from '../../utils/formatters';

export default function ResolveDisputeModal({ dispatch, isOpen, onClose, onResolved, showToast }) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('ACCEPT_SHORTAGE');
  const [resolutionNote, setResolutionNote] = useState('');

  if (!isOpen || !dispatch) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      showToast('Please enter an audit resolution note', 'error');
      return;
    }

    try {
      setLoading(true);
      await resolveDeliveryDispute(dispatch.dispatchId, {
        action,
        resolutionNote: resolutionNote.trim()
      });
      showToast(`Dispute resolved successfully with action: ${action}`, 'success');
      if (onResolved) onResolved();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to resolve dispute', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display">Resolve Delivery Dispute</h3>
              <p className="text-[11px] text-slate-400 font-mono">{dispatch.dispatchId} • Admin Authority</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Discrepancy details */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Reported Discrepancy:</span>
            </div>
            <div className="text-[11px]">
              Customer: <span className="font-bold">{dispatch.partyName}</span>
            </div>
            <div className="text-[11px]">
              Dispatched: <span className="font-mono font-bold">{formatMeters(dispatch.totalMetresDispatched)}</span> |
              Received: <span className="font-mono font-bold text-emerald-800">{formatMeters(dispatch.receivedSummary?.actualMetresReceived || 0)}</span> |
              Shortage: <span className="font-mono font-bold text-rose-600">-{formatMeters(dispatch.receivedSummary?.shortageMetres || 0)}</span>
            </div>
            {dispatch.receivedSummary?.remarks && (
              <div className="text-[11px] italic text-slate-600 pt-1">
                "{dispatch.receivedSummary.remarks}"
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Administrative Resolution Action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="ACCEPT_SHORTAGE">Accept Shortage (Reconcile as Partially Delivered)</option>
              <option value="CONFIRM_RECOUNT">Recount Confirmed (Party agreed on full delivery)</option>
              <option value="REJECT_CLAIM">Reject Discrepancy Claim (Confirm as Delivered)</option>
              <option value="MARK_FAILED">Mark Delivery Failed (Return shipment to mill)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Resolution Audit Note <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Spoke with customer manager Mr. Shah. Agreed on 15m shortage due to edge trimming. Credit note issued."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              {loading ? 'Resolving...' : 'Stamp Audit Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

