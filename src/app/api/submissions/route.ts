import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { pool } from "@/lib/db";
import {
  resolveSubmissionDir,
  writeSubmissionFiles,
  InvalidSegmentError,
  FileTooLargeError,
} from "@/lib/fsStorage";
import { isValidSlug } from "@/lib/validation";
import { getSettings } from "@/lib/settings";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

const DEVICE_COOKIE_NAME = "device_id";
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function GET(request: NextRequest) {
  const workshopId = request.nextUrl.searchParams.get("workshopId");
  const courseId = request.nextUrl.searchParams.get("courseId");
  if (!workshopId && !courseId) {
    return NextResponse.json({ error: "workshopId or courseId is required" }, { status: 400 });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT submissions.*, workshops.slug AS workshop_slug, workshops.name AS workshop_name,
            courses.slug AS course_slug
     FROM submissions
     JOIN workshops ON workshops.id = submissions.workshop_id
     JOIN courses ON courses.id = workshops.course_id
     WHERE ${workshopId ? "submissions.workshop_id = ?" : "workshops.course_id = ?"}
     ORDER BY submitted_at DESC`,
    [workshopId ?? courseId]
  );

  const submissions = await Promise.all(
    rows.map(async (row) => {
      const dir = resolveSubmissionDir(row.course_slug, row.student_id, row.workshop_slug);
      const files = await Promise.all(
        (row.file_names as string[]).map(async (relPath) => {
          try {
            const stat = await fs.stat(path.join(dir, relPath));
            return { name: relPath, size: stat.size };
          } catch {
            // File missing on disk (e.g. deleted out-of-band) - don't fail the whole list.
            return { name: relPath, size: null as number | null };
          }
        })
      );
      return {
        id: row.id,
        workshop_id: row.workshop_id,
        workshop_name: row.workshop_name,
        student_id: row.student_id,
        submitted_at: row.submitted_at,
        device_id: row.device_id,
        files,
      };
    })
  );

  return NextResponse.json(submissions);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const courseSlug = String(formData.get("courseSlug") ?? "");
  const workshopSlug = String(formData.get("workshopSlug") ?? "");
  const studentId = String(formData.get("studentId") ?? "").trim();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (!isValidSlug(courseSlug) || !isValidSlug(workshopSlug)) {
    return NextResponse.json({ error: "invalid course/workshop" }, { status: 400 });
  }
  if (!studentId || !isValidSlug(studentId)) {
    return NextResponse.json(
      { error: "student ID must contain only letters, numbers, dashes and underscores" },
      { status: 400 }
    );
  }
  if (files.length === 0) {
    return NextResponse.json({ error: "at least one file is required" }, { status: 400 });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT workshops.id AS workshop_id
     FROM workshops
     JOIN courses ON courses.id = workshops.course_id
     WHERE courses.slug = ? AND workshops.slug = ?`,
    [courseSlug, workshopSlug]
  );
  const workshopRow = rows[0];
  if (!workshopRow) {
    return NextResponse.json({ error: "workshop not found" }, { status: 404 });
  }

  let dir: string;
  try {
    dir = resolveSubmissionDir(courseSlug, studentId, workshopSlug);
  } catch (err) {
    if (err instanceof InvalidSegmentError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  let fileNames: string[];
  try {
    const { maxFileSizeMb } = await getSettings();
    fileNames = await writeSubmissionFiles(dir, files, maxFileSizeMb * 1024 * 1024);
  } catch (err) {
    if (err instanceof FileTooLargeError) {
      return NextResponse.json({ error: err.message }, { status: 413 });
    }
    if (err instanceof InvalidSegmentError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  // Anonymous device identifier - not proof of identity, just a signal to
  // spot the same browser resubmitting under a different student ID.
  // Assigned once and persisted via cookie; never blocks a submission.
  const deviceId = request.cookies.get(DEVICE_COOKIE_NAME)?.value ?? randomUUID();

  await pool.query<ResultSetHeader>(
    `INSERT INTO submissions (workshop_id, student_id, file_names, submitted_at, device_id)
     VALUES (?, ?, ?, NOW(), ?)
     ON DUPLICATE KEY UPDATE
       file_names = VALUES(file_names),
       submitted_at = VALUES(submitted_at),
       device_id = VALUES(device_id)`,
    [workshopRow.workshop_id, studentId, JSON.stringify(fileNames), deviceId]
  );

  const response = NextResponse.json({
    ok: true,
    fileNames,
    submittedAt: new Date().toISOString(),
  });

  response.cookies.set(DEVICE_COOKIE_NAME, deviceId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: DEVICE_COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
