# Digital Signage Platform

Plateforme de signage digital (clone Media4Display) — **SvelteKit** · **Prisma** · **Socket.io** · **Lucia** · **Tailwind**.

Voir [SPEC_v2.md](./SPEC_v2.md) pour la spécification complète.

## Stack

- **Framework** : SvelteKit (fullstack, adapter-node)
- **Base de données** : SQLite (dev) / PostgreSQL (prod) via Prisma
- **Temps réel** : Socket.io (auth JWT player, rooms par écran)
- **Auth console** : Lucia Auth v3 (sessions, rôles ADMIN | EDITOR | VIEWER)
- **Auth player** : JWT HMAC-SHA256
- **CSS** : Tailwind CSS v4
- **UI** : shadcn-svelte (config dans `components.json`)

## Prérequis

- Node.js 20+
- npm (ou pnpm/yarn)

## Installation

```bash
npm install --legacy-peer-deps
cp .env.example .env
# Éditer .env : DATABASE_URL, PLAYER_JWT_SECRET, LUCIA_SECRET
npx prisma migrate dev
```

## Développement

```bash
npm run dev
```

- App : http://localhost:5173
- Redirection `/` → `/admin` ; sans session → `/admin/login`
- Socket.io est attaché au serveur Vite en dev (path `/socket.io`)

## Build & production

```bash
npm run build
npm run start
```

`npm run start` lance le serveur personnalisé (tsx server.ts) qui attache Socket.io au handler SvelteKit. Port par défaut : 3000 (variable `PORT`).

## Variables d'environnement

Voir `.env.example`. Obligatoires :

- `DATABASE_URL` — SQLite : `file:./dev.db` (chemin relatif au dossier `prisma/`)
- `PLAYER_JWT_SECRET` — Secret pour signer les JWT des players (min 32 caractères)
- `LUCIA_SECRET` — Secret pour les sessions (ex. `openssl rand -base64 32`)

## Structure utile

- `prisma/schema.prisma` — Modèle de données (SPEC_v2)
- `src/lib/server/auth.ts` — Lucia (sessions, rôles)
- `src/lib/server/socket.ts` — Socket.io (création serveur, auth JWT, rooms `screen:[screenId]`)
- `src/hooks.server.ts` — Validation de session (console)
- `server.ts` — Point d’entrée production (handler + Socket.io)
- `src/routes/admin/` — Console (layout, login, pages à compléter)

## Prochaines étapes (Phase 1)

- [ ] Implémenter l’action de login (Lucia createSession)
- [ ] CRUD Sites / ScreenGroups / Screens
- [ ] Activation player (token + QR code + POST /api/player/activate)
- [ ] Page /player/[screenId] et heartbeat WebSocket
- [ ] Page /admin/monitoring temps réel

Voir les prompts Cursor dans SPEC_v2.md (fin du document).
