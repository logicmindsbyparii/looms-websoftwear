import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import StatCard from '../common/StatCard';
import { formatRupees } from '../../utils/formatters';
import { buildYarnInwardMessage } from '../../utils/whatsapp';
import {
  Layers,
  Plus,
  AlertCircle,
  Package,
  TrendingDown,
  Trash2,
  MessageSquare
} from 'lucide-react';

export default function RawMaterialView() {
  const {
    stockLevels,
    userRole,
    addRawMaterial,
    deleteStock,
    adminWhatsAppPhone,
    openWhatsAppShare,
    showToast
  } = useApp();
  const { t } = useTranslation();

  const [material, setMaterial] = useState('Cotton Yarn 40s Combed');
  const [customMaterial, setCustomMaterial] = useState('');
  const [qty, setQty] = useState('');
  const [supplier, setSupplier] = useState('');
  const [rate, setRate] = useState('');

  const totalStockKg = stockLevels.reduce((acc, s) => acc + (s.current || 0), 0);
  const totalValuation = stockLevels.reduce((acc, s) => acc + ((s.current || 0) * (s.rate || 0)), 0);
  const lowStockCount = stockLevels.filter(s => (s.current || 0) <= (s.minThreshold || 500)).length;

  const handleAddStock = (e) => {
    e.preventDefault();
    const qtyNum = parseFloat(qty);
    const rateNum = parseFloat(rate);

    if (!qtyNum || qtyNum <= 0) {
      showToast('Please enter valid yarn quantity', 'error');
      return;
    }

    const finalMaterial = customMaterial.trim() ? customMaterial.trim() : material;
    const newLot = {
      material: finalMaterial,
      qty: qtyNum,
      supplier: supplier || 'Local Spinning Mill',
      rate: rateNum || 250
    };

    addRawMaterial(newLot);

    // Prompt WhatsApp share
    const msg = buildYarnInwardMessage(newLot);
    openWhatsAppShare({
      title: 'Yarn Inward WhatsApp Slip',
      message: msg,
      category: 'godown',
      defaultPhone: adminWhatsAppPhone
    });

    setQty('');
    setCustomMaterial('');
    setSupplier('');
    setRate('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="heavy-card rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">
              {t('stock.title')}
            </span>
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-slate-900">
            {t('stock.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('stock.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>{stockLevels.length} {t('common.all')}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('stock.currentStock')}
          value={`${totalStockKg.toLocaleString()} kg`}
          subtitle="Available yarn reels"
          icon={Package}
          variant="blue"
        />

        <StatCard
          title="Stock Valuation"
          value={formatRupees(totalValuation)}
          subtitle="Current Godown Asset Value"
          icon={Layers}
          variant="indigo"
        />

        <StatCard
          title="Reorder Alerts"
          value={lowStockCount}
          subtitle="Materials below minimum threshold"
          icon={AlertCircle}
          variant={lowStockCount > 0 ? 'rose' : 'green'}
        />
      </div>

      {/* Receive Inward Yarn Stock Form (Admin & Supervisor Only) */}
      {(userRole === 'Admin' || userRole === 'Supervisor') && (
        <form onSubmit={handleAddStock} className="heavy-card rounded-2xl p-5 bg-white border border-slate-200">
          <h3 className="font-bold text-slate-800 text-sm mb-3 font-display">
            {t('stock.addMaterialTitle')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">{t('stock.yarnName')} *</label>
              <input
                type="text"
                required
                placeholder="Cotton 40s Combed"
                value={customMaterial || material}
                onChange={e => setCustomMaterial(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">{t('stock.inwardQty')} *</label>
              <input
                type="number"
                required
                placeholder="500"
                value={qty}
                onChange={e => setQty(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">{t('stock.yarnRate')}</label>
              <input
                type="number"
                placeholder="280"
                value={rate}
                onChange={e => setRate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">{t('stock.supplierName')}</label>
              <input
                type="text"
                placeholder="Spinning Mill"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('common.save')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Stock Levels Table */}
      <div className="heavy-card rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4">{t('stock.yarnName')}</th>
                <th className="py-3 px-4">{t('stock.currentStock')}</th>
                <th className="py-3 px-4">{t('common.rate')}</th>
                <th className="py-3 px-4">{t('common.total')}</th>
                <th className="py-3 px-4">{t('stock.supplierName')}</th>
                {(userRole === 'Admin' || userRole === 'Supervisor') && (
                  <th className="py-3 px-4 text-right">{t('common.actions')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockLevels.map(s => {
                const isLow = s.current <= (s.minThreshold || 500);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={isLow ? 'text-rose-600' : 'text-slate-800'}>
                        {s.current} {s.unit || 'kg'}
                      </span>
                      {isLow && (
                        <span className="ml-2 text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold">
                          LOW
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">₹{s.rate}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{formatRupees(s.current * s.rate)}</td>
                    <td className="py-3 px-4 text-slate-500">{s.supplier}</td>
                    {(userRole === 'Admin' || userRole === 'Supervisor') && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => deleteStock(s.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
