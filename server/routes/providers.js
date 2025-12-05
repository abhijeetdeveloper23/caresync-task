const express = require('express');
const { pool } = require('../db');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Create a new provider
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('specialty').optional().trim(),
    body('time_zone').isString().notEmpty().withMessage('time_zone is required and must be IANA zone'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, specialty } = req.body;

      const result = await pool.query(
        'INSERT INTO providers (name, email, specialty, time_zone) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, specialty || null, req.body.time_zone || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return res.status(409).json({ error: 'Provider with this email already exists' });
      }
      next(error);
    }
  }
);

// Get all providers
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM providers ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get a specific provider
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM providers WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

