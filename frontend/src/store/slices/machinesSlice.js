import { createSlice, createSelector } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  selectedMachineId: null,
  activeOperatorLoom: null,
  loading: false
};

export const machinesSlice = createSlice({
  name: 'machines',
  initialState,
  reducers: {
    setMachines: (state, action) => {
      state.items = action.payload || [];
    },
    machineCreated: (state, action) => {
      const exists = state.items.some(m => m.id === action.payload.id);
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    machineUpdated: (state, action) => {
      const index = state.items.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    machineDeleted: (state, action) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload;
      state.items = state.items.filter(m => m.id !== id);
      if (state.selectedMachineId === id) {
        state.selectedMachineId = null;
      }
      if (state.activeOperatorLoom === id) {
        state.activeOperatorLoom = null;
      }
    },
    massMachinesUpdated: (state, action) => {
      state.items = action.payload || [];
    },
    setSelectedMachineId: (state, action) => {
      state.selectedMachineId = action.payload;
    },
    setActiveOperatorLoom: (state, action) => {
      state.activeOperatorLoom = action.payload;
    }
  }
});

export const {
  setMachines,
  machineCreated,
  machineUpdated,
  machineDeleted,
  massMachinesUpdated,
  setSelectedMachineId,
  setActiveOperatorLoom
} = machinesSlice.actions;

// Base Selectors
export const selectMachines = (state) => state.machines.items;
export const selectSelectedMachineId = (state) => state.machines.selectedMachineId;
export const selectActiveOperatorLoom = (state) => state.machines.activeOperatorLoom;

// Memoized Selectors to eliminate duplicate logic across Dashboard, Supervisor, Control, Operator
export const selectSelectedMachine = createSelector(
  [selectMachines, selectSelectedMachineId],
  (machines, selectedId) => machines.find(m => m.id === selectedId) || null
);

export const selectActiveOperatorMachine = createSelector(
  [selectMachines, selectActiveOperatorLoom],
  (machines, activeLoomId) => {
    if (!machines || machines.length === 0) return null;
    return machines.find(m => m.id === activeLoomId) || machines[0];
  }
);

export const selectRunningMachines = createSelector(
  [selectMachines],
  (machines) => (machines || []).filter(m => m.status === 'running')
);

export const selectStoppedMachines = createSelector(
  [selectMachines],
  (machines) => (machines || []).filter(m => m.status === 'stopped' || m.status === 'error')
);

export const selectIdleMachines = createSelector(
  [selectMachines],
  (machines) => (machines || []).filter(m => m.status === 'idle' || m.status === 'maintenance')
);

// Unified Fleet Operational Metrics (prevents duplicate calculations everywhere)
export const selectMachineMetrics = createSelector(
  [selectMachines],
  (machines) => {
    const list = machines || [];
    const total = list.length;
    const running = list.filter(m => m.status === 'running').length;
    const stopped = list.filter(m => m.status === 'stopped' || m.status === 'error').length;
    const idle = list.filter(m => m.status === 'idle').length;
    const maintenance = list.filter(m => m.status === 'maintenance').length;
    const totalOutputMeters = list.reduce((sum, m) => sum + (Number(m.output) || 0), 0);
    const avgEfficiency = total > 0
      ? Math.round(list.reduce((sum, m) => sum + (Number(m.efficiency) || 0), 0) / total)
      : 0;

    return {
      total,
      running,
      stopped,
      idle,
      maintenance,
      totalOutputMeters,
      avgEfficiency
    };
  }
);

export default machinesSlice.reducer;

