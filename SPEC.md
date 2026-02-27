# Digital Signage Platform — Spécification Complète
> Clone Media4Display — SvelteKit · Prisma · Socket.io

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | SvelteKit (fullstack, SSR + API routes) |
| Base de données | SQLite via Prisma ORM (PostgreSQL en prod) |
| Temps réel | Socket.io |
| Stockage médias | Scaleway Object Storage ou Cloudflare R2 (compatible S3) |
| CDN | Cloudflare (devant le serveur) |
| Auth | Lucia Auth (sessions + rôles) |
| CSS | Tailwind CSS + shadcn-svelte |
| Screenshots | html2canvas (côté player) |
| Agent local | Script Node.js optionnel sur la machine player |

---

## Architecture générale

```
[Console Admin Web]
        ↕ HTTPS
[Serveur Central SvelteKit]  ←→  [Base SQLite/PostgreSQL]
        ↕ WSS (Socket.io)         ↕
[Players distants]           [Stockage S3 / CDN]
  - Paris (3 écrans)
  - Lyon  (5 écrans)
  - Nantes (2 écrans)
  - ...
```

Les players se connectent uniquement en **HTTPS/WSS sortant (port 443)**.
Aucun VPN requis, aucune IP fixe côté écran.

---

## Modèle de données

### User
```
id, email, passwordHash
role: ADMIN | EDITOR | VIEWER
createdAt
```

### Site
```
id, name, city, address
timezone (défaut: "Europe/Paris")
contactName, contactEmail
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
status: ONLINE | OFFLINE | WARNING
lastSeen (datetime)
resolution (ex: "1920x1080")
orientation: LANDSCAPE | PORTRAIT
playerVersion (string)
ipAddress
uptime (secondes)
currentPlaylistId
lastScreenshotAt
lastScreenshotUrl
```

### Media
```
id, name
type: IMAGE | VIDEO | HTML | PDF | WEBPAGE | RSS | DATASET
filename (chemin S3) ou url (pour WEBPAGE/RSS)
duration (secondes)
thumbnailUrl (miniature auto-générée)
fileSize, mimeType
tags (JSON array)
validFrom, validUntil (archivage automatique)
createdAt, updatedAt
createdBy (FK → User)
```

### Template (gabarit de mise en page)
```
id, name, description, thumbnailUrl
zones: Zone[] (JSON)
```

### Zone (dans un Template)
```
id, name
type: CONTENT | TICKER | CLOCK | WEATHER | DATASET
x, y, width, height (en % de l'écran)
zIndex
backgroundColor, padding
styleJson (options spécifiques au type)
```

### Playlist
```
id, name, description
templateId (FK → Template)
defaultDuration (secondes)
transition: FADE | SLIDE | NONE
createdAt, updatedAt
createdBy (FK → User)
items: PlaylistItem[]
```

### PlaylistItem
```
id, playlistId, mediaId
zoneId (zone du template ciblée)
order, duration (override)
transitionIn, transitionOut
```

### Schedule (planification)
```
id, name
targetType: SCREEN | GROUP
targetId
playlistId (FK → Playlist)
priority (entier — plus élevé = prioritaire)
startDate, endDate
startTime, endTime
daysOfWeek (JSON array: [0,1,2,3,4,5,6])
isRecurring (boolean)
isInterruption (boolean — override urgent)
```

### DataSource (connecteur de données)
```
id, name
type: RSS | CSV | JSON_URL
config (JSON : url, mapping de champs...)
refreshInterval (secondes)
lastFetched, lastDataJson (cache)
```

### Alert (message d'urgence)
```
id, title, content
backgroundColor, textColor
displayMode: BANNER | FULLSCREEN
targetType: ALL | GROUP | SCREEN
targetId
startAt, endAt
createdBy (FK → User)
```

### ScreenHeartbeat (historique monitoring)
```
id, screenId
timestamp
currentPlaylistId, currentMediaName
uptime (secondes)
memoryUsageMb
connectionType (wifi | ethernet)
browserVersion, resolution
isVisible (Page Visibility API)
errorMessage (si erreur de lecture)
```

### ScreenCommand (log des commandes envoyées)
```
id, screenId
command: SCREENSHOT | RELOAD | RESTART_BROWSER | REBOOT | PLAYLIST_RELOAD | CACHE_CLEAR | ALERT_SHOW | ALERT_HIDE | VOLUME_SET
payload (JSON)
sentAt, acknowledgedAt
status: PENDING | DELIVERED | FAILED
sentBy (FK → User)
```

### ProofOfPlay (log de diffusion)
```
id, screenId, playlistId, mediaId
playedAt
duration (secondes effectivement joués)
```

---

## Fonctionnalités détaillées

### 1. Gestion des sites & écrans (/admin/screens)

- **Vue par site** : liste des sites avec nb d'écrans online/offline
- **Vue par groupe** : regroupement logique des écrans
- **Tableau de bord** : liste de tous les écrans avec statut temps réel (🟢 Online / 🟡 Lag / 🔴 Offline)
- **Fiche écran** :
  - Informations (nom, site, groupe, résolution, IP, version player)
  - Dernière activité, uptime
  - Miniature du dernier screenshot
  - Playlist en cours de diffusion
  - Historique des commandes envoyées
- **Enregistrement automatique** : un nouvel écran s'enregistre au premier lancement (POST /api/player/register)

### 2. Monitoring temps réel (/admin/monitoring)

Tableau de bord live alimenté par WebSocket :

```
┌──────────┬─────────┬──────────────┬─────────┬───────┬──────────────┐
│ Écran    │ Statut  │ Playlist     │ Média   │ Uptime│ Actions      │
├──────────┼─────────┼──────────────┼─────────┼───────┼──────────────┤
│ Paris-01 │ 🟢 Live │ Promo été    │ slide3  │ 2j 4h │ 📸 🔄 ⚡ 🗑️ │
│ Lyon-02  │ 🟡 Lag  │ Accueil      │ video1  │ 5h 12m│ 📸 🔄 ⚡ 🗑️ │
│ Nantes-03│ 🔴 Off  │ —            │ —       │ —     │ 📸 🔄 ⚡ 🗑️ │
└──────────┴─────────┴──────────────┴─────────┴───────┴──────────────┘
```

**Métriques remontées par heartbeat (toutes les 30s) :**
- Playlist et média en cours
- Uptime (secondes depuis démarrage)
- Mémoire utilisée (performance.memory)
- Type de connexion (Network Information API)
- Version navigateur et résolution
- Visibilité de la page (Page Visibility API)
- Erreurs éventuelles (média corrompu, iframe bloquée)

**Alertes automatiques :**
- Notification si écran offline depuis plus de N minutes (email + webhook)
- Badge d'alerte dans la console admin

### 3. Commandes à distance

| Commande | Description | Implémentation |
|---|---|---|
| 📸 Screenshot | Capture l'écran et l'affiche dans la console | WebSocket → html2canvas → base64 |
| 🔄 Recharger playlist | Refetch le planning sans reload page | WebSocket → refetch API |
| 🔁 Recharger navigateur | Recharge complètement la page | WebSocket → location.reload() |
| 🗑️ Vider le cache | Unregister Service Worker + reload | WebSocket → SW management |
| ⚡ Redémarrer navigateur | Relance Chromium (agent local) | WebSocket → agent local |
| 🖥️ Redémarrer OS | Reboot système (agent local) | WebSocket → sudo reboot |
| 🔊 Volume | Ajuste le volume audio | WebSocket → Web Audio API |

**Agent local (optionnel, pour redémarrage OS) :**
- Petit script Node.js sur la machine player (Raspberry Pi / mini-PC Linux)
- Écoute sur localhost:3001
- Reçoit les commandes du player via IPC
- Nécessite `sudo` configuré sans mot de passe pour reboot

### 4. Screenshots & surveillance visuelle

**Screenshot à la demande :**
```
Admin clique "📸"
→ serveur envoie event player:screenshot via WebSocket
→ player capture son DOM avec html2canvas
→ encode en JPEG base64 (qualité 70%)
→ renvoie via WebSocket
→ admin voit la capture dans la console (stockée en DB)
```

**Limitations :**
- Les iframes (pages web externes) ne sont pas capturées (sécurité navigateur)
- Les vidéos en lecture sont capturées correctement
- Qualité ajustable avant envoi

**Screenshots automatiques :**
- Option : capture automatique toutes les X minutes
- Miniature visible dans la fiche écran et le tableau de bord

### 5. Médiathèque (/admin/medias)

- Upload multiple (drag & drop)
- **Types supportés :**
  - Images : JPG, PNG, GIF, WebP, SVG
  - Vidéos : MP4, WebM (compression ffmpeg auto à l'upload)
  - Documents : PDF (converti en images)
  - HTML : fichier zip uploadé ou éditeur inline
  - URL externe : page web en iframe
  - Flux RSS : titres + descriptions défilants
  - Dataset : tableau depuis DataSource
- Miniatures auto-générées
- Filtrage par type, tags, date, validité
- Prévisualisation inline
- Gestion des dates de validité (archivage automatique)
- Stockage sur S3 (URLs absolues accessibles depuis n'importe quel site)

### 6. Templates / Gabarits (/admin/templates)

- Éditeur WYSIWYG de mise en page
- Zones repositionnables (drag & resize en %)
- **Types de zones :**
  - **CONTENT** : playlist de médias
  - **TICKER** : texte défilant (RSS ou texte libre)
  - **CLOCK** : horloge temps réel (formats configurables)
  - **WEATHER** : météo (OpenWeatherMap API)
  - **DATASET** : tableau de données dynamiques
- Templates prédéfinis : fullscreen, 2 zones, bandeau bas, L-shape, etc.
- Aperçu en temps réel dans l'éditeur

### 7. Playlists (/admin/playlists)

- Création avec choix du template
- Assignation de médias par zone (drag & drop)
- Durée par item (override possible)
- Transition entre médias par zone
- Prévisualisation de la playlist complète
- Duplication de playlist

### 8. Planification (/admin/schedules)

- Vue calendrier (hebdomadaire / mensuelle)
- Assignation playlist → écran ou groupe
- Gestion des plages horaires
- Récurrence (quotidienne, hebdo, jours spécifiques)
- **Système de priorités :**
  - Priorité haute : override la playlist en cours
  - Interruption urgente : s'affiche immédiatement par-dessus
- Résolution automatique des conflits (priorité la plus haute gagne)
- Fallback : playlist par défaut si aucun planning actif
- Plannings en **UTC**, appliqués selon le **timezone du site**

### 9. Alertes / Messages urgents (/admin/alerts)

- Création d'un message texte d'urgence
- Ciblage : tous les écrans / groupe / écran spécifique
- Mode BANNER (bandeau superposé) ou FULLSCREEN
- Couleurs et style configurables
- Activation immédiate ou planifiée
- Désactivation en un clic (tous les écrans ciblés)

### 10. Connecteurs de données (/admin/datasources)

- **RSS** : parsing et affichage titres/descriptions
- **URL JSON** : mapping de champs vers zones Dataset
- **CSV uploadé** : affichage en tableau dynamique
- Rafraîchissement automatique selon intervalle configurable

### 11. Rapports / Proof of Play (/admin/reports)

- Historique de diffusion par écran / site / groupe
- Temps total par média
- Export CSV
- Graphiques de diffusion (par jour, par écran)
- Historique des connexions/déconnexions par écran

### 12. Gestion des utilisateurs (/admin/users)

- **Rôles :**
  - ADMIN : accès total
  - EDITOR : gère médias + playlists, pas les écrans
  - VIEWER : lecture seule + rapports
- Invitation par email

---

## Player (/player/[screenId])

### Démarrage
1. Récupère son ID depuis localStorage (ou paramètre URL)
2. S'enregistre auprès du serveur : `POST /api/player/register`
3. Récupère le planning actif : `GET /api/player/[id]/schedule`
4. Télécharge préventif des médias à venir (précache)
5. Se connecte en WebSocket : `wss://[domaine]/socket`

### Rendu
- Plein écran (pas de scrollbar, pas de curseur)
- Template appliqué en **CSS absolu (positions en %)**
- Chaque zone joue sa playlist indépendamment
- Zone CONTENT : transition FADE / SLIDE entre médias
- Zone CLOCK : mise à jour chaque seconde
- Zone TICKER : scroll CSS continu
- Zone WEATHER : appel API toutes les 10 minutes
- Si aucune playlist planifiée : écran noir avec logo configurable

### WebSocket events reçus (serveur → player)

| Event | Action |
|---|---|
| `playlist:reload` | Refetch le planning actif sans reload page |
| `player:refresh` | location.reload() |
| `player:screenshot` | Capture DOM + renvoie base64 JPEG |
| `player:restart_browser` | Écrit flag → agent local relance Chromium |
| `player:reboot` | Appel agent local → sudo reboot |
| `cache:clear` | Unregister Service Worker + reload |
| `alert:show` | Affiche overlay d'urgence par-dessus le contenu |
| `alert:hide` | Masque l'overlay d'urgence |
| `volume:set` | Ajuste le volume audio (payload: { level: 0-100 }) |

### WebSocket events envoyés (player → serveur)

| Event | Contenu | Fréquence |
|---|---|---|
| `screen:heartbeat` | Métriques complètes (voir ci-dessus) | Toutes les 30s |
| `screen:screenshot_response` | Image base64 JPEG | En réponse à player:screenshot |
| `screen:error` | { type, message, mediaId } | À chaque erreur de lecture |
| `screen:command_ack` | { commandId, status } | Accusé de réception de commande |

### Comportement réseau
- **Mode online** : reçoit les mises à jour en WebSocket
- **Mode offline** : continue avec le cache (Service Worker + IndexedDB)
- Téléchargement préventif des médias à venir
- Reconnexion WebSocket automatique (backoff exponentiel : 1s, 2s, 4s, 8s... max 60s)
- Polling HTTP de fallback si WebSocket indisponible
- Log local des diffusions → sync vers serveur à la reconnexion
- Cache minimum : **72h de contenu**

---

## Infrastructure recommandée

### Hébergement

| Taille parc | Infra | Coût estimé |
|---|---|---|
| < 50 écrans | VPS 2 vCPU / 4 GB RAM | ~15-30€/mois |
| 50-200 écrans | VPS 4 vCPU / 8 GB RAM + Object Storage | ~40-80€/mois |
| 200-1000 écrans | Dédié + CDN + PostgreSQL managé | ~150-300€/mois |

### Stack production
- **Serveur** : VPS OVH / Scaleway
- **Stockage médias** : Scaleway Object Storage ou Cloudflare R2
- **CDN** : Cloudflare (gratuit) devant le serveur
- **SSL** : Let's Encrypt (obligatoire pour WSS)
- **Base de données** : PostgreSQL managé en production (SQLite en dev)
- **Process manager** : PM2

---

## Phases de développement

### Phase 1 — Fondations
- [ ] Setup SvelteKit + Prisma + SQLite + Tailwind
- [ ] Auth (login, sessions, rôles)
- [ ] Modèle Sites + ScreenGroups + Screens (CRUD)
- [ ] Player basique (plein écran, 1 zone, images/vidéos)
- [ ] WebSocket : heartbeat + playlist:reload
- [ ] Tableau de bord monitoring basique (statut online/offline)

### Phase 2 — Contenu & Planification
- [ ] Médiathèque complète (upload S3, miniatures, tags)
- [ ] Playlists simples (1 zone)
- [ ] Planification (plage horaire, priorité, récurrence)
- [ ] Console admin (layout, navigation, sidebar)
- [ ] Système d'alertes urgentes

### Phase 3 — Monitoring & Commandes à distance
- [ ] Heartbeat enrichi (métriques complètes)
- [ ] Screenshots à la demande (html2canvas)
- [ ] Screenshots automatiques
- [ ] Toutes les commandes WebSocket (reload, reboot...)
- [ ] Log des commandes (ScreenCommand)
- [ ] Alertes offline automatiques (email / webhook)
- [ ] Agent local (redémarrage OS)

### Phase 4 — Templates & Multi-zones
- [ ] Éditeur de templates (drag & resize zones)
- [ ] Player multi-zones
- [ ] Zone TICKER + CLOCK
- [ ] Zone WEATHER (OpenWeatherMap)

### Phase 5 — Données dynamiques & Reporting
- [ ] DataSources (RSS, JSON, CSV)
- [ ] Zone DATASET
- [ ] Proof of Play (logs de diffusion)
- [ ] Rapports + export CSV
- [ ] Graphiques (Recharts ou Chart.js)

### Phase 6 — Polish & Production
- [ ] Service Worker offline complet (72h de cache)
- [ ] Gestion fine des droits EDITOR / VIEWER
- [ ] Stockage S3 en production
- [ ] Compression vidéo ffmpeg à l'upload
- [ ] Gestion timezones multi-sites
- [ ] Prévisualisation playlists dans l'admin

---

## Prompts Cursor recommandés

### Démarrage Phase 1
```
En te basant sur SPEC.md, initialise le projet SvelteKit avec :
- Prisma + SQLite avec le schéma complet (User, Site, ScreenGroup, Screen,
  ScreenHeartbeat, ScreenCommand)
- Lucia Auth (login par email/password, rôles ADMIN|EDITOR|VIEWER)
- Tailwind CSS + shadcn-svelte
- Socket.io configuré pour SvelteKit (hooks.server.ts)
- Layout /admin avec sidebar (Sites, Écrans, Monitoring, Médias,
  Playlists, Templates, Planification, Alertes, Rapports, Utilisateurs)
Crée aussi la page /admin/monitoring avec un tableau temps réel
des écrans (statut, playlist en cours, uptime) alimenté par WebSocket.
```

### Phase Player
```
En te basant sur SPEC.md, crée la page /player/[screenId].
Elle doit :
1. S'enregistrer au serveur (POST /api/player/register)
2. Récupérer la playlist active (GET /api/player/[id]/schedule)
3. Jouer les médias en boucle avec fondu enchaîné
4. Envoyer un heartbeat toutes les 30s avec les métriques
5. Gérer tous les WebSocket events de la spec
6. Capturer l'écran avec html2canvas en réponse à player:screenshot
Le rendu doit être plein écran, sans scrollbar ni curseur.
```

### Phase Screenshots & Commandes
```
En te basant sur SPEC.md, implémente le système de commandes à distance :
1. Page /admin/monitoring avec les boutons 📸 🔄 ⚡ pour chaque écran
2. Endpoint WebSocket qui envoie les events player:screenshot,
   player:refresh, player:restart_browser
3. Réception et stockage du screenshot base64 en DB (ScreenCommand)
4. Affichage de la dernière capture dans la fiche écran
5. Log de toutes les commandes avec statut PENDING/DELIVERED/FAILED
```
