"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListMusic, Settings, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
  { title: "Home", href: "/", icon: Home },
  { title: "Playlists", href: "/playlists", icon: ListMusic },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 md:hidden">
      <Link href="/" className="font-heading text-lg font-bold italic text-white">
        Bookshelf.
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-[#9ca3af]">
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 border-[#2a2a2a] bg-[#0a0a0a] p-0"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="px-6 pt-6 pb-4">
            <span className="font-heading text-xl font-bold italic text-white">
              Bookshelf.
            </span>
          </div>
          <nav className="px-3" aria-label="Mobile navigation">
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
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
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
