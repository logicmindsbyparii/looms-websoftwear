import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import StatCard from '../common/StatCard';
import { formatRupees, formatMeters } from '../../utils/formatters';
import {
  openWhatsApp,
  buildDailyAdminExecutiveReport
} from '../../utils/whatsapp';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Zap,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
  MessageSquare
} from 'lucide-react';

export default function AnalyticsView() {
  const {
    machines,
    salesOrders,
    stockLevels,
    alarms,
    productionLogs,
    adminWhatsAppPhone,
    openWhatsAppShare,
    showToast
  } = useApp();
  const { t } = useTranslation();

  const [timeRange, setTimeRange] = useState('7d');

  const weeklyData = [
    { day: 'Mon', meters: 2840, kwh: 1780 },
    { day: 'Tue', meters: 3120, kwh: 1850 },
    { day: 'Wed', meters: 2950, kwh: 1790 },
    { day: 'Thu', meters: 3340, kwh: 1920 },
    { day: 'Fri', meters: 3180, kwh: 1860 },
    { day: 'Sat', meters: 3510, kwh: 1980 },
    { day: 'Sun', meters: 1420, kwh: 920 }
  ];

  const maxMeters = Math.max(...weeklyData.map(d => d.meters));

  const sortedLooms = [...machines].sort((a, b) => b.efficiency - a.efficiency);
  const topLooms = sortedLooms.slice(0, 6);
  const lowLooms = sortedLooms.slice(-4).reverse();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="heavy-card rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">
              {t('nav.analytics')}
            </span>
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-slate-900">
            {t('analytics.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('analytics.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const reportMsg = buildDailyAdminExecutiveReport({
                machines,
                productionLogs,
                salesOrders,
                stockLevels,
                alarms
              });
              openWhatsAppShare({
                title: t('analytics.sendDailyReport'),
                message: reportMsg,
                category: 'analytics',
                defaultPhone: adminWhatsAppPhone
              });
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('analytics.sendDailyReport')}</span>
          </button>

          {/* Range Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {['24h', '7d', '30d', '90d'].map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                  timeRange === r
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('analytics.metersWovenWeekly')}
          value="20,360 m"
          subtitle="Avg: 2,908 m / day"
          icon={BarChart3}
          variant="blue"
          trend={{ positive: true, text: '+8.4%' }}
        />

        <StatCard
          title={t('analytics.powerConsumptionKwh')}
          value="64.8 kWh"
          subtitle="/ 100m"
          icon={Zap}
          variant="amber"
          trend={{ positive: true, text: '-3.2%' }}
        />

        <StatCard
          title={t('analytics.totalRevenue')}
          value="₹14.8 L"
          subtitle={t('common.all')}
          icon={TrendingUp}
          variant="green"
          trend={{ positive: true, text: '+12%' }}
        />

        <StatCard
          title={t('dashboard.plantEfficiency')}
          value="91.4%"
          subtitle="OEE Benchmark"
          icon={Award}
          variant="indigo"
          trend={{ positive: true, text: 'World class' }}
        />
      </div>

      {/* Weekly Output Chart & Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Weekly Interactive Output Bar Chart */}
        <div className="lg:col-span-2 heavy-card rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">
                  {t('analytics.dailyProductionPower')}
                </h3>
                <p className="text-xs text-slate-500">{t('analytics.metersWovenWeekly')}</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Peak: 3,510m (Sat)
              </span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-56 flex items-end justify-between gap-3 px-2 pt-6">
              {weeklyData.map((d) => {
                const heightPct = Math.round((d.meters / maxMeters) * 100);

                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[11px] font-mono font-bold text-slate-500 group-hover:text-sky-600 transition-colors">
                      {d.meters}m
                    </span>

                    <div className="w-full max-w-[48px] bg-slate-100 rounded-xl overflow-hidden h-40 flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-sky-600 to-indigo-500 rounded-xl transition-all duration-500 group-hover:from-sky-500 group-hover:to-indigo-400 group-hover:shadow-lg group-hover:shadow-sky-500/20"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    <span className="text-xs font-bold text-slate-700 font-mono">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Plant Target: 3,200m / day</span>
            <span className="text-emerald-600 font-bold">6 of 7 Days Met Threshold</span>
          </div>
        </div>

        {/* Right 1 Col: Fabric Revenue Share Breakdown */}
        <div className="heavy-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">
              {t('analytics.fabricShare')}
            </h3>
            <span className="text-xs font-mono text-slate-400">{t('common.date')}</span>
          </div>

          <div className="space-y-4">
            {[
              { name: '70*72 Plain Cambric', amount: '₹5.4 L', pct: 36, color: 'bg-sky-500' },
              { name: 'Cotton 40s Combed', amount: '₹4.2 L', pct: 28, color: 'bg-emerald-500' },
              { name: 'Heavy Denim 14oz', amount: '₹2.8 L', pct: 19, color: 'bg-indigo-500' },
              { name: '70*68 Medium Grey', amount: '₹1.6 L', pct: 11, color: 'bg-amber-500' },
              { name: 'Silk Blend Chiffon', amount: '₹0.8 L', pct: 6, color: 'bg-purple-500' },
            ].map(f => (
              <div key={f.name} className="space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-800">{f.name}</span>
                  <span className="font-mono font-bold text-slate-900">{f.amount} ({f.pct}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${f.color}`} style={{ width: `${f.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500 font-medium">{t('analytics.totalRevenue')}: </span>
            <strong className="text-slate-900 font-mono text-sm">₹14.8 Lakhs</strong>
          </div>
        </div>
      </div>

      {/* Loom Efficiency Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 6 Looms */}
        <div className="heavy-card rounded-2xl p-4 sm:p-6">
          <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            {t('analytics.topEfficiencyLooms')}
          </h3>

          <div className="divide-y divide-slate-100 text-xs">
            {topLooms.map((m, idx) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-400 w-4">#{idx + 1}</span>
                  <div>
                    <span className="font-bold text-slate-900 font-mono">{m.id}</span>
                    <span className="text-[11px] text-slate-500 ml-2">{m.fabric}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono">
                  <span className="text-slate-600">{m.rpm} RPM</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {m.efficiency}%
                  </span>
                </div>
              </div>
            ))}
            {topLooms.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">
                {t('common.noData')}
              </div>
            )}
          </div>
        </div>

        {/* Looms Needing Attention */}
        <div className="heavy-card rounded-2xl p-4 sm:p-6">
          <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            {t('analytics.lowEfficiencyLooms')}
          </h3>

          <div className="divide-y divide-slate-100 text-xs">
            {lowLooms.map(m => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900">{m.id}</span>
                  <span className="text-[11px] text-slate-500">{m.fabric}</span>
                </div>

                <div className="flex items-center gap-4 font-mono">
                  <span className="text-slate-500">{t(`status.${m.status}`) || m.status.toUpperCase()}</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {m.efficiency}%
                  </span>
                </div>
              </div>
            ))}
            {lowLooms.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">
                {t('common.noData')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

