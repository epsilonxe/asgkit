import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import type { Course, Workshop } from "@/types/domain";
import type { RowDataPacket } from "mysql2";
import SubmissionForm from "./SubmissionForm";

export const dynamic = "force-dynamic";

export default async function WorkshopSubmissionPage({
  params,
}: {
  params: Promise<{ course: string; workshop: string }>;
}) {
  const { course: courseSlug, workshop: workshopSlug } = await params;

  const [courseRows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM courses WHERE slug = ?",
    [courseSlug]
  );
  const course = courseRows[0] as Course | undefined;
  if (!course) notFound();

  const [workshopRows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM workshops WHERE course_id = ? AND slug = ?",
    [course.id, workshopSlug]
  );
  const workshop = workshopRows[0] as Workshop | undefined;
  if (!workshop) notFound();

  return (
    <main className="mx-auto max-w-xl p-8">
      <Link href={`/${course.slug}`} className="text-sm text-gray-500 hover:underline">
        ← {course.name}
      </Link>

      <h1 className="mt-2 mb-6 text-2xl font-semibold">{workshop.name}</h1>

      <SubmissionForm courseSlug={course.slug} workshopSlug={workshop.slug} />
    </main>
  );
}
