"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Course } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loading } from "@/components/ui/Loading";
import { Plus, Trash2 } from "lucide-react";

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
      <h1 className="mb-6 text-2xl font-semibold">Courses</h1>

      <form onSubmit={createCourse} className="mb-8 flex gap-2">
        <Input
          wrapperClassName="flex-1"
          placeholder="Course name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" icon={Plus}>
          Add
        </Button>
      </form>
      {error && <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <Loading />
      ) : courses.length === 0 ? (
        <EmptyState>No courses yet.</EmptyState>
      ) : (
        <div className="space-y-2">
          {courses.map((c) => (
            <Panel key={c.id} className="flex items-center justify-between gap-4">
              <Link
                href={`/admin/courses/${c.id}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {c.name}{" "}
                <span className="text-slate-400 dark:text-slate-500">({c.slug})</span>
              </Link>
              <Button variant="danger-link" icon={Trash2} onClick={() => deleteCourse(c.id)}>
                Delete
              </Button>
            </Panel>
          ))}
        </div>
      )}
    </main>
  );
}
