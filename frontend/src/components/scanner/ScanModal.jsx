import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { soundEffects } from '../../utils/soundEffects';

export default function ScanModal({ isOpen, onClose, onScanSuccess }) {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'

  const html5QrCodeRef = useRef(null);
  const isMountedRef = useRef(true);
  const scannerContainerId = 'loomus-qr-reader-container';

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Helper to extract clean roll code from URL, raw text, or ID
  const parseScannedCode = (decodedText) => {
    try {
      if (decodedText.includes('roll=')) {
        const url = new URL(decodedText, window.location.origin);
        return url.searchParams.get('roll') || decodedText;
      }
    } catch (e) {}

    // Extract Roll ID (e.g. TK-2026-000001) from structured text if scanned from full card
    const match = decodedText.match(/TK-\d{4}-\d{4,6}/i);
    if (match) {
      return match[0].toUpperCase();
    }

    return decodedText.trim();
  };

  const triggerSuccessFeedback = (code) => {
    try {
      soundEffects.beep();
    } catch (e) {}
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch (e) {}
    }
  };

  const handleDetectedCode = (decodedText) => {
    const cleanCode = parseScannedCode(decodedText);
    triggerSuccessFeedback(cleanCode);
    stopScanner();
    if (onScanSuccess) {
      onScanSuccess(cleanCode);
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (typeof document === 'undefined') return;
      const container = document.getElementById(scannerContainerId);
      if (!container) return;

      if (html5QrCodeRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode },
        config,
        (decodedText) => {
          handleDetectedCode(decodedText);
        },
        (errorMessage) => {
          // ignore per-frame parse failures
        }
      );

      if (isMountedRef.current) {
        setIsScanning(true);
      }

      // Check torch capability
      try {
        const stream = html5QrCode.getRunningTrackCapabilities();
        if (stream && stream.torch && isMountedRef.current) {
          setHasTorch(true);
        }
      } catch (e) {
        if (isMountedRef.current) setHasTorch(false);
      }
    } catch (err) {
      console.warn('Camera failed to initialize:', err);
      if (isMountedRef.current) {
        setCameraError('Camera access unavailable. You can type or paste the Roll ID below.');
        setIsScanning(false);
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        // scanner stopped
      }
      html5QrCodeRef.current = null;
    }
    if (isMountedRef.current) {
      setIsScanning(false);
      setIsTorchOn(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      const nextTorch = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle not supported:', e);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const cleanCode = parseScannedCode(manualCode);
    triggerSuccessFeedback(cleanCode);
    stopScanner();
    if (onScanSuccess) {
      onScanSuccess(cleanCode);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📷</span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Scan Roll QR / Barcode</h3>
              <p className="text-xs text-slate-700">Camera & Barcode Scanner Gun Ready</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-blue-500 shadow-inner flex items-center justify-center">
            <div id={scannerContainerId} className="w-full h-full object-cover" />

            {/* Viewfinder Target Overlays */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-48 h-48 border-2 border-white/60 rounded-2xl relative shadow-2xl">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-400 -mt-1 -ml-1 rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-400 -mt-1 -mr-1 rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-400 -mb-1 -ml-1 rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-400 -mb-1 -mr-1 rounded-br-sm" />

                {/* Animated scanline */}
                {isScanning && (
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-lg shadow-blue-400/80 animate-bounce absolute top-1/2" />
                )}
              </div>
            </div>

            {/* Fallback Camera Error Banner */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 p-4 flex flex-col items-center justify-center text-center space-y-2 z-10">
                <span className="text-3xl">📷</span>
                <p className="text-xs text-slate-300">{cameraError}</p>
                <button
                  onClick={startScanner}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all mt-2"
                >
                  Retry Camera
                </button>
              </div>
            )}
          </div>

          {/* Quick Camera Controls */}
          <div className="flex items-center space-x-3 mt-4">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
                  isTorchOn
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>💡</span>
                <span>{isTorchOn ? 'Flash On' : 'Flash Off'}</span>
              </button>
            )}

            <button
              onClick={toggleFacingMode}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 flex items-center space-x-1.5 transition-all"
            >
              <span>🔄</span>
              <span>Switch Cam</span>
            </button>
          </div>
        </div>

        {/* Manual Input Fallback */}
        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Or Enter Roll ID Manually
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. TK-2026-000001 or paste QR URL"
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                Lookup
              </button>
            </div>
            <p className="text-[11px] text-slate-700">
              💡 Hardware USB/Bluetooth barcode guns can scan directly anytime.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

