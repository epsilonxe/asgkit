import Link from "next/link";
import { countOf } from "@/lib/counts";
import { StatTile } from "@/components/ui/StatTile";
import { BookOpen, FileText, Layers, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [courseCount, workshopCount, submissionCount] = await Promise.all([
    countOf("courses"),
    countOf("workshops"),
    countOf("submissions"),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Admin</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Courses" value={courseCount} icon={BookOpen} />
        <StatTile label="Workshops" value={workshopCount} icon={Layers} />
        <StatTile label="Submissions" value={submissionCount} icon={FileText} />
      </div>

      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:shadow-none dark:hover:bg-blue-400"
      >
        Manage courses
        <ArrowRight className="h-4 w-4" />
      </Link>
    </main>
  );
}
