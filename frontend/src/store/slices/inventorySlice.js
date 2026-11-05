import { createSlice, createSelector } from '@reduxjs/toolkit';

const initialState = {
  workers: [],
  stockLevels: [],
  readyGoods: [],
  brokers: [],
  salesOrders: [],
  productionLogs: []
};

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setAllInventory: (state, action) => {
      const {
        workers,
        stockLevels,
        readyGoods,
        brokers,
        salesOrders,
        productionLogs
      } = action.payload;

      if (workers !== undefined) state.workers = workers || [];
      if (stockLevels !== undefined) state.stockLevels = stockLevels || [];
      if (readyGoods !== undefined) state.readyGoods = readyGoods || [];
      if (brokers !== undefined) state.brokers = brokers || [];
      if (salesOrders !== undefined) state.salesOrders = salesOrders || [];
      if (productionLogs !== undefined) state.productionLogs = productionLogs || [];
    },

    // Workers
    setWorkers: (state, action) => {
      state.workers = action.payload || [];
    },
    workerCreated: (state, action) => {
      state.workers = [action.payload, ...state.workers.filter(w => w.id !== action.payload.id)];
    },
    workerUpdated: (state, action) => {
      state.workers = state.workers.map(w => w.id === action.payload.id ? action.payload : w);
    },
    workerDeleted: (state, action) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload;
      state.workers = state.workers.filter(w => w.id !== id);
    },

    // Stock Levels (Yarn & Raw Material)
    setStockLevels: (state, action) => {
      state.stockLevels = action.payload || [];
    },
    stockCreated: (state, action) => {
      state.stockLevels = [action.payload, ...state.stockLevels.filter(s => s.id !== action.payload.id)];
    },
    stockUpdated: (state, action) => {
      state.stockLevels = state.stockLevels.map(s => s.id === action.payload.id ? action.payload : s);
    },
    stockDeleted: (state, action) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload;
      state.stockLevels = state.stockLevels.filter(s => s.id !== id);
    },

    // Ready Goods
    setReadyGoods: (state, action) => {
      state.readyGoods = action.payload || [];
    },
    readyGoodsCreated: (state, action) => {
      state.readyGoods = [action.payload, ...state.readyGoods.filter(r => r.id !== action.payload.id)];
    },
    readyGoodsUpdated: (state, action) => {
      state.readyGoods = state.readyGoods.map(r => r.id === action.payload.id ? action.payload : r);
    },
    readyGoodsDeleted: (state, action) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload;
      state.readyGoods = state.readyGoods.filter(r => r.id !== id);
    },

    // Brokers
    setBrokers: (state, action) => {
      state.brokers = action.payload || [];
    },
    brokerCreated: (state, action) => {
      state.brokers = [action.payload, ...state.brokers.filter(b => b.id !== action.payload.id)];
    },
    brokerDeleted: (state, action) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload;
      state.brokers = state.brokers.filter(b => b.id !== id);
    },

    // Sales Orders
    setSalesOrders: (state, action) => {
      state.salesOrders = action.payload || [];
    },
    salesOrderCreated: (state, action) => {
      state.salesOrders = [action.payload, ...state.salesOrders.filter(o => o.id !== action.payload.id)];
    },
    salesOrderUpdated: (state, action) => {
      state.salesOrders = state.salesOrders.map(o => o.id === action.payload.id ? action.payload : o);
    },
    salesOrderDeleted: (state, action) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload;
      state.salesOrders = state.salesOrders.filter(o => o.id !== id);
    },

    // Production Logs
    setProductionLogs: (state, action) => {
      state.productionLogs = action.payload || [];
    },
    productionLogCreated: (state, action) => {
      state.productionLogs = [action.payload, ...state.productionLogs.filter(p => p.id !== action.payload.id)];
    },
    productionLogDeleted: (state, action) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload;
      state.productionLogs = state.productionLogs.filter(p => p.id !== id);
    }
  }
});

export const {
  setAllInventory,
  setWorkers,
  workerCreated,
  workerUpdated,
  workerDeleted,
  setStockLevels,
  stockCreated,
  stockUpdated,
  stockDeleted,
  setReadyGoods,
  readyGoodsCreated,
  readyGoodsUpdated,
  readyGoodsDeleted,
  setBrokers,
  brokerCreated,
  brokerDeleted,
  setSalesOrders,
  salesOrderCreated,
  salesOrderUpdated,
  salesOrderDeleted,
  setProductionLogs,
  productionLogCreated,
  productionLogDeleted
} = inventorySlice.actions;

// Selectors
export const selectWorkers = (state) => state.inventory.workers;
export const selectActiveWorkers = createSelector(
  [selectWorkers],
  (workers) => (workers || []).filter(w => w.status === 'Active' || w.status === 'active')
);

export const selectStockLevels = (state) => state.inventory.stockLevels;
export const selectReadyGoods = (state) => state.inventory.readyGoods;
export const selectBrokers = (state) => state.inventory.brokers;
export const selectSalesOrders = (state) => state.inventory.salesOrders;
export const selectProductionLogs = (state) => state.inventory.productionLogs;

export default inventorySlice.reducer;

