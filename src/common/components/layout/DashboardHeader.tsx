"use client";

import { useTheme } from "@/common/contexts/ThemeContext";
import { Moon, Sun, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/common/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface DashboardHeaderProps {
  userName: string;
  userEmail: string;
}

export function DashboardHeader({ userName, userEmail }: DashboardHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="size-9"
      >
        {theme === "dark" ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600">
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
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="cursor-pointer mt-1"
          >
            <LogOut className="size-4" />
            <span className="ml-2">Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
