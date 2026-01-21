import React from 'react';
import { cn } from '../../lib/cn';

// CARD COMPONENTS
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("glass-card rounded-xl text-card-foreground", className)} {...props} />
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";


// BADGE COMPONENT
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}
export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    return (
        <div className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            {
                'border-transparent bg-primary text-primary-foreground hover:bg-primary/80': variant === 'default',
                'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
                'text-foreground': variant === 'outline',
            },
            className
        )} {...props} />
    );
}

// BUTTON COMPONENT
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                {
                    'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
                    'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
                    'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
                    'h-10 px-4 py-2': size === 'default',
                    'h-9 rounded-md px-3': size === 'sm',
                    'h-11 rounded-md px-8': size === 'lg',
                    'h-10 w-10': size === 'icon',
                },
                className
            )}
            {...props}
        />
    )
})
Button.displayName = "Button"

// INPUT COMPONENT
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Input.displayName = "Input"

// DIALOG COMPONENTS (Radix-like API with Framer Motion)
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

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

import { createPortal } from 'react-dom';

export const DialogContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error("DialogContent must be used within Dialog");

    return createPortal(
        <AnimatePresence>
            {context.open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm"
                        onClick={() => context.onOpenChange(false)}
                    />

                    {/* Content */}
                    <div className="fixed left-[50%] top-[50%] z-[9999] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                                "w-full",
                                className
                            )}
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

export * from './ImageUpload';
