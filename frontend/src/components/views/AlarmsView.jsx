import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import StatCard from '../common/StatCard';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Plus
} from 'lucide-react';

export default function AlarmsView() {
  const {
    alarms,
    ackAlarm,
    ackAllAlarms,
    addTestAlarm,
    setSelectedMachineId
  } = useApp();
  const { t } = useTranslation();

  const [severityFilter, setSeverityFilter] = useState('all');

  // Deduplicate alarms by ID / _id / code & time to avoid rendering duplicate alerts
  const uniqueAlarms = (alarms || []).filter((a, index, self) =>
    index === self.findIndex(o =>
      (o.id && a.id && o.id === a.id) ||
      (o._id && a._id && o._id === a._id) ||
      (o.code === 'E-STOP' && a.code === 'E-STOP' && o.time === a.time) ||
      (o.title === a.title && o.time === a.time && o.machine === a.machine)
    )
  );

  const criticalCount = uniqueAlarms.filter(a => a.type === 'critical').length;
  const warningCount = uniqueAlarms.filter(a => a.type === 'warning').length;
  const infoCount = uniqueAlarms.filter(a => a.type === 'info').length;

  const filteredAlarms = uniqueAlarms.filter(a => {
    if (severityFilter === 'all') return true;
    return a.type === severityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="heavy-card rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">
              {t('alarms.title')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-900">
            {t('alarms.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('alarms.subtitle')}
          </p>
        </div>

        {/* Global Alarm Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full sm:w-auto">
          <button
            onClick={addTestAlarm}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('alarms.testAlarm')}</span>
          </button>

          {alarms.length > 0 && (
            <button
              onClick={ackAllAlarms}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{t('alarms.ackAll')}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('alarms.critical')}
          value={criticalCount}
          subtitle="Direct Motor Halt"
          icon={AlertTriangle}
          variant="rose"
        />

        <StatCard
          title={t('alarms.warning')}
          value={warningCount}
          subtitle="Pressure & Temp Checks"
          icon={AlertCircle}
          variant="amber"
        />

        <StatCard
          title={t('alarms.info')}
          value={infoCount}
          subtitle="Maintenance Notifications"
          icon={Info}
          variant="blue"
        />
      </div>

      {/* Alarm Feed */}
      <div className="heavy-card rounded-2xl p-5 bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-mono">
            {t('dashboard.recentAlerts')} ({filteredAlarms.length})
          </h3>

          <div className="flex gap-1.5">
            {['all', 'critical', 'warning', 'info'].map(type => (
              <button
                key={type}
                onClick={() => setSeverityFilter(type)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  severityFilter === type
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                {type === 'all' ? t('common.all') : t(`alarms.${type}`)}
              </button>
            ))}
          </div>
        </div>

        {filteredAlarms.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-700">{t('alarms.noAlarms')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredAlarms.map((a) => (
              <div
                key={a.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                  a.type === 'critical'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : a.type === 'warning'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : 'bg-sky-50/80 border-sky-200 text-sky-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-white border">
                    {a.code || a.id}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">{a.title}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {t('common.machine')}: <button onClick={() => setSelectedMachineId(a.machine)} className="font-bold text-sky-600 hover:underline">{a.machine}</button> • {a.shed}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-slate-400">{a.time}</span>
                  <button
                    onClick={() => ackAlarm(a.id)}
                    className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs"
                  >
                    {t('alarms.ack')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
