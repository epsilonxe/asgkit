import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <AdminSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
