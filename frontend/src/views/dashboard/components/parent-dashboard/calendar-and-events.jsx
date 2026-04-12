import {
  Box,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  useMediaQuery,
  Button,
  useTheme,
  Fade,
  Chip,
} from '@mui/material';
import { CalendarToday, NavigateBefore, NavigateNext, Today } from '@mui/icons-material';

const calendarDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function CalendarAndEvents({
  calendar = { month: '', year: '', weeks: [], specialDates: {} },
  onDateClick,
  onMonthChange,
}) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = (() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const endYear = currentYear + 5;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  })();

  const selectedMonth = calendar.month && calendar.year
    ? `${calendar.month} ${calendar.year}`
    : `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

  const handleMonthChange = (newMonth) => {
    const [monthName, year] = newMonth.split(' ');
    const monthIndex = months.indexOf(monthName);
    if (monthIndex >= 0 && !Number.isNaN(Number(year))) {
      onMonthChange?.(monthIndex, parseInt(year, 10));
    }
  };

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const getTextColorForBg = (bgHex) => {
    if (!bgHex) return 'white';
    const hex = bgHex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.7 ? 'black' : 'white';
  };

  const today = new Date().getDate();
  const currentMonthIndex = new Date().getMonth();
  const currentYearNum = new Date().getFullYear();
  const isCurrentMonth = calendar.month === months[currentMonthIndex] && calendar.year === currentYearNum;

  return (
    <Fade in timeout={500}>
      <Card
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {!isMobile && (
            <Typography
              variant="h5"
              sx={{
                mb: 3,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CalendarToday sx={{ fontSize: 24, color: '#10b981' }} />
              Calendar & Events
            </Typography>
          )}

          {/* Month Selector */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ flex: 1, minWidth: 140 }}>
              <Select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  bgcolor: '#f9fafb',
                  '& .MuiSelect-select': {
                    py: 1.2,
                  },
                }}
              >
                {years.map((year) =>
                  months.map((month) => {
                    const option = `${month} ${year}`;
                    return (
                      <MenuItem key={option} value={option} sx={{ fontSize: '0.875rem' }}>
                        {option}
                      </MenuItem>
                    );
                  }),
                )}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => onDateClick?.({})}
                startIcon={<Today sx={{ fontSize: 18 }} />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#e5e7eb',
                  color: '#6b7280',
                  '&:hover': {
                    borderColor: '#10b981',
                    color: '#10b981',
                    bgcolor: '#ecfdf5',
                  },
                }}
              >
                Today
              </Button>
            </Box>
          </Box>

          {/* Calendar Header */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 1,
              mb: 2,
              pb: 1.5,
              borderBottom: '1px solid',
              borderColor: '#e5e7eb',
            }}
          >
            {calendarDays.map((day) => (
              <Box key={day} sx={{ textAlign: 'center', py: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: '#6b7280',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Calendar Grid */}
          <Box sx={{ width: '100%' }}>
            {calendar.weeks.map((week, weekIndex) => (
              <Box
                key={weekIndex}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 1,
                  mb: 1,
                }}
              >
                {week.map((day, dayIndex) => {
                  const events = day ? (calendar.specialDates?.[day] || []) : [];
                  const tooltipTitle = events.length ? events.map((e) => e.title).join(', ') : '';
                  const bg = events.length ? events[0].color : 'transparent';
                  const textColor = events.length ? getTextColorForBg(bg) : 'text.primary';
                  const isToday = isCurrentMonth && day === today;

                  return (
                    <Tooltip
                      key={dayIndex}
                      title={tooltipTitle}
                      disableHoverListener={!tooltipTitle}
                      arrow
                      placement="top"
                    >
                      <Box
                        sx={{
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 2,
                          backgroundColor: bg,
                          color: events.length ? textColor : 'text.primary',
                          fontWeight: events.length || isToday ? 'bold' : 'normal',
                          cursor: day ? 'pointer' : 'default',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                          border: isToday ? '2px solid #3b82f6' : '2px solid transparent',
                          boxShadow: isToday ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
                          '&:hover': {
                            backgroundColor: day && !events.length ? '#f3f4f6' : undefined,
                            transform: day ? 'scale(1.1)' : 'none',
                            zIndex: day ? 10 : 'auto',
                          },
                        }}
                        onClick={() => day && onDateClick?.({ day, calendarMonth: calendar.month, calendarYear: calendar.year, calendar })}
                      >
                        {day && (
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.9rem',
                              fontWeight: isToday ? 700 : events.length ? 600 : 500,
                              color: isToday ? '#3b82f6' : events.length ? textColor : '#374151',
                            }}
                          >
                            {day}
                          </Typography>
                        )}

                        {/* Event dots */}
                        {events.length > 0 && (
                          <Box sx={{ position: 'absolute', bottom: 4, display: 'flex', gap: 0.5 }}>
                            {events.slice(0, 3).map((ev, i) => (
                              <Box
                                key={i}
                                sx={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: '50%',
                                  backgroundColor: events.length === 1 ? 'rgba(255,255,255,0.5)' : ev.color,
                                  border: '1px solid rgba(0,0,0,0.1)',
                                }}
                              />
                            ))}
                            {events.length > 3 && (
                              <Typography variant="caption" sx={{ fontSize: '0.6rem', ml: 0.3, color: textColor }}>
                                +{events.length - 3}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            ))}
          </Box>

          {/* Legend */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: '#e5e7eb' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', display: 'block', mb: 1.5 }}>
              Event Types:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label="High Priority"
                sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 600, fontSize: '0.7rem' }}
              />
              <Chip
                size="small"
                label="Medium Priority"
                sx={{ bgcolor: '#fef3c7', color: '#d97706', fontWeight: 600, fontSize: '0.7rem' }}
              />
              <Chip
                size="small"
                label="Normal"
                sx={{ bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 600, fontSize: '0.7rem' }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
}
