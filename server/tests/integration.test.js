const request = require('supertest');
const { pool } = require('../db');
const app = require('../index');

describe('CareSync API Integration Tests', () => {
  let providerId;

  beforeAll(async () => {
    // Clean up test data
    await pool.query('TRUNCATE appointments, availability, providers RESTART IDENTITY CASCADE');

    // Create provider via API to ensure committed row
    const provRes = await request(app).post('/api/providers').send({
      name: 'Dr Integration',
      email: `integration_${Date.now()}@example.com`,
      specialty: 'Cardiology',
      time_zone: 'UTC',
    });
    expect(provRes.status).toBe(201);
    providerId = provRes.body.id;

    // Add availability via API
    const availRes = await request(app).post('/api/availability').send({
      provider_id: providerId,
      availability: [
        { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' },
        { day_of_week: 2, start_time: '09:00:00', end_time: '12:00:00' },
      ],
    });
    expect(availRes.status).toBe(201);
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM appointments');
    await pool.query('DELETE FROM availability');
    await pool.query('DELETE FROM providers');
    await pool.end();
  });

  describe('Provider Endpoints', () => {
    test('GET /api/providers - Get all providers', async () => {
      const response = await request(app).get('/api/providers');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Availability Endpoints', () => {
    test('GET /api/availability/provider/:provider_id - Get provider availability', async () => {
      const response = await request(app).get(`/api/availability/provider/${providerId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Appointment Endpoints', () => {
    let testDate;

    beforeAll(() => {
      // Set test date to next Monday
      const today = new Date();
      const daysUntilMonday = (1 + 7 - today.getDay()) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      testDate = nextMonday.toISOString().split('T')[0];
    });

    test('GET /api/appointments/available - Get available slots', async () => {
      const response = await request(app)
        .get('/api/appointments/available')
        .query({
          provider_id: providerId,
          date: testDate,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('available_slots');
      expect(Array.isArray(response.body.available_slots)).toBe(true);
    });

    test('POST /api/appointments - Book an appointment', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .send({
          provider_id: providerId,
          patient_name: 'Jane Doe',
          patient_email: 'jane.doe@example.com',
          start: `${testDate}T10:00:00Z`,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.patient_name).toBe('Jane Doe');
      expect(response.body.appointment_time).toBe('10:00:00');
    });

    test('GET /api/appointments/available - Verify slot is no longer available', async () => {
      const response = await request(app)
        .get('/api/appointments/available')
        .query({
          provider_id: providerId,
          date: testDate,
        });

      expect(response.status).toBe(200);
      expect(response.body.available_slots).not.toContain('10:00:00');
    });

    test('POST /api/appointments - Attempt to book same slot (should fail)', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .send({
          provider_id: providerId,
          patient_name: 'Another Patient',
          patient_email: 'another@example.com',
          start: `${testDate}T10:00:00Z`,
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });
});

