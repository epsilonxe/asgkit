import Link from "next/link";
import { pool } from "@/lib/db";
import type { Course } from "@/types/domain";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [courses] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM courses ORDER BY name"
  );

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Courses</h1>

      {courses.length === 0 ? (
        <p className="text-gray-500">No courses yet.</p>
      ) : (
        <ul className="space-y-2">
          {(courses as Course[]).map((c) => (
            <li key={c.id} className="rounded border px-4 py-2">
              <Link href={`/${c.slug}`} className="hover:underline">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/admin"
        className="mt-8 inline-block text-sm text-gray-400 hover:underline"
      >
        Admin
      </Link>
    </main>
  );
}
