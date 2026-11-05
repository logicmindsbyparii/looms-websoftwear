import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  isAuthLoading: true,
  userRole: 'Admin', // 'Admin' | 'Supervisor' | 'Operator'
  currentUser: {
    username: 'Admin',
    displayName: 'Mill Administrator',
    avatar: 'A'
  },
  userPermissions: [],
  isPreviewMode: false
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthState: (state, action) => {
      const { user, permissions } = action.payload;
      state.isAuthenticated = true;
      state.currentUser = user;
      state.userRole = user.role || 'Operator';
      state.userPermissions = permissions || [];
      state.isAuthLoading = false;
      state.isPreviewMode = false;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload };
    },
    setUserRole: (state, action) => {
      state.userRole = action.payload;
    },
    setPreviewMode: (state, action) => {
      state.isPreviewMode = action.payload;
    },
    setAuthLoading: (state, action) => {
      state.isAuthLoading = action.payload;
    },
    logoutSuccess: (state) => {
      state.isAuthenticated = false;
      state.currentUser = null;
      state.userRole = 'Operator';
      state.userPermissions = [];
      state.isPreviewMode = false;
      state.isAuthLoading = false;
    }
  }
});

export const {
  setAuthState,
  setCurrentUser,
  setUserRole,
  setPreviewMode,
  setAuthLoading,
  logoutSuccess
} = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectCurrentUser = (state) => state.auth.currentUser;
export const selectUserRole = (state) => state.auth.userRole;
export const selectUserPermissions = (state) => state.auth.userPermissions;
export const selectIsPreviewMode = (state) => state.auth.isPreviewMode;
export const selectIsAuthLoading = (state) => state.auth.isAuthLoading;

export default authSlice.reducer;

