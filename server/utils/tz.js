const { DateTime } = require('luxon');

function isoToUTCDate(iso) {
  return DateTime.fromISO(iso, { setZone: true }).toUTC().toJSDate();
}

function dateTimeToUTCISO(dateStr, timeStr, zone) {
  const local = DateTime.fromISO(`${dateStr}T${timeStr}`, { zone });
  return local.toUTC().toISO();
}

function utcDateToDisplayISO(date, targetZone) {
  return DateTime.fromJSDate(date, { zone: 'utc' }).setZone(targetZone).toISO();
}

function getSystemZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function isoToLocalDateTime(iso, zone) {
  const dt = DateTime.fromISO(iso, { setZone: true }).setZone(zone);
  return {
    date: dt.toISODate(),
    time: dt.toFormat('HH:mm:ss'),
  };
}

module.exports = {
  isoToUTCDate,
  dateTimeToUTCISO,
  utcDateToDisplayISO,
  getSystemZone,
  isoToLocalDateTime,
};
