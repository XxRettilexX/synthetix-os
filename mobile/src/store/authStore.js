import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Configurazione Supabase (usare variabili d'ambiente in produzione)
// Per ora hardcoded per test locale
const SUPABASE_URL = "https://example.supabase.co"; // Mock URL
const SUPABASE_KEY = "mock_key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const useAuthStore = create((set) => ({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,

    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                set({ user: session.user, session, isAuthenticated: true, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (e) {
            console.error("Auth init failed", e);
            set({ isLoading: false });
        }
    },

    signIn: async (email, password) => {
        // Mock login logic se supabase è mockato
        if (SUPABASE_URL.includes("example")) {
            const mockUser = { id: "mock-user-id", email };
            set({ user: mockUser, isAuthenticated: true, session: { access_token: "mock-token" } });
            return { data: { user: mockUser }, error: null };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (data.session) {
            set({ user: data.user, session: data.session, isAuthenticated: true });
        }
        return { data, error };
    },

    signUp: async (email, password) => {
        if (SUPABASE_URL.includes("example")) {
            // Mock signup
            return { data: { user: { id: "mock-new-user", email } }, error: null };
        }
        return await supabase.auth.signUp({ email, password });
    },

    signOut: async () => {
        if (!SUPABASE_URL.includes("example")) {
            await supabase.auth.signOut();
        }
        set({ user: null, session: null, isAuthenticated: false });
    },
}));
