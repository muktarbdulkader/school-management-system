import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

// ----------------------------------------------------------------------

dayjs.extend(duration);
dayjs.extend(relativeTime);

// ----------------------------------------------------------------------

/**
 * Supported date formats: Dayjs instance, Date, string, number, null, or undefined
 */
const formatStr = {
  dateTime: 'DD MMM YYYY h:mm a', // 17 Apr 2022 12:00 am
  date: 'DD MMM YYYY', // 17 Apr 2022
  dateMonth: 'DD MMM', // 17 Apr
  time: 'h:mm a', // 12:00 am
  split: {
    dateTime: 'DD/MM/YYYY h:mm a', // 17/04/2022 12:00 am
    date: 'DD/MM/YYYY', // 17/04/2022
  },
  paramCase: {
    dateTime: 'DD-MM-YYYY h:mm a', // 17-04-2022 12:00 am
    date: 'DD-MM-YYYY', // 17-04-2022
  },
};

function today(format) {
  return dayjs(new Date()).startOf('day').format(format);
}

// ----------------------------------------------------------------------

/** output: 17 Apr 2022 12:00 am
 */
function fDateTime(date, format) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).format(format || formatStr.dateTime) : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: 17 Apr 2022
 */
function fDate(date, format) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).format(format || formatStr.dateMonth) : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: 12:00 am
 */
function fTime(date, format) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).format(format || formatStr.time) : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: 1713250100
 */
function fTimestamp(date) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).valueOf() : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: a few seconds, 2 years
 */
function fToNow(date) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).toNow(true) : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** Format time string from API (e.g., "16:11:00") to readable format (e.g., "4:11 PM")
 * @param {string} timeStr - Time string in HH:MM:SS format
 * @param {boolean} use24Hour - Use 24-hour format (default: false for 12-hour with AM/PM)
 * @returns {string} Formatted time string
 */
function formatTimeString(timeStr, use24Hour = false) {
  if (!timeStr) return '';

  // Handle HH:MM:SS format from API
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];

  if (use24Hour) {
    // Return as HH:MM (24-hour format, no seconds)
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  // Convert to 12-hour format with AM/PM
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours; // 0 should be 12

  return `${hours}:${minutes} ${period}`;
}

/** Format time range from API (e.g., "16:11:00", "16:27:00") to readable range (e.g., "4:11 PM - 4:27 PM")
 * @param {string} startTime - Start time string in HH:MM:SS format
 * @param {string} endTime - End time string in HH:MM:SS format
 * @param {boolean} use24Hour - Use 24-hour format (default: false for 12-hour with AM/PM)
 * @returns {string} Formatted time range string
 */
function formatTimeRange(startTime, endTime, use24Hour = false) {
  const formattedStart = formatTimeString(startTime, use24Hour);
  const formattedEnd = formatTimeString(endTime, use24Hour);

  if (!formattedStart || !formattedEnd) return '';

  return `${formattedStart} - ${formattedEnd}`;
}

// Export all functions
export { formatStr, today, fDateTime, fDate, fTime, fTimestamp, fToNow, formatTimeString, formatTimeRange };
