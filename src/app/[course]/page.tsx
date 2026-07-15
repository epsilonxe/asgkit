import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import type { Course, Workshop } from "@/types/domain";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course: courseSlug } = await params;

  const [courseRows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM courses WHERE slug = ?",
    [courseSlug]
  );
  const course = courseRows[0] as Course | undefined;
  if (!course) notFound();

  const [workshopRows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM workshops WHERE course_id = ? ORDER BY name",
    [course.id]
  );
  const workshops = workshopRows as Workshop[];

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← All courses
      </Link>

      <h1 className="mt-2 mb-6 text-2xl font-semibold">{course.name}</h1>

      {workshops.length === 0 ? (
        <p className="text-gray-500">No workshops yet.</p>
      ) : (
        <ul className="space-y-2">
          {workshops.map((w) => (
            <li key={w.id} className="rounded border px-4 py-2">
              <Link href={`/${course.slug}/${w.slug}`} className="hover:underline">
                {w.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
