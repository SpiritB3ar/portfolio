"use client"
import Link from "next/link"
import { MenuClose, MenuOpen } from "./svgs"
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "../providers/LanguageProvider";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { LogoMark } from "./LogoMark";

type HeaderProps = { active: string; onOpenPalette: () => void };

const Header: React.FC<HeaderProps> = ({ active, onOpenPalette }) => {
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [scrolled, setScrolled] = useState(false);
    const [isMac, setIsMac] = useState(true);
    const { t } = useLanguage();
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 20);
    });

    useEffect(() => {
        setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent));
    }, []);

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [menuOpen]);

    // Navegación principal: solo dos entradas (el resto vive en el drawer y el footer)
    const primaryItems = [
        { name: t.nav.work, linkTo: "/projects" },
        { name: t.nav.about, linkTo: "/about" }
    ]

    // Drawer móvil: sitemap completo
    const menuItems = [
        { name: t.nav.home, linkTo: "/" },
        { name: t.nav.about, linkTo: "/about" },
        { name: t.nav.experience, linkTo: "/experience" },
        { name: t.nav.projects, linkTo: "/projects" },
        { name: t.nav.blogs, linkTo: "/blogs" },
        { name: t.nav.resources, linkTo: "/resources" }
    ]

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="fixed top-0 right-0 left-0 z-50 px-4 mx-auto mt-6 w-full max-w-4xl"
            >
                <div className={`
                    flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300
                    border-border bg-card/80 dark:bg-card/50
                    border shadow-lg shadow-black/5
                    ${scrolled ? 'shadow-xl shadow-black/10' : ''}`}>
                    {/* Logo */}
                    <div className="flex-shrink-0 pl-1">
                        <Logo compact />
                    </div>

                    {/* Desktop Navigation (slim) */}
                    <div className="hidden gap-1 items-center px-4 md:flex flex-1 justify-center">
                        {primaryItems.map((item, index) => (
                            <MenuItem
                                key={index}
                                {...item}
                                active={active}
                            />
                        ))}
                    </div>

                    {/* Right Section: ⌘K + Theme + Language + Menu */}
                    <div className="flex gap-1.5 items-center ml-auto md:ml-0 pr-1">
                        <button
                            type="button"
                            onClick={onOpenPalette}
                            className="flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-ring"
                        >
                            <Search size={13} />
                            <span className="hidden lg:inline">{t.palette.title}</span>
                            <kbd className="rounded border border-border px-1 py-px font-mono text-[10px]">
                                {isMac ? "⌘K" : "Ctrl K"}
                            </kbd>
                        </button>
                        <div className="hidden md:block">
                            <ThemeToggle />
                        </div>
                        <LanguageSwitcher />

                        {/* Mobile Menu Button */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMenuOpen(!menuOpen)}
                            className={`
                                md:hidden p-2 rounded-full transition-colors focus-ring
                                ${menuOpen
                                    ? 'text-foreground hover:bg-muted'
                                    : 'text-foreground hover:bg-muted'
                                }
                            `}
                            aria-label={t.nav.toggleMenu}
                        >
                            {menuOpen ? <MenuClose /> : <MenuOpen />}
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 md:hidden"
                        onClick={() => setMenuOpen(false)}
                    >
                        <div className="absolute inset-0 bg-black/50" />

                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] border-l border-border bg-background shadow-2xl"
                            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                        >
                            <div className="flex flex-col h-full">
                                {/* Mobile Menu Header */}
                                <div className="flex justify-between items-center p-6 border-b border-border">
                                    <Logo compact={false} />
                                    <button
                                        onClick={() => setMenuOpen(false)}
                                        className="p-2 rounded-lg transition-colors text-foreground hover:bg-muted focus-ring"
                                    >
                                        <MenuClose />
                                    </button>
                                </div>

                                {/* Mobile Menu Items */}
                                <nav className="flex-1 px-6 py-8">
                                    <div className="space-y-2">
                                        {menuItems.map((item, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 * index }}
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                <MenuItem {...item} active={active} isMobile />
                                            </motion.div>
                                        ))}
                                    </div>
                                </nav>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default Header

export const Logo = ({ compact }: { compact?: boolean }) => (
    <Link href="/" aria-label="dranzr — home" className="flex gap-2 items-center group focus-ring rounded-xl">
        <div className="flex justify-center items-center w-9 h-9 bg-brand-green rounded-xl transition-transform duration-300 group-hover:scale-105">
            <LogoMark className="w-5 h-5 text-white dark:text-background" />
        </div>
        {!compact && (
            <div className="text-lg font-bold tracking-wide text-foreground font-poiret">
                dran<span className="text-brand-green">zr</span>
            </div>
        )}
    </Link>
)

export const MenuItem = ({ name, linkTo, active, isMobile }: { name: string, linkTo: string, active: string, isMobile?: boolean }) => {
    const isActive = linkTo === active;

    if (isMobile) {
        return (
            <Link
                href={linkTo}
                className={`
                    block px-4 py-3 rounded-xl text-base font-semibold transition-all focus-ring
                    ${isActive
                        ? 'bg-muted text-brand-medium dark:text-brand-green'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                `}
            >
                {name}
            </Link>
        )
    }

    return (
        <Link
            href={linkTo}
            className={`
                relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-full focus-ring
                ${isActive
                    ? 'text-white dark:text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }
            `}
        >
            {isActive && (
                <motion.span
                    layoutId="activeTab"
                    className="absolute inset-0 z-0 bg-brand-green rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
            )}
            <span className="relative z-10">{name}</span>
        </Link>
    )
}
