"use client";
import { motion } from 'framer-motion';
import { useMountedReducedMotion } from "@/app/lib/use-mounted-reduced-motion";
import { useLanguage } from '../providers/LanguageProvider';

export const AiHow = () => {
    const { t } = useLanguage();
    const reduce = useMountedReducedMotion();

    return (
        <motion.section
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
            className="mb-14 sm:mb-16"
        >
            <h2 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">{t.ai.howTitle}</h2>
            <div className="divide-y divide-border border-y border-border">
                {t.ai.how.map((item, index) => (
                    <motion.div
                        key={item.title}
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.4, delay: index * 0.06, ease: [0.21, 0.6, 0.35, 1] }}
                        className="grid grid-cols-1 gap-1 py-5 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-6"
                    >
                        <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                            {item.text}
                        </p>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
};
