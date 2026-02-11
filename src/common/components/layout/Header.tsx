"use client";

import { useTheme } from "@/common/contexts/ThemeContext";
import { Moon, Sun, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { SidebarTrigger } from "@/common/components/ui/sidebar";
import { Separator } from "@/common/components/ui/separator";
import { Button } from "@/common/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface HeaderProps {
  userName?: string;
  userEmail?: string;
}

export function Header({ userName = "Usuário", userEmail = "" }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4!" />

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="size-8"
      >
        {theme === "dark" ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative size-8 rounded-full">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{userName}</p>
              {userEmail && (
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="mr-2 size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
