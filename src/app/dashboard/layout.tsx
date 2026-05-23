import AuthGuard from "@/components/auth/AuthGuard";
import { TopNav } from "@/components/dashboard/TopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <TopNav />
      <div style={{ paddingTop: "3.5rem" }}>
        {children}
      </div>
    </AuthGuard>
  );
}
