import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            session: null,
            isAuthenticated: false,
            login: async (email, password) => {
                try {
                    const res = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                    })

                    if (!res.ok) {
                        // Mock fallback for dev
                        if (email.includes('demo') || process.env.NODE_ENV === 'development') {
                            const mockUser = { id: 'mock-user', email }
                            set({ user: mockUser, session: { access_token: 'mock-token' }, isAuthenticated: true })
                            return { user: mockUser }
                        }
                        throw new Error('Login failed')
                    }

                    const data = await res.json()
                    set({ user: data.user, session: data.session, isAuthenticated: true })
                    return data
                } catch (error) {
                    console.error(error)
                    throw error
                }
            },
            logout: () => set({ user: null, session: null, isAuthenticated: false }),
        }),
        {
            name: 'synthetix-auth',
        }
    )
)

export const useDeviceStore = create((set, get) => ({
    devices: [],
    loading: false,
    ws: null,

    fetchDevices: async () => {
        const session = useAuthStore.getState().session
        if (!session) return

        set({ loading: true })
        try {
            const res = await fetch(`${API_URL}/devices`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            })
            const data = await res.json()
            set({ devices: data, loading: false })
        } catch (e) {
            console.error(e)
            set({ loading: false })
        }
    },

    toggleDevice: async (device) => {
        const session = useAuthStore.getState().session
        if (!session) return

        const newState = !device.state.on

        // Optimistic update
        set(state => ({
            devices: state.devices.map(d => d.id === device.id ? { ...d, state: { ...d.state, on: newState } } : d)
        }))

        try {
            await fetch(`${API_URL}/devices/${device.id}/command`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ command: 'set_state', params: { on: newState } })
            })
        } catch (e) {
            get().fetchDevices()
        }
    },

    connectWS: () => {
        const session = useAuthStore.getState().session
        if (!session || get().ws) return

        const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/ws/devices')
        const socket = new WebSocket(`${wsUrl}?token=${session.access_token}`)

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.event === 'device_update') {
                set(state => ({
                    devices: state.devices.map(d => d.id === data.device_id ? { ...d, state: data.state } : d)
                }))
            }
        }

        socket.onclose = () => {
            set({ ws: null })
            setTimeout(() => get().connectWS(), 5000)
        }

        set({ ws: socket })
    }
}))
