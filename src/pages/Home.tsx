import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Atom, BarChart3, Zap } from 'lucide-react';
import { FIELDS } from '../data/seed';
import { Card, CardTitle } from '../components/ui';

// Custom Motion Trail Icon for Classical Mechanics
const MotionBallIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="20" cy="12" r="3" />
        <path d="M2 12h13" strokeDasharray="4 4" />
        <path d="M5 8h8" opacity="0.5" strokeDasharray="2 2" />
        <path d="M5 16h8" opacity="0.5" strokeDasharray="2 2" />
    </svg>
);

const iconMap: Record<string, React.ReactNode> = {
    'activity': <MotionBallIcon className="h-10 w-10 mb-4" />, // Custom for Classical Mechanics
    'atom': <Atom className="h-10 w-10 mb-4" />,
    'bar-chart-3': <BarChart3 className="h-10 w-10 mb-4" />,
    'zap': <Zap className="h-10 w-10 mb-4" />,
};

export function Home() {
    return (
        <div className="container px-4 py-12 max-w-screen-2xl mx-auto relative z-10 flex flex-col items-center">

            <div className="text-center space-y-4 mb-16 relative z-10">
                <h1 className="text-5xl font-display font-bold tracking-tight md:text-7xl text-foreground">
                    Explore the Universe
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif italic">
                    "The eternal mystery of the world is its comprehensibility."
                </p>
                <div className="w-24 h-1 bg-foreground mx-auto mt-6 opacity-20"></div>
            </div>

            {/* Restructured Horizontal Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 w-full max-w-7xl">
                {FIELDS.map((field, index) => (
                    <motion.div
                        key={field.id}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="w-full h-full"
                    >
                        <Link to={`/field/${field.slug}`} className="block w-full h-full">
                            <Card className="w-full h-full min-h-[160px] relative overflow-hidden group transition-all duration-300 border border-border/50 hover:border-foreground/50 hover:shadow-lg hover:-translate-y-1 bg-card flex flex-col justify-center items-center text-center p-6">

                                {/* Subtle hover highlight */}
                                <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                <div className="relative z-10 transition-transform duration-300 group-hover:scale-110 mb-4 text-muted-foreground group-hover:text-foreground">
                                    {iconMap[field.icon]}
                                </div>
                                <div className="relative z-10">
                                    <CardTitle className="text-lg md:text-xl font-display font-bold text-foreground leading-tight">
                                        {field.name}
                                    </CardTitle>
                                </div>

                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
