import mysql from "mysql2/promise";

declare global {
  var __asgkitPool: mysql.Pool | undefined;
}

export const pool =
  global.__asgkitPool ??
  mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "asgkit",
    password: process.env.DB_PASSWORD ?? "changeme",
    database: process.env.DB_NAME ?? "asgkit",
    waitForConnections: true,
    connectionLimit: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global.__asgkitPool = pool;
}
