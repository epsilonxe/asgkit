import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export type Theme = "light" | "dark" | "system";

export interface AppSettings {
  maxFileSizeMb: number;
  theme: Theme;
  rowsPerPage: number;
}

export async function getSettings(): Promise<AppSettings> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT max_file_size_mb, theme, rows_per_page FROM app_settings WHERE id = 1"
  );
  const row = rows[0];
  return {
    maxFileSizeMb: row.max_file_size_mb,
    theme: row.theme as Theme,
    rowsPerPage: row.rows_per_page,
  };
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<void> {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (partial.maxFileSizeMb !== undefined) {
    fields.push("max_file_size_mb = ?");
    values.push(partial.maxFileSizeMb);
  }
  if (partial.theme !== undefined) {
    fields.push("theme = ?");
    values.push(partial.theme);
  }
  if (partial.rowsPerPage !== undefined) {
    fields.push("rows_per_page = ?");
    values.push(partial.rowsPerPage);
  }
  if (fields.length === 0) return;

  await pool.query(`UPDATE app_settings SET ${fields.join(", ")} WHERE id = 1`, values);
}
