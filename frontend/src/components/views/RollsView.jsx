import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import { buildRollMessage, openWhatsApp } from '../../utils/whatsapp';
import RollDetailModal from '../rolls/RollDetailModal';
import RollQrLabel from '../rolls/RollQrLabel';

export default function RollsView({ onOpenScan }) {
  const { userRole, showToast } = useApp();
  const [rolls, setRolls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [locations, setLocations] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modals
  const [inspectRollCode, setInspectRollCode] = useState(null);
  const [activeLabelRoll, setActiveLabelRoll] = useState(null);
  const [isCreateRollOpen, setIsCreateRollOpen] = useState(false);

  // Create roll form state
  const [createMachineId, setCreateMachineId] = useState('');
  const [createMetres, setCreateMetres] = useState('');
  const [createFabric, setCreateFabric] = useState('');
  const [createQuality, setCreateQuality] = useState('A-Grade (Export)');
  const [createLocationId, setCreateLocationId] = useState('');
  const [createShift, setCreateShift] = useState('Morning');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const fetchRolls = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (locationFilter) params.append('locationId', locationFilter);
      if (machineFilter) params.append('machineId', machineFilter);
      params.append('page', page);
      params.append('limit', 25);

      const res = await api.get(`/rolls?${params.toString()}`);
      setRolls(res.data || []);
      if (res.meta) {
        setPagination(res.meta);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load rolls', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, locationFilter, machineFilter, page]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/rolls/summary');
      setSummary(res.data);
    } catch (e) {}
  }, []);

  const fetchMasters = useCallback(async () => {
    try {
      const [locRes, mRes] = await Promise.allSettled([
        api.get('/locations?active=true'),
        api.get('/machines')
      ]);
      if (locRes.status === 'fulfilled') setLocations(locRes.value.data || []);
      if (mRes.status === 'fulfilled') setMachines(mRes.value.data || []);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchRolls();
  }, [fetchRolls]);

  useEffect(() => {
    fetchSummary();
    fetchMasters();
  }, [fetchSummary, fetchMasters]);

  const handleCreateRollSubmit = async (e) => {
    e.preventDefault();
    if (!createMachineId || !createMetres) {
      showToast('Machine and Metres are required', 'error');
      return;
    }
    setCreateSubmitting(true);
    try {
      const res = await api.post('/rolls', {
        machineId: createMachineId,
        metres: parseFloat(createMetres),
        fabric: createFabric,
        quality: createQuality,
        locationId: createLocationId || undefined,
        shift: createShift
      });
      showToast(`Roll ${res.data.id} created successfully!`, 'success');
      setIsCreateRollOpen(false);
      setCreateMetres('');
      fetchRolls();
      fetchSummary();
      // Offer immediate print
      setActiveLabelRoll(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to create roll', 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Ready: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      Reserved: 'bg-amber-50 text-amber-700 border-amber-300',
      Dispatched: 'bg-blue-50 text-blue-700 border-blue-300',
      Hold: 'bg-orange-50 text-orange-700 border-orange-300',
      Rejected: 'bg-rose-50 text-rose-700 border-rose-300',
      Void: 'bg-slate-100 text-slate-700 border-slate-300 line-through'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Roll QR & Barcode Tracking
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Live Fleet
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700">
            Real-time fabric roll tracking, QR sticker labels, and immutable ledger movements.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenScan}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
          >
            <span>📷</span>
            <span>Scan QR / Barcode</span>
          </button>

          {(userRole === 'Admin' || userRole === 'Supervisor') && (
            <button
              onClick={() => {
                if (machines.length > 0 && !createMachineId) {
                  setCreateMachineId(machines[0].id);
                  setCreateFabric(machines[0].fabric || '');
                }
                setIsCreateRollOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition-all shadow-sm"
            >
              <span>➕</span>
              <span>Cut & Log Roll</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Total Rolls</div>
            <div className="text-2xl font-black text-slate-900 font-mono">{summary.totalRolls}</div>
            <div className="text-[11px] text-blue-600 font-semibold">{summary.totalMetres.toFixed(1)} metres</div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Ready in Stock</div>
            <div className="text-2xl font-black text-emerald-800 font-mono">
              {summary.byStatus?.Ready?.count || 0}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              {(summary.byStatus?.Ready?.metres || 0).toFixed(1)}m
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Reserved (Orders)</div>
            <div className="text-2xl font-black text-amber-800 font-mono">
              {summary.byStatus?.Reserved?.count || 0}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold">
              {(summary.byStatus?.Reserved?.metres || 0).toFixed(1)}m
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Dispatched</div>
            <div className="text-2xl font-black text-blue-800 font-mono">
              {summary.byStatus?.Dispatched?.count || 0}
            </div>
            <div className="text-[11px] text-blue-600 font-semibold">
              {(summary.byStatus?.Dispatched?.metres || 0).toFixed(1)}m
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Hold / Reject</div>
            <div className="text-2xl font-black text-orange-800 font-mono">
              {(summary.byStatus?.Hold?.count || 0) + (summary.byStatus?.Rejected?.count || 0)}
            </div>
            <div className="text-[11px] text-orange-600 font-semibold">
              {((summary.byStatus?.Hold?.metres || 0) + (summary.byStatus?.Rejected?.metres || 0)).toFixed(1)}m
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Search Rolls</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ID, fabric, or loom..."
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            >
              <option value="">All Statuses</option>
              <option value="Ready">Ready</option>
              <option value="Reserved">Reserved</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Hold">Hold</option>
              <option value="Rejected">Rejected</option>
              <option value="Void">Void</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            >
              <option value="">All Locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.shed})
                </option>
              ))}
            </select>
          </div>

          {/* Machine Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Loom</label>
            <select
              value={machineFilter}
              onChange={(e) => {
                setMachineFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            >
              <option value="">All Looms</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} - {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rolls Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                <th className="py-3 px-4">Roll ID</th>
                <th className="py-3 px-4">Fabric & Quality</th>
                <th className="py-3 px-4 text-right">Length</th>
                <th className="py-3 px-4">Loom Unit</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Produced Date</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-700">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading fabric rolls...
                  </td>
                </tr>
              ) : rolls.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-700 space-y-2">
                    <div className="text-3xl">🧵</div>
                    <p className="font-semibold text-slate-700">No fabric rolls found</p>
                    <p className="text-[11px] text-slate-700">Try adjusting your filters or cut a new roll above.</p>
                  </td>
                </tr>
              ) : (
                rolls.map((roll) => (
                  <tr key={roll._id || roll.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <button
                        onClick={() => setInspectRollCode(roll.id)}
                        className="hover:text-blue-600 transition-colors text-left font-black"
                      >
                        {roll.id}
                      </button>
                      <div className="text-[10px] text-slate-700 font-normal">
                        v{roll.qrVersion || 1} • {roll.scanCount || 0} scans
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 truncate max-w-[180px]" title={roll.fabric}>
                        {roll.fabric}
                      </div>
                      <div className="text-[10px] text-slate-700">{roll.quality}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                      {Number(roll.metres).toFixed(2)}m
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center space-x-1">
                        <span>🏭</span>
                        <span>{roll.machineName || roll.machineId}</span>
                      </div>
                      <div className="text-[10px] text-slate-700">{roll.machineShed}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 flex items-center space-x-1">
                        <span className="text-rose-500">📍</span>
                        <span>{roll.locationId}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(roll.status)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 text-[11px]">
                      {formatDate(roll.producedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setInspectRollCode(roll.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                          title="View / Edit Roll"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => setActiveLabelRoll(roll)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all"
                          title="Print QR Sticker"
                        >
                          🏷️
                        </button>
                        <button
                          onClick={() => {
                            const msg = buildRollMessage(roll);
                            openWhatsApp({ message: msg });
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all"
                          title="Share WhatsApp"
                        >
                          💬
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700">
            <div>
              Showing page <strong className="text-slate-800">{pagination.page}</strong> of <strong className="text-slate-800">{pagination.totalPages}</strong> ({pagination.total} total rolls)
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-all font-semibold"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-all font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Roll Modal */}
      {isCreateRollOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">➕</span>
                <h3 className="text-sm font-bold text-slate-900">Cut & Log Finished Roll (Taka)</h3>
              </div>
              <button
                onClick={() => setIsCreateRollOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRollSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Loom Machine *</label>
                  <select
                    value={createMachineId}
                    onChange={(e) => {
                      const mId = e.target.value;
                      setCreateMachineId(mId);
                      const m = machines.find((x) => x.id === mId);
                      if (m?.fabric) setCreateFabric(m.fabric);
                    }}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                    required
                  >
                    <option value="">Select Loom...</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id} - {m.name} ({m.shed})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Roll Metres (Length) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={createMetres}
                    onChange={(e) => setCreateMetres(e.target.value)}
                    placeholder="e.g. 102.50"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fabric Construction</label>
                  <input
                    type="text"
                    value={createFabric}
                    onChange={(e) => setCreateFabric(e.target.value)}
                    placeholder="e.g. 70*72 Plain Cambric"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quality Grade</label>
                  <select
                    value={createQuality}
                    onChange={(e) => setCreateQuality(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="A-Grade (Export)">A-Grade (Export)</option>
                    <option value="B-Grade (Local)">B-Grade (Local)</option>
                    <option value="Seconds">Seconds</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Storage Location</label>
                  <select
                    value={createLocationId}
                    onChange={(e) => setCreateLocationId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">Default (Floor / First Active)</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.shed} - {l.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shift</label>
                  <select
                    value={createShift}
                    onChange={(e) => setCreateShift(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Morning">Morning (8 AM - 4 PM)</option>
                    <option value="Evening">Evening (4 PM - 12 AM)</option>
                    <option value="Night">Night (12 AM - 8 AM)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRollOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20"
                >
                  {createSubmitting ? 'Creating Roll...' : 'Generate Roll & QR Sticker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Detail Modal */}
      {inspectRollCode && (
        <RollDetailModal
          rollCode={inspectRollCode}
          onClose={() => setInspectRollCode(null)}
          onRefresh={() => {
            fetchRolls();
            fetchSummary();
          }}
        />
      )}

      {/* Printable Label Modal */}
      {activeLabelRoll && (
        <RollQrLabel
          roll={activeLabelRoll}
          onClose={() => setActiveLabelRoll(null)}
        />
      )}
    </div>
  );
}
