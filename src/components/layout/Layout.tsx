import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
    return (
        <div className="relative flex min-h-screen flex-col bg-background font-sans text-foreground">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <footer className="py-6 md:px-8 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row max-w-screen-2xl px-4 text-sm text-muted-foreground">
                    <p>© 2026 Physics Community. Built with React & Tailwind.</p>
                </div>
            </footer>
        </div>
    );
}
