import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LoomVisual from './LoomVisual';
import {
  X,
  Play,
  Square,
  Pause,
  RotateCcw,
  Wrench,
  AlertCircle,
  Thermometer,
  Gauge,
  Wind,
  Layers,
  User,
  Activity,
  CheckCircle2,
  QrCode
} from 'lucide-react';

export default function MachineModal() {
  const {
    selectedMachineId,
    setSelectedMachineId,
    machines,
    updateMachineStatus,
    showToast,
    addProductionLog,
    setInspectRollCode
  } = useApp();
  const { t } = useTranslation();

  const [addMetersInput, setAddMetersInput] = useState('');
  const [defectType, setDefectType] = useState('None');
  const [machineRolls, setMachineRolls] = useState([]);

  const machine = machines.find(m => m.id === selectedMachineId);

  useEffect(() => {
    if (machine?.id) {
      api.get(`/rolls?machineId=${machine.id}&limit=4`)
        .then(res => setMachineRolls(res.data || []))
        .catch(() => {});
    }
  }, [machine?.id]);
  if (!machine) return null;

  const handleAddProduction = (e) => {
    e.preventDefault();
    const meters = parseFloat(addMetersInput);
    if (!meters || meters <= 0) {
      showToast(t('modals.machine.enterValidMeters'), 'error');
      return;
    }
    addProductionLog({
      id: `PR-${Date.now().toString().slice(-4)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      machine: machine.id,
      fabric: machine.fabric,
      shift: 'Morning',
      output: meters,
      target: machine.targetOutput,
      quality: defectType === 'None' ? 'A-Grade (Export)' : 'B-Grade',
      defects: defectType === 'None' ? 0.1 : 1.2,
      operator: machine.operator
    });
    setAddMetersInput('');
  };

  const statusColors = {
    running: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    stopped: 'bg-rose-100 text-rose-800 border-rose-300',
    idle: 'bg-amber-100 text-amber-800 border-amber-300',
    maintenance: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-sky-100 text-sky-700 rounded-xl font-mono font-extrabold text-sm sm:text-base">
              {machine.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-display">
                  {machine.name}
                </h3>
                <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${statusColors[machine.status]}`}>
                  {t(`status.${machine.status}`) || machine.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-mono">
                {machine.shed} • {machine.model}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedMachineId(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
          {/* Animated Loom Simulation Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/2">
              <LoomVisual status={machine.status} rpm={machine.rpm} compact={false} />
            </div>
            <div className="w-full sm:w-1/2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{t('common.fabric')}</span>
                <span className="font-bold text-slate-800">{machine.fabric}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{t('modals.machine.assignedOperator')}</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  {machine.operator}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{t('common.efficiency')}</span>
                <span className="font-bold text-emerald-600 font-mono">{machine.efficiency}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Picks / Min</span>
                <span className="font-bold text-slate-800 font-mono">{machine.picksPerMin} PPM</span>
              </div>
            </div>
          </div>

          {/* Telemetry Metrics 4-Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <Activity className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('common.rpm')}</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-display">
                {machine.rpm} <span className="text-xs font-normal text-slate-500">RPM</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('common.temp')}</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-display">
                {machine.temp}°C
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t('common.tension')}</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-display">
                {machine.tension}%
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <Wind className="w-3.5 h-3.5 text-teal-600" />
                <span>{t('common.pressure')}</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-display">
                {machine.pressure} <span className="text-xs font-normal text-slate-500">bar</span>
              </div>
            </div>
          </div>

          {/* Direct Industrial Actions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2.5">
              {t('modals.machine.maintenanceHistory')}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => updateMachineStatus(machine.id, 'running')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {t('control.start').toUpperCase()}
              </button>

              <button
                onClick={() => updateMachineStatus(machine.id, 'stopped')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                {t('control.stop').toUpperCase()}
              </button>

              <button
                onClick={() => updateMachineStatus(machine.id, 'idle')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                {t('control.pause').toUpperCase()}
              </button>

              <button
                onClick={() => updateMachineStatus(machine.id, 'maintenance')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Wrench className="w-3.5 h-3.5" />
                {t('control.maintenance').toUpperCase()}
              </button>
            </div>
          </div>

          {/* Fast Production Logging Box */}
          <form onSubmit={handleAddProduction} className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-sky-900">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" />
                {t('modals.machine.addQuickProduction')}
              </span>
              <span className="text-[11px] font-mono text-sky-700">Today: {machine.output}m</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="number"
                placeholder={t('modals.machine.metersCutPlaceholder')}
                value={addMetersInput}
                onChange={e => setAddMetersInput(e.target.value)}
                className="px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <select
                value={defectType}
                onChange={e => setDefectType(e.target.value)}
                className="px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="None">{t('modals.machine.gradeA')}</option>
                <option value="Warp Break">{t('operator.warpBreak')}</option>
                <option value="Weft Miss">{t('operator.weftSlub')}</option>
                <option value="Oil Stain">{t('operator.oilStain')}</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('modals.machine.saveCut')}
              </button>
            </div>
          </form>

          {/* Recent Fabric Rolls from this Loom */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>Recent Rolls Cut From This Loom ({machineRolls.length})</span>
              </span>
              <span className="text-[11px] text-slate-700 font-mono">Roll QR Ledger</span>
            </div>

            {machineRolls.length === 0 ? (
              <p className="text-xs text-slate-700 py-1">No tracked rolls cut from this loom yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {machineRolls.map(r => (
                  <div
                    key={r._id || r.id}
                    onClick={() => {
                      setSelectedMachineId(null);
                      setInspectRollCode(r.id);
                    }}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900">{r.id}</div>
                      <div className="text-[10px] text-slate-700">{r.fabric}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-slate-800">{Number(r.metres).toFixed(1)}m</div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

