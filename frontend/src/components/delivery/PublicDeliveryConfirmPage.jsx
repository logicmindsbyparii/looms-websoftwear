import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Truck,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Phone,
  User,
  ArrowRight,
  RefreshCw,
  Camera,
  FileText,
  Lock,
  Building,
  Check,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { fetchPublicDelivery, requestDeliveryOTP, confirmPartyDelivery } from '../../api/deliveryApi';
import { formatMeters, formatDate } from '../../utils/formatters';

export default function PublicDeliveryConfirmPage({ token, onGoToLogin }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryData, setDeliveryData] = useState(null);

  // Form states
  const [receiverName, setReceiverName] = useState('');
  const [receivedMetres, setReceivedMetres] = useState('');
  const [receivedRollCount, setReceivedRollCount] = useState('');
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photos, setPhotos] = useState([]);

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [formError, setFormError] = useState('');

  // Load public delivery data
  const loadDelivery = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPublicDelivery(token);
      setDeliveryData(data);
      // Pre-fill expected quantities
      setReceivedMetres(data.totalMetresDispatched?.toString() || '');
      setReceivedRollCount(data.totalRollsDispatched?.toString() || '1');
      if (data.isAlreadyConfirmed && data.receivedSummary) {
        setConfirmationResult({
          status: data.status,
          dispatchedMetres: data.totalMetresDispatched,
          receivedMetres: data.receivedSummary.actualMetresReceived,
          shortageMetres: data.receivedSummary.shortageMetres,
          receiverName: data.receivedSummary.receiverName,
          confirmedAt: data.receivedSummary.confirmedAt,
          message: 'This delivery has already been verified and completed.'
        });
      }
    } catch (err) {
      setError(err.message || 'Unable to load delivery verification details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDelivery();
    }
  }, [token]);

  // Countdown timer for OTP
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Handle OTP request
  const handleRequestOTP = async () => {
    setFormError('');
    if (!receiverName.trim()) {
      setFormError('Please enter authorized receiver full name first');
      return;
    }
    const enteredMeters = parseFloat(receivedMetres);
    if (isNaN(enteredMeters) || enteredMeters < 0) {
      setFormError('Please enter valid received meters');
      return;
    }

    try {
      setOtpSending(true);
      const res = await requestDeliveryOTP(token);
      setOtpSent(true);
      setOtpCountdown(300); // 5 minutes
      // In development mode, auto-fill mock OTP if provided
      if (res.devMockOtp) {
        setOtp(res.devMockOtp);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to send OTP to registered mobile');
    } finally {
      setOtpSending(false);
    }
  };

  // Handle delivery confirmation submission
  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!otp.trim()) {
      setFormError('Please enter the 6-digit verification OTP');
      return;
    }
    if (!receiverName.trim()) {
      setFormError('Receiver name is required');
      return;
    }

    const damagedRolls = hasDamage && damageDescription.trim()
      ? [{ rollId: 'REPORTED_DAMAGE', metres: 0, damageType: 'Reported by receiver', description: damageDescription.trim() }]
      : [];

    try {
      setConfirming(true);
      const res = await confirmPartyDelivery(token, {
        otp: otp.trim(),
        receiverName: receiverName.trim(),
        receivedMetres: parseFloat(receivedMetres),
        receivedRollCount: parseInt(receivedRollCount, 10) || 1,
        damagedRolls,
        remarks: remarks.trim(),
        photos
      });
      setConfirmationResult(res);
    } catch (err) {
      setFormError(err.message || 'Delivery verification failed');
    } finally {
      setConfirming(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Shortage calculations
  const dispatchedMetres = deliveryData?.totalMetresDispatched || 0;
  const parsedReceivedMetres = parseFloat(receivedMetres) || 0;
  const shortageMetres = Math.max(0, dispatchedMetres - parsedReceivedMetres);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-2xl mb-4 animate-pulse">
          <Truck className="w-8 h-8 text-white" />
        </div>
        <div className="text-xl font-bold font-display tracking-wide">LOOMTRACK TEXTILE VERIFICATION</div>
        <div className="text-xs text-slate-400 font-mono tracking-widest uppercase mt-2 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying Secure Delivery Token...
        </div>
      </div>
    );
  }

  if (error || !deliveryData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-xl text-center">
          <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-sm text-slate-600 mb-6">{error || 'This delivery verification link is no longer valid.'}</p>
          <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded-xl mb-6">
            For security, delivery links expire after 72 hours and can only be used once. Please contact the factory mill office for assistance.
          </div>
          {onGoToLogin && (
            <button
              onClick={onGoToLogin}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition-all"
            >
              Go to Staff Login
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Confirmation Success View ---
  if (confirmationResult) {
    const isDisputed = confirmationResult.status === 'Delivery Disputed' || confirmationResult.status === 'Partially Delivered';
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 flex justify-center">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
          {/* Header Banner */}
          <div className={`p-6 text-white text-center ${isDisputed ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-emerald-600 to-teal-700'}`}>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-black font-display tracking-tight">
              {isDisputed ? 'Delivery Verified with Notes' : 'Delivery Successfully Confirmed!'}
            </h1>
            <p className="text-xs text-white/90 mt-1 font-mono tracking-wider">
              OFFICIAL DIGITAL RECEIPT • OTP VERIFIED
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Certificate Details */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 text-xs">Dispatch ID</span>
                <span className="font-mono font-bold text-slate-900">{deliveryData.dispatchId}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 text-xs">Party / Customer</span>
                <span className="font-bold text-slate-900">{deliveryData.partyName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 text-xs">Fabric</span>
                <span className="font-medium text-slate-800">{deliveryData.fabric}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 text-xs">Dispatched Quantity</span>
                <span className="font-mono text-slate-700">{formatMeters(confirmationResult.dispatchedMetres || deliveryData.totalMetresDispatched)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 text-xs">Actual Received Quantity</span>
                <span className="font-mono font-bold text-emerald-700">{formatMeters(confirmationResult.receivedMetres || parsedReceivedMetres)}</span>
              </div>
              {confirmationResult.shortageMetres > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-rose-600">
                  <span className="text-xs font-bold">Recorded Shortage</span>
                  <span className="font-mono font-bold">-{formatMeters(confirmationResult.shortageMetres)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 text-xs">Receiver Name</span>
                <span className="font-medium text-slate-900">{confirmationResult.receiverName || receiverName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Verification Method</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> SECURE OTP VERIFIED
                </span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-xs text-emerald-900">
              <p className="font-bold">✓ Material Handover Completed</p>
              <p className="text-emerald-700 mt-1">This confirmation is permanently stamped in the factory ledger. The tempo driver is released.</p>
            </div>

            <div className="text-center text-xs text-slate-400 font-mono">
              LOOMTRACK TEXTILE SUITE • LOOMUS 2.0
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Mobile-Friendly Verification Form ---
  return (
    <div className="min-h-screen bg-slate-100/70 py-4 sm:py-8 px-3 sm:px-4 flex justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col">
        {/* Factory Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
                LM
              </div>
              <div>
                <h1 className="text-lg font-black font-display tracking-tight leading-tight">LOOMTRACK</h1>
                <p className="text-[10px] text-sky-400 font-mono tracking-widest uppercase">Mill Delivery Verification</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-300 text-xs font-mono font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{deliveryData.status}</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10 backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300">Dispatch / Challan No:</span>
              <span className="font-mono font-bold text-white text-sm">{deliveryData.dispatchId}</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1.5 pt-1.5 border-t border-white/10">
              <span className="text-slate-300">Party / Receiver:</span>
              <span className="font-bold text-white">{deliveryData.partyName}</span>
            </div>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="bg-amber-50 border-b border-amber-200/80 p-3 sm:p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Fraud Prevention Security Rule:</span> The tempo driver is NOT authorized to confirm delivery. Only you (the receiver) must count rolls, inspect fabric, and enter the OTP sent to your registered mobile number.
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6 flex-1">
          {/* Driver & Tempo Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-slate-600" />
              <span>Tempo & Driver Handover</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Vehicle / Tempo No</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{deliveryData.driver.vehicleNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Driver Name</span>
                <span className="font-bold text-slate-800">{deliveryData.driver.name}</span>
              </div>
            </div>
          </div>

          {/* Dispatched Fabric Summary */}
          <div className="border border-slate-200 rounded-2xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Dispatched Material</span>
                <span className="font-bold text-slate-900 text-base">{deliveryData.fabric}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Dispatched Qty</span>
                <span className="font-mono font-black text-sky-700 text-base">{formatMeters(deliveryData.totalMetresDispatched)}</span>
                <span className="text-[11px] text-slate-500 block">({deliveryData.totalRollsDispatched} Rolls)</span>
              </div>
            </div>

            {/* Roll Breakdown Details (Expandable) */}
            {deliveryData.rolls && deliveryData.rolls.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-600 mb-2">Fabric Rolls in this Shipment:</div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 modern-scrollbar">
                  {deliveryData.rolls.map((r, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-200/60 font-mono">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-indigo-600" />
                        {r.rollId}
                      </span>
                      <span className="text-slate-600">{r.quality}</span>
                      <span className="font-bold text-slate-900">{formatMeters(r.metres)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actual Material Received Input Form */}
          <form onSubmit={handleConfirmDelivery} className="space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Step 1: Enter Actual Received Quantity</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Authorized Receiver Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="e.g. Ramesh Shah (Godown Manager)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Actual Received Metres <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={receivedMetres}
                  onChange={(e) => setReceivedMetres(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Actual Roll Count <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={receivedRollCount}
                  onChange={(e) => setReceivedRollCount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>

            {/* Live Shortage & Quantity Match Badge */}
            <div className="pt-1">
              {shortageMetres > 0.05 ? (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Quantity Shortage Detected: </span>
                    You are confirming <span className="font-mono font-bold">{formatMeters(parsedReceivedMetres)}</span> out of <span className="font-mono font-bold">{formatMeters(dispatchedMetres)}</span> dispatched.
                    <div className="mt-1 font-bold text-rose-900">Missing / Shortage: {formatMeters(shortageMetres)}</div>
                    <div className="text-[11px] text-rose-700 mt-0.5">This shipment will be flagged as "Partially Delivered / Disputed" for mill admin investigation.</div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Quantity Matched ({formatMeters(parsedReceivedMetres)} Received)</span>
                </div>
              )}
            </div>

            {/* Damaged Rolls Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={hasDamage}
                  onChange={(e) => setHasDamage(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <span>Report damaged rolls or fabric defects</span>
              </label>

              {hasDamage && (
                <div className="mt-2 pl-6">
                  <textarea
                    rows={2}
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                    placeholder="Describe roll damage (e.g., Roll #2 torn, oil stains, water damage)..."
                    className="w-full p-2.5 rounded-xl border border-rose-300 text-xs bg-rose-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>

            {/* Receiver Remarks */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Remarks / Delivery Notes (Optional)
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Received at Godown #3"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Photo Attachment (Optional) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Delivery / Material Photos (Optional)
              </label>
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-xl cursor-pointer text-xs text-slate-600 hover:text-sky-700 transition-colors">
                <Camera className="w-4 h-4" />
                <span>Upload Roll Photos or Take Picture</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photos.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {photos.map((p, i) => (
                    <img key={i} src={p} alt="Delivery" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                  ))}
                </div>
              )}
            </div>

            {/* STEP 2: Receiver OTP Verification */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Step 2: Receiver Mobile OTP Verification</span>
              </div>

              {!otpSent ? (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-center space-y-3">
                  <p className="text-xs text-sky-900">
                    A secure 6-digit OTP will be sent to the registered party mobile: <strong className="font-mono">{deliveryData.partyPhoneMasked}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={handleRequestOTP}
                    disabled={otpSending}
                    className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 active:scale-98 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2"
                  >
                    {otpSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4" />
                        <span>Send Verification OTP to Mobile</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">
                      OTP Sent to: <strong className="font-mono text-slate-900">{deliveryData.partyPhoneMasked}</strong>
                    </span>
                    {otpCountdown > 0 ? (
                      <span className="font-mono text-indigo-600 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestOTP}
                        disabled={otpSending}
                        className="text-xs font-bold text-sky-600 hover:text-sky-800 underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Enter 6-Digit Receiver OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full px-4 py-3 rounded-xl border border-indigo-300 text-center text-2xl font-mono font-black tracking-widest text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            {/* Confirm Button */}
            {otpSent && (
              <button
                type="submit"
                disabled={confirming || !otp || otp.length < 6}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {confirming ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Delivery with Mill Ledger...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Verify OTP & Confirm Delivery</span>
                  </>
                )}
              </button>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-400 font-mono">
          LOOMTRACK SECURE DELIVERY VERIFICATION • LOOMUS 2.0
        </div>
      </div>
    </div>
  );
}
