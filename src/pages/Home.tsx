import { useEffect } from 'react';
import { cn } from '../lib/cn';
import { useTheme } from '../lib/theme';

export function Home() {
    const { isLight } = useTheme();
    const heroImage = isLight ? '/home/white.png' : '/home/black.png';

    useEffect(() => {
        const previousBodyOverflow = document.body.style.overflow;
        const previousHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousBodyOverflow;
            document.documentElement.style.overflow = previousHtmlOverflow;
        };
    }, []);

    return (
        <div className={cn('relative h-full w-full overflow-hidden font-sans', isLight ? 'bg-white text-slate-950' : 'bg-black text-white')}>
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src={heroImage}
                    alt={isLight ? '천지창조 흰배경 이미지' : '천지창조 검정배경 이미지'}
                    className="h-full w-full object-cover object-center"
                    loading="eager"
                    fetchPriority="high"
                />
                <div
                    className={cn(
                        'absolute inset-0',
                        isLight
                            ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.01)_42%,rgba(255,255,255,0.14)_100%)]'
                            : 'bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.02)_42%,rgba(0,0,0,0.22)_100%)]',
                    )}
                />
            </div>

            <main className="relative z-10 h-full">
                <section className="relative h-full min-h-[calc(100dvh-3.5rem)]">
                    <div
                        className={cn(
                            'absolute left-[10vw] top-10 max-w-[14rem] sm:left-[11vw] sm:top-12 sm:max-w-[15rem] md:left-[12vw] md:top-14 md:max-w-[16rem] lg:left-[13vw] lg:top-16 lg:max-w-[17rem]',
                            isLight ? 'text-slate-950' : 'text-white',
                        )}
                    >
                        <h1
                            className={cn(
                                'text-[clamp(1.25rem,2.2vw,2.4rem)] font-extralight uppercase leading-[0.95] tracking-[0.15em]',
                                isLight
                                    ? 'text-slate-950 drop-shadow-[0_12px_30px_rgba(15,23,42,0.06)]'
                                    : 'text-white drop-shadow-[0_0_22px_rgba(255,255,255,0.18)]',
                            )}
                        >
                            Physics Dictionary
                        </h1>
                        <p
                            className={cn(
                                'mt-2 max-w-[13rem] text-[8px] uppercase tracking-[0.26em] sm:max-w-[14rem] sm:text-[9px] md:max-w-[15rem] md:text-[10px]',
                                isLight ? 'text-slate-600' : 'text-white/68',
                            )}
                        >
                            The New-Era Physics Dictionary
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
