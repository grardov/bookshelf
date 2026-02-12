import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-svh">
      <AppSidebar />
      <MobileNav />
      <div className="flex min-h-svh flex-col md:pl-56">
        <div className="mx-auto w-full max-w-4xl flex-1 px-4 md:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
