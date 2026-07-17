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
  return NextResponse.json({ ...rows[0], is_open: Boolean(rows[0].is_open) });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workshopId: string }> }
) {
  const { workshopId } = await params;
  const body = await request.json();

  const hasName = typeof body.name === "string";
  const hasIsOpen = typeof body.isOpen === "boolean";

  const name = hasName ? body.name.trim() : undefined;
  if (hasName && !name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!hasName && !hasIsOpen) {
    return NextResponse.json({ error: "name or isOpen is required" }, { status: 400 });
  }

  const fields: string[] = [];
  const values: (string | number)[] = [];
  if (hasName) {
    fields.push("name = ?");
    values.push(name);
  }
  if (hasIsOpen) {
    fields.push("is_open = ?");
    values.push(body.isOpen ? 1 : 0);
  }
  values.push(workshopId);

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE workshops SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "workshop not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: Number(workshopId),
    ...(hasName ? { name } : {}),
    ...(hasIsOpen ? { is_open: body.isOpen } : {}),
  });
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
