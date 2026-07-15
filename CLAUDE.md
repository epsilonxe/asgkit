# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Implemented: Next.js (App Router) + MySQL + Docker, per the spec below. See `README.md` for setup/deployment
instructions; this file focuses on architecture rationale and constraints for future changes.

## Intended purpose

A student assignment management webapp, accessed locally only (not deployed publicly).

## Intended stack

- Frontend: Next.js, HTML5, Tailwind CSS
- Database: MySQL
- Deployment: Docker (local only)

## Core domain model

- Courses → Workshops → Student submissions, i.e. a course contains multiple workshops, and each workshop accepts submissions from multiple students.
- Assignment files are stored on the local filesystem of the running server (not in the database), organized as:

  ```
  COURSE_NAME/STUDENT_ID/WORKSHOP_NAME/FILES
  ```

- The database should store metadata (courses, workshops, students, submission records) and reference file paths on disk; it should not store file contents. Each submission record must also capture the submission date/time and the MAC address of the submitting client.

## Routing

- One URL per workshop submission page: `/COURSE_NAME/WORKSHOP_NAME`
- That page must collect a student ID and allow file upload(s) to create/update that student's submission for the workshop.

## Constraints to preserve when implementing

- Local-only access: do not add public-facing auth/hosting concerns (e.g. OAuth providers, CDN, HTTPS
  termination) — this is a LAN/localhost tool.
- Multiple courses and multiple workshops per course must both be supported by the data model and routing from the start, not bolted on later.
- MAC address capture only works for clients on the same local network/subnet as the server (browsers cannot report MAC addresses directly; this requires an ARP-based lookup using the client's IP from the server side).

## Known Limitations

- **MAC capture requires `network_mode: host`** (Linux host only) — doesn't work on Docker Desktop
  (macOS/Windows); `client_ip` is always recorded regardless, as a fallback identifier. Cross-subnet, VPN, or
  router-hopped clients will always yield a `null` MAC. See `README.md` for the Windows WSL2 mirrored-networking
  workaround.
- **No roster validation** — student ID is a free-text field; a typo creates a distinct submission rather than
  erroring or matching an existing student.
- **Admin authentication is a single shared HTTP Basic Auth credential** (`src/middleware.ts`, username always
  `admin`, password from `ADMIN_PASSWORD`) — not per-user accounts. Protects `/admin` pages and admin API routes
  (`/api/courses/*`, `/api/workshops/*`, `GET /api/submissions`); the public `POST /api/submissions` (student
  upload) is intentionally exempt. Fails closed if `ADMIN_PASSWORD` is unset.
- **Slugs are immutable** once set — renaming a course/workshop's display `name` does not move existing files on
  disk (which are keyed by slug, not display name).
