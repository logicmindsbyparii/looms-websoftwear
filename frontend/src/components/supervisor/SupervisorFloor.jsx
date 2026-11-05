import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LoomVisual from '../common/LoomVisual';
import { openWhatsApp } from '../../utils/whatsapp';
import {
  Activity,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Wrench,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Plus,
  Cpu,
  MessageSquare
} from 'lucide-react';

export default function SupervisorFloor() {
  const {
    machines,
    workers,
    alarms,
    updateMachineStatus,
    setSelectedMachineId,
    ackAlarm,
    setIsAddMachineOpen,
    adminWhatsAppPhone,
    openWhatsAppShare,
    showToast
  } = useApp();
  const { t } = useTranslation();

  const [selectedShed, setSelectedShed] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMachines = machines.filter(m => {
    const matchesShed = selectedShed === 'all' || m.shed.toLowerCase().includes(selectedShed.toLowerCase());
    const matchesSearch = m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.fabric.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.operator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesShed && matchesSearch;
  });

  const activeWorkers = workers.filter(w => w.status === 'active').length;
  const criticalAlarms = alarms.filter(a => a.type === 'critical');

  return (
    <div className="space-y-6">
      {/* Supervisor Header Banner */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] sm:text-[11px] font-bold font-mono border border-amber-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              {t('supervisor.consoleTag')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-900">
            {t('supervisor.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl font-medium">
            {t('supervisor.subtitle')}
          </p>
        </div>

        {/* Quick Shift Summary Badges & WhatsApp Handover */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              const running = machines.filter(m => m.status === 'running').length;
              const stopped = machines.filter(m => m.status === 'stopped' || m.status === 'error').length;
              const totalMeters = machines.reduce((acc, m) => acc + (m.output || 0), 0);
              const msg = `🏭 *LOOMUS TEXTILE — SUPERVISOR SHIFT HANDOVER REPORT*
📅 *Date:* ${new Date().toLocaleDateString('en-IN')}
----------------------------------------
🟢 *${t('supervisor.runningLooms')}:* ${running} / ${machines.length}
🔴 *${t('supervisor.stoppedLooms')}:* ${stopped}
👥 *${t('supervisor.workersActive')}:* ${activeWorkers} active
🚨 *${t('supervisor.criticalAlarms')}:* ${criticalAlarms.length}
📏 *${t('supervisor.shiftOutput')}:* ${totalMeters.toLocaleString()} meters
----------------------------------------
✅ Reported by Floor Supervisor`;
              openWhatsAppShare({
                title: t('supervisor.shiftHandoverReport'),
                message: msg,
                category: 'supervisor',
                defaultPhone: adminWhatsAppPhone
              });
            }}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('supervisor.whatsAppHandover')}</span>
          </button>

          <div className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block font-mono font-medium">{t('supervisor.staffOnFloor')}</span>
            <span className="text-base sm:text-lg font-bold text-emerald-700 font-mono">{activeWorkers} {t('status.active')}</span>
          </div>
          <div className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block font-mono font-medium">{t('dashboard.activeAlarmsCount')}</span>
            <span className={`text-base sm:text-lg font-bold font-mono ${criticalAlarms.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {criticalAlarms.length} Alerts
            </span>
          </div>
        </div>
      </div>

      {/* Critical Floor Interventions Notice */}
      {criticalAlarms.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
              <span>{t('dashboard.attentionRequired')}: {criticalAlarms.length} Looms</span>
            </div>
            <span className="text-xs font-mono text-rose-700 font-semibold">{t('alarms.critical')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {criticalAlarms.map(a => (
              <div key={a.id} className="p-2.5 rounded-xl bg-white border border-rose-200 flex items-center justify-between gap-2 shadow-2xs">
                <div>
                  <span className="font-mono font-bold text-rose-700 text-xs">{a.machine}</span>
                  <p className="text-[11px] text-slate-700 font-medium line-clamp-1">{a.title}</p>
                </div>
                <button
                  onClick={() => ackAlarm(a.id)}
                  className="px-2 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shrink-0"
                >
                  {t('alarms.ack')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floor Filter Bar */}
      <div className="heavy-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Shed Filter Tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSelectedShed('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedShed === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700'
            }`}
          >
            {t('supervisor.allSheds')} ({machines.length})
          </button>
          <button
            onClick={() => setSelectedShed('Shed A')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedShed === 'Shed A'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700'
            }`}
          >
            {t('supervisor.shedA')}
          </button>
          <button
            onClick={() => setSelectedShed('Shed B')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedShed === 'Shed B'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700'
            }`}
          >
            {t('supervisor.shedB')}
          </button>
        </div>

        {/* Right Search & Add */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            onClick={() => setIsAddMachineOpen(true)}
            className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('dashboard.addLoomBtn')}</span>
          </button>
        </div>
      </div>

      {/* Loom Cards Floor Grid or Empty State */}
      {filteredMachines.length === 0 ? (
        <div className="heavy-card rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <Cpu className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-700">{t('supervisor.noLoomsMatch')}</h4>
          <button
            onClick={() => setIsAddMachineOpen(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('dashboard.addLoomBtn')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {filteredMachines.map(m => {
            const isRunning = m.status === 'running';
            const isStopped = m.status === 'stopped';

            return (
              <div
                key={m.id}
                className={`heavy-card rounded-2xl p-3.5 transition-all cursor-pointer relative ${
                  isStopped ? 'border-rose-300 ring-2 ring-rose-100' : 'hover:border-sky-300'
                }`}
                onClick={() => setSelectedMachineId(m.id)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {m.id}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isRunning ? 'bg-emerald-100 text-emerald-800' :
                    isStopped ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {t(`status.${m.status}`) || m.status.toUpperCase()}
                  </span>
                </div>

                {/* Loom Visual Animation */}
                <div className="my-2">
                  <LoomVisual status={m.status} rpm={m.rpm} compact={true} />
                </div>

                {/* Info Details */}
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-slate-800 truncate" title={m.fabric}>
                    {m.fabric}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{t('common.rpm')}:</span>
                    <span className="font-bold text-slate-800">{isRunning ? `${m.rpm} RPM` : 'HALTED'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{t('common.output')}:</span>
                    <span className="font-bold text-emerald-700">{m.output}m ({m.efficiency}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>{t('common.operator')}: {m.operator}</span>
                    <span className="text-sky-600 font-bold">{t('machines.inspectLoom')} →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
