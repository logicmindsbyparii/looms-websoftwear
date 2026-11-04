import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, setAccessToken, getAccessToken, setOnSessionExpired } from '../api/client';
import { io } from 'socket.io-client';
import { soundEffects } from '../utils/soundEffects';

const AppContext = createContext();

const BROADCAST_CHANNEL_NAME = 'loomus_auth_sync_channel';

export function AppProvider({ children }) {
  // Session & Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState('Admin'); // 'Admin' | 'Supervisor' | 'Operator'
  const [currentUser, setCurrentUser] = useState({
    username: 'Admin',
    displayName: 'Mill Administrator',
    avatar: 'A'
  });
  const [userPermissions, setUserPermissions] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');

  // Theme & Preferences
  const [theme, setTheme] = useState('light');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [powerLoadPercent, setPowerLoadPercent] = useState(0);

  // Core Data States
  const [machines, setMachines] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [stockLevels, setStockLevels] = useState([]);
  const [readyGoods, setReadyGoods] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [productionLogs, setProductionLogs] = useState([]);

  // Machine Inspection Selection & Active Operator Loom
  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [activeOperatorLoom, setActiveOperatorLoom] = useState(null);

  // Modals & Navigation Drawers
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [inspectRollCode, setInspectRollCode] = useState(null);
  const [activeLabelRoll, setActiveLabelRoll] = useState(null);

  // Idle Timeout Warning Modal State
  const [idleWarning, setIdleWarning] = useState({ show: false, countdown: 60 });
  const idleTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const idleLimitMinutesRef = useRef(30);

  // WhatsApp Phone Numbers
  const DEFAULT_ADMIN_PHONE = '+91 75675 74107';
  const [adminWhatsAppPhone, setAdminWhatsAppPhoneState] = useState(DEFAULT_ADMIN_PHONE);
  const [godownWhatsAppPhone, setGodownWhatsAppPhoneState] = useState(DEFAULT_ADMIN_PHONE);
  const [salesWhatsAppPhone, setSalesWhatsAppPhoneState] = useState(DEFAULT_ADMIN_PHONE);

  // WhatsApp Share Modal Data
  const [whatsAppShareData, setWhatsAppShareData] = useState({
    isOpen: false,
    title: '',
    message: '',
    category: 'general',
    defaultPhone: DEFAULT_ADMIN_PHONE,
    entityName: ''
  });

  // Floating Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Socket reference
  const socketRef = useRef(null);
  const broadcastChannelRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    if (soundEnabled) {
      if (type === 'error') soundEffects.alarm();
      else if (type === 'success') soundEffects.success();
      else soundEffects.click();
    }
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3500);
  }, [soundEnabled]);

  // Load all factory data from backend
  const fetchFactoryData = useCallback(async () => {
    try {
      const [
        mRes,
        wRes,
        aRes,
        sRes,
        rgRes,
        bRes,
        soRes,
        cRes,
        plRes,
        settingsRes
      ] = await Promise.allSettled([
        api.get('/machines'),
        api.get('/workers'),
        api.get('/alarms'),
        api.get('/stock'),
        api.get('/ready-goods'),
        api.get('/brokers'),
        api.get('/sales-orders'),
        api.get('/cameras'),
        api.get('/production-logs'),
        api.get('/settings')
      ]);

      if (mRes.status === 'fulfilled') setMachines(mRes.value.data || []);
      if (wRes.status === 'fulfilled') setWorkers(wRes.value.data || []);
      if (aRes.status === 'fulfilled') setAlarms(aRes.value.data || []);
      if (sRes.status === 'fulfilled') setStockLevels(sRes.value.data || []);
      if (rgRes.status === 'fulfilled') setReadyGoods(rgRes.value.data || []);
      if (bRes.status === 'fulfilled') setBrokers(bRes.value.data || []);
      if (soRes.status === 'fulfilled') setSalesOrders(soRes.value.data || []);
      if (cRes.status === 'fulfilled') setCameras(cRes.value.data || []);
      if (plRes.status === 'fulfilled') setProductionLogs(plRes.value.data || []);

      if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
        const s = settingsRes.value.data;
        if (s.adminWhatsAppPhone) setAdminWhatsAppPhoneState(s.adminWhatsAppPhone);
        if (s.godownWhatsAppPhone) setGodownWhatsAppPhoneState(s.godownWhatsAppPhone);
        if (s.salesWhatsAppPhone) setSalesWhatsAppPhoneState(s.salesWhatsAppPhone);
        if (s.idleTimeoutMinutes) idleLimitMinutesRef.current = s.idleTimeoutMinutes;
      }
    } catch (err) {
      console.error('Failed to load initial factory data:', err);
    }
  }, []);

  // Connect WebSockets
  const setupWebSocket = useCallback((token) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io({
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      // connected to socket
    });

    socket.on('machine:created', (newMachine) => {
      setMachines(prev => prev.some(m => m.id === newMachine.id) ? prev : [...prev, newMachine]);
    });

    socket.on('machine:updated', (updatedMachine) => {
      setMachines(prev => prev.map(m => m.id === updatedMachine.id ? { ...m, ...updatedMachine } : m));
    });

    socket.on('machine:deleted', ({ id }) => {
      setMachines(prev => prev.filter(m => m.id !== id));
    });

    socket.on('machines:mass_updated', ({ machines: updatedList }) => {
      if (updatedList) setMachines(updatedList);
    });

    socket.on('emergency:stop', ({ alarm, machines: stoppedMachines, triggeredBy }) => {
      if (stoppedMachines) setMachines(stoppedMachines);
      if (alarm) setAlarms(prev => [alarm, ...prev.filter(a => a.id !== alarm.id)]);
      if (soundEnabled) soundEffects.emergency();
      showToast(`🚨 FACTORY EMERGENCY STOP ACTIVATED BY ${triggeredBy || 'USER'}!`, 'error');
    });

    socket.on('alarm:created', (newAlarm) => {
      setAlarms(prev => [newAlarm, ...prev.filter(a => a.id !== newAlarm.id)]);
      if (soundEnabled) soundEffects.alarm();
    });

    socket.on('alarm:cleared', ({ id }) => {
      setAlarms(prev => prev.filter(a => a.id !== id));
    });

    socket.on('alarm:cleared_all', () => {
      setAlarms([]);
    });

    socket.on('worker:created', (worker) => {
      setWorkers(prev => [worker, ...prev.filter(w => w.id !== worker.id)]);
    });

    socket.on('worker:updated', (worker) => {
      setWorkers(prev => prev.map(w => w.id === worker.id ? worker : w));
    });

    socket.on('worker:deleted', ({ id }) => {
      setWorkers(prev => prev.filter(w => w.id !== id));
    });

    socket.on('stock:created', (stock) => {
      setStockLevels(prev => [stock, ...prev.filter(s => s.id !== stock.id)]);
    });

    socket.on('stock:updated', (stock) => {
      setStockLevels(prev => prev.map(s => s.id === stock.id ? stock : s));
    });

    socket.on('stock:deleted', ({ id }) => {
      setStockLevels(prev => prev.filter(s => s.id !== id));
    });

    socket.on('ready_goods:created', (item) => {
      setReadyGoods(prev => [item, ...prev.filter(g => g.id !== item.id)]);
    });

    socket.on('ready_goods:deleted', ({ id }) => {
      setReadyGoods(prev => prev.filter(g => g.id !== id));
    });

    socket.on('broker:created', (broker) => {
      setBrokers(prev => [broker, ...prev.filter(b => b.id !== broker.id)]);
    });

    socket.on('broker:deleted', ({ id }) => {
      setBrokers(prev => prev.filter(b => b.id !== id));
    });

    socket.on('sales_order:created', (order) => {
      setSalesOrders(prev => [order, ...prev.filter(o => o.id !== order.id)]);
    });

    socket.on('sales_order:updated', (order) => {
      setSalesOrders(prev => prev.map(o => o.id === order.id ? order : o));
    });

    socket.on('sales_order:deleted', ({ id }) => {
      setSalesOrders(prev => prev.filter(o => o.id !== id));
    });

    socket.on('camera:created', (cam) => {
      setCameras(prev => [...prev.filter(c => c.id !== cam.id), cam]);
    });

    socket.on('camera:updated', (cam) => {
      setCameras(prev => prev.map(c => c.id === cam.id ? cam : c));
    });

    socket.on('camera:deleted', ({ id }) => {
      setCameras(prev => prev.filter(c => c.id !== id));
    });

    socket.on('production_log:created', (log) => {
      setProductionLogs(prev => [log, ...prev.filter(l => l.id !== log.id)]);
    });

    socket.on('production_log:deleted', ({ id }) => {
      setProductionLogs(prev => prev.filter(l => l.id !== id));
    });

    socket.on('roll:created', (roll) => {
      showToast(`Roll ${roll.id} (${roll.fabric}) created`, 'info');
    });

    socket.on('roll:updated', (roll) => {
      // Roll status or location updated
    });

    socket.on('factory:data_reloaded', () => {
      fetchFactoryData();
    });

    socket.on('telemetry:batch', (batchUpdates) => {
      setMachines(prev => {
        const updateMap = new Map(batchUpdates.map(u => [u.id, u]));
        return prev.map(m => {
          if (updateMap.has(m.id)) {
            return { ...m, ...updateMap.get(m.id) };
          }
          return m;
        });
      });
    });

    socketRef.current = socket;
  }, [fetchFactoryData, soundEnabled, showToast]);

  // Session Restore on Initial App Mount
  useEffect(() => {
    let isMounted = true;

    // Multi-tab logout sync
    try {
      broadcastChannelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannelRef.current.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          setAccessToken(null);
          setIsAuthenticated(false);
          if (socketRef.current) socketRef.current.disconnect();
          showToast('Session ended from another tab', 'info');
        }
      };
    } catch (e) {}

    setOnSessionExpired(() => {
      if (isMounted) {
        setIsAuthenticated(false);
        showToast('Your session has expired. Please sign in again.', 'warning');
      }
    });

    async function restoreSession() {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data.data?.accessToken && isMounted) {
            const token = data.data.accessToken;
            setAccessToken(token);

            const meRes = await api.get('/auth/me');
            const user = meRes.data.user;
            setCurrentUser(user);
            setUserRole(user.role);
            setUserPermissions(meRes.data.permissions || []);
            setIsAuthenticated(true);

            const defaultTab = user.role === 'Operator' ? 'operator-console' : user.role === 'Supervisor' ? 'supervisor-floor' : 'dashboard';
            setActiveTab(defaultTab);

            setupWebSocket(token);
            await fetchFactoryData();
          }
        }
      } catch (err) {
        // No session restored
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
      if (socketRef.current) socketRef.current.disconnect();
      if (broadcastChannelRef.current) broadcastChannelRef.current.close();
    };
  }, [setupWebSocket, fetchFactoryData, showToast]);

  // Idle Timeout Inactivity Tracker
  const resetIdleTimer = useCallback(() => {
    if (!isAuthenticated) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setIdleWarning({ show: false, countdown: 60 });

    const timeoutMs = (idleLimitMinutesRef.current || 30) * 60 * 1000 - 60000; // show warning 60s before
    idleTimerRef.current = setTimeout(() => {
      setIdleWarning({ show: true, countdown: 60 });
      let remaining = 60;
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        setIdleWarning({ show: true, countdown: remaining });
        if (remaining <= 0) {
          clearInterval(countdownIntervalRef.current);
          logout();
        }
      }, 1000);
    }, Math.max(10000, timeoutMs));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => resetIdleTimer();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthenticated, resetIdleTimer]);

  // Sync active operator loom when machines change
  useEffect(() => {
    if (machines.length > 0) {
      if (!activeOperatorLoom || !machines.some(m => m.id === activeOperatorLoom)) {
        setActiveOperatorLoom(machines[0].id);
      }
    } else {
      setActiveOperatorLoom(null);
    }
  }, [machines, activeOperatorLoom]);

  // Compute power load percent dynamically based on running count
  useEffect(() => {
    const runningCount = machines.filter(m => m.status === 'running').length;
    if (runningCount === 0 || machines.length === 0) {
      setPowerLoadPercent(0);
    } else {
      const computedLoad = Math.min(95, Math.round((runningCount / machines.length) * 80 + 10));
      setPowerLoadPercent(computedLoad);
    }
  }, [machines]);

  // Real Login
  const login = async (roleOrUsername, usernameOrPassword, maybePassword) => {
    let portalRole, username, password;
    if (maybePassword !== undefined) {
      portalRole = roleOrUsername;
      username = usernameOrPassword;
      password = maybePassword;
    } else {
      portalRole = undefined;
      username = roleOrUsername;
      password = usernameOrPassword;
    }

    try {
      const res = await api.post('/auth/login', {
        username,
        password,
        role: portalRole
      });

      if (res.data?.twoFactorRequired) {
        return {
          twoFactorRequired: true,
          tempToken: res.data.tempToken,
          user: res.data.user
        };
      }

      const { accessToken, user, permissions } = res.data;
      setAccessToken(accessToken);
      setCurrentUser(user);
      setUserRole(user.role);
      setUserPermissions(permissions || []);
      setIsAuthenticated(true);
      setIsPreviewMode(false);

      const defaultTab = user.role === 'Operator' ? 'operator-console' : user.role === 'Supervisor' ? 'supervisor-floor' : 'dashboard';
      setActiveTab(defaultTab);

      setupWebSocket(accessToken);
      await fetchFactoryData();

      if (soundEnabled) soundEffects.success();
      showToast(`Welcome back, ${user.displayName}!`, 'success');
      return { success: true, user };
    } catch (err) {
      const msg = err.data?.message || err.message || 'Login failed';
      showToast(msg, 'error');
      throw err;
    }
  };

  // Complete 2FA Login
  const login2FA = async (tempToken, code) => {
    try {
      const res = await api.post('/auth/2fa/login', { tempToken, code });
      const { accessToken, user, permissions } = res.data;
      setAccessToken(accessToken);
      setCurrentUser(user);
      setUserRole(user.role);
      setUserPermissions(permissions || []);
      setIsAuthenticated(true);

      const defaultTab = user.role === 'Operator' ? 'operator-console' : user.role === 'Supervisor' ? 'supervisor-floor' : 'dashboard';
      setActiveTab(defaultTab);

      setupWebSocket(accessToken);
      await fetchFactoryData();

      if (soundEnabled) soundEffects.success();
      showToast(`Welcome back, ${user.displayName}!`, 'success');
      return { success: true, user };
    } catch (err) {
      const msg = err.data?.message || err.message || '2FA verification failed';
      showToast(msg, 'error');
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}

    setAccessToken(null);
    setIsAuthenticated(false);
    setIsPreviewMode(false);
    if (socketRef.current) socketRef.current.disconnect();

    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'LOGOUT' });
      }
    } catch (e) {}

    if (soundEnabled) soundEffects.click();
    showToast('Logged out of session', 'info');
  };

  // Switch Role / View-As (Admin exclusive)
  const switchRole = async (targetRole) => {
    if (userRole !== 'Admin' && !isPreviewMode) {
      showToast('Permission Denied: Only Admin can preview other roles.', 'error');
      return;
    }

    try {
      const res = await api.post('/auth/view-as', { role: targetRole });
      const previewToken = res.data.previewToken;
      setAccessToken(previewToken);
      setUserRole(targetRole);
      setIsPreviewMode(targetRole !== 'Admin');

      const defaultTab = targetRole === 'Operator' ? 'operator-console' : targetRole === 'Supervisor' ? 'supervisor-floor' : 'dashboard';
      setActiveTab(defaultTab);

      if (soundEnabled) soundEffects.click();
      showToast(`Previewing as ${targetRole}`, 'info');
    } catch (err) {
      showToast(err.message || 'Failed to switch role preview', 'error');
    }
  };

  // ─── FACTORY DATA MANAGEMENT ───
  const clearAllData = async (passwordConfirm) => {
    try {
      await api.delete('/data/clear', { passwordConfirm });
      setMachines([]);
      setWorkers([]);
      setAlarms([]);
      setStockLevels([]);
      setReadyGoods([]);
      setBrokers([]);
      setSalesOrders([]);
      setCameras([]);
      setProductionLogs([]);
      setSelectedMachineId(null);
      setActiveOperatorLoom(null);
      setPowerLoadPercent(0);

      if (soundEnabled) soundEffects.alarm();
      showToast('Pura data delete ho gaya hai! Sab kuch fresh 0 se ready hai.', 'warning');
      return true;
    } catch (err) {
      showToast(err.message || 'Data clear failed', 'error');
      return false;
    }
  };

  const loadDemoData = async () => {
    try {
      await api.post('/data/demo');
      await fetchFactoryData();
      if (soundEnabled) soundEffects.success();
      showToast('Demo reference data load ho gaya hai!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to load demo data', 'error');
    }
  };

  const exportDataJSON = async () => {
    try {
      const res = await api.get('/data/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loomus_factory_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Factory data backup JSON downloaded!', 'success');
    } catch (err) {
      showToast(err.message || 'Export failed', 'error');
    }
  };

  const importDataJSON = async (jsonString) => {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      await api.post('/data/import', parsed);
      await fetchFactoryData();
      showToast('Backup data imported successfully!', 'success');
    } catch (e) {
      showToast(e.message || 'Invalid JSON backup file!', 'error');
    }
  };

  // ─── MACHINE CRUD ───
  const addMachine = async (machineData) => {
    try {
      const res = await api.post('/machines', machineData);
      const newMachine = res.data;
      setMachines(prev => [...prev.filter(m => m.id !== newMachine.id), newMachine]);
      if (!activeOperatorLoom) setActiveOperatorLoom(newMachine.id);
      if (soundEnabled) soundEffects.success();
      showToast(`Machine ${newMachine.id} added!`, 'success');
      return true;
    } catch (err) {
      showToast(err.message || 'Failed to add machine', 'error');
      return false;
    }
  };

  const deleteMachine = async (machineId) => {
    try {
      await api.delete(`/machines/${machineId}`);
      setMachines(prev => prev.filter(m => m.id !== machineId));
      if (selectedMachineId === machineId) setSelectedMachineId(null);
      if (activeOperatorLoom === machineId) {
        const remaining = machines.filter(m => m.id !== machineId);
        setActiveOperatorLoom(remaining[0]?.id || null);
      }
      showToast(`Machine ${machineId} deleted`, 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete machine', 'error');
    }
  };

  const updateMachineStatus = async (machineId, status) => {
    try {
      const res = await api.patch(`/machines/${machineId}/status`, { status });
      if (machineId === 'all') {
        setMachines(res.data || []);
      } else {
        const updated = res.data;
        setMachines(prev => prev.map(m => m.id === updated.id ? updated : m));
      }
      if (soundEnabled) {
        if (status === 'running') soundEffects.machineStart();
        else if (status === 'stopped') soundEffects.alarm();
        else soundEffects.click();
      }
      showToast(`Machine ${machineId}: status set to ${status.toUpperCase()}`, status === 'stopped' ? 'warning' : 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update machine status', 'error');
    }
  };

  const emergencyStopAll = async () => {
    try {
      const res = await api.post('/machines/emergency-stop');
      if (res.data?.machines) setMachines(res.data.machines);
      if (res.data?.alarm) setAlarms(prev => [res.data.alarm, ...prev]);
      if (soundEnabled) soundEffects.emergency();
      showToast('🚨 FACTORY EMERGENCY STOP ACTIVATED!', 'error');
    } catch (err) {
      showToast(err.message || 'Emergency stop failed', 'error');
    }
  };

  const startAllMachines = async () => {
    try {
      const res = await api.post('/machines/start-all');
      setMachines(res.data || []);
      showToast(`All loom units activated`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to start all looms', 'error');
    }
  };

  const stopAllMachines = async () => {
    try {
      const res = await api.post('/machines/stop-all');
      setMachines(res.data || []);
      showToast('All Loom units halted safely', 'warning');
    } catch (err) {
      showToast(err.message || 'Failed to stop all looms', 'error');
    }
  };

  // ─── ALARMS ───
  const ackAlarm = async (alarmId) => {
    try {
      await api.post(`/alarms/${alarmId}/ack`);
      setAlarms(prev => prev.filter(a => a.id !== alarmId));
      if (soundEnabled) soundEffects.click();
      showToast('Alarm acknowledged & cleared', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to clear alarm', 'error');
    }
  };

  const ackAllAlarms = async () => {
    try {
      await api.post('/alarms/ack-all');
      setAlarms([]);
      if (soundEnabled) soundEffects.success();
      showToast('All alarms acknowledged', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to clear alarms', 'error');
    }
  };

  const addTestAlarm = async () => {
    try {
      const res = await api.post('/alarms/test');
      const newAlarm = res.data;
      setAlarms(prev => [newAlarm, ...prev.filter(a => a.id !== newAlarm.id)]);
      if (soundEnabled) soundEffects.alarm();
      showToast(`New ${newAlarm.type.toUpperCase()} Alarm: ${newAlarm.title}`, 'warning');
    } catch (err) {
      showToast(err.message || 'Failed to create test alarm', 'error');
    }
  };

  // ─── WORKERS ───
  const addWorker = async (workerData) => {
    try {
      const res = await api.post('/workers', workerData);
      setWorkers(prev => [res.data, ...prev]);
      showToast(`Worker ${res.data.name} registered`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to register worker', 'error');
    }
  };

  const deleteWorker = async (workerId) => {
    try {
      await api.delete(`/workers/${workerId}`);
      setWorkers(prev => prev.filter(w => w.id !== workerId));
      showToast('Worker removed', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to remove worker', 'error');
    }
  };

  const updateWorkerStatus = async (workerId, newStatus) => {
    try {
      const res = await api.patch(`/workers/${workerId}/status`, { status: newStatus });
      setWorkers(prev => prev.map(w => w.id === workerId ? res.data : w));
      showToast(`Worker status updated to ${newStatus}`, 'info');
    } catch (err) {
      showToast(err.message || 'Failed to update worker status', 'error');
    }
  };

  // ─── RAW MATERIAL / STOCK ───
  const addRawMaterial = async (entry) => {
    try {
      const res = await api.post('/stock', entry);
      const item = res.data;
      setStockLevels(prev => {
        const idx = prev.findIndex(s => s.id === item.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = item;
          return updated;
        }
        return [item, ...prev];
      });
      showToast(`Added ${entry.qty} kg of ${entry.material}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add stock', 'error');
    }
  };

  const deleteStock = async (stockId) => {
    try {
      await api.delete(`/stock/${stockId}`);
      setStockLevels(prev => prev.filter(s => s.id !== stockId));
      showToast('Material stock deleted', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete stock', 'error');
    }
  };

  // ─── READY GOODS ───
  const addReadyGoods = async (goods) => {
    try {
      const res = await api.post('/ready-goods', goods);
      setReadyGoods(prev => [res.data, ...prev]);
      showToast(`Ready goods roll lot logged (${goods.qty}m)`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to log ready goods', 'error');
    }
  };

  const deleteReadyGoods = async (goodsId) => {
    try {
      await api.delete(`/ready-goods/${goodsId}`);
      setReadyGoods(prev => prev.filter(g => g.id !== goodsId));
      showToast('Ready goods entry deleted', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete ready goods', 'error');
    }
  };

  // ─── BROKERS ───
  const addBroker = async (broker) => {
    try {
      const res = await api.post('/brokers', broker);
      setBrokers(prev => [res.data, ...prev]);
      showToast(`Broker ${broker.name} registered successfully`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to register broker', 'error');
    }
  };

  const deleteBroker = async (brokerId) => {
    try {
      await api.delete(`/brokers/${brokerId}`);
      setBrokers(prev => prev.filter(b => b.id !== brokerId));
      showToast('Broker removed', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete broker', 'error');
    }
  };

  // ─── SALES ORDERS ───
  const addSalesOrder = async (order) => {
    try {
      const res = await api.post('/sales-orders', order);
      setSalesOrders(prev => [res.data, ...prev]);
      showToast(`Sales order created: ${res.data.id}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create sales order', 'error');
    }
  };

  const deleteSalesOrder = async (orderId) => {
    try {
      await api.delete(`/sales-orders/${orderId}`);
      setSalesOrders(prev => prev.filter(o => o.id !== orderId));
      showToast('Order removed', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete sales order', 'error');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await api.patch(`/sales-orders/${orderId}/status`, { status });
      setSalesOrders(prev => prev.map(o => o.id === orderId ? res.data : o));
      showToast(`Order ${orderId} updated to ${status}`, 'info');
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  // ─── CAMERAS ───
  const toggleCamera = async (camId) => {
    try {
      const res = await api.patch(`/cameras/${camId}/toggle`);
      setCameras(prev => prev.map(c => c.id === camId ? res.data : c));
      showToast(`${res.data.name}: ${res.data.connected ? 'Stream Connected' : 'Stream Disconnected'}`, res.data.connected ? 'success' : 'info');
    } catch (err) {
      showToast(err.message || 'Failed to toggle camera', 'error');
    }
  };

  const addCamera = async (newCam) => {
    try {
      const res = await api.post('/cameras', newCam);
      setCameras(prev => [...prev, res.data]);
      showToast(`Camera ${res.data.name} connected to EasyViewer hub`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add camera', 'error');
    }
  };

  const deleteCamera = async (camId) => {
    try {
      await api.delete(`/cameras/${camId}`);
      setCameras(prev => prev.filter(c => c.id !== camId));
      showToast('Camera deleted', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete camera', 'error');
    }
  };

  // ─── PRODUCTION LOG ───
  const addProductionLog = async (log) => {
    try {
      const res = await api.post('/production-logs', log);
      setProductionLogs(prev => [res.data, ...prev]);

      // Optimistic update machine output
      setMachines(prev => prev.map(m => {
        if (m.id === log.machine) {
          const newOutput = m.output + parseFloat(log.output);
          const newEff = Math.min(100, Math.round((newOutput / (m.targetOutput || 75)) * 100));
          return { ...m, output: newOutput, efficiency: newEff };
        }
        return m;
      }));
      showToast(`Production logged: ${log.output}m from ${log.machine}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to log production', 'error');
    }
  };

  const deleteProductionLog = async (logId) => {
    try {
      await api.delete(`/production-logs/${logId}`);
      setProductionLogs(prev => prev.filter(l => l.id !== logId));
      showToast('Production entry deleted', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete production entry', 'error');
    }
  };

  // WhatsApp Config Handlers
  const setAdminWhatsAppPhone = async (phone) => {
    setAdminWhatsAppPhoneState(phone);
    try {
      await api.patch('/settings', { adminWhatsAppPhone: phone });
    } catch (e) {}
  };

  const setGodownWhatsAppPhone = async (phone) => {
    setGodownWhatsAppPhoneState(phone);
    try {
      await api.patch('/settings', { godownWhatsAppPhone: phone });
    } catch (e) {}
  };

  const setSalesWhatsAppPhone = async (phone) => {
    setSalesWhatsAppPhoneState(phone);
    try {
      await api.patch('/settings', { salesWhatsAppPhone: phone });
    } catch (e) {}
  };

  const openWhatsAppShare = ({ title, message, category = 'general', defaultPhone = '', entityName = '' }) => {
    setWhatsAppShareData({
      isOpen: true,
      title: title || 'Send WhatsApp Report',
      message: message || '',
      category,
      defaultPhone: defaultPhone || adminWhatsAppPhone || DEFAULT_ADMIN_PHONE,
      entityName
    });
  };

  const closeWhatsAppShare = () => {
    setWhatsAppShareData(prev => ({ ...prev, isOpen: false }));
  };

  const stayLoggedIn = () => {
    resetIdleTimer();
  };

  const value = {
    isAuthenticated,
    isAuthLoading,
    userRole,
    currentUser,
    userPermissions,
    isPreviewMode,
    activeTab,
    theme,
    soundEnabled,
    powerLoadPercent,
    machines,
    alarms,
    workers,
    stockLevels,
    readyGoods,
    brokers,
    salesOrders,
    cameras,
    productionLogs,
    selectedMachineId,
    activeOperatorLoom,
    toast,
    isDataManagerOpen,
    isAddMachineOpen,
    isMobileMenuOpen,
    isWhatsAppModalOpen,
    isUsersModalOpen,
    isScanModalOpen,
    setIsScanModalOpen,
    inspectRollCode,
    setInspectRollCode,
    activeLabelRoll,
    setActiveLabelRoll,
    idleWarning,
    stayLoggedIn,
    setIsDataManagerOpen,
    setIsAddMachineOpen,
    setIsMobileMenuOpen,
    setIsWhatsAppModalOpen,
    setIsUsersModalOpen,
    adminWhatsAppPhone,
    setAdminWhatsAppPhone,
    godownWhatsAppPhone,
    setGodownWhatsAppPhone,
    salesWhatsAppPhone,
    setSalesWhatsAppPhone,
    whatsAppShareData,
    openWhatsAppShare,
    closeWhatsAppShare,
    setActiveTab,
    setTheme,
    setSoundEnabled,
    setSelectedMachineId,
    setActiveOperatorLoom,
    switchRole,
    login,
    login2FA,
    logout,
    showToast,
    clearAllData,
    loadDemoData,
    exportDataJSON,
    importDataJSON,
    addMachine,
    deleteMachine,
    updateMachineStatus,
    emergencyStopAll,
    startAllMachines,
    stopAllMachines,
    ackAlarm,
    ackAllAlarms,
    addTestAlarm,
    addWorker,
    deleteWorker,
    updateWorkerStatus,
    addRawMaterial,
    deleteStock,
    addReadyGoods,
    deleteReadyGoods,
    addBroker,
    deleteBroker,
    addSalesOrder,
    deleteSalesOrder,
    updateOrderStatus,
    toggleCamera,
    addCamera,
    deleteCamera,
    addProductionLog,
    deleteProductionLog,
    fetchFactoryData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
