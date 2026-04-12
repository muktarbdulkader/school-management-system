export function TimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second'); // Seconds ago
  } else if (diffInSeconds < 3600) {
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    return rtf.format(-diffInMinutes, 'minute'); // Minutes ago
  } else if (diffInSeconds < 86400) {
    const diffInHours = Math.floor(diffInSeconds / 3600);
    return rtf.format(-diffInHours, 'hour'); // Hours ago
  } else {
    const diffInDays = Math.floor(diffInSeconds / 86400);
    return rtf.format(-diffInDays, 'day'); // Days ago
  }
}
