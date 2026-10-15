"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Share2,
  UserRound,
  Briefcase,
  FolderKanban,
  FolderTree,
  Lightbulb,
  GraduationCap,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, description: "Overview & Statistics" },
  { href: "/admin/profile", label: "Profile", icon: User, description: "Edit your information" },
  { href: "/admin/social-links", label: "Social Links", icon: Share2, description: "Footer & contact links" },
  { href: "/admin/about", label: "About", icon: UserRound, description: "About page paragraphs" },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban, description: "Manage portfolio projects" },
  { href: "/admin/experiences", label: "Experiences", icon: Briefcase, description: "Work history" },
  { href: "/admin/educations", label: "Education", icon: GraduationCap, description: "Academic background" },
  { href: "/admin/skill-categories", label: "Skill Categories", icon: FolderTree, description: "Organize skills" },
  { href: "/admin/skills", label: "Skills", icon: Lightbulb, description: "Technical skills" },
];

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5">
        <Link href="/" className="flex items-center gap-3 group" onClick={onNavigate}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green to-brand-medium">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground group-hover:text-brand-green transition-colors">
              Admin
            </h2>
            <p className="text-xs text-muted-foreground">Portfolio CMS</p>
          </div>
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-3 transition-all group",
                  isActive
                    ? "bg-gradient-to-r from-brand-green/10 to-brand-medium/10 text-brand-green"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all",
                    isActive
                      ? "bg-gradient-to-br from-brand-green to-brand-medium text-white shadow-lg shadow-brand-green/30"
                      : "bg-muted text-muted-foreground group-hover:bg-brand-green/10 group-hover:text-brand-green"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isActive
                        ? "text-brand-green"
                        : "text-foreground group-hover:text-brand-green"
                    )}
                  >
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <Separator />
      <div className="px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-green transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Portfolio
        </Link>
      </div>
    </>
  );
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col border-r bg-background">
        <SidebarNav pathname={pathname} />
      </aside>

      {/* Mobile Sidebar via Sheet */}
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav pathname={pathname} onNavigate={onClose} />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AdminSidebar;
