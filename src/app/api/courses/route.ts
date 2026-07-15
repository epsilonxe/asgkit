import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { isValidSlug, slugify } from "@/lib/validation";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM courses ORDER BY created_at DESC"
  );
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
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

  try {
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO courses (name, slug) VALUES (?, ?)",
      [name, slug]
    );
    return NextResponse.json(
      { id: result.insertId, name, slug },
      { status: 201 }
    );
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: `slug "${slug}" is already in use` },
        { status: 409 }
      );
    }
    throw err;
  }
}
