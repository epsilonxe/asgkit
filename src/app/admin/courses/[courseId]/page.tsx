"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { Course, Workshop } from "@/types/domain";

export default function AdminCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [name, setName] = useState("");
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [workshopName, setWorkshopName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [courseRes, workshopsRes] = await Promise.all([
      fetch(`/api/courses/${courseId}`),
      fetch(`/api/workshops?courseId=${courseId}`),
    ]);
    const courseData = await courseRes.json();
    setCourse(courseData);
    setName(courseData.name ?? "");
    setWorkshops(await workshopsRes.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

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

  if (!course) return <main className="mx-auto max-w-2xl p-8">Loading…</main>;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/admin/courses" className="text-sm text-gray-500 hover:underline">
        ← All courses
      </Link>

      <h1 className="mt-2 mb-6 text-2xl font-semibold">
        {course.name} <span className="text-gray-400">({course.slug})</span>
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

      <h2 className="mb-4 text-xl font-medium">Workshops</h2>

      <form onSubmit={createWorkshop} className="mb-6 flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          placeholder="Workshop name"
          value={workshopName}
          onChange={(e) => setWorkshopName(e.target.value)}
        />
        <button className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800">
          Add
        </button>
      </form>
      {error && <p className="mb-4 text-red-600">{error}</p>}

      {workshops.length === 0 ? (
        <p className="text-gray-500">No workshops yet.</p>
      ) : (
        <ul className="space-y-2">
          {workshops.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between rounded border px-4 py-2"
            >
              <div className="flex items-center gap-4">
                <Link href={`/admin/workshops/${w.id}`} className="hover:underline">
                  {w.name} <span className="text-gray-400">({w.slug})</span>
                </Link>
                <Link
                  href={`/${course.slug}/${w.slug}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  view submission page
                </Link>
              </div>
              <button
                onClick={() => deleteWorkshop(w.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
