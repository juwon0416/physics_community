import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight, Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/cn';
import { FIELDS, TIMELINE_TOPICS } from '../../data/seed';
import { LoginDialog } from '../auth/LoginDialog';
import { useTheme } from '../../lib/theme';

export function Navbar() {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const isGraphRoute = location.pathname === '/graph';
    const isTransparentNav = isHome || isGraphRoute;
    const { theme, toggleTheme } = useTheme();

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
        <nav className={cn(
            "sticky top-0 z-50 w-full transition-colors duration-300",
            isTransparentNav
                ? "bg-transparent border-transparent"
                : "border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        )}>
            <div className="container flex h-14 max-w-screen-2xl items-center px-4">
                <div className="mr-4 flex overflow-hidden">
                    <Link to="/" className="mr-6 flex items-center space-x-2 font-display font-bold text-lg hover:text-primary transition-colors flex-shrink-0">
                        <span className="inline-block">Ph.D</span>
                    </Link>
                    <div className="mr-6 flex items-center gap-2 text-sm">
                        <Link
                            to="/graph"
                            className={cn(
                                'inline-block flex-shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                                isGraphRoute
                                    ? 'border-foreground/20 bg-transparent text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground',
                            )}
                        >
                            Graph View
                        </Link>
                    </div>

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
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className={cn(
                            'inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium uppercase tracking-[0.14em] shadow-sm backdrop-blur transition',
                            isTransparentNav
                                ? 'border-transparent bg-transparent text-foreground/75 shadow-none hover:bg-foreground/5 hover:text-foreground'
                                : 'border-border/70 bg-card/70 text-muted-foreground hover:border-foreground/20 hover:text-foreground',
                        )}
                        aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
                        title={theme === 'light' ? 'Dark mode' : 'Light mode'}
                    >
                        {theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">{theme === 'light' ? 'Dark' : 'Light'}</span>
                    </button>
                    <LoginDialog
                        triggerClassName={cn(
                            isTransparentNav
                                ? 'border-transparent bg-transparent text-foreground/75 shadow-none hover:bg-foreground/5 hover:text-foreground'
                                : undefined,
                        )}
                    />
                </div>
            </div>
        </nav>
    );
}
