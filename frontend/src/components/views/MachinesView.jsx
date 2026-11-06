import React, { useState, useMemo, memo } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LoomVisual from '../common/LoomVisual';
import CustomSelect from '../common/CustomSelect';
import {
  Play,
  Square,
  ShieldAlert,
  Search,
  Cpu,
  Layers,
  ArrowUpDown,
  Plus,
  Activity,
  Gauge,
  Thermometer,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  User,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  RotateCcw
} from 'lucide-react';

export default function MachinesView() {
  const {
    machines,
    userRole,
    setSelectedMachineId,
    updateMachineStatus,
    startAllMachines,
    stopAllMachines,
    emergencyStopAll,
    setIsAddMachineOpen
  } = useApp();
  const { t } = useTranslation();

  const [shedFilter, setShedFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('id'); // 'id' | 'output' | 'rpm' | 'efficiency'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Extract unique sheds and models dynamically from current fleet
  const availableSheds = useMemo(() => {
    const sheds = new Set();
    (machines || []).forEach(m => {
      if (m.shed) sheds.add(m.shed);
    });
    return Array.from(sheds);
  }, [machines]);

  const availableModels = useMemo(() => {
    const models = new Set();
    (machines || []).forEach(m => {
      if (m.model) models.add(m.model);
    });
    return Array.from(models);
  }, [machines]);

  // Filter and Sort Machines
  const filteredMachines = useMemo(() => {
    return (machines || [])
      .filter((m) => {
        const matchShed =
          shedFilter === 'all' ||
          (m.shed || '').toLowerCase().includes(shedFilter.toLowerCase());
        const matchStatus = statusFilter === 'all' || m.status === statusFilter;
        const matchModel =
          modelFilter === 'all' ||
          (m.model || '').toLowerCase().includes(modelFilter.toLowerCase());
        const matchSearch =
          !searchQuery ||
          (m.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.fabric || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.operator || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.shed || '').toLowerCase().includes(searchQuery.toLowerCase());

        return matchShed && matchStatus && matchModel && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'output') return (b.output || 0) - (a.output || 0);
        if (sortBy === 'rpm') return (b.rpm || 0) - (a.rpm || 0);
        if (sortBy === 'efficiency') return (b.efficiency || 0) - (a.efficiency || 0);
        return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
      });
  }, [machines, shedFilter, statusFilter, modelFilter, searchQuery, sortBy]);

  // Operational Fleet Analytics
  const runningCount = useMemo(() => (machines || []).filter(m => m.status === 'running').length, [machines]);
  const stoppedCount = useMemo(() => (machines || []).filter(m => m.status === 'stopped').length, [machines]);
  const idleCount = useMemo(() => (machines || []).filter(m => m.status === 'idle').length, [machines]);
  const maintCount = useMemo(() => (machines || []).filter(m => m.status === 'maintenance').length, [machines]);

  const avgEfficiency = useMemo(() => {
    if (!machines || machines.length === 0) return 0;
    const running = machines.filter(m => m.status === 'running');
    if (running.length === 0) return 0;
    const sum = running.reduce((acc, m) => acc + (m.efficiency || 0), 0);
    return Math.round(sum / running.length);
  }, [machines]);

  const totalOutputMeters = useMemo(() => {
    return (machines || []).reduce((acc, m) => acc + (m.output || 0), 0);
  }, [machines]);

  const clearFilters = () => {
    setShedFilter('all');
    setStatusFilter('all');
    setModelFilter('all');
    setSearchQuery('');
    setSortBy('id');
  };

  const hasActiveFilters = shedFilter !== 'all' || statusFilter !== 'all' || modelFilter !== 'all' || searchQuery !== '';

  return (
    <div className="space-y-6">
      {/* Top Action & Global Controls Header */}
      <div className="heavy-card rounded-2xl p-5 sm:p-6 bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-sky-100 text-sky-700 rounded-xl shadow-2xs">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-900">
                {t('machines.title')}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {machines.length} Weaving Units Configured • Live Telemetry &amp; Actuation
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Add Machine */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {(userRole === 'Admin' || userRole === 'Supervisor') && (
            <button
              onClick={() => setIsAddMachineOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/30 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('dashboard.addLoomBtn')}</span>
            </button>
          )}

          {machines.length > 0 && (
            <>
              {(userRole === 'Admin' || userRole === 'Supervisor') && (
                <>
                  <button
                    onClick={startAllMachines}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{t('dashboard.startAll')}</span>
                  </button>

                  <button
                    onClick={stopAllMachines}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>{t('dashboard.stopAll')}</span>
                  </button>
                </>
              )}

              <button
                onClick={emergencyStopAll}
                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 active:scale-95 animate-pulse cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>E-STOP</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Fleet Live Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`heavy-card p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Looms</span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black font-mono text-slate-900">{machines.length}</div>
          <span className="text-[10px] text-slate-400 font-mono">100% Floor Cap</span>
        </div>

        <div
          onClick={() => setStatusFilter('running')}
          className={`heavy-card p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'running'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Running</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-700">{runningCount}</div>
          <span className="text-[10px] text-emerald-600 font-medium font-mono">
            {machines.length ? Math.round((runningCount / machines.length) * 100) : 0}% Active
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('stopped')}
          className={`heavy-card p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'stopped'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stopped / Off</span>
            <Square className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black font-mono text-rose-700">{stoppedCount}</div>
          <span className="text-[10px] text-rose-500 font-medium font-mono">Requires Attention</span>
        </div>

        <div
          onClick={() => setStatusFilter('idle')}
          className={`heavy-card p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'idle'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Idle</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono text-amber-700">{idleCount}</div>
          <span className="text-[10px] text-amber-500 font-medium font-mono">Standby</span>
        </div>

        <div
          onClick={() => setStatusFilter('maintenance')}
          className={`heavy-card p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'maintenance'
              ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Maintenance</span>
            <Wrench className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black font-mono text-indigo-700">{maintCount}</div>
          <span className="text-[10px] text-indigo-500 font-medium font-mono">Under Service</span>
        </div>

        <div className="heavy-card p-3.5 rounded-2xl border bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fleet Avg Eff</span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className={`text-xl font-black font-mono ${
            avgEfficiency >= 85 ? 'text-emerald-600' : avgEfficiency >= 70 ? 'text-amber-600' : 'text-slate-700'
          }`}>
            {avgEfficiency}%
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {totalOutputMeters.toLocaleString()} m Total
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="heavy-card p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Loom ID, Unit, Model, Fabric, Shed, or Operator..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-2 flex-wrap items-center">
            {/* Shed Filter */}
            <CustomSelect
              value={shedFilter}
              onChange={(val) => setShedFilter(val)}
              options={[
                { value: 'all', label: 'All Sheds' },
                { value: 'shed a', label: 'Shed A (Air-Jet)' },
                { value: 'shed b', label: 'Shed B (Rapier)' }
              ]}
            />

            {/* Status Filter */}
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'running', label: 'Running', status: 'running' },
                { value: 'stopped', label: 'Stopped', status: 'stopped' },
                { value: 'idle', label: 'Idle', status: 'idle' },
                { value: 'maintenance', label: 'Maintenance', status: 'maintenance' }
              ]}
            />

            {/* Model Filter */}
            {availableModels.length > 0 && (
              <CustomSelect
                value={modelFilter}
                onChange={(val) => setModelFilter(val)}
                options={[
                  { value: 'all', label: 'All Models' },
                  ...availableModels.map(m => ({ value: m, label: m }))
                ]}
              />
            )}

            {/* Sort Filter */}
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              align="right"
              options={[
                { value: 'id', label: 'Sort: Loom ID' },
                { value: 'output', label: 'Sort: Output (Meters)' },
                { value: 'efficiency', label: 'Sort: Efficiency %' },
                { value: 'rpm', label: 'Sort: RPM Speed' }
              ]}
            />

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid Card View"
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-sky-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Compact Table View"
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-sky-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                title="Clear Filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Tag Bar */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-400 text-[11px] mr-1">Showing:</span>
          <span className="font-mono font-bold text-slate-700">
            {filteredMachines.length} of {machines.length} Units
          </span>

          {hasActiveFilters && (
            <span className="text-[11px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-medium ml-2">
              Filtered results
            </span>
          )}
        </div>
      </div>

      {/* Grid or Table of Loom Machines */}
      {filteredMachines.length === 0 ? (
        <div className="heavy-card rounded-3xl p-12 text-center space-y-4 bg-white border border-slate-200">
          <Cpu className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="font-bold text-slate-700 text-base">No Loom Machines Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              No weaving machines match your active search or status filters.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
            {(userRole === 'Admin' || userRole === 'Supervisor') && (
              <button
                onClick={() => setIsAddMachineOpen(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('dashboard.addLoomBtn')}</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMachines.map((m) => (
            <MachineCard
              key={m.id}
              machine={m}
              onSelect={setSelectedMachineId}
              onToggleStatus={updateMachineStatus}
              userRole={userRole}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="heavy-card rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Loom ID</th>
                  <th className="py-3 px-4">Unit Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Model &amp; Shed</th>
                  <th className="py-3 px-4">Fabric</th>
                  <th className="py-3 px-4 text-center">RPM</th>
                  <th className="py-3 px-4 text-center">Output</th>
                  <th className="py-3 px-4 text-center">Efficiency</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMachines.map((m) => {
                  const isRunning = m.status === 'running';
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedMachineId(m.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-black text-slate-900 group-hover:text-sky-600">
                        {m.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {m.name || `Unit #${m.id.replace('M-', '')}`}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                            isRunning
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : m.status === 'stopped'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isRunning ? 'bg-emerald-500' : m.status === 'stopped' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                          />
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{m.model || 'Airjet Loom'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{m.shed || 'Shed A'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {m.fabric || '70*72 Plain Cambric'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {m.rpm || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {m.output || 0}m
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-black ${
                            (m.efficiency || 0) >= 85
                              ? 'text-emerald-600'
                              : (m.efficiency || 0) >= 70
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {m.efficiency || 0}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {(userRole === 'Admin' || userRole === 'Supervisor') && (
                            <button
                              onClick={() => updateMachineStatus(m.id, isRunning ? 'stopped' : 'running')}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                isRunning
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title={isRunning ? 'Halt Loom' : 'Start Loom'}
                            >
                              {isRunning ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedMachineId(m.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const MachineCard = memo(function MachineCard({
  machine,
  onSelect,
  onToggleStatus,
  userRole,
  t
}) {
  const isRunning = machine.status === 'running';
  const isStopped = machine.status === 'stopped';

  const handleToggleClick = (e) => {
    e.stopPropagation();
    if (onToggleStatus) {
      onToggleStatus(machine.id, isRunning ? 'stopped' : 'running');
    }
  };

  return (
    <div
      onClick={() => onSelect(machine.id)}
      className={`group heavy-card rounded-2xl p-4 bg-white border hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
        isRunning
          ? 'border-emerald-200/90 hover:border-emerald-400'
          : isStopped
          ? 'border-rose-200/90 hover:border-rose-400'
          : 'border-amber-200/90 hover:border-amber-400'
      }`}
    >
      {/* Top Header Card */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-black text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
              {machine.id}
            </span>
            {machine.model && (
              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md truncate max-w-[120px]">
                {machine.model}
              </span>
            )}
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono flex items-center gap-1 border ${
              isRunning
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isStopped
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRunning ? 'bg-emerald-500 animate-pulse' : isStopped ? 'bg-rose-500' : 'bg-amber-500'
              }`}
            />
            {t(`status.${machine.status}`)}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-black text-slate-800 tracking-tight">
            {machine.name || `Unit #${machine.id.replace('M-', '')}`}
          </h3>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            {machine.shed || 'Main Shed'}
          </span>
        </div>

        {/* Fabric Type & Operator Chips */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
            <Layers className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="font-semibold truncate">{machine.fabric || '70*72 Plain Cambric'}</span>
          </div>

          {machine.operator && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>{machine.operator}</span>
              </span>
              <span>{machine.picksPerMin ? `${machine.picksPerMin} PPM` : ''}</span>
            </div>
          )}
        </div>

        {/* Visual Shuttle Animation Graphic */}
        <div className="my-2.5 py-2.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-center">
          <LoomVisual status={machine.status} rpm={machine.rpm} />
        </div>
      </div>

      {/* Bottom Metrics Bar */}
      <div>
        <div className="pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-1 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-mono">RPM</span>
            <span className="font-black font-mono text-slate-800">{machine.rpm || 0}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-mono">{t('common.output')}</span>
            <span className="font-black font-mono text-slate-800">{machine.output || 0}m</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-mono">EFF</span>
            <span
              className={`font-black font-mono ${
                (machine.efficiency || 0) >= 85
                  ? 'text-emerald-600'
                  : (machine.efficiency || 0) >= 70
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {machine.efficiency || 0}%
            </span>
          </div>
        </div>

        {/* Card Quick Action Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            {machine.temp ? <span>{machine.temp}°C</span> : null}
            {machine.pressure ? <span>• {machine.pressure} bar</span> : null}
          </div>

          <div className="flex items-center gap-1.5">
            {(userRole === 'Admin' || userRole === 'Supervisor') && (
              <button
                type="button"
                onClick={handleToggleClick}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer ${
                  isRunning
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
                title={isRunning ? 'Stop Unit' : 'Start Unit'}
              >
                {isRunning ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Start</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(machine.id);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
            >
              Inspect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
