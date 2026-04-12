import PropTypes from 'prop-types';

// material-ui
import { Typography, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';

// third-party
import { BrowserView, MobileView } from 'react-device-detect';

// project imports
import { drawerWidth } from 'store/constant';
import MenuList from './MenuList';
import LogoSection from '../LogoSection';
import HomeMenu from './HomeMenu';
import { ActiveUnitSelector } from './active-unit-selector';
import { useDispatch, useSelector } from 'react-redux';
import StudentDropdown from 'views/dashboard/studentsComponets/StudentDropdown';
import { useEffect, useState } from 'react';
import {
  setRelationshipId,
  setStudentData,
  setStudentId,
  setStudents,
} from 'store/slices/active-student';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';
// import { toast } from 'react-toastify';

// ==============================|| SIDEBAR DRAWER ||============================== //

const Sidebar = ({ drawerOpen, drawerToggle, window }) => {
  const theme = useTheme();
  const matchUpMd = useMediaQuery(theme.breakpoints.up('md'));
  const [students, setStudents] = useState([]);
  const dispatch = useDispatch();
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [behavioralAndAcademic, setBehavioralAndAcademic] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [classSchedule, setClassSchedule] = useState([]);
  const studentId = useSelector((state) => state.student.studentId);
  const relationshipId = useSelector((state) => state.student.relationshipId);

  const [error, setError] = useState(null);
  const auth = getRolesAndPermissionsFromToken();
  const normalizedAuth = auth ? auth.map((role) => role.toLowerCase()) : [];
  const isParent = normalizedAuth.includes('parent');

  const handleStudentChange = (event) => {
    const relationshipId = event.target.value;
    const selectedStudent = students.find((s) => s.id === relationshipId);

    if (selectedStudent && selectedStudent.student_details) {
      dispatch(setRelationshipId(relationshipId)); // Store relationship ID
      dispatch(setStudentId(selectedStudent.student_details.id)); // Store student ID
    }
  };

  const handleStudentSelect = (studentData) => {
    dispatch(setStudentData(studentData));

    // Extract and set all the necessary data for your components
    if (studentData.schedule) {
      setClassSchedule(studentData.schedule);
    }
    if (studentData.upcoming_assignments) {
      setUpcomingAssignments(studentData.upcoming_assignments);
    }
    if (studentData.health) {
      setHealthData(studentData.health);
    }
    if (studentData.behavior_ratings && studentData.attendance) {
      const ratingsArray = [];

      if (studentData.behavior_ratings) {
        ratingsArray.push({
          percentage: studentData.behavior_ratings.average_rating || 0,
          color: '#2196f3',
          label: 'Behavior Rating',
        });
      }
      if (studentData.attendance) {
        ratingsArray.push({
          percentage: studentData.attendance.average_attendance || 0,
          color: '#22C55E',
          label: 'Average Attendance',
        });
      }

      setBehavioralAndAcademic(ratingsArray);
    }
  };

  const fetchStudents = async () => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.parentStudents}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok)
        throw new Error(responseData.message || 'Failed to fetch students');

      if (responseData.success) {
        setStudents(responseData.data); // Use local state

        if (responseData.data.length > 0 && !studentId) {
          const firstStudent = responseData.data[0];
          dispatch(setRelationshipId(firstStudent.id));
          dispatch(setStudentId(firstStudent.student_details.id));
        }
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const managerUnits = useSelector((state) => state.managerUnits);

  const drawer = (
    <>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          width: drawerWidth,
          zIndex: 1,
          paddingY: 1.6,
          paddingX: 2,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <LogoSection />

        {isParent && (
          <Box
            sx={{
              mt: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: theme.palette.grey[50],
              boxShadow: '0px 2px 6px rgba(0,0,0,0.05)',
            }}
          >
            <StudentDropdown
              students={students}
              selectedStudentId={relationshipId}
              handleStudentChange={handleStudentChange}
              onStudentSelect={handleStudentSelect}
              fullWidth
            />
          </Box>
        )}
      </Box>
      <BrowserView
        style={{
          marginTop: 6,
          paddingLeft: 6,
          paddingRight: 12,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {managerUnits?.units.length > 1 ? (
          <ActiveUnitSelector
            data={managerUnits?.units}
            active={managerUnits.activeUnit}
            sx={{ my: 2 }}
          />
        ) : null}
        <HomeMenu />
        <MenuList />
      </BrowserView>
      <MobileView>
        <Box sx={{ px: 2 }}>
          <HomeMenu />
          <MenuList />
        </Box>
      </MobileView>
    </>
  );

  const container =
    window !== undefined ? () => window.document.body : undefined;

  return (
    <Box
      component="nav"
      sx={{ flexShrink: { md: 50 }, width: matchUpMd ? drawerWidth : 'auto' }}
      aria-label="drawers"
    >
      <Drawer
        container={container}
        variant={matchUpMd ? 'persistent' : 'temporary'}
        anchor="left"
        open={drawerOpen}
        onClose={drawerToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            background: theme.palette.background.paper,
          },
        }}
        ModalProps={{ keepMounted: true }}
        color="inherit"
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

Sidebar.propTypes = {
  drawerOpen: PropTypes.bool,
  drawerToggle: PropTypes.func,
  window: PropTypes.object,
};

export default Sidebar;
