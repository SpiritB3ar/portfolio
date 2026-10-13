"use client"
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./header";
import SiteAtmosphere from "./SiteAtmosphere";
import RecruiterChat from "./assistant/RecruiterChat";

interface MainLayoutProps {
  children: ReactNode;
}

function isAdminRoute(pathname: string) {
  return pathname.startsWith('/admin');
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [activeRoute, setActiveRoute] = useState("/");
  const [isDark, setIsDark] = useState(false);

  const showHeader = !isAdminRoute(pathname);

  useEffect(() => {
    setActiveRoute(pathname);
  }, [pathname]);

  // Detect current theme based on document class
  useEffect(() => {
    const updateTheme = () => {
      const isDarkTheme = document.documentElement.classList.contains('dark');
      setIsDark(isDarkTheme);
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  if (!showHeader) {
    return <>{children}</>;
  }

  return (
    <div className="overflow-hidden relative min-h-screen bg-[#FBF6EA] transition-colors duration-300 dark:bg-[#03100E]">
      <SiteAtmosphere withWordmark={pathname === "/"} />

      <div className="fixed top-0 right-0 left-0 z-50">
        <Header active={activeRoute} isDark={isDark} />
      </div>

      <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="pt-24 md:pt-32">
          {children}
        </div>
      </div>

      <RecruiterChat />
    </div>
  );
}