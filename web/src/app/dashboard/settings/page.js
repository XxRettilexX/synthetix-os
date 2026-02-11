'use client'

import React, { useState } from 'react'
import { useAuthStore } from '@/lib/store'
import Sidebar from '@/components/Sidebar'
import { motion } from 'framer-motion'
import {
    User,
    Bell,
    Shield,
    Keyboard,
    Save,
    CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
    const { user } = useAuthStore()
    const [activeTab, setActiveTab] = useState('profile')
    const [saved, setSaved] = useState(false)

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'system', label: 'System', icon: Keyboard },
    ]

    const handleSave = () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    if (!user) return null

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />

            <motion.main
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 overflow-auto p-8"
            >
                <header className="mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h2>
                    <p className="text-gray-500 font-medium">Manage your account and preferences</p>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Tabs */}
                    <aside className="lg:w-64 space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                                    activeTab === tab.id
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-gray-500 hover:bg-white hover:text-gray-900"
                                )}
                            >
                                <tab.icon size={20} />
                                {tab.label}
                            </button>
                        ))}
                    </aside>

                    {/* Content */}
                    <div className="flex-1 max-w-2xl">
                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary text-3xl font-black">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Personal Info</h3>
                                            <p className="text-gray-500 text-sm">Update your avatar and details</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                                            <input
                                                type="email"
                                                defaultValue={user.email}
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-medium"
                                                readOnly
                                            />
                                            <p className="text-[10px] text-gray-400 ml-1 uppercase font-black">Primary email cannot be changed</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                                            <input
                                                type="text"
                                                placeholder="Mario Rossi"
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-medium text-gray-900"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 ml-1">Timezone</label>
                                            <select className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-medium text-gray-900">
                                                <option>Europe/Rome (GMT+1)</option>
                                                <option>UTC</option>
                                                <option>America/New_York</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab !== 'profile' && (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                                        <Shield size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Coming Soon</h3>
                                    <p className="text-gray-500 max-w-xs mx-auto">This setting module is currently under development.</p>
                                </div>
                            )}

                            <div className="mt-10 pt-8 border-t border-gray-50 flex justify-between items-center">
                                <p className="text-xs text-gray-400 font-bold uppercase">
                                    Last synced: {new Date().toLocaleTimeString()}
                                </p>
                                <button
                                    onClick={handleSave}
                                    className={cn(
                                        "flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95",
                                        saved
                                            ? "bg-green-500 text-white shadow-green-200"
                                            : "bg-primary text-white shadow-primary/20 hover:bg-opacity-90"
                                    )}
                                >
                                    {saved ? (
                                        <>
                                            <CheckCircle size={20} />
                                            Saved!
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.main>
        </div>
    )
}
