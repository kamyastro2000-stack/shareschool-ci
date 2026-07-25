# SHARESCHOOL CI — MÉMOIRE COMPLÈTE DU PROJET

> Fichier mémoire généré le 04/07/2026 — Dernière mise à jour : 18/07/2026
> À lire en début de session pour tout retrouver.

---

## 1. CONTACT & IDENTITÉ

- **Projet** : ShareSchool CI — Plateforme de partage de ressources pédagogiques pour élèves ivoiriens
- **Client** : Kamya
- **Modèle** : SaaS B2B multi-établissement (vendu clé en main aux écoles)
- **Cahier des charges** : `C:\Users\Kamya\Desktop\mon projet.txt`
- **Emplacement du projet** : `D:\Mon Projet\shareschool_Projet`
- **Roadmap de finalisation** : `D:\Mon Projet\shareschool_Projet\ROADMAP-PRODUCTION.md`
- **Stack** : Next.js 16.2.10 (App Router) + TypeScript + Prisma 6 + MySQL (Aiven) + Tailwind CSS v4 + Framer Motion + React Email
- **Auth** : NextAuth v5 (beta.31) — Credentials provider, JWT sessions
- **Email** : Resend (clé API active, from `onboarding@resend.dev` → domaine perso en prod)
- **Upload** : Cloudinary (cloud `l5duachn`)
- **Base de données** : MySQL (Aiven) — SQLite supprimée
- **Git** : `https://github.com/kamyastro2000-stack/shareschool-ci.git` (branch `main`)
- **Déploiement** : Vercel (`https://shareschool-ci.vercel.app`)

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
| `Navbar` | `src/components/Navbar.tsx` (scroll-reactive glass, active link indicator, role-based, menu desktop/mobile, profil dropdown animé) |
| `Providers` | `src/components/Providers.tsx` (SessionProvider) |
| `PageTransition` | `src/components/PageTransition.tsx` (Framer Motion — fade/slide/scale entre routes) |
| `ResourceCard` | `src/components/ResourceCard.tsx` (icônes type fichier, status badges, validation actions, glass-card) |
| `UploadModal` | `src/components/UploadModal.tsx` (drag & drop, formatage taille, header design) |
| `LoadingSpinner` | `src/components/LoadingSpinner.tsx` |
| `ErrorMessage` | `src/components/ErrorMessage.tsx` |
| `SuccessMessage` | `src/components/SuccessMessage.tsx` |
| `FloatingElements` | `src/components/FloatingElements.tsx` (35 icônes scolaires animées en fond : livres, diplômes, crayons, atomes, chiffres/lettres, 5 animations différentes) |
| `VerificationCodeEmail` | `src/emails/verification-code.tsx` (code à 6 chiffres, React Email, dark mode) |
| `WelcomeEmail` | `src/emails/welcome.tsx` (bienvenue après activation, fonctionnalités, CTA) |
| `ResourceNotificationEmail` | `src/emails/resource-notification.tsx` (notification approbation/refus avec commentaire) |
| `Service email` | `src/lib/email.tsx` (centralisation Resend + React Email, 4 fonctions exportées) |

### Composants d'animation internes (dans `page.tsx`) :

| Composant | Fichier | Rôle |
|---|---|---|
| `ScrambleText` | `src/app/page.tsx` | Text scramble effect — défile entre des mots avec remplacement caractère par caractère (glitch) |
| `MagneticButton` | `src/app/page.tsx` | Bouton magnétique — suit la souris avec offset calculé (0.15x) |
| `BentoCard3D` | `src/app/page.tsx` | Carte bento 3D — tilt perspective (800px), glare radial gradient, border light localisée |
| `AnimatedCounter` | `src/app/page.tsx` | Compteur animé (landing) — easing cubic, IntersectionObserver |
| `AnimatedNumber` | `src/app/dashboard/page.tsx` | Compteur animé (dashboard) — easing cubic, stat-glow |
| `AnimatedXP` | `src/app/(app)/classement/page.tsx` | Compteur XP animé (classement) — delay staggeré par rang |

---

## 7. DESIGN SYSTEM

Fichier : `src/app/globals.css` (~1250 lignes)

### Identité visuelle :
- **Fond** : Dégradé `#080c14 → #0f1a2e → #1a2a40` (gradient-bg animé 20s)
- **Palette CI** : Orange (`#f77f00`), Vert (`#009e60`), Or (`#d4a017`) — drapeau ivoirien
- **Palette projet** : Primary (`#1e3a5f`), Accent (`#c9a84c`), Success (`#009e60`)

### Glassmorphisme :
- `.glass` : blur 18px, saturate 180%, bordure rgba(255,255,255,0.07)
- `.glass-strong` : blur 24px, saturate 180%, bordure rgba(255,255,255,0.12)
- `.glass-light` : blur 12px, bordure subtile
- `.glass-card` : hover translateY(-3px) + ombre profonde

### Boutons :
- `.gradient-btn` : dégradé primary (bleu)
- `.gradient-btn-ci` : dégradé CI (orange → vert) — **bouton principal**
- `.gradient-btn-accent` : dégradé accent (or)
- `.gradient-btn-success` / `.gradient-btn-error` : états
- Tous avec `::before` overlay au hover + `active:scale-0.97`

### Bento grid :
- `.bento-card` : glass + borderRadius 1.25rem + hover translateY(-4px) + glow shadow
- `.bento-card-3d` : **[NEW]** glass + perspective 800px + tilt 3D au survol + glare overlay + border light
- `.bento-card-ci` : variante CI (orange/vert)
- `.bento-card-accent` : variante accent (primary/or)
- `.bento-icon` : icône 2.75rem avec fond glass gradient
- `.bento-card-glare` : **[NEW]** overlay radial-gradient qui suit la souris
- `.bento-card-border-light` : **[NEW]** anneau lumineux localisé au curseur

### Éléments premium :
- `.premium-card` : glass 24px + borderRadius 1.5rem + hover translateY(-4px)
- `.mega-title` : `clamp(2.5rem, 6vw, 4.5rem)`, weight 800, letter-spacing -0.03em
- `.mega-subtitle` : `clamp(1rem, 2vw, 1.25rem)`, lineHeight 1.65, white/40
- `.gradient-text-full` : dégradé primary → or (clip text)
- `.gradient-text-ci` : dégradé orange → vert animé (gradient-shift 4s)
- `.gradient-border-ci` : bordure gradient CI animée (mask-composite)

### Gradients texte :
- `.gradient-text` : primary → primary-light
- `.gradient-text-accent` : or → accent-light
- `.gradient-text-full` : primary → or (multi-stop)
- `.gradient-text-ci` : CI orange → vert → orange (animé)

### Orbes & Backgrounds :
- `.orb` : blur 100px, pointer-events none
- `.orb-primary` / `.orb-ci-orange` / `.orb-ci-green` : couleurs
- `.bg-grid` : grille 60px avec lignes rgba(255,255,255,0.025)
- `.bg-grid-ci` : grille CI (orange/vert 0.06)
- `.ci-flag-strip` : drapeau CI (3 couleurs, flex)

### Badges :
- `.badge` : pill, padding 0.125rem 0.625rem
- `.badge-primary` : fond primary/30, texte bleu clair
- `.badge-accent` : fond accent/20, texte or clair
- `.badge-success` / `.badge-warning` / `.badge-error` / `.badge-info`

### Inputs :
- `.input-field` : fond rgba(255,255,255,0.04), focus glow primary
- `.select-field` : même style + flèche SVG custom

### Animations clés :

| Animation | Usage |
|---|---|
| `fade-in-up` | Entrée générale (y: 24px → 0) |
| `fade-in-down` | Entrée descendante |
| `slide-in-right` / `slide-in-left` | Entrée latérale |
| `scale-in` | Entrée par zoom (0.92 → 1) |
| `shimmer` | Skeleton loading (gradient qui traverse) |
| `shimmer-premium` | **[NEW]** Skeleton amélioré (5 stops, 300% bg-size, 2s) |
| `pulse-glow` / `glow-pulse` | Halo lumineux pulsé |
| `float` / `float-slow` | Flottement vertical |
| `float-3d` | Flottement 3D (rotateX + rotateY) |
| `fe-float-0` à `fe-float-4` | Mouvements variés des FloatingElements |
| `gradient-shift` | Dégradé qui bouge (20s pour bg, 4s pour texte CI) |
| `bounce-in` | Entrée rebond |
| `morph` | Blob qui change de forme (12s) |
| `aurora` | Orbe aurore boréale (20s) |
| `ken-burns` | Zoom + translate lent (image hero) |
| `podium-rise` | **[NEW]** Colonne du podium qui monte (spring bounce, transform-origin bottom) |
| `medal-glow` | **[NEW]** Pulse lumineux sur médaille d'or (drop-shadow) |
| `counter-glow` | **[NEW]** Halo subtil sur compteurs animés |
| `ripple` | Effet onde au clic |
| `progress-fill` | Barre de progression qui se remplit |
| `spin-slow` | Rotation lente (10s) |
| `pulse-ring` | Anneau qui s'étend et disparaît |

### Composants CSS réutilisables :

| Classe | Rôle |
|---|---|
| `.stat-card` | Carte de statistique (glass, hover translateY) |
| `.stat-value` | Valeur 1.75rem, weight 800, letter-spacing -0.02em |
| `.stat-label` | Label 0.8rem, white/35 |
| `.avatar` / `.avatar-sm/md/lg/xl` | Initiales sur fond gradient |
| `.tooltip` | Tooltip CSS pur (data-tooltip, hover show) |
| `.progress-bar` / `.progress-bar-fill` | Barre de progression (transition 0.8s) |
| `.section-title` | Label uppercase 0.7rem, letter-spacing 0.1em |
| `.section-divider` | Ligne gradient transparent → primary/or → transparent |
| `.notification-dot` | Point rouge pulsé (badge notification) |
| `.skeleton` | **[NEW]** Shimmer premium (5 stops, 300% bg, 2s) |
| `.ripple-effect` | Onde de clic |
| `.card-hover` | Hover translateY(-3px) + ombre |

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
- [x] **Refonte design** (05/07/2026) : toutes les pages refaites (glassmorphisme, logo, navbar, ResourceCard, UploadModal)
- [x] **Refonte style premium QClay** (05/07/2026) : FloatingElements, bento grid, glows, mega-title, orbes, stat cards, globals.css enrichi
- [x] **Finalisation landing** (05/07/2026) : Hero image Gemini, animations d'entrée, gradient cinématographique
- [x] **Phase 6 — Fondations prod** (07/07/2026) : Git + GitHub, MySQL Aiven, Tests Vitest (18), Rate limiting, Zod, security headers, timer quiz serveur
- [x] **Phase 6.5 — Animations premium** (18/07/2026) : voir détail ci-dessous
- [ ] **Phase 7** — Production (Paiement, déploiement final, légal, monitoring) : voir `ROADMAP-PRODUCTION.md`

### Détail Phase 6.5 — Animations premium (18/07/2026) :

**Landing page (`src/app/page.tsx`) :**
- **Text Scramble** : le mot clé du hero défile entre "réussir", "apprendre", "progresser", "briller", "grandir" avec remplacement caractère par caractère (glitch JS vanilla, pas de lib)
- **Magnetic CTA** : les boutons "Commencer" et "Se connecter" suivent la souris (offset 0.15x calculé via onMouseMove)
- **BentoCard3D** : composant réutilisable — tilt 3D (perspective 800px, rotation X/Y basée sur position souris), glare radial gradient localisé, border light qui suit le curseur
- **AnimatedCounter** amélioré : easing cubic `1 - (1-t)^3` au lieu de linéaire
- **Easing unifié** : `[0.25, 0.46, 0.45, 0.94]` partout pour cohérence

**Classement (`src/app/(app)/classement/page.tsx`) :**
- **Podium spring animations** : colonnes montent depuis le bas avec spring (stiffness 260, damping 20), avatars et médailles entrent avec delays séquentiels
- **Medal glow pulse** : médaille d'or a un ananneau qui pulse (scale + opacity en boucle)
- **Crown ring** : le 1er place a un anneau animé autour de l'avatar (border pulse)
- **AnimatedXP** : compteur animé par rang avec easing cubic et delay staggeré
- **Tab indicator animé** : barre gradient (orange→vert) slide entre "Élèves" et "Par classe" avec spring layout
- **List items** : entrée latérale `x: -15 → 0` au lieu de vertical

**Dashboard (`src/app/dashboard/page.tsx`) :**
- **AnimatedNumber** : chaque StatCard compte de 0 à la valeur avec easing cubic (via IntersectionObserver)
- **Stat card icons** : micro-hover `scale(1.1) + rotate(5deg)` via Framer Motion
- **XP progress bar** : animation de largeur Framer Motion (1.2s, ease custom)
- **Level badge** : entrée spring (stiffness 300, damping 15) pour le numéro
- **Tab indicator** : barre gradient animée entre onglets avec spring layout (stiffness 400, damping 28)
- **Skeleton amélioré** : shimmers premium avec layout avatar + titre + sous-titre, entrée staggerée
- **Empty state** : icône qui flotte (y: 0 → -6 → 0) en boucle infinie
- **Quick action icons** : micro-hover scale + rotate
- **Bouton Publier** : whileHover scale(1.03) + whileTap scale(0.97)

**Navbar (`src/components/Navbar.tsx`) :**
- **Scroll-reactive glass** : backdrop-filter monte de 0 à 24px et opacité du fond monte progressivement quand on scrolle (passif, sans RAF)
- **Active link indicator** : petit point gradient (orange → vert) qui suit le lien actif via `layoutId` Framer Motion (spring entre les liens)
- **Avatar button** : whileHover scale(1.05) + whileTap scale(0.95)
- **XP badge** : entrée scale au montage
- **Gestion inline styles** : la navbar gère son glass via style inline (pas de classe CSS statique) pour permettre la transition scroll

**CSS (`src/app/globals.css`) :**
- **`.bento-card-3d`** : nouveau composant glass + preserve-3d + glare + border-light
- **`.bento-card-glare`** : overlay radial-gradient qui suit la souris
- **`.bento-card-border-light`** : anneau lumineux localisé au curseur
- **`.skeleton` amélioré** : shimmer premium 5 stops, bg-size 300%, animation 2s
- **`@keyframes podium-rise`** : colonne du podium qui monte avec spring bounce
- **`@keyframes medal-glow`** : pulse lumineux drop-shadow sur médaille
- **`@keyframes counter-glow`** : halo subtil sur compteurs
- **`.tab-indicator`** : barre gradient animée (transition left/width 0.35s)
- **`.navbar-glass`** : transition backdrop-filter + backgroundColor
- **`.active-link-dot`** : point indicateur lien actif (scaleX animation)
- **`.stat-glow`** : animation counter-glow sur les valeurs de stats

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
19. **GitHub** — dépôt `kamyastro2000-stack/shareschool-ci`, 6 commits, branch `main`
20. **Déploiement Vercel** — en ligne, webhook GitHub auto-deploy
21. **Text Scramble** — JS vanilla + requestAnimationFrame, pas de lib externe (effet glitch caractère par caractère)
22. **Magnetic CTA** — offset `0.15x` du vecteur souris → translate, léger et 60fps
23. **BentoCard3D** — `perspective(800px)` + `rotateX/Y` basés sur position souris, glare radial-gradient, border light animée
24. **Podium spring** — Framer Motion spring `stiffness: 260, damping: 20` pour bounce naturel
25. **Scroll-reactive navbar** — `scrollY / 120 → [0, 1]` mappe backdrop-filter 0→24px + opacité bg, listener passif
26. **Tab indicator** — `layoutId` Framer Motion spring pour transition fluide entre onglets
27. **Easing unifié** — `[0.25, 0.46, 0.45, 0.94]` (custom cubic-bezier) partout pour cohérence visuelle
28. **AnimatedCounter/Eased** — easing `1 - (1-t)^3` (ease-out cubic) pour compteurs qui ralentissent à l'approche de la cible
29. **IntersectionObserver** — déclenche les animations de compteur uniquement quand visibles (pas de gaspillage CPU)

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

### Animations :
- **Podium** : colonnes montent avec spring bounce, médailles entrent par scale + rotate, avatars entrent par scale spring, 1er place a un glow pulse + crown ring
- **AnimatedXP** : compteur animé par rang (easing cubic, delay staggeré)
- **Tab indicator** : barre gradient slide entre onglets avec spring layout
- **List items** : entrée latérale x: -15 → 0 avec stagger

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
- [x] **Animations premium** : Text scramble, magnetic CTA, 3D bento, podium spring, animated counters, scroll-reactive navbar
- [ ] **Paiement** : Stripe, abonnements, dashboard client
- [ ] **Légal** : CGU/CGV, RGPD, cookies, mentions légales
- [ ] **Monitoring** : Sentry, Analytics, logs, favicon, SEO
- [ ] **CI/CD** : GitHub Actions, backup BDD
- [ ] **Finitions** : 404, accessibilité, responsive tests

---

## 19. À SAVOIR POUR LA SUITE

- Le middleware est déprécié dans Next.js 16 → migrer vers `proxy`
- `package.json#prisma` est déprécié → migrer vers `prisma.config.ts` (quand Prisma 7 sera stable)
- Cloudinary configuré dans `.env` et `src/lib/cloudinary.ts`
- `.env` contient des secrets (Resend, Cloudinary, NEXTAUTH_SECRET, DATABASE_URL) — **ne pas commit**
- `clsx` + `tailwind-merge` installés — utiliser `cn()` de `@/lib/utils` pour les classNames Tailwind
- Les types NextAuth sont complétés (`auth-types.ts`) — plus besoin de `as any` dans les callbacks
- Le build compile 38 routes sans erreur
- Le style QClay a été appliqué : bento grid, glows, mega-title, FloatingElements (35 icônes scolaires animées), stat cards, premium cards, orbes
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
- Déploiement : Vercel (auto-deploy depuis GitHub)
- GitHub : `https://github.com/kamyastro2000-stack/shareschool-ci`
- **Aucune dépendance externe ajoutée** pour les animations — tout est Framer Motion (déjà installé) + CSS + JS vanilla
- **Easing unifié** `[0.25, 0.46, 0.45, 0.94]` partout pour cohérence visuelle
- **Scroll-reactive navbar** gère son glass via `style` inline (pas de classe CSS statique) pour transition fluide
- **BentoCard3D** est un composant interne à `page.tsx` (pas dans `/components/`) — à extraire si réutilisé ailleurs
- **Text Scramble** utilise un vocabulaire de 5 mots et boucle en continu
- **Podium animations** : spring `stiffness: 260, damping: 20` pour bounce naturel, delays séquentiels (0s, 0.15s, 0.3s)

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
    │   ├── utils.ts               # Utilitaires (cn, getGreeting, etc.)
    │   ├── validation.ts          # Schémas Zod (email, password, register, login, MIME types)
    │   ├── rate-limit.ts          # Rate limiting (connexion, inscription, upload)
    │   └── email.tsx              # Service email centralisé (Resend + React Email)
    ├── emails/
    │   ├── verification-code.tsx  # Template code à 6 chiffres
    │   ├── welcome.tsx            # Template bienvenue après activation
    │   └── resource-notification.tsx # Template notification approbation/refus
    ├── components/
    │   ├── Logo.tsx               # Logo SVG (graduation + dégradé CI)
    │   ├── Navbar.tsx             # Nav scroll-reactive glass + active link indicator
    │   ├── Providers.tsx          # SessionProvider
    │   ├── PageTransition.tsx     # Framer Motion page transitions
    │   ├── ResourceCard.tsx       # Carte ressource (glass, badges, validation)
    │   ├── UploadModal.tsx        # Modal upload drag & drop
    │   ├── LoadingSpinner.tsx     # Spinner de chargement
    │   ├── ErrorMessage.tsx       # Message d'erreur
    │   ├── SuccessMessage.tsx     # Message de succès
    │   └── FloatingElements.tsx   # 35 icônes scolaires animées en fond
    └── app/
        ├── globals.css            # Design system (~1250 lignes)
        ├── layout.tsx             # Layout racine (FloatingElements + Providers + Navbar)
        ├── page.tsx               # Landing page (ScrambleText, MagneticButton, BentoCard3D, AnimatedCounter)
        ├── (auth)/
        │   ├── login/
        │   │   ├── page.tsx
        │   │   └── LoginForm.tsx  # Formulaire login glass
        │   ├── register/page.tsx
        │   └── verify-email/page.tsx
        ├── dashboard/page.tsx     # Dashboard (AnimatedNumber, stat cards, tab indicator, skeleton amélioré)
        ├── admin/page.tsx         # Admin (stats, users, resources, registry)
        ├── quiz/
        │   ├── page.tsx           # Liste quiz
        │   ├── [id]/page.tsx      # Quiz détail + passage
        │   ├── create/page.tsx    # Création quiz
        │   └── results/page.tsx   # Résultats
        ├── (app)/
        │   ├── profil/page.tsx    # Profil joueur/non-joueur
        │   ├── classement/page.tsx # Podium spring + medal glow + AnimatedXP + tab indicator
        │   └── chat/page.tsx      # Chat par niveau
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
