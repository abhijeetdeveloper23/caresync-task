export const formatTimeForInput = (timeString) => {
  if (!timeString) return '';
  const timeStr = timeString.substring(0, 5);
  const [h, m] = timeStr.split(':');
  const hour24 = parseInt(h, 10);
  let hour12 = hour24;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  if (hour24 === 0) hour12 = 12;
  else if (hour24 > 12) hour12 = hour24 - 12;
  return `${String(hour12).padStart(2, '0')}:${m} ${period}`;
};

export const formatTimeForStorage = (timeString) => (timeString ? `${timeString}:00` : '00:00:00');
