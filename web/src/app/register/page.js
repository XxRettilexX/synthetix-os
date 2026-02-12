'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { register } = useAuthStore()

    const handleRegister = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            await register(email, password, fullName)
            router.push('/dashboard')
        } catch (e) {
            setError(e.message || 'Registration failed')
        } finally {
            setIsLoading(false)
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

                <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-900 tracking-tight">Create Account</h1>
                <p className="text-gray-500 text-center mb-10 font-medium">Join the Synthetix OS ecosystem</p>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase ml-1">Full Name</label>
                        <motion.input
                            whileFocus={{ scale: 1.01 }}
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Mario Rossi"
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all placeholder:text-gray-300 font-medium"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase ml-1">Email address</label>
                        <motion.input
                            whileFocus={{ scale: 1.01 }}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mario@example.com"
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all placeholder:text-gray-300 font-medium"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase ml-1">Password</label>
                        <motion.input
                            whileFocus={{ scale: 1.01 }}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all placeholder:text-gray-300 font-medium"
                            required
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-error text-xs text-center font-bold bg-error/5 py-3 rounded-xl border border-error/10"
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all text-lg flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : 'Create Account'}
                    </motion.button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 font-medium">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary font-bold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
