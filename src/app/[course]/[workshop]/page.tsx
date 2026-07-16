import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import type { Course, Workshop } from "@/types/domain";
import type { RowDataPacket } from "mysql2";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getSettings } from "@/lib/settings";
import { UploadCloud } from "lucide-react";
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

  const { maxFileSizeMb } = await getSettings();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Breadcrumbs items={[{ label: course.name, href: `/${course.slug}` }, { label: workshop.name }]} />

      <h1 className="mt-2 mb-6 flex items-center gap-2 text-2xl font-semibold">
        <UploadCloud className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        Submit to Workshop
      </h1>

      <SubmissionForm
        courseSlug={course.slug}
        workshopSlug={workshop.slug}
        maxFileSizeMb={maxFileSizeMb}
      />
    </main>
  );
}
