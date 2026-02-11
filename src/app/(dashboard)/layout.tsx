"use client";

import { SidebarProvider, SidebarInset } from "@/common/components/ui/sidebar";
import { AppSidebar } from "@/common/components/layout/Sidebar";
import { Header } from "@/common/components/layout/Header";
import { ThemeProvider } from "@/common/contexts/ThemeContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
