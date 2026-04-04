const express = require('express');
const pool    = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, author_name, university, content, rating, created_at
       FROM testimonials
       WHERE approved = TRUE
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.get('/pending', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM testimonials WHERE approved = FALSE ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.post('/', async (req, res) => {
  const { author_name, university, content, rating } = req.body;
  if (!author_name || !content) {
    return res.status(400).json({ error: 'Nom et témoignage requis.' });
  }
  const parsedRating = parseInt(rating) || 5;
  if (parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ error: 'La note doit être entre 1 et 5.' });
  }
  let userId = null;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {}
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO testimonials (author_name, university, content, rating, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [author_name, university || null, content, parsedRating, userId]
    );
    res.status(201).json({
      message: 'Témoignage soumis ! Il sera publié après validation.',
      id: rows[0].id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.patch('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'UPDATE testimonials SET approved = TRUE WHERE id = $1',
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Témoignage introuvable.' });
    res.json({ message: 'Témoignage approuvé.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM testimonials WHERE id = $1',
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Témoignage introuvable.' });
    res.json({ message: 'Témoignage supprimé.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
