import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function countOf(
  table: "courses" | "workshops" | "submissions"
): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS count FROM ${table}`);
  return rows[0].count as number;
}
