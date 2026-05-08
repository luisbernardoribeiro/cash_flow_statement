import { requireActiveOrg } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireActiveOrg();

  return (
    <AppShell orgName={ctx.orgName} email={ctx.email}>
      {children}
    </AppShell>
  );
}
