"use client";

import { SidebarProvider, SidebarInset } from "@/common/components/ui/sidebar";
import { AppSidebar } from "@/common/components/layout/Sidebar";
import { Header } from "@/common/components/layout/Header";
import { ThemeProvider } from "@/common/contexts/ThemeContext";

interface DashboardShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}

export function DashboardShell({
  children,
  userName,
  userEmail,
}: DashboardShellProps) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header userName={userName} userEmail={userEmail} />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
