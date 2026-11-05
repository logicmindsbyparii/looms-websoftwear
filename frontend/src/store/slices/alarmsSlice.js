import { createSlice, createSelector } from '@reduxjs/toolkit';

// Centralized deduplication helper
function deduplicateAlarms(alarms) {
  if (!Array.isArray(alarms)) return [];
  return alarms.filter((a, index, self) =>
    index === self.findIndex(o =>
      (o.id && a.id && o.id === a.id) ||
      (o._id && a._id && o._id === a._id) ||
      (o.code === 'E-STOP' && a.code === 'E-STOP' && o.time === a.time) ||
      (o.title === a.title && o.time === a.time && o.machine === a.machine)
    )
  );
}

const initialState = {
  items: [],
  severityFilter: 'all', // 'all' | 'critical' | 'warning' | 'info'
  loading: false
};

export const alarmsSlice = createSlice({
  name: 'alarms',
  initialState,
  reducers: {
    setAlarms: (state, action) => {
      state.items = deduplicateAlarms(action.payload || []);
    },
    alarmCreated: (state, action) => {
      const newAlarm = action.payload;
      if (!newAlarm) return;
      // Prepend and enforce uniqueness
      state.items = deduplicateAlarms([newAlarm, ...state.items]);
    },
    alarmCleared: (state, action) => {
      const alarmId = typeof action.payload === 'object' ? action.payload.id : action.payload;
      state.items = state.items.filter(a => a.id !== alarmId && a._id !== alarmId);
    },
    allAlarmsCleared: (state) => {
      state.items = [];
    },
    setSeverityFilter: (state, action) => {
      state.severityFilter = action.payload || 'all';
    }
  }
});

export const {
  setAlarms,
  alarmCreated,
  alarmCleared,
  allAlarmsCleared,
  setSeverityFilter
} = alarmsSlice.actions;

// Base Selectors
export const selectAllAlarms = (state) => state.alarms.items;
export const selectSeverityFilter = (state) => state.alarms.severityFilter;

// Memoized Selectors (100% duplicate-free)
export const selectCriticalAlarms = createSelector(
  [selectAllAlarms],
  (alarms) => alarms.filter(a => a.type === 'critical')
);

export const selectWarningAlarms = createSelector(
  [selectAllAlarms],
  (alarms) => alarms.filter(a => a.type === 'warning')
);

export const selectInfoAlarms = createSelector(
  [selectAllAlarms],
  (alarms) => alarms.filter(a => a.type === 'info')
);

export const selectFilteredAlarms = createSelector(
  [selectAllAlarms, selectSeverityFilter],
  (alarms, filter) => {
    if (!filter || filter === 'all') return alarms;
    return alarms.filter(a => a.type === filter);
  }
);

export const selectAlarmCounts = createSelector(
  [selectAllAlarms],
  (alarms) => ({
    total: alarms.length,
    critical: alarms.filter(a => a.type === 'critical').length,
    warning: alarms.filter(a => a.type === 'warning').length,
    info: alarms.filter(a => a.type === 'info').length
  })
);

export default alarmsSlice.reducer;
