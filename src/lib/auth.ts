
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'editor' | 'viewer';

interface UserProfile {
    id: string;
    role: UserRole;
    nickname?: string;
}

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else setLoading(false);
        });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.log('Profile fetch error (expected for new users):', error.message);
                setProfile({ id: userId, role: 'viewer', nickname: 'User' });
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Helper to generate a safe email from any ID (including Korean)
    const getEmailFromId = (id: string) => {
        // Encode ID to Hex to ensure it's safe for email local part
        const encoder = new TextEncoder();
        const data = encoder.encode(id);
        const hex = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
        // Use a simple, standard-looking domain
        return `${hex}@physics-app.com`;
    };

    const signUpWithID = async (id: string, password: string, nickname: string) => {
        if (!id || id.trim().length === 0) return { error: { message: 'ID is required.' } };

        const email = getEmailFromId(id.trim());
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) return { error };

        if (data.user) {
            // Create profile immediately
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{ id: data.user.id, role: 'viewer', nickname }]);

            if (profileError) console.error('Error creating profile:', profileError);
        }

        return { data, error: null };
    };

    const signInWithID = async (id: string, password: string) => {
        if (!id || id.trim().length === 0) return { error: { message: 'ID is required.' } };

        const email = getEmailFromId(id.trim());
        return await supabase.auth.signInWithPassword({
            email,
            password,
        });
    };

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    return {
        session,
        user,
        profile,
        loading,
        signInWithGoogle,
        signUpWithID,
        signInWithID,
        signOut,
        isAdmin: profile?.role === 'admin',
        isEditor: ['admin', 'editor'].includes(profile?.role ?? ''),
        nickname: profile?.nickname || user?.email?.split('@')[0] || 'User'
    };
}
