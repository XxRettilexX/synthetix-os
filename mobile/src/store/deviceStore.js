import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../api/config';
import { useAuthStore } from './authStore';

const apiClient = axios.create({
    baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().session?.access_token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const useDeviceStore = create((set, get) => ({
    devices: [],
    isLoading: false,
    error: null,

    fetchDevices: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await apiClient.get('/devices');
            set({ devices: data, isLoading: false });
        } catch (error) {
            console.error("fetchDevices error", error);
            // Fallback a dati mock per test se API non raggiungibile
            if (!error.response) {
                set({
                    devices: [
                        { id: 'mock-1', name: 'Mock Light', device_type: 'virtual_light', state: { on: false, brightness: 50 }, user_id: 'mock-user' },
                        { id: 'mock-2', name: 'Mock Thermostat', device_type: 'iot', state: { temperature: 22.5 }, user_id: 'mock-user' }
                    ],
                    isLoading: false
                });
            } else {
                set({ error: error.message, isLoading: false });
            }
        }
    },

    toggleDevice: async (deviceId, currentState) => {
        // Optimistic UI update
        set(state => ({
            devices: state.devices.map(d =>
                d.id === deviceId
                    ? { ...d, state: { ...d.state, on: !currentState } }
                    : d
            )
        }));

        try {
            await apiClient.post(`/devices/${deviceId}/command`, {
                command: "set_state",
                params: { on: !currentState }
            });
        } catch (error) {
            console.error("toggleDevice error", error);
            // Revert optimistic update
            set(state => ({
                devices: state.devices.map(d =>
                    d.id === deviceId
                        ? { ...d, state: { ...d.state, on: currentState } }
                        : d
                )
            }));
        }
    },

    startRealtimeUpdates: () => {
        // TODO: Implementare WebSocket client
    }
}));
