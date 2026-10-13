"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Download, ArrowUpRight } from "lucide-react";
import { HomeDataType, SocialLinkType } from "../types/types";
import SocialLink from "../SocialLink";
import { useLanguage } from "../../providers/LanguageProvider";

interface ContactCTAProps {
  homeData: HomeDataType | null;
  socialLinks: SocialLinkType[];
}

export const ContactCTA = ({ homeData, socialLinks }: ContactCTAProps) => {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const cvFile = homeData?.cvFile;

  return (
    <section className="relative z-10 py-24 md:py-32">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 32 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.21, 0.6, 0.35, 1] }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card px-8 py-16 text-center md:px-16 md:py-24"
      >
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-poiret text-4xl font-bold leading-[1] tracking-tight text-foreground md:text-5xl">
            {t.home.ctaTitle}
          </h2>

          <p className="mx-auto mt-6 max-w-md text-base text-muted-foreground md:text-lg">
            {t.home.ctaSubtitle}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {cvFile && (
              <a
                href={cvFile}
                target="_blank"
                rel="noreferrer"
                className="focus-ring group flex items-center gap-3 rounded-full bg-brand-green px-7 py-3.5 font-semibold text-white transition-colors duration-300 hover:bg-brand-medium dark:text-background"
              >
                <span>{t.common.downloadCV}</span>
                <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </a>
            )}
            <a
              href="mailto:cardenascode7@outlook.com"
              className="focus-ring group flex items-center gap-2 rounded-full border border-border px-6 py-3.5 font-medium text-foreground transition-colors hover:border-brand-green hover:text-brand-medium dark:hover:text-brand-green"
            >
              <span>{t.about.sendEmail}</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>

          {socialLinks?.length > 0 && (
            <div className="mt-12 flex items-center justify-center gap-3">
              {socialLinks.map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -3 }}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:border-brand-green/50 focus-within:ring-2 focus-within:ring-brand-green"
                >
                  <SocialLink item={item} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
};
