// store/slices/active-student.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  studentId: null,
  relationshipId: null,
  studentData: {},
  students: [], // Add this to store the list of students
};

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    setStudentId: (state, action) => {
      state.studentId = action.payload;
    },
    setRelationshipId: (state, action) => {
      state.relationshipId = action.payload;
    },
    setStudentData: (state, action) => {
      state.studentData = action.payload;
    },
    setStudents: (state, action) => {
      // Add this new action
      state.students = action.payload;
    },
    setActiveStudent: (state, action) => {
      const { relationshipId, studentId, studentData } = action.payload;
      state.relationshipId = relationshipId;
      state.studentId = studentId;
      state.studentData = studentData || {};
    },
    clearStudent: (state) => {
      state.studentId = null;
      state.relationshipId = null;
      state.studentData = {};
      state.students = []; // Also clear students
    },
  },
});

// Export the new action
export const {
  setStudentId,
  setRelationshipId,
  setStudentData,
  setStudents, // Add this export
  clearStudent,
} = studentSlice.actions;

export default studentSlice.reducer;
