import React from 'react';
import { cn } from '../../lib/cn';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const DialogContext = React.createContext<{ open: boolean; onOpenChange: (o: boolean) => void } | null>(null);

export const Dialog = ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode }) => {
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            {children}
        </DialogContext.Provider>
    );
};

export const DialogTrigger = ({ asChild, children, ...props }: any) => {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error("DialogTrigger must be used within Dialog");

    // If asChild is true, we should clone the child and add onClick. 
    // Simplified: just wrap in a clone or div.
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (children.props as any).onClick?.(e);
                context.onOpenChange(true);
            },
            ...props
        });
    }

    return (
        <button onClick={() => context.onOpenChange(true)} {...props}>
            {children}
        </button>
    );
};

export const DialogContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error("DialogContent must be used within Dialog");

    // Prevent crashes in SSR or environments where document is not fully available yet
    if (typeof document === 'undefined' || !document.body) {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            {context.open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[20000] bg-background/80 backdrop-blur-sm"
                        onClick={() => context.onOpenChange(false)}
                    />

                    {/* Content */}
                    <div className={cn(
                        "fixed left-[50%] top-[50%] z-[20000] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
                        className
                    )}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="w-full"
                            {...props as any}
                        >
                            {children}
                            <button
                                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                                onClick={() => context.onOpenChange(false)}
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </button>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);

export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";
