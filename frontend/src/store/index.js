import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import machinesReducer from './slices/machinesSlice';
import alarmsReducer from './slices/alarmsSlice';
import inventoryReducer from './slices/inventorySlice';
import uiReducer from './slices/uiSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    machines: machinesReducer,
    alarms: alarmsReducer,
    inventory: inventoryReducer,
    ui: uiReducer,
    settings: settingsReducer
  },
  devTools: process.env.NODE_ENV !== 'production'
});

// Typed or convenience hooks
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

export default store;

