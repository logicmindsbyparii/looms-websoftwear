import React, { useState } from 'react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LoomVisual from '../common/LoomVisual';
import { openWhatsApp } from '../../utils/whatsapp';
import {
  Play,
  Square,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Activity,
  Wind,
  Layers,
  Thermometer,
  Gauge,
  HelpCircle,
  Scissors,
  Plus,
  Cpu,
  MessageSquare,
  QrCode
} from 'lucide-react';

export default function OperatorConsole() {
  const {
    machines,
    userRole,
    activeOperatorLoom,
    setActiveOperatorLoom,
    updateMachineStatus,
    addProductionLog,
    setIsAddMachineOpen,
    setActiveLabelRoll,
    adminWhatsAppPhone,
    showToast
  } = useApp();
  const { t } = useTranslation();

  const currentMachine = machines.find(m => m.id === activeOperatorLoom) || machines[0];
  const [rpmInput, setRpmInput] = useState(currentMachine?.rpm || 850);
  const [tensionInput, setTensionInput] = useState(currentMachine?.tension || 65);
  const [pressureInput, setPressureInput] = useState(currentMachine?.pressure || 4.2);

  if (!currentMachine || machines.length === 0) {
    return (
      <div className="heavy-card rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto my-12 border-2 border-dashed border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <Cpu className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 font-display">
            {t('operator.noLoomAssigned')}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            {userRole === 'Operator'
              ? t('operator.noLoomOperatorDesc')
              : t('operator.noLoomAdminDesc')}
          </p>
        </div>

        {(userRole === 'Admin' || userRole === 'Supervisor') && (
          <button
            onClick={() => setIsAddMachineOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('dashboard.addLoomBtn')}
          </button>
        )}
      </div>
    );
  }

  const isRunning = currentMachine.status === 'running';

  const handleQuickDefect = (defectName) => {
    showToast(t('operator.defectLoggedToast', { name: defectName, loom: currentMachine.id }), 'warning');
    if (defectName === 'Warp Yarn Break' || defectName === 'Weft Slub') {
      updateMachineStatus(currentMachine.id, 'stopped');
    }
  };

  const handleLogRoll = () => {
    addProductionLog({
      id: `PR-${Date.now().toString().slice(-4)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      machine: currentMachine.id,
      fabric: currentMachine.fabric,
      shift: 'Morning',
      output: 30,
      target: currentMachine.targetOutput || 75,
      quality: 'A-Grade (Export)',
      defects: 0.2,
      operator: currentMachine.operator || 'Loom Operator'
    });
  };

  const handleCutRollAndPrint = async () => {
    try {
      const outputMeters = currentMachine.output && currentMachine.output > 0 ? currentMachine.output : 50;
      const res = await api.post('/rolls', {
        machineId: currentMachine.id,
        metres: outputMeters,
        fabric: currentMachine.fabric,
        quality: 'A-Grade (Export)',
        shift: 'Morning'
      });
      showToast(`Roll ${res.data.id} cut & registered! Opening QR sticker...`, 'success');
      setActiveLabelRoll(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to cut roll', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Operator Top Control Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-bold font-mono border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {t('operator.consoleTag')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-800">
            {t('operator.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {currentMachine.id} • {currentMachine.name} ({currentMachine.fabric})
          </p>
        </div>

        {/* Machine Selector Switcher & WhatsApp Alert */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              const msg = `🚨 *LOOMUS FACTORY ALERT — OPERATOR BREAKDOWN NOTICE*
----------------------------------------
⚙️ *Loom:* ${currentMachine.id}
🧵 *Fabric:* ${currentMachine.fabric}
👤 *Operator:* ${currentMachine.operator || 'Floor Operator'}
⚡ *Current Status:* ${currentMachine.status.toUpperCase()}
🕒 *Time:* ${new Date().toLocaleTimeString()}
----------------------------------------
⚠️ Urgent intervention / inspection requested on factory floor!`;
              openWhatsApp({ phone: adminWhatsAppPhone, message: msg });
              showToast('Emergency alert sent to Admin WhatsApp!', 'success');
            }}
            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            title="Send Emergency Alert via WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
            <span>WhatsApp Admin</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 p-1.5 sm:p-2 rounded-2xl border border-slate-200 flex-1 sm:flex-none justify-between sm:justify-start">
            <label className="text-xs font-bold text-slate-600 font-mono pl-1 sm:pl-2 shrink-0">{t('control.target')}</label>
            <select
              value={activeOperatorLoom || currentMachine.id}
              onChange={e => {
                setActiveOperatorLoom(e.target.value);
                const m = machines.find(x => x.id === e.target.value);
                if (m) {
                  setRpmInput(m.rpm || 850);
                  setTensionInput(m.tension || 65);
                  setPressureInput(m.pressure || 4.2);
                }
              }}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white text-slate-800 font-mono font-bold text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
            >
              {machines.map(m => (
                <option key={m.id} value={m.id} className="bg-white text-slate-800 py-1">
                  {m.id} ({m.fabric}) — {t(`status.${m.status}`) || m.status.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Touchscreen Grid: Left Large Controls + Right Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Big Touch Actions & Animation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Machine Header & SVG Shuttle Simulation */}
          <div className="heavy-card rounded-3xl p-4 sm:p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl font-black font-mono bg-slate-100 text-slate-900 px-3 py-1 rounded-xl border border-slate-200">
                  {currentMachine.id}
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                    {currentMachine.name} • {currentMachine.fabric}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
                    Model: {currentMachine.model} | {currentMachine.shed}
                  </p>
                </div>
              </div>

              <div className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-mono font-extrabold border ${
                isRunning ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                currentMachine.status === 'stopped' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                ● {t(`status.${currentMachine.status}`) || currentMachine.status.toUpperCase()}
              </div>
            </div>

            {/* Loom Animation */}
            <div className="py-2">
              <LoomVisual status={currentMachine.status} rpm={currentMachine.rpm} compact={false} />
            </div>

            {/* Primary Tactile Push Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <button
                onClick={() => updateMachineStatus(currentMachine.id, 'running')}
                disabled={isRunning}
                className={`py-4 px-4 rounded-2xl font-extrabold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                  isRunning
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 active:scale-95'
                }`}
              >
                <Play className="w-6 h-6 fill-current" />
                <span>{t('operator.quickStart')}</span>
              </button>

              <button
                onClick={() => updateMachineStatus(currentMachine.id, 'stopped')}
                disabled={!isRunning}
                className={`py-4 px-4 rounded-2xl font-extrabold text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                  !isRunning
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 active:scale-95'
                }`}
              >
                <Square className="w-6 h-6 fill-current" />
                <span>{t('operator.quickStop')}</span>
              </button>

              <button
                onClick={() => {
                  showToast(`Inching / Jogging loom ${currentMachine.id} (Slow Turn)`, 'info');
                }}
                className="py-4 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm flex flex-col items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
              >
                <RotateCcw className="w-6 h-6" />
                <span>INCH / JOG</span>
              </button>

              <button
                onClick={() => updateMachineStatus(currentMachine.id, 'idle')}
                className="py-4 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-sm flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Pause className="w-6 h-6 fill-current" />
                <span>{t('operator.quickPause')}</span>
              </button>
            </div>
          </div>

          {/* Quick Weaving Defect Logger */}
          <div className="heavy-card rounded-3xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">
                  {t('operator.quickDefectLogger')}
                </h3>
              </div>
              <span className="text-xs text-slate-500">{t('common.actions')}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: t('operator.warpBreak'), key: 'Warp Yarn Break', color: 'hover:border-rose-400 hover:bg-rose-50 text-rose-700' },
                { name: t('operator.weftSlub'), key: 'Weft Slub', color: 'hover:border-amber-400 hover:bg-amber-50 text-amber-700' },
                { name: 'Reed Mark Anomaly', key: 'Reed Mark', color: 'hover:border-sky-400 hover:bg-sky-50 text-sky-700' },
                { name: 'Mispick Pattern', key: 'Mispick', color: 'hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700' },
                { name: t('operator.oilStain'), key: 'Oil Stain', color: 'hover:border-purple-400 hover:bg-purple-50 text-purple-700' },
                { name: 'Cloth Roll Full', key: 'Cloth Roll Full', color: 'hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700' },
              ].map(d => (
                <button
                  key={d.key}
                  onClick={() => handleQuickDefect(d.name)}
                  className={`p-3 rounded-xl border border-slate-200 font-bold text-xs bg-slate-50 transition-all text-left shadow-2xs ${d.color}`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Big Digital Telemetry Gauges */}
        <div className="space-y-6">
          {/* Shift Output Big Gauge */}
          <div className="heavy-card rounded-3xl p-4 sm:p-6 bg-gradient-to-b from-sky-50/60 to-white">
            <span className="text-[11px] font-bold tracking-wider uppercase font-mono text-sky-800">
              {t('common.output')}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900">
                {currentMachine.output} <span className="text-base font-normal text-slate-500">meters</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Target: {currentMachine.targetOutput || 75}m
              </span>
            </div>

            <div className="mt-4">
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (currentMachine.output / (currentMachine.targetOutput || 75)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-1.5">
                <span>0m</span>
                <span className="font-bold text-slate-700">{Math.round((currentMachine.output / (currentMachine.targetOutput || 75)) * 100)}%</span>
                <span>{currentMachine.targetOutput || 75}m</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 mt-5">
              <button
                onClick={handleLogRoll}
                className="w-full px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-sky-600/20 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
                <span>{t('operator.logFinishedRoll')}</span>
              </button>

              <button
                onClick={handleCutRollAndPrint}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
              >
                <QrCode className="w-4 h-4 shrink-0 text-white" />
                <span>{t('rollsPage.cutRollBtn') || 'Cut Roll & Print QR'}</span>
              </button>
            </div>
          </div>

          {/* Speed & Air Jet Sliders */}
          <div className="heavy-card rounded-3xl p-4 sm:p-6 space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              {t('control.title')}
            </h4>

            {/* RPM */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-600" /> {t('operator.speedControl')}
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">{rpmInput} RPM</span>
              </div>
              <input
                type="range"
                min="400"
                max="1100"
                value={rpmInput}
                onChange={e => setRpmInput(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>400 RPM</span>
                <span>1100 RPM</span>
              </div>
            </div>

            {/* Warp Tension */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-indigo-600" /> {t('operator.tensionControl')}
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">{tensionInput}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="95"
                value={tensionInput}
                onChange={e => setTensionInput(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Air Pressure */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-teal-600" /> {t('operator.airJetControl')}
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">{pressureInput} bar</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="6.5"
                step="0.1"
                value={pressureInput}
                onChange={e => setPressureInput(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            <button
              onClick={() => showToast(t('control.parametersApplied'), 'success')}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-sky-600/20"
            >
              {t('control.applyFabricParams')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
