"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { Course, Submission, Workshop } from "@/types/domain";
import { formatBytes } from "@/lib/formatBytes";

type SubmissionWithFiles = Omit<Submission, "file_names"> & {
  files: { name: string; size: number | null }[];
};

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

  if (!workshop || !course) return <main className="mx-auto max-w-2xl p-8">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href={`/admin/courses/${course.id}`} className="text-sm text-gray-500 hover:underline">
        ← {course.name}
      </Link>

      <h1 className="mt-2 mb-6 text-2xl font-semibold">
        {workshop.name} <span className="text-gray-400">({workshop.slug})</span>
      </h1>

      <form onSubmit={saveName} className="mb-8 flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800">
          Save name
        </button>
      </form>

      <Link
        href={`/${course.slug}/${workshop.slug}`}
        className="text-sm text-blue-600 hover:underline"
      >
        View submission page →
      </Link>

      <h2 className="mt-8 mb-4 text-xl font-medium">Submissions</h2>

      {submissions.length === 0 ? (
        <p className="text-gray-500">No submissions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 font-medium">Student ID</th>
                <th className="px-3 py-2 font-medium">Submitted At</th>
                <th className="px-3 py-2 font-medium">Files</th>
                <th className="px-3 py-2 font-medium">Client IP</th>
                <th className="px-3 py-2 font-medium">Client MAC</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-t align-top">
                  <td className="px-3 py-2">{s.student_id}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(s.submitted_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <ul className="space-y-0.5">
                      {s.files.map((f) => (
                        <li key={f.name}>
                          {f.name}{" "}
                          <span className="text-gray-400">
                            ({f.size !== null ? formatBytes(f.size) : "missing"})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-3 py-2">{s.client_ip ?? "—"}</td>
                  <td className="px-3 py-2">{s.client_mac ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
