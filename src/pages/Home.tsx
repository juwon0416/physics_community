import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Atom, BarChart3, Zap } from 'lucide-react';
import { FIELDS } from '../data/seed';
import { Card, CardTitle } from '../components/ui';
import EntropyHero from '../components/ui/EntropyHero';

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
        <div className="relative w-full bg-[#020205]">
            {/* Entropy Animation Section */}
            <EntropyHero />

            {/* Main Content Section - Appears after the scroll experience */}
            <div className="container px-4 py-24 max-w-screen-2xl mx-auto relative z-10 flex flex-col items-center">

                <div className="text-center space-y-4 mb-16 relative z-10">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl font-display font-bold tracking-tight md:text-7xl text-white"
                    >
                        Explore the Universe
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-white/60 max-w-2xl mx-auto font-serif italic"
                    >
                        "The eternal mystery of the world is its comprehensibility."
                    </motion.p>
                    <div className="w-24 h-1 bg-blue-500 mx-auto mt-6 opacity-50"></div>
                </div>

                {/* Restructured Horizontal Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 w-full max-w-7xl">
                    {FIELDS.map((field, index) => (
                        <motion.div
                            key={field.id}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="w-full h-full"
                        >
                            <Link to={`/field/${field.slug}`} className="block w-full h-full">
                                <Card className="w-full h-full min-h-[160px] relative overflow-hidden group transition-all duration-300 border border-white/10 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] bg-white/5 backdrop-blur-md flex flex-col justify-center items-center text-center p-6">

                                    {/* Subtle hover highlight */}
                                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                    <div className="relative z-10 transition-transform duration-300 group-hover:scale-110 mb-4 text-white/40 group-hover:text-blue-400">
                                        {iconMap[field.icon]}
                                    </div>
                                    <div className="relative z-10">
                                        <CardTitle className="text-lg md:text-xl font-display font-bold text-white leading-tight">
                                            {field.name}
                                        </CardTitle>
                                    </div>

                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
