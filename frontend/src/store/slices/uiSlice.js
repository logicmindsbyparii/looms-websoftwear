import { createSlice } from '@reduxjs/toolkit';

const getInitialSidebarCollapsed = () => {
  try {
    return localStorage.getItem('loomus_sidebar_collapsed') === 'true';
  } catch {
    return false;
  }
};

const initialState = {
  activeTab: 'dashboard',
  theme: 'light',
  soundEnabled: true,
  powerLoadPercent: 0,
  isSidebarCollapsed: getInitialSidebarCollapsed(),
  isMobileMenuOpen: false,
  isDataManagerOpen: false,
  isAddMachineOpen: false,
  isWhatsAppModalOpen: false,
  isUsersModalOpen: false,
  isScanModalOpen: false,
  inspectRollCode: null,
  activeLabelRoll: null,
  idleWarning: { show: false, countdown: 60 },
  toast: { show: false, message: '', type: 'info' },
  whatsAppShareData: {
    isOpen: false,
    title: '',
    message: '',
    category: 'general',
    defaultPhone: '+91 96646 83069',
    entityName: ''
  }
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setSoundEnabled: (state, action) => {
      state.soundEnabled = action.payload;
    },
    setPowerLoadPercent: (state, action) => {
      state.powerLoadPercent = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
      try {
        localStorage.setItem('loomus_sidebar_collapsed', String(state.isSidebarCollapsed));
      } catch (e) {}
    },
    setIsSidebarCollapsed: (state, action) => {
      state.isSidebarCollapsed = action.payload;
      try {
        localStorage.setItem('loomus_sidebar_collapsed', String(action.payload));
      } catch (e) {}
    },
    setIsMobileMenuOpen: (state, action) => {
      state.isMobileMenuOpen = action.payload;
    },
    setIsDataManagerOpen: (state, action) => {
      state.isDataManagerOpen = action.payload;
    },
    setIsAddMachineOpen: (state, action) => {
      state.isAddMachineOpen = action.payload;
    },
    setIsWhatsAppModalOpen: (state, action) => {
      state.isWhatsAppModalOpen = action.payload;
    },
    setIsUsersModalOpen: (state, action) => {
      state.isUsersModalOpen = action.payload;
    },
    setIsScanModalOpen: (state, action) => {
      state.isScanModalOpen = action.payload;
    },
    setInspectRollCode: (state, action) => {
      state.inspectRollCode = action.payload;
    },
    setActiveLabelRoll: (state, action) => {
      state.activeLabelRoll = action.payload;
    },
    setIdleWarning: (state, action) => {
      state.idleWarning = { ...state.idleWarning, ...action.payload };
    },
    showToastNotification: (state, action) => {
      state.toast = {
        show: true,
        message: action.payload.message || '',
        type: action.payload.type || 'info'
      };
    },
    hideToastNotification: (state) => {
      state.toast.show = false;
    },
    openWhatsAppShareModal: (state, action) => {
      state.whatsAppShareData = {
        isOpen: true,
        title: action.payload.title || '',
        message: action.payload.message || '',
        category: action.payload.category || 'general',
        defaultPhone: action.payload.defaultPhone || '+91 96646 83069',
        entityName: action.payload.entityName || ''
      };
    },
    closeWhatsAppShareModal: (state) => {
      state.whatsAppShareData.isOpen = false;
    }
  }
});

export const {
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
  closeWhatsAppShareModal
} = uiSlice.actions;

// Selectors
export const selectActiveTab = (state) => state.ui.activeTab;
export const selectTheme = (state) => state.ui.theme;
export const selectSoundEnabled = (state) => state.ui.soundEnabled;
export const selectPowerLoadPercent = (state) => state.ui.powerLoadPercent;
export const selectIsSidebarCollapsed = (state) => state.ui.isSidebarCollapsed;
export const selectIsMobileMenuOpen = (state) => state.ui.isMobileMenuOpen;
export const selectIsDataManagerOpen = (state) => state.ui.isDataManagerOpen;
export const selectIsAddMachineOpen = (state) => state.ui.isAddMachineOpen;
export const selectIsWhatsAppModalOpen = (state) => state.ui.isWhatsAppModalOpen;
export const selectIsUsersModalOpen = (state) => state.ui.isUsersModalOpen;
export const selectIsScanModalOpen = (state) => state.ui.isScanModalOpen;
export const selectInspectRollCode = (state) => state.ui.inspectRollCode;
export const selectActiveLabelRoll = (state) => state.ui.activeLabelRoll;
export const selectIdleWarning = (state) => state.ui.idleWarning;
export const selectToast = (state) => state.ui.toast;
export const selectWhatsAppShareData = (state) => state.ui.whatsAppShareData;

export default uiSlice.reducer;

