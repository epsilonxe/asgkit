"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Course } from "@/types/domain";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/courses");
    setCourses(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, []);

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "failed to create course");
      return;
    }
    setName("");
    await load();
  }

  async function deleteCourse(id: number) {
    if (!confirm("Delete this course and all its workshops/submissions?")) return;
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold mb-6">Courses</h1>

      <form onSubmit={createCourse} className="mb-8 flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          placeholder="Course name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800">
          Add
        </button>
      </form>
      {error && <p className="mb-4 text-red-600">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-500">No courses yet.</p>
      ) : (
        <ul className="space-y-2">
          {courses.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded border px-4 py-2"
            >
              <Link href={`/admin/courses/${c.id}`} className="hover:underline">
                {c.name} <span className="text-gray-400">({c.slug})</span>
              </Link>
              <button
                onClick={() => deleteCourse(c.id)}
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
