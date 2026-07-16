import Link from "next/link";
import Image from "next/image";
import { pool } from "@/lib/db";
import type { Course } from "@/types/domain";
import type { RowDataPacket } from "mysql2";
import { Panel } from "@/components/ui/Panel";
import { StatTile } from "@/components/ui/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { countOf } from "@/lib/counts";
import {
  BookOpen,
  Layers,
  UploadCloud,
  Home as HomeIcon,
  ArrowRight,
  FolderOpen,
  Database,
  Shield,
  Lock,
  Container,
  GraduationCap,
} from "lucide-react";

export const dynamic = "force-dynamic";

const HERO_FEATURES = [
  { icon: FolderOpen, label: "Multiple Courses", sub: "Organize by course" },
  { icon: Layers, label: "Multiple Workshops", sub: "Per course" },
  { icon: UploadCloud, label: "File Uploads", sub: "Per student" },
];

const FEATURE_STRIP = [
  { icon: Shield, title: "Local Only", desc: "Designed for local networks. Not public-facing." },
  { icon: Lock, title: "Simple Admin Access", desc: "HTTP Basic Auth for /admin (single shared credential)." },
  { icon: Container, title: "Dockerized", desc: "Easy local setup with Docker & Docker Compose." },
  { icon: GraduationCap, title: "Built for Educators", desc: "Lightweight, fast, and focused on what matters." },
];

export default async function Home() {
  const [[courses], courseCount, workshopCount] = await Promise.all([
    pool.query<RowDataPacket[]>("SELECT * FROM courses ORDER BY name"),
    countOf("courses"),
    countOf("workshops"),
  ]);

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/60 to-transparent px-8 py-16 dark:border-slate-800 dark:from-blue-950/10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              <HomeIcon className="h-3.5 w-3.5" />
              Local • Private • LAN Only
            </span>

            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-100">
              Manage Course Workshops and Student{" "}
              <span className="text-blue-600 dark:text-blue-400">Submissions</span>
            </h1>

            <p className="mb-6 max-w-lg text-slate-600 dark:text-slate-400">
              Workshop Hub helps instructors organize courses, publish workshops, and collect
              student submissions across your local network.
            </p>

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {HERO_FEATURES.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <f.icon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {f.label}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-8 flex flex-wrap gap-3">
              <a href="#courses">
                <Button icon={ArrowRight}>Browse Courses</Button>
              </a>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-1 flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                  <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Files on Disk
                </div>
                <p className="text-slate-500 dark:text-slate-400">Stored on the server in:</p>
                <code className="mt-1 block text-xs text-blue-700 dark:text-blue-400">
                  COURSE/STUDENT/WORKSHOP/FILES
                </code>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-1 flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                  <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Metadata in MySQL
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Courses, workshops, submissions, timestamps, client IP & MAC address.
                </p>
              </div>
            </div>
          </div>

          {/* Illustrative preview: real product screenshots */}
          <div className="relative hidden pb-24 lg:block">
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-lg dark:border-slate-700">
              <Image
                src="/images/ss_app_.png"
                alt="Workshop Hub admin course page"
                width={3819}
                height={2273}
                className="h-auto w-full"
                priority
              />
            </div>

            <div className="absolute -bottom-8 left-12 w-40 overflow-hidden rounded-lg border border-slate-200 shadow-xl sm:w-48 dark:border-slate-700">
              <Image
                src="/images/ss_submission.png"
                alt="Student submission page"
                width={794}
                height={912}
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="mx-auto max-w-5xl px-8 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr]">
          <aside className="space-y-4">
            <StatTile label="Courses" value={courseCount} icon={BookOpen} />
            <StatTile label="Workshops" value={workshopCount} icon={Layers} />
          </aside>

          <div>
            <h2 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Courses
            </h2>

            {courses.length === 0 ? (
              <EmptyState>No courses yet.</EmptyState>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(courses as Course[]).map((c) => (
                  <Link key={c.id} href={`/${c.slug}`} className="block">
                    <Panel className="!py-4 flex items-start gap-3 transition-shadow hover:shadow-md dark:hover:border-slate-600">
                      <div className="rounded-full bg-blue-50 p-2.5 dark:bg-blue-950/50">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {c.name}
                        </div>
                        <div className="text-sm text-slate-400 dark:text-slate-500">
                          {c.slug}
                        </div>
                      </div>
                    </Panel>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="bg-blue-50 py-12 dark:bg-slate-900">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_STRIP.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <f.icon className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{f.title}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 px-8 py-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Workshop Hub — local network tool
      </footer>
    </main>
  );
}
