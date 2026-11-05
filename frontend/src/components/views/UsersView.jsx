import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { api } from '../../api/client';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Unlock,
  LogOut,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export default function UsersView() {
  const { showToast, currentUser } = useApp();
  const { t } = useTranslation();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New user form state
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
    phone: '',
    role: 'Operator',
    password: '',
    assignedMachines: ''
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.set('search', searchTerm);
      if (roleFilter) query.set('role', roleFilter);

      const res = await api.get(`/users?${query.toString()}`);
      setUsers(res.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const machinesArray = formData.assignedMachines
        ? formData.assignedMachines.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...formData,
        assignedMachines: machinesArray
      };

      const res = await api.post('/users', payload);
      showToast(
        t('users.tempPasswordNotice', { password: res.data?.temporaryPassword || 'Set' }),
        'success'
      );
      setIsCreateOpen(false);
      setFormData({
        username: '',
        displayName: '',
        email: '',
        phone: '',
        role: 'Operator',
        password: '',
        assignedMachines: ''
      });
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.patch(`/users/${user._id}`, { isActive: !user.isActive });
      showToast(`User ${user.username} ${user.isActive ? 'deactivated' : 'activated'}`, 'info');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update user status', 'error');
    }
  };

  const handleAdminResetPassword = async (user) => {
    try {
      const res = await api.post(`/users/${user._id}/reset-password`, {});
      showToast(`Temporary password for ${user.username}: ${res.data?.temporaryPassword}`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to reset password', 'error');
    }
  };

  const handleUnlockUser = async (user) => {
    try {
      await api.post(`/users/${user._id}/unlock`, {});
      showToast(`Account for ${user.username} unlocked!`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to unlock user', 'error');
    }
  };

  const handleForceLogout = async (user) => {
    try {
      await api.post(`/users/${user._id}/force-logout`, {});
      showToast(`User ${user.username} forced logout from all devices`, 'info');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to force logout', 'error');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.username}?`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      showToast(`User ${user.username} deleted`, 'info');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black font-display tracking-tight text-slate-900">
              {t('users.title')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {t('users.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('users.addUserBtn')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs text-slate-700"
          >
            <option value="">{t('common.all')} {t('common.filter')}</option>
            <option value="Admin">{t('roles.Admin')}</option>
            <option value="Supervisor">{t('roles.Supervisor')}</option>
            <option value="Operator">{t('roles.Operator')}</option>
          </select>

          <button
            onClick={fetchUsers}
            className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">{t('common.name')}</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">{t('users.accountStatus')}</th>
                <th className="py-3 px-4">{t('users.assignedLooms')}</th>
                <th className="py-3 px-4">{t('common.phone')}</th>
                <th className="py-3 px-4 pr-16 md:pr-24 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isLocked = u.lockUntil && new Date(u.lockUntil) > new Date();
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold flex items-center justify-center font-display text-sm shrink-0">
                            {u.displayName?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{u.displayName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            u.role === 'Admin'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : u.role === 'Supervisor'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {t(`roles.${u.role}`)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                              u.isActive ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          >
                            {u.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span>{u.isActive ? t('users.active') : t('users.deactivated')}</span>
                          </span>
                          {isLocked && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md font-bold">
                              <AlertTriangle className="w-3 h-3" /> Locked
                            </span>
                          )}
                          {u.mustChangePassword && (
                            <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md font-mono">
                              {t('users.mustChangePassBadge')}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] font-mono text-slate-600">
                          {u.assignedMachines?.length > 0 ? u.assignedMachines.join(', ') : 'All Looms'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-600">{u.phone || '—'}</div>
                      </td>

                      <td className="py-3 px-4 pr-16 md:pr-24 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isLocked && (
                            <button
                              onClick={() => handleUnlockUser(u)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                              title={t('users.unlockAccountBtn')}
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleAdminResetPassword(u)}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg"
                            title={t('users.resetPasswordBtn')}
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleForceLogout(u)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                            title={t('users.forceLogoutBtn')}
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={u.username === currentUser.username}
                            className={`p-1.5 rounded-lg ${
                              u.isActive
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            } disabled:opacity-30`}
                            title={u.isActive ? t('users.deactivateBtn') : t('users.activateBtn')}
                          >
                            {u.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.username === currentUser.username}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-30"
                            title={t('users.deleteUserBtn')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-600" />
                <h3 className="font-display font-bold text-lg text-slate-800">
                  {t('users.addUserBtn')}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('auth.usernameOrId')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. op_ramesh"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('common.name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Operator">{t('roles.Operator')}</option>
                    <option value="Supervisor">{t('roles.Supervisor')}</option>
                    <option value="Admin">{t('roles.Admin')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('common.phone')}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@mill.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('users.assignedLooms')} (Comma separated, e.g. M-01, M-02)
                </label>
                <input
                  type="text"
                  value={formData.assignedMachines}
                  onChange={(e) => setFormData({ ...formData, assignedMachines: e.target.value })}
                  placeholder="M-01, M-02, M-03"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

