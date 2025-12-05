# Time-Zone Strategy

CareSync ensures all validations run in the provider’s local time.

## Key Points

1. Each provider stores an IANA `time_zone`.
2. Slot generation and booking validation use the provider zone via **Luxon**.
3. When a provider lacks a zone, the API auto-infers it from the first ISO-8601 `start` received and persists it.
4. Dates (`appointment_date`) and local times (`appointment_time`) are stored separately to avoid DST pitfalls.

## Conversion Helpers

```javascript
const { DateTime } = require('luxon');

function isoToLocalDateTime(iso, tz) {
  const dt = DateTime.fromISO(iso, { zone: tz });
  return { date: dt.toISODate(), time: dt.toFormat('HH:mm:ss') };
}
```

## Edge Cases

- **DST Transitions**: Luxon handles skipped/repeated times; API rejects invalid local times.
- **Past Bookings**: Comparison is done after converting `now` to provider zone.
