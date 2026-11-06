import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { FABRIC_TYPES, LOOM_MODELS } from '../../data/initialData';
import CustomSelect from './CustomSelect';
import {
  X,
  Cpu,
  Plus
} from 'lucide-react';

export default function AddMachineModal() {
  const {
    isAddMachineOpen,
    setIsAddMachineOpen,
    addMachine,
    showToast
  } = useApp();
  const { t } = useTranslation();

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState(LOOM_MODELS[0]);
  const [fabric, setFabric] = useState(FABRIC_TYPES[0]);
  const [customFabric, setCustomFabric] = useState('');
  const [targetRpm, setTargetRpm] = useState('850');
  const [targetOutput, setTargetOutput] = useState('75');
  const [operator, setOperator] = useState('');

  if (!isAddMachineOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!id.trim()) {
      showToast(t('machines.machineId') + ' required', 'error');
      return;
    }

    const finalFabric = customFabric.trim() ? customFabric.trim() : fabric;

    const success = addMachine({
      id: id.trim().toUpperCase(),
      name: name.trim() || `Loom Unit ${id.trim().toUpperCase()}`,
      model,
      fabric: finalFabric,
      targetRpm: parseInt(targetRpm, 10) || 850,
      targetOutput: parseInt(targetOutput, 10) || 75,
      operator: operator.trim() || 'Unassigned'
    });

    if (success) {
      setId('');
      setName('');
      setCustomFabric('');
      setOperator('');
      setIsAddMachineOpen(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base font-display">
                {t('machines.addMachineTitle')}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-mono">
                {t('machines.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddMachineOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Machine ID */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {t('machines.machineId')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. M-01 or Loom-1"
                value={id}
                onChange={e => setId(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Machine Name */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {t('machines.machineName')}
              </label>
              <input
                type="text"
                placeholder="e.g. Airjet Loom #1"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Loom Model */}
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">
                {t('machines.modelType')}
              </label>
              <CustomSelect
                value={model}
                onChange={val => setModel(val)}
                options={LOOM_MODELS}
                className="w-full"
                buttonClassName="w-full bg-slate-50 border-slate-200 py-2.5 font-semibold text-slate-900"
              />
            </div>

            {/* Fabric Variety */}
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">
                {t('machines.fabricType')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <CustomSelect
                  value={fabric}
                  onChange={val => setFabric(val)}
                  options={FABRIC_TYPES}
                  className="w-full"
                  buttonClassName="w-full bg-slate-50 border-slate-200 py-2.5 font-semibold text-slate-900"
                />

                <input
                  type="text"
                  placeholder="Or custom fabric..."
                  value={customFabric}
                  onChange={e => setCustomFabric(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Target RPM */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {t('machines.targetRpm')}
              </label>
              <input
                type="number"
                value={targetRpm}
                onChange={e => setTargetRpm(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none"
              />
            </div>

            {/* Target Output */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {t('machines.targetOutput')}
              </label>
              <input
                type="number"
                value={targetOutput}
                onChange={e => setTargetOutput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none"
              />
            </div>

            {/* Operator Assignment */}
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">
                {t('machines.assignedOperator')}
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Patel"
                value={operator}
                onChange={e => setOperator(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddMachineOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-sky-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('common.save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
