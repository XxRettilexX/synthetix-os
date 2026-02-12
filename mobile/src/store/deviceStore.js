import { create } from 'zustand';
import apiClient from '../api/client';
import { API_URL } from '../api/config';
import { useAuthStore } from './authStore';

export const useDeviceStore = create((set, get) => ({
    devices: [],
    isLoading: false,
    error: null,
    ws: null,

    fetchDevices: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await apiClient.get('/devices');
            set({ devices: data, isLoading: false });
        } catch (error) {
            console.error("fetchDevices error", error);
            // Fallback a dati mock solo per utenti demo
            if (useAuthStore.getState().user?.email?.includes('demo')) {
                set({
                    devices: [
                        { id: 'mock-1', name: 'Luce Soggiorno (Demo)', device_type: 'virtual_light', state: { on: false, brightness: 50 }, user_id: 'mock-user' },
                        { id: 'mock-2', name: 'Termostato (Demo)', device_type: 'iot', state: { temperature: 22.5 }, user_id: 'mock-user' }
                    ],
                    isLoading: false
                });
            } else {
                set({ error: error.message, isLoading: false, devices: [] });
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
        const token = useAuthStore.getState().session?.access_token;
        if (!token || get().ws) return;

        // Determina WS_URL dall'API_URL
        const wsUrl = API_URL.replace('http', 'ws') + '/ws/devices';
        const socket = new WebSocket(`${wsUrl}?token=${token}`);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.event === 'device_update') {
                set(state => ({
                    devices: state.devices.map(d =>
                        d.id === data.device_id
                            ? { ...d, state: data.state }
                            : d
                    )
                }));
            }
        };

        socket.onclose = () => {
            set({ ws: null });
            // Riprova tra 5 secondi
            setTimeout(() => get().startRealtimeUpdates(), 5000);
        };

        set({ ws: socket });
    }
}));
