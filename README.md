# asgkit

**Workshop Hub — Local Assignment Manager.** Student assignment
management webapp: courses → workshops → student submissions.
Local-network only. Student submission is unauthenticated; the admin
area is password-protected. See `CLAUDE.md` for the full spec and
architecture rationale (written for AI agents working in this repo, but
useful background for humans too).

## Stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- MySQL 8.4
- Docker Compose for deployment

## Requirements

- **Docker Engine** with the Compose plugin (`docker compose`, not the old
  standalone `docker-compose` v1 binary) — works the same on Linux, macOS,
  and Windows (Docker Desktop); no special networking mode required.
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
npm run dev                  # plain next dev
```

App: http://localhost:3000
Admin (create courses/workshops): http://localhost:3000/admin — prompts
for HTTP Basic Auth credentials (username `admin`, password from
`ADMIN_PASSWORD` in `.env`).

## Full stack via Docker

```bash
docker compose up --build
```

Works the same on Linux, macOS, and Windows (Docker Desktop) — the app
connects to MySQL over the compose network (`DB_HOST=mysql`) and publishes
port 3000 to the host normally, no special networking mode required.

## Deploying to a target machine

1. Install Docker Engine + the Compose plugin, then enable Docker itself
   on boot (Linux):
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

## Data model

Courses → workshops → submissions (see `db/init.sql` for the source of
truth). Notes:

- Slugs (used in both URLs and the on-disk directory layout) are
  **immutable** once set; only the display `name` can be edited.
- Resubmitting overwrites in place: old files under the student's
  submission directory are deleted before the new ones are written, and the
  DB row is updated via `ON DUPLICATE KEY UPDATE` (same `id`, not a new row).
- Each workshop has an `is_open` flag (default open) controlling whether its
  public submission page accepts uploads; toggled from the admin UI.

### Upgrading an existing deployment

`db/init.sql` only runs against a **fresh** `mysql_data` volume (MySQL skips
`docker-entrypoint-initdb.d` once the data directory is initialized). If you
already have a running deployment from before the `is_open` column existed,
apply it manually:

```sql
ALTER TABLE workshops ADD COLUMN is_open TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE app_settings ADD COLUMN rows_per_page INT NOT NULL DEFAULT 5;
```

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
enforced in `src/proxy.ts` — username is always `admin`, password
comes from the `ADMIN_PASSWORD` env var. This is a single shared
credential, not per-user accounts, consistent with the app's small,
internal-tool scope. The public student submission endpoint
(`POST /api/submissions`) is explicitly exempted and stays unauthenticated.
If `ADMIN_PASSWORD` is unset, admin access fails closed (returns 401
rather than silently allowing access).

## Device identification

Submissions don't capture client IP/MAC addresses (dropped in favor of
Docker portability — see `CLAUDE.md`). Instead, `POST /api/submissions`
assigns each browser an anonymous `device_id` cookie (a UUID, generated on
first submission, `httpOnly`, 1-year expiry) and stores it alongside every
submission. It's **not proof of identity** — students self-report their
student ID — it's just a cheap signal for spotting the same browser
resubmitting under a different student ID. Nullable, and a missing/blocked
cookie never blocks a submission.

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
| `PORT` | app | Port Next.js listens on (default 3000) |
| `MYSQL_ROOT_PASSWORD` / `MYSQL_USER` / `MYSQL_PASSWORD` | compose only | Passed to the `mysql` service; set in `.env` (see `.env.example`) |
| `ADMIN_PASSWORD` | app | HTTP Basic Auth password for `/admin` and admin API routes (`src/proxy.ts`); username is always `admin` |
