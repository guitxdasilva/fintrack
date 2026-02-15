"use client";

import { LogOut, Settings, HelpCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { ThemeToggle } from "@/common/components/ThemeToggle";
import { startTourManually } from "@/common/components/OnboardingTour";
import { getInitials } from "@/lib/utils";

interface DashboardHeaderProps {
  userName: string;
  userEmail: string;
}

export function DashboardHeader({ userName, userEmail }: DashboardHeaderProps) {
  return (
    <>
      <div data-tour="theme-toggle">
        <ThemeToggle className="size-9" />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button data-tour="user-menu" className="flex items-center gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600">
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg text-xs">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-56 rounded-lg"
          side="bottom"
          align="end"
          sideOffset={8}
        >
          <div className="flex items-center gap-2 p-2 border-b border-slate-200 dark:border-slate-700">
            <Avatar className="size-10 rounded-lg">
              <AvatarFallback className="rounded-lg">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{userName}</span>
              <span className="truncate text-xs text-slate-600 dark:text-slate-400">
                {userEmail}
              </span>
            </div>
          </div>
          <DropdownMenuItem asChild className="cursor-pointer mt-1">
            <Link href="/settings">
              <Settings className="size-4" />
              <span className="ml-2">Configurações</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={startTourManually}
            className="cursor-pointer"
          >
            <HelpCircle className="size-4" />
            <span className="ml-2">Tour Guiado</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="cursor-pointer"
          >
            <LogOut className="size-4" />
            <span className="ml-2">Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
