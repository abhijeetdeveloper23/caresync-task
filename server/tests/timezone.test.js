const request = require('supertest');
const app = require('../index');
const { pool } = require('../db');
const { DateTime } = require('luxon');

describe('Timezone booking flow', () => {
  let providerId;
  const monday = '2025-12-15'; // Monday

  beforeAll(async () => {
    await pool.query('DELETE FROM appointments');
    await pool.query('DELETE FROM availability');
    await pool.query('DELETE FROM providers');
    // create provider
    const res = await request(app)
      .post('/api/providers')
      .send({
        name: 'Dr TZ',
        email: `tz_${Date.now()}@example.com`,
        specialty: 'test',
        time_zone: 'America/New_York',
      });
    providerId = res.body.id;
    // availability Monday 09-17
    await request(app).post('/api/availability').send({
      provider_id: providerId,
      availability: [
        { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' },
      ],
    }).then(r=>{expect(r.status).toBe(201);});
  });

  it('patient in LA can book 06:00 which maps to 09:00 NY', async () => {
    const startISO = DateTime.fromISO(`${monday}T06:00:00`, {
      zone: 'America/Los_Angeles',
    }).toISO();

    const res = await request(app).post('/api/appointments').send({
      provider_id: providerId,
      patient_name: 'Alice',
      patient_email: 'alice@test.com',
      start: startISO,
    });

    expect(res.status).toBe(201);
    expect(res.body.appointment_time).toBe('09:00:00');
  });

  afterAll(async () => {
    await pool.end();
  });
});
