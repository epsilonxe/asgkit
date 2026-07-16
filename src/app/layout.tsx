import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Header } from "@/components/Header";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Workshop Hub",
  description: "Local Assignment Manager",
};

// Every page needs this layout, which reads settings from a live DB -
// force dynamic rendering here so no page can be statically prerendered
// (which would require a DB connection at build time, unavailable during
// `docker build`).
export const dynamic = "force-dynamic";

// Runs before first paint so "system" theme never flashes the wrong
// mode - class-based dark mode doesn't auto-follow the OS by itself.
const NO_FLASH_SCRIPT = `(function(){try{if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { theme } = await getSettings();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${
        theme === "dark" ? " dark" : ""
      }`}
    >
      <head>
        {theme === "system" && (
          <Script id="no-flash-theme" strategy="beforeInteractive">
            {NO_FLASH_SCRIPT}
          </Script>
        )}
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Header />
        {children}
      </body>
    </html>
  );
}
