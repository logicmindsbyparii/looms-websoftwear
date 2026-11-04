import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  Camera,
  Video,
  Radio,
  Plus,
  Maximize2,
  Disc,
  Image,
  Sliders,
  CheckCircle2,
  Power,
  Trash2
} from 'lucide-react';

export default function CameraView() {
  const {
    cameras,
    userRole,
    toggleCamera,
    addCamera,
    deleteCamera,
    showToast
  } = useApp();
  const { t } = useTranslation();

  const [camName, setCamName] = useState('');
  const [camSN, setCamSN] = useState('');
  const [camUser, setCamUser] = useState('admin');
  const [camPass, setCamPass] = useState('');
  const [camIP, setCamIP] = useState('');
  const [camLocation, setCamLocation] = useState('');

  const handleAddCamera = (e) => {
    e.preventDefault();
    if (!camName.trim() || !camSN.trim()) {
      showToast('Please enter Camera Name and Serial Number (SN)', 'error');
      return;
    }

    addCamera({
      id: `cam-${Date.now().toString().slice(-4)}`,
      name: camName.trim(),
      sn: camSN.trim(),
      user: camUser || 'admin',
      location: camLocation.trim() || 'Mill Floor',
      connected: true,
      ip: camIP.trim() || '192.168.1.101',
      fps: 30,
      channel: `CH-${cameras.length + 1}`
    });

    setCamName('');
    setCamSN('');
    setCamIP('');
    setCamLocation('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="heavy-card rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <Camera className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">
              {t('nav.camera')}
            </span>
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-slate-900">
            {t('camera.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('camera.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {cameras.filter(c => c.connected).length} {t('common.statusLabel')}
          </span>
        </div>
      </div>

      {/* EasyViewer Pro Camera Grid */}
      {cameras.length === 0 ? (
        <div className="heavy-card rounded-3xl p-12 text-center text-slate-400 space-y-2">
          <Camera className="w-12 h-12 mx-auto text-slate-300" />
          <h4 className="text-base font-bold text-slate-700">{t('common.noData')}</h4>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cameras.map((cam) => {
            return (
              <div key={cam.id} className="heavy-card rounded-2xl overflow-hidden border border-slate-200/90 flex flex-col relative group">
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-sky-900 to-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-xs truncate max-w-[160px]">{cam.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${cam.connected ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
                      <span className="text-[10px] font-mono font-bold text-slate-300">
                        {cam.connected ? t('app.live') : 'STANDBY'}
                      </span>
                    </div>

                    {userRole === 'Admin' && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${cam.name}?`)) deleteCamera(cam.id);
                        }}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Viewport simulation */}
                <div className="relative h-52 bg-slate-950 flex items-center justify-center overflow-hidden">
                  {cam.connected ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="text-center z-10 space-y-1">
                        <div className="text-sky-400 font-mono font-extrabold text-sm tracking-widest">
                          [{t('app.live')} STREAM {cam.channel}]
                        </div>
                        <div className="text-slate-400 text-xs font-mono">
                          {cam.location} • 1080p @ {cam.fps} FPS
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Bitrate: 2,420 kbps | H.265
                        </div>
                      </div>

                      <div className="absolute top-2 left-2 text-[10px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded">
                        REC ● {new Date().toLocaleTimeString()}
                      </div>
                      <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded">
                        SN: {cam.sn}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <Radio className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-semibold text-slate-400">{t('camera.disconnected')}</p>
                      <button
                        onClick={() => toggleCamera(cam.id)}
                        className="px-3 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
                      >
                        {t('camera.connectStream')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleCamera(cam.id)}
                      className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                        cam.connected
                          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{cam.connected ? t('camera.disconnectStream') : t('camera.connectStream')}</span>
                    </button>

                    <button
                      onClick={() => showToast('Snapshot frame captured to gallery', 'success')}
                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
                      title="Capture Snapshot"
                    >
                      <Image className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => showToast('Recording started to local NVR', 'info')}
                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
                      title="Toggle NVR Recording"
                    >
                      <Disc className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  </div>

                  <button
                    onClick={() => showToast('PTZ controller opened (Pan/Tilt/Zoom)', 'info')}
                    className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] font-semibold">PTZ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New EasyViewer Pro Camera Form */}
      <form onSubmit={handleAddCamera} className="heavy-card rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">
              {t('camera.addCameraTitle')}
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{t('common.add')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('camera.cameraName').toUpperCase()}</label>
            <input
              type="text"
              placeholder="e.g. Shed A Bay 2"
              value={camName}
              onChange={e => setCamName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('camera.serialNumber').toUpperCase()}</label>
            <input
              type="text"
              placeholder="e.g. EV2026-AIRJET-07"
              value={camSN}
              onChange={e => setCamSN(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('auth.usernameOrId').toUpperCase()}</label>
            <input
              type="text"
              value={camUser}
              onChange={e => setCamUser(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('auth.password').toUpperCase()}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={camPass}
              onChange={e => setCamPass(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">IP / RTSP</label>
            <input
              type="text"
              placeholder="192.168.1.107"
              value={camIP}
              onChange={e => setCamIP(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">{t('common.shed').toUpperCase()}</label>
            <input
              type="text"
              placeholder="e.g. Jacquard Shed"
              value={camLocation}
              onChange={e => setCamLocation(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {t('camera.addCameraTitle')}
          </button>
        </div>
      </form>
    </div>
  );
}
