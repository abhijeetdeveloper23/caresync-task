const express = require('express');
const { pool } = require('../db');
const { body, validationResult, query } = require('express-validator');
const { isoToLocalDateTime } = require('../utils/tz');
const { DateTime } = require('luxon');

const router = express.Router();

function generateTimeSlots(start, end) {
  const slots = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const current = new Date();
  current.setHours(sh, sm, 0, 0);
  const finish = new Date();
  finish.setHours(eh, em, 0, 0);
  while (current < finish) {
    slots.push(`${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}:00`);
    current.setMinutes(current.getMinutes() + 15);
  }
  return slots;
}

router.get(
  '/available',
  [
    query('provider_id').isInt(),
    query('date').matches(/^\d{4}-\d{2}-\d{2}$/),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { provider_id, date } = req.query;
      const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

      const availabilityResult = await pool.query(
        'SELECT start_time, end_time FROM availability WHERE provider_id = $1 AND day_of_week = $2 ORDER BY start_time',
        [provider_id, dayOfWeek]
      );
      if (!availabilityResult.rows.length) return res.json({ available_slots: [] });

      const appointmentsResult = await pool.query(
        'SELECT appointment_time FROM appointments WHERE provider_id = $1 AND appointment_date = $2',
        [provider_id, date]
      );
      const booked = new Set(appointmentsResult.rows.map(r => r.appointment_time));

      const allSlots = availabilityResult.rows.flatMap(b => generateTimeSlots(b.start_time, b.end_time));
      const slotsWithStatus = allSlots.map(t => ({ time: t, available: !booked.has(t) }));
      const availableSlots = slotsWithStatus.filter(s => s.available).map(s => s.time);
      const bookedSlots = slotsWithStatus.filter(s => !s.available).map(s => s.time);

      res.json({
        provider_id: Number(provider_id),
        date,
        available_slots: availableSlots,
        booked_slots: bookedSlots,
        all_slots: slotsWithStatus,
        total_available: availableSlots.length,
        total_booked: bookedSlots.length,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/',
  [
    body('provider_id').isInt(),
    body('patient_name').trim().notEmpty(),
    body('patient_email').isEmail(),
    body('start').isISO8601(),
  ],
  async (req, res, next) => {
    const client = await pool.connect();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { provider_id, patient_name, patient_email, start } = req.body;
      const providerResult = await client.query('SELECT time_zone FROM providers WHERE id = $1', [provider_id]);
      if (!providerResult.rows.length) return res.status(404).json({ error: 'Provider not found' });

      let providerTZ = providerResult.rows[0].time_zone;
      if (!providerTZ) {
        providerTZ = DateTime.fromISO(start, { setZone: true }).zoneName || 'UTC';
        await client.query('UPDATE providers SET time_zone = $1 WHERE id = $2', [providerTZ, provider_id]);
      }

      const { date: appointment_date, time: appointment_time } = isoToLocalDateTime(start, providerTZ);
      const dayOfWeek = DateTime.fromISO(appointment_date, { zone: providerTZ }).weekday % 7;

      if (Number(appointment_time.split(':')[1]) % 15 !== 0)
        return res.status(400).json({ error: 'Appointment time must be on 15-minute boundaries' });

      if (appointment_date < isoToLocalDateTime(new Date().toISOString(), providerTZ).date)
        return res.status(400).json({ error: 'Cannot book appointments in the past' });

      const availabilityResult = await client.query(
        `SELECT 1 FROM availability WHERE provider_id = $1 AND day_of_week = $2 AND start_time <= $3 AND end_time > $3`,
        [provider_id, dayOfWeek, appointment_time]
      );
      if (!availabilityResult.rows.length)
        return res.status(400).json({ error: 'Selected time slot is not within provider availability' });

      await client.query('BEGIN');
      const existing = await client.query(
        `SELECT id FROM appointments WHERE provider_id = $1 AND appointment_date = $2 AND appointment_time = $3 FOR UPDATE`,
        [provider_id, appointment_date, appointment_time]
      );
      if (existing.rows.length) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'This time slot is already booked' });
      }

      const result = await client.query(
        `INSERT INTO appointments (provider_id, patient_name, patient_email, appointment_date, appointment_time)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [provider_id, patient_name, patient_email, appointment_date, appointment_time]
      );
      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      if (e.code === '23505') return res.status(409).json({ error: 'This time slot is already booked' });
      next(e);
    } finally {
      client.release();
    }
  }
);

router.get('/provider/:provider_id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM appointments WHERE provider_id = $1 ORDER BY appointment_date, appointment_time',
      [req.params.provider_id]
    );
    res.json(result.rows);
  } catch (e) {
    next(e);
  }
});

module.exports = router;

