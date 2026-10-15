"use client";
import Link from "next/link";
import { useLanguage } from "../providers/LanguageProvider";
import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/request-util";
import { LogoMark } from "./LogoMark";
import { iconMap } from "./SocialLink";
import { Globe } from "lucide-react";
import { SocialLinkType } from "./types/types";

export const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const { data: socialLinks } = useQuery<SocialLinkType[]>({
    queryKey: ["social-links"],
    queryFn: () => fetchJSON<SocialLinkType[]>("/api/user-social-links"),
    staleTime: 5 * 60 * 1000,
  });

  const footerSocials = (socialLinks ?? []).filter((s) => iconMap[s.icon]);

  return (
    <footer className="relative z-10 bg-background border-t border-border">
      <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br rounded-lg from-brand-green to-brand-medium">
                <LogoMark className="w-[18px] h-[18px] text-white" />
              </div>
              <span className="text-lg font-bold text-foreground font-poiret">
                dran<span className="text-brand-medium dark:text-brand-green">zr</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.footer.tagline}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="mb-4 text-sm font-semibold tracking-wider text-foreground uppercase">
              {t.footer.quickLinks}
            </h2>
            <ul className="space-y-2">
              {[
                { name: t.nav.home, href: "/" },
                { name: t.nav.about, href: "/about" },
                { name: t.nav.experience, href: "/experience" },
                { name: t.nav.projects, href: "/projects" },
                { name: t.nav.ai, href: "/ai" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-brand-medium dark:hover:text-brand-green"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          {footerSocials.length > 0 && (
            <div>
              <h2 className="mb-4 text-sm font-semibold tracking-wider text-foreground uppercase">
                {t.footer.connect}
              </h2>
              <div className="flex gap-3">
                {footerSocials.map((item) => {
                  const Icon = iconMap[item.icon] || Globe;
                  const isExternal = item.link.startsWith("http");
                  return (
                    <a
                      key={item.name}
                      href={item.link}
                      target={isExternal ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      aria-label={item.name}
                      className="flex justify-center items-center w-10 h-10 text-muted-foreground bg-muted rounded-xl transition-colors hover:bg-brand-green hover:text-white focus-ring pressable active:scale-90"
                    >
                      <Icon className="w-5 h-5" size={20} />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col gap-4 justify-between items-center md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {currentYear} dranzr. {t.footer.rights}
            </p>
            <p className="text-sm text-muted-foreground">
              {t.footer.madeWith} <span className="text-brand-medium dark:text-brand-green">♥</span> {t.footer.usingNext}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
