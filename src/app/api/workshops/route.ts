import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { isValidSlug, slugify } from "@/lib/validation";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get("courseId");
  const [rows] = courseId
    ? await pool.query<RowDataPacket[]>(
        "SELECT * FROM workshops WHERE course_id = ? ORDER BY created_at DESC",
        [courseId]
      )
    : await pool.query<RowDataPacket[]>(
        "SELECT * FROM workshops ORDER BY created_at DESC"
      );
  return NextResponse.json(rows.map((row) => ({ ...row, is_open: Boolean(row.is_open) })));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const courseId = Number(body.courseId);
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim()
      : slugify(name);

  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "slug must contain only letters, numbers, dashes and underscores" },
      { status: 400 }
    );
  }

  const [courseRows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM courses WHERE id = ?",
    [courseId]
  );
  if (courseRows.length === 0) {
    return NextResponse.json({ error: "course not found" }, { status: 404 });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO workshops (course_id, name, slug) VALUES (?, ?, ?)",
      [courseId, name, slug]
    );
    return NextResponse.json(
      { id: result.insertId, course_id: courseId, name, slug, is_open: true },
      { status: 201 }
    );
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: `slug "${slug}" is already in use for this course` },
        { status: 409 }
      );
    }
    throw err;
  }
}
