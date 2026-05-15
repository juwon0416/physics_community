import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

type ThemeContextValue = {
    theme: ThemeMode;
    isLight: boolean;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
};

const THEME_STORAGE_KEY = 'physics-archive-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'dark';
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>(readInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.classList.toggle('light', theme === 'light');
        document.documentElement.classList.toggle('dark', theme === 'dark');
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const value = useMemo<ThemeContextValue>(
        () => ({
            theme,
            isLight: theme === 'light',
            setTheme: setThemeState,
            toggleTheme: () => setThemeState((current) => (current === 'light' ? 'dark' : 'light')),
        }),
        [theme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
