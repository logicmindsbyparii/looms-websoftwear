import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { soundEffects } from '../../utils/soundEffects';
import { useTranslation } from '../../i18n/LanguageContext';

export default function ScanModal({ isOpen, onClose, onScanSuccess }) {
  const { t } = useTranslation();
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const nativeDetectorRef = useRef(null);
  const isDetectedRef = useRef(false);
  const isMountedRef = useRef(true);
  const animFrameRef = useRef(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    isDetectedRef.current = false;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Universal Roll ID parser: extracts Roll ID from any URL, text card, or raw barcode
  const parseScannedCode = (decodedText) => {
    if (!decodedText) return '';
    const text = String(decodedText).trim();
    try {
      if (text.includes('roll=')) {
        const url = new URL(text, window.location.origin);
        const code = url.searchParams.get('roll');
        if (code) return code.trim();
      }
    } catch (e) {}

    // Extract Roll ID (e.g. TK-2026-000001)
    const match = text.match(/TK-\d{4}-\d{3,7}/i);
    if (match) {
      return match[0].toUpperCase();
    }

    // Support any "ROLL: ..." identifier
    const rollMatch = text.match(/ROLL[:\s\-_]+([A-Z0-9\-]+)/i);
    if (rollMatch && rollMatch[1]) {
      return rollMatch[1].trim().toUpperCase();
    }

    return text;
  };

  const triggerSuccessFeedback = () => {
    try {
      soundEffects.beep();
    } catch (e) {}
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([70, 30, 70]);
      } catch (e) {}
    }
  };

  const handleDetectedCode = (decodedText) => {
    if (!decodedText || isDetectedRef.current) return;
    isDetectedRef.current = true;
    const cleanCode = parseScannedCode(decodedText);
    triggerSuccessFeedback();
    stopScanner();
    if (onScanSuccess) {
      onScanSuccess(cleanCode);
    }
  };

  const stopScanner = () => {
    if (animFrameRef.current) {
      if (videoRef.current && 'cancelVideoFrameCallback' in videoRef.current) {
        try {
          videoRef.current.cancelVideoFrameCallback(animFrameRef.current);
        } catch (e) {}
      }
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(animFrameRef.current);
      }
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) {}
    }

    if (isMountedRef.current) {
      setIsScanning(false);
      setIsTorchOn(false);
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    isDetectedRef.current = false;
    frameCountRef.current = 0;

    stopScanner();

    // Check hardware-accelerated BarcodeDetector (GPU/NPU ML detection)
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        nativeDetectorRef.current = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128']
        });
      } catch (e) {
        nativeDetectorRef.current = null;
      }
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not supported in this browser.');
      }

      // Fast, unthrottled camera stream constraints:
      const preferredConstraints = {
        video: {
          facingMode: facingMode === 'environment' ? { ideal: 'environment' } : { ideal: 'user' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 60, min: 30 }
        },
        audio: false
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
      } catch (primaryErr) {
        console.warn('Initial camera constraint negotiation, trying fallback:', primaryErr);
        // Fallback for laptop webcams or restricted devices
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play().catch(() => {});

      if (isMountedRef.current) {
        setIsScanning(true);
      }

      // Hardware capabilities: continuous autofocus and torch detection
      try {
        const track = stream.getVideoTracks()[0];
        if (track) {
          const caps = track.getCapabilities?.() || {};
          if (caps.torch && isMountedRef.current) {
            setHasTorch(true);
          }
          const advanced = [];
          if (caps.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
            advanced.push({ focusMode: 'continuous' });
          }
          if (caps.exposureMode && Array.isArray(caps.exposureMode) && caps.exposureMode.includes('continuous')) {
            advanced.push({ exposureMode: 'continuous' });
          }
          if (advanced.length > 0) {
            await track.applyConstraints({ advanced }).catch(() => {});
          }
        }
      } catch (e) {
        if (isMountedRef.current) setHasTorch(false);
      }

      // 60-120 FPS Direct Hardware Scanner Loop
      const offCanvas = document.createElement('canvas');
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
      offCtx.imageSmoothingEnabled = false;

      const scanLoop = async () => {
        if (isDetectedRef.current || !isMountedRef.current) return;

        try {
          if (video && video.readyState >= 2 && video.videoWidth > 0) {
            frameCountRef.current++;
            const vw = video.videoWidth;
            const vh = video.videoHeight;

            // 1. Hardware BarcodeDetector (instant GPU/NPU scan)
            if (nativeDetectorRef.current) {
              try {
                const barcodes = await nativeDetectorRef.current.detect(video);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  handleDetectedCode(barcodes[0].rawValue);
                  return;
                }
              } catch (e) {}
            }

            // 2. High-speed jsQR on full sensor frame (1-2ms per frame)
            const maxDim = 640;
            let targetW = vw;
            let targetH = vh;
            if (targetW > maxDim || targetH > maxDim) {
              const ratio = Math.min(maxDim / targetW, maxDim / targetH);
              targetW = Math.round(targetW * ratio);
              targetH = Math.round(targetH * ratio);
            }

            if (offCanvas.width !== targetW || offCanvas.height !== targetH) {
              offCanvas.width = targetW;
              offCanvas.height = targetH;
              offCtx.imageSmoothingEnabled = false;
            }

            offCtx.drawImage(video, 0, 0, targetW, targetH);
            const imgData = offCtx.getImageData(0, 0, targetW, targetH);

            // Instant unthrottled decode
            const inversion = frameCountRef.current % 6 === 0 ? 'attemptBoth' : 'dontInvert';
            const qrResult = jsQR(imgData.data, targetW, targetH, {
              inversionAttempts: inversion
            });

            if (qrResult && qrResult.data) {
              handleDetectedCode(qrResult.data);
              return;
            }
          }
        } catch (err) {
          // ignore frame scan glitch
        }

        if (isMountedRef.current && !isDetectedRef.current) {
          if ('requestVideoFrameCallback' in video) {
            animFrameRef.current = video.requestVideoFrameCallback(scanLoop);
          } else {
            animFrameRef.current = requestAnimationFrame(scanLoop);
          }
        }
      };

      if ('requestVideoFrameCallback' in video) {
        animFrameRef.current = video.requestVideoFrameCallback(scanLoop);
      } else {
        animFrameRef.current = requestAnimationFrame(scanLoop);
      }
    } catch (err) {
      console.warn('Camera failed to start:', err);
      if (isMountedRef.current) {
        setCameraError('Camera access unavailable. You can type or paste the Roll ID below.');
        setIsScanning(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 20);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !isTorchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle not supported:', e);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const cleanCode = parseScannedCode(manualCode);
    triggerSuccessFeedback();
    stopScanner();
    if (onScanSuccess) {
      onScanSuccess(cleanCode);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">⚡</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900">{t('scanner.title')}</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                  {t('scanner.badge')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{t('scanner.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[340px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-sky-500 shadow-xl flex items-center justify-center">
            {/* Native Hardware Video Element */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />

            {/* Viewfinder Target Overlays */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-64 border border-white/30 rounded-2xl relative shadow-2xl">
                {/* Glowing Corner markers */}
                <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-sky-400 -mt-1 -ml-1 rounded-tl-lg shadow-sm" />
                <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-sky-400 -mt-1 -mr-1 rounded-tr-lg shadow-sm" />
                <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-sky-400 -mb-1 -ml-1 rounded-bl-lg shadow-sm" />
                <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-sky-400 -mb-1 -mr-1 rounded-br-lg shadow-sm" />

                {/* Animated high-speed laser line */}
                {isScanning && (
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-lg shadow-sky-400/90 animate-pulse absolute top-1/2 -translate-y-1/2" />
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
                  className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-all mt-2 cursor-pointer"
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-all cursor-pointer ${
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
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 flex items-center space-x-1.5 transition-all cursor-pointer"
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
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
              >
                Lookup
              </button>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              💡 Hardware USB/Bluetooth barcode guns can scan directly anytime.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
