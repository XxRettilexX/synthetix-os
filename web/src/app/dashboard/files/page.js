'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import {
    File,
    Upload,
    Trash2,
    Download,
    RefreshCw,
    Folder,
    ArrowLeft,
    Search,
    Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'

export default function FileBrowser() {
    const router = useRouter()
    const { user, session } = useAuthStore()
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [search, setSearch] = useState('')

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

    const fetchFiles = async () => {
        if (!session) return
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/files/`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setFiles(data)
        } catch (e) {
            console.error(e)
            // Mock data for dev
            setFiles([
                { id: '1', name: 'Synthetix_Strategy_2026.pdf', size: 1024 * 500, mime_type: 'application/pdf', created_at: new Date().toISOString() },
                { id: '2', name: 'Dashboard_Redesign.png', size: 1024 * 1024 * 3.2, mime_type: 'image/png', created_at: new Date().toISOString() },
                { id: '3', name: 'User_Workflow_v3.docx', size: 1024 * 250, mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', created_at: new Date().toISOString() },
                { id: '4', name: 'Presentation_Slide_Deck.pptx', size: 1024 * 1024 * 8.5, mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', created_at: new Date().toISOString() },
            ])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!session) {
            router.push('/login')
        } else {
            fetchFiles()
        }
    }, [session, router])

    const handleUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch(`${API_URL}/files/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: formData
            })
            if (res.ok) {
                fetchFiles()
            }
        } catch (e) {
            console.error("Upload failed", e)
        } finally {
            setUploading(false)
        }
    }

    const deleteFile = async (id) => {
        if (!confirm("Are you sure you want to delete this file? (This action cannot be undone)")) return
        try {
            await fetch(`${API_URL}/files/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })
            fetchFiles()
        } catch (e) {
            console.error("Delete failed", e)
        }
    }

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

    if (!user) return null

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />

            <motion.main
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 overflow-auto p-8"
            >
                <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl md:hidden transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Cloud Explorer</h2>
                            <p className="text-gray-500 font-medium">Manage your personal data securely</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-sm w-full md:w-64"
                            />
                        </div>

                        <label className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95">
                            <Upload size={20} />
                            <span className="hidden sm:inline">Upload</span>
                            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                        </label>
                    </div>
                </header>

                <AnimatePresence>
                    {uploading && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-8 bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-2xl flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <RefreshCw className="animate-spin" size={18} />
                                <span className="font-semibold text-sm">Uploading file to your cloud...</span>
                            </div>
                            <div className="h-1.5 w-32 bg-blue-200 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="h-full bg-blue-600"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 bg-gray-50/30">
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Size</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Modified</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            <AnimatePresence mode="popLayout">
                                {filteredFiles.map((file, index) => (
                                    <motion.tr
                                        key={file.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                        className="hover:bg-primary/5 transition-colors group cursor-default"
                                    >
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
                                                    <File size={20} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-gray-900 truncate max-w-[200px] md:max-w-md">{file.name}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase font-black sm:hidden">{formatSize(file.size)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-sm font-semibold text-gray-500 hidden sm:table-cell">
                                            {formatSize(file.size)}
                                        </td>
                                        <td className="px-8 py-4 text-sm font-medium text-gray-400 hidden md:table-cell">
                                            {new Date(file.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="p-2.5 text-gray-300 hover:text-primary transition-colors hover:bg-white hover:shadow-sm rounded-lg"
                                                >
                                                    <Download size={18} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => deleteFile(file.id)}
                                                    className="p-2.5 text-gray-300 hover:text-error transition-colors hover:bg-white hover:shadow-sm rounded-lg"
                                                >
                                                    <Trash2 size={18} />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>

                            {filteredFiles.length === 0 && !loading && (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                                <Folder size={32} />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-bold">No files found</p>
                                                <p className="text-gray-400 text-sm">Upload something to get started or try a different search.</p>
                                            </div>
                                        </div>
                                    </td>
                                </motion.tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.main>
        </div>
    )
}
