import React, { useState, useMemo, memo } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LoomVisual from '../common/LoomVisual';
import {
  Play,
  Square,
  ShieldAlert,
  Search,
  Cpu,
  Layers,
  ArrowUpDown,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';

export default function MachinesView() {
  const {
    machines,
    userRole,
    setSelectedMachineId,
    startAllMachines,
    stopAllMachines,
    emergencyStopAll,
    deleteMachine,
    setIsAddMachineOpen,
    loadDemoData
  } = useApp();
  const { t } = useTranslation();

  const [shedFilter, setShedFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('id'); // 'id' | 'output' | 'rpm' | 'efficiency'

  const filteredMachines = useMemo(() => {
    return (machines || [])
      .filter((m) => {
        const matchShed = shedFilter === 'all' || (m.shed || '').toLowerCase().includes(shedFilter.toLowerCase());
        const matchStatus = statusFilter === 'all' || m.status === statusFilter;
        const matchSearch =
          !searchQuery ||
          (m.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.fabric || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.model || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchShed && matchStatus && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'output') return (b.output || 0) - (a.output || 0);
        if (sortBy === 'rpm') return (b.rpm || 0) - (a.rpm || 0);
        if (sortBy === 'efficiency') return (b.efficiency || 0) - (a.efficiency || 0);
        return (a.id || '').localeCompare(b.id || '');
      });
  }, [machines, shedFilter, statusFilter, searchQuery, sortBy]);

  const runningCount = useMemo(() => (machines || []).filter(m => m.status === 'running').length, [machines]);
  const stoppedCount = useMemo(() => (machines || []).filter(m => m.status === 'stopped').length, [machines]);
  const idleCount = useMemo(() => (machines || []).filter(m => m.status === 'idle' || m.status === 'maintenance').length, [machines]);

  return (
    <div className="space-y-6">
      {/* Top Action & Summary Bar */}
      <div className="heavy-card rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <Cpu className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-900">
              {t('machines.title')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {t('machines.subtitle')}
          </p>
        </div>

        {/* Global Controls & Add Machine */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {(userRole === 'Admin' || userRole === 'Supervisor') && (
            <button
              onClick={() => setIsAddMachineOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/30 flex items-center justify-center gap-1.5 active:scale-95"
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
                    className="flex-1 sm:flex-none px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{t('dashboard.startAll')}</span>
                  </button>

                  <button
                    onClick={stopAllMachines}
                    className="flex-1 sm:flex-none px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>{t('dashboard.stopAll')}</span>
                  </button>
                </>
              )}

              <button
                onClick={emergencyStopAll}
                className="flex-1 sm:flex-none px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 active:scale-95 animate-pulse"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>E-STOP</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t('common.search')} (ID, Fabric, Model)...`}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={shedFilter}
            onChange={(e) => setShedFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs text-slate-700"
          >
            <option value="all">{t('common.all')} {t('common.shed')}</option>
            <option value="shed a">Shed A</option>
            <option value="shed b">Shed B</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs text-slate-700"
          >
            <option value="all">{t('common.all')} {t('common.statusLabel')}</option>
            <option value="running">{t('status.running')}</option>
            <option value="stopped">{t('status.stopped')}</option>
            <option value="idle">{t('status.idle')}</option>
            <option value="maintenance">{t('status.maintenance')}</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs text-slate-700"
          >
            <option value="id">Sort: Loom ID</option>
            <option value="output">Sort: {t('common.output')}</option>
            <option value="rpm">Sort: RPM</option>
            <option value="efficiency">Sort: {t('common.efficiency')}</option>
          </select>
        </div>
      </div>

      {/* Grid of Loom Cards */}
      {filteredMachines.length === 0 ? (
        <div className="heavy-card rounded-3xl p-12 text-center space-y-3 bg-white">
          <Cpu className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">{t('common.noData')}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search filters or register a new loom machine.
          </p>
          {(userRole === 'Admin' || userRole === 'Supervisor') && (
            <button
              onClick={() => setIsAddMachineOpen(true)}
              className="mt-2 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('dashboard.addLoomBtn')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMachines.map((m) => (
            <MachineCard
              key={m.id}
              machine={m}
              onSelect={setSelectedMachineId}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const MachineCard = memo(function MachineCard({ machine, onSelect, t }) {
  const isRunning = machine.status === 'running';

  return (
    <div
      onClick={() => onSelect(machine.id)}
      className={`group heavy-card rounded-2xl p-4 bg-white border hover:shadow-md transition-colors duration-150 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
        isRunning
          ? 'border-emerald-200/80 hover:border-emerald-400'
          : machine.status === 'stopped'
          ? 'border-rose-200/80 hover:border-rose-400'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Header Card */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono font-black text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
            {machine.id}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
              isRunning
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : machine.status === 'stopped'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {t(`status.${machine.status}`)}
          </span>
        </div>

        <h3 className="text-xs font-bold text-slate-800 truncate mb-1">
          {machine.name}
        </h3>
        <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
          <span>{machine.shed}</span>
          <span className="text-slate-600 font-semibold">{machine.fabric}</span>
        </div>

        {/* Visual Shuttle Animation Graphic */}
        <div className="my-3 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
          <LoomVisual status={machine.status} rpm={machine.rpm} />
        </div>
      </div>

      {/* Bottom Metrics Bar */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-center text-xs">
        <div>
          <span className="text-[10px] text-slate-400 block font-mono">RPM</span>
          <span className="font-extrabold font-mono text-slate-800">{machine.rpm}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block font-mono">{t('common.output')}</span>
          <span className="font-extrabold font-mono text-slate-800">{machine.output}m</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block font-mono">EFF</span>
          <span
            className={`font-extrabold font-mono ${
              machine.efficiency >= 85 ? 'text-emerald-600' : machine.efficiency >= 60 ? 'text-amber-600' : 'text-slate-500'
            }`}
          >
            {machine.efficiency}%
          </span>
        </div>
      </div>
    </div>
  );
});
