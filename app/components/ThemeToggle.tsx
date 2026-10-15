"use client"
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useLanguage } from "../providers/LanguageProvider";
import { useTheme } from "../providers/ThemeProvider";

export const ThemeToggle = () => {
    const { theme, toggleTheme, mounted } = useTheme();
    const { t } = useLanguage();

    if (!mounted) {
        return <div className="w-12 h-12" />; // Placeholder to prevent layout shift
    }

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="relative w-9 h-9 rounded-full bg-card/70 border border-border shadow-sm hover:shadow-md transition-[box-shadow,border-color,background-color] duration-200 flex items-center justify-center group focus-ring"
            aria-label={t.common.toggleTheme}
        >
            <div className="relative w-5 h-5">
                <motion.div
                    initial={false}
                    animate={{
                        scale: theme === 'light' ? 1 : 0,
                        rotate: theme === 'light' ? 0 : 180,
                        opacity: theme === 'light' ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                >
                    <Sun className="w-5 h-5 text-foreground" />
                </motion.div>
                <motion.div
                    initial={false}
                    animate={{
                        scale: theme === 'dark' ? 1 : 0,
                        rotate: theme === 'dark' ? 0 : -180,
                        opacity: theme === 'dark' ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                >
                    <Moon className="w-5 h-5 text-foreground" />
                </motion.div>
            </div>
        </motion.button>
    );
};
