# Digital Signage Platform

Plateforme de signage digital (clone Media4Display) — **SvelteKit** · **Prisma** · **Socket.io** · **Lucia** · **Tailwind**.

Référence : [SPEC_v2.md](./SPEC_v2.md).

---

## Stack

- **Framework** : SvelteKit (fullstack, adapter-node)
- **Base de données** : SQLite (dev) / PostgreSQL (prod) via Prisma
- **Temps réel** : Socket.io (auth JWT player, rooms `screen:[id]`, room `admin` pour le monitoring)
- **Auth console** : Lucia Auth v3 (sessions, rôles ADMIN | EDITOR | VIEWER)
- **Auth player** : JWT HMAC-SHA256
- **CSS** : Tailwind CSS v4
- **UI** : shadcn-svelte

---

## Avancement (SPEC_v2)

### Phase 1 — Fondations ✅

| Élément | Statut |
|--------|--------|
| Setup SvelteKit + Prisma + SQLite + Tailwind + shadcn-svelte | ✅ |
| Auth console (Lucia : login, sessions, rôles) | ✅ |
| CRUD Sites + ScreenGroups + Screens | ✅ |
| Activation player (token 24h + QR code + POST /api/player/activate) | ✅ |
| Auth WebSocket (JWT player, rooms par screenId) | ✅ |
| Player basique (plein écran, 1 zone, images/vidéos, FADE) | ✅ |
| Heartbeat + events WebSocket (heartbeat, screenshot_response) | ✅ |
| Tableau de bord monitoring (statut, screenshot, reload, refresh) | ✅ |

### Phase 2 — Contenu & Planification ✅ (partiel)

| Élément | Statut |
|--------|--------|
| Médiathèque (CRUD par URL, pas d’upload S3) | ✅ partiel |
| Job BullMQ (encoding vidéo, thumbnails) | ❌ |
| Playlists (1 zone, versioning, items) | ✅ |
| Planification (schedules : plage, priorité, jours) | ✅ |
| Résolution conflits planning (avertissement) | ❌ |
| Console admin (layout, nav) | ✅ |
| **Tableau de bord console** (page d’accueil `/admin`) : stats, sites/écrans par site, aperçu plannings, logs commandes | ✅ |
| Système d’alertes urgentes | ❌ |

### Phase 3 — Monitoring & Commandes

| Élément | Statut |
|--------|--------|
| Heartbeat enrichi + rétention | ✅ en base, pas de purge 7j |
| Screenshots à la demande (html2canvas → store mémoire) | ✅ (S3 plus tard) |
| Screenshots automatiques (cron) | ❌ |
| Commandes WebSocket + log ScreenCommand | ✅ |
| Agent local (restart browser, reboot) | ❌ |
| Gestion erreurs player (screen:error, écran de secours) | ✅ |
| Alertes offline (email BullMQ) | ❌ |
| Proof of Play | ❌ |

### Phases 4 à 6

- **Phase 4** : Templates WYSIWYG, player multi-zones, zones TICKER/CLOCK/WEATHER — ❌ (templates CRUD seulement).
- **Phase 5** : DataSources, zone DATASET, rapports Proof of Play / uptime — ❌
- **Phase 6** : Service Worker offline, S3, Redis adapter, purges BullMQ, permissions fines — ❌

---

## Installation

```bash
npm install --legacy-peer-deps
cp .env.example .env
# Éditer .env : DATABASE_URL, PLAYER_JWT_SECRET, LUCIA_SECRET
npx prisma migrate dev
npx prisma db seed   # optionnel : admin@localhost / admin123
```

## Développement

```bash
npm run dev
```

- App : http://localhost:5173
- Redirection `/` → `/admin` ; sans session → `/admin/login`
- **En dev** : Socket.io n’est pas attaché (serveur Vite seul). Le player et le monitoring fonctionnent en REST (schedule, heartbeat, commandes). Pour le temps réel et les captures, lancer la prod locale (voir ci‑dessous).

## Build & production

```bash
npm run build
npm run start
```

`npm run start` lance le serveur personnalisé (`tsx server.ts`) qui attache Socket.io au handler SvelteKit. Port par défaut : 3000 (`PORT`).

Pour tester avec Socket.io en local : après `npm run build`, lancer `npm run start` et ouvrir l’app sur http://localhost:3000.

---

## Variables d’environnement

Voir `.env.example`. Obligatoires :

- `DATABASE_URL` — SQLite : `file:./dev.db` (à la racine du projet, pas dans `prisma/`)
- `PLAYER_JWT_SECRET` — Secret pour signer les JWT des players (min 32 caractères)
- `LUCIA_SECRET` — Secret pour les sessions (ex. `openssl rand -base64 32`)

---

## Parcours type

1. **Console** : se connecter (`/admin/login`). La page d’accueil (`/admin`) affiche le **tableau de bord** : stats (sites, écrans, en ligne, playlists, plannings, médias), sites avec écrans, aperçu des plannings, tableau des écrans, dernières commandes.
2. **Sites & écrans** : créer un site, un groupe, un écran (menu Sites, Écrans).
3. **Activation** : `/admin/screens/[id]/activate` → ouvrir l’URL (ou flasher le QR) sur le device player.
4. **Contenu** : créer des **médias** (URL), un **template**, une **playlist** (médias + ordre), un **schedule** (écran ou groupe + playlist + plage horaire).
5. **Player** : après activation, le player affiche la playlist planifiée sur `/player/[screenId]`. Rafraîchissement à distance : bouton depuis la fiche écran ou le monitoring ; si Socket.io est indisponible (ex. en dev), le player poll `/api/player/[screenId]/reload-check` toutes les 15 s.
6. **Monitoring** : `/admin/monitoring` — statut des écrans, screenshot, recharger playlist, refresh navigateur.

---

## Structure utile

| Chemin | Rôle |
|--------|------|
| `prisma/schema.prisma` | Modèle de données (SPEC_v2) |
| `src/lib/server/auth.ts` | Lucia (sessions, rôles) |
| `src/lib/server/socket.ts` | Socket.io (JWT player, rooms, heartbeat, screenshot) |
| `src/lib/server/player-jwt.ts` | Signature / vérification JWT player |
| `src/lib/server/player-auth.ts` | Helper `requirePlayerAuth` pour les API player |
| `src/lib/server/screenshot-store.ts` | Dernière capture par écran (mémoire) |
| `src/lib/server/reload-request-store.ts` | Demande de rechargement player (fallback sans Socket.io) |
| `src/hooks.server.ts` | Validation de session (console) |
| `server.ts` | Point d’entrée production (handler + Socket.io) |
| `src/routes/admin/` | Console : tableau de bord (`/admin`), sites, écrans, médias, templates, playlists, planification, monitoring |
| `src/routes/player/` | Activation et page player plein écran |
| `src/routes/api/player/` | Schedule, playlist, heartbeat (auth JWT) |
| `src/routes/api/admin/` | CRUD + commandes écrans |

Prompts Cursor détaillés : fin de [SPEC_v2.md](./SPEC_v2.md).
