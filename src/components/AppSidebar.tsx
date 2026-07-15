"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Settings,
  LogOut,
  BookMarked,
  ChevronDown,
  Sparkles,
  Zap,
  X,
} from "lucide-react";
import { logoutUser } from "@/services/auth/logoutUser";
import { toast } from "sonner";
import type { UserInfo } from "@/types";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  superAdminOnly?: boolean;
  description?: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    title: "Templates",
    href: "/templates",
    icon: BookMarked,
    superAdminOnly: false,
    description: "Book template editor",
  },
  {
    title: "Orders",
    href: "/orders/new",
    icon: BookOpen,
    superAdminOnly: false,
    description: "Create PDF orders",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    superAdminOnly: true,
    description: "System configuration",
  },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PRODUCTION_ADMIN: "Production Admin",
  VIEWER: "Viewer",
};

export function AppSidebar({ user }: { user: UserInfo | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out successfully.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || user?.role === "SUPER_ADMIN",
  );

  return (
    <>
      <Sidebar
        collapsible="icon"
        variant="sidebar"
        className="border-r bg-sidebar text-sidebar-foreground  z-50"
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <SidebarHeader className="px-4 py-2 relative">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/0 active:bg-sidebar-accent rounded-xl transition-all duration-200">
                <Link href="/templates">
                  {/* Logo mark */}
                  <div className="relative flex aspect-square size-7 items-center justify-center rounded-lg bg-primary shadow-glow-sm shrink-0 overflow-hidden">
                    <BookOpen className="size-4 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/10" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                    <span className="truncate font-extrabold text-lg tracking-tight text-foreground uppercase">
                      StoryBook
                    </span>
                    {/* <span className="truncate text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider font-bold">
                      <Zap className="w-2.5 h-2.5 text-primary" />
                      AI Production
                    </span> */}
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          {isMobile && (
            <button
              onClick={() => setOpenMobile(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </SidebarHeader>

        <div className="px-4">
          <div className="h-px w-full bg-sidebar-border/30" />
        </div>

        {/* ── Navigation ──────────────────────────────────────── */}
        <SidebarContent className="px-3 py-2">
          <SidebarGroup>
            <SidebarGroupLabel className="section-label mb-2 px-3">
              Platform
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "relative h-11 rounded-xl transition-all duration-300 overflow-hidden group",
                          isActive
                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                        )}
                      >
                        <Link
                          href={item.href}
                          onClick={() => isMobile && setOpenMobile(false)}
                        >
                          {/* Active indicator line */}
                          {/* {isActive && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-glow-sm" />
                          )} */}

                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-300",
                            isActive ? "bg-primary text-primary-foreground shadow-glow-sm" : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <span className={cn(
                            "font-medium text-sm ml-1 transition-colors",
                            isActive ? "text-primary font-bold" : ""
                          )}>
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <div className="mt-auto" />

        {/* ── AI Status indicator ─────────────────────────── */}


        {/* ── Footer ──────────────────────────────────────────── */}
        <SidebarFooter className="p-4 border-border/50">
          {user && (
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="h-auto py-2 px-2 rounded-xl hover:bg-muted/60 data-[state=open]:bg-muted/60 transition-all duration-200"
                    >
                      <Avatar className="h-9 w-9 rounded-xl shrink-0 border border-border">
                        <AvatarFallback className="rounded-xl bg-primary/20 text-primary text-xs font-bold">
                          {user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight min-w-0 ml-1">
                        <span className="truncate font-bold text-foreground text-xs">
                          {user.email}
                        </span>
                        <span className="truncate text-[10px] font-bold mt-0.5 text-primary uppercase tracking-wider">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </div>
                      <ChevronDown className="ml-auto size-4 text-muted-foreground shrink-0" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 rounded-xl border-border bg-white shadow-dropdown mb-2 ml-2"
                    side="right"
                    align="end"
                    sideOffset={4}
                  >
                    <div className="px-3 py-3 border-b border-border">
                      <p className="text-xs font-medium text-foreground truncate">
                        {user.email}
                      </p>
                      <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary mt-2">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </div>
                    <div className="p-1.5">
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg py-2"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span className="font-medium">Sign Out</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    </>

  );
}
