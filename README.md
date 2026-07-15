# asgkit

Student assignment management webapp: courses → workshops → student
submissions. Local-network only. Student submission is unauthenticated;
the admin area is password-protected. See `CLAUDE.md` for the full spec
and architecture rationale (written for AI agents working in this repo,
but useful background for humans too).

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
Admin (create courses/workshops): http://localhost:3000/admin — prompts
for HTTP Basic Auth credentials (username `admin`, password from
`ADMIN_PASSWORD` in `.env`).

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
   `MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD`, and
   `ADMIN_PASSWORD`.
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

## Deploying on Windows (Docker Desktop + WSL2 mirrored networking)

Docker Desktop's `network_mode: host` does **not** work out of the box on
Windows — it binds inside Docker Desktop's hidden WSL2 VM, not Windows'
real network stack, so the app is unreachable at `localhost` and can never
see real LAN client IPs/MACs. Newer Windows/WSL2 versions offer a
workaround via **mirrored networking mode**:

1. **Prerequisites**: Windows 11 22H2+ (build 22621+), WSL ≥ 2.0.0. Check
   with `wsl --version`; run `wsl --update` if older.
2. **Enable mirrored networking** — create/edit
   `%USERPROFILE%\.wslconfig`:
   ```ini
   [wsl2]
   networkingMode=mirrored
   ```
   Then, in PowerShell: `wsl --shutdown`, and fully restart Docker Desktop.
3. **Enable host networking in Docker Desktop** — Settings → Resources →
   Network → enable "Enable host networking" (wording/location varies by
   version; check Experimental Features if not shown directly). Apply and
   restart Docker Desktop.
4. **Deploy the app** — same as the Linux path: clone/copy this repo,
   `cp .env.example .env` and set real passwords (including
   `ADMIN_PASSWORD`), then `docker compose up -d --build`.
5. **Verify the container picked up the real network**:
   ```bash
   docker compose exec app ip addr
   ```
   You should see the host's real interfaces/IP, not an isolated bridge
   address (e.g. `172.x`).
6. **Windows Defender Firewall** — once the container is on the real
   interface, Windows may prompt to allow inbound connections; allow it,
   or manually add inbound rules for TCP 3000 and 3306.
7. **Verify reachability** from another LAN device:
   `http://<windows-host-lan-ip>:3000` and `.../admin`.
8. **Verify MAC capture** by submitting from a real second LAN device and
   checking `client_mac` is populated in the `submissions` table.

This Docker Desktop feature is newer and version-dependent. If the
"Enable host networking" toggle isn't present, or containers still don't
pick up the real interface after these steps, that's a Docker Desktop
limitation on that specific version — not something fixable from the app
side. The reliable fallback is a native Linux host, or a Linux VM with
bridged (not NAT) networking, per the section above.

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

## Admin authentication

`/admin` pages and the admin-only API routes (`/api/courses/*`,
`/api/workshops/*`, `GET /api/submissions`) require HTTP Basic Auth,
enforced in `src/middleware.ts` — username is always `admin`, password
comes from the `ADMIN_PASSWORD` env var. This is a single shared
credential, not per-user accounts, consistent with the app's small,
internal-tool scope. The public student submission endpoint
(`POST /api/submissions`) is explicitly exempted and stays unauthenticated.
If `ADMIN_PASSWORD` is unset, admin access fails closed (returns 401
rather than silently allowing access).

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
| `ADMIN_PASSWORD` | app | HTTP Basic Auth password for `/admin` and admin API routes (`src/middleware.ts`); username is always `admin` |
