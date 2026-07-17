"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { BookOpen, ChevronLeft, ChevronRight, Layers, UploadCloud } from "lucide-react";

export interface CourseCardData {
  id: number;
  name: string;
  slug: string;
  workshop_count: number;
  submission_count: number;
  recent_workshop_name: string | null;
}

const ARROW_BUTTON_CLASSES =
  "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2.5 text-slate-600 shadow-md ring-1 ring-slate-200 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700";

export function CourseCarousel({ courses }: { courses: CourseCardData[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "center", loop: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync initial scroll-button state from the embla instance
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative px-0 lg:px-6">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-mx-1 flex gap-4 px-1 py-1">
          {courses.map((c) => (
            <div key={c.id} className="min-w-0 flex-[0_0_80%] sm:flex-[0_0_60%] lg:flex-[0_0_50%]">

              <Link href={`/${c.slug}`} className="block h-full">
                <div className="flex h-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:border-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-50 p-3 dark:bg-blue-950/50">
                      <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {c.name}
                      </div>
                      <div className="truncate text-sm text-slate-400 dark:text-slate-500">
                        {c.slug}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-4 w-4 shrink-0" />
                      {c.workshop_count} workshop{c.workshop_count === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UploadCloud className="h-4 w-4 shrink-0" />
                      {c.submission_count} submission{c.submission_count === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-auto line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                    {c.recent_workshop_name ? (
                      <>
                        Recent:{" "}
                        <span className="text-slate-700 dark:text-slate-300">
                          {c.recent_workshop_name}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">No workshops yet</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous courses"
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canScrollPrev}
        className={`${ARROW_BUTTON_CLASSES} left-0 lg:-left-4`}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Next courses"
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canScrollNext}
        className={`${ARROW_BUTTON_CLASSES} right-0 lg:-right-4`}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
