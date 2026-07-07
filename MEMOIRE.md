# SHARESCHOOL CI — MÉMOIRE COMPLÈTE DU PROJET

> Fichier mémoire généré le 04/07/2026 — Dernière mise à jour : 07/07/2026
> À lire en début de session pour tout retrouver.

---

## 1. CONTACT & IDENTITÉ

- **Projet** : ShareSchool CI — Plateforme de partage de ressources pédagogiques pour élèves ivoiriens
- **Client** : Kamya
- **Modèle** : SaaS B2B multi-établissement (vendu clé en main aux écoles)
- **Cahier des charges** : `C:\Users\Kamya\Desktop\mon projet.txt`
- **Emplacement du projet** : `D:\Mon Projet\shareschool_Projet`
- **Sauvegarde** : Dossier `SAUVEGARDE/` supprimé le 05/07/2026 (ancienne version sans gamification/chat, inutile)
- **Projet nettoyé le 05/07/2026** : fichiers inutiles supprimés (node_modules, .next, uploads, tsconfig.tsbuildinfo)
- **Refonte design complète (05/07/2026)** : toutes les pages refaites avec design glassmorphisme enrichi, logo créé, navbar refaite
- **Refonte style premium QClay (05/07/2026 soir)** : FloatingElements (livres/chiffres/diplômes animés en fond), bento grid, glows, mega-title, orbes, stat cards, landing refaite, dashboard refait, globals.css enrichi
- **Roadmap de finalisation** : `D:\Mon Projet\shareschool_Projet\ROADMAP-PRODUCTION.md`
- **Stack** : Next.js 16.2.10 (App Router) + TypeScript + Prisma 6 + MySQL (Aiven) + Tailwind CSS v4 + Framer Motion + React Email
- **Auth** : NextAuth v5 (beta.31) — Credentials provider, JWT sessions
- **Email** : Resend (clé API active, from `onboarding@resend.dev` → domaine perso en prod)
- **Upload** : Cloudinary (cloud `l5duachn`)
- **Base de données** : MySQL (Aiven) — SQLite supprimée
- **Git** : `https://github.com/kamyastro2000-stack/shareschool-ci.git` (branch `main`)
- **Déploiement** : Vercel

---

## 2. COMMANDES ESSENTIELLES

```bash
npm run dev                     # Lancer le serveur de dev (http://localhost:3000)
npm run build                   # Build production
npm run lint                    # Linter ESLint
npm test                        # Tests Vitest (18 tests)
npx prisma generate             # Regénérer Prisma Client
npx prisma db push              # Synchroniser le schéma avec la BDD
npx prisma db seed              # Réinitialiser les données de test
npx prisma db push --force-reset && npx prisma db seed  # Reset complet
npm run db:reset                # Reset BDD + seed
```

---

## 3. ARCHITECTURE BDD (Prisma)

### Tables (15+ modèles) :

| Table | Rôle |
|---|---|
| `Establishment` | Établissement scolaire (chaque client = un établissement) |
| `ClassRegistry` | Registre : lie les classes autorisées à un établissement |
| `Level` | Niveau (6ème → Terminale), avec `order` pour tri |
| `Series` | Série (A, C, A1, A2, D) liée à un niveau |
| `Classe` | Classe concrète (ex: "Tle D1") liée à Level + Series (optionnel) |
| `User` | Utilisateur avec rôle, lié à Establishment + Classe |
| `Subject` | Matière, liée à Establishment, avec `isFirstCycle` |
| `Resource` | Document uploadé, avec statut PENDING/APPROVED/REJECTED, lié à Subject + User + Classe + fichier Cloudinary |
| `Validation` | Historique des validations (qui, quand, action) |
| `Quiz` | Quiz avec questions |
| `QuizQuestion` | Question d'un quiz (options stockées en JSON, `correct` = index) |
| `QuizAttempt` | Tentative de quiz par un utilisateur |
| `XPTransaction` | Transactions de points d'expérience (montant, raison, type) |
| `Badge` | Définition des badges (nom, description, icône, critères) |
| `UserBadge` | Badge débloqué par un utilisateur |
| `LevelAccess` | Accès niveau pour le chat |
| `ChatRoom` | Salon de chat (par niveau + général) |
| `ChatMessage` | Message dans un salon |

### Relations clés :

- `Establishment --< ClassRegistry >-- Classe` (M:N via registre)
- `Level --< Series` (1:N)
- `Level --< Classe` (1:N) + `Level --< LevelAccess` (1:N) + `Level --< ChatRoom` (1:N)
- `Series --< Classe` (1:N)
- `Establishment --< User` (1:N)
- `User -- Classe` (N:1)
- `Subject -- Resource` (1:N)
- `Resource --< Validation` (1:N)
- `Resource -- User` (N:1)
- `Quiz --< QuizQuestion` (1:N)
- `Quiz --< QuizAttempt` (1:N)
- `User --< QuizAttempt` (1:N)
- `Quiz -- Subject` (N:1)
- `User --< XPTransaction` (1:N)
- `User --< UserBadge` (1:N)
- `Badge --< UserBadge` (1:N)
- `ChatRoom --< ChatMessage` (1:N)
- `User --< ChatMessage` (1:N)
- `Level --< LevelAccess` (1:N) — lien User → Level pour accès chat

### Rôles (enum `Role`) :
- `STUDENT` — joueur : XP, badges, classement, chat
- `CLASS_REP` — joueur : XP, badges, classement, valide les dépôts de sa classe
- `TEACHER` — NON-joueur : pas de jeu, publie cours, valide
- `ADMIN` — NON-joueur : pas de jeu, super-utilisateur

### Statuts ressource (enum `ResourceStatus`) :
- `PENDING` → en attente de validation
- `APPROVED` → publié
- `REJECTED` → rejeté

---

## 4. API ROUTES

| Route | Méthodes | Auth | Rôle |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | - | NextAuth handler |
| `/api/register` | POST | - | Inscription avec vérif registre |
| `/api/establishments` | GET | - | Liste des établissements actifs |
| `/api/classes/levels` | GET | - | Niveaux + séries |
| `/api/classes` | GET | - | Classes par levelId/seriesId |
| `/api/subjects` | GET | Auth | Matières selon cycle de l'élève |
| `/api/resources` | GET, POST | Auth | CRUD ressources |
| `/api/validate` | POST | Auth | Valider/rejeter (CLASS_REP, TEACHER, ADMIN) |
| `/api/upload` | POST | Auth | Upload fichier vers Cloudinary |
| `/api/users` | GET | ADMIN | Liste utilisateurs |
| `/api/verify-email` | POST, PATCH | Auth | Vérifier code email / renvoyer code |
| `/api/check-account` | GET | - | Vérifier existence compte + statut |
| `/api/admin/stats` | GET | ADMIN | Statistiques dashboard (avec totaux cliquables) |
| `/api/admin/users` | PATCH, DELETE | ADMIN | Activer/renvoyer code/supprimer utilisateurs |
| `/api/admin/resources` | GET, DELETE | ADMIN | Gestion admin des ressources (avec nettoyage Cloudinary) |
| `/api/admin/registry` | GET, POST, DELETE | ADMIN | Gestion registre classes |
| `/api/quiz` | GET, POST | Auth (POST: ADMIN/TEACHER) | CRUD quiz |
| `/api/quiz/[id]` | GET, PUT, DELETE | Auth | Quiz individuel |
| `/api/quiz/[id]/attempt` | POST | Auth | Démarrer tentative |
| `/api/quiz/[id]/submit` | POST | Auth | Soumettre réponses |
| `/api/quiz/results` | GET | Auth | Historique résultats personnels |
| `/api/send-email` | POST | - | Envoi email via Resend |
| `/api/leaderboard` | GET | Auth | Classement individuel (exclut ADMIN, TEACHER) |
| `/api/leaderboard/classes` | GET | Auth | Classement par classe |
| `/api/badges` | GET | Auth | Liste badges + mes badges débloqués |
| `/api/xp` | GET | Auth | Transactions XP de l'utilisateur |
| `/api/chat` | GET | Auth | Liste salons filtrés par niveau |
| `/api/chat/[roomId]/messages` | GET, POST | Auth | Messages chat (vérifie accès niveau) |
| `/api/me/profile` | GET, PUT | Auth | Profil personnel |

---

## 5. PAGES

| Route | Fichier | Accès |
|---|---|---|
| `/` | `src/app/page.tsx` | Public (landing page) |
| `/login` | `src/app/(auth)/login/` | Public |
| `/register` | `src/app/(auth)/register/` | Public |
| `/verify-email` | `src/app/(auth)/verify-email/` | Auth |
| `/dashboard` | `src/app/dashboard/page.tsx` | Auth |
| `/admin` | `src/app/admin/page.tsx` | ADMIN |
| `/quiz` | `src/app/quiz/page.tsx` | Auth |
| `/quiz/create` | `src/app/quiz/create/page.tsx` | ADMIN/TEACHER |
| `/quiz/[id]` | `src/app/quiz/[id]/page.tsx` | Auth |
| `/quiz/results` | `src/app/quiz/results/page.tsx` | Auth |
| `/profil` | `src/app/(app)/profil/page.tsx` | Auth |
| `/classement` | `src/app/(app)/classement/page.tsx` | Auth |
| `/chat` | `src/app/(app)/chat/page.tsx` | Auth |

---

## 6. COMPOSANTS RÉUTILISABLES

| Composant | Fichier |
|---|---|---|
| `Logo` | `src/components/Logo.tsx` (icône graduation + dégradé violet/orange) |
| `Navbar` | `src/components/Navbar.tsx` (role-based, logo intégré, menu desktop/mobile, profil dropdown animé) |
| `Providers` | `src/components/Providers.tsx` (SessionProvider) |
| `PageTransition` | `src/components/PageTransition.tsx` (Framer Motion) |
| `ResourceCard` | `src/components/ResourceCard.tsx` (icônes type fichier, status badges, validation actions, glass-card) |
| `UploadModal` | `src/components/UploadModal.tsx` (drag & drop, formatage taille, header design) |
| `LoadingSpinner` | `src/components/LoadingSpinner.tsx` |
| `ErrorMessage` | `src/components/ErrorMessage.tsx` |
| `SuccessMessage` | `src/components/SuccessMessage.tsx` |
| `FloatingElements` | `src/components/FloatingElements.tsx` (30 icônes scolaires animées en fond : livres, diplômes, crayons, atomes, chiffres/lettres, 5 animations différentes) |
| `VerificationCodeEmail` | `src/emails/verification-code.tsx` (code à 6 chiffres, React Email, dark mode) |
| `WelcomeEmail` | `src/emails/welcome.tsx` (bienvenue après activation, fonctionnalités, CTA) |
| `ResourceNotificationEmail` | `src/emails/resource-notification.tsx` (notification approbation/refus avec commentaire) |
| `Service email` | `src/lib/email.tsx` (centralisation Resend + React Email, 4 fonctions exportées) |

---

## 7. DESIGN SYSTEM

Fichier : `src/app/globals.css`

- **Fond** : Dégradé `#1e1b4b → #312e81 → #4338ca`
- **Glassmorphisme** : `.glass` (blur 16px, bordure rgba(255,255,255,0.12)), `.glass-strong` (blur 24px)
- **Boutons primaires** : `.gradient-btn` (dégradé `#6366f1 → #4f46e5`), `.gradient-btn-accent` (dégradé `#f97316 → #ea580c`)
- **Badges** : `.badge`, `.badge-primary`, `.badge-accent`, `.badge-success`, `.badge-info`, `.badge-warning`
- **Utilitaires** : `.card-hover` (scale + glow), `.skeleton`, `.progress-bar`, `.avatar`, `.tooltip`, `.floating-shape`, `.gradient-text`, `.bento-card`, `.bento-card-accent`, `.bento-icon`, `.stat-card`, `.stat-value`, `.premium-card`, `.mega-title`, `.mega-subtitle`, `.section-title`, `.gradient-border`, `.orb`, `.glow-primary`, `.glow-accent`, `.glow-text`
- **Couleurs** : primary (`#6366f1`), primary-light (`#818cf8`), accent (`#f97316`), success (`#22c55e`), warning (`#eab308`), error (`#ef4444`)
- **Animations** : `fade-in-up`, `fade-in`, `slide-in-right`, `scale-in`, `shimmer`, `pulse-glow`, `float`, `count-up`, `fe-float-0` à `fe-float-4` (flottants décoratifs), `float-slow`, `glow-pulse`, `slide-up`
- **Inputs** : `.input-field`, `.select-field` (styles réutilisables avec focus glow)
- **Stagger** : `.stagger-1` à `.stagger-5` pour apparition en cascade
- **Responsive** : mobile-first avec breakpoints Tailwind

---

## 8. SÉCURITÉ

- **Middleware** (`src/middleware.ts`) : redirige non-auth vers `/login`, bloque non-ADMIN sur `/admin` (déprécié dans Next 16 → migrer vers `proxy`)
- **Permissions** vérifiées côté serveur dans chaque API route
- **Upload Cloudinary** : types MIME autorisés, taille max (configuré côté client + serveur via validation.ts)
- **Rate limiting** : `src/lib/rate-limit.ts` — limite les tentatives de connexion, inscriptions, uploads
- **Validation Zod** : `src/lib/validation.ts` — schémas de validation pour inputs (email, password, register, login)
- **Security headers** : Content-Security-Policy, X-Frame-Options, Strict-Transport-Security
- **Timer quiz côté serveur** : durée vérifiée côté serveur au submit (en plus du timer client)
- **Cloisonnement ressources** : élève voit sa classe ; Terminale voit toutes les séries de Terminale
- **Cloisonnement chat** : accès vérifié par `LevelAccess` + levelId du salon
- **Registre** : bloqué à la racine (pas d'inscription si classe absente)
- **Passwords** : hashés avec bcrypt
- **Comptes inactifs bloqués** : vérification `isActive` dans check-account et login (inclut `null` comme `true` pour rétrocompatibilité)
- **ADMIN et TEACHER exclus du jeu** : pas d'XP, badges, classement (vérifié dans chaque endpoint)

---

## 9. DONNÉES DE TEST (seed)

Fichier : `prisma/seed.ts`

Établissement : **Lycée Scientifique d'Abidjan** (slug: `lycee-scientifique-abidjan`)

Niveaux : 6ème → Terminale (7 niveaux)
Séries : A, C (2nde) ; A1, A2, C, D (1ère, Terminale)
Classes : 20 classes avec registre complet
ChatRooms : 8 salons (général + 7 niveaux)
Badges : 10 badges (Premiers pas, Collectionneur, Expert quiz, etc.)

### Identifiants :

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@lsa.ci` | `admin123` |
| Professeur | `professeur@lsa.ci` | `teacher123` |
| Élève (Tle D1) | `eleve@lsa.ci` | `student123` |
| Chef de classe (Tle D1) | `chef@lsa.ci` | `rep123` |

### Matières :
- **1er cycle** (6ème→3ème) : Français, Anglais, Allemand/Espagnol, Mathématiques, Physique-Chimie, SVT, Histoire-Géographie, EDHC, Arts Plastiques, Musique, EPS
- **2nd cycle** (2nde→Terminale) : Français (Littérature), Anglais, Allemand/Espagnol, Mathématiques, Physique-Chimie, SVT, Histoire-Géographie, Arts Plastiques, Musique, Philosophie, EPS

---

## 10. PHASAGE RÉALISÉ

- [x] **Phase 1** — Fondations : multi-établissement, auth, rôles, validation documentaire, cloisonnement, matières
- [x] **Phase 2** — Support : emails Resend, messages de bienvenue, interface admin pro
- [x] **Phase 3** — Finition : design glassmorphisme, animations, responsive
- [x] **Phase 3.5** — Quiz : création, passage, résultats
- [x] **Phase 4** — Gamification : XP, badges, classements, chat cloisonné par niveau
- [x] **Phase 5** — Finalisation : profil joueur/non-joueur, upload Cloudinary, admin amélioré, vérification email
- [x] **Nettoyage** (05/07/2026) : suppression SAUVEGARDE/, node_modules/, .next/, uploads/, tsconfig.tsbuildinfo
- [x] **Refonte design (05/07/2026)** : toutes les pages refaites (landing, auth, dashboard, admin, profil, classement, chat, quiz liste, quiz [id], quiz create, quiz results) + Logo + Navbar + ResourceCard + UploadModal
- [x] **Refonte style premium QClay (05/07/2026 soir)** : FloatingElements (livres/chiffres/diplômes animés en fond), bento grid, glows, mega-title, orbes, stat cards, landing refaite, dashboard refait, globals.css enrichi
- [x] **Finalisation landing (05/07/2026 soir)** : Hero remplacé — image Gemini (`vozoydvozoydvozo.png`) avec animations d'entrée, dégradé cinématographique, barre d'info superposée ; Navbar affiche désormais le logo sur la page d'accueil (au lieu de `return null`)
- [x] **Phase 6 — Fondations (07/07/2026)** : Git + GitHub (remote, 5 commits), MySQL Aiven (migration, seed, SQLite supprimée), Tests Vitest (18 tests, 3 fichiers), Rate limiting, validation Zod, security headers, timer quiz serveur
- [ ] **Phase 7** — Production (Paiement, déploiement final, légal, monitoring) : voir `ROADMAP-PRODUCTION.md`

---

## 11. DÉCISIONS TECHNIQUES

1. **Next.js plutôt que React+Vite+Express** — un seul projet, déploiement Vercel simplifié, API routes intégrées
2. **Prisma 6** — MySQL (Aiven) en dev et prod, SQLite supprimée
3. **NextAuth v5** — moderne, JWT natif, PrismaAdapter
4. **Cloudinary** (pas upload local) — stockage cloud, upload API migré, suppression auto
5. **Options JSON dans QuizQuestion** — flexible sans table de jointure supplémentaire
6. **ADMIN et TEACHER exclus du jeu** — XP, niveaux, badges, classement réservés aux élèves
7. **Chat cloisonné par niveau** — chaque niveau a son salon + général, accès via LevelAccess
8. **Middleware déprécié** — Next.js 16 recommande `proxy` à la place, mais middleware fonctionne encore
9. **`isActive: null` traité comme `true`** — rétrocompatibilité avec comptes existants
10. **Code de vérification loggé dans la console** — contournement Resend (limité au compte)
11. **Auto-envoi du code vérification** — déclenché à l'arrivée sur `/verify-email`
12. **Logo texte SVG** — icône graduation + dégradé violet/orange, pas d'image uploadée
13. **Hooks toujours avant return conditionnel** — bug React évité dans Navbar (useEffect avant le `if`)
14. **MySQL Aiven** — base de données distante, plus de SQLite locale
15. **Rate limiting** — implémenté dans `src/lib/rate-limit.ts` avec Map en mémoire
16. **Validation Zod** — tous les inputs vérifiés côté serveur via `src/lib/validation.ts`
17. **Security headers** — configurés via Next.js dans `next.config.ts`
18. **Tests Vitest** — 18 tests unitaires (xp, cloudinary, rate-limit)
19. **GitHub** — dépôt `kamyastro2000-stack/shareschool-ci`, 5 commits, branch `main`
20. **Déploiement Vercel** — en ligne, middleware optimisé pour Vercel

---

## 12. SYSTÈME XP

Fichier : `src/lib/xp.ts`

### Seuils de niveaux (1-20) :
- Niveau 1 : 0 XP
- Niveaux 2-5 : 200 XP chacun
- Niveaux 6-10 : 300 XP chacun  
- Niveaux 11-15 : 500 XP chacun
- Niveaux 16-20 : 800 XP chacun
- Total pour niveau 20 : 8800 XP

### Actions XP (`XP_VALUES`) :
- UPLOAD_RESOURCE : +10 XP
- VALIDATE_RESOURCE : +25 XP  
- QUIZ_COMPLETE : +30 XP
- QUIZ_PERFECT : +50 XP
- DAILY_LOGIN : +5 XP
- BADGE_UNLOCKED : +100 XP

### Règles :
- ADMIN et TEACHER ne gagnent jamais d'XP (vérifié dans `awardXP()`)
- `getLevel(xp)` : calcule le niveau à partir du total XP
- `getXPProgress(xp, level)` : retourne XP actuels, XP requis, progression %
- Transactions enregistrées dans `XPTransaction`

### Badges (10 badges seed) :
- **Premiers pas** : Déposer sa première ressource
- **Contributeur** : 10 ressources approuvées
- **Collectionneur** : 50 ressources approuvées
- **Expert quiz** : Note parfaite à un quiz
- **Crack en quiz** : 10 quiz réussis
- **Validateur** : Valider 5 ressources (CLASS_REP uniquement)
- **Créateur** : Créer un quiz
- **Social** : Envoyer 10 messages dans le chat
- **Légende** : Atteindre le niveau 10
- **Ambassadeur** : Atteindre le niveau 20

---

## 13. ADMIN

Page : `src/app/admin/page.tsx`

### Fonctionnalités :
- **Stats cliquables** : utilisateurs, ressources, quiz, classes — clic = navigation à la section
- **Gestion des utilisateurs** : activer/désactiver, renvoyer code vérification, changer rôle (STUDENT/CLASS_REP/TEACHER), supprimer
- **Gestion des ressources** : lister, filtrer par statut/matière, valider (APPROVED/REJECTED avec raison), supprimer (avec nettoyage Cloudinary)
- **Registre des classes** : ajouter/supprimer des classes autorisées

### API endpoints admin :
- `GET /api/admin/stats` — stats dashboard
- `GET /api/admin/users` — liste utilisateurs
- `PATCH /api/admin/users` — activer, renvoyer code, changer rôle
- `DELETE /api/admin/users` — supprimer utilisateur
- `GET /api/admin/resources` — lister ressources avec filtre
- `DELETE /api/admin/resources` — supprimer ressource + fichier Cloudinary
- `GET /api/admin/registry` — lister registre
- `POST /api/admin/registry` — ajouter classe au registre
- `DELETE /api/admin/registry` — retirer classe du registre

---

## 14. CHAT

Page : `src/app/(app)/chat/page.tsx`

### Fonctionnalités :
- Liste des salons filtrés par niveau de l'utilisateur (LevelAccess)
- Salon "Général" accessible à tous les utilisateurs
- Chargement paginé des messages (anciens messages)
- Envoi de message en temps réel
- Vérification d'accès côté serveur (POST vérifie le levelId)

### API :
- `GET /api/chat` — liste salons accessibles
- `GET /api/chat/[roomId]/messages` — messages d'un salon (avec pagination)
- `POST /api/chat/[roomId]/messages` — envoyer un message (vérifie accès niveau)

### Cloisonnement :
- Élèves : voient uniquement les salons de leurs niveaux
- ADMIN/TEACHER : accès global à tous les salons

---

## 15. CLASSEMENT

Page : `src/app/(app)/classement/page.tsx`

### Fonctionnalités :
- **Classement individuel** : tous les joueurs (STUDENT + CLASS_REP) triés par XP descendant
- **Classement par classe** : XP total par classe
- **Recherche** : barre de recherche par nom d'utilisateur
- **Carte XP utilisateur** : en haut de page, niveau, barre de progression, XP actuel
- **Rang utilisateur** : affiché dans sa position dans le classement
- **Exclusion** : ADMIN et TEACHER exclus du classement

### API :
- `GET /api/leaderboard` — classement individuel (avec recherche et rang)
- `GET /api/leaderboard/classes` — classement par classe

---

## 16. PROFIL

Page : `src/app/(app)/profil/page.tsx`

### Comportement différencié :
- **Joueur (STUDENT, CLASS_REP)** :
  - Carte avec niveau, XP, barre de progression
  - Badges débloqués avec icônes
  - Historique des transactions XP
  - Informations utilisateur (nom, email, classe, rôle)
- **Non-joueur (ADMIN, TEACHER)** :
  - Informations utilisateur simplifiées sans XP/badges
  - Rôle affiché sans référence au jeu

### API :
- `GET /api/me/profile` — profil complet avec XP, badges, transactions
- `PUT /api/me/profile` — mise à jour profil

---

## 17. VÉRIFICATION EMAIL

Page : `src/app/(auth)/verify-email/`

### Fonctionnement :
- À l'arrivée sur la page, auto-envoi du code de vérification via `PATCH /api/verify-email`
- Le code est loggé dans la console (dev)
- Envoi via Resend avec try/catch (ne bloque pas si Resend échoue)
- Formulaire de saisie du code reçu
- `POST /api/verify-email` pour vérifier le code

### API :
- `POST /api/verify-email` — vérifier le code saisi
- `PATCH /api/verify-email` — renvoyer un nouveau code

---

## 18. ROADMAP PRODUCTION — PROCHAINES ÉTAPES

Voir le fichier complet : `ROADMAP-PRODUCTION.md`

### Résumé des priorités

- [x] **Fondations** : Git + GitHub, MySQL (Aiven), Tests (18 tests)
- [x] **Sécurité** : Rate limiting, validation Zod, security headers, timer quiz serveur
- [x] **Mise en ligne** : Déploiement Vercel effectué
- [ ] **Paiement** : Stripe, abonnements, dashboard client
- [ ] **Légal** : CGU/CGV, RGPD, cookies, mentions légales
- [ ] **Monitoring** : Sentry, Analytics, logs, favicon, SEO
- [ ] **CI/CD** : GitHub Actions, backup BDD
- [ ] **Finitions** : Landing page pro, logo, 404, accessibilité

---

## 19. À SAVOIR POUR LA SUITE

- Le middleware est déprécié dans Next.js 16 → migrer vers `proxy`
- `package.json#prisma` est déprécié → migrer vers `prisma.config.ts` (quand Prisma 7 sera stable)
- Cloudinary configuré dans `.env` et `src/lib/cloudinary.ts`
- `.env` contient des secrets (Resend, Cloudinary, NEXTAUTH_SECRET, DATABASE_URL) — **ne pas commit**
- `clsx` + `tailwind-merge` installés — utiliser `cn()` de `@/lib/utils` pour les classNames Tailwind
- Les types NextAuth sont complétés (`auth-types.ts`) — plus besoin de `as any` dans les callbacks
- Le build compile 38 routes sans erreur
- Le style QClay a été appliqué : bento grid, glows, mega-title, FloatingElements (30 icônes scolaires animées), stat cards, premium cards, orbes
- `FloatingElements.tsx` utilise 5 keyframes CSS (`fe-float-0` à `fe-float-4`) pour des mouvements variés des icônes en fond
- Le layout intègre `FloatingElements` dans le body avec `position: fixed; pointer-events: none`
- Le temps des quiz est vérifié côté serveur au submit (timer serveur actif)
- Rate limiting actif pour login, register, upload (Map en mémoire)
- Tests : 3 fichiers, 18 tests (xp, cloudinary, rate-limit) — `npm test`
- Mode production : `npm run build && npm start`
- NEXTAUTH_SECRET à changer en production
- Domaine personnalisé Resend à configurer pour la production (`RESEND_FROM` dans `.env`)
- Système email centralisé : `src/lib/email.tsx` + 3 templates React Email dans `src/emails/`
- Templates email professionnels avec `@react-email/components` et Tailwind (rendu → HTML inline)
- Email de bienvenue envoyé automatiquement après vérification du compte
- Notification email envoyée à l'auteur quand sa ressource est approuvée/refusée
- Mode simulation : si `RESEND_API_KEY` est manquant ou `re_xxxxx`, les emails sont loggés dans la console
- En dev, le code de vérification est aussi retourné dans la réponse API (`devCode`)
- Base de données : MySQL Aiven (plus de SQLite)
- Déploiement : Vercel (automatique depuis GitHub)
- GitHub : `https://github.com/kamyastro2000-stack/shareschool-ci`

---

## 20. STRUCTURE COMPLÈTE DES FICHIERS

```
D:\Mon Projet\shareschool_Projet\
├── .env                           # Variables d'environnement (secrets)
├── .gitignore
├── MEMOIRE.md                     # Ce fichier
├── ROADMAP-PRODUCTION.md          # Plan de finalisation pour la mise en production
├── next.config.ts                 # Config Next (remotePatterns Cloudinary, rewrites)
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── eslint.config.mjs
├── prisma/
│   ├── schema.prisma              # Schéma BDD (15+ modèles)
│   └── seed.ts                    # Données de test
└── src/
    ├── middleware.ts               # Auth middleware
    ├── lib/
    │   ├── prisma.ts              # PrismaClient singleton
    │   ├── auth.ts                # NextAuth config (Credentials provider)
    │   ├── auth-types.ts          # Augmentation de types NextAuth
    │   ├── cloudinary.ts          # Upload/delete Cloudinary
    │   ├── xp.ts                  # Système XP + badges (awardXP, getLevel, etc.)
    │   ├── xp-client.ts           # Utilitaires XP côté client
    │   ├── utils.ts               # Utilitaires (cn, etc.)
    │   ├── validation.ts          # Schémas Zod (email, password, register, login, MIME types)
    │   ├── rate-limit.ts          # Rate limiting (connexion, inscription, upload)
    │   └── email.tsx              # Service email centralisé (Resend + React Email)
    ├── emails/
    │   ├── verification-code.tsx  # Template code à 6 chiffres
    │   ├── welcome.tsx            # Template bienvenue après activation
    │   └── resource-notification.tsx # Template notification approbation/refus
    ├── components/
    │   ├── Navbar.tsx
    │   ├── Providers.tsx
    │   ├── PageTransition.tsx
    │   ├── ResourceCard.tsx
    │   ├── UploadModal.tsx
    │   ├── LoadingSpinner.tsx
    │   ├── ErrorMessage.tsx
    │   ├── SuccessMessage.tsx
    │   └── FloatingElements.tsx     # 30 icônes scolaires animées en fond
    └── app/
        ├── globals.css            # Design system
        ├── layout.tsx             # Layout racine
        ├── page.tsx               # Landing page
        ├── (auth)/
        │   ├── login/
        │   │   ├── page.tsx
        │   │   └── LoginForm.tsx
        │   ├── register/page.tsx
        │   └── verify-email/page.tsx
        ├── dashboard/page.tsx
        ├── admin/page.tsx
        ├── quiz/
        │   ├── page.tsx
        │   ├── [id]/page.tsx
        │   ├── create/page.tsx
        │   └── results/page.tsx
        ├── (app)/
        │   ├── profil/page.tsx
        │   ├── classement/page.tsx
        │   └── chat/page.tsx
        └── api/
            ├── auth/[...nextauth]/route.ts
            ├── register/route.ts
            ├── establishments/route.ts
            ├── verify-email/route.ts
            ├── check-account/route.ts
            ├── classes/route.ts + classes/levels/route.ts
            ├── subjects/route.ts
            ├── resources/route.ts
            ├── validate/route.ts
            ├── upload/route.ts
            ├── users/route.ts
            ├── me/profile/route.ts
            ├── send-email/route.ts
            ├── leaderboard/
            │   ├── route.ts
            │   └── classes/route.ts
            ├── badges/route.ts
            ├── xp/route.ts
            ├── chat/
            │   ├── route.ts
            │   └── [roomId]/messages/route.ts
            ├── admin/
            │   ├── stats/route.ts
            │   ├── users/route.ts
            │   ├── resources/route.ts
            │   └── registry/route.ts
            └── quiz/
                ├── route.ts
                ├── [id]/route.ts
                ├── [id]/attempt/route.ts
                ├── [id]/submit/route.ts
                └── results/route.ts
```
