import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/common/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell
      userName={session.user.name ?? "Usuário"}
      userEmail={session.user.email ?? ""}
    >
      {children}
    </DashboardShell>
  );
}
