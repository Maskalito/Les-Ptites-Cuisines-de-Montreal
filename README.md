# Les P'tites Cuisines de Montréal

Service d'abonnement de cuisine collective mobile pour étudiants — OBNL à mission sociale.

> Projet réalisé dans le cadre du cours ENT-1000 Savoir Entreprendre, Université Laval.  
> Équipe 3 : Marion Kauffmann, Antonin Leprest, Eliot Tisserand, Gabrielle Bigard, Clément Barrier, Léandre Cacarié.
> Ce projet constitue la landing page du projet principal, développée par Clément Barrier.

---

## Modèle d'affaires

### Mission, vision et valeurs
- **Mission** : Créer un espace de rencontre autour de la cuisine.
- **Vision** : Sortir les jeunes de l'isolement et les aider à mieux se nourrir.
- **Valeur** : Réduire les coûts d'alimentation et créer du lien social.

### Proposition de valeur
Combinaison unique d'économies, de lien social et d'écoresponsabilité :
- Repas pour toute la semaine préparés en quelques heures en groupe.
- Coût alimentaire réduit de **30 à 50 %** par rapport aux courses individuelles.
- Rencontres et liens sociaux à chaque session.
- Moins de déplacements, moins de charge mentale liée à la planification.

### Segments de clientèle
| Profil | Description |
|---|---|
| **Cible principale** | Étudiant·e 18-25 ans, peu de revenus, mange seul·e, ne sait pas cuisiner |
| **Profil secondaire** | Parents 30 ans+, revenus moyens, cherchent une activité sociale autour de la cuisine |

### Activités et ressources clés
- Partenariats (accès aux cuisines, approvisionnement local)
- Planification des menus et achats groupés
- Organisation et animation des sessions collectives
- Communication sur les réseaux étudiants (Instagram, TikTok, Facebook, affiches campus)

### Structure de revenus
- Abonnements mensuels (~50 $/mois) et hebdomadaires (~15 $/semaine)
- Partenariats institutionnels avec universités et cégeps
- Subventions gouvernementales (entrepreneuriat social, sécurité alimentaire)

### Structure de coûts
- Location/utilisation des cuisines (potentiellement gratuit via partenariat)
- Achat des ingrédients (principal poste, réduit par achats en gros)
- Matériel de cuisine et contenants réutilisables
- Communication et coordination

### Partenaires clés
Entreprises loueuses de locaux · Producteurs agricoles régionaux · Costco · Gouvernement provincial · Moisson Québec · Associations étudiantes

### Retombées
- **Économiques** : réduction des dépenses alimentaires étudiantes, soutien aux producteurs locaux.
- **Sociales** : lutte contre l'isolement, création de liens communautaires, développement de compétences culinaires.
- **Environnementales** : approvisionnement en circuit court, achats groupés, réduction du gaspillage alimentaire.

### Gouvernance
- Forme juridique : **OBNL**
- Structure horizontale — participation active des membres aux décisions
- Profits réinvestis dans le matériel et les banques alimentaires

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | HTML / CSS / JS vanilla — servi par Nginx |
| Backend | Node.js + Express |
| Base de données | PostgreSQL 16 |
| Orchestration | Docker Compose |

---

## Lancer le projet

```bash
# 1. Configurer les variables d'environnement
cp .env.example .env
# Remplir POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD et JWT_SECRET dans .env

# 2. Démarrer tous les services
docker compose up --build

# 3. Ouvrir http://localhost
```

Le schéma et les données de démo (3 témoignages + 3 sessions) sont insérés automatiquement au premier démarrage.

### Promouvoir un utilisateur en admin

```bash
docker exec -it ptites_db psql -U <POSTGRES_USER> -d <POSTGRES_DB>
UPDATE users SET role = 'admin' WHERE email = 'ton@courriel.com';
```

---

## API — routes disponibles

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Créer un compte |
| POST | `/api/auth/login` | — | Se connecter |
| GET | `/api/auth/me` | JWT | Profil connecté |
| POST | `/api/signups` | — | Formulaire landing page |
| GET | `/api/signups` | Admin | Liste des inscriptions |
| GET | `/api/testimonials` | — | Témoignages approuvés |
| POST | `/api/testimonials` | — | Soumettre un témoignage |
| PATCH | `/api/testimonials/:id/approve` | Admin | Approuver un témoignage |
| DELETE | `/api/testimonials/:id` | Admin | Supprimer un témoignage |
| GET | `/api/events` | — | Sessions à venir |
| POST | `/api/events` | Admin | Créer une session |
| DELETE | `/api/events/:id` | Admin | Supprimer une session |
| POST | `/api/events/:id/register` | JWT | S'inscrire à une session |
| DELETE | `/api/events/:id/register` | JWT | Annuler son inscription |
