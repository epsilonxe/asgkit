import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import type { Course, Workshop } from "@/types/domain";
import type { RowDataPacket } from "mysql2";
import { EmptyState } from "@/components/ui/EmptyState";
import { UploadCloud } from "lucide-react";

type WorkshopCardData = Workshop & { submission_count: number };

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
    `SELECT w.*, COALESCE(s.submission_count, 0) AS submission_count
     FROM workshops w
     LEFT JOIN (
       SELECT workshop_id, COUNT(*) AS submission_count
       FROM submissions
       GROUP BY workshop_id
     ) s ON s.workshop_id = w.id
     WHERE w.course_id = ?
     ORDER BY w.name`,
    [course.id]
  );
  const workshops = workshopRows as WorkshopCardData[];

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link
        href="/"
        className="text-sm text-slate-500 hover:underline dark:text-slate-400"
      >
        ← All courses
      </Link>

      <h1 className="mt-2 mb-6 text-2xl font-semibold">{course.name}</h1>

      {workshops.length === 0 ? (
        <EmptyState>No workshops yet.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {workshops.map((w) => (
            <Link key={w.id} href={`/${course.slug}/${w.slug}`} className="block h-full">
              <div className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:border-slate-600">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{w.name}</div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      w.is_open
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${w.is_open ? "bg-green-600 dark:bg-green-400" : "bg-slate-500 dark:bg-slate-400"}`}
                    />
                    {w.is_open ? "Open" : "Closed"}
                  </span>
                </div>

                <div className="mt-auto flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <UploadCloud className="h-4 w-4 shrink-0" />
                  {w.submission_count} submission{w.submission_count === 1 ? "" : "s"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
