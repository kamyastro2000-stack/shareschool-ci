# ShareSchool CI — Roadmap de Finalisation

> Projet : SaaS B2B de partage de ressources pédagogiques pour élèves ivoiriens
> Statut actuel : Phases 1 à 5 terminées (MVP complet)
> Objectif : Rendre le projet réel, déployé, payant et sécurisé

---

## Priorité 1 — Fondations (indispensable)

- [ ] **Git & GitHub**
  - `git init` + premier commit
  - Créer un dépôt privé GitHub
  - Pousser le code (sans `.env`)
  - Ajouter un `.gitignore` propre

- [ ] **Base de données MySQL**
  - Créer une base MySQL en ligne (PlanetScale, Railway, AWS RDS, ou OVH)
  - Mettre à jour `DATABASE_URL` dans `.env`
  - Lancer `npx prisma db push`
  - Supprimer le fichier `prisma/dev.db`

- [ ] **Tests**
  - Tests unitaires pour `src/lib/xp.ts`
  - Tests unitaires pour `src/lib/cloudinary.ts`
  - Tests API pour les routes principales (auth, quiz, ressources)
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

- [ ] **Déploiement**
  - Choisir un hébergeur : Vercel (recommandé) ou OVH
  - Déployer l'application
  - Vérifier que tout fonctionne

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

- [ ] **Rate limiting**
  - Limiter les tentatives de connexion
  - Limiter les inscriptions par IP
  - Limiter les uploads

- [ ] **Validation renforcée**
  - Vérifier tous les inputs côté serveur (Zod ou Validator)
  - Vérifier les types MIME des fichiers uploadés côté serveur
  - Limiter la taille des fichiers côté serveur

- [ ] **Headers de sécurité**
  - Content-Security-Policy
  - X-Frame-Options
  - Strict-Transport-Security

- [ ] **Timer quiz côté serveur**
  - Ajouter une vérification du temps côté serveur (actuellement client seulement)

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

| Priorité | Durée estimée | Dépend de |
|---|---|---|
| P1 — Fondations | 2-3 jours | Rien |
| P2 — Paiement | 3-5 jours | P1 (Git + BDD) |
| P3 — Mise en ligne | 1-2 jours | P1 (Git + BDD) |
| P4 — Légal | 1-2 jours | Rien (peut être en parallèle) |
| P5 — Sécurité | 2-3 jours | P3 (déploiement) |
| P6 — Monitoring | 1-2 jours | P3 (déploiement) |
| P7 — CI/CD | 1 jour | P1 (Git) |
| P8 — Finitions | 2-3 jours | N'importe quand |

**Total estimé : 2 à 3 semaines à temps plein**

---

> Prochaine étape suggérée : **Git + GitHub** (sauvegarder le code avant tout)
