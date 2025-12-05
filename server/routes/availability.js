const express = require('express');
const { pool } = require('../db');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Submit working hours for a provider
router.post(
  '/',
  [
    body('provider_id').isInt().withMessage('Valid provider_id is required'),
    body('availability').isArray().withMessage('Availability must be an array'),
    body('availability.*.day_of_week')
      .isInt({ min: 0, max: 6 })
      .withMessage('day_of_week must be 0-6 (0=Sunday, 6=Saturday)'),
    body('availability.*.start_time')
      .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
      .withMessage('start_time must be in HH:MM:SS format'),
    body('availability.*.end_time')
      .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
      .withMessage('end_time must be in HH:MM:SS format'),
  ],
  async (req, res, next) => {
    const client = await pool.connect();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { provider_id, availability } = req.body;

      // Ensure no duplicate day_of_week entries
      const seenDays = new Set();
      for (const block of availability) {
        if (seenDays.has(block.day_of_week)) {
          return res.status(400).json({
            error: `Duplicate availability for day_of_week ${block.day_of_week} is not allowed`,
          });
        }
        seenDays.add(block.day_of_week);
      }

      // Verify provider exists
      const providerCheck = await client.query('SELECT id FROM providers WHERE id = $1', [provider_id]);
      if (providerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      await client.query('BEGIN');

      // Delete existing availability for this provider
      await client.query('DELETE FROM availability WHERE provider_id = $1', [provider_id]);

      // Insert new availability blocks
      for (const block of availability) {
        const { day_of_week, start_time, end_time } = block;
        
        // Validate time range
        if (end_time <= start_time) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: `Invalid time range: end_time must be after start_time for day ${day_of_week}` 
          });
        }

        await client.query(
          'INSERT INTO availability (provider_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)',
          [provider_id, day_of_week, start_time, end_time]
        );
      }

      await client.query('COMMIT');

      // Return the created availability
      const result = await client.query(
        'SELECT * FROM availability WHERE provider_id = $1 ORDER BY day_of_week, start_time',
        [provider_id]
      );

      res.status(201).json(result.rows);
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }
);

// Get availability for a provider
router.get('/provider/:provider_id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM availability WHERE provider_id = $1 ORDER BY day_of_week, start_time',
      [req.params.provider_id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

