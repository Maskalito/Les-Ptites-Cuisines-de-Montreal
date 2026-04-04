-- =====================================================
-- Les P'tites Cuisines de Montréal — Schéma DB
-- Exécuté automatiquement au premier démarrage Postgres
-- =====================================================

-- UTILISATEURS
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  first_name  VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  university  VARCHAR(150),
  role        VARCHAR(20) NOT NULL DEFAULT 'member',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INSCRIPTIONS (formulaire landing page, sans compte)
CREATE TABLE IF NOT EXISTS signups (
  id          SERIAL PRIMARY KEY,
  first_name  VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  university  VARCHAR(150),
  plan        VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TÉMOIGNAGES
CREATE TABLE IF NOT EXISTS testimonials (
  id          SERIAL PRIMARY KEY,
  author_name VARCHAR(150) NOT NULL,
  university  VARCHAR(150),
  content     TEXT NOT NULL,
  rating      SMALLINT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  approved    BOOLEAN NOT NULL DEFAULT FALSE,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÉVÉNEMENTS
CREATE TABLE IF NOT EXISTS events (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  location    VARCHAR(255),
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  capacity    INTEGER NOT NULL DEFAULT 20,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INSCRIPTIONS AUX ÉVÉNEMENTS
CREATE TABLE IF NOT EXISTS event_registrations (
  id            SERIAL PRIMARY KEY,
  event_id      INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- DONNÉES DE DÉPART : témoignages approuvés
INSERT INTO testimonials (author_name, university, content, rating, approved) VALUES
  (
    'Julien T.',
    'Étudiant en génie, UdeM',
    'Avant je mangeais au Fast-Food trois fois par semaine. Maintenant j''ai des vrais repas faits maison pour toute la semaine, et en plus j''ai rencontré des gens supers. Je recommande à tous mes amis !',
    5, TRUE
  ),
  (
    'Amina L.',
    'Étudiante en sciences, UQAM',
    'Je venais d''arriver à Montréal et je me sentais vraiment seule. Les sessions de cuisine m''ont permis de créer des liens authentiques tout en apprenant à cuisiner. C''est tellement plus que juste de la nourriture.',
    5, TRUE
  ),
  (
    'Marc-Antoine R.',
    'Étudiant en droit, Université Laval',
    'J''économise facilement 150 $ par mois sur ma bouffe. Pour un étudiant à temps plein qui travaille le week-end, c''est énorme. Et la qualité des repas est vraiment au rendez-vous.',
    5, TRUE
  );

-- DONNÉES DE DÉPART : événements de démonstration
INSERT INTO events (title, description, location, starts_at, ends_at, capacity) VALUES
  (
    'Session de cuisine — Printemps #1',
    'Au menu : soupe minestrone, poulet rôti aux légumes et riz au lait. Venez cuisiner pour toute la semaine !',
    'Cuisine communautaire UdeM, Pavillon 3200',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
    20
  ),
  (
    'Session de cuisine — Printemps #2',
    'Thème méditerranéen : houmous maison, taboulé et brochettes de légumes grillés.',
    'Cuisine collective UQAM, Pavillon Judith-Jasmin',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days' + INTERVAL '3 hours',
    16
  ),
  (
    'Session découverte — Entrée gratuite',
    'Tu veux essayer avant de t''abonner ? Cette session est ouverte à tous ! Viens cuisiner et rencontrer la communauté.',
    'Maison des étudiants, McGill',
    NOW() + INTERVAL '21 days',
    NOW() + INTERVAL '21 days' + INTERVAL '2 hours',
    12
  );
