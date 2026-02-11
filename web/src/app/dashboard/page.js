'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useDeviceStore } from '@/lib/store'
import {
    Lightbulb,
    Plug,
    Thermometer,
    Power,
    RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'

export default function Dashboard() {
    const router = useRouter()
    const { user, session } = useAuthStore()
    const { devices, loading, fetchDevices, toggleDevice, connectWS } = useDeviceStore()

    // Redirect if not logged in
    useEffect(() => {
        if (!session) {
            router.push('/login')
        }
    }, [session, router])

    useEffect(() => {
        if (session) {
            fetchDevices()
            connectWS()
        }
    }, [session])

    const getDeviceIcon = (type) => {
        switch (type) {
            case 'light': return <Lightbulb className="w-6 h-6 text-yellow-500" />
            case 'socket': return <Plug className="w-6 h-6 text-blue-500" />
            case 'thermostat': return <Thermometer className="w-6 h-6 text-red-500" />
            default: return <Power className="w-6 h-6 text-gray-500" />
        }
    }

    if (!user) return null

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />

            <motion.main
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-1 overflow-auto p-8"
            >
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                        <p className="text-gray-500">Welcome back, {user.email}</p>
                    </div>
                    <motion.button
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.5 }}
                        onClick={fetchDevices}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                        disabled={loading}
                    >
                        <RefreshCw size={20} className={cn(loading && "animate-spin")} />
                    </motion.button>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {devices.map((device, index) => (
                            <motion.div
                                key={device.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-primary/20 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-4 bg-gray-50 rounded-xl group-hover:bg-primary/5 transition-colors">
                                        {getDeviceIcon(device.type)}
                                    </div>
                                    <div className="flex items-center h-6">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={device.state?.on || false}
                                                onChange={() => toggleDevice(device)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-900 mb-1 text-lg">{device.name}</h3>
                                <p className="text-sm text-gray-500 capitalize mb-4 leading-relaxed font-medium">{device.type}</p>

                                {device.state && device.state.brightness !== undefined && (
                                    <div className="mt-4 pt-4 border-t border-gray-50">
                                        <div className="flex justify-between text-xs text-gray-400 mb-2 font-semibold">
                                            <span>Brightness</span>
                                            <span>{device.state.brightness}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${device.state.brightness}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full"
                                            ></motion.div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {devices.length === 0 && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full py-20 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200"
                        >
                            <div className="text-4xl mb-4 opacity-50">💤</div>
                            <p className="text-lg font-medium">No devices found.</p>
                            <p className="text-sm">Try refreshing or adding a new one.</p>
                        </motion.div>
                    )}
                </div>
            </motion.main>
        </div>
    )
}
