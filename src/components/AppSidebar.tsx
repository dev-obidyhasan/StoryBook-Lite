"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Settings,
  LogOut,
  BookMarked,
  ChevronDown,
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
};

const NAV_ITEMS: NavItem[] = [
  {
    title: "Templates",
    href: "/templates",
    icon: BookMarked,
    superAdminOnly: false,
  },
  {
    title: "Orders",
    href: "/orders/new",
    icon: BookOpen,
    superAdminOnly: false,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    superAdminOnly: true,
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
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader
        className={cn(
          "relative",
          isCollapsed ? "items-center px-0 py-2" : "px-2 py-2",
        )}
      >
        <SidebarMenu>
          <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="StoryBook"
              className={cn(
                "rounded-xl hover:bg-sidebar-accent/0 active:bg-sidebar-accent",
                isCollapsed && "size-8! p-0! justify-center",
              )}
            >
              <Link href="/templates">
                <div
                  className={cn(
                    "flex aspect-square shrink-0 items-center justify-center rounded-lg bg-primary shadow-glow-sm overflow-hidden",
                    isCollapsed ? "size-8" : "size-7",
                  )}
                >
                  <BookOpen className="size-4 text-white" />
                </div>
                {!isCollapsed && (
                  <span className="truncate font-extrabold text-lg tracking-tight text-foreground uppercase">
                    StoryBook
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {isMobile && (
          <button
            type="button"
            onClick={() => setOpenMobile(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="size-5" />
          </button>
        )}
      </SidebarHeader>

      {!isCollapsed && (
        <div className="px-4">
          <div className="h-px w-full bg-sidebar-border/30" />
        </div>
      )}

      <SidebarContent className={cn(isCollapsed ? "px-1 py-2" : "px-3 py-2")}>
        <SidebarGroup className={cn(isCollapsed && "p-0")}>
          {!isCollapsed && (
            <SidebarGroupLabel className="section-label mb-2 px-3">
              Platform
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu
              className={cn("gap-1.5", isCollapsed && "items-center gap-2")}
            >
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <SidebarMenuItem
                    key={item.href}
                    className={cn(isCollapsed && "flex justify-center w-full")}
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "rounded-xl transition-all duration-200",
                        isCollapsed ? "size-8! p-0! justify-center" : "h-11",
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                      )}
                    >
                      <Link
                        href={item.href}
                        onClick={() => isMobile && setOpenMobile(false)}
                      >
                        {isCollapsed ? (
                          <Icon
                            className={cn(
                              "size-4 shrink-0",
                              isActive && "text-primary",
                            )}
                          />
                        ) : (
                          <>
                            <div
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-glow-sm"
                                  : "bg-muted/50 text-muted-foreground group-hover/menu-item:bg-muted group-hover/menu-item:text-foreground",
                              )}
                            >
                              <Icon className="size-4" />
                            </div>
                            <span
                              className={cn(
                                "ml-1 font-medium text-sm",
                                isActive && "font-bold text-primary",
                              )}
                            >
                              {item.title}
                            </span>
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter
        className={cn(
          "border-border/50",
          isCollapsed ? "items-center p-1" : "p-4",
        )}
      >
        {user && (
          <SidebarMenu>
            <SidebarMenuItem
              className={cn(isCollapsed && "flex justify-center w-full")}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={user.email}
                    className={cn(
                      "rounded-xl hover:bg-muted/60 data-[state=open]:bg-muted/60 transition-all duration-200",
                      isCollapsed
                        ? "size-8! p-0! justify-center"
                        : "h-auto px-2 py-2",
                    )}
                  >
                    <Avatar
                      className={cn(
                        "shrink-0 rounded-xl border border-border",
                        isCollapsed ? "size-8" : "size-9",
                      )}
                    >
                      <AvatarFallback className="rounded-xl bg-primary/20 text-primary text-xs font-bold">
                        {user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                      <>
                        <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                          <span className="truncate text-xs font-bold text-foreground">
                            {user.email}
                          </span>
                          <span className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-primary">
                            {ROLE_LABELS[user.role] ?? user.role}
                          </span>
                        </div>
                        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
                      </>
                    )}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="mb-2 ml-2 w-56 rounded-xl border-border bg-white shadow-dropdown"
                  side="right"
                  align="end"
                  sideOffset={4}
                >
                  <div className="border-b border-border px-3 py-3">
                    <p className="truncate text-xs font-medium text-foreground">
                      {user.email}
                    </p>
                    <span className="mt-2 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </div>
                  <div className="p-1.5">
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg py-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 size-4" />
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
  );
}
