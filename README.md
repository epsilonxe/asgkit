# asgkit

Student assignment management webapp: courses → workshops → student
submissions. Local-network only, no auth. See `CLAUDE.md` for the full
spec and architecture rationale (written for AI agents working in this
repo, but useful background for humans too).

## Stack

- Next.js 16 (App Router), served via a custom `server.js` (not plain `next dev`/`next start`)
- Tailwind CSS v4
- MySQL 8.4
- Docker Compose for deployment

## Requirements

- **Linux host** (kernel with `/proc/net/arp`; any reasonably modern
  distro — Ubuntu 22.04+/Debian 12+ as a baseline). This is a hard
  requirement for production, not an optimization: `network_mode: host` in
  `docker-compose.yml` and MAC-address capture only work on Linux (see the
  Docker Desktop caveat below).
- **Docker Engine** with the Compose plugin (`docker compose`, not the old
  standalone `docker-compose` v1 binary).
- **Ports 3000** (app) and **3306** (MySQL, published to the host — see
  `docker-compose.yml`) must be free on the host, and open to the LAN in
  any active firewall (`ufw`/`firewalld`).
- **Disk space** for the `uploads/` bind mount and the `mysql_data`
  volume — no built-in quota; size to expected submission volume.

## Getting started (local dev)

```bash
cp .env.example .env
docker compose up -d mysql   # brings up just the DB; schema auto-loads from db/init.sql on first start
npm install
npm run dev                  # runs server.js, required for real client-IP capture
```

App: http://localhost:3000
Admin (create courses/workshops): http://localhost:3000/admin

## Full stack via Docker

```bash
docker compose up --build
```

`network_mode: host` on the `app` service is **Linux-only**. On macOS/Windows
Docker Desktop the container runs fine and connects to MySQL, but won't be
reachable at `localhost` from the host shell — Docker Desktop's host
networking binds inside its Linux VM, not the real host. Real LAN deployment
must target an actual Linux host.

## Deploying to a target machine

1. Install Docker Engine + the Compose plugin on the target Linux host,
   then enable Docker itself on boot:
   ```bash
   sudo systemctl enable --now docker
   ```
   Combined with `restart: unless-stopped` already set on both services in
   `docker-compose.yml`, this is enough for the stack to come back up after
   a reboot — no separate systemd unit needed for the app itself.
2. Copy or clone this repo onto the target machine.
3. `cp .env.example .env` and set real (non-`changeme`) values for
   `MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD`.
4. `docker compose up -d --build`
5. If a firewall is active, open ports 3000 and 3306 to the LAN, e.g.:
   ```bash
   sudo ufw allow 3000/tcp
   sudo ufw allow 3306/tcp
   ```
6. From another device on the same LAN, verify:
   `http://<server-lan-ip>:3000` and `http://<server-lan-ip>:3000/admin`.
7. Confirm MAC capture works by submitting from a real LAN device and
   checking the `submissions` table for a populated `client_mac` (not just
   `client_ip`) — see `CLAUDE.md`'s "Known Limitations" section for when
   it's expected to legitimately stay null (cross-subnet clients, VPNs,
   stale ARP entries).

## Data model

Courses → workshops → submissions (see `db/init.sql` for the source of
truth). Notes:

- Slugs (used in both URLs and the on-disk directory layout) are
  **immutable** once set; only the display `name` can be edited.
- Resubmitting overwrites in place: old files under the student's
  submission directory are deleted before the new ones are written, and the
  DB row is updated via `ON DUPLICATE KEY UPDATE` (same `id`, not a new row).

## File storage

Uploaded files live on disk at:

```
uploads/COURSE_SLUG/STUDENT_ID/WORKSHOP_SLUG/
```

Base path is configurable via `UPLOADS_BASE`. Per-file size cap is 50MB
(`src/lib/fsStorage.ts`).

## Client IP / MAC capture

`server.js` stamps every incoming request with a trusted internal header
carrying the real socket address (`req.socket.remoteAddress`), overwriting
any client-supplied value — Route Handlers read this via
`src/lib/net/clientIp.ts` rather than trusting `x-forwarded-for`.
`src/lib/net/clientMac.ts` then does a best-effort ARP-table lookup
(`/proc/net/arp` on Linux, `arp -n` shell-out as a macOS dev fallback).
Both `client_ip` and `client_mac` are nullable — a lookup failure never
blocks a submission. See `CLAUDE.md`'s "Known Limitations" section for the
full list of caveats (subnet requirements, VPNs, etc).

## Useful commands

```bash
npm run lint          # eslint
npx tsc --noEmit       # typecheck
docker compose logs -f app
docker compose down
```

## Environment variables

| Var | Used by | Purpose |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | app | MySQL connection (`src/lib/db.ts`) |
| `UPLOADS_BASE` | app | Base directory for submission files |
| `PORT` | app | Port `server.js` listens on (default 3000) |
| `MYSQL_ROOT_PASSWORD` / `MYSQL_USER` / `MYSQL_PASSWORD` | compose only | Passed to the `mysql` service; set in `.env` (see `.env.example`) |
