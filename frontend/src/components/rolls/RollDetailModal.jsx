import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import { buildRollMessage, openWhatsApp } from '../../utils/whatsapp';
import RollQrLabel from './RollQrLabel';
import CustomSelect from '../common/CustomSelect';
import { WhatsAppBrandIcon } from '../common/WhatsAppIcon';
import { QrCode, X } from 'lucide-react';

export default function RollDetailModal({ rollCode, onClose, onRefresh }) {
  const { userRole, showToast } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);

  // Sub-action modal states
  const [activeAction, setActiveAction] = useState(null); // 'transfer' | 'status' | 'correctMetres' | 'void' | 'reissueQr' | 'label'
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusOrderId, setStatusOrderId] = useState('');
  const [newMetres, setNewMetres] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchStaffDetails = async () => {
    if (!rollCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/rolls/scan/${encodeURIComponent(rollCode)}`);
      setData(res.data);
      if (res.data?.roll) {
        setNewMetres(res.data.roll.metres);
      }
    } catch (err) {
      setError(err.message || 'Failed to load staff roll details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffDetails();
    // Load locations for transfer dropdown
    api.get('/locations?active=true')
      .then(res => setLocations(res.data || []))
      .catch(() => {});
  }, [rollCode]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferTargetId) {
      showToast('Please select a destination location', 'error');
      return;
    }
    setActionSubmitting(true);
    try {
      await api.post(`/rolls/${data.roll.id}/transfer`, {
        toLocationId: transferTargetId,
        note: transferNote
      });
      showToast('Roll transferred successfully', 'success');
      setActiveAction(null);
      setTransferNote('');
      fetchStaffDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Transfer failed', 'error');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!newStatus) {
      showToast('Please select a new status', 'error');
      return;
    }
    setActionSubmitting(true);
    try {
      await api.post(`/rolls/${data.roll.id}/status`, {
        status: newStatus,
        note: statusNote,
        orderId: statusOrderId
      });
      showToast(`Roll status changed to ${newStatus}`, 'success');
      setActiveAction(null);
      setStatusNote('');
      setStatusOrderId('');
      fetchStaffDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Status transition failed', 'error');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleCorrectMetres = async (e) => {
    e.preventDefault();
    if (!actionReason.trim()) {
      showToast('A reason is mandatory for correcting metres', 'error');
      return;
    }
    setActionSubmitting(true);
    try {
      await api.post(`/rolls/${data.roll.id}/correct-metres`, {
        metres: parseFloat(newMetres),
        reason: actionReason
      });
      showToast('Metres corrected successfully', 'success');
      setActiveAction(null);
      setActionReason('');
      fetchStaffDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Correction failed', 'error');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReissueQr = async (e) => {
    e.preventDefault();
    setActionSubmitting(true);
    try {
      await api.post(`/rolls/${data.roll.id}/reissue-qr`, {
        reason: actionReason || 'QR label reissued'
      });
      showToast('New QR token generated and sticker reissued', 'success');
      setActiveAction(null);
      setActionReason('');
      fetchStaffDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Reissue failed', 'error');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleVoid = async (e) => {
    e.preventDefault();
    if (!actionReason.trim()) {
      showToast('A reason is mandatory to void a roll', 'error');
      return;
    }
    setActionSubmitting(true);
    try {
      await api.post(`/rolls/${data.roll.id}/void`, {
        reason: actionReason
      });
      showToast('Roll marked as Void', 'success');
      setActiveAction(null);
      setActionReason('');
      fetchStaffDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Voiding roll failed', 'error');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!data?.roll) return;
    const msg = buildRollMessage(data.roll);
    openWhatsApp({ message: msg });
  };

  const getStatusBadge = (status) => {
    const colors = {
      Ready: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      Reserved: 'bg-amber-50 text-amber-700 border-amber-300',
      Dispatched: 'bg-blue-50 text-blue-700 border-blue-300',
      Hold: 'bg-orange-50 text-orange-700 border-orange-300',
      Rejected: 'bg-rose-50 text-rose-700 border-rose-300',
      Void: 'bg-slate-100 text-slate-700 border-slate-400 line-through'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
        {status}
      </span>
    );
  };

  const allowedTransitions = (currentStatus) => {
    switch (currentStatus) {
      case 'Ready':
        return ['Reserved', 'Hold', 'Rejected'];
      case 'Reserved':
        return ['Dispatched', 'Ready', 'Hold', 'Rejected'];
      case 'Hold':
        return ['Ready'];
      default:
        return [];
    }
  };

  const canManage = userRole === 'Admin' || userRole === 'Supervisor';
  const isAdmin = userRole === 'Admin';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
              🧵
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black font-mono text-slate-900 tracking-tight">
                  {data?.roll?.id || rollCode}
                </h2>
                {data?.roll && getStatusBadge(data.roll.status)}
              </div>
              <p className="text-xs text-slate-700">Internal Staff Operations & Movement Ledger</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsAppShare}
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all text-xs font-semibold flex items-center space-x-1"
              title="Share via WhatsApp"
            >
              <WhatsAppBrandIcon className="w-3.5 h-3.5 fill-[#25D366] shrink-0" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={() => setActiveAction('label')}
              className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all text-xs font-semibold flex items-center space-x-1"
              title="Print QR Sticker"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span className="hidden sm:inline">Print Label</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-700">Loading roll details...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
              <div className="text-2xl">⚠️</div>
              <h3 className="text-sm font-bold text-rose-800">Scan Lookup Error</h3>
              <p className="text-xs text-rose-600">{error}</p>
            </div>
          ) : data?.roll ? (
            <>
              {/* Hero Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Length (Metres)</div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                    {Number(data?.roll?.metres || 0).toFixed(2)}m
                  </div>
                  {data.roll.originalMetres && data.roll.originalMetres !== data.roll.metres && (
                    <div className="text-[10px] text-amber-600 font-medium">
                      Orig: {Number(data?.roll?.originalMetres || 0).toFixed(2)}m
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Fabric</div>
                  <div className="text-sm font-bold text-slate-900 mt-1 truncate" title={data.roll.fabric}>
                    {data.roll.fabric}
                  </div>
                  <div className="text-[10px] text-slate-700 truncate">{data.roll.quality}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Current Location</div>
                  <div className="text-sm font-bold text-slate-900 mt-1 truncate">
                    {data.location?.name || data.roll.locationId}
                  </div>
                  <div className="text-[10px] text-slate-700">{data.location?.shed || 'Main Shed'}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Loom & Status</div>
                  <div className="text-sm font-bold text-slate-900 mt-1 flex items-center space-x-1">
                    <span>🏭</span>
                    <span className="truncate">{data.machine?.name || data.roll.machineId}</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium capitalize">
                    {data.machine?.status} ({data.machine?.rpm || 0} RPM)
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              {canManage && data.roll.status !== 'Void' && (
                <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-sky-900 mr-2">Staff Actions:</span>

                  {data.roll.status !== 'Dispatched' && (
                    <button
                      onClick={() => setActiveAction('transfer')}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold transition-all shadow-sm flex items-center space-x-1"
                    >
                      <span>📍</span>
                      <span>Transfer Location</span>
                    </button>
                  )}

                  {allowedTransitions(data.roll.status).length > 0 && (
                    <button
                      onClick={() => {
                        setActiveAction('status');
                        setNewStatus(allowedTransitions(data.roll.status)[0]);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold transition-all shadow-sm flex items-center space-x-1"
                    >
                      <span>🔄</span>
                      <span>Change Status</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveAction('reissueQr')}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold transition-all shadow-sm flex items-center space-x-1"
                  >
                    <span>🔄</span>
                    <span>Reissue QR (v{data.roll.qrVersion || 1})</span>
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setActiveAction('correctMetres')}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-all shadow-sm flex items-center space-x-1"
                      >
                        <span>✏️</span>
                        <span>Correct Metres</span>
                      </button>
                      <button
                        onClick={() => setActiveAction('void')}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold transition-all shadow-sm flex items-center space-x-1"
                      >
                        <span>🚫</span>
                        <span>Void Roll</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Sub-action Modal Forms */}
              {activeAction === 'transfer' && (
                <form onSubmit={handleTransfer} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Transfer Location</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Destination Location</label>
                      <CustomSelect
                        value={transferTargetId}
                        onChange={(val) => setTransferTargetId(val)}
                        options={locations.map((loc) => ({
                          value: loc.id,
                          label: `${loc.name} (${loc.shed} - ${loc.type})`
                        }))}
                        placeholder="Select location..."
                        searchable
                        className="w-full"
                        buttonClassName="w-full bg-white border-slate-300 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Note (Optional)</label>
                      <input
                        type="text"
                        value={transferNote}
                        onChange={(e) => setTransferNote(e.target.value)}
                        placeholder="e.g. Moved to Rack A-04 for inspection"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveAction(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionSubmitting}
                      className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                    >
                      {actionSubmitting ? 'Transferring...' : 'Confirm Transfer'}
                    </button>
                  </div>
                </form>
              )}

              {activeAction === 'status' && (
                <form onSubmit={handleStatusChange} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Transition Status</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">New Status</label>
                      <CustomSelect
                        value={newStatus}
                        onChange={(val) => setNewStatus(val)}
                        options={allowedTransitions(data.roll.status).map((s) => ({
                          value: s,
                          label: s,
                          status: s
                        }))}
                        placeholder="Select new status..."
                        className="w-full"
                        buttonClassName="w-full bg-white border-slate-300 py-2"
                      />
                    </div>
                    {newStatus === 'Reserved' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Sales Order ID</label>
                        <input
                          type="text"
                          value={statusOrderId}
                          onChange={(e) => setStatusOrderId(e.target.value)}
                          placeholder="e.g. ORD-8401"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                        />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Reason Note {['Hold', 'Rejected'].includes(newStatus) ? '(Mandatory)' : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        placeholder="State reason for status transition"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                        required={['Hold', 'Rejected'].includes(newStatus)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveAction(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionSubmitting}
                      className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                    >
                      {actionSubmitting ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </form>
              )}

              {activeAction === 'correctMetres' && (
                <form onSubmit={handleCorrectMetres} className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Correct Roll Metres (Admin)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-amber-900 mb-1">New Metres</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newMetres}
                        onChange={(e) => setNewMetres(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-amber-300 rounded-xl bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-amber-900 mb-1">Correction Reason *</label>
                      <input
                        type="text"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="Mandatory reason for audit ledger"
                        className="w-full text-xs px-3 py-2 border border-amber-300 rounded-xl bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveAction(null)}
                      className="px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionSubmitting}
                      className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
                    >
                      {actionSubmitting ? 'Saving...' : 'Apply Correction'}
                    </button>
                  </div>
                </form>
              )}

              {activeAction === 'reissueQr' && (
                <form onSubmit={handleReissueQr} className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider">Reissue QR Sticker</h4>
                  <p className="text-xs text-sky-700">
                    This will invalidate the previous QR sticker and increment version to {(data.roll.qrVersion || 1) + 1}.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-sky-900 mb-1">Reason (Optional)</label>
                    <input
                      type="text"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="e.g. Sticker torn, reprinted for godown"
                      className="w-full text-xs px-3 py-2 border border-sky-300 rounded-xl bg-white"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveAction(null)}
                      className="px-3 py-1.5 text-xs text-sky-800 hover:bg-sky-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionSubmitting}
                      className="px-4 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm"
                    >
                      {actionSubmitting ? 'Reissuing...' : 'Reissue QR'}
                    </button>
                  </div>
                </form>
              )}

              {activeAction === 'void' && (
                <form onSubmit={handleVoid} className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">Void Fabric Roll (Permanent)</h4>
                  <p className="text-xs text-rose-700">
                    Marking this roll as Void will keep it in the audit history forever but deactivate it from active stock.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-rose-900 mb-1">Void Reason *</label>
                    <input
                      type="text"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Mandatory reason for audit ledger"
                      className="w-full text-xs px-3 py-2 border border-rose-300 rounded-xl bg-white"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveAction(null)}
                      className="px-3 py-1.5 text-xs text-rose-800 hover:bg-rose-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionSubmitting}
                      className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
                    >
                      {actionSubmitting ? 'Voiding...' : 'Confirm Void'}
                    </button>
                  </div>
                </form>
              )}

              {/* Movement Ledger Timeline */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <span>📜</span>
                    <span>Append-Only Movement Ledger ({data.movements?.length || 0})</span>
                  </h3>
                  <span className="text-[11px] text-slate-700">Immutable Audit Trail</span>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3 max-h-64 overflow-y-auto">
                  {data.movements && data.movements.length > 0 ? (
                    data.movements.map((m, idx) => (
                      <div key={m._id || idx} className="flex items-start space-x-3 text-xs border-b border-slate-200/60 pb-2.5 last:border-b-0 last:pb-0">
                        <span className="text-base mt-0.5">
                          {m.type === 'created' ? '✨' :
                           m.type === 'transfer' ? '📍' :
                           m.type === 'status_change' ? '🔄' :
                           m.type === 'metres_correction' ? '✏️' :
                           m.type === 'qr_reissued' ? '🏷️' : '🚫'}
                        </span>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                              {m.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-slate-700">
                              {formatDate(m.at)}
                            </span>
                          </div>
                          <p className="text-slate-700">{m.note || 'No additional note'}</p>
                          <div className="text-[10px] text-slate-700 flex items-center space-x-3 pt-0.5">
                            <span>By: <strong className="text-slate-700">{m.byName || 'Staff'}</strong></span>
                            {m.fromLocationId && m.toLocationId && (
                              <span>From: {m.fromLocationId} → To: {m.toLocationId}</span>
                            )}
                            {m.metresBefore != null && m.metresAfter != null && (
                              <span>{m.metresBefore}m → {m.metresAfter}m</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-700 text-center py-2">No movements recorded yet</p>
                  )}
                </div>
              </div>

              {/* Scan Metadata */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-700">
                <div>Total Scans: <strong className="text-slate-700">{data.roll.scanCount || 0}</strong></div>
                <div>Last Scanned: <strong className="text-slate-700">{data.roll.lastScannedAt ? formatDate(data.roll.lastScannedAt) : 'Never'}</strong></div>
                {data.roll.lastScannedBy?.username && (
                  <div>By: <strong className="text-slate-700">{data.roll.lastScannedBy.username} ({data.roll.lastScannedBy.role})</strong></div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Embedded Printable Label Modal */}
      {activeAction === 'label' && data?.roll && (
        <RollQrLabel roll={data.roll} onClose={() => setActiveAction(null)} />
      )}
    </div>
  );
}

