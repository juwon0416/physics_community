
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Button, Input } from '../ui';
import { useAuth } from '../../lib/auth';
import { LogIn } from 'lucide-react';

export function LoginDialog() {
    const { user, signOut, signInWithID, signUpWithID, loading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    // Form state
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUpWithID(id, password, nickname);
                if (error) throw error;
                // Auto close on success or let auth state change handle it
            } else {
                const { error } = await signInWithID(id, password);
                if (error) throw error;
            }
            setIsOpen(false);
        } catch (err: any) {
            // Aggressively mask "Email" related errors to hide implementation details from user
            let errorMessage = err.message;
            if (errorMessage.toLowerCase().includes('email') || errorMessage.includes('@')) {
                errorMessage = "Unable to verify ID. Please try a different ID.";
            } else if (errorMessage === 'Invalid login credentials') {
                errorMessage = "ID or Password incorrect";
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) return null;

    if (user) {
        return (
            <Button variant="ghost" onClick={signOut} size="sm">
                Sign Out
            </Button>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isSignUp ? 'Create Account' : 'Welcome Back'}</DialogTitle>
                    <DialogDescription>
                        {isSignUp ? 'Join the community.' : 'Sign in to your account.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="ID"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                required
                                minLength={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        {isSignUp && (
                            <div className="space-y-2">
                                <Input
                                    placeholder="Nickname"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    required
                                    minLength={2}
                                />
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-destructive text-center">{error}</p>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-primary hover:underline underline-offset-4"
                        >
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
