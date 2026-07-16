"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { Course, Workshop } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loading } from "@/components/ui/Loading";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SubmissionsTable, type SubmissionWithFiles } from "@/components/SubmissionsTable";
import { Save } from "lucide-react";

export default function AdminWorkshopPage({
  params,
}: {
  params: Promise<{ workshopId: string }>;
}) {
  const { workshopId } = use(params);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [name, setName] = useState("");
  const [submissions, setSubmissions] = useState<SubmissionWithFiles[]>([]);

  async function load() {
    const workshopRes = await fetch(`/api/workshops/${workshopId}`);
    const workshopData = await workshopRes.json();
    setWorkshop(workshopData);
    setName(workshopData.name ?? "");
    const [courseRes, submissionsRes] = await Promise.all([
      fetch(`/api/courses/${workshopData.course_id}`),
      fetch(`/api/submissions?workshopId=${workshopId}`),
    ]);
    setCourse(await courseRes.json());
    setSubmissions(await submissionsRes.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workshopId]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/workshops/${workshopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await load();
  }

  if (!workshop || !course)
    return (
      <main className="mx-auto max-w-3xl p-8">
        <Loading />
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Breadcrumbs
        items={[
          { label: "Courses", href: "/admin/courses" },
          { label: course.name, href: `/admin/courses/${course.id}` },
          { label: workshop.name },
        ]}
      />

      <h1 className="mt-2 mb-6 text-2xl font-semibold">
        {workshop.name}{" "}
        <span className="text-slate-400 dark:text-slate-500">({workshop.slug})</span>
      </h1>

      <form onSubmit={saveName} className="mb-8 flex gap-2">
        <Input wrapperClassName="flex-1" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" icon={Save}>
          Save name
        </Button>
      </form>

      <Link
        href={`/${course.slug}/${workshop.slug}`}
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        View submission page →
      </Link>

      <h2 className="mt-8 mb-4 text-lg font-medium">Submissions</h2>

      <SubmissionsTable submissions={submissions} />
    </main>
  );
}
