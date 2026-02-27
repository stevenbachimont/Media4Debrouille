# Digital Signage Platform — Spécification v2
> Clone Media4Display — SvelteKit · Prisma · Socket.io · Lucia · S3
> Version 2.1 — Finalisée le 26/02/2026

---

## Glossaire / Conventions

| Terme | Définition |
|---|---|
| **Player** | Navigateur Chromium tournant en kiosk mode sur la machine d'affichage |
| **Console** | Interface web d'administration (accès réservé aux utilisateurs authentifiés) |
| **Site** | Lieu physique regroupant un ou plusieurs écrans (ex: "Siège Paris") |
| **Groupe** | Regroupement logique d'écrans au sein d'un site |
| **Écran** | Entité logique représentant un player enregistré |
| **Template** | Gabarit de mise en page définissant des zones d'affichage |
| **Playlist** | Liste ordonnée de médias associée à un template |
| **Planning** | Règle d'assignation d'une playlist à un écran/groupe sur une plage horaire |
| **Heartbeat** | Signal envoyé toutes les 30s par le player pour indiquer son état |
| **Proof of Play** | Log de diffusion prouvant qu'un média a été joué sur un écran |

---

## Stack technique

| Couche | Technologie | Remarque |
|---|---|---|
| Framework | SvelteKit (fullstack, SSR + API routes) | |
| Base de données | SQLite (dev) / PostgreSQL (prod) via Prisma ORM | |
| Temps réel | Socket.io + Redis Adapter (prod) | Redis pour multi-instances |
| File de jobs | BullMQ + Redis | Transcoding ffmpeg, emails |
| Stockage médias | Scaleway Object Storage ou Cloudflare R2 (S3) | URLs absolues CDN |
| CDN | Cloudflare | Devant le serveur |
| Auth console | Lucia Auth (sessions + rôles) | |
| Auth player | Token JWT signé HMAC-SHA256 | Voir section enregistrement |
| CSS | Tailwind CSS + shadcn-svelte | |
| Screenshots | html2canvas (côté player) | Voir limitations |
| Agent local | Service systemd Node.js (optionnel) | Reboot OS sécurisé |

---

## Architecture générale

```
[Console Admin Web]
        ↕ HTTPS + session cookie (Lucia)
[Serveur Central SvelteKit]  ←→  [PostgreSQL]
        ↕ WSS (Socket.io)    ←→  [Redis (Socket adapter + BullMQ)]
        ↕ HTTPS (REST)            ↕
[Players distants]           [S3 / CDN (médias + screenshots)]
  - Paris (3 écrans)
  - Lyon  (5 écrans)
  - Nantes (2 écrans)

[Agent local optionnel]  ←→  Player (localhost:3001)
  systemd service              reboot, restart browser
```

Les players se connectent uniquement en **HTTPS/WSS sortant (port 443)**.
Aucun VPN requis, aucune IP fixe côté écran.

---

## Enregistrement et authentification des players

### Première activation — obtention du screenId

Un écran ne peut pas s'enregistrer librement. Le flux est le suivant :

```
1. Admin crée un "écran" dans la console → génère un token d'activation unique (UUID v4, TTL 24h)
2. Admin accède à /admin/screens/[id]/activate → affiche un QR code et une URL
   URL : https://[domaine]/player/activate?token=xxxx
3. Sur la machine player, ouvrir cette URL dans Chromium
4. Le player POST /api/player/activate { token }
5. Le serveur valide le token, crée la liaison token ↔ screenId, retourne un JWT player
6. Le player stocke le JWT dans localStorage et redirige vers /player/[screenId]
7. Le token d'activation est invalidé (usage unique)
```

### JWT Player
```typescript
// Payload JWT signé avec SECRET_KEY (env variable)
{
  sub: screenId,       // ID de l'écran
  iat: timestamp,      // émis le
  // Pas d'expiration : le JWT est valable jusqu'à révocation explicite
}
```

- Signé en **HMAC-SHA256** avec `PLAYER_JWT_SECRET` (variable d'environnement)
- Transmis dans chaque requête REST : header `Authorization: Bearer <token>`
- Transmis à la connexion Socket.io : `{ auth: { token: jwt } }` dans les options client
- Révocable depuis la console (blacklist en DB ou rotation du secret par écran)

### Authentification WebSocket

```typescript
// hooks.server.ts — middleware Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('Unauthorized'))
  try {
    const payload = verifyPlayerJWT(token) // lève si invalide
    socket.data.screenId = payload.sub
    socket.join(`screen:${payload.sub}`) // room dédiée
    next()
  } catch {
    next(new Error('Unauthorized'))
  }
})
```

Chaque player est isolé dans sa propre **room Socket.io** (`screen:[screenId]`).
Les events ciblés sont émis via `io.to('screen:[screenId]').emit(...)`.
Les broadcasts (alertes ALL) utilisent `io.emit(...)`.

**Connexion Console (monitoring) :**
- Les utilisateurs authentifiés (session Lucia) qui ouvrent une page admin (ex. `/admin/monitoring`) peuvent se connecter au même serveur Socket.io en passant le cookie de session (ou un token court dérivé de la session) dans le handshake.
- Le serveur authentifie la session côté HTTP puis associe le socket à un utilisateur ; le socket rejoint la room `admin`.
- À chaque réception de `screen:heartbeat`, le serveur : (1) persiste les métriques en base (ScreenHeartbeat, mise à jour de Screen.lastSeen, status, etc.) ; (2) ré-émet un event résumé vers la room `admin` (ex. `admin:screen_status` avec `{ screenId, status, currentPlaylistId, currentMediaName, uptime, lastSeen, ... }`) pour mettre à jour le tableau de bord en temps réel sans exposer tous les détails.
- Seuls les sockets dans la room `admin` reçoivent ces events ; les players restent dans leur room `screen:[screenId]` uniquement.

---

## Modèle de données complet

### User
```
id, email, passwordHash
role: ADMIN | EDITOR | VIEWER
createdAt, lastLoginAt
```

### Site
```
id, name, city, address
timezone (ex: "Europe/Paris")
contactName, contactEmail
createdAt
```

### ScreenGroup
```
id, name, description
siteId (FK → Site)
```

### Screen
```
id, name, description
siteId (FK → Site)
groupId (FK → ScreenGroup)
activationToken (nullable, TTL 24h)
activationTokenExpiresAt
playerJWTBlacklisted (boolean — révocation)
status: ONLINE | OFFLINE | WARNING
lastSeen (datetime)
resolution (ex: "1920x1080")
orientation: LANDSCAPE | PORTRAIT
playerVersion (string)
ipAddress
uptime (secondes)
currentPlaylistId
currentMediaName
lastScreenshotKey (clé S3, nullable)
lastScreenshotAt
createdAt
```

### Media
```
id, name
type: IMAGE | VIDEO | HTML | PDF | WEBPAGE | RSS | DATASET
s3Key (chemin S3) ou url (pour WEBPAGE/RSS)
cdnUrl (URL publique CDN)
duration (secondes)
thumbnailS3Key
thumbnailCdnUrl
fileSize, mimeType
encodingStatus: PENDING | PROCESSING | DONE | ERROR (pour vidéos)
tags (JSON array)
validFrom, validUntil
createdAt, updatedAt
createdBy (FK → User)
```

### Template
```
id, name, description
thumbnailCdnUrl
zonesJson (JSON — array de Zone)
createdAt, updatedAt
createdBy (FK → User)
```

### Zone (structure JSON dans Template.zonesJson)
```typescript
{
  id: string,
  name: string,
  type: 'CONTENT' | 'TICKER' | 'CLOCK' | 'WEATHER' | 'DATASET',
  x: number,        // % de la largeur écran
  y: number,        // % de la hauteur écran
  width: number,    // %
  height: number,   // %
  zIndex: number,
  backgroundColor: string,
  padding: number,
  styleJson: Record<string, unknown>  // options spécifiques au type
}
```

### Playlist
```
id, name, description
templateId (FK → Template)
defaultDuration (secondes)
transition: FADE | SLIDE | NONE
version (entier, incrémenté à chaque modification — pour cache invalidation)
createdAt, updatedAt
createdBy (FK → User)
```

### PlaylistItem
```
id, playlistId, mediaId
zoneId (ID de la zone dans le template)
order, duration (override nullable)
transitionIn, transitionOut
```

### Schedule
```
id, name
targetType: SCREEN | GROUP
targetId
playlistId (FK → Playlist)
priority (entier 1-100, plus élevé = prioritaire)
startDate, endDate (UTC)
startTime, endTime (HH:MM, interprété dans le timezone du Site)
daysOfWeek (JSON array: [0..6], 0=dimanche)
isRecurring (boolean)
isInterruption (boolean)
createdAt, updatedAt
createdBy (FK → User)
```

**Règle de conflit de priorité égale :**
Si deux plannings actifs ont la même priorité et se chevauchent,
le planning **modifié le plus récemment** (`updatedAt` DESC) est appliqué.
Un avertissement est affiché dans la console lors de la sauvegarde.

**Gestion des changements d'heure (été/hiver) :**
- Toutes les plages horaires sont stockées en heure locale du site (HH:MM)
- Le serveur utilise la bibliothèque `date-fns-tz` avec `Europe/Paris` (ou le timezone du site) pour calculer les fenêtres UTC réelles
- Exemple : créneau 8h–18h Paris = 06:00–16:00 UTC en été, 07:00–17:00 UTC en hiver

### DataSource
```
id, name
type: RSS | CSV | JSON_URL
configJson (url, mapping de champs, auth headers...)
refreshInterval (secondes)
lastFetched (datetime)
lastDataJson (cache)
```

### Alert
```
id, title, content
backgroundColor, textColor
displayMode: BANNER | FULLSCREEN
targetType: ALL | GROUP | SCREEN
targetId (nullable)
startAt, endAt
isActive (boolean)
createdAt
createdBy (FK → User)
```

### ScreenHeartbeat
```
id, screenId
timestamp (datetime)
currentPlaylistId, currentMediaName
uptime (secondes)
memoryUsageMb (nullable)
connectionType (wifi | ethernet | unknown)
browserVersion, resolution
isVisible (boolean — Page Visibility API)
errorMessage (nullable)
```
Politique de rétention : conserver **7 jours** de heartbeats, purge automatique via job BullMQ.

### ScreenCommand
```
id, screenId
command: SCREENSHOT | RELOAD | RESTART_BROWSER | REBOOT
       | PLAYLIST_RELOAD | CACHE_CLEAR
       | ALERT_SHOW | ALERT_HIDE | VOLUME_SET
payloadJson
sentAt, acknowledgedAt
status: PENDING | DELIVERED | FAILED
sentBy (FK → User)
```

### ScreenScreenshot
```
id, screenId
s3Key (clé S3 du fichier JPEG)
cdnUrl
takenAt
commandId (FK → ScreenCommand, nullable)
width, height, fileSizeBytes
```
Politique de rétention : conserver les **10 dernières captures par écran**, purge automatique.

### ProofOfPlay
```
id, screenId, playlistId, mediaId
playedAt (datetime UTC)
durationSeconds (durée effectivement jouée)
syncedAt (nullable — null si enregistré offline puis synchronisé)
```
**Émetteur :** le player, à chaque changement de média (event `screen:proof_of_play`).
**Granularité :** un enregistrement par média joué.
**Mode offline :** stocké en IndexedDB, synchronisé au retour en ligne.

---

## Permissions par rôle

| Ressource / Action | ADMIN | EDITOR | VIEWER |
|---|---|---|---|
| Sites & Groupes — lecture | ✅ | ✅ | ✅ |
| Sites & Groupes — écriture | ✅ | ❌ | ❌ |
| Écrans — lecture | ✅ | ✅ | ✅ |
| Écrans — enregistrement / suppression | ✅ | ❌ | ❌ |
| Commandes à distance (screenshot, reload...) | ✅ | ❌ | ❌ |
| Médias — lecture | ✅ | ✅ | ✅ |
| Médias — upload / suppression | ✅ | ✅ | ❌ |
| Templates — lecture | ✅ | ✅ | ✅ |
| Templates — écriture | ✅ | ✅ | ❌ |
| Playlists — lecture | ✅ | ✅ | ✅ |
| Playlists — écriture | ✅ | ✅ | ❌ |
| Planification — lecture | ✅ | ✅ | ✅ |
| Planification — écriture | ✅ | ✅ | ❌ |
| Alertes — lecture | ✅ | ✅ | ✅ |
| Alertes — créer / activer | ✅ | ✅ | ❌ |
| DataSources — écriture | ✅ | ✅ | ❌ |
| Rapports & Proof of Play | ✅ | ✅ | ✅ |
| Utilisateurs — gestion | ✅ | ❌ | ❌ |

---

## API REST — Endpoints principaux

### Player (public, auth JWT Bearer)

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/player/activate` | `{ token }` → valide le token d'activation, retourne `{ jwt, screenId }` |
| GET | `/api/player/[screenId]/schedule` | Retourne la playlist active selon le planning courant |
| GET | `/api/player/[screenId]/playlist/[id]` | Détail complet d'une playlist (items + URLs CDN) |
| POST | `/api/player/[screenId]/heartbeat` | `{ uptime, memoryUsageMb, ... }` → enregistre un heartbeat (voir ci‑dessous) |
| POST | `/api/player/[screenId]/proof_of_play` | `[{ mediaId, playedAt, durationSeconds }]` → batch de logs |
| POST | `/api/player/[screenId]/error` | `{ type, message, mediaId }` → log d'erreur |

### Console Admin (auth session Lucia)

| Méthode | Route | Description |
|---|---|---|
| GET/POST | `/api/admin/sites` | Liste / création de sites |
| GET/PUT/DELETE | `/api/admin/sites/[id]` | Détail / modif / suppression |
| GET/POST | `/api/admin/screens` | Liste / création d'écrans |
| GET/PUT/DELETE | `/api/admin/screens/[id]` | Détail / modif / suppression |
| POST | `/api/admin/screens/[id]/activation-token` | Génère un token d'activation (QR code) |
| POST | `/api/admin/screens/[id]/command` | `{ command, payload }` → envoie une commande WebSocket |
| GET/POST | `/api/admin/medias` | Liste / upload |
| DELETE | `/api/admin/medias/[id]` | Suppression |
| GET/POST | `/api/admin/playlists` | Liste / création |
| GET/PUT/DELETE | `/api/admin/playlists/[id]` | Détail / modif / suppression |
| GET/POST | `/api/admin/templates` | Liste / création |
| GET/PUT/DELETE | `/api/admin/templates/[id]` | Détail / modif / suppression |
| GET/POST | `/api/admin/schedules` | Liste / création |
| GET/PUT/DELETE | `/api/admin/schedules/[id]` | Détail / modif / suppression |
| GET/POST | `/api/admin/alerts` | Liste / création |
| PUT | `/api/admin/alerts/[id]/activate` | Activation immédiate |
| PUT | `/api/admin/alerts/[id]/deactivate` | Désactivation |
| GET | `/api/admin/reports/proof_of_play` | Logs filtrables + export CSV |
| GET | `/api/admin/reports/uptime` | Statistiques de connexion par écran |

**Note — Heartbeat player :**  
Le heartbeat est envoyé **prioritairement en WebSocket** via l’event `screen:heartbeat`. L’endpoint `POST /api/player/[screenId]/heartbeat` est utilisé **uniquement en fallback** lorsque le WebSocket est indisponible (voir section Player — Comportement réseau). Un seul canal est actif à la fois pour éviter les doublons en base.

---

## WebSocket events

### Serveur → Player (dans la room `screen:[screenId]`)

| Event | Payload | Description |
|---|---|---|
| `playlist:reload` | `{ playlistId, version }` | Recharge la playlist active |
| `player:refresh` | — | `location.reload()` |
| `player:screenshot` | `{ commandId }` | Déclenche une capture html2canvas |
| `player:restart_browser` | `{ commandId }` | Signal à l'agent local |
| `player:reboot` | `{ commandId }` | Reboot OS via agent local |
| `cache:clear` | — | Unregister SW + reload |
| `alert:show` | `{ id, title, content, displayMode, backgroundColor, textColor }` | Overlay urgent |
| `alert:hide` | `{ id }` | Masque l'overlay |
| `volume:set` | `{ level: 0-100 }` | Volume audio |

### Player → Serveur

| Event | Payload | Fréquence |
|---|---|---|
| `screen:heartbeat` | Métriques complètes | Toutes les 30s |
| `screen:screenshot_response` | `{ commandId, imageBase64, width, height }` | En réponse à `player:screenshot` |
| `screen:command_ack` | `{ commandId, status: 'DELIVERED' \| 'FAILED' }` | Accusé de réception |
| `screen:proof_of_play` | `[{ mediaId, playedAt, durationSeconds }]` | À chaque changement de média |
| `screen:error` | `{ type, message, mediaId }` | À chaque erreur de lecture |

### Côté serveur — room `admin` et diffusion

- **Room `admin`** : tout socket authentifié comme utilisateur console (session Lucia) rejoint cette room à la connexion. Utilisée pour envoyer les mises à jour de statut des écrans au tableau de bord.
- **À la réception de `screen:heartbeat`** : le serveur persiste en base (ScreenHeartbeat, mise à jour de Screen), puis émet vers la room `admin` un event (ex. `admin:screen_status`) avec un résumé des métriques pour rafraîchir la vue monitoring en temps réel.
- **À la réception de `screen:screenshot_response`** : le serveur uploade l’image sur S3, enregistre ScreenScreenshot, met à jour Screen.lastScreenshotKey, puis peut émettre vers la room `admin` (ex. `admin:screenshot_ready`) pour afficher la capture dans la console.
- Les events `admin:*` ne sont pas reçus par les players (rooms distinctes).

---

## Player (/player/[screenId])

### Démarrage
1. Vérifie si un JWT est présent dans localStorage
2. Si absent → redirige vers `/player/activate?token=...` (token en URL ou QR code)
3. Récupère le planning actif : `GET /api/player/[id]/schedule` (header `Authorization: Bearer jwt`)
4. Télécharge préventif des médias à venir (précache via Service Worker)
5. Se connecte Socket.io : `{ auth: { token: jwt } }`

### Rendu
- Plein écran CSS (`position: fixed; inset: 0; overflow: hidden; cursor: none`)
- Template en **CSS absolu (positions en %)** — pas de canvas
- Chaque zone joue sa playlist indépendamment
- Zone CONTENT : transitions FADE / SLIDE entre médias
- Zone CLOCK : `setInterval` 1s, format configurable via `styleJson`
- Zone TICKER : animation CSS `keyframes` continu, vitesse configurable
- Zone WEATHER : appel API OpenWeatherMap toutes les 10 minutes
- Aucune playlist planifiée → écran noir + logo configurable

### Gestion des erreurs player
| Erreur | Comportement |
|---|---|
| Média 404 / CORS | Skip au média suivant, envoie `screen:error` |
| Iframe bloquée | Affiche message "Contenu indisponible", skip après 5s |
| Vidéo corrompue | Skip au média suivant, envoie `screen:error` |
| Toutes zones en erreur | Affiche écran de secours (logo + heure) |
| API schedule inaccessible | Continue avec le cache IndexedDB |

### Comportement réseau offline
- **Mode online** : reçoit les mises à jour en WebSocket. Le heartbeat est envoyé **uniquement** via l’event `screen:heartbeat` (pas de double envoi REST).
- **Mode offline** : continue avec le cache Service Worker + IndexedDB.
- **Cache** : minimum **72h de contenu**. Invalidation basée sur `playlist.version` (incrémenté à chaque modif).
- **Proof of Play** : stocké en IndexedDB offline → batch sync au retour en ligne.
- **Reconnexion WebSocket** : backoff exponentiel (1s, 2s, 4s, 8s… max 60s).
- **Fallback lorsque WebSocket indisponible** : après échec complet du backoff (max 60s), le player considère le WebSocket comme indisponible et active le fallback : `GET /api/player/[screenId]/schedule` toutes les **5 minutes** et `POST /api/player/[screenId]/heartbeat` toutes les **30 secondes**. Dès que le WebSocket se reconnecte, le player repasse en mode WebSocket uniquement (arrêt du polling REST).

### Versioning player / serveur
- Le player envoie `playerVersion` dans le heartbeat (ex. `"2.0.0"`).
- La console affiche un badge « ⚠️ Mise à jour disponible » si `playerVersion` < version attendue par le serveur. La version attendue est exposée par une variable d'environnement ou une constante serveur `CURRENT_PLAYER_VERSION`.
- Le serveur peut forcer un reload via `player:refresh` pour mettre à jour le SW.

---

## Agent local (reboot OS sécurisé)

```
Serveur → WebSocket → Player (navigateur)
                           ↓ fetch localhost:3001
                      Agent local (Node.js, systemd)
                           ↓
                     Actions limitées :
                     - restart_browser (pkill chromium + relance)
                     - reboot (sudo systemctl reboot)
```

**Sécurité :**
- L'agent écoute **uniquement sur 127.0.0.1:3001** (pas accessible depuis le réseau)
- Authentification par token partagé (variable d'environnement locale)
- Actions limitées à une liste blanche stricte
- Service systemd dédié avec `CapabilityBoundingSet=CAP_SYS_BOOT` (pas de sudo global)
- Toutes les actions sont journalisées dans `/var/log/signage-agent.log`

**Installation :**
```bash
# /etc/systemd/system/signage-agent.service
[Unit]
Description=Digital Signage Local Agent

[Service]
ExecStart=/usr/bin/node /opt/signage-agent/index.js
Environment=AGENT_TOKEN=xxxx
Restart=always
User=signage

[Install]
WantedBy=multi-user.target
```

---

## Screenshots — stockage et rétention

```
Player → html2canvas → JPEG base64 (qualité 70%, max 1280px largeur)
       → WebSocket screen:screenshot_response
       → Serveur reçoit → upload S3 (key: screenshots/[screenId]/[timestamp].jpg)
       → Enregistre ScreenScreenshot { s3Key, cdnUrl, takenAt }
       → Met à jour Screen.lastScreenshotKey + lastScreenshotAt
```

**Politique de rétention :**
- Garder les **10 dernières captures par écran** en DB
- Job BullMQ quotidien : purge S3 + DB des captures excédentaires
- Résolution max 1280px (redimensionnement côté player avant envoi)

**Limitations connues :**
- Les iframes (WEBPAGE) ne sont pas capturées → placeholder "Contenu iframe"
- Les vidéos sont capturées sur leur frame actuelle
- Performances sur écrans 4K : capture asynchrone avec file d'attente côté serveur

---

## Jobs asynchrones (BullMQ + Redis)

| Job | Déclencheur | Description |
|---|---|---|
| `encode-video` | Upload d'une vidéo | ffmpeg : compression H264, génération miniature |
| `generate-thumbnail` | Upload image/PDF | Génération miniature, upload S3 |
| `purge-screenshots` | Cron quotidien | Supprime les captures excédentaires |
| `purge-heartbeats` | Cron quotidien | Supprime heartbeats > 7 jours |
| `sync-datasource` | Cron selon refreshInterval | Fetch RSS / JSON / CSV |
| `send-alert-email` | Écran offline > N minutes | Email au contact du site |
| `expire-medias` | Cron quotidien | Archive médias dont validUntil < now |

**Statut "encoding" dans la médiathèque :**
- Après upload vidéo : `encodingStatus = PENDING`
- Pendant le job : `encodingStatus = PROCESSING`
- Fin OK : `encodingStatus = DONE`, `cdnUrl` renseignée
- Erreur : `encodingStatus = ERROR`, notification admin

---

## Infrastructure recommandée

### Hébergement

| Taille parc | Infra | Coût estimé |
|---|---|---|
| < 50 écrans | VPS 2 vCPU / 4 GB RAM, SQLite, pas de Redis | ~15-30€/mois |
| 50-200 écrans | VPS 4 vCPU / 8 GB + PostgreSQL + Redis + S3 | ~60-100€/mois |
| 200-1000 écrans | Dédié + Redis Cluster + PostgreSQL managé + CDN | ~200-400€/mois |

### Stack production complète
- **Serveur** : VPS OVH / Scaleway
- **Base de données** : PostgreSQL managé (Scaleway, Supabase)
- **Redis** : Redis managé (Upstash ou Scaleway) — Socket.io adapter + BullMQ
- **Stockage médias** : Scaleway Object Storage ou Cloudflare R2
- **CDN** : Cloudflare (gratuit) devant le serveur
- **SSL** : Let's Encrypt (obligatoire pour WSS)
- **Process manager** : PM2

### Scalabilité Socket.io (200+ écrans)
Avec plusieurs instances SvelteKit derrière un load balancer :
- **Sticky sessions** obligatoires (ou Redis Adapter)
- Utiliser `@socket.io/redis-adapter` avec le Redis partagé
- Chaque instance peut gérer ~500 connexions WebSocket simultanées

---

## Phases de développement

### Phase 1 — Fondations
- [ ] Setup SvelteKit + Prisma + SQLite + Tailwind + shadcn-svelte
- [ ] Auth console (Lucia : login, sessions, rôles)
- [ ] Modèle Sites + ScreenGroups + Screens (CRUD)
- [ ] Système d'activation player (token + QR code)
- [ ] Auth WebSocket (JWT player, rooms par screenId)
- [ ] Player basique (plein écran, 1 zone, images/vidéos, transitions)
- [ ] Heartbeat + WebSocket events de base
- [ ] Tableau de bord monitoring (statut online/offline temps réel)

### Phase 2 — Contenu & Planification
- [ ] Médiathèque (upload S3, miniatures, tags, validité)
- [ ] Job BullMQ : encoding vidéo ffmpeg + thumbnail
- [ ] Playlists simples (1 zone, versioning)
- [ ] Planification (plage horaire, priorité, récurrence, timezone)
- [ ] Résolution des conflits de planning
- [ ] Console admin complète (layout, navigation, sidebar)
- [ ] Système d'alertes urgentes

### Phase 3 — Monitoring & Commandes à distance
- [ ] Heartbeat enrichi (métriques complètes, rétention 7j)
- [ ] Screenshots à la demande (html2canvas → S3, rétention 10/écran)
- [ ] Screenshots automatiques (cron configurable)
- [ ] Toutes les commandes WebSocket + log ScreenCommand
- [ ] Agent local (service systemd, restart browser + reboot)
- [ ] Gestion des erreurs player (screen:error, écran de secours)
- [ ] Alertes offline automatiques (email via BullMQ)
- [ ] Proof of Play (player → WebSocket → DB, mode offline IndexedDB)

### Phase 4 — Templates & Multi-zones
- [ ] Éditeur de templates WYSIWYG (drag & resize zones en %)
- [ ] Player multi-zones (CSS absolu)
- [ ] Zone TICKER (animation CSS + RSS)
- [ ] Zone CLOCK (setInterval, formats configurables)
- [ ] Zone WEATHER (OpenWeatherMap)

### Phase 5 — Données dynamiques & Reporting
- [ ] DataSources (RSS, JSON_URL, CSV)
- [ ] Zone DATASET (tableau dynamique)
- [ ] Job BullMQ : sync DataSources selon refreshInterval
- [ ] Rapports Proof of Play (filtres, graphiques, export CSV)
- [ ] Rapport uptime par écran

### Phase 6 — Polish & Production
- [ ] Service Worker offline complet (72h, invalidation par version)
- [ ] Sync offline IndexedDB → Proof of Play batch
- [ ] Stockage S3 production + CDN URLs absolues
- [ ] Redis Adapter Socket.io (multi-instances)
- [ ] Job BullMQ : purges automatiques (heartbeats, screenshots)
- [ ] Job BullMQ : expiration médias (validUntil)
- [ ] Versioning player / badge mise à jour console
- [ ] Gestion fine permissions EDITOR / VIEWER (middleware SvelteKit)
- [ ] Documentation déploiement (README, variables d'environnement)

---

## Prompts Cursor — Phase 1

### Prompt 1 — Setup
```
En te basant sur SPEC_v2.md, initialise le projet SvelteKit avec :
- Prisma + SQLite avec le schéma complet de la spec (toutes les entités)
- Lucia Auth v3 (email/password, sessions, rôles ADMIN|EDITOR|VIEWER)
- Tailwind CSS + shadcn-svelte
- Socket.io dans hooks.server.ts avec auth JWT player (middleware vérifiant
  le token dans socket.handshake.auth.token, room par screenId)
- Variables d'environnement : DATABASE_URL, PLAYER_JWT_SECRET,
  S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, CDN_BASE_URL
Crée le schéma Prisma complet et génère la migration initiale.
```

### Prompt 2 — Auth & Activation player
```
En te basant sur SPEC_v2.md, implémente :
1. Page /admin/login (formulaire email/password, session Lucia)
2. CRUD /admin/screens avec la page de création d'écran
3. Endpoint POST /api/admin/screens/[id]/activation-token qui génère
   un token UUID v4 (TTL 24h) et retourne une URL + QR code (qrcode.js)
4. Endpoint POST /api/player/activate { token } qui valide le token,
   génère et retourne un JWT player (HMAC-SHA256, payload: { sub: screenId })
5. Page /player/activate?token=xxx qui appelle cet endpoint et redirige
   vers /player/[screenId] en stockant le JWT dans localStorage
```

### Prompt 3 — Player basique
```
En te basant sur SPEC_v2.md, crée la page /player/[screenId] :
1. Récupère le JWT depuis localStorage, redirige vers /player/activate si absent
2. GET /api/player/[screenId]/schedule (header Authorization: Bearer jwt)
3. Joue les médias en boucle (images + vidéos) avec transition FADE (CSS opacity)
4. Gestion des erreurs : skip au suivant si 404/erreur, écran de secours si tout échoue
5. Connexion Socket.io avec { auth: { token: jwt } }
6. Heartbeat toutes les 30s via WebSocket (event screen:heartbeat) ; en fallback si WebSocket déconnecté, utiliser POST /api/player/[screenId]/heartbeat
7. Gère les events : playlist:reload, player:refresh, player:screenshot
   (html2canvas → emit screen:screenshot_response { commandId, imageBase64 })
8. Plein écran CSS : position fixed, inset 0, overflow hidden, cursor none
```

### Prompt 4 — Monitoring temps réel
```
En te basant sur SPEC_v2.md, crée la page /admin/monitoring :
1. Tableau de tous les écrans avec colonnes : Nom, Site, Statut (🟢🟡🔴),
   Playlist en cours, Média en cours, Uptime, Dernière vue, Actions
2. Statuts mis à jour en temps réel via Socket.io côté admin
   (room 'admin' — les heartbeats reçus sont broadcastés aux admins connectés)
3. Boutons d'action par écran : 📸 Screenshot, 🔄 Reload playlist,
   🔁 Refresh navigateur
4. Clic sur 📸 → POST /api/admin/screens/[id]/command { command: 'SCREENSHOT' }
   → le serveur émet player:screenshot dans la room screen:[id]
   → à réception de screen:screenshot_response → affiche la capture en modal
5. Badge rouge si écran offline depuis > 5 minutes
```

---

## Historique des révisions

| Version | Date | Modifications |
|---------|------|---------------|
| 2.0 | 26/02/2026 | Spécification initiale v2 (auth player, activation, permissions, jobs, etc.) |
| 2.1 | 26/02/2026 | Finalisation : canal heartbeat unique (WebSocket prioritaire, REST en fallback) ; room `admin` et diffusion des statuts côté serveur ; comportement fallback détaillé ; note API heartbeat ; versioning player ; prompt Phase 1 aligné sur heartbeat WebSocket. |
