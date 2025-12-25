'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;
// Warning before timeout (5 minutes before)
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);
    const supabase = createClient();

    // Reset inactivity timer
    const resetTimer = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);

        if (user) {
            // Warning timeout
            warningRef.current = setTimeout(() => {
                // Show warning (could be enhanced with a modal)
                console.log('Session will expire in 5 minutes due to inactivity');
            }, SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT);

            // Actual timeout
            timeoutRef.current = setTimeout(async () => {
                console.log('Session expired due to inactivity');
                await signOut();
            }, SESSION_TIMEOUT);
        }
    }, [user]);

    // Listen for user activity
    useEffect(() => {
        if (!user) return;

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        const handleActivity = () => resetTimer();

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        resetTimer(); // Start the timer

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);
        };
    }, [user, resetTimer]);

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Error getting session:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase.auth]);

    const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { error: error.message };
            }

            return { error: null };
        } catch (error) {
            return { error: 'An unexpected error occurred' };
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            // Clear any timers
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
