import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import StudentList from './Studentslists';
import AttendanceCalendar from './AttendanceCalendar';
import AssignmentsDashboard from './TeacherAssignments';
import AddButton from 'ui-component/buttons/AddButton';
import BehaviorWellbeingTable from './BehaviorAndWellbeing';
import PerformanceDashboard from './PerformanceAnalytic';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import AttendanceChart from './AttendanceGraph';
import LessonPlanningPanel from './LessonPlanningPanel';

const ClassDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { classId, sectionId, subjectId } = useParams();
  const stateData = location.state || {};
  const dataFetchedRef = useRef(false);

  const [classData, setClassData] = useState(stateData.classData || {
    class_id: classId,
    section_id: sectionId === 'null' ? null : sectionId,
    id: subjectId,
    name: stateData.classData?.name || 'Class'
  });

  // Get active tab from navigation state, default to 0 (Overview)
  const [activeTab, setActiveTab] = useState(stateData.activeTab || 0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Don't use cached attendanceData from overview - it lacks student attendance percentages
  const [attendanceData, setAttendanceData] = useState(null);
  const [summaryData, setSummaryData] = useState([]);
  const [studentsData, setStudentsData] = useState([]);
  const [studentStats, setStudentStats] = useState(null);
  const [assignmentsData, setAssignmentsData] = useState([]);
  const [behaviorNotesData, setBehaviorNotesData] = useState([]);
  const [assessmentsData, setAssessmentsData] = useState([]);
  const [assessmentsSummary, setAssessmentsSummary] = useState(null);
  const [openAssessmentDialog, setOpenAssessmentDialog] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    name: '',
    exam_type: 'unit_test',
    start_date: '',
    end_date: '',
    description: '',
    max_score: 100
  });
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');

  const [headerData, setHeaderData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial data fetch - only runs once when component mounts with classId
  useEffect(() => {
    if (classId && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      fetchAttendanceData();
      fetchAssessments();
    } else if (!classId) {
      setDefaultData();
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // Refresh data when switching to Behavior tab to get latest notes
  useEffect(() => {
    if (activeTab === 7 && classData?.class_id) {
      fetchAttendanceData(true); // silent refresh
    }
  }, [activeTab]);

  // const fetchAttendanceData = async () => {
  //   try {
  //     const token = await GetToken();
  //     const Api = `${Backend.auth}${Backend.teachersClassDashboard}/${classData.class_id}/${classData.section_id}/${classItem.id}`;
  //     const header = {
  //       Authorization: `Bearer ${token}`,
  //       accept: 'application/json',
  //       'Content-Type': 'application/json',
  //     };

  //     const response = await fetch(Api, { method: 'GET', headers: header });
  //     const responseData = await response.json();

  //     if (responseData.success) {
  //       setSummaryData(responseData.data.summary);
  //       setStudentsData(responseData.data.students);
  //       setStudentStats(responseData.data.students?.stats || {});
  //       setAssignmentsData(attendanceData.assignments || []);
  //       setBehaviorNotesData(attendanceData.behavior_notes || []);
  //       setHeaderData(responseData.data.header);
  //     } else {
  //       toast.warning(responseData.message);
  //       setDefaultData();
  //     }
  //   } catch (error) {
  //     toast.error(error.message);
  //     setDefaultData();
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchAttendanceData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = await GetToken();
      // Replace classItem.id with classData.id
      const Api = `${Backend.auth}${Backend.teachersClassDashboard}/${classData.class_id}/${classData.section_id}/${classData.id}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();
      console.log('Fetched Attendance Data:', responseData);
      if (responseData.success) {
        setSummaryData(Array.isArray(responseData.data.summary_cards) ? responseData.data.summary_cards : []);
        setStudentsData(responseData.data?.students?.list || []);
        setStudentStats(responseData.data?.students?.stats || {});
        setAssignmentsData(responseData.data?.assignments || []);
        setBehaviorNotesData(responseData.data?.behavior_notes || []);
        setHeaderData(responseData.data?.header);

        // Update classData with ID-compatible fields
        setClassData(prev => ({
          ...prev,
          name: responseData.data?.class?.name,
          class_id: responseData.data?.class?.id,
          section_id: responseData.data?.section?.id,
          branch_id: responseData.data?.class?.branch_id
        }));
      } else {
        toast.warning(responseData.message);
        setDefaultData();
      }
    } catch (error) {
      toast.error(error.message);
      setDefaultData();
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchAssessments = async () => {
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.teachersClassAssessments}/${classData.class_id}/${classData.section_id}/${classData.id}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();
      console.log('Fetched Assessments Data:', responseData);

      if (responseData.success) {
        setAssessmentsData(responseData.data.assessments || []);
        setAssessmentsSummary(responseData.data.summary || {});
      } else {
        console.warn('Failed to fetch assessments:', responseData.message);
        setAssessmentsData([]);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setAssessmentsData([]);
    }
  };

  const fetchTerms = async () => {
    try {
      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.terms}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        setTerms(responseData.data || []);
        // Set current term as default
        const currentTerm = responseData.data.find(t => t.is_current);
        if (currentTerm) {
          setSelectedTerm(currentTerm.id);
        }
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  const handleOpenAssessmentDialog = () => {
    fetchTerms();
    setOpenAssessmentDialog(true);
  };

  const handleCloseAssessmentDialog = () => {
    setOpenAssessmentDialog(false);
    setAssessmentForm({
      name: '',
      exam_type: 'midterm',
      start_date: '',
      end_date: '',
      description: '',
      max_score: 100
    });
  };

  const handleAssessmentFormChange = (e) => {
    const { name, value } = e.target;
    setAssessmentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateAssessment = async () => {
    try {
      if (!assessmentForm.name || !assessmentForm.start_date || !assessmentForm.end_date || !selectedTerm) {
        toast.error('Please fill in all required fields');
        return;
      }

      const token = await GetToken();
      const Api = `${Backend.auth}${Backend.exams}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const payload = {
        name: assessmentForm.name,
        term_id: selectedTerm,
        exam_type: assessmentForm.exam_type,
        subject_id: classData.id,
        class_id: classData.class_id,
        section_id: classData.section_id !== 'null' ? classData.section_id : null,
        start_date: assessmentForm.start_date,
        end_date: assessmentForm.end_date,
        description: assessmentForm.description,
        branch_id: classData.branch_id || null
      };

      console.log('Creating assessment:', payload);

      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      console.log('Create assessment response:', responseData);

      if (responseData.success) {
        toast.success('Assessment created successfully!');
        handleCloseAssessmentDialog();
        fetchAssessments(); // Refresh the list
      } else {
        toast.error(responseData.message || 'Failed to create assessment');
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast.error('Failed to create assessment');
    }
  };

  const refreshAssignments = async () => {
    try {
      const token = await GetToken();
      // Replace classItem.id with classData.id
      const Api = `${Backend.auth}${Backend.teachersClassDashboard}/${classData.class_id}/${classData.section_id}/${classData.id}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        setAssignmentsData(responseData.data.assignments || []);
      }
    } catch (error) {
      console.error('Error refreshing assignments:', error);
    }
  };

  const setDefaultData = () => {
    setSummaryData([
      { title: 'Total Students', value: 0, color: '#2196F3' },
      { title: 'Present', value: 0, color: '#4CAF50' },
      { title: 'Absent', value: 0, color: '#F44336' },
      { title: 'Late', value: 0, color: '#FF9800' }
    ]);
    setStudentsData([]);
    setAssignmentsData([]);
    setBehaviorNotesData([]);
    setHeaderData({
      section_name: classData?.class_section || 'Section',
      date: new Date().toISOString().split('T')[0],
      schedule: 'Not available',
    });
  };

  // Transform the summary_cards data into kpiData format
  const kpiData = Array.isArray(summaryData) && summaryData.length > 0
    ? summaryData.map((card, index) => {
      let color = '#2196F3'; // default blue
      let subtitle = '';

      switch (card.title) {
        case 'Class Average':
          color = '#4CAF50';
          subtitle = card.change
            ? `Trend: ${card.change}`
            : 'Overall performance';
          break;
        case 'Attendance Rate':
          color = '#FF9800';
          subtitle = 'Student attendance rate';
          break;
        case 'Assignment Completion':
          color = '#9C27B0';
          subtitle = 'Completed assignments';
          break;
        default:
          subtitle = card.title;
      }

      return {
        title: card.title,
        value: card.value,
        color: color,
        subtitle: subtitle,
        change: card.change,
        change_positive: card.change_positive,
      };
    })
    : [];

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
        <Typography>Loading class data...</Typography>
      </Box>
    );
  }
  console.log('KPI Data:', kpiData, summaryData);
  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box position="static">
        <Toolbar>
          <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
            {classData?.name || 'Class'} -{' '}
            {headerData?.section_name || classData?.class_section || 'Section'}
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              {headerData?.date || new Date().toISOString().split('T')[0]}
            </Typography>
          </Typography>
          {/* <AddButton title="Edit Class Info" /> */}
        </Toolbar>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {/* Tabs Navigation */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-flexContainer': {
                gap: 1,
              },
            }}
          >
            <Tab label="Overview" />
            <Tab label="Students" />
            <Tab label="Attendance" />
            <Tab label="Assignments" />
            <Tab label="Assessments" />
            <Tab label="Objectives" />
            <Tab label="Performance" />
            <Tab label="Behavior" />
          </Tabs>
        </Paper>

        {/* KPI Cards - Only show on Overview tab */}
        {activeTab === 0 && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {kpiData.map((kpi, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography
                      color="textSecondary"
                      gutterBottom
                      variant="body2"
                    >
                      {kpi.title}
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ color: kpi.color, fontWeight: 600 }}
                    >
                      {kpi.value}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {kpi.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab Content */}
        {activeTab === 1 && (
          <Grid item xs={12} lg={10} sx={{ mb: 4 }}>
            <StudentList
              students={studentsData}
              classId={classData?.class_id}
              sectionId={classData?.section_id}
              studentStats={studentStats}
              sx={{ mb: 4 }}
            />
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid sx={{ mb: 4 }}>
            <AttendanceChart
              studentsData={studentsData}
              classData={classData}
              headerData={headerData}
              subjectId={subjectId}
            />
          </Grid>
        )}

        {activeTab === 3 && (
          <Grid sx={{ mb: 4 }}>
            <AssignmentsDashboard
              assignmentsData={assignmentsData}
              refreshAssignments={refreshAssignments}
              classData={classData}
            />
          </Grid>
        )}

        {activeTab === 4 && (
          <Grid sx={{ mb: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Assessments & Exams
                  </Typography>
                  <AddButton
                    title="Add Assessment"
                    onPress={handleOpenAssessmentDialog}
                    hideIcon
                  />
                </Box>

                {assessmentsData.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="textSecondary">
                      No assessments found for this class
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {assessmentsData.map((assessment) => (
                      <Grid item xs={12} md={6} key={assessment.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {assessment.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {assessment.exam_type_display}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  bgcolor: assessment.status === 'completed' ? '#e8f5e9' : '#fff3e0',
                                  color: assessment.status === 'completed' ? '#2e7d32' : '#f57c00'
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {assessment.status === 'completed' ? 'Completed' : 'Active'}
                                </Typography>
                              </Box>
                            </Box>

                            <Grid container spacing={2} sx={{ mb: 2 }}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                  Start Date
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {assessment.start_date}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                  End Date
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {assessment.end_date}
                                </Typography>
                              </Grid>
                            </Grid>

                            <Grid container spacing={2} sx={{ mb: 2 }}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                  Max Score
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {assessment.max_score}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                  Type
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {assessment.exam_type_display}
                                </Typography>
                              </Grid>
                            </Grid>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <AddButton
                                title="View Results"
                                onPress={() => navigate('/grades', {
                                  state: {
                                    classId: classData.class_id,
                                    sectionId: classData.section_id,
                                    subjectId: classData.id,
                                    termId: assessment.term_id
                                  }
                                })}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Tab: Objectives */}
        {activeTab === 5 && (
          <Grid sx={{ mb: 4 }}>
            <LessonPlanningPanel classData={classData} />
          </Grid>
        )}

        {/* Tab: Performance */}
        {activeTab === 6 && (
          <Grid sx={{ mb: 4 }}>
            <PerformanceDashboard
              assessments={assessmentsData}
              studentsCount={studentsData.length}
              assessmentsSummary={assessmentsSummary}
            />
          </Grid>
        )}

        {/* Tab: Behavior */}
        {activeTab === 7 && (
          <Grid sx={{ mb: 4 }}>
            <BehaviorWellbeingTable behaviorNotesData={behaviorNotesData} />
          </Grid>
        )}

        {/* Assessment Dialog */}
        <Dialog open={openAssessmentDialog} onClose={handleCloseAssessmentDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Assessment</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {/* Display Subject Name */}
              <TextField
                fullWidth
                label="Subject"
                value={classData.name || 'Subject'}
                disabled
                sx={{ mb: 2 }}
                InputProps={{ readOnly: true }}
              />

              <TextField
                fullWidth
                label="Assessment Name"
                name="name"
                value={assessmentForm.name}
                onChange={handleAssessmentFormChange}
                sx={{ mb: 2 }}
                required
              />

              <TextField
                fullWidth
                select
                label="Term"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                sx={{ mb: 2 }}
                required
              >
                {terms.map((term) => (
                  <MenuItem key={term.id} value={term.id}>
                    {term.name} {term.is_current ? '(Current)' : ''}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                select
                label="Assessment Type"
                name="exam_type"
                value={assessmentForm.exam_type}
                onChange={handleAssessmentFormChange}
                sx={{ mb: 2 }}
                required
              >
                <MenuItem value="unit_test">Quiz</MenuItem>
                <MenuItem value="mid_term">Midterm Exam</MenuItem>
                <MenuItem value="final">Final Exam</MenuItem>
                <MenuItem value="diagnostic_test">Diagnostic Test</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    name="start_date"
                    value={assessmentForm.start_date}
                    onChange={handleAssessmentFormChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    name="end_date"
                    value={assessmentForm.end_date}
                    onChange={handleAssessmentFormChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                type="number"
                label="Maximum Score"
                name="max_score"
                value={assessmentForm.max_score}
                onChange={handleAssessmentFormChange}
                sx={{ mb: 2 }}
                inputProps={{ min: 1 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description (Optional)"
                name="description"
                value={assessmentForm.description}
                onChange={handleAssessmentFormChange}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAssessmentDialog}>Cancel</Button>
            <Button onClick={handleCreateAssessment} variant="contained">
              Create Assessment
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ClassDetail;
