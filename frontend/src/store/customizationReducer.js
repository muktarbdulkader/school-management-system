// customizationReducer.js
import { createSlice } from '@reduxjs/toolkit';
import config from 'config';

export const initialState = {
  isOpen: [],
  defaultId: 'default',
  fontFamily: config.fontFamily,
  borderRadius: config.borderRadius,
  backdropFilter: config.backdropFilter,
  opened: true,
  systemTheme: 'light',
  fiscalYears: [],
  selectedFiscalYear: {},
};

const customizationSlice = createSlice({
  name: 'customization',
  initialState,
  reducers: {
    menuOpen: (state, action) => {
      state.isOpen = [action.payload];
    },
    setMenu: (state, action) => {
      state.opened = action.payload;
    },
    setFontFamily: (state, action) => {
      state.fontFamily = action.payload;
    },
    setBorderRadius: (state, action) => {
      state.borderRadius = action.payload;
    },
    setBackdropFilter: (state, action) => {
      state.backdropFilter = action.payload;
    },
    setSystemTheme: (state, action) => {
      state.systemTheme = action.payload;
    },
    setFiscalYears: (state, action) => {
      state.fiscalYears = action.payload;
    },
    setSelectedFiscalYear: (state, action) => {
      state.selectedFiscalYear = action.payload;
    },
  },
});

export const {
  menuOpen,
  setMenu,
  setFontFamily,
  setBorderRadius,
  setBackdropFilter,
  setSystemTheme,
  setFiscalYears,
  setSelectedFiscalYear,
} = customizationSlice.actions;

export default customizationSlice.reducer;
