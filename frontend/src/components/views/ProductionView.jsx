import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import StatCard from '../common/StatCard';
import CustomSelect from '../common/CustomSelect';
import { formatMeters } from '../../utils/formatters';
import {
  Boxes,
  Target,
  Award,
  CheckCircle2,
  Plus,
  Download,
  Search,
  Filter,
  Trash2
} from 'lucide-react';

export default function ProductionView() {
  const {
    machines,
    userRole,
    productionLogs,
    addProductionLog,
    deleteProductionLog,
    showToast
  } = useApp();
  const { t } = useTranslation();

  const [machineId, setMachineId] = useState(machines[0]?.id || 'M-01');
  const [customMachineId, setCustomMachineId] = useState('');
  const [fabric, setFabric] = useState('70*72 Plain Cambric');
  const [outputMeters, setOutputMeters] = useState('');
  const [shift, setShift] = useState('Morning (6AM - 2PM)');
  const [quality, setQuality] = useState('A-Grade (Export)');
  const [defectsMeters, setDefectsMeters] = useState('0.2');
  const [searchQuery, setSearchQuery] = useState('');

  const logs = Array.isArray(productionLogs) ? productionLogs : [];
  const totalOutput = logs.reduce((acc, log) => acc + (Number(log?.output) || 0), 0);
  const aGradeCount = logs.filter(l => String(l?.quality || '').includes('A-Grade')).length;
  const aGradePercent = logs.length > 0 ? Math.round((aGradeCount / logs.length) * 100) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const meters = parseFloat(outputMeters);
    if (!meters || meters <= 0) {
      showToast(t('common.enterValidMeters') || 'Please enter valid production output in meters', 'error');
      return;
    }

    const targetMachine = customMachineId.trim() ? customMachineId.trim().toUpperCase() : machineId;

    addProductionLog({
      id: `PR-${Date.now().toString().slice(-4)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      machine: targetMachine,
      fabric,
      shift: shift.split(' ')[0],
      output: meters,
      target: 75,
      quality,
      defects: parseFloat(defectsMeters) || 0,
      operator: 'Floor Operator'
    });

    setOutputMeters('');
    setCustomMachineId('');
  };

  const filteredLogs = logs.filter(log => {
    const q = (searchQuery || '').toLowerCase();
    return (
      String(log?.machine || '').toLowerCase().includes(q) ||
      String(log?.fabric || '').toLowerCase().includes(q) ||
      String(log?.operator || '').toLowerCase().includes(q) ||
      String(log?.id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="heavy-card rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
              <Boxes className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">
              {t('nav.production')}
            </span>
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-slate-900">
            {t('production.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('production.subtitle')}
          </p>
        </div>

        <button
          onClick={() => showToast('Production report downloaded (CSV)', 'success')}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20"
        >
          <Download className="w-4 h-4" />
          {t('common.export')} CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.totalShiftOutput')}
          value={formatMeters(totalOutput)}
          subtitle={t('common.all')}
          icon={Boxes}
          variant="green"
        />

        <StatCard
          title={t('common.target') || "DAILY TARGET"}
          value={`${machines.length * 75} m`}
          subtitle={`${machines.length} ${t('nav.machines')}`}
          icon={Target}
          variant="blue"
        />

        <StatCard
          title={t('production.grading')}
          value={`${aGradePercent}%`}
          subtitle={`${aGradeCount} of ${logs.length}`}
          icon={Award}
          variant="indigo"
        />

        <StatCard
          title={t('production.defectPercent')}
          value="0.4 m"
          unit="/ roll"
          subtitle="< 1.5m tolerance"
          icon={CheckCircle2}
          variant="green"
        />
      </div>

      {/* Add Production Log Entry Form */}
      <form onSubmit={handleSubmit} className="heavy-card rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-600" />
            {t('production.logProductionTitle')}
          </h3>
          <span className="text-xs font-mono text-slate-400">{t('common.add')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('common.machine').toUpperCase()}</label>
            {machines.length > 0 ? (
              <CustomSelect
                value={machineId}
                onChange={val => setMachineId(val)}
                options={machines.map(m => ({
                  value: m.id,
                  label: m.id,
                  subtitle: m.fabric,
                  status: m.status
                }))}
                searchable
                isMono
                className="w-full"
                buttonClassName="w-full bg-slate-50 border-slate-200 py-2.5 font-mono font-bold"
              />
            ) : (
              <input
                type="text"
                placeholder="Machine ID (e.g. M-01)"
                value={customMachineId}
                onChange={e => setCustomMachineId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('common.fabric').toUpperCase()}</label>
            <CustomSelect
              value={fabric}
              onChange={val => setFabric(val)}
              options={[
                '70*72 Plain Cambric',
                '70*68 Medium Grey',
                '60 Gram Waterjet',
                'Cotton 40s Combed',
                'Heavy Denim 14oz',
                'Silk Blend Chiffon'
              ]}
              className="w-full"
              buttonClassName="w-full bg-slate-50 border-slate-200 py-2.5 font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('common.output').toUpperCase()} (M)</label>
            <input
              type="number"
              placeholder="e.g. 70"
              value={outputMeters}
              onChange={e => setOutputMeters(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('common.shift').toUpperCase()}</label>
            <CustomSelect
              value={shift}
              onChange={val => setShift(val)}
              options={[
                'Morning (6AM - 2PM)',
                'Afternoon (2PM - 10PM)',
                'Night (10PM - 6AM)'
              ]}
              className="w-full"
              buttonClassName="w-full bg-slate-50 border-slate-200 py-2.5 font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('production.grading').toUpperCase()}</label>
            <CustomSelect
              value={quality}
              onChange={val => setQuality(val)}
              options={[
                'A-Grade (Export)',
                'B-Grade',
                'C-Grade (Local)'
              ]}
              className="w-full"
              buttonClassName="w-full bg-slate-50 border-slate-200 py-2.5 font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('production.defectPercent').toUpperCase()}</label>
            <input
              type="number"
              step="0.1"
              value={defectsMeters}
              onChange={e => setDefectsMeters(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-sky-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('production.logBtn')}
          </button>
        </div>
      </form>

      {/* Production Log History Table */}
      <div className="heavy-card rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">
              {t('production.history')}
            </h3>
            <p className="text-xs text-slate-500">{t('production.subtitle')}</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-2.5">{t('common.time')}</th>
                <th className="pb-2.5">{t('common.machine')}</th>
                <th className="pb-2.5">{t('common.fabric')}</th>
                <th className="pb-2.5">{t('common.output')}</th>
                <th className="pb-2.5">{t('common.shift')}</th>
                <th className="pb-2.5">{t('production.grading')}</th>
                <th className="pb-2.5">{t('production.defectPercent')}</th>
                <th className="pb-2.5">{t('common.operator')}</th>
                <th className="pb-2.5 pr-16 md:pr-24 text-right">{t('common.delete')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 font-mono text-slate-500">{log.time}</td>
                  <td className="py-3 font-mono font-bold text-slate-900">{log.machine}</td>
                  <td className="py-3">{log.fabric}</td>
                  <td className="py-3 font-mono font-bold text-emerald-700">{log.output} m</td>
                  <td className="py-3 font-mono text-slate-600">{log.shift}</td>
                  <td className="py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      String(log?.quality || '').includes('A-Grade')
                        ? 'bg-emerald-100 text-emerald-800'
                        : String(log?.quality || '').includes('B-Grade')
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {log.quality}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-500">{log.defects} m</td>
                  <td className="py-3 text-slate-600">{log.operator}</td>
                  <td className="py-3 pr-16 md:pr-24 text-right">
                    {(userRole === 'Admin' || userRole === 'Supervisor') && (
                      <button
                        onClick={() => deleteProductionLog(log.id)}
                        className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
