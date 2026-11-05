import { createSlice } from '@reduxjs/toolkit';

const DEFAULT_ADMIN_PHONE = '+91 75675 74107';

const initialState = {
  adminWhatsAppPhone: DEFAULT_ADMIN_PHONE,
  godownWhatsAppPhone: DEFAULT_ADMIN_PHONE,
  salesWhatsAppPhone: DEFAULT_ADMIN_PHONE,
  networkUrl: 'http://192.168.1.7:5173',
  publicScanBaseUrl: ''
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setAllSettings: (state, action) => {
      const s = action.payload || {};
      if (s.adminWhatsAppPhone) state.adminWhatsAppPhone = s.adminWhatsAppPhone;
      if (s.godownWhatsAppPhone) state.godownWhatsAppPhone = s.godownWhatsAppPhone;
      if (s.salesWhatsAppPhone) state.salesWhatsAppPhone = s.salesWhatsAppPhone;
      if (s.networkUrl) state.networkUrl = s.networkUrl;
      if (s.publicScanBaseUrl) state.publicScanBaseUrl = s.publicScanBaseUrl;
    },
    setAdminWhatsAppPhone: (state, action) => {
      state.adminWhatsAppPhone = action.payload;
    },
    setGodownWhatsAppPhone: (state, action) => {
      state.godownWhatsAppPhone = action.payload;
    },
    setSalesWhatsAppPhone: (state, action) => {
      state.salesWhatsAppPhone = action.payload;
    },
    setPublicScanBaseUrl: (state, action) => {
      state.publicScanBaseUrl = action.payload;
    }
  }
});

export const {
  setAllSettings,
  setAdminWhatsAppPhone,
  setGodownWhatsAppPhone,
  setSalesWhatsAppPhone,
  setPublicScanBaseUrl
} = settingsSlice.actions;

export const selectSettings = (state) => state.settings;
export const selectAdminWhatsAppPhone = (state) => state.settings.adminWhatsAppPhone;
export const selectGodownWhatsAppPhone = (state) => state.settings.godownWhatsAppPhone;
export const selectSalesWhatsAppPhone = (state) => state.settings.salesWhatsAppPhone;
export const selectNetworkUrl = (state) => state.settings.networkUrl;
export const selectPublicScanBaseUrl = (state) => state.settings.publicScanBaseUrl;

export default settingsSlice.reducer;
