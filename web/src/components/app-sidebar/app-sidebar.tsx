"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Library,
  ListMusic,
  Settings,
  LogOut,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const libraryItems = [
  { title: "Create", href: "/create", icon: Home },
  { title: "Collection", href: "/collection", icon: Library },
  { title: "Playlists", href: "/playlists", icon: ListMusic },
];

const userPlaylists = [
  { title: "Late Night Deep House", href: "/playlists/1", icon: List },
  { title: "Sunday Morning Jazz", href: "/playlists/2", icon: List },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.slice(0, 1).toUpperCase();
    }
    return "U";
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-[#2a2a2a] bg-[#0a0a0a] md:flex">
      {/* Logo */}
      <div className="px-6 pt-6 pb-8">
        <Link href="/create" className="font-heading text-xl font-bold italic text-white">
          Bookshelf.
        </Link>
      </div>

      {/* Library section */}
      <nav className="flex-1 overflow-y-auto px-3" aria-label="Main navigation">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-[#525252]">
          Library
        </p>
        <ul className="space-y-0.5">
          {libraryItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-[#141414] text-white"
                      : "text-[#9ca3af] hover:bg-[#141414] hover:text-white",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  <item.icon
                    className={cn("h-4 w-4 shrink-0", !isActive && "ml-[18px]")}
                    aria-hidden="true"
                  />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User playlists */}
        <p className="mb-2 mt-8 px-3 text-[11px] font-semibold uppercase tracking-widest text-[#525252]">
          Playlists
        </p>
        <ul className="space-y-0.5">
          {userPlaylists.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-[#141414] text-white"
                      : "text-[#9ca3af] hover:bg-[#141414] hover:text-white",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-[#2a2a2a] p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 text-[#9ca3af] hover:bg-[#141414] hover:text-white"
            >
              <Avatar className="h-6 w-6">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt="" />
                )}
                <AvatarFallback className="bg-[#2a2a2a] text-[10px] text-[#9ca3af]">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm">
                {profile?.display_name ?? profile?.email ?? "Loading..."}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
