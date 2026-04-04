const express = require('express');
const pool    = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  const { first_name, email, university, plan } = req.body;
  if (!first_name || !email) {
    return res.status(400).json({ error: 'Prénom et courriel requis.' });
  }
  try {
    await pool.query(
      `INSERT INTO signups (first_name, email, university, plan)
       VALUES ($1, $2, $3, $4)`,
      [first_name, email.toLowerCase(), university || null, plan || null]
    );
    res.status(201).json({ message: 'Inscription enregistrée avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM signups ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
