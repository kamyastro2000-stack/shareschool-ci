# ShareSchool CI — Roadmap de Finalisation

> Projet : SaaS B2B de partage de ressources pédagogiques pour élèves ivoiriens
> Statut actuel : Phases 1 à 6 terminées (MVP complet + Fondations prod)
> Objectif : Rendre le projet payant et monitoring

---

## Priorité 1 — Fondations (indispensable) ✅

- [x] **Git & GitHub**
  - Dépôt : `kamyastro2000-stack/shareschool-ci`
  - Branch `main` — 5 commits
  - `.gitignore` propre (`.env`, `node_modules`, `.next`)

- [x] **Base de données MySQL**
  - Base MySQL Aiven active
  - `DATABASE_URL` configurée dans `.env`
  - `npx prisma db push` exécuté
  - Fichier `prisma/dev.db` supprimé

- [x] **Tests**
  - 18 tests unitaires (xp, cloudinary, rate-limit)
  - `npm test` opérationnel

---

## Priorité 2 — Modèle économique (gagne de l'argent)

- [ ] **Paiement Stripe**
  - Créer un compte Stripe
  - Intégrer Stripe Checkout ou Stripe Billing
  - Définir les formules (mensuel / annuel / par établissement)
  - Page admin du statut d'abonnement
  - Webhook Stripe pour gérer les annulations

- [ ] **Dashboard client (établissement)**
  - Interface propre à chaque école cliente
  - Vue de ses élèves, classes, profs
  - Statistiques d'usage (téléchargements, quiz, connexions)

---

## Priorité 3 — Mise en ligne (accessible depuis l'extérieur)

- [x] **Déploiement**
  - Hébergeur : Vercel
  - Déployé et fonctionnel

- [ ] **Domaine personnalisé**
  - Acheter un nom de domaine (ex: shareschool.ci, shareschool.education)
  - Configurer les DNS
  - Mettre `NEXTAUTH_URL` et `NEXT_PUBLIC_APP_URL` à jour

- [ ] **Email professionnel**
  - Configurer un domaine personnalisé sur Resend
  - Mettre à jour `RESEND_FROM` (ex: noreply@shareschool.ci)
  - Configurer SPF, DKIM, DMARC

- [ ] **SSL / HTTPS**
  - Normalement automatique avec Vercel
  - Vérifier que tout passe en HTTPS

---

## Priorité 4 — Légal & Conformité (obligatoire)

- [ ] **Mentions légales**
  - Nom de l'entreprise, adresse, contact, SIRET/RC

- [ ] **CGU / CGV**
  - Conditions générales d'utilisation (élèves)
  - Conditions générales de vente (établissements)

- [ ] **Politique de confidentialité (RGPD)**
  - Quelles données sont collectées
  - Comment elles sont stockées et protégées
  - Droit de suppression

- [ ] **Bannière de cookies**
  - Consentement obligatoire
  - Solution simple : CookieConsent ou React Cookie Banner

- [ ] **Page contact / support**
  - Formulaire de contact
  - Email support

---

## Priorité 5 — Sécurité (protéger les données)

- [x] **Rate limiting**
  - Limiter les tentatives de connexion ✅
  - Limiter les inscriptions par IP ✅
  - Limiter les uploads ✅

- [x] **Validation renforcée**
  - Vérifier tous les inputs côté serveur (Zod) ✅
  - Vérifier les types MIME des fichiers uploadés côté serveur ✅
  - Limiter la taille des fichiers côté serveur ✅

- [x] **Headers de sécurité**
  - Content-Security-Policy ✅
  - X-Frame-Options ✅
  - Strict-Transport-Security ✅

- [x] **Timer quiz côté serveur**
  - Vérification du temps côté serveur au submit ✅

---

## Priorité 6 — Qualité & Monitoring

- [ ] **Sentry (monitoring d'erreurs)**
  - Créer un compte Sentry
  - Installer `@sentry/nextjs`
  - Capturer les erreurs côté serveur et client

- [ ] **Google Analytics ou Plausible**
  - Analytics pour voir le trafic
  - Plausible (respectueux des données) recommandé

- [ ] **Logs**
  - Logger les actions importantes (connexions, uploads, suppressions)
  - Solution : Logtail, Axiom, ou Winston

- [ ] **Favicon**
  - Créer un favicon pour le site

- [ ] **SEO**
  - Sitemap (`sitemap.ts`)
  - Robots.txt
  - Métadonnées Open Graph complètes
  - Balises meta description sur chaque page

---

## Priorité 7 — CI/CD & Maintenance

- [ ] **CI/CD (GitHub Actions)**
  - Pipeline : lint → test → build → deploy
  - Branche `main` = production
  - Branche `develop` = dev

- [ ] **Script de backup BDD**
  - Backup automatique de la base MySQL
  - Backup Cloudinary (images)

---

## Priorité 8 — Finitions & Design

- [ ] **Landing page pro**
  - Présentation du produit
  - Tarifs
  - Témoignages
  - Formulaire de contact / démo

- [ ] **Logo**
  - Créer un logo pour ShareSchool CI
  - L'utiliser partout (Navbar, favicon, emails)

- [ ] **Page 404 personnalisée**
- [ ] **Page de maintenance**
- [ ] **Mode sombre / clair** (optionnel)
- [ ] **Responsive : tests sur mobile**
- [ ] **Accessibilité (a11y) de base**

---

## Calendrier suggéré

| Priorité | Statut | Durée estimée |
|---|---|---|
| P1 — Fondations | ✅ Terminé | 2-3 jours |
| P5 — Sécurité | ✅ Terminé | 2-3 jours |
| P3 — Mise en ligne | ✅ Terminé (Vercel) | 1-2 jours |
| P2 — Paiement | ❌ À faire | 3-5 jours |
| P4 — Légal | ❌ À faire | 1-2 jours |
| P6 — Monitoring | ❌ À faire | 1-2 jours |
| P7 — CI/CD | ❌ À faire | 1 jour |
| P8 — Finitions | ❌ À faire | 2-3 jours |

**Total restant estimé : 1 à 2 semaines**

---

> Prochaine étape suggérée : **Paiement Stripe** (générer des revenus)
