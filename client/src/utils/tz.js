import { zonedTimeToUtc, format, utcToZonedTime } from 'date-fns-tz';

export function getBrowserZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Convert ISO (UTC) to formatted string in target zone (e.g. 'HH:mm')
export function displayTime(utcISO, targetZone, pattern = 'HH:mm') {
  const zoned = utcToZonedTime(utcISO, targetZone);
  return format(zoned, pattern, { timeZone: targetZone });
}

// Combine local date + HH:MM:SS and convert to UTC ISO string for API
export function localSelectionToUTC(dateStr, timeStr, localZone = getBrowserZone()) {
  const isoLocal = `${dateStr}T${timeStr}`; // implicit localZone
  const utcDate = zonedTimeToUtc(isoLocal, localZone);
  return utcDate.toISOString();
}

export function providerSlotToBrowserLabel(dateStr, timeStr, providerZone, pattern='HH:mm') {
  const utcISO = zonedTimeToUtc(`${dateStr}T${timeStr}`, providerZone);
  return format(utcToZonedTime(utcISO, getBrowserZone()), pattern, { timeZone: getBrowserZone() });
}
