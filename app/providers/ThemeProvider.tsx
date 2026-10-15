"use client"
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark');
    // Subscription-based mount flag: no setState-in-effect, no hydration
    // mismatch (server snapshot is `false` during SSR/hydration).
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    // Intentional client-only store sync: localStorage/matchMedia don't exist
    // on the server, and reading them during render would cause a hydration
    // mismatch. The blocking theme script in <head> already painted the right
    // class, so this just aligns React state after hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        // Check localStorage or system preference
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initialTheme = prefersDark ? 'dark' : 'light';
            setTheme(initialTheme);
            document.documentElement.classList.toggle('dark', prefersDark);
        }
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
