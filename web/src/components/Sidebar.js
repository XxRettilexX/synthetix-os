'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import {
    Power,
    Folder,
    Settings,
    LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function Sidebar() {
    const router = useRouter()
    const pathname = usePathname()
    const { user, logout } = useAuthStore()

    if (!user) return null

    const navItems = [
        { label: 'Devices', icon: Power, href: '/dashboard' },
        { label: 'Files', icon: Folder, href: '/dashboard/files' },
        { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
    ]

    return (
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
            <div className="p-6">
                <Link href="/" className="text-2xl font-bold text-primary">Synthetix</Link>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-gray-600 hover:bg-gray-50"
                            )}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {user.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    </div>
                    <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    )
}
