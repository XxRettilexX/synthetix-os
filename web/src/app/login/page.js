'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()
    const { login } = useAuthStore()

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await login(email, password)
            router.push('/dashboard')
        } catch (e) {
            setError('Invalid credentials or network error')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 sm:p-0 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-3xl animate-pulse delay-700"></div>

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="z-10 w-full max-w-sm bg-white p-10 rounded-3xl shadow-2xl border border-white/50 backdrop-blur-sm"
            >
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                        <span className="text-3xl text-white font-bold">S</span>
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-900 tracking-tight">Welcome Back</h1>
                <p className="text-gray-500 text-center mb-10 font-medium">Log in to manage your Synthetix OS</p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 ml-1">Email</label>
                        <motion.input
                            whileFocus={{ scale: 1.01 }}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="vito@example.com"
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all placeholder:text-gray-300"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 ml-1">Password</label>
                        <motion.input
                            whileFocus={{ scale: 1.01 }}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all placeholder:text-gray-300"
                            required
                        />
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-error text-sm text-center font-medium bg-error/10 py-2 rounded-lg"
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-shadow text-lg"
                    >
                        Sign In
                    </motion.button>
                </form>
                <p className="mt-8 text-center text-sm text-gray-400 font-medium">
                    Try <span className="text-primary font-bold cursor-help" title="Mocked local development mode">demo@example.com</span>
                </p>
            </motion.div>
        </div>
    )
}
