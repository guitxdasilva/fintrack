import type React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/common/components/layout/Sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/common/components/ui/sidebar";
import { Separator } from "@/common/components/ui/separator";
import { DashboardHeader } from "@/common/components/layout/DashboardHeader";
import { PageTitle } from "@/common/components/layout/PageTitle";
import { OnboardingTour } from "@/common/components/OnboardingTour";
import { FeedbackButton } from "@/common/components/FeedbackButton";

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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="pt-16 group-has-data-[collapsible=icon]/sidebar-wrapper:pt-12">
        <header className="fixed top-0 right-0 z-50 flex h-16 items-center gap-2 border-b bg-background/80 backdrop-blur-lg shadow-sm transition-[left,height] ease-linear left-0 sm:left-(--sidebar-width) group-has-data-[collapsible=icon]/sidebar-wrapper:left-(--sidebar-width-icon) group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 min-w-0">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <PageTitle />
          </div>
          <div className="ml-auto flex items-center gap-1 md:gap-2 px-2 md:px-4">
            <DashboardHeader
              userName={session.user.name ?? "Usuário"}
              userEmail={session.user.email ?? ""}
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col bg-muted/40">
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </SidebarInset>
      <OnboardingTour />
      <FeedbackButton />
    </SidebarProvider>
  );
}
