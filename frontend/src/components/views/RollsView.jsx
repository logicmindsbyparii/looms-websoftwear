import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { formatDate } from '../../utils/formatters';
import { buildRollMessage, openWhatsApp } from '../../utils/whatsapp';
import RollDetailModal from '../rolls/RollDetailModal';
import RollQrLabel from '../rolls/RollQrLabel';
import CustomSelect from '../common/CustomSelect';
import { Eye, QrCode, Plus } from 'lucide-react';
import { WhatsAppBrandIcon } from '../common/WhatsAppIcon';

export default function RollsView({ onOpenScan }) {
  const { userRole, showToast } = useApp();
  const { t } = useTranslation();
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
  }, [search, statusFilter, locationFilter, machineFilter, page, showToast]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/rolls/summary');
      setSummary(res.data || null);
    } catch (err) {
      // Non-critical background fetch
    }
  }, []);

  const fetchFilters = useCallback(async () => {
    try {
      const [locRes, machRes] = await Promise.all([
        api.get('/locations'),
        api.get('/machines')
      ]);
      setLocations(locRes.data || []);
      setMachines(machRes.data || []);
    } catch (err) {
      // Non-critical background fetch
    }
  }, []);

  useEffect(() => {
    fetchRolls();
  }, [fetchRolls]);

  useEffect(() => {
    fetchSummary();
    fetchFilters();
  }, [fetchSummary, fetchFilters]);

  const handleCreateRollSubmit = async (e) => {
    e.preventDefault();
    if (!createMachineId || !createMetres) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    setCreateSubmitting(true);
    try {
      const payload = {
        machineId: createMachineId,
        metres: parseFloat(createMetres),
        fabric: createFabric || undefined,
        quality: createQuality,
        locationId: createLocationId || undefined,
        shift: createShift
      };

      const res = await api.post('/rolls', payload);
      showToast(`Roll ${res.data.id} created successfully!`, 'success');

      setIsCreateRollOpen(false);
      setCreateMetres('');
      setCreateFabric('');

      fetchRolls();
      fetchSummary();

      // Immediately open label print preview for convenience
      setActiveLabelRoll(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to create roll', 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Ready: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Reserved: 'bg-amber-100 text-amber-800 border-amber-200',
      Dispatched: 'bg-blue-100 text-blue-800 border-blue-200',
      Hold: 'bg-orange-100 text-orange-800 border-orange-200',
      Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
      Void: 'bg-slate-200 text-slate-700 border-slate-300'
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
              {t('rollsPage.title')}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {t('rollsPage.badge')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700">
            {t('rollsPage.subtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {(userRole === 'Admin' || userRole === 'Supervisor') && (
            <button
              onClick={() => {
                if (machines.length > 0 && !createMachineId) {
                  setCreateMachineId(machines[0].id);
                  setCreateFabric(machines[0].fabric || '');
                }
                setIsCreateRollOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t('rollsPage.cutRollBtn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{t('rollsPage.totalRolls')}</div>
            <div className="text-2xl font-black text-slate-900 font-mono">{summary.totalRolls}</div>
            <div className="text-[11px] text-blue-600 font-semibold">{summary.totalMetres.toFixed(1)} {t('rollsPage.totalMetres')}</div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">{t('rollsPage.readyInStock')}</div>
            <div className="text-2xl font-black text-emerald-800 font-mono">
              {summary.byStatus?.Ready?.count || 0}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              {(summary.byStatus?.Ready?.metres || 0).toFixed(1)}m
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{t('rollsPage.reservedOrders')}</div>
            <div className="text-2xl font-black text-amber-800 font-mono">
              {summary.byStatus?.Reserved?.count || 0}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold">
              {(summary.byStatus?.Reserved?.metres || 0).toFixed(1)}m
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">{t('rollsPage.dispatched')}</div>
            <div className="text-2xl font-black text-blue-800 font-mono">
              {summary.byStatus?.Dispatched?.count || 0}
            </div>
            <div className="text-[11px] text-blue-600 font-semibold">
              {(summary.byStatus?.Dispatched?.metres || 0).toFixed(1)}m
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">{t('rollsPage.holdReject')}</div>
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
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">{t('rollsPage.searchLabel')}</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('rollsPage.searchPlaceholder')}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">{t('rollsPage.statusLabel')}</label>
            <CustomSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={[
                { value: '', label: t('rollsPage.allStatuses') },
                { value: 'Ready', label: 'Ready', status: 'ready' },
                { value: 'Reserved', label: 'Reserved', status: 'reserved' },
                { value: 'Dispatched', label: 'Dispatched', status: 'dispatched' },
                { value: 'Hold', label: 'Hold', status: 'hold' },
                { value: 'Rejected', label: 'Rejected', status: 'rejected' },
                { value: 'Void', label: 'Void', status: 'off' }
              ]}
              className="w-full"
              buttonClassName="bg-slate-50/50 border-slate-200 py-2"
            />
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">{t('rollsPage.locationLabel')}</label>
            <CustomSelect
              value={locationFilter}
              onChange={(val) => {
                setLocationFilter(val);
                setPage(1);
              }}
              options={[
                { value: '', label: t('rollsPage.allLocations') },
                ...locations.map((l) => ({
                  value: l.id,
                  label: l.name,
                  subtitle: l.shed
                }))
              ]}
              searchable
              className="w-full"
              buttonClassName="bg-slate-50/50 border-slate-200 py-2"
            />
          </div>

          {/* Machine Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">{t('rollsPage.loomLabel')}</label>
            <CustomSelect
              value={machineFilter}
              onChange={(val) => {
                setMachineFilter(val);
                setPage(1);
              }}
              options={[
                { value: '', label: t('rollsPage.allLooms') },
                ...machines.map((m) => ({
                  value: m.id,
                  label: `${m.id} - ${m.name}`,
                  status: m.status
                }))
              ]}
              searchable
              isMono
              align="right"
              className="w-full"
              buttonClassName="bg-slate-50/50 border-slate-200 py-2"
            />
          </div>
        </div>
      </div>

      {/* Rolls Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                <th className="py-3 px-4">{t('rollsPage.rollId')}</th>
                <th className="py-3 px-4">{t('rollsPage.fabricQuality')}</th>
                <th className="py-3 px-4 text-right">{t('rollsPage.length')}</th>
                <th className="py-3 px-4">{t('rollsPage.loomUnit')}</th>
                <th className="py-3 px-4">{t('rollsPage.location')}</th>
                <th className="py-3 px-4">{t('rollsPage.statusLabel')}</th>
                <th className="py-3 px-4">{t('rollsPage.producedDate')}</th>
                <th className="py-3 px-4 pr-16 md:pr-24 text-center">{t('rollsPage.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-700">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    {t('rollsPage.loading')}
                  </td>
                </tr>
              ) : rolls.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-700 space-y-2">
                    <div className="text-3xl">🧵</div>
                    <p className="font-semibold text-slate-700">{t('rollsPage.noRollsFound')}</p>
                    <p className="text-[11px] text-slate-700">{t('rollsPage.noRollsDesc')}</p>
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
                    <td className="py-3.5 px-4 pr-16 md:pr-24 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setInspectRollCode(roll.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center cursor-pointer"
                          title={t('rollsPage.inspectAudit')}
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => setActiveLabelRoll(roll)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all flex items-center justify-center cursor-pointer"
                          title={t('rollsPage.viewQr')}
                        >
                          <QrCode className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => {
                            const msg = buildRollMessage(roll);
                            openWhatsApp({ message: msg });
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all flex items-center justify-center cursor-pointer"
                          title={t('rollsPage.whatsappShare')}
                        >
                          <WhatsAppBrandIcon className="w-4 h-4 fill-[#25D366]" />
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
              {t('rollsPage.pageOf', { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-all font-semibold cursor-pointer"
              >
                {t('rollsPage.prev')}
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-all font-semibold cursor-pointer"
              >
                {t('rollsPage.next')}
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
                <h3 className="text-sm font-bold text-slate-900">{t('rollsPage.createTitle')}</h3>
              </div>
              <button
                onClick={() => setIsCreateRollOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRollSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t('rollsPage.assignedLoom')} *</label>
                  <CustomSelect
                    value={createMachineId}
                    onChange={(val) => {
                      setCreateMachineId(val);
                      const m = machines.find((x) => x.id === val);
                      if (m?.fabric) setCreateFabric(m.fabric);
                    }}
                    options={machines.map((m) => ({
                      value: m.id,
                      label: `${m.id} - ${m.name}`,
                      subtitle: m.shed,
                      status: m.status
                    }))}
                    placeholder="Select Loom..."
                    searchable
                    isMono
                    className="w-full"
                    buttonClassName="w-full bg-white border-slate-300 py-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t('rollsPage.cutLength')} *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={createMetres}
                    onChange={(e) => setCreateMetres(e.target.value)}
                    placeholder={t('rollsPage.lengthPlaceholder')}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t('rollsPage.fabricType')}</label>
                  <input
                    type="text"
                    value={createFabric}
                    onChange={(e) => setCreateFabric(e.target.value)}
                    placeholder="e.g. 70*72 Plain Cambric"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t('rollsPage.qualityGrade')}</label>
                  <CustomSelect
                    value={createQuality}
                    onChange={(val) => setCreateQuality(val)}
                    options={[
                      'A-Grade (Export)',
                      'B-Grade (Local)',
                      'Seconds'
                    ]}
                    className="w-full"
                    buttonClassName="w-full bg-white border-slate-300 py-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t('rollsPage.storageLocation')}</label>
                  <CustomSelect
                    value={createLocationId}
                    onChange={(val) => setCreateLocationId(val)}
                    options={[
                      { value: '', label: 'Default (Floor / First Active)' },
                      ...locations.map((l) => ({
                        value: l.id,
                        label: `${l.name} (${l.shed} - ${l.type})`
                      }))
                    ]}
                    searchable
                    className="w-full"
                    buttonClassName="w-full bg-white border-slate-300 py-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t('rollsPage.productionShift')}</label>
                  <CustomSelect
                    value={createShift}
                    onChange={(val) => setCreateShift(val)}
                    options={[
                      { value: 'Morning', label: t('rollsPage.morningShift') },
                      { value: 'Evening', label: t('rollsPage.eveningShift') },
                      { value: 'Night', label: t('rollsPage.nightShift') }
                    ]}
                    className="w-full"
                    buttonClassName="w-full bg-white border-slate-300 py-2.5"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRollOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {t('rollsPage.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {createSubmitting ? t('rollsPage.creating') : t('rollsPage.confirmCut')}
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
