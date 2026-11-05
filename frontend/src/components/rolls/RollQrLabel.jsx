import React, { useRef, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { QrCode, X } from 'lucide-react';

export default function RollQrLabel({ roll, onClose, mode = 'single' }) {
  const barcodeRef = useRef(null);
  const labelRef = useRef(null);
  const { showToast } = useApp();

  const rollId = roll?.id || 'TK-2026-000001';
  const fabricName = roll?.fabric || 'Cotton Grey';
  const qualityGrade = roll?.quality || 'A-Grade (Export)';
  const metresVal = `${Number(roll?.metres || 0).toFixed(2)} Metres`;
  const machineInfo = roll?.machineName || roll?.machineId || 'M-01';
  const locationInfo = roll?.locationId || 'Main Floor';
  const prodDate = formatDate(roll?.producedAt) || new Date().toLocaleDateString();

  // Offline Phone Card Text with Product Details and Origin Loom Machine:
  const offlineCardText = [
    `TEAM LMP TEXTILE`,
    `ROLL: ${rollId}`,
    `FABRIC: ${fabricName}`,
    `GRADE: ${qualityGrade}`,
    `LENGTH: ${metresVal}`,
    `LOOM: ${machineInfo}`,
    `DATE: ${prodDate}`
  ].join('\n');

  const qrValue = offlineCardText;

  useEffect(() => {
    if (barcodeRef.current && rollId) {
      try {
        JsBarcode(barcodeRef.current, rollId, {
          format: 'CODE128',
          width: 1.5,
          height: 38,
          displayValue: false,
          margin: 0
        });
      } catch (e) {
        console.error('Failed to generate Code128 barcode:', e);
      }
    }
  }, [rollId]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    try {
      navigator.clipboard.writeText(qrValue);
      if (showToast) showToast('QR Content copied to clipboard', 'success');
    } catch (e) {}
  };

  const handleDownloadPng = () => {
    if (!labelRef.current) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 2; // High resolution
    const width = 400;
    const height = 280;
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('TEAM LMP TEXTILE SUITE', 18, 26);

    // Roll ID
    ctx.font = 'bold 18px monospace';
    ctx.fillText(rollId, 18, 50);

    // Fabric & Quality
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(fabricName, 18, 74);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Quality: ${qualityGrade}`, 18, 92);

    // Metres (Big)
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${Number(roll?.metres || 0).toFixed(2)} m`, 18, 126);

    // Product & Origin Loom Machine Details
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Loom: ${machineInfo}`, 18, 150);
    ctx.fillText(`Loc: ${locationInfo}`, 18, 166);
    ctx.fillText(`Date: ${prodDate}`, 18, 182);

    // Barcode image if rendered
    if (barcodeRef.current) {
      try {
        ctx.drawImage(barcodeRef.current, 18, 200, 180, 45);
        ctx.font = '9px monospace';
        ctx.fillText(rollId, 18, 258);
      } catch (e) {}
    }

    // Convert SVG QR to Image on Canvas
    const svgElem = labelRef.current.querySelector('svg');
    if (svgElem) {
      const xml = new XMLSerializer().serializeToString(svgElem);
      const svg64 = btoa(xml);
      const b64Start = 'data:image/svg+xml;base64,';
      const image64 = b64Start + svg64;
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 225, 20, 155, 155);
        ctx.font = '8px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('SCAN WITH ANY PHONE', 302, 184);

        // Download link
        const a = document.createElement('a');
        a.download = `QR-LABEL-${rollId}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      };
      img.src = image64;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Roll QR & Barcode Sticker Label</h3>
              <p className="text-xs text-slate-700">Universal Direct Scan (Works on Any Phone Without Web)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col items-center space-y-4">
          {/* Universal Direct Scan Badge */}
          <div className="w-full max-w-[380px] p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Direct Offline Phone Scan Active</span>
              </span>
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline"
              >
                {showConfig ? 'Hide' : 'Options'}
              </button>
            </div>

            <p className="text-[11.5px] text-emerald-800 leading-snug">
              ✨ <strong>Web link ya IP ki koi zaroorat nahi:</strong> Kisi bhi phone (Camera, Google Lens, WhatsApp QR scanner) se scan karte hi poori roll details screen par turant bina internet ke dikhegi!
            </p>

            {showConfig && (
              <div className="pt-2 border-t border-emerald-200/80 space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFormatChange('text')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      qrFormat === 'text'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Direct Text Card (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatChange('url')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      qrFormat === 'url'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Public Web Link
                  </button>
                </div>

                {qrFormat === 'url' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">
                      Enter Public Domain / Hosted Website URL:
                    </label>
                    <input
                      type="text"
                      value={customWebUrl}
                      onChange={(e) => handleWebUrlChange(e.target.value)}
                      placeholder="https://yourmilldomain.com"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 text-[10px] text-emerald-700">
              <span className="font-semibold">Scanner Feedback: Instant On-Screen Card</span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-emerald-800 hover:text-emerald-950 font-bold underline"
              >
                Copy Content
              </button>
            </div>
          </div>

          {/* Printable Label Area (Exact 100mm x 70mm Industrial Ratio) */}
          <div
            ref={labelRef}
            id="printable-roll-label"
            className="w-[380px] bg-white border-2 border-slate-900 rounded-xl p-4 text-slate-900 shadow-md font-sans select-none shrink-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xs tracking-tight">TEAM LMP</span>
                <span className="text-[9px] font-semibold bg-slate-100 text-slate-800 px-1 py-0.5 rounded">TEXTILE SUITE</span>
              </div>
              <span className="text-[10px] font-bold text-slate-700">TAKA STICKER</span>
            </div>

            {/* Middle Section: Details Left, QR Right */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-7 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-700 uppercase">Roll ID</div>
                <div className="text-lg font-black font-mono tracking-tight text-slate-900 leading-none">
                  {rollId}
                </div>

                <div className="pt-1">
                  <div className="text-[10px] font-bold text-slate-700 uppercase">Fabric</div>
                  <div className="text-xs font-bold truncate text-slate-900">{fabricName}</div>
                  <div className="text-[10px] text-slate-700 font-medium">{qualityGrade}</div>
                </div>

                <div className="pt-1">
                  <div className="text-[10px] font-bold text-slate-700 uppercase">Length</div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                    {Number(roll?.metres || 0).toFixed(2)} <span className="text-xs font-semibold text-slate-700">m</span>
                  </div>
                </div>

                <div className="pt-1 text-[10px] space-y-0.5 text-slate-700">
                  <div><span className="font-bold text-slate-900">Loom:</span> {machineInfo}</div>
                  <div><span className="font-bold text-slate-900">Loc:</span> {locationInfo}</div>
                  <div><span className="font-bold text-slate-900">Date:</span> {prodDate}</div>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="col-span-5 flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <QRCodeSVG
                  value={qrValue}
                  size={110}
                  level="L"
                  includeMargin={false}
                  className="w-full h-auto"
                />
                <span className="text-[8px] font-bold text-slate-700 mt-1 tracking-tight text-center">
                  SCAN ANY PHONE
                </span>
              </div>
            </div>

            {/* Bottom Section: Code128 Barcode */}
            <div className="mt-3 pt-2 border-t-2 border-slate-900 flex flex-col items-center justify-center">
              <canvas ref={barcodeRef} className="max-w-full" />
              <span className="font-mono text-[10px] font-bold tracking-widest text-slate-800 -mt-0.5">
                *{rollId}*
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <span>🖨️</span>
              <span>Print Sticker</span>
            </button>
            <button
              onClick={handleDownloadPng}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <span>💾</span>
              <span>Download PNG</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* Print-specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-roll-label, #printable-roll-label * {
            visibility: visible;
          }
          #printable-roll-label {
            position: fixed;
            left: 0;
            top: 0;
            margin: 0;
            border-width: 1px;
            box-shadow: none;
            width: 100mm;
            height: 70mm;
          }
        }
      `}</style>
    </div>
  );
}
