import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold mb-6">Admin</h1>
      <Link
        href="/admin/courses"
        className="inline-block rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
      >
        Manage courses
      </Link>
    </main>
  );
}
