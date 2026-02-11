import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../api/config';

export const useAuthStore = create((set) => ({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,

    initialize: async () => {
        try {
            const savedSession = await AsyncStorage.getItem('synthetix-session');
            const savedUser = await AsyncStorage.getItem('synthetix-user');

            if (savedSession && savedUser) {
                set({
                    user: JSON.parse(savedUser),
                    session: JSON.parse(savedSession),
                    isAuthenticated: true,
                    isLoading: false
                });
            } else {
                set({ isLoading: false });
            }
        } catch (e) {
            console.error("Auth init failed", e);
            set({ isLoading: false });
        }
    },

    signIn: async (email, password) => {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                // Mock fallback per sviluppo locale se il backend non è raggiungibile
                if (email.includes('demo')) {
                    const mockUser = { id: 'mock-user', email };
                    const mockSession = { access_token: 'mock-token' };
                    await AsyncStorage.setItem('synthetix-session', JSON.stringify(mockSession));
                    await AsyncStorage.setItem('synthetix-user', JSON.stringify(mockUser));
                    set({ user: mockUser, session: mockSession, isAuthenticated: true });
                    return { data: { user: mockUser }, error: null };
                }
                throw new Error('Login fallito');
            }

            const data = await res.json();
            const session = { access_token: data.access_token };
            await AsyncStorage.setItem('synthetix-session', JSON.stringify(session));
            await AsyncStorage.setItem('synthetix-user', JSON.stringify(data.user));

            set({ user: data.user, session, isAuthenticated: true });
            return { data, error: null };
        } catch (error) {
            console.error("SignIn error", error);
            return { data: null, error: error.message };
        }
    },

    signUp: async (email, password) => {
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) throw new Error('Registrazione fallita');

            const data = await res.json();
            return { data, error: null };
        } catch (error) {
            console.error("SignUp error", error);
            return { data: null, error: error.message };
        }
    },

    signOut: async () => {
        await AsyncStorage.removeItem('synthetix-session');
        await AsyncStorage.removeItem('synthetix-user');
        set({ user: null, session: null, isAuthenticated: false });
    },
}));
