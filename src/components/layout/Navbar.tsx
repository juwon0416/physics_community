import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Home, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { FIELDS, TIMELINE_TOPICS } from '../../data/seed';
import { LoginDialog } from '../auth/LoginDialog';

export function Navbar() {
    const [isDark, setIsDark] = useState(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            return true;
        }
        return false;
    });

    const location = useLocation();

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    // Breadcrumb Logic
    const pathnames = location.pathname.split('/').filter((x) => x);

    const getBreadcrumbs = () => {
        if (pathnames.length === 0) return [];

        const crumbs = [];

        // Field Page
        if (pathnames[0] === 'field' && pathnames[1]) {
            const field = FIELDS.find(f => f.slug === pathnames[1]);
            if (field) {
                crumbs.push({ name: field.name, path: `/field/${field.slug}` });
            }
        }

        // Topic Page
        if (pathnames[0] === 'topic' && pathnames[1]) {
            const topic = TIMELINE_TOPICS.find(t => t.slug === pathnames[1]);
            if (topic) {
                const field = FIELDS.find(f => f.id === topic.fieldId);
                if (field) {
                    crumbs.push({ name: field.name, path: `/field/${field.slug}` });
                }
                crumbs.push({ name: topic.title, path: `/topic/${topic.slug}` });
            }
        }

        return crumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center px-4">
                <div className="mr-4 flex overflow-hidden">
                    <Link to="/" className="mr-6 flex items-center space-x-2 font-display font-bold text-lg hover:text-primary transition-colors flex-shrink-0">
                        <span className="inline-block">PhysComm</span>
                    </Link>
                    <Link to="/graph" className="mr-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:inline-block flex-shrink-0">
                        Graph View
                    </Link>

                    <div className="flex items-center space-x-2 text-sm text-muted-foreground overflow-hidden whitespace-nowrap mask-linear-fade">
                        <Link to="/" className="hover:text-foreground transition-colors flex-shrink-0">
                            <Home className="h-4 w-4" />
                        </Link>
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.path}>
                                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                <Link
                                    to={crumb.path}
                                    className={cn(
                                        "hover:text-foreground transition-colors overflow-hidden text-ellipsis",
                                        index === breadcrumbs.length - 1 ? "text-foreground font-medium flex-shrink-0 max-w-[120px]" : "hidden sm:inline-block max-w-[80px]"
                                    )}
                                >
                                    {crumb.name}
                                </Link>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-2">
                    <LoginDialog />
                    <button
                        onClick={toggleTheme}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9"
                    >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        <span className="sr-only">Toggle theme</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
