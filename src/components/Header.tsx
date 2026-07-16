"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Monitor } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#courses", label: "Courses" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
        <Link href="/" className="flex items-center gap-3">
          <GraduationCap className="h-7 w-7 text-blue-400" />
          <span>
            <span className="block font-semibold text-white">
              Workshop <span className="text-blue-400">Hub</span>
            </span>
            <span className="block text-xs text-slate-400">Local Assignment Manager</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <nav className="flex gap-6 text-sm font-medium">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : link.href !== "/#courses" && pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={active ? "text-blue-400" : "text-slate-300 hover:text-white"}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <span className="hidden items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 sm:flex">
            <Monitor className="h-3.5 w-3.5" />
            Local Only
          </span>
        </div>
      </div>
    </header>
  );
}
