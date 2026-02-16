"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  Target,
  CreditCard,
  PiggyBank,
} from "lucide-react";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/common/components/ui/sidebar";

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    tourId: "nav-dashboard",
  },
  {
    title: "Transações",
    url: "/transactions",
    icon: ArrowLeftRight,
    tourId: "nav-transactions",
  },
  {
    title: "Categorias",
    url: "/categories",
    icon: Tag,
    tourId: "nav-categories",
  },
  {
    title: "Cartões",
    url: "/cards",
    icon: CreditCard,
    tourId: "nav-cards",
  },
  {
    title: "Orçamento",
    url: "/budget",
    icon: PiggyBank,
    tourId: "nav-budget",
  },
  {
    title: "Metas",
    url: "/goals",
    icon: Target,
    tourId: "nav-goals",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof ShadcnSidebar>) {
  const pathname = usePathname();

  return (
    <ShadcnSidebar collapsible="icon" {...props} data-tour="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <Image
                  src="/finplanix_name_icon.png"
                  alt="Finplanix"
                  width={200}
                  height={48}
                  className="h-12 w-auto"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = pathname === item.url || pathname?.startsWith(item.url + "/");
              return (
                <SidebarMenuItem key={item.url} data-tour={item.tourId}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </ShadcnSidebar>
  );
}
