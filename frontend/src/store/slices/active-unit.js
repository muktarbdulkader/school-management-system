import { createSlice } from '@reduxjs/toolkit';

const ManagerUnits = createSlice({
  name: 'managerUnits',
  initialState: {
    units: [],
    activeUnit: null
  },

  reducers: {
    storeUnits: (state, action) => {
      state.units = action.payload;
    },
    setActiveUnit: (state, action) => {
      state.activeUnit = action.payload;
    }
  }
});

export const { storeUnits, setActiveUnit } = ManagerUnits.actions;
export default ManagerUnits;
