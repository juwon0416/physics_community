import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <div className={isHome ? 'relative flex min-h-screen flex-col overflow-hidden bg-background font-sans text-foreground' : 'relative flex min-h-screen flex-col bg-background font-sans text-foreground'}>
            <Navbar />
            <main className={isHome ? 'flex-1 overflow-hidden' : 'flex-1'}>
                <Outlet />
            </main>
            {!isHome && (
                <footer className="py-6 md:px-8 md:py-0">
                    <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row max-w-screen-2xl px-4 text-sm text-muted-foreground">
                        <p>짤 2026 Physics Community. Built with React & Tailwind.</p>
                    </div>
                </footer>
            )}
        </div>
    );
}
