"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { Course, Workshop } from "@/types/domain";

export default function AdminWorkshopPage({
  params,
}: {
  params: Promise<{ workshopId: string }>;
}) {
  const { workshopId } = use(params);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [name, setName] = useState("");

  async function load() {
    const workshopRes = await fetch(`/api/workshops/${workshopId}`);
    const workshopData = await workshopRes.json();
    setWorkshop(workshopData);
    setName(workshopData.name ?? "");
    const courseRes = await fetch(`/api/courses/${workshopData.course_id}`);
    setCourse(await courseRes.json());
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
    <main className="mx-auto max-w-2xl p-8">
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
    </main>
  );
}
