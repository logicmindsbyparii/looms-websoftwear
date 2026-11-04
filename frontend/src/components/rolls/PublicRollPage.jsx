import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { formatDate } from '../../utils/formatters';

export default function PublicRollPage({ rollCode, onGoToLogin }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roll, setRoll] = useState(null);

  useEffect(() => {
    // Ensure noindex meta tag is dynamically present
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';

    if (!rollCode) {
      setError('No roll verification code provided in URL.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api.get(`/public/rolls/${encodeURIComponent(rollCode)}`)
      .then((res) => {
        if (isMounted) {
          setRoll(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Roll not found or verification failed.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [rollCode]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ready':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Reserved':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Dispatched':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Hold':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-blue-50 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between pb-6 border-b border-sky-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            LM
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">TEAM LMP</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">v2.0</span>
            </div>
            <p className="text-xs text-slate-700 font-medium tracking-wide">AUTHENTIC TEXTILE VERIFICATION</p>
          </div>
        </div>

        {onGoToLogin && (
          <button
            onClick={onGoToLogin}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-200 transition-all shadow-sm"
          >
            Staff Login →
          </button>
        )}
      </header>

      {/* Main Body */}
      <main className="max-w-xl w-full mx-auto my-auto py-8">
        {loading ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6 animate-pulse">
            <div className="h-6 bg-slate-200 rounded-lg w-1/3 mx-auto" />
            <div className="h-20 bg-slate-100 rounded-2xl w-full" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-slate-100 rounded-2xl" />
              <div className="h-16 bg-slate-100 rounded-2xl" />
            </div>
            <div className="h-24 bg-slate-100 rounded-2xl" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center text-3xl mx-auto shadow-inner">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-slate-900">Roll Not Found or Inactive</h2>
            <p className="text-sm text-slate-700 max-w-sm mx-auto">
              This QR code or Roll ID does not match an active fabric roll in our mill records.
            </p>
            <div className="pt-4">
              <button
                onClick={() => window.location.reload()}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : roll ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden backdrop-blur-sm">
            {/* Verification Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 px-6 py-4 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider">Genuine Mill Verified Roll</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border bg-white/20 text-white backdrop-blur-sm`}>
                {roll.status}
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Roll ID & Animated Icon */}
              <div className="text-center space-y-2 pb-4 border-b border-slate-100">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-100 to-blue-100 text-blue-600 text-2xl shadow-inner mb-2">
                  🧵
                </div>
                <div className="text-xs uppercase font-bold text-slate-700 tracking-wider">TAKA ROLL NUMBER</div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                  {roll.id}
                </div>
              </div>

              {/* Length Metres Hero Card */}
              <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl p-5 text-white flex items-center justify-between shadow-lg">
                <div>
                  <div className="text-xs uppercase font-medium text-slate-400 tracking-wider">Roll Length</div>
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
                    {Number(roll.metres).toFixed(2)} <span className="text-lg font-semibold text-sky-400">metres</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase font-medium text-slate-400 tracking-wider">Quality Grade</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-300 mt-1">
                    {roll.quality || 'A-Grade (Export)'}
                  </div>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Fabric Construction</div>
                  <div className="text-sm font-bold text-slate-900">{roll.fabric}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Produced By Loom</div>
                  <div className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>🏭</span>
                    <span>{roll.machine?.name || roll.machine?.id || 'Weaving Loom'}</span>
                  </div>
                </div>

                {roll.location && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2">
                    <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Storage Location</div>
                    <div className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                      <span className="text-rose-500">📍</span>
                      <span>{roll.location.name}</span>
                      {roll.location.shed && (
                        <span className="text-xs font-medium text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                          {roll.location.shed}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Production Date</div>
                  <div className="text-sm font-bold text-slate-900">
                    {formatDate(roll.producedAt)}
                  </div>
                </div>
              </div>

              {/* Security Seal Note */}
              <div className="pt-2 text-center text-xs text-slate-700 flex items-center justify-center space-x-2">
                <span>🔒</span>
                <span>Verified authentic fabric taka from TEAM LMP Textile Suite</span>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="max-w-xl w-full mx-auto text-center pt-6 border-t border-sky-100 text-xs text-slate-700 space-y-1">
        <p>© 2026 TEAM LMP / LOOMUS. All rights reserved.</p>
        <p className="text-[11px] text-slate-700">Digital QR Roll Tracking & Ledger System</p>
      </footer>
    </div>
  );
}
