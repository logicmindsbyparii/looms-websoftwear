import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api, setAccessToken, setOnSessionExpired } from '../api/client';
import { io } from 'socket.io-client';
import { soundEffects } from '../utils/soundEffects';

// Redux Actions & Selectors
import {
  setAuthState,
  setCurrentUser,
  setUserRole,
  setPreviewMode,
  setAuthLoading,
  logoutSuccess,
  selectIsAuthenticated,
  selectIsAuthLoading,
  selectUserRole,
  selectCurrentUser,
  selectUserPermissions,
  selectIsPreviewMode
} from '../store/slices/authSlice';

import {
  setMachines,
  machineCreated,
  machineUpdated,
  machineDeleted,
  massMachinesUpdated,
  setSelectedMachineId,
  setActiveOperatorLoom,
  selectMachines,
  selectSelectedMachineId,
  selectActiveOperatorLoom
} from '../store/slices/machinesSlice';

import {
  setAlarms,
  alarmCreated,
  alarmCleared,
  allAlarmsCleared,
  selectAllAlarms
} from '../store/slices/alarmsSlice';

import {
  setAllInventory,
  workerCreated,
  workerUpdated,
  workerDeleted,
  stockCreated,
  stockUpdated,
  stockDeleted,
  readyGoodsCreated,
  readyGoodsDeleted,
  brokerCreated,
  brokerDeleted,
  salesOrderCreated,
  salesOrderUpdated,
  salesOrderDeleted,
  productionLogCreated,
  productionLogDeleted,
  selectWorkers,
  selectStockLevels,
  selectReadyGoods,
  selectBrokers,
  selectSalesOrders,
  selectProductionLogs
} from '../store/slices/inventorySlice';

import {
  setActiveTab,
  setTheme,
  setSoundEnabled,
  setPowerLoadPercent,
  toggleSidebar,
  setIsSidebarCollapsed,
  setIsMobileMenuOpen,
  setIsDataManagerOpen,
  setIsAddMachineOpen,
  setIsWhatsAppModalOpen,
  setIsUsersModalOpen,
  setIsScanModalOpen,
  setInspectRollCode,
  setActiveLabelRoll,
  setIdleWarning,
  showToastNotification,
  hideToastNotification,
  openWhatsAppShareModal,
  closeWhatsAppShareModal,
  selectActiveTab,
  selectTheme,
  selectSoundEnabled,
  selectPowerLoadPercent,
  selectIsSidebarCollapsed,
  selectIsMobileMenuOpen,
  selectIsDataManagerOpen,
  selectIsAddMachineOpen,
  selectIsWhatsAppModalOpen,
  selectIsUsersModalOpen,
  selectIsScanModalOpen,
  selectInspectRollCode,
  selectActiveLabelRoll,
  selectIdleWarning,
  selectToast,
  selectWhatsAppShareData
} from '../store/slices/uiSlice';

import {
  setAllSettings,
  setAdminWhatsAppPhone as setAdminPhoneAction,
  setGodownWhatsAppPhone as setGodownPhoneAction,
  setSalesWhatsAppPhone as setSalesPhoneAction,
  setPublicScanBaseUrl as setPublicScanBaseUrlAction,
  selectAdminWhatsAppPhone,
  selectGodownWhatsAppPhone,
  selectSalesWhatsAppPhone,
  selectNetworkUrl,
  selectPublicScanBaseUrl
} from '../store/slices/settingsSlice';

const AppContext = createContext();

const BROADCAST_CHANNEL_NAME = 'loomus_auth_sync_channel';

export function AppProvider({ children }) {
  const dispatch = useDispatch();

  // Redux Auth State
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAuthLoading = useSelector(selectIsAuthLoading);
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const userPermissions = useSelector(selectUserPermissions);
  const isPreviewMode = useSelector(selectIsPreviewMode);

  // Redux Machines State
  const machines = useSelector(selectMachines);
  const selectedMachineId = useSelector(selectSelectedMachineId);
  const activeOperatorLoom = useSelector(selectActiveOperatorLoom);

  // Redux Alarms State (Deduplicated automatically)
  const alarms = useSelector(selectAllAlarms);

  // Redux Inventory State
  const workers = useSelector(selectWorkers);
  const stockLevels = useSelector(selectStockLevels);
  const readyGoods = useSelector(selectReadyGoods);
  const brokers = useSelector(selectBrokers);
  const salesOrders = useSelector(selectSalesOrders);
  const productionLogs = useSelector(selectProductionLogs);

  // Redux UI State
  const activeTab = useSelector(selectActiveTab);
  const theme = useSelector(selectTheme);
  const soundEnabled = useSelector(selectSoundEnabled);
  const powerLoadPercent = useSelector(selectPowerLoadPercent);
  const isSidebarCollapsed = useSelector(selectIsSidebarCollapsed);
  const isMobileMenuOpen = useSelector(selectIsMobileMenuOpen);
  const isDataManagerOpen = useSelector(selectIsDataManagerOpen);
  const isAddMachineOpen = useSelector(selectIsAddMachineOpen);
  const isWhatsAppModalOpen = useSelector(selectIsWhatsAppModalOpen);
  const isUsersModalOpen = useSelector(selectIsUsersModalOpen);
  const isScanModalOpen = useSelector(selectIsScanModalOpen);
  const inspectRollCode = useSelector(selectInspectRollCode);
  const activeLabelRoll = useSelector(selectActiveLabelRoll);
  const idleWarning = useSelector(selectIdleWarning);
  const toast = useSelector(selectToast);
  const whatsAppShareData = useSelector(selectWhatsAppShareData);

  // Redux Settings State
  const adminWhatsAppPhone = useSelector(selectAdminWhatsAppPhone);
  const godownWhatsAppPhone = useSelector(selectGodownWhatsAppPhone);
  const salesWhatsAppPhone = useSelector(selectSalesWhatsAppPhone);
  const networkUrl = useSelector(selectNetworkUrl);
  const publicScanBaseUrl = useSelector(selectPublicScanBaseUrl);

  // Refs
  const socketRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const idleTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const idleLimitMinutesRef = useRef(30);

  // Toast Dispatcher with Audio
  const showToast = useCallback((message, type = 'info') => {
    dispatch(showToastNotification({ message, type }));
    if (soundEnabled) {
      if (type === 'error') soundEffects.alarm();
      else if (type === 'success') soundEffects.success();
      else soundEffects.click();
    }
    setTimeout(() => {
      dispatch(hideToastNotification());
    }, 3500);
  }, [dispatch, soundEnabled]);

  // Load all factory data from backend into Redux Store
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
        api.get('/production-logs'),
        api.get('/settings')
      ]);

      if (mRes.status === 'fulfilled') dispatch(setMachines(mRes.value.data || []));
      if (aRes.status === 'fulfilled') dispatch(setAlarms(aRes.value.data || []));

      dispatch(setAllInventory({
        workers: wRes.status === 'fulfilled' ? wRes.value.data : undefined,
        stockLevels: sRes.status === 'fulfilled' ? sRes.value.data : undefined,
        readyGoods: rgRes.status === 'fulfilled' ? rgRes.value.data : undefined,
        brokers: bRes.status === 'fulfilled' ? bRes.value.data : undefined,
        salesOrders: soRes.status === 'fulfilled' ? soRes.value.data : undefined,
        productionLogs: plRes.status === 'fulfilled' ? (Array.isArray(plRes.value?.data) ? plRes.value.data : []) : undefined
      }));

      if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
        dispatch(setAllSettings(settingsRes.value.data));
        if (settingsRes.value.data.idleTimeoutMinutes) {
          idleLimitMinutesRef.current = settingsRes.value.data.idleTimeoutMinutes;
        }
      }
    } catch (err) {
      console.error('Failed to load initial factory data into Redux:', err);
    }
  }, [dispatch]);

  // Connect WebSockets and dispatch directly to Redux
  const setupWebSocket = useCallback((token) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socketUrl =
      import.meta.env.VITE_WS_URL ||
      (import.meta.env.DEV
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : undefined);

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('machine:created', (newMachine) => {
      dispatch(machineCreated(newMachine));
    });

    socket.on('machine:updated', (updatedMachine) => {
      dispatch(machineUpdated(updatedMachine));
    });

    socket.on('machine:deleted', ({ id }) => {
      dispatch(machineDeleted(id));
    });

    socket.on('machines:mass_updated', ({ machines: updatedList }) => {
      if (updatedList) dispatch(massMachinesUpdated(updatedList));
    });

    socket.on('emergency:stop', ({ alarm, machines: stoppedMachines, triggeredBy }) => {
      if (stoppedMachines) dispatch(setMachines(stoppedMachines));
      if (alarm) dispatch(alarmCreated(alarm));
      if (soundEnabled) soundEffects.emergency();
      showToast(`🚨 FACTORY EMERGENCY STOP ACTIVATED BY ${triggeredBy || 'USER'}!`, 'error');
    });

    socket.on('alarm:created', (newAlarm) => {
      dispatch(alarmCreated(newAlarm));
      if (soundEnabled) soundEffects.alarm();
    });

    socket.on('alarm:cleared', ({ id }) => {
      dispatch(alarmCleared(id));
    });

    socket.on('alarm:cleared_all', () => {
      dispatch(allAlarmsCleared());
    });

    socket.on('worker:created', (worker) => {
      dispatch(workerCreated(worker));
    });

    socket.on('worker:updated', (worker) => {
      dispatch(workerUpdated(worker));
    });

    socket.on('worker:deleted', ({ id }) => {
      dispatch(workerDeleted(id));
    });

    socket.on('stock:created', (stock) => {
      dispatch(stockCreated(stock));
    });

    socket.on('stock:updated', (stock) => {
      dispatch(stockUpdated(stock));
    });

    socket.on('stock:deleted', ({ id }) => {
      dispatch(stockDeleted(id));
    });

    socket.on('ready_goods:created', (item) => {
      dispatch(readyGoodsCreated(item));
    });

    socket.on('ready_goods:deleted', ({ id }) => {
      dispatch(readyGoodsDeleted(id));
    });

    socket.on('broker:created', (broker) => {
      dispatch(brokerCreated(broker));
    });

    socket.on('broker:deleted', ({ id }) => {
      dispatch(brokerDeleted(id));
    });

    socket.on('sales_order:created', (order) => {
      dispatch(salesOrderCreated(order));
    });

    socket.on('sales_order:updated', (order) => {
      dispatch(salesOrderUpdated(order));
    });

    socket.on('sales_order:deleted', ({ id }) => {
      dispatch(salesOrderDeleted(id));
    });

    socket.on('production_log:created', (log) => {
      if (!log) return;
      dispatch(productionLogCreated(log));
    });

    socket.on('production_log:deleted', ({ id } = {}) => {
      if (!id) return;
      dispatch(productionLogDeleted(id));
    });

    socket.on('roll:created', (roll) => {
      showToast(`Roll ${roll.id} (${roll.fabric}) created`, 'info');
    });

    socket.on('factory:data_reloaded', () => {
      fetchFactoryData();
    });

    socket.on('telemetry:batch', (batchUpdates) => {
      if (Array.isArray(batchUpdates)) {
        batchUpdates.forEach(u => dispatch(machineUpdated(u)));
      }
    });

    socketRef.current = socket;
  }, [dispatch, fetchFactoryData, soundEnabled, showToast]);

  // Session Restore on Initial App Mount
  useEffect(() => {
    let isMounted = true;

    try {
      broadcastChannelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannelRef.current.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          setAccessToken(null);
          dispatch(logoutSuccess());
          if (socketRef.current) socketRef.current.disconnect();
          showToast('Session ended from another tab', 'info');
        }
      };
    } catch (e) {}

    setOnSessionExpired(() => {
      if (isMounted) {
        dispatch(logoutSuccess());
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
            dispatch(setAuthState({
              user,
              permissions: meRes.data.permissions || []
            }));

            const defaultTab = user.role === 'Operator' ? 'operator-console' : user.role === 'Supervisor' ? 'supervisor-floor' : 'dashboard';
            dispatch(setActiveTab(defaultTab));

            setupWebSocket(token);
            await fetchFactoryData();
          }
        }
      } catch (err) {
        // No session restored
      } finally {
        if (isMounted) dispatch(setAuthLoading(false));
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
      if (socketRef.current) socketRef.current.disconnect();
      if (broadcastChannelRef.current) broadcastChannelRef.current.close();
    };
  }, [dispatch, setupWebSocket, fetchFactoryData, showToast]);

  // Idle Timeout Inactivity Tracker
  const resetIdleTimer = useCallback(() => {
    if (!isAuthenticated) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    dispatch(setIdleWarning({ show: false, countdown: 60 }));

    const timeoutMs = (idleLimitMinutesRef.current || 30) * 60 * 1000 - 60000;
    idleTimerRef.current = setTimeout(() => {
      dispatch(setIdleWarning({ show: true, countdown: 60 }));
      let remaining = 60;
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        dispatch(setIdleWarning({ show: true, countdown: remaining }));
        if (remaining <= 0) {
          clearInterval(countdownIntervalRef.current);
          logout();
        }
      }, 1000);
    }, Math.max(10000, timeoutMs));
  }, [isAuthenticated, dispatch]);

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
        dispatch(setActiveOperatorLoom(machines[0].id));
      }
    } else {
      dispatch(setActiveOperatorLoom(null));
    }
  }, [machines, activeOperatorLoom, dispatch]);

  // Compute power load percent dynamically based on running count
  useEffect(() => {
    const runningCount = machines.filter(m => m.status === 'running').length;
    if (runningCount === 0 || machines.length === 0) {
      dispatch(setPowerLoadPercent(0));
    } else {
      const computedLoad = Math.min(95, Math.round((runningCount / machines.length) * 80 + 10));
      dispatch(setPowerLoadPercent(computedLoad));
    }
  }, [machines, dispatch]);

  // ─── AUTHENTICATION ACTIONS ───
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
      dispatch(setAuthState({ user, permissions: permissions || [] }));

      const defaultTab = user.role === 'Operator' ? 'operator-console' : user.role === 'Supervisor' ? 'supervisor-floor' : 'dashboard';
      dispatch(setActiveTab(defaultTab));

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

  const login2FA = async (tempToken, code) => {
    try {
      const res = await api.post('/auth/2fa/login', { tempToken, code });
      const { accessToken, user, permissions } = res.data;
      setAccessToken(accessToken);
      dispatch(setAuthState({ user, permissions: permissions || [] }));

      const defaultTab = user.role === 'Operator' ? 'operator-console' : user.role === 'Supervisor' ? 'supervisor-floor' : 'dashboard';
      dispatch(setActiveTab(defaultTab));

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

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}

    setAccessToken(null);
    dispatch(logoutSuccess());
    if (socketRef.current) socketRef.current.disconnect();

    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'LOGOUT' });
      }
    } catch (e) {}

    if (soundEnabled) soundEffects.click();
    showToast('Logged out of session', 'info');
  };

  const switchRole = async (targetRole) => {
    if (userRole !== 'Admin' && !isPreviewMode) {
      showToast('Permission Denied: Only Admin can preview other roles.', 'error');
      return;
    }

    try {
      const res = await api.post('/auth/view-as', { role: targetRole });
      const previewToken = res.data.previewToken;
      setAccessToken(previewToken);
      dispatch(setUserRole(targetRole));
      dispatch(setPreviewMode(targetRole !== 'Admin'));

      const defaultTab = targetRole === 'Operator' ? 'operator-console' : targetRole === 'Supervisor' ? 'supervisor-floor' : 'dashboard';
      dispatch(setActiveTab(defaultTab));

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
      dispatch(setMachines([]));
      dispatch(setAlarms([]));
      dispatch(setAllInventory({
        workers: [],
        stockLevels: [],
        readyGoods: [],
        brokers: [],
        salesOrders: [],
        productionLogs: []
      }));
      dispatch(setSelectedMachineId(null));
      dispatch(setActiveOperatorLoom(null));
      dispatch(setPowerLoadPercent(0));

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
      dispatch(machineCreated(res.data));
      if (!activeOperatorLoom) dispatch(setActiveOperatorLoom(res.data.id));
      if (soundEnabled) soundEffects.success();
      showToast(`Machine ${res.data.id} added!`, 'success');
      return true;
    } catch (err) {
      showToast(err.message || 'Failed to add machine', 'error');
      return false;
    }
  };

  const deleteMachine = async (machineId) => {
    try {
      await api.delete(`/machines/${machineId}`);
      dispatch(machineDeleted(machineId));
      showToast(`Machine ${machineId} deleted`, 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete machine', 'error');
    }
  };

  const updateMachineStatus = async (machineId, status) => {
    try {
      const res = await api.patch(`/machines/${machineId}/status`, { status });
      if (machineId === 'all') {
        dispatch(setMachines(res.data || []));
      } else {
        dispatch(machineUpdated(res.data));
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
      if (res.data?.machines) dispatch(setMachines(res.data.machines));
      if (res.data?.alarm) dispatch(alarmCreated(res.data.alarm));
      if (soundEnabled) soundEffects.emergency();
      showToast('🚨 FACTORY EMERGENCY STOP ACTIVATED!', 'error');
    } catch (err) {
      showToast(err.message || 'Emergency stop failed', 'error');
    }
  };

  const startAllMachines = async () => {
    try {
      const res = await api.post('/machines/start-all');
      dispatch(setMachines(res.data || []));
      showToast(`All loom units activated`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to start all looms', 'error');
    }
  };

  const stopAllMachines = async () => {
    try {
      const res = await api.post('/machines/stop-all');
      dispatch(setMachines(res.data || []));
      showToast('All Loom units halted safely', 'warning');
    } catch (err) {
      showToast(err.message || 'Failed to stop all looms', 'error');
    }
  };

  // ─── ALARMS ───
  const ackAlarm = async (alarmId) => {
    try {
      await api.post(`/alarms/${alarmId}/ack`);
      dispatch(alarmCleared(alarmId));
      if (soundEnabled) soundEffects.click();
      showToast('Alarm acknowledged & cleared', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to clear alarm', 'error');
    }
  };

  const ackAllAlarms = async () => {
    try {
      await api.post('/alarms/ack-all');
      dispatch(allAlarmsCleared());
      if (soundEnabled) soundEffects.success();
      showToast('All alarms acknowledged', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to clear alarms', 'error');
    }
  };

  const addTestAlarm = async () => {
    try {
      const res = await api.post('/alarms/test');
      dispatch(alarmCreated(res.data));
      if (soundEnabled) soundEffects.alarm();
      showToast(`New ${res.data.type.toUpperCase()} Alarm: ${res.data.title}`, 'warning');
    } catch (err) {
      showToast(err.message || 'Failed to create test alarm', 'error');
    }
  };

  // ─── WORKERS ───
  const addWorker = async (workerData) => {
    try {
      const res = await api.post('/workers', workerData);
      dispatch(workerCreated(res.data));
      showToast(`Worker ${res.data.name} registered`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to register worker', 'error');
    }
  };

  const deleteWorker = async (workerId) => {
    try {
      await api.delete(`/workers/${workerId}`);
      dispatch(workerDeleted(workerId));
      showToast('Worker removed', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to remove worker', 'error');
    }
  };

  const updateWorkerStatus = async (workerId, newStatus) => {
    try {
      const res = await api.patch(`/workers/${workerId}/status`, { status: newStatus });
      dispatch(workerUpdated(res.data));
      showToast(`Worker status updated to ${newStatus}`, 'info');
    } catch (err) {
      showToast(err.message || 'Failed to update worker status', 'error');
    }
  };

  // ─── RAW MATERIAL / STOCK ───
  const addRawMaterial = async (entry) => {
    try {
      const res = await api.post('/stock', entry);
      dispatch(stockCreated(res.data));
      showToast(`Added ${entry.qty} kg of ${entry.material}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add stock', 'error');
    }
  };

  const deleteStock = async (stockId) => {
    try {
      await api.delete(`/stock/${stockId}`);
      dispatch(stockDeleted(stockId));
      showToast('Material stock deleted', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete stock', 'error');
    }
  };

  // ─── READY GOODS ───
  const addReadyGoods = async (goods) => {
    try {
      const res = await api.post('/ready-goods', goods);
      dispatch(readyGoodsCreated(res.data));
      showToast(`Ready goods roll lot logged (${goods.qty}m)`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to log ready goods', 'error');
    }
  };

  const deleteReadyGoods = async (goodsId) => {
    try {
      await api.delete(`/ready-goods/${goodsId}`);
      dispatch(readyGoodsDeleted(goodsId));
      showToast('Ready goods entry deleted', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete ready goods', 'error');
    }
  };

  // ─── BROKERS ───
  const addBroker = async (broker) => {
    try {
      const res = await api.post('/brokers', broker);
      dispatch(brokerCreated(res.data));
      showToast(`Broker ${broker.name} registered successfully`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to register broker', 'error');
    }
  };

  const deleteBroker = async (brokerId) => {
    try {
      await api.delete(`/brokers/${brokerId}`);
      dispatch(brokerDeleted(brokerId));
      showToast('Broker removed', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete broker', 'error');
    }
  };

  // ─── SALES ORDERS ───
  const addSalesOrder = async (order) => {
    try {
      const res = await api.post('/sales-orders', order);
      dispatch(salesOrderCreated(res.data));
      showToast(`Sales order created: ${res.data.id}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create sales order', 'error');
    }
  };

  const deleteSalesOrder = async (orderId) => {
    try {
      await api.delete(`/sales-orders/${orderId}`);
      dispatch(salesOrderDeleted(orderId));
      showToast('Order removed', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete sales order', 'error');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await api.patch(`/sales-orders/${orderId}/status`, { status });
      dispatch(salesOrderUpdated(res.data));
      showToast(`Order ${orderId} updated to ${status}`, 'info');
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  // ─── PRODUCTION LOG ───
  const addProductionLog = async (log) => {
    try {
      const res = await api.post('/production-logs', log);
      dispatch(productionLogCreated(res.data));

      // Optimistic update machine output
      const machine = machines.find(m => m.id === log.machine);
      if (machine) {
        const newOutput = (machine.output || 0) + parseFloat(log.output || 0);
        const newEff = Math.min(100, Math.round((newOutput / (machine.targetOutput || 75)) * 100));
        dispatch(machineUpdated({ id: machine.id, output: newOutput, efficiency: newEff }));
      }
      showToast(`Production logged: ${log.output}m from ${log.machine}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to log production', 'error');
    }
  };

  const deleteProductionLog = async (logId) => {
    try {
      await api.delete(`/production-logs/${logId}`);
      dispatch(productionLogDeleted(logId));
      showToast('Production entry deleted', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete production entry', 'error');
    }
  };

  // WhatsApp Config Handlers
  const setAdminWhatsAppPhone = async (phone) => {
    dispatch(setAdminPhoneAction(phone));
    try {
      await api.patch('/settings', { adminWhatsAppPhone: phone });
    } catch (e) {}
  };

  const setGodownWhatsAppPhone = async (phone) => {
    dispatch(setGodownPhoneAction(phone));
    try {
      await api.patch('/settings', { godownWhatsAppPhone: phone });
    } catch (e) {}
  };

  const setSalesWhatsAppPhone = async (phone) => {
    dispatch(setSalesPhoneAction(phone));
    try {
      await api.patch('/settings', { salesWhatsAppPhone: phone });
    } catch (e) {}
  };

  const openWhatsAppShare = ({ title, message, category = 'general', defaultPhone = '', entityName = '' }) => {
    dispatch(openWhatsAppShareModal({
      title: title || 'Send WhatsApp Report',
      message: message || '',
      category,
      defaultPhone: defaultPhone || adminWhatsAppPhone,
      entityName
    }));
  };

  const closeWhatsAppShare = () => {
    dispatch(closeWhatsAppShareModal());
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
    productionLogs,
    selectedMachineId,
    activeOperatorLoom,
    toast,
    isDataManagerOpen,
    isAddMachineOpen,
    isMobileMenuOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed: (v) => dispatch(setIsSidebarCollapsed(v)),
    toggleSidebar: () => dispatch(toggleSidebar()),
    isWhatsAppModalOpen,
    isUsersModalOpen,
    isScanModalOpen,
    setIsScanModalOpen: (v) => dispatch(setIsScanModalOpen(v)),
    inspectRollCode,
    setInspectRollCode: (v) => dispatch(setInspectRollCode(v)),
    activeLabelRoll,
    setActiveLabelRoll: (v) => dispatch(setActiveLabelRoll(v)),
    idleWarning,
    stayLoggedIn,
    setIsDataManagerOpen: (v) => dispatch(setIsDataManagerOpen(v)),
    setIsAddMachineOpen: (v) => dispatch(setIsAddMachineOpen(v)),
    setIsMobileMenuOpen: (v) => dispatch(setIsMobileMenuOpen(v)),
    setIsWhatsAppModalOpen: (v) => dispatch(setIsWhatsAppModalOpen(v)),
    setIsUsersModalOpen: (v) => dispatch(setIsUsersModalOpen(v)),
    adminWhatsAppPhone,
    setAdminWhatsAppPhone,
    godownWhatsAppPhone,
    setGodownWhatsAppPhone,
    salesWhatsAppPhone,
    setSalesWhatsAppPhone,
    whatsAppShareData,
    openWhatsAppShare,
    closeWhatsAppShare,
    networkUrl,
    publicScanBaseUrl,
    setPublicScanBaseUrl: (v) => dispatch(setPublicScanBaseUrlAction(v)),
    setActiveTab: (v) => dispatch(setActiveTab(v)),
    setTheme: (v) => dispatch(setTheme(v)),
    setSoundEnabled: (v) => dispatch(setSoundEnabled(v)),
    setSelectedMachineId: (v) => dispatch(setSelectedMachineId(v)),
    setActiveOperatorLoom: (v) => dispatch(setActiveOperatorLoom(v)),
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
