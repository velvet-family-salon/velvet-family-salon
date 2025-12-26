'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import logger from '@/lib/logger';

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

// P1 FIX (BUG-007): Create Supabase client OUTSIDE component
// BEFORE: createClient() called inside component = new instance per render
// AFTER: Singleton pattern = one client instance reused across all renders
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient() {
    if (!supabaseInstance) {
        supabaseInstance = createClient();
    }
    return supabaseInstance;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);

    // P1 FIX (BUG-007): Use singleton client
    const supabase = getSupabaseClient();

    // P1 FIX (BUG-008): Use ref for signOut to avoid stale closure
    // BEFORE: signOut captured in setTimeout closure could be stale
    // AFTER: signOutRef always points to latest signOut function
    const signOutRef = useRef<() => Promise<void>>();

    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();
            // Clear any timers
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }, [supabase.auth]);

    // Keep ref updated with latest signOut
    useEffect(() => {
        signOutRef.current = signOut;
    }, [signOut]);

    // Reset inactivity timer - now uses ref to get latest signOut
    const resetTimer = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);

        if (user) {
            // Warning timeout
            warningRef.current = setTimeout(() => {
                logger.log('Session will expire in 5 minutes due to inactivity');
            }, SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT);

            // Actual timeout - uses ref to get current signOut (fixes closure bug)
            timeoutRef.current = setTimeout(async () => {
                logger.log('Session expired due to inactivity');
                if (signOutRef.current) {
                    await signOutRef.current();
                }
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

