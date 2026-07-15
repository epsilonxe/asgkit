import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM courses WHERE id = ?",
    [courseId]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "course not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE courses SET name = ? WHERE id = ?",
    [name, courseId]
  );
  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "course not found" }, { status: 404 });
  }
  return NextResponse.json({ id: Number(courseId), name });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM courses WHERE id = ?",
    [courseId]
  );
  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "course not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
