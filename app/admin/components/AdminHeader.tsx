"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type AdminHeaderProps = {
  onMenuClick: () => void;
};

const routeNames: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/profile': 'Profile',
  '/admin/projects': 'Projects',
  '/admin/experiences': 'Experiences',
  '/admin/skill-categories': 'Skill Categories',
  '/admin/skills': 'Skills',
};

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  const pathname = usePathname();

  // Generate breadcrumbs
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    return {
      label: routeNames[path] || segment.charAt(0).toUpperCase() + segment.slice(1),
      path: path,
      isLast: index === pathSegments.length - 1
    };
  });

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-4">
        {/* Left: Menu button + Breadcrumbs */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  <BreadcrumbItem>
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.path}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!crumb.isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right: Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
