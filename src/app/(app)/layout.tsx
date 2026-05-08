import { requireActiveOrg } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireActiveOrg();

  return (
    <div className="flex min-h-screen bg-primary-50/40">
      <Sidebar orgName={ctx.orgName} email={ctx.email} />
      <main className="flex-1 overflow-x-auto">{children}</main>
    </div>
  );
}
