import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import StatCard from '../common/StatCard';
import { formatMeters, formatRupees } from '../../utils/formatters';
import {
  Cpu,
  Boxes,
  Zap,
  AlertTriangle,
  Play,
  Square,
  ShieldAlert,
  Activity,
  Layers,
  ArrowRight,
  Plus,
  RefreshCw,
  Users,
  Briefcase
} from 'lucide-react';

export default function DashboardView() {
  const {
    machines,
    userRole,
    alarms,
    powerLoadPercent,
    setActiveTab,
    startAllMachines,
    stopAllMachines,
    emergencyStopAll,
    setSelectedMachineId,
    ackAlarm,
    setIsAddMachineOpen,
    loadDemoData
  } = useApp();
  const { t } = useTranslation();

  const runningLooms = (machines || []).filter(m => m?.status === 'running').length;
  const stoppedLooms = (machines || []).filter(m => m?.status === 'stopped').length;
  const idleLooms = (machines || []).filter(m => m?.status === 'idle' || m?.status === 'maintenance').length;

  const totalMetersToday = (machines || []).reduce((acc, m) => acc + (m?.output || 0), 0);
  const avgEfficiency = runningLooms > 0
    ? Math.round((machines || []).filter(m => m?.status === 'running').reduce((acc, m) => acc + (m?.efficiency || 0), 0) / runningLooms)
    : 0;

  const shedACount = (machines || []).filter(m => m?.shed?.toLowerCase().includes('shed a') && m?.status === 'running').length;
  const shedBCount = (machines || []).filter(m => m?.shed?.toLowerCase().includes('shed b') && m?.status === 'running').length;

  const topMachines = [...(machines || [])].sort((a, b) => (b?.output || 0) - (a?.output || 0)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner / Factory Operational Command Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-bold font-mono border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('app.millFacility')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-900">
            {t('dashboard.factoryOverview')}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl font-medium">
            {t('dashboard.monitoredUnits', { count: machines.length })}
          </p>
        </div>

        {/* Global Batch Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => setIsAddMachineOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/30 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('dashboard.addLoomBtn')}</span>
          </button>

          {machines.length > 0 && (
            <>
              <button
                onClick={startAllMachines}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t('dashboard.startAll')}</span>
              </button>

              <button
                onClick={stopAllMachines}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{t('dashboard.stopAll')}</span>
              </button>

              <button
                onClick={emergencyStopAll}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-900/40 active:scale-95 animate-pulse"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{t('dashboard.emergencyHalt')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* When 0 machines exist: Display Onboarding Setup Guide */}
      {machines.length === 0 && (
        <div className="heavy-card rounded-3xl p-8 bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold font-mono text-sky-700 uppercase tracking-wider bg-sky-100 px-2.5 py-1 rounded-md">
                🚀 Clean Slate Setup Ready
              </span>
              <h3 className="text-xl font-black font-display text-slate-900 mt-2">
                Aapka Factory Data Fresh Hai — Shuru Se Naya Data Set Karein
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Aap apni mill ki actual machines, workers, yarn stock aur brokers shuru se configure kar sakte hain.
              </p>
            </div>

            {userRole === 'Admin' && (
              <button
                onClick={loadDemoData}
                className="px-4 py-2 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl transition-all shadow-2xs flex items-center gap-2 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                {t('dataManager.loadDemoBtn')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <button
              onClick={() => setIsAddMachineOpen(true)}
              className="p-4 rounded-2xl bg-white hover:bg-sky-50/80 border border-slate-200 hover:border-sky-300 transition-all text-left group shadow-xs"
            >
              <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl w-fit mb-3 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">1. {t('dashboard.addLoomBtn')}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{t('machines.subtitle')}</p>
            </button>

            <button
              onClick={() => setActiveTab('workers')}
              className="p-4 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 transition-all text-left group shadow-xs"
            >
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl w-fit mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">2. {t('workers.title')}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{t('workers.subtitle')}</p>
            </button>

            <button
              onClick={() => setActiveTab('rawmaterial')}
              className="p-4 rounded-2xl bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 transition-all text-left group shadow-xs"
            >
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl w-fit mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">3. {t('stock.title')}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{t('stock.subtitle')}</p>
            </button>

            <button
              onClick={() => setActiveTab('sales')}
              className="p-4 rounded-2xl bg-white hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 transition-all text-left group shadow-xs"
            >
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl w-fit mb-3 group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">4. {t('sales.title')}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{t('sales.subtitle')}</p>
            </button>
          </div>
        </div>
      )}

      {/* KPI Stat Cards 4-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('nav.activeLooms')}
          value={runningLooms}
          unit={`/ ${machines.length} ${t('common.unit')}`}
          subtitle={`${stoppedLooms} ${t('status.stopped')} • ${idleLooms} ${t('status.idle')}`}
          icon={Cpu}
          variant="green"
        />

        <StatCard
          title={t('dashboard.totalShiftOutput')}
          value={formatMeters(totalMetersToday)}
          subtitle={`Target: ${machines.length * 75} m`}
          icon={Boxes}
          variant="blue"
        />

        <StatCard
          title={t('dashboard.plantEfficiency')}
          value={`${avgEfficiency}%`}
          subtitle="Fleet average"
          icon={Activity}
          variant="indigo"
        />

        <StatCard
          title={t('dashboard.activeAlarmsCount')}
          value={alarms.length}
          subtitle={`${alarms.filter(a => a.type === 'critical').length} ${t('alarms.critical')}`}
          icon={AlertTriangle}
          variant={alarms.length > 0 ? 'rose' : 'green'}
        />
      </div>

      {/* Two Columns: Power & Shift Analysis + Top Producing Looms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Shed Splits and Production Power */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shed Performance Comparison Cards */}
          <div className="heavy-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">
                  Shed Performance
                </h3>
                <p className="text-xs text-slate-500">Live operational division between Shed A & Shed B</p>
              </div>
              <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                Picks: ~820 PPM
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shed A Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>SHED A</span>
                  <span className="text-emerald-700 font-mono">{shedACount} {t('status.running')}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, shedACount * 10)}%` }} />
                </div>
                <div className="grid grid-cols-3 text-center text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t('common.pressure')}</span>
                    <span className="font-bold font-mono text-slate-800">{shedACount > 0 ? '4.4 bar' : '0 bar'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Avg RPM</span>
                    <span className="font-bold font-mono text-slate-800">{shedACount > 0 ? '860' : '0'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t('common.efficiency')}</span>
                    <span className="font-bold font-mono text-emerald-600">{shedACount > 0 ? '94%' : '0%'}</span>
                  </div>
                </div>
              </div>

              {/* Shed B Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>SHED B</span>
                  <span className="text-emerald-700 font-mono">{shedBCount} {t('status.running')}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.min(100, shedBCount * 10)}%` }} />
                </div>
                <div className="grid grid-cols-3 text-center text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t('common.temp')}</span>
                    <span className="font-bold font-mono text-slate-800">{shedBCount > 0 ? '41°C' : '28°C'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Avg RPM</span>
                    <span className="font-bold font-mono text-slate-800">{shedBCount > 0 ? '790' : '0'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t('common.efficiency')}</span>
                    <span className="font-bold font-mono text-sky-600">{shedBCount > 0 ? '89%' : '0%'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Power kW metrics */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{t('dashboard.powerConsumption')}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Factory Main Substation 440V</p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex-1 sm:w-48">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500 font-medium">Load Level</span>
                    <span className="font-bold font-mono text-slate-900">{powerLoadPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500 rounded-full transition-all duration-700"
                      style={{ width: `${powerLoadPercent}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-extrabold font-mono text-slate-900 shrink-0">
                  {Math.round(powerLoadPercent * 1.8)} kW
                </span>
              </div>
            </div>
          </div>

          {/* Critical Alarms Feed in Dashboard */}
          <div className="heavy-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">
                  {t('dashboard.recentAlerts')}
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('alarms')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>{t('dashboard.viewAllAlarms')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {(() => {
              const uniqueDashboardAlarms = (alarms || []).filter((a, index, self) =>
                index === self.findIndex(o => (o.id && o.id === a.id) || (o._id && o._id === a._id))
              );
              return uniqueDashboardAlarms.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  {t('alarms.noAlarms')}
                </div>
              ) : (
                <div className="space-y-2">
                  {uniqueDashboardAlarms.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      a.type === 'critical'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 border">
                        {a.code || a.id}
                      </span>
                      <span className="font-semibold">{a.title}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-slate-400">{a.time}</span>
                      <button
                        onClick={() => ackAlarm(a.id)}
                        className="text-[11px] font-bold px-2 py-0.5 bg-white rounded-lg border shadow-2xs hover:bg-slate-50"
                      >
                        {t('alarms.ack')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          </div>
        </div>

        {/* Right 1 Col: Top Performing Looms */}
        <div className="space-y-6">
          <div className="heavy-card rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider mb-4">
              {t('dashboard.topProducers')}
            </h3>

            {topMachines.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">{t('common.noData')}</p>
            ) : (
              <div className="space-y-3">
                {topMachines.map((m, idx) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMachineId(m.id)}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200/80 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-6 w-6 rounded-lg bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center font-mono">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{m.id} - {m.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{m.fabric}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold font-mono text-xs text-slate-900">{m.output} m</div>
                      <span className="text-[10px] font-bold font-mono text-emerald-600">{m.efficiency}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
