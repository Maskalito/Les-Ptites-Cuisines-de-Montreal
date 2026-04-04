const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.POSTGRES_HOST || 'localhost',
  port:     parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  user:     process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Erreur inattendue du pool PostgreSQL', err);
  process.exit(1);
});

module.exports = pool;
