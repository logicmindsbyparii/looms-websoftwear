import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { formatDate } from '../../utils/formatters';
import { WhatsAppBrandIcon } from '../common/WhatsAppIcon';
import { openWhatsApp } from '../../utils/whatsapp';
import CustomSelect from '../common/CustomSelect';
import {
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings,
  Users,
  MessageSquare,
  Bot,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  Cpu,
  Search,
  Copy,
  Check,
  ChevronRight,
  Eye,
  Sliders,
  Bell,
  Sparkles,
  Info
} from 'lucide-react';

const REPORT_DEFINITIONS = [
  { key: 'daily_production', name: 'Daily Production Report', freq: 'daily', time: '19:30', desc: 'Total metres, target progress, average RPM and shift splits across all units.' },
  { key: 'shift_production', name: 'Shift-wise Production Report', freq: 'shift', time: '14:00', desc: 'End-of-shift output breakdown, operator tallies, and target achievement.' },
  { key: 'loom_status', name: 'Loom Running/Stopped Report', freq: 'daily', time: '09:00', desc: 'Real-time active running vs stopped machine roster with outage reasons.' },
  { key: 'loom_efficiency', name: 'Loom Efficiency Report', freq: 'daily', time: '18:00', desc: 'Overall mill efficiency %, top performing units, and lowest efficiency warnings.' },
  { key: 'yarn_consumption', name: 'Yarn Consumption Report', freq: 'daily', time: '20:00', desc: 'Warp and weft yarn consumed (kg), current balance, and depleted lots.' },
  { key: 'fabric_quality', name: 'Fabric Quality Report', freq: 'daily', time: '17:30', desc: 'A-Grade export percentage, major defects logged, and rejection statistics.' },
  { key: 'worker_attendance', name: 'Worker Attendance Report', freq: 'daily', time: '09:30', desc: 'Present/absent worker count by shift, assigned sheds, and shortage notices.' },
  { key: 'maintenance', name: 'Maintenance Report', freq: 'daily', time: '10:00', desc: 'Preventive maintenance calendar, overdue units, and scheduled servicing.' },
  { key: 'low_stock', name: 'Inventory Low Stock Alerts', freq: 'daily', time: '08:30', desc: 'Yarn and spare parts at or below safety reorder threshold.' },
  { key: 'order_completion', name: 'Order Completion Report', freq: 'daily', time: '16:00', desc: 'In-production client sales orders, delivered roll metres, and target deadlines.' },
  { key: 'daily_factory_summary', name: 'Daily Factory Summary', freq: 'daily', time: '21:00', desc: 'Holistic executive snapshot covering output, health, power, and pending alerts.' }
];

const ALERT_DEFINITIONS = [
  { key: 'loom_stopped', name: 'Loom Stopped Unexpectedly', desc: 'Triggered when an active running machine transitions into stopped status during a shift.' },
  { key: 'low_production', name: 'Low Production Target Warning', desc: 'Triggered when shift or daily production falls below the configured target threshold.' },
  { key: 'yarn_min_stock', name: 'Yarn Minimum Stock Warning', desc: 'Triggered when warp or weft yarn stock drops below the safety reorder level.' },
  { key: 'maintenance_due', name: 'Machine Maintenance Due', desc: 'Triggered when a loom reaches preventive service hour interval or scheduled date.' },
  { key: 'quality_rejection_high', name: 'Fabric Quality Rejection High', desc: 'Triggered when B-grade or rejection rate exceeds the configured quality threshold.' },
  { key: 'order_delayed', name: 'Order Delayed / Behind Schedule', desc: 'Triggered when sales order delivery date is imminent and output is behind target.' },
  { key: 'critical_alarm', name: 'Critical Machine Alarm Triggered', desc: 'Triggered instantly when an emergency stop, warp breakage, or motor overload occurs.' },
  { key: 'shift_change', name: 'Shift Transition Summary', desc: 'Triggered upon shift handovers with automated status handover details.' }
];

export default function WhatsAppReportsView() {
  const { showToast, userRole } = useApp();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('overview'); // overview, schedules, alerts, recipients, logs, ai_chat, config
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  // Data states
  const [config, setConfig] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [logFilter, setLogFilter] = useState('all');

  // Recipient Modal State
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [recipientForm, setRecipientForm] = useState({
    name: '',
    phone: '',
    role: 'Supervisor',
    isActive: true,
    subscribedReports: ['daily_production', 'daily_factory_summary'],
    subscribedAlerts: ['loom_stopped', 'critical_alarm']
  });

  // Manual Dispatch State
  const [dispatchingReport, setDispatchingReport] = useState(null);

  // AI Assistant Playground State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am LOOMUS WhatsApp AI. You can ask me in English, Hindi, or Gujarati about today\'s production, stopped looms, efficiency, yarn consumption, and orders.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Meta Credentials Form State
  const [metaForm, setMetaForm] = useState({
    apiToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    webhookVerifyToken: 'loomus_webhook_verify_token_secure_2026',
    apiVersion: 'v21.0',
    isEnabled: true
  });
  const [showToken, setShowToken] = useState(false);

  // Fetch all initial data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, recipientsRes, logsRes, analyticsRes] = await Promise.all([
        api.get('/whatsapp/config'),
        api.get('/whatsapp/recipients'),
        api.get('/whatsapp/logs?limit=50'),
        api.get('/whatsapp/analytics')
      ]);

      if (configRes?.data) {
        setConfig(configRes.data);
        setMetaForm({
          apiToken: '',
          phoneNumberId: configRes.data.phoneNumberId || '',
          businessAccountId: configRes.data.businessAccountId || '',
          webhookVerifyToken: configRes.data.webhookVerifyToken || 'loomus_webhook_verify_token_secure_2026',
          apiVersion: configRes.data.apiVersion || 'v21.0',
          isEnabled: configRes.data.isEnabled ?? true
        });
      }

      setRecipients(recipientsRes?.data || []);
      setLogs(logsRes?.data || []);
      setAnalytics(analyticsRes?.data || null);
    } catch (err) {
      showToast(err.message || 'Failed to load WhatsApp configuration', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Copy helper
  const handleCopy = (text, key) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopiedKey(''), 2500);
    }
  };

  // Save Meta Configuration
  const handleSaveConfig = async (e) => {
    e?.preventDefault();
    setSavingConfig(true);
    try {
      const payload = {
        phoneNumberId: metaForm.phoneNumberId,
        businessAccountId: metaForm.businessAccountId,
        webhookVerifyToken: metaForm.webhookVerifyToken,
        apiVersion: metaForm.apiVersion,
        isEnabled: metaForm.isEnabled
      };
      if (metaForm.apiToken.trim()) {
        payload.apiToken = metaForm.apiToken.trim();
      }

      const res = await api.put('/whatsapp/config', payload);
      setConfig(res.data);
      showToast('WhatsApp Business API settings saved successfully!', 'success');
      setMetaForm((prev) => ({ ...prev, apiToken: '' }));
    } catch (err) {
      showToast(err.message || 'Failed to save configuration', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  // Send Test Message
  const handleSendTestMessage = async (customPhone = null) => {
    setSendingTest(true);
    try {
      const payload = customPhone ? { phone: customPhone } : {};
      const res = await api.post('/whatsapp/test', payload);
      showToast(res.message || 'Test message dispatched!', 'success');

      // Always launch WhatsApp directly on laptop so user can send immediately
      const textToOpen = res?.text || res?.data?.text || res?.data?.log?.messageBody;
      if (textToOpen) {
        openWhatsApp({
          phone: customPhone || '+91 96646 83069',
          message: textToOpen
        });
      }

      // Refresh logs
      const updatedLogs = await api.get('/whatsapp/logs?limit=50');
      setLogs(updatedLogs.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to send test message', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  // Manually Dispatch a Report
  const handleManualDispatch = async (reportType, openDirect = false) => {
    setDispatchingReport(reportType);
    try {
      const res = await api.post(`/whatsapp/reports/${reportType}/send`);
      showToast(res.message || 'Report generated!', 'success');

      // If user clicked direct open OR Meta credentials are not live, open WhatsApp directly
      if (openDirect || !res.isLiveConfigured) {
        if (res.reportContent) {
          openWhatsApp({
            phone: res.targetPhone || '+91 96646 83069',
            message: res.reportContent
          });
        }
      }

      const updatedLogs = await api.get('/whatsapp/logs?limit=50');
      setLogs(updatedLogs.data || []);
      const updatedAnalytics = await api.get('/whatsapp/analytics');
      setAnalytics(updatedAnalytics.data || null);
    } catch (err) {
      showToast(err.message || 'Failed to send report', 'error');
    } finally {
      setDispatchingReport(null);
    }
  };

  // Retry Failed Message
  const handleRetryMessage = async (logId) => {
    try {
      const res = await api.post(`/whatsapp/logs/${logId}/retry`);
      showToast(res.message || 'Message retry initiated!', 'success');
      const updatedLogs = await api.get('/whatsapp/logs?limit=50');
      setLogs(updatedLogs.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to retry message', 'error');
    }
  };

  // AI Assistant Query Handler
  const handleSendAiQuery = async (queryText) => {
    const q = (queryText || aiQuestion).trim();
    if (!q || aiLoading) return;

    const userMsg = {
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAiChatHistory((prev) => [...prev, userMsg]);
    setAiQuestion('');
    setAiLoading(true);

    try {
      const res = await api.post('/whatsapp/ai/query', { query: q });
      const reply = res?.data?.reply || 'No response generated.';
      setAiChatHistory((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setAiChatHistory((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ Error fetching live data: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Save Recipient
  const handleSaveRecipient = async (e) => {
    e.preventDefault();
    try {
      if (editingRecipient) {
        await api.put(`/whatsapp/recipients/${editingRecipient._id || editingRecipient.id}`, recipientForm);
        showToast('Recipient updated successfully', 'success');
      } else {
        await api.post('/whatsapp/recipients', recipientForm);
        showToast('Recipient added successfully', 'success');
      }
      setIsRecipientModalOpen(false);
      setEditingRecipient(null);
      const res = await api.get('/whatsapp/recipients');
      setRecipients(res.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to save recipient', 'error');
    }
  };

  // Delete Recipient
  const handleDeleteRecipient = async (id) => {
    if (!window.confirm('Are you sure you want to remove this WhatsApp recipient?')) return;
    try {
      await api.delete(`/whatsapp/recipients/${id}`);
      showToast('Recipient removed', 'success');
      setRecipients((prev) => prev.filter((r) => (r._id || r.id) !== id));
    } catch (err) {
      showToast(err.message || 'Failed to delete recipient', 'error');
    }
  };

  // Toggle Report Schedule Config
  const handleToggleSchedule = async (reportKey, enabled) => {
    try {
      const currentSchedules = config?.reportSchedules || {};
      const updatedSchedules = {
        ...currentSchedules,
        [reportKey]: {
          ...(currentSchedules[reportKey] || {}),
          enabled
        }
      };
      const res = await api.put('/whatsapp/config', { reportSchedules: updatedSchedules });
      setConfig(res.data);
      showToast(`Schedule for ${reportKey.replace(/_/g, ' ')} ${enabled ? 'enabled' : 'disabled'}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update schedule', 'error');
    }
  };

  // Change Schedule Time
  const handleChangeScheduleTime = async (reportKey, time) => {
    try {
      const currentSchedules = config?.reportSchedules || {};
      const updatedSchedules = {
        ...currentSchedules,
        [reportKey]: {
          ...(currentSchedules[reportKey] || {}),
          time
        }
      };
      const res = await api.put('/whatsapp/config', { reportSchedules: updatedSchedules });
      setConfig(res.data);
      showToast(`Schedule time set to ${time} IST`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update time', 'error');
    }
  };

  // Toggle Alert Rule
  const handleToggleAlertRule = async (alertKey, enabled) => {
    try {
      const currentAlerts = config?.alertRules || {};
      const updatedAlerts = {
        ...currentAlerts,
        [alertKey]: {
          ...(currentAlerts[alertKey] || {}),
          enabled
        }
      };
      const res = await api.put('/whatsapp/config', { alertRules: updatedAlerts });
      setConfig(res.data);
      showToast(`Alert "${alertKey.replace(/_/g, ' ')}" ${enabled ? 'activated' : 'muted'}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update alert rule', 'error');
    }
  };

  // Filtered Logs
  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'all') return true;
    if (logFilter === 'failed') return l.status === 'failed';
    if (logFilter === 'delivered') return l.status === 'delivered' || l.status === 'read';
    if (logFilter === 'report') return l.messageType === 'report';
    if (logFilter === 'alert') return l.messageType === 'alert';
    if (logFilter === 'ai') return l.messageType === 'ai_assistant';
    return true;
  });

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : 'https://your-domain.com/api/whatsapp/webhook';

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading WhatsApp AI Reports Hub...</p>
        </div>
      </div>
    );
  }

  const isLiveConnected = Boolean(config?.isLiveConfigured);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center p-3 shrink-0 shadow-inner">
            <WhatsAppBrandIcon className="w-8 h-8 fill-emerald-600 dark:fill-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                WhatsApp AI Reports & Smart Alerts
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isLiveConnected
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isLiveConnected ? 'Meta Cloud API Live' : 'Active (Simulation / Audit Mode)'}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Automated production broadcasts, intelligent mill Q&A in English/Hindi/Gujarati, and instant stoppage alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleSendTestMessage()}
            disabled={sendingTest}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-sm shadow-emerald-600/30 disabled:opacity-50"
          >
            {sendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Test Alert
          </button>
          <button
            onClick={loadAllData}
            title="Refresh logs & stats"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'overview', label: 'Overview & Dispatch', icon: Activity },
          { id: 'schedules', label: 'Report Schedules (11)', icon: Clock },
          { id: 'alerts', label: 'Smart Alert Rules (8)', icon: Bell },
          { id: 'recipients', label: `Recipients (${recipients.length})`, icon: Users },
          { id: 'logs', label: `History Logs (${logs.length})`, icon: MessageSquare },
          { id: 'ai_chat', label: 'Multilingual AI Assistant', icon: Bot },
          { id: 'config', label: 'Meta API Credentials', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap border-b-2 -mb-[2px] ${
                isActive
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & MANUAL DISPATCH */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Simulation Mode Notice Banner */}
          {!isLiveConnected && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200">
                  <div className="font-bold text-sm">Meta Cloud API Not Configured (Running in Simulation Mode)</div>
                  <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                    Background automated messages are being simulated and logged to the database. To receive messages automatically on mobile via Meta, enter your <strong>Phone Number ID</strong> and <strong>Access Token</strong> in the <em>Meta API Credentials</em> tab. You can also click <strong>&quot;Open WhatsApp&quot;</strong> below to send directly via WhatsApp Web/App right now!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('config')}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
              >
                Configure Meta API
              </button>
            </div>
          )}

          {/* Analytics Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Total Dispatched</span>
                <MessageSquare className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {analytics?.total || logs.length || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Across all mill shifts</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Delivered / Read</span>
                <CheckCircle className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {(analytics?.delivered || 0) + (analytics?.read || 0) + (analytics?.sent || 0)}
              </div>
              <p className="text-xs text-teal-600/80 mt-1">{analytics?.deliverySuccessRate || '100'}% success rate</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Failed Messages</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {analytics?.failed || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Retry available in logs</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Active Recipients</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {recipients.filter((r) => r.isActive).length}
              </div>
              <p className="text-xs text-slate-400 mt-1">Configured for broadcasts</p>
            </div>
          </div>

          {/* Quick Manual Dispatch Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  Instant Manual Dispatch (Real Database Query)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate and send an instant live report right now to all subscribed recipients on WhatsApp.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {REPORT_DEFINITIONS.map((rep) => {
                const isBusy = dispatchingReport === rep.key;
                return (
                  <div
                    key={rep.key}
                    className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                          {rep.name}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {rep.freq}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {rep.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" /> {rep.time} IST
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleManualDispatch(rep.key, true)}
                          disabled={isBusy}
                          title="Open directly in WhatsApp Web or Mobile App"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
                        >
                          <WhatsAppBrandIcon className="w-3.5 h-3.5 fill-white" />
                          Open WhatsApp
                        </button>
                        <button
                          onClick={() => handleManualDispatch(rep.key, false)}
                          disabled={isBusy}
                          title="Trigger automated Cloud API dispatch"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all disabled:opacity-50"
                        >
                          {isBusy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 text-emerald-600" />}
                          Cloud
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPORT SCHEDULES (ALL 11 REPORTS) */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                <span className="font-bold">Automated Background Engine:</span> All reports run automatically on the LOOMUS backend scheduler aligned to the <code className="bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded font-mono">Asia/Kolkata (IST)</code> timezone. Duplicate transmissions are automatically blocked within a 60-second window.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REPORT_DEFINITIONS.map((rep) => {
              const currentSchedule = config?.reportSchedules?.[rep.key] || {
                enabled: true,
                time: rep.time,
                frequency: rep.freq,
                targetRoles: ['Admin', 'Supervisor']
              };
              const isEnabled = currentSchedule.enabled !== false;

              return (
                <div
                  key={rep.key}
                  className={`p-4 rounded-2xl border transition-all ${
                    isEnabled
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/50 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {rep.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {rep.desc}
                      </p>
                    </div>

                    {/* Enable Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => handleToggleSchedule(rep.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Scheduled Time (IST)
                      </label>
                      <input
                        type="time"
                        value={currentSchedule.time || rep.time}
                        onChange={(e) => handleChangeScheduleTime(rep.key, e.target.value)}
                        disabled={!isEnabled}
                        className="w-full text-xs font-mono font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="flex justify-end gap-1.5 pt-4">
                      <button
                        onClick={() => handleManualDispatch(rep.key, true)}
                        disabled={dispatchingReport === rep.key}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs"
                      >
                        <WhatsAppBrandIcon className="w-3.5 h-3.5 fill-white" />
                        Send WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SMART ALERT RULES (8 ALERTS) */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-emerald-600" />
              Real-Time Automated Mill Thresholds & Alarms
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Instant alerts are triggered upon database event hooks (e.g. machine stop, critical alarm, low yarn stock) and delivered via WhatsApp.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ALERT_DEFINITIONS.map((alert) => {
                const currentAlert = config?.alertRules?.[alert.key] || {
                  enabled: true,
                  cooldownMinutes: 15,
                  targetRoles: ['Admin', 'Supervisor']
                };
                const isEnabled = currentAlert.enabled !== false;

                return (
                  <div
                    key={alert.key}
                    className={`p-4 rounded-xl border transition-all ${
                      isEnabled
                        ? 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                        : 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {alert.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {alert.desc}
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => handleToggleAlertRule(alert.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                        Cooldown: {currentAlert.cooldownMinutes || 15} mins anti-spam
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        Roles: Admin, Supervisor
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RECIPIENT DIRECTORY */}
      {activeTab === 'recipients' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Authorized WhatsApp Recipients
              </h2>
              <p className="text-xs text-slate-500">
                Staff numbers authorized to receive automated reports and smart alarms.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRecipient(null);
                setRecipientForm({
                  name: '',
                  phone: '',
                  role: 'Supervisor',
                  isActive: true,
                  subscribedReports: ['daily_production', 'daily_factory_summary'],
                  subscribedAlerts: ['loom_stopped', 'critical_alarm']
                });
                setIsRecipientModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Recipient
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Phone Number (E.164)</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Subscribed Reports</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recipients.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400">
                        No WhatsApp recipients registered yet. Click &quot;Add Recipient&quot; to configure your first number.
                      </td>
                    </tr>
                  ) : (
                    recipients.map((rec) => {
                      const id = rec._id || rec.id;
                      return (
                        <tr key={id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                            {rec.name}
                          </td>
                          <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            +{rec.phone}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {rec.role}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500">
                            {rec.subscribedReports?.length || 0} reports, {rec.subscribedAlerts?.length || 0} alerts
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.isActive
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {rec.isActive ? 'Active' : 'Muted'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleSendTestMessage(rec.phone)}
                              title="Send test message to this phone"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingRecipient(rec);
                                setRecipientForm({
                                  name: rec.name,
                                  phone: rec.phone,
                                  role: rec.role,
                                  isActive: rec.isActive,
                                  subscribedReports: rec.subscribedReports || [],
                                  subscribedAlerts: rec.subscribedAlerts || []
                                });
                                setIsRecipientModalOpen(true);
                              }}
                              title="Edit recipient"
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecipient(id)}
                              title="Delete recipient"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MESSAGE DELIVERY HISTORY & LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Message Delivery Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Official delivery receipts, read statuses, and retry options.
              </p>
            </div>

            {/* Log filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['all', 'failed', 'delivered', 'report', 'alert', 'ai'].map((f) => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                    logFilter === f
                      ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Recipient</th>
                    <th className="p-3.5">Report / Alert Title</th>
                    <th className="p-3.5">Delivery Status</th>
                    <th className="p-3.5">Details</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        No WhatsApp logs matching this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const id = log._id || log.id;
                      return (
                        <tr key={id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                            <span className="text-[10px] text-slate-400">({new Date(log.createdAt).toLocaleDateString()})</span>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {log.messageType}
                            </span>
                          </td>
                          <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                            {log.recipientName ? `${log.recipientName} ` : ''}
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">+{log.recipientPhone}</span>
                          </td>
                          <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                            {log.title}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                log.status === 'read'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : log.status === 'delivered'
                                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                                  : log.status === 'sent'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500 max-w-[200px] truncate" title={log.errorDescription || log.messageBody}>
                            {log.errorDescription ? (
                              <span className="text-rose-600 font-mono text-[11px]">{log.errorDescription}</span>
                            ) : (
                              log.messageBody?.slice(0, 50) + '...'
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            {log.status === 'failed' && (
                              <button
                                onClick={() => handleRetryMessage(id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-semibold transition-colors"
                              >
                                <RefreshCw className="w-3 h-3" /> Retry
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MULTILINGUAL AI ASSISTANT PLAYGROUND */}
      {activeTab === 'ai_chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Container */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-[580px] shadow-sm overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">LOOMUS AI WhatsApp Assistant</h3>
                  <p className="text-[11px] text-emerald-100">Live DB Connected • English • हिन्दी • ગુજરાતી</p>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
              {aiChatHistory.map((msg, idx) => {
                const isMe = msg.sender === 'user';
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none whitespace-pre-wrap font-sans'
                      }`}
                    >
                      {msg.text}
                      <div className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {msg.time}
                      </div>
                    </div>
                  </div>
                );
              })}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs flex items-center gap-2 text-slate-500">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    Querying LOOMUS database in real time...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask in English, Hindi, or Gujarati (e.g. 'Aaj kitna production hua?')..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiQuery()}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => handleSendAiQuery()}
                disabled={aiLoading || !aiQuestion.trim()}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts & Specs Card */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                1-Click Test Prompts
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">
                Click any of the questions below to test how the assistant executes live database lookups:
              </p>

              <div className="space-y-2">
                {[
                  { text: 'Aaj kitna production hua?', lang: 'Hindi / Hinglish' },
                  { text: 'Kitne loom currently band hain?', lang: 'Hindi / Hinglish' },
                  { text: 'Which loom has the lowest efficiency?', lang: 'English' },
                  { text: 'aaje ketlu utpadan thayu?', lang: 'Gujarati (Transliterated)' },
                  { text: 'ketla loom bandh che?', lang: 'Gujarati (Transliterated)' },
                  { text: 'Show today\'s production report', lang: 'English' },
                  { text: 'Which orders are pending?', lang: 'English' }
                ].map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendAiQuery(p.text)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/30 transition-all text-xs"
                  >
                    <div className="font-medium text-slate-800 dark:text-slate-200">{p.text}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{p.lang}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                <Shield className="w-4 h-4 text-emerald-600" />
                Security & Data Integrity Guard
              </div>
              <p className="text-[11px] leading-relaxed">
                The LOOMUS AI Assistant is strictly wired to production MongoDB collections. It never hallucinates fictitious production metres or fake machine statuses, and rejects prompt injection tampering automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: META API CREDENTIALS & WEBHOOK SETUP */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-600" />
                Meta WhatsApp Business Cloud API Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Direct integration with official Meta Graph API v21.0. No unauthorized third-party scraping libraries are used.
              </p>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Phone Number ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 104859385920194"
                  value={metaForm.phoneNumberId}
                  onChange={(e) => setMetaForm({ ...metaForm, phoneNumberId: e.target.value })}
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Found in Meta for Developers &gt; WhatsApp &gt; API Setup &gt; Phone number ID.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Business Account ID (WABA ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 109283746501928"
                  value={metaForm.businessAccountId}
                  onChange={(e) => setMetaForm({ ...metaForm, businessAccountId: e.target.value })}
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    System User Permanent Access Token
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-[11px] text-emerald-600 hover:underline"
                  >
                    {showToken ? 'Hide Token' : 'Show Token'}
                  </button>
                </div>
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder={config?.apiTokenMasked ? `Currently set: ${config.apiTokenMasked} (Enter new to overwrite)` : 'EAABw...'}
                  value={metaForm.apiToken}
                  onChange={(e) => setMetaForm({ ...metaForm, apiToken: e.target.value })}
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Stored securely in the backend. Never exposed to unauthorized client sessions.</p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={metaForm.isEnabled}
                      onChange={(e) => setMetaForm({ ...metaForm, isEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Enable System Broadcasts
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={savingConfig}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-sm disabled:opacity-50"
                >
                  {savingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save API Configuration
                </button>
              </div>
            </form>
          </div>

          {/* Webhook Instructions Card */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-emerald-600" />
                Meta Webhook Setup
              </h3>
              <p className="text-xs text-slate-500">
                Configure your Meta WhatsApp App Webhook to receive incoming questions and status delivery receipts:
              </p>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Callback URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 text-[11px] font-mono px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 select-all"
                  />
                  <button
                    onClick={() => handleCopy(webhookUrl, 'webhookUrl')}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    {copiedKey === 'webhookUrl' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Verify Token
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={metaForm.webhookVerifyToken}
                    className="flex-1 text-[11px] font-mono px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 select-all"
                  />
                  <button
                    onClick={() => handleCopy(metaForm.webhookVerifyToken, 'verifyToken')}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    {copiedKey === 'verifyToken' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Webhook Subscriptions:</div>
                <div>✓ <code className="font-mono text-emerald-600">messages</code> (User questions & commands)</div>
                <div>✓ <code className="font-mono text-emerald-600">message_template_status_update</code></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipient Add/Edit Modal */}
      {isRecipientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingRecipient ? 'Edit WhatsApp Recipient' : 'Add WhatsApp Recipient'}
            </h3>

            <form onSubmit={handleSaveRecipient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={recipientForm.name}
                  onChange={(e) => setRecipientForm({ ...recipientForm, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Number (with country code)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={recipientForm.phone}
                  onChange={(e) => setRecipientForm({ ...recipientForm, phone: e.target.value })}
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">E.g. +91 96646 83069 or 9876543210 (India default).</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mill Role
                </label>
                <CustomSelect
                  value={recipientForm.role}
                  onChange={(val) => setRecipientForm({ ...recipientForm, role: val })}
                  options={[
                    { value: 'Admin', label: 'Admin (Full mill control & reports)' },
                    { value: 'Supervisor', label: 'Supervisor (Shift & floor production)' },
                    { value: 'Floor Incharge', label: 'Floor Incharge (Alarms & loom outages)' },
                    { value: 'Mill Owner', label: 'Mill Owner (Executive daily summary & financials)' }
                  ]}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recipientForm.isActive}
                    onChange={(e) => setRecipientForm({ ...recipientForm, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Active Recipient</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecipientModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
                >
                  Save Recipient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

