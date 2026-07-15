import { promises as fs } from "fs";
import path from "path";
import { isValidSlug } from "@/lib/validation";

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const UPLOADS_BASE = path.resolve(
  process.env.UPLOADS_BASE ?? path.join(process.cwd(), "uploads")
);

export class InvalidSegmentError extends Error {}
export class FileTooLargeError extends Error {
  constructor(public fileName: string) {
    super(`file "${fileName}" exceeds the ${MAX_FILE_SIZE_BYTES} byte limit`);
  }
}

// Accepts a (possibly nested) relative path - e.g. "src/nested/report.py"
// for directory drops - and sanitizes each segment individually so
// subdirectory structure can be preserved on disk without allowing
// traversal outside the submission directory.
function safeRelativePath(relPath: string): string {
  const segments = relPath
    .split(/[/\\]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (segments.length === 0) {
    throw new InvalidSegmentError(`invalid file path: ${relPath}`);
  }
  for (const segment of segments) {
    if (segment === "." || segment === "..") {
      throw new InvalidSegmentError(`invalid path segment in: ${relPath}`);
    }
  }
  return path.join(...segments);
}

// Resolves COURSE_SLUG/STUDENT_ID/WORKSHOP_SLUG under the uploads base,
// asserting the sanitized segments can't escape it (defense in depth on
// top of the segment whitelist below).
export function resolveSubmissionDir(
  courseSlug: string,
  studentId: string,
  workshopSlug: string
): string {
  for (const segment of [courseSlug, studentId, workshopSlug]) {
    if (!isValidSlug(segment)) {
      throw new InvalidSegmentError(`invalid path segment: ${segment}`);
    }
  }

  const dir = path.resolve(
    UPLOADS_BASE,
    courseSlug,
    studentId,
    workshopSlug
  );

  if (dir !== UPLOADS_BASE && !dir.startsWith(UPLOADS_BASE + path.sep)) {
    throw new InvalidSegmentError("resolved path escapes uploads base");
  }

  return dir;
}

// Overwrites any previous submission in `dir`: deletes existing contents,
// then writes the given files. Never leaves a mix of old and new files.
export async function writeSubmissionFiles(
  dir: string,
  files: File[]
): Promise<string[]> {
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new FileTooLargeError(file.name);
    }
  }

  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });

  const fileNames: string[] = [];
  for (const file of files) {
    const relPath = safeRelativePath(file.name);
    const destPath = path.resolve(dir, relPath);
    if (destPath !== dir && !destPath.startsWith(dir + path.sep)) {
      throw new InvalidSegmentError(`resolved file path escapes submission dir: ${relPath}`);
    }

    await fs.mkdir(path.dirname(destPath), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(destPath, buffer);
    fileNames.push(relPath);
  }

  return fileNames;
}
