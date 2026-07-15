import { getUserInfo } from "@/services/auth/getUserInfo";
import { AppSidebar } from "@/components/AppSidebar";
import { TokenInitializer } from "@/components/shared/TokenInitializer";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserInfo();

  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar user={user} />

        <SidebarInset className="flex w-full flex-col min-w-0 transition-all duration-300 ease-in-out">
          {/* ── Header ──────────────────────────────────────── */}
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 px-4 sm:px-6 border-b border-border/30 bg-white/80 backdrop-blur-xl">
            <SidebarTrigger className="shrink-0 -ml-2 p-2 w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors" />

            <div className="h-5 w-px bg-border hidden sm:block" />

            {/* Breadcrumb / Title placeholder */}
            <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
              {/* This can be a breadcrumb later. For now, empty space that flexes */}
            </div>

            {/* Right side controls & user info */}
            {user && (
              <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                {/* Role chip */}
                <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-primary">
                    {user.role === "SUPER_ADMIN" ? "Super Admin" : "Production Admin"}
                  </span>
                </div>

                {/* Live status dot */}
                {/* <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 border border-border/80 rounded-full px-2.5 py-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                  <span className="hidden md:block">Powered By Obidy Hasan</span>
                </div> */}
              </div>
            )}
          </header>

          {/* ── Main Content ──────────────────────────────────── */}
          <TokenInitializer>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
              <div className="mx-auto w-full animate-fade-in">
                {children}
              </div>
            </main>
          </TokenInitializer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
