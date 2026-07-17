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

- The database should store metadata (courses, workshops, students, submission records) and reference file paths on disk; it should not store file contents. Each submission record captures the submission date/time and an anonymous per-browser `device_id` cookie (not client IP/MAC — dropped in favor of Docker portability, see Known Limitations).

## Routing

- One URL per workshop submission page: `/COURSE_NAME/WORKSHOP_NAME`
- That page must collect a student ID and allow file upload(s) to create/update that student's submission for the workshop.

## Constraints to preserve when implementing

- Local-only access: do not add public-facing auth/hosting concerns (e.g. OAuth providers, CDN, HTTPS
  termination) — this is a LAN/localhost tool.
- Multiple courses and multiple workshops per course must both be supported by the data model and routing from the start, not bolted on later.
- No client IP/MAC capture: an earlier design captured both via ARP lookup, but this required Docker
  `network_mode: host`, which only works on native Linux and broke `docker compose up --build` on Docker
  Desktop (macOS/Windows). Deliberately dropped in favor of portability — see Known Limitations.

## Known Limitations

- **Device identification is a self-reported student ID + an anonymous `device_id` cookie** (UUID, `httpOnly`,
  set on first submission via `POST /api/submissions`) — not proof of identity, just a cheap signal for spotting
  the same browser resubmitting under a different student ID. Nullable if cookies are blocked/cleared; never
  blocks a submission.
- **No roster validation** — student ID is a free-text field; a typo creates a distinct submission rather than
  erroring or matching an existing student.
- **Admin authentication is a single shared HTTP Basic Auth credential** (`src/proxy.ts`, username always
  `admin`, password from `ADMIN_PASSWORD`) — not per-user accounts. Protects `/admin` pages and admin API routes
  (`/api/courses/*`, `/api/workshops/*`, `GET /api/submissions`); the public `POST /api/submissions` (student
  upload) is intentionally exempt. Fails closed if `ADMIN_PASSWORD` is unset.
- **Slugs are immutable** once set — renaming a course/workshop's display `name` does not move existing files on
  disk (which are keyed by slug, not display name).
