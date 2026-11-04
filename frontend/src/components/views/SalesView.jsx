import React, { useState } from 'react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import StatCard from '../common/StatCard';
import { formatRupees, formatMeters } from '../../utils/formatters';
import {
  buildSalesOrderMessage,
  buildReadyGoodsMessage
} from '../../utils/whatsapp';
import {
  Briefcase,
  TrendingUp,
  Boxes,
  Users,
  Plus,
  MessageSquare,
  Trash2,
  QrCode
} from 'lucide-react';

export default function SalesView() {
  const {
    brokers,
    readyGoods,
    salesOrders,
    addReadyGoods,
    deleteReadyGoods,
    addBroker,
    deleteBroker,
    addSalesOrder,
    deleteSalesOrder,
    updateOrderStatus,
    adminWhatsAppPhone,
    salesWhatsAppPhone,
    openWhatsAppShare,
    setActiveTab,
    showToast
  } = useApp();
  const { t } = useTranslation();

  // Ready Goods State
  const [rgFabric, setRgFabric] = useState('70*72 Plain Cambric');
  const [rgCustomFabric, setRgCustomFabric] = useState('');
  const [rgQty, setRgQty] = useState('');
  const [rgRate, setRgRate] = useState('48');
  const [rgQuality, setRgQuality] = useState('A-Grade (Export)');

  // Broker State
  const [bName, setBName] = useState('');
  const [bCompany, setBCompany] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bCity, setBCity] = useState('Surat');
  const [bComm, setBComm] = useState('2.0');
  const [bType, setBType] = useState('Broker');

  // Sales Order State
  const [soBroker, setSoBroker] = useState(brokers[0]?.name || '');
  const [soBuyer, setSoBuyer] = useState('');
  const [soFabric, setSoFabric] = useState('70*72 Plain Cambric');
  const [soQty, setSoQty] = useState('');
  const [soRate, setSoRate] = useState('48');
  const [soDelivery, setSoDelivery] = useState('2026-11-08');

  // Totals
  const totalReadyMeters = readyGoods.reduce((acc, g) => acc + (g.qty || 0), 0);
  const totalOrderValue = salesOrders.reduce((acc, o) => acc + (o.total || 0), 0);

  const handleBulkGenerateRolls = async (lot) => {
    try {
      const rollsCount = lot.rollCount || Math.max(1, Math.round(lot.qty / 100));
      const metresPerRoll = Math.round((lot.qty / rollsCount) * 100) / 100;
      const rollsData = Array.from({ length: rollsCount }, () => ({
        metres: metresPerRoll,
        quality: lot.quality,
        fabric: lot.fabric
      }));

      const res = await api.post('/rolls/bulk', {
        machineId: 'M-01',
        lotId: lot.id,
        rollsData
      });

      showToast(`Generated ${res.data.length} individual roll QRs for lot ${lot.id}!`, 'success');
      setActiveTab('rolls');
    } catch (err) {
      showToast(err.message || 'Failed to generate roll QRs', 'error');
    }
  };

  const handleAddReadyGoods = (e) => {
    e.preventDefault();
    const qtyNum = parseFloat(rgQty);
    const rateNum = parseFloat(rgRate);
    if (!qtyNum || qtyNum <= 0) {
      showToast('Please enter valid ready goods meters', 'error');
      return;
    }
    const finalFabric = rgCustomFabric.trim() ? rgCustomFabric.trim() : rgFabric;
    addReadyGoods({
      id: `RG-${Date.now().toString().slice(-4)}`,
      fabric: finalFabric,
      qty: qtyNum,
      rollCount: Math.ceil(qtyNum / 100),
      quality: rgQuality,
      rate: rateNum || 45,
      location: 'Rack Warehouse',
      status: 'Ready'
    });
    setRgQty('');
    setRgCustomFabric('');
  };

  const handleAddBroker = (e) => {
    e.preventDefault();
    if (!bName.trim()) {
      showToast('Please enter broker name', 'error');
      return;
    }
    addBroker({
      id: `BR-${Date.now().toString().slice(-4)}`,
      name: bName.trim(),
      contactPerson: bName.trim(),
      company: bCompany.trim() || 'Textile Agency',
      phone: bPhone.trim() || '+91 99000 00000',
      city: bCity.trim(),
      type: bType,
      comm: parseFloat(bComm) || 2.0,
      totalDeals: 1,
      activeOrders: 0,
      rating: 5.0
    });
    setBName('');
    setBCompany('');
    setBPhone('');
  };

  const handleAddOrder = (e) => {
    e.preventDefault();
    const qtyNum = parseFloat(soQty);
    const rateNum = parseFloat(soRate);
    if (!qtyNum || !rateNum) {
      showToast('Please fill all order quantity and rate fields', 'error');
      return;
    }
    const total = qtyNum * rateNum;
    const newOrder = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      broker: soBroker || 'Direct Mill Sale',
      buyer: soBuyer.trim() || 'Textile Buyer',
      fabric: soFabric,
      qty: qtyNum,
      rate: rateNum,
      total,
      date: new Date().toISOString().split('T')[0],
      deliveryDate: soDelivery,
      status: 'In Production',
      advance: Math.round(total * 0.25)
    };
    addSalesOrder(newOrder);

    // Prompt WhatsApp dispatch
    openWhatsAppShare({
      title: `Sales Order ${newOrder.id}`,
      message: buildSalesOrderMessage(newOrder),
      category: 'sales',
      defaultPhone: adminWhatsAppPhone
    });

    setSoQty('');
    setSoBuyer('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="heavy-card rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <Briefcase className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">
              {t('sales.title')}
            </span>
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-slate-900">
            {t('sales.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('sales.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>Commercial Hub</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('sales.salesOrdersTab')}
          value={formatRupees(totalOrderValue)}
          subtitle={`${salesOrders.length} confirmed orders`}
          icon={TrendingUp}
          variant="green"
        />

        <StatCard
          title={t('sales.readyGoodsTab')}
          value={formatMeters(totalReadyMeters)}
          subtitle="Packaged cloth rolls"
          icon={Boxes}
          variant="blue"
        />

        <StatCard
          title={t('sales.brokersTab')}
          value={brokers.length}
          subtitle="Brokers & wholesale buyers"
          icon={Users}
          variant="indigo"
        />
      </div>

      {/* Section 1: Ready Goods Stock */}
      <div className="heavy-card rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider flex items-center gap-2">
            <Boxes className="w-4 h-4 text-sky-600" />
            {t('sales.readyGoodsTab')}
          </h3>
          <span className="text-xs font-mono text-slate-400">Warehouse</span>
        </div>

        {/* Add Ready Goods Form */}
        <form onSubmit={handleAddReadyGoods} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('common.fabric')}</label>
            <input
              type="text"
              placeholder="70*72 Plain Cambric"
              value={rgCustomFabric}
              onChange={e => setRgCustomFabric(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('common.qty')} (M)</label>
            <input
              type="number"
              placeholder="2500"
              value={rgQty}
              onChange={e => setRgQty(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('sales.fabricGrade')}</label>
            <select
              value={rgQuality}
              onChange={e => setRgQuality(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
            >
              <option>A-Grade (Export)</option>
              <option>B-Grade</option>
              <option>C-Grade (Local)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('common.rate')} (₹/m)</label>
            <input
              type="number"
              value={rgRate}
              onChange={e => setRgRate(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('common.add')}</span>
            </button>
          </div>
        </form>

        {/* Ready Goods Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-2.5">{t('common.fabric')}</th>
                <th className="pb-2.5">{t('common.qty')} (m)</th>
                <th className="pb-2.5">{t('sales.rollCount')}</th>
                <th className="pb-2.5">{t('sales.fabricGrade')}</th>
                <th className="pb-2.5">{t('common.rate')}</th>
                <th className="pb-2.5">{t('common.total')}</th>
                <th className="pb-2.5">{t('common.statusLabel')}</th>
                <th className="pb-2.5 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {readyGoods.map(g => (
                <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 font-bold text-slate-900">{g.fabric}</td>
                  <td className="py-3 font-mono font-bold text-emerald-700">{g.qty.toLocaleString()} m</td>
                  <td className="py-3 font-mono text-slate-600">{g.rollCount} rolls</td>
                  <td className="py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {g.quality}
                    </span>
                  </td>
                  <td className="py-3 font-mono">₹{g.rate}</td>
                  <td className="py-3 font-mono font-bold text-slate-900">{formatRupees(g.qty * g.rate)}</td>
                  <td className="py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      {t(`status.${g.status}`)}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleBulkGenerateRolls(g)}
                        className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        title="Generate Individual Roll QRs from this lot"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const msg = buildReadyGoodsMessage(g);
                          openWhatsAppShare({
                            title: `Ready Goods Lot Slip (${g.fabric})`,
                            message: msg,
                            category: 'sales',
                            defaultPhone: salesWhatsAppPhone || adminWhatsAppPhone
                          });
                        }}
                        className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                        title="Send WhatsApp Ready Goods Slip"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteReadyGoods(g.id)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Broker Directory & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Brokers Directory */}
        <div className="heavy-card rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              {t('sales.brokersTab')}
            </h3>
            <span className="text-xs font-mono text-slate-400">{brokers.length} Partners</span>
          </div>

          {/* Quick Add Broker Form */}
          <form onSubmit={handleAddBroker} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <input
              type="text"
              placeholder={t('sales.brokerName')}
              value={bName}
              onChange={e => setBName(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
            />
            <input
              type="text"
              placeholder={t('sales.brokerCompany')}
              value={bCompany}
              onChange={e => setBCompany(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
            />
            <input
              type="text"
              placeholder={t('sales.brokerCity')}
              value={bCity}
              onChange={e => setBCity(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
            />
            <input
              type="tel"
              placeholder={t('common.phone')}
              value={bPhone}
              onChange={e => setBPhone(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
            />
            <input
              type="number"
              step="0.1"
              placeholder={t('sales.brokerCommission')}
              value={bComm}
              onChange={e => setBComm(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
            />
            <button
              type="submit"
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('common.add')}</span>
            </button>
          </form>

          {/* Broker Cards */}
          <div className="space-y-3">
            {brokers.map(b => (
              <div key={b.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs group">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">{b.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {b.comm}% Comm
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {b.company} • {b.city} • <span className="font-mono">{b.phone}</span>
                  </div>
                </div>

                <button
                  onClick={() => deleteBroker(b.id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg self-end sm:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Create Sales Order & Orders List */}
        <div className="heavy-card rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              {t('sales.newOrderTitle')}
            </h3>
            <span className="text-xs font-mono text-slate-400">{salesOrders.length} Orders</span>
          </div>

          {/* Add Sales Order Form */}
          <form onSubmit={handleAddOrder} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-slate-600 font-bold mb-1">{t('sales.buyerName')} *</label>
              <input
                type="text"
                required
                placeholder="Party Name"
                value={soBuyer}
                onChange={e => setSoBuyer(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">{t('sales.brokerName')}</label>
              <input
                type="text"
                placeholder="Broker Name"
                value={soBroker}
                onChange={e => setSoBroker(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">{t('common.fabric')}</label>
              <input
                type="text"
                value={soFabric}
                onChange={e => setSoFabric(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">{t('sales.orderedMeters')} *</label>
              <input
                type="number"
                required
                placeholder="5000"
                value={soQty}
                onChange={e => setSoQty(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">{t('sales.ratePerMeter')} *</label>
              <input
                type="number"
                required
                placeholder="48"
                value={soRate}
                onChange={e => setSoRate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('sales.newOrderTitle')}</span>
              </button>
            </div>
          </form>

          {/* Orders List */}
          <div className="space-y-3">
            {salesOrders.map(o => (
              <div key={o.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{o.id}</span>
                    <span className="font-bold text-slate-800">{o.buyer}</span>
                    <span className="text-[10px] text-slate-500">({o.broker})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    {o.qty}m @ ₹{o.rate} • Total: <span className="font-bold text-slate-900">{formatRupees(o.total)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={o.status}
                    onChange={e => updateOrderStatus(o.id, e.target.value)}
                    className="p-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold"
                  >
                    <option value="Pending">{t('status.Pending')}</option>
                    <option value="In Production">{t('status.In Production')}</option>
                    <option value="Dispatched">{t('status.Dispatched')}</option>
                    <option value="Delivered">{t('status.Delivered')}</option>
                  </select>

                  <button
                    onClick={() => deleteSalesOrder(o.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
