import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  resolveSubmissionDir,
  writeSubmissionFiles,
  InvalidSegmentError,
  FileTooLargeError,
} from "@/lib/fsStorage";
import { isValidSlug } from "@/lib/validation";
import { getClientIp } from "@/lib/net/clientIp";
import { lookupClientMac } from "@/lib/net/clientMac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

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
    fileNames = await writeSubmissionFiles(dir, files);
  } catch (err) {
    if (err instanceof FileTooLargeError) {
      return NextResponse.json({ error: err.message }, { status: 413 });
    }
    if (err instanceof InvalidSegmentError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  // Best-effort; a failed lookup must never block a submission from being recorded.
  const clientIp = getClientIp(request);
  const clientMac = clientIp ? await lookupClientMac(clientIp) : null;

  await pool.query<ResultSetHeader>(
    `INSERT INTO submissions (workshop_id, student_id, file_names, submitted_at, client_ip, client_mac)
     VALUES (?, ?, ?, NOW(), ?, ?)
     ON DUPLICATE KEY UPDATE
       file_names = VALUES(file_names),
       submitted_at = VALUES(submitted_at),
       client_ip = VALUES(client_ip),
       client_mac = VALUES(client_mac)`,
    [workshopRow.workshop_id, studentId, JSON.stringify(fileNames), clientIp, clientMac]
  );

  return NextResponse.json({
    ok: true,
    fileNames,
    submittedAt: new Date().toISOString(),
  });
}
