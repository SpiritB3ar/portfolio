"use client"
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./header";
import SiteAtmosphere from "./SiteAtmosphere";
import RecruiterChat from "./assistant/RecruiterChat";
import CommandPalette from "./assistant/CommandPalette";

interface MainLayoutProps {
  children: ReactNode;
}

function isAdminRoute(pathname: string) {
  return pathname.startsWith('/admin');
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const showHeader = !isAdminRoute(pathname);

  if (!showHeader) {
    return <>{children}</>;
  }

  return (
    <div className="overflow-hidden relative min-h-[100dvh] bg-background transition-colors duration-300">
      <SiteAtmosphere withWordmark={pathname === "/"} />

      <div className="fixed top-0 right-0 left-0 z-50">
        <Header active={pathname} onOpenPalette={() => setPaletteOpen(true)} />
      </div>

      <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="pt-24 md:pt-32">
          {children}
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpen={() => setPaletteOpen(true)}
        onClose={() => setPaletteOpen(false)}
      />
      <RecruiterChat />
    </div>
  );
}