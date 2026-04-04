const express = require('express');
const pool    = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         e.*,
         COUNT(er.id)::int AS registrations_count
       FROM events e
       LEFT JOIN event_registrations er ON er.event_id = e.id
       WHERE e.starts_at > NOW()
       GROUP BY e.id
       ORDER BY e.starts_at ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*
       FROM events e
       INNER JOIN event_registrations er ON er.event_id = e.id
       WHERE er.user_id = $1
       ORDER BY e.starts_at ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const { title, description, location, starts_at, ends_at, capacity } = req.body;
  if (!title || !starts_at || !ends_at) {
    return res.status(400).json({ error: 'Titre, date de début et date de fin requis.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO events (title, description, location, starts_at, ends_at, capacity, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description || null, location || null, starts_at, ends_at, capacity || 20, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM events WHERE id = $1',
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Événement introuvable.' });
    res.json({ message: 'Événement supprimé.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.post('/:id/register', requireAuth, async (req, res) => {
  const eventId = parseInt(req.params.id);
  try {
    const { rows: evRows } = await pool.query(
      `SELECT e.capacity, COUNT(er.id)::int AS registrations_count
       FROM events e
       LEFT JOIN event_registrations er ON er.event_id = e.id
       WHERE e.id = $1
       GROUP BY e.id`,
      [eventId]
    );
    if (evRows.length === 0) {
      return res.status(404).json({ error: 'Événement introuvable.' });
    }
    const ev = evRows[0];
    if (ev.registrations_count >= ev.capacity) {
      return res.status(409).json({ error: 'Cet événement est complet.' });
    }
    await pool.query(
      'INSERT INTO event_registrations (event_id, user_id) VALUES ($1, $2)',
      [eventId, req.user.id]
    );
    res.status(201).json({ message: 'Inscription confirmée !' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Tu es déjà inscrit·e à cet événement.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.delete('/:id/register', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Inscription introuvable.' });
    }
    res.json({ message: 'Inscription annulée.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
