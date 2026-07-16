import type { Submission } from "@/types/domain";
import { formatBytes } from "@/lib/formatBytes";
import { EmptyState } from "@/components/ui/EmptyState";

export type SubmissionWithFiles = Omit<Submission, "file_names"> & {
  files: { name: string; size: number | null }[];
};

export function SubmissionsTable({
  submissions,
  showWorkshopColumn = false,
}: {
  submissions: SubmissionWithFiles[];
  showWorkshopColumn?: boolean;
}) {
  if (submissions.length === 0) {
    return <EmptyState>No submissions yet.</EmptyState>;
  }

  return (
    <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-3 py-2 font-medium">Student ID</th>
            {showWorkshopColumn && <th className="px-3 py-2 font-medium">Workshop</th>}
            <th className="px-3 py-2 font-medium">Submitted At</th>
            <th className="px-3 py-2 font-medium">Files</th>
            <th className="px-3 py-2 font-medium">Client IP</th>
            <th className="px-3 py-2 font-medium">Client MAC</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id} className="border-t border-slate-200 align-top dark:border-slate-700">
              <td className="px-3 py-2">{s.student_id}</td>
              {showWorkshopColumn && <td className="px-3 py-2">{s.workshop_name}</td>}
              <td className="px-3 py-2 whitespace-nowrap">
                {new Date(s.submitted_at).toLocaleString()}
              </td>
              <td className="px-3 py-2">
                <ul className="space-y-0.5">
                  {s.files.map((f) => (
                    <li key={f.name}>
                      {f.name}{" "}
                      <span className="text-slate-400 dark:text-slate-500">
                        ({f.size !== null ? formatBytes(f.size) : "missing"})
                      </span>
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-3 py-2">{s.client_ip ?? "—"}</td>
              <td className="px-3 py-2">{s.client_mac ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
