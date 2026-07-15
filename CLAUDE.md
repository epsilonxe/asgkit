# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is currently empty — no application code has been written yet. This file documents the intended
architecture and spec so that implementation work starts from a consistent design.

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
