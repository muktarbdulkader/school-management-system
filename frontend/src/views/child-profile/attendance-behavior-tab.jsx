import { Box, Typography, Grid, Card, CardContent, CircularProgress, Alert } from "@mui/material"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import Backend from "services/backend"
import GetToken from "utils/auth-token"
import axios from "axios"
import dayjs from "dayjs"

export default function AttendanceBehaviorTab({ child, profile, data, userRole = 'parent' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [attendanceData, setAttendanceData] = useState([])
  const [behaviorData, setBehaviorData] = useState([])
  const isTeacher = userRole === 'teacher'

  // Support multiple prop formats for flexibility
  const studentId = child?.id || profile?.id || data?.profile?.id || data?.student?.id

  useEffect(() => {
    if (studentId) {
      fetchAttendanceAndBehavior()
    }
  }, [studentId])

  const fetchAttendanceAndBehavior = async () => {
    setLoading(true)
    setError("")

    try {
      const token = await GetToken()
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      // Fetch attendance details
      if (Backend.parentStudentAttendanceDetails) {
        const attendanceUrl = `${Backend.api}${Backend.parentStudentAttendanceDetails.replace('{student_id}', studentId)}`
        console.log('Fetching attendance from:', attendanceUrl)
        const attendanceRes = await axios.get(attendanceUrl, { headers })
        const attendance = attendanceRes.data?.data?.attendance || []
        setAttendanceData(attendance)
      } else {
        console.warn('Backend.parentStudentAttendanceDetails is undefined')
      }

      // Fetch behavior incidents
      const behaviorUrl = `${Backend.api}${Backend.behaviorIncidents}?student_id=${studentId}`
      console.log('Fetching behavior from:', behaviorUrl)
      const behaviorRes = await axios.get(behaviorUrl, { headers })
      const incidents = behaviorRes.data?.data || behaviorRes.data?.results || []
      setBehaviorData(incidents)

    } catch (err) {
      console.error("Error fetching attendance/behavior:", err)
      setError(err?.response?.data?.message || err.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Attendance Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {isTeacher ? 'Student Attendance Records' : 'Recent Attendance'}
              </Typography>
              {attendanceData.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No attendance records found
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {attendanceData.map((att, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: att.status?.toLowerCase() === 'present' ? 'success.lighter' : 'error.lighter'
                      }}
                    >
                      <Typography variant="body2">
                        <strong>{dayjs(att.date).format('MMM DD, YYYY')}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Status: {att.status || 'Unknown'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Behavior Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {isTeacher ? 'Behavior & Conduct Records' : 'Behavior Incidents'}
              </Typography>
              {behaviorData.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No behavior incidents recorded
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {behaviorData.slice(0, 10).map((incident) => (
                    <Box
                      key={incident.id}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2">
                        <strong>{dayjs(incident.incident_date).format('MMM DD, YYYY')}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {incident.description || 'No description'}
                      </Typography>
                      {incident.reported_by_name && (
                        <Typography variant="caption" color="text.secondary">
                          Reported by: {incident.reported_by_name}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Teacher-only: Attendance Summary & Actions */}
        {isTeacher && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'info.light' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Teacher View: Attendance Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Records
                    </Typography>
                    <Typography variant="h6">
                      {attendanceData.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Present
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {attendanceData.filter(a => a.status?.toLowerCase() === 'present').length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Absent
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {attendanceData.filter(a => a.status?.toLowerCase() === 'absent').length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Late
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      {attendanceData.filter(a => a.status?.toLowerCase() === 'late').length}
                    </Typography>
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  * Teachers can mark attendance and view detailed reports
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
