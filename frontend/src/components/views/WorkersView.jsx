import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import StatCard from '../common/StatCard';
import CustomSelect from '../common/CustomSelect';
import {
  buildAttendanceSummaryMessage
} from '../../utils/whatsapp';
import {
  Users,
  UserCheck,
  Coffee,
  UserX,
  Plus,
  MessageSquare,
  Search,
  Trash2
} from 'lucide-react';

export default function WorkersView() {
  const {
    workers,
    userRole,
    addWorker,
    deleteWorker,
    updateWorkerStatus,
    machines,
    adminWhatsAppPhone,
    openWhatsAppShare,
    showToast
  } = useApp();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [role, setRole] = useState('Loom Operator');
  const [machine, setMachine] = useState(machines[0]?.id || 'M-01');
  const [shift, setShift] = useState('Morning (6AM - 2PM)');
  const [phone, setPhone] = useState('');
  const [shed, setShed] = useState('Shed A');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCount = workers.filter(w => w.status === 'active').length;
  const breakCount = workers.filter(w => w.status === 'break').length;
  const absentCount = workers.filter(w => w.status === 'absent' || w.status === 'off').length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !workerId.trim()) {
      showToast('Please enter worker name and ID', 'error');
      return;
    }

    addWorker({
      id: workerId.trim().toUpperCase(),
      name: name.trim(),
      role,
      machine,
      shift,
      phone: phone || '+91 98000 00000',
      status: 'active',
      shed
    });

    setName('');
    setWorkerId('');
    setPhone('');
  };

  const filteredWorkers = workers.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.machine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="heavy-card rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">
              {t('workers.title')}
            </span>
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-slate-900">
            {t('workers.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('workers.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const msg = buildAttendanceSummaryMessage(workers);
              openWhatsAppShare({
                title: 'Staff Attendance Roster',
                message: msg,
                category: 'worker',
                defaultPhone: adminWhatsAppPhone
              });
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('common.sendWhatsApp')}</span>
          </button>

          <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>{workers.length} {t('common.all')}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('status.active')}
          value={activeCount}
          subtitle="Operating machine bays"
          icon={UserCheck}
          variant="green"
        />

        <StatCard
          title={t('status.break')}
          value={breakCount}
          subtitle="Tea / lunch break"
          icon={Coffee}
          variant="amber"
        />

        <StatCard
          title={t('status.off')}
          value={absentCount}
          subtitle="Requires floor coverage"
          icon={UserX}
          variant="rose"
        />
      </div>

      {/* Register New Worker Form (Admin & Supervisor Only) */}
      {(userRole === 'Admin' || userRole === 'Supervisor') && (
        <form onSubmit={handleSubmit} className="heavy-card rounded-2xl p-5 bg-white border border-slate-200">
          <h3 className="font-bold text-slate-800 text-sm mb-3 font-display">
            {t('workers.addWorkerTitle')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">ID *</label>
              <input
                type="text"
                required
                placeholder="W-106"
                value={workerId}
                onChange={e => setWorkerId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">{t('workers.workerName')} *</label>
              <input
                type="text"
                required
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">{t('workers.designation')}</label>
              <CustomSelect
                value={role}
                onChange={val => setRole(val)}
                options={[
                  'Senior Loom Master',
                  'Chief Mechanic',
                  'Loom Operator',
                  'Quality Inspector',
                  'Floor Supervisor'
                ]}
                className="w-full"
                buttonClassName="w-full bg-slate-50 border-slate-200 py-2 font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">{t('workers.assignedMachine')}</label>
              <input
                type="text"
                placeholder="M-01 to M-06"
                value={machine}
                onChange={e => setMachine(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('common.save')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Workers Directory Table */}
      <div className="heavy-card rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">{t('common.name')}</th>
                <th className="py-3 px-4">{t('workers.designation')}</th>
                <th className="py-3 px-4">{t('workers.assignedMachine')}</th>
                <th className="py-3 px-4">{t('common.phone')}</th>
                <th className="py-3 px-4">{t('common.statusLabel')}</th>
                {(userRole === 'Admin' || userRole === 'Supervisor') && (
                  <th className="py-3 px-4 pr-16 md:pr-24 text-right">{t('common.actions')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkers.map(w => (
                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{w.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{w.name}</td>
                  <td className="py-3 px-4 text-slate-600">{w.role}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{w.machine}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{w.phone}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        w.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : w.status === 'break'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {t(`status.${w.status}`)}
                    </span>
                  </td>
                  {(userRole === 'Admin' || userRole === 'Supervisor') && (
                    <td className="py-3 px-4 pr-16 md:pr-24 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <CustomSelect
                          value={w.status}
                          onChange={val => updateWorkerStatus(w.id, val)}
                          options={[
                            { value: 'active', label: t('status.active'), status: 'active' },
                            { value: 'break', label: t('status.break'), status: 'break' },
                            { value: 'off', label: t('status.off'), status: 'off' }
                          ]}
                          size="sm"
                          align="right"
                          buttonClassName="bg-slate-50 border-slate-200 py-1 px-2 text-[11px]"
                        />
                        <button
                          onClick={() => deleteWorker(w.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
