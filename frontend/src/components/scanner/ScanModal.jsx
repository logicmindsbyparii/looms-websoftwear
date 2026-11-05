import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import jsQR from 'jsqr';
import { soundEffects } from '../../utils/soundEffects';

export default function ScanModal({ isOpen, onClose, onScanSuccess }) {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  const html5QrCodeRef = useRef(null);
  const nativeDetectorRef = useRef(null);
  const isDetectedRef = useRef(false);
  const isMountedRef = useRef(true);
  const isStartingRef = useRef(false);
  const animFrameRef = useRef(null);
  const videoElemRef = useRef(null);
  const scannerContainerId = 'loomus-qr-reader-container';

  useEffect(() => {
    isMountedRef.current = true;
    isDetectedRef.current = false;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Helper to extract clean roll code from URL, raw text, or ID
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

    // Extract Roll ID (e.g. TK-2026-000001) from structured multi-line card text
    const match = text.match(/TK-\d{4}-\d{4,6}/i);
    if (match) {
      return match[0].toUpperCase();
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

  const startScanner = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError(null);
    isDetectedRef.current = false;

    try {
      if (typeof document === 'undefined') return;
      const container = document.getElementById(scannerContainerId);
      if (!container) return;

      // Stop any existing instance cleanly
      await stopScanner();
      container.innerHTML = '';

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

      // Restrict strictly to QR_CODE and CODE_128 for maximum frame-rate decoding
      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128
        ],
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      });
      html5QrCodeRef.current = html5QrCode;

      // Full-sensor high-speed scan configuration:
      const scanConfig = {
        fps: 30,
        disableFlip: true,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          return { width: minEdge, height: minEdge };
        }
      };

      // 1. Discover available camera hardware
      let devices = availableCameras;
      if (!devices || devices.length === 0) {
        try {
          const fetchedDevices = await Html5Qrcode.getCameras();
          if (fetchedDevices && fetchedDevices.length > 0) {
            devices = fetchedDevices;
            if (isMountedRef.current) {
              setAvailableCameras(fetchedDevices);
            }
          }
        } catch (camErr) {
          console.warn('Camera enumeration note:', camErr);
        }
      }

      // 2. Select initial target camera with smart back/front resolution
      let primaryTarget;
      let secondaryFallback;

      if (devices && devices.length > 0) {
        const backCam = devices.find((d) => /back|rear|environment|outward|main/i.test(d.label));
        const frontCam = devices.find((d) => /front|user|face/i.test(d.label));

        if (facingMode === 'environment' && backCam) {
          primaryTarget = backCam.id;
          secondaryFallback = frontCam ? frontCam.id : devices[0].id;
        } else if (facingMode === 'user' && frontCam) {
          primaryTarget = frontCam.id;
          secondaryFallback = backCam ? backCam.id : devices[0].id;
        } else {
          const validIdx = currentCameraIndex % devices.length;
          primaryTarget = devices[validIdx].id;
          secondaryFallback = devices[(validIdx + 1) % devices.length]?.id || { facingMode: 'user' };
        }
      } else {
        primaryTarget = { facingMode };
        secondaryFallback = { facingMode: facingMode === 'environment' ? 'user' : 'environment' };
      }

      // 3. Start camera stream with fallback resilience
      try {
        await html5QrCode.start(
          primaryTarget,
          scanConfig,
          (decodedText) => handleDetectedCode(decodedText),
          () => {} // Frame scan miss - ignore
        );
      } catch (firstErr) {
        console.warn('Initial camera config rejected, attempting fallback:', firstErr);
        await html5QrCode.start(
          secondaryFallback,
          scanConfig,
          (decodedText) => handleDetectedCode(decodedText),
          () => {}
        );
      }

      if (isMountedRef.current) {
        setIsScanning(true);
      }

      // 4. Ultra-responsive 60 FPS Direct Frame Scanning via Hardware BarcodeDetector + jsQR
      const videoElem = container.querySelector('video');
      if (videoElem) {
        videoElemRef.current = videoElem;
        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

        const scanFrameLoop = async () => {
          if (isDetectedRef.current || !isMountedRef.current) return;

          try {
            if (videoElem.readyState >= 2 && videoElem.videoWidth > 0) {
              // Engine 1: Native hardware BarcodeDetector (instant GPU/NPU detection)
              if (nativeDetectorRef.current) {
                try {
                  const barcodes = await nativeDetectorRef.current.detect(videoElem);
                  if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                    handleDetectedCode(barcodes[0].rawValue);
                    return;
                  }
                } catch (e) {}
              }

              // Engine 2: Ultra-sensitive jsQR on 100% full camera sensor frame
              const vw = videoElem.videoWidth;
              const vh = videoElem.videoHeight;
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
              }

              offCtx.drawImage(videoElem, 0, 0, targetW, targetH);
              const imgData = offCtx.getImageData(0, 0, targetW, targetH);
              const qrResult = jsQR(imgData.data, targetW, targetH, {
                inversionAttempts: 'attemptBoth'
              });

              if (qrResult && qrResult.data) {
                handleDetectedCode(qrResult.data);
                return;
              }
            }
          } catch (loopErr) {
            // Ignore temporary frame decoding error, continue loop
          }

          if (isMountedRef.current && !isDetectedRef.current) {
            if ('requestVideoFrameCallback' in videoElem) {
              animFrameRef.current = videoElem.requestVideoFrameCallback(scanFrameLoop);
            } else {
              animFrameRef.current = requestAnimationFrame(scanFrameLoop);
            }
          }
        };

        if ('requestVideoFrameCallback' in videoElem) {
          animFrameRef.current = videoElem.requestVideoFrameCallback(scanFrameLoop);
        } else {
          animFrameRef.current = requestAnimationFrame(scanFrameLoop);
        }
      }

      // 5. Check hardware capabilities for continuous autofocus and torch
      try {
        const stream = html5QrCode.getRunningTrackCapabilities?.() || html5QrCode.getRunningTrackCameraCapabilities?.();
        if (stream && isMountedRef.current) {
          if (stream.torch) {
            setHasTorch(true);
          }
          const advanced = [];
          if (stream.focusMode && Array.isArray(stream.focusMode) && stream.focusMode.includes('continuous')) {
            advanced.push({ focusMode: 'continuous' });
          }
          if (advanced.length > 0) {
            await html5QrCode.applyVideoConstraints({ advanced });
          }
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
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (animFrameRef.current) {
      if (videoElemRef.current && 'cancelVideoFrameCallback' in videoElemRef.current) {
        try {
          videoElemRef.current.cancelVideoFrameCallback(animFrameRef.current);
        } catch (e) {}
      }
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(animFrameRef.current);
      }
      animFrameRef.current = null;
    }
    videoElemRef.current = null;

    if (html5QrCodeRef.current) {
      const qrCode = html5QrCodeRef.current;
      html5QrCodeRef.current = null;
      try {
        if (qrCode.isScanning) {
          await qrCode.stop();
        }
        await qrCode.clear();
      } catch (e) {
        // gracefully ignore stop race
      }
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
      }, 50);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, currentCameraIndex, facingMode]);

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
    if (availableCameras && availableCameras.length > 1) {
      setCurrentCameraIndex((prev) => (prev + 1) % availableCameras.length);
    } else {
      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    }
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
                <h3 className="text-sm font-bold text-slate-900">Instant QR & Barcode Scanner</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                  Lightning Fast
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Instant scan on point</p>
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
            <div id={scannerContainerId} className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

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
