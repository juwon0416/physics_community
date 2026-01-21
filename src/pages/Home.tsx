import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Atom, BarChart3, ArrowRight, Zap } from 'lucide-react';
import { FIELDS } from '../data/seed';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui';

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
        <div className="container px-4 py-12 max-w-screen-2xl mx-auto relative z-10">
            <div className="mb-16 text-center space-y-6">
                <h1 className="text-5xl font-display font-bold tracking-tight md:text-7xl text-foreground">
                    Explore the Universe
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif italic">
                    "The eternal mystery of the world is its comprehensibility."
                </p>
                <div className="w-24 h-1 bg-foreground mx-auto mt-8 opacity-20"></div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
                {FIELDS.map((field, index) => (
                    <motion.div
                        key={field.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.15 }}
                    >
                        <Link to={`/field/${field.slug}`}>
                            <Card className="h-full relative overflow-hidden group transition-all duration-300 border-2 hover:border-foreground/80 bg-card hover:shadow-lg">
                                {/* Background Image (Monochrome / Sepia) */}
                                {field.image && (
                                    <div
                                        className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-700 grayscale sepia"
                                        style={{ backgroundImage: `url(${field.image})` }}
                                    />
                                )}

                                <CardHeader className="relative z-10 pb-2">
                                    <div className="text-foreground transition-transform duration-300 group-hover:scale-110 origin-left">
                                        {iconMap[field.icon]}
                                    </div>
                                    <CardTitle className="text-3xl font-display text-foreground">{field.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <CardDescription className="text-lg font-serif italic text-muted-foreground mb-8 leading-relaxed">
                                        {field.description}
                                    </CardDescription>
                                    <div className="absolute bottom-6 left-6 right-6 flex items-center text-foreground font-bold group-hover:gap-2 transition-all">
                                        Explore Timeline <ArrowRight className="ml-2 h-4 w-4" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
