import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workshopId: string }> }
) {
  const { workshopId } = await params;
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM workshops WHERE id = ?",
    [workshopId]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "workshop not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workshopId: string }> }
) {
  const { workshopId } = await params;
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE workshops SET name = ? WHERE id = ?",
    [name, workshopId]
  );
  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "workshop not found" }, { status: 404 });
  }
  return NextResponse.json({ id: Number(workshopId), name });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ workshopId: string }> }
) {
  const { workshopId } = await params;
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM workshops WHERE id = ?",
    [workshopId]
  );
  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "workshop not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
