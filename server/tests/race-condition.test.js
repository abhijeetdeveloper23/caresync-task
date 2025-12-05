const request = require('supertest');
const { pool } = require('../db');
const app = require('../index');

describe('Race Condition Test - Double Booking Prevention', () => {
  let providerId;
  let testDate;
  let testTime;

  beforeAll(async () => {
    // Clean up any existing test data
    await pool.query('DELETE FROM appointments');
    await pool.query('DELETE FROM availability');
    await pool.query('DELETE FROM providers');

    // Create provider via API to respect validation
    const provRes = await request(app).post('/api/providers').send({
      name: 'Test Doctor',
      email: `test_${Date.now()}@example.com`,
      specialty: 'General Practice',
      time_zone: 'UTC',
    });
    expect(provRes.status).toBe(201);
    providerId = provRes.body.id;

    // Submit availability via API
    await request(app).post('/api/availability').send({
      provider_id: providerId,
      availability: [
        { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' },
      ],
    });

    await new Promise(r => setTimeout(r, 50));

    // Set test date to next Monday
    const today = new Date();
    const daysUntilMonday = (1 + 7 - today.getDay()) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    testDate = nextMonday.toISOString().split('T')[0];
    testTime = '10:00:00';
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM appointments');
    await pool.query('DELETE FROM availability');
    await pool.query('DELETE FROM providers');
    await pool.end();
  });

  test('should prevent double-booking when two requests arrive simultaneously', async () => {
    const bookingRequest1 = {
      provider_id: providerId,
      patient_name: 'Patient One',
      patient_email: 'patient1@example.com',
      start: `${testDate}T${testTime}Z`,
    };

    const bookingRequest2 = {
      provider_id: providerId,
      patient_name: 'Patient Two',
      patient_email: 'patient2@example.com',
      start: `${testDate}T${testTime}Z`,
    };

    // Send both requests simultaneously
    const [response1, response2] = await Promise.all([
      request(app)
        .post('/api/appointments')
        .send(bookingRequest1),
      request(app)
        .post('/api/appointments')
        .send(bookingRequest2),
    ]);

    // One should succeed (201), one should fail (409 Conflict)
    const successCount = [response1.status, response2.status].filter(
      (status) => status === 201
    ).length;
    const conflictCount = [response1.status, response2.status].filter(
      (status) => status === 409
    ).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(1);

    // Verify only one appointment exists in the database
    const appointments = await pool.query(
      'SELECT * FROM appointments WHERE provider_id = $1 AND appointment_date = $2 AND appointment_time = $3',
      [providerId, testDate, testTime]
    );

    expect(appointments.rows.length).toBe(1);
  });

  test('should allow booking different time slots simultaneously', async () => {
    const bookingRequest1 = {
      provider_id: providerId,
      patient_name: 'Patient Three',
      patient_email: 'patient3@example.com',
      start: `${testDate}T11:00:00Z`,
    };

    const bookingRequest2 = {
      provider_id: providerId,
      patient_name: 'Patient Four',
      patient_email: 'patient4@example.com',
      start: `${testDate}T11:15:00Z`,
    };

    // Send both requests simultaneously
    const [response1, response2] = await Promise.all([
      request(app)
        .post('/api/appointments')
        .send(bookingRequest1),
      request(app)
        .post('/api/appointments')
        .send(bookingRequest2),
    ]);

    // Both should succeed
    expect(response1.status).toBe(201);
    expect(response2.status).toBe(201);

    // Verify both appointments exist
    const appointments = await pool.query(
      'SELECT * FROM appointments WHERE provider_id = $1 AND appointment_date = $2 AND appointment_time IN ($3, $4)',
      [providerId, testDate, '11:00:00', '11:15:00']
    );

    expect(appointments.rows.length).toBe(2);
  });
});

