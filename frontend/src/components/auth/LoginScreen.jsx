import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { api } from '../../api/client';
import LanguageSwitcher from '../common/LanguageSwitcher';
import {
  Lock,
  User,
  ShieldCheck,
  Activity,
  Wrench,
  ArrowRight,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginScreen() {
  const { login, login2FA, showToast } = useApp();
  const { t } = useTranslation();

  const [selectedRole, setSelectedRole] = useState('Admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA state
  const [twoFactorData, setTwoFactorData] = useState(null); // { tempToken, user }
  const [otpCode, setOtpCode] = useState('');

  // Lockout countdown
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Force change password state
  const [forceChangeData, setForceChangeData] = useState(null); // { currentPassword, user }
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let timer;
    if (lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (!username || username === 'admin' || username === 'supervisor' || username === 'operator') {
      setUsername(role.toLowerCase());
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showToast(t('auth.enterUsername') + ' & ' + t('auth.enterPassword'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(selectedRole, username.trim(), password);
      if (res?.twoFactorRequired) {
        setTwoFactorData(res);
      } else if (res?.user?.mustChangePassword) {
        setForceChangeData({ currentPassword: password, user: res.user });
      }
    } catch (err) {
      if (err.errorCode === 'AUTH_ACCOUNT_LOCKED') {
        const mins = err.data?.data?.remainingMinutes || 15;
        setLockoutTimer(mins * 60);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      showToast(t('auth.enterTwoFactorCode'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login2FA(twoFactorData.tempToken, otpCode.trim());
      if (res?.user?.mustChangePassword) {
        setForceChangeData({ currentPassword: password, user: res.user });
      }
    } catch (err) {
      // toast shown in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      showToast(t('auth.enterIdentifier'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { identifier: forgotIdentifier.trim() });
      setForgotSent(true);
      showToast('Password reset link sent if account exists', 'success');
    } catch (err) {
      showToast(err.message || 'Error sending reset request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceChangeSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast(t('auth.passwordsDoNotMatch'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: forceChangeData.currentPassword,
        newPassword
      });
      setForceChangeData(null);
      showToast('Password updated successfully! Welcome to LOOMUS.', 'success');
    } catch (err) {
      showToast(err.message || t('auth.weakPasswordWarning'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(4, Math.floor(score * 0.7));
  };

  return (
    <div className="min-h-screen bg-slate-100/90 grid-mesh flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-2xl relative overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500" />

        {/* Top Bar with Language Switcher */}
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-sky-600/25 mb-3 font-display font-black text-2xl tracking-wider">
            LM
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900">
            {t('app.name')}
          </h1>
          <p className="text-xs font-semibold text-slate-400 font-mono tracking-widest uppercase mt-0.5">
            {t('app.tagline')}
          </p>
        </div>

        {/* Lockout Banner */}
        {lockoutTimer > 0 && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <strong>{t('auth.accountLocked', { minutes: Math.ceil(lockoutTimer / 60) })}</strong>
              <div className="text-[11px] text-rose-600 font-mono mt-0.5">
                Countdown: {Math.floor(lockoutTimer / 60)}:{(lockoutTimer % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        )}

        {/* 1. Normal Login Form */}
        {!twoFactorData && !isForgotPassword && !forceChangeData && (
          <>
            {/* Role Switcher Selection */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-2">
                {t('auth.selectPortal')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('Admin')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    selectedRole === 'Admin'
                      ? 'bg-sky-50 border-sky-300 text-sky-800 shadow-xs ring-2 ring-sky-200'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>{t('roles.Admin')}</span>
                  <span className="text-[9px] font-normal text-slate-400">{t('roles.FullAccess')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('Supervisor')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    selectedRole === 'Supervisor'
                      ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs ring-2 ring-amber-200'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Activity className="w-4 h-4 text-amber-600" />
                  <span>{t('roles.Supervisor')}</span>
                  <span className="text-[9px] font-normal text-slate-400">{t('roles.FloorLevel')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('Operator')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    selectedRole === 'Operator'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs ring-2 ring-emerald-200'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  <span>{t('roles.Operator')}</span>
                  <span className="text-[9px] font-normal text-slate-400">{t('roles.HMIConsole')}</span>
                </button>
              </div>

              <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 font-medium">
                {selectedRole === 'Admin' && (
                  <span>👑 <strong>{t('roles.Admin')}:</strong> {t('auth.adminPortalDesc')}</span>
                )}
                {selectedRole === 'Supervisor' && (
                  <span>🛡️ <strong>{t('roles.Supervisor')}:</strong> {t('auth.supervisorPortalDesc')}</span>
                )}
                {selectedRole === 'Operator' && (
                  <span>⚡ <strong>{t('roles.Operator')}:</strong> {t('auth.operatorPortalDesc')}</span>
                )}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('auth.usernameOrId')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder={t('auth.enterUsername')}
                    disabled={lockoutTimer > 0}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {t('auth.password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('auth.enterPassword')}
                    disabled={lockoutTimer > 0}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || lockoutTimer > 0}
                className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-sky-600/25 active:scale-95 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? t('auth.authenticating') : t('auth.signInTo', { role: t(`roles.${selectedRole}`) })}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {/* 2. Two-Factor Authentication Step */}
        {twoFactorData && !forceChangeData && (
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center gap-2 text-indigo-900 text-xs">
              <KeyRound className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <strong>{t('auth.twoFactorTitle')}</strong>
                <p className="text-[11px] text-indigo-700 mt-0.5">{t('auth.enterTwoFactorCode')}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('auth.otpCode')}
              </label>
              <input
                type="text"
                maxLength={8}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                placeholder="123456"
                autoFocus
                className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTwoFactorData(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-2 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {isSubmitting ? t('auth.authenticating') : t('auth.verifyOtp')}
              </button>
            </div>
          </form>
        )}

        {/* 3. Forgot Password View */}
        {isForgotPassword && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center gap-2 text-sky-900 text-xs">
              <ShieldAlert className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <strong>{t('auth.resetPasswordTitle')}</strong>
                <p className="text-[11px] text-sky-700 mt-0.5">{t('auth.enterIdentifier')}</p>
              </div>
            </div>

            {forgotSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs text-emerald-800 font-semibold">
                  Password reset link has been dispatched to your email/mobile.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotSent(false);
                  }}
                  className="text-xs text-sky-600 font-bold hover:underline pt-2 block mx-auto"
                >
                  {t('auth.backToLogin')}
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('auth.usernameOrId')}
                  </label>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={e => setForgotIdentifier(e.target.value)}
                    placeholder="admin or user@mill.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    {t('auth.backToLogin')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    {isSubmitting ? t('auth.authenticating') : t('auth.sendResetLink')}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* 4. Force Password Change View */}
        {forceChangeData && (
          <form onSubmit={handleForceChangeSubmit} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-amber-900 text-xs">
              <KeyRound className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong>{t('auth.forceChangeTitle')}</strong>
                <p className="text-[11px] text-amber-700 mt-0.5">{t('auth.forceChangeDesc')}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('auth.newPassword')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={t('auth.enterPassword')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />

              {/* Password strength meter */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    {[1, 2, 3, 4].map(step => (
                      <div
                        key={step}
                        className={`flex-1 transition-colors ${
                          getPasswordStrength(newPassword) >= step
                            ? getPasswordStrength(newPassword) <= 1
                              ? 'bg-rose-500'
                              : getPasswordStrength(newPassword) === 2
                              ? 'bg-amber-500'
                              : getPasswordStrength(newPassword) === 3
                              ? 'bg-sky-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {getPasswordStrength(newPassword) <= 1 && t('auth.strengthWeak')}
                    {getPasswordStrength(newPassword) === 2 && t('auth.strengthFair')}
                    {getPasswordStrength(newPassword) === 3 && t('auth.strengthGood')}
                    {getPasswordStrength(newPassword) >= 4 && t('auth.strengthStrong')}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('auth.confirmNewPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={t('auth.enterPassword')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg active:scale-95"
            >
              {isSubmitting ? t('auth.authenticating') : t('auth.updatePasswordBtn')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
