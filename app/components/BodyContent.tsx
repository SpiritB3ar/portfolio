"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HomeDataType } from "./types/types";
import { useLanguage } from "../providers/LanguageProvider";
import { saveAs } from "file-saver";
import { Download, Sparkles, Loader2, ArrowUpRight, Bot } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { toast } from "sonner";
import { dispatchOpenChat } from "./assistant/chat-events";

interface ContentType {
  homeData: HomeDataType | null;
}

const BodyContent = ({ homeData }: ContentType) => {
  const userImage = homeData?.userImage || "";
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const [isDownloading, setIsDownloading] = useState(false);

  // Rotating ask suggestions (from the assistant's own suggestion list).
  const askOptions = t.assistant.suggestions.length > 0 ? t.assistant.suggestions : [t.home.askPlaceholder];
  const [askIndex, setAskIndex] = useState(0);
  useEffect(() => {
    if (askOptions.length < 2) return;
    const id = setInterval(() => setAskIndex((i) => (i + 1) % askOptions.length), 4000);
    return () => clearInterval(id);
  }, [askOptions.length]);

  const handleDownloadCV = async () => {
    if (!homeData?.cvFile) return;

    setIsDownloading(true);
    try {
      const response = await fetch(homeData.cvFile);
      if (!response.ok) throw new Error("Failed to fetch CV");
      const blob = await response.blob();
      const fileName = homeData.cvFile.split('/').pop() || 'CV.pdf';
      saveAs(blob, fileName);
      toast.success(t.common.downloadCV, { description: t.common.cvDownloadedDesc });
    } catch (error) {
      console.error("Error downloading CV:", error);
      toast.error(t.common.cvDownloadFailed, { description: t.common.cvDownloadErrorDesc });
    } finally {
      setIsDownloading(false);
    }
  };

  // Split the headline so the final word carries the mint accent.
  const headline = (homeData?.welcomeNote || "").trim();
  const parts = headline.split(/\s+/).filter(Boolean);
  const accentWord = parts.length > 1 ? parts.pop() : "";
  const leadWords = parts.join(" ");

  const stagger: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const rise: Variants = reduce
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.21, 0.6, 0.35, 1] } },
      };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="relative z-10 grid min-h-[calc(100dvh-9rem)] grid-cols-1 items-center gap-12 py-10 lg:grid-cols-12 lg:gap-10"
    >
      {/* ── Left: copy (≤4 text elements: headline, subtext, ask input, CV) ── */}
      <div className="flex flex-col gap-6 lg:col-span-7">
        {/* Headline */}
        <motion.h1
          variants={rise}
          className="font-poiret text-5xl font-bold leading-[0.95] tracking-tight text-foreground md:text-6xl lg:text-7xl"
        >
          {leadWords}
          {accentWord && (
            <>
              {" "}
              <span className="text-brand-medium dark:text-brand-green">
                {accentWord}
              </span>
            </>
          )}
        </motion.h1>

        {/* Description (gate: ≤20 palabras, el texto completo vive en /about) */}
        <motion.p
          variants={rise}
          className="max-w-xl line-clamp-2 text-lg leading-relaxed text-muted-foreground md:text-xl"
        >
          {homeData?.welcomeDescription}
        </motion.p>

        {/* Ask-first CTA: abre el asistente (el chat es la navegación) */}
        <motion.button
          variants={rise}
          type="button"
          onClick={() => dispatchOpenChat()}
          aria-label={t.home.askPlaceholder}
          className="focus-ring group flex w-full max-w-xl items-center gap-3 rounded-full border border-border bg-card/80 px-5 py-4 text-left shadow-sm transition-colors hover:border-brand-green"
        >
          <Sparkles size={16} className="shrink-0 text-brand-medium dark:text-brand-green" />
          <motion.span
            key={askIndex}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="min-w-0 flex-1 truncate text-sm text-muted-foreground transition-colors group-hover:text-foreground"
          >
            {askOptions[askIndex % askOptions.length]}
          </motion.span>
          <ArrowUpRight
            size={16}
            className="shrink-0 text-muted-foreground transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-medium dark:group-hover:text-brand-green"
          />
        </motion.button>

        {/* Secondary CTA: CV */}
        {homeData?.cvFile && (
          <motion.div variants={rise} className="flex">
            <button
              type="button"
              onClick={handleDownloadCV}
              disabled={isDownloading}
              aria-label={t.common.downloadCV}
              className="focus-ring group relative flex items-center gap-3 rounded-full bg-brand-green px-7 py-3.5 font-semibold text-white transition-colors duration-300 hover:bg-brand-medium disabled:cursor-not-allowed disabled:opacity-70 dark:text-background pressable active:scale-[0.98]"
            >
              {isDownloading ? (
                <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
              ) : (
                <Download className="relative z-10 h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              )}
              <span className="relative z-10">{isDownloading ? t.common.cvDownloading : t.common.downloadCV}</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Right: portrait, hairline frame ───────────────────── */}
      <motion.div variants={rise} className="relative lg:col-span-5">
        <div className="animate-float relative mx-auto aspect-[4/5] w-full max-w-sm">
          <div className="group relative h-full w-full overflow-hidden rounded-2xl border border-border">
            {userImage && (
              <Image
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 28rem"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                alt={homeData?.welcomeTitle || "profile"}
                src={userImage}
              />
            )}
                {/* Cinematic teal grade */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#03100E]/70 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-brand-dark/10 mix-blend-multiply dark:bg-brand-dark/20" />
            </div>
            {/* Floating AI badge */}
            <motion.div
                variants={rise}
                className="absolute -bottom-5 left-5 flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg"
            >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-green/15 text-brand-medium dark:text-brand-green">
                    <Bot size={18} />
                </span>
                <span>
                    <span className="block text-sm font-semibold text-foreground">{t.home.aiBadgeTitle}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">{t.home.aiBadgeSub}</span>
                </span>
            </motion.div>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default BodyContent;
