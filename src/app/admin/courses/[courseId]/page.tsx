"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import type { Course, Workshop } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loading } from "@/components/ui/Loading";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SubmissionsTable, type SubmissionWithFiles } from "@/components/SubmissionsTable";
import { Plus, Save, Trash2, ChevronRight } from "lucide-react";

type Tab = "workshops" | "submissions" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "workshops", label: "Workshops" },
  { id: "submissions", label: "Submissions" },
  { id: "settings", label: "Settings" },
];

export default function AdminCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const [tab, setTab] = useState<Tab>("workshops");
  const [course, setCourse] = useState<Course | null>(null);
  const [name, setName] = useState("");
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithFiles[]>([]);
  const [workshopName, setWorkshopName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [courseRes, workshopsRes, submissionsRes] = await Promise.all([
      fetch(`/api/courses/${courseId}`),
      fetch(`/api/workshops?courseId=${courseId}`),
      fetch(`/api/submissions?courseId=${courseId}`),
    ]);
    const courseData = await courseRes.json();
    setCourse(courseData);
    setName(courseData.name ?? "");
    setWorkshops(await workshopsRes.json());
    setSubmissions(await submissionsRes.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const submissionCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const s of submissions) {
      counts.set(s.workshop_id, (counts.get(s.workshop_id) ?? 0) + 1);
    }
    return counts;
  }, [submissions]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await load();
  }

  async function createWorkshop(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/workshops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: Number(courseId), name: workshopName }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "failed to create workshop");
      return;
    }
    setWorkshopName("");
    await load();
  }

  async function deleteWorkshop(id: number) {
    if (!confirm("Delete this workshop and its submissions?")) return;
    await fetch(`/api/workshops/${id}`, { method: "DELETE" });
    await load();
  }

  if (!course)
    return (
      <main className="mx-auto max-w-3xl p-8">
        <Loading />
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Breadcrumbs items={[{ label: "Courses", href: "/admin/courses" }, { label: course.name }]} />

      <h1 className="mt-2 mb-6 text-2xl font-semibold">
        {course.name}{" "}
      </h1>

      <div className="mb-6 flex gap-6 border-b border-slate-200 dark:border-slate-700">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 pb-2 text-sm font-medium ${
              tab === t.id
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "workshops" && (
        <div>
          <div className="mb-6 flex items-center justify-between gap-2">
            <h2 className="text-lg font-medium">Workshops</h2>
          </div>

          <form onSubmit={createWorkshop} className="mb-6 flex gap-2">
            <Input
              wrapperClassName="flex-1"
              placeholder="Workshop name"
              value={workshopName}
              onChange={(e) => setWorkshopName(e.target.value)}
            />
            <Button type="submit" icon={Plus}>
              New Workshop
            </Button>
          </form>
          {error && <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>}

          {workshops.length === 0 ? (
            <EmptyState>No workshops yet.</EmptyState>
          ) : (
            <div className="space-y-2">
              {workshops.map((w) => (
                <Panel key={w.id} className="flex items-center justify-between gap-4">
                  <Link
                    href={`/admin/workshops/${w.id}`}
                    className="flex flex-1 items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {w.name}
                      </div>
                      <div className="text-sm text-slate-400 dark:text-slate-500">{w.slug}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500">
                      {submissionCounts.get(w.id) ?? 0} submission
                      {submissionCounts.get(w.id) === 1 ? "" : "s"}
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </Link>
                  <Link
                    href={`/${course.slug}/${w.slug}`}
                    className="shrink-0 text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    view submission page
                  </Link>
                  <Button
                    variant="danger-link"
                    icon={Trash2}
                    className="shrink-0"
                    onClick={() => deleteWorkshop(w.id)}
                  >
                    Delete
                  </Button>
                </Panel>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "submissions" && (
        <div>
          <h2 className="mb-4 text-lg font-medium">Submissions</h2>
          <SubmissionsTable submissions={submissions} showWorkshopColumn />
        </div>
      )}

      {tab === "settings" && (
        <div>
          <h2 className="mb-4 text-lg font-medium">Settings</h2>
          <form onSubmit={saveName} className="flex gap-2">
            <Input
              wrapperClassName="flex-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" icon={Save}>
              Save name
            </Button>
          </form>
        </div>
      )}
    </main>
  );
}
