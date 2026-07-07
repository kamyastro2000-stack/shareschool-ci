# ShareSchool CI

Plateforme SaaS B2B de partage de ressources pédagogiques pour élèves ivoiriens. Vendue clé en main aux établissements scolaires.

## Stack

- **Framework** : Next.js 16 (App Router) + TypeScript + Turbopack
- **Base de données** : Prisma 6 + SQLite (dev) / MySQL (prod)
- **Auth** : NextAuth v5 (Credentials + JWT)
- **Styles** : Tailwind CSS v4 + Framer Motion
- **Stockage** : Cloudinary
- **Emails** : Resend

## Fonctionnalités

- Authentification avec vérification email
- 4 rôles : STUDENT, CLASS_REP, TEACHER, ADMIN
- Upload et validation de ressources (PDF, DOC, PPT, images)
- Quiz (création QCM, passage, résultats, timer, difficultés)
- Gamification : XP, 20 niveaux, 10 badges, classement individuel/par classe
- Chat par niveau avec contrôle d'accès
- Profil utilisateur avec progression
- Administration complète (stats, utilisateurs, ressources, registre classes)
- Landing page professionnelle avec hero animé, fonctionnalités, étapes
- Dashboard role-based (élève/chef/prof/admin)
- Design glassmorphisme responsive avec logo ShareSchool CI

## Pages refaites (design + UX)

| Page | Composants clés |
|---|---|
| Landing (`/`) | Hero animé, stats, features, étapes, CTA, footer |
| Login (`/login`) | Design glass, icônes, toggle password |
| Register (`/register`) | Step indicator, confirmation recap |
| Dashboard (`/dashboard`) | Banner rôle, quick actions, tabs, ResourceCard refaite |
| Admin (`/admin`) | Stats cliquables, gestion users/resources/registre |
| Profil (`/profil`) | Carte XP, badges, historique transactions |
| Classement (`/classement`) | Podium, tabs, barre recherche |
| Chat (`/chat`) | Salons par niveau, bulles, timestamps |
| Quiz liste (`/quiz`) | Cartes, badges difficulté/matière/culture G |
| Quiz détail (`/quiz/[id]`) | Démarrage, timer, palette questions, résultats |
| Quiz création (`/quiz/create`) | Formulaire avec étapes, validation |
| Quiz résultats (`/quiz/results`) | Barres progression, badges XP |

## Pour commencer

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Identifiants de test

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@lsa.ci | admin123 |
| Professeur | professeur@lsa.ci | teacher123 |
| Élève (Tle D1) | eleve@lsa.ci | student123 |
| Chef de classe (Tle D1) | chef@lsa.ci | rep123 |

## Commandes

```bash
npm run dev          # Serveur de développement (Turbopack)
npm run build        # Build production
npm run lint         # ESLint
npx prisma generate  # Regénérer Prisma Client
npx prisma db push   # Sync BDD
npm run db:reset     # Reset BDD + seed
```

## Structure

```
src/
├── app/           # Pages et API routes (App Router)
│   ├── (auth)/    # Login, register, verify-email
│   ├── (app)/     # Profil, classement, chat
│   ├── admin/     # Dashboard admin
│   ├── quiz/      # CRUD quiz (liste, [id], create, results)
│   └── api/       # Toutes les API routes
├── components/    # Composants réutilisables
│   ├── Logo.tsx   # Logo ShareSchool CI
│   ├── Navbar.tsx # Navigation role-based
│   ├── ResourceCard.tsx, UploadModal.tsx
│   └── Providers.tsx, LoadingSpinner, ErrorMessage, SuccessMessage
├── lib/           # Utilitaires (auth, prisma, xp, cloudinary, utils)
└── middleware.ts  # Auth middleware
```

## Roadmap production

Voir [`ROADMAP-PRODUCTION.md`](./ROADMAP-PRODUCTION.md).

## À faire avant la mise en production

1. Git + GitHub
2. Migration MySQL
3. Tests unitaires + API
4. Paiement Stripe
5. Déploiement + domaine
6. Légal (CGU, RGPD)
7. Sécurité (rate limiting)
8. Monitoring (Sentry)
