require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRouter         = require('./routes/auth');
const signupsRouter      = require('./routes/signups');
const testimonialsRouter = require('./routes/testimonials');
const eventsRouter       = require('./routes/events');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth',         authRouter);
app.use('/api/signups',      signupsRouter);
app.use('/api/testimonials', testimonialsRouter);
app.use('/api/events',       eventsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/*', (req, res) => res.status(404).json({ error: 'Route introuvable.' }));

app.listen(PORT, () => {
  console.log(`✅  API démarrée sur le port ${PORT}`);
});
