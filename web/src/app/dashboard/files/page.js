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
    Filter,
    Eye,
    X,
    ImageIcon,
    FileText
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
    const [previewFile, setPreviewFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    const getMockFiles = () => [
        { id: '1', name: 'Synthetix_Strategy_2026.pdf', size: 1024 * 500, mime_type: 'application/pdf', created_at: new Date().toISOString() },
        { id: '2', name: 'Dashboard_Redesign.png', size: 1024 * 1024 * 3.2, mime_type: 'image/png', created_at: new Date().toISOString() },
        { id: '3', name: 'User_Workflow_v3.docx', size: 1024 * 250, mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', created_at: new Date().toISOString() },
        { id: '4', name: 'Presentation_Slide_Deck.pptx', size: 1024 * 1024 * 8.5, mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', created_at: new Date().toISOString() },
    ]

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

            console.log(`Fetch files status: ${res.status}`)

            if (res.status === 401) {
                alert("Session expired or invalid. Please login again.")
                useAuthStore.getState().logout()
                router.push('/login')
                return
            }

            if (!res.ok) {
                if (user?.email?.includes('demo')) {
                    console.log("Using mock files (demo account)")
                    setFiles(getMockFiles())
                } else {
                    setFiles([])
                }
                return
            }
            const data = await res.json()
            setFiles(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error('File fetch error:', e)
            if (user?.email?.includes('demo')) {
                setFiles(getMockFiles())
            } else {
                setFiles([])
            }
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
                    // Non impostare Content-Type per FormData, lo fa il browser con il boundary
                },
                body: formData
            })

            if (res.ok) {
                fetchFiles()
            } else {
                const errData = await res.json()
                alert(`Upload failed: ${errData.detail || 'Unknown error'}`)
            }
        } catch (e) {
            console.error("Upload failed", e)
            alert("Upload failed: Network error or server unreachable")
        } finally {
            setUploading(false)
            // Reset input per permettere di caricare lo stesso file di nuovo
            e.target.value = ''
        }
    }

    const deleteFile = async (id) => {
        if (!confirm("Are you sure you want to delete this file? (This action cannot be undone)")) return
        try {
            const res = await fetch(`${API_URL}/files/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })
            if (res.ok) {
                fetchFiles()
            } else {
                alert("Failed to delete file")
            }
        } catch (e) {
            console.error("Delete failed", e)
        }
    }

    const handleDownload = async (file) => {
        try {
            const res = await fetch(`${API_URL}/files/${file.id}/download`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (!res.ok) throw new Error('Download failed')

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = file.name
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (e) {
            console.error("Download failed", e)
            alert("Error downloading file")
        }
    }

    const handlePreview = async (file) => {
        setPreviewFile(file)
        if (file.mime_type?.startsWith('image/')) {
            try {
                const res = await fetch(`${API_URL}/files/${file.id}/download`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                })
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                setPreviewUrl(url)
            } catch (e) {
                console.error("Preview failed", e)
            }
        }
    }

    const closePreview = () => {
        if (previewUrl) window.URL.revokeObjectURL(previewUrl)
        setPreviewFile(null)
        setPreviewUrl(null)
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

                        <label className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold cursor-pointer transition-all shadow-lg active:scale-95",
                            user.email?.includes('demo')
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                : "bg-primary text-white hover:bg-opacity-90 shadow-primary/20 hover:shadow-primary/30"
                        )}>
                            <Upload size={20} />
                            <span className="hidden sm:inline">Upload</span>
                            {!user.email?.includes('demo') && (
                                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                            )}
                        </label>
                    </div>
                </header>

                {user.email?.includes('demo') && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                                <Filter size={20} />
                            </div>
                            <div>
                                <p className="text-amber-900 font-bold leading-none mb-1">Demo Mode Active</p>
                                <p className="text-amber-600 text-sm font-medium">You are seeing mockup data. Connect to your real database to upload files.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { useAuthStore.getState().logout(); router.push('/login'); }}
                            className="bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors shadow-sm"
                        >
                            Use Real Account
                        </button>
                    </motion.div>
                )}

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
                                                    onClick={() => handlePreview(file)}
                                                    className="p-2.5 text-gray-300 hover:text-primary transition-colors hover:bg-white hover:shadow-sm rounded-lg"
                                                    title="Preview"
                                                >
                                                    <Eye size={18} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleDownload(file)}
                                                    className="p-2.5 text-gray-300 hover:text-primary transition-colors hover:bg-white hover:shadow-sm rounded-lg"
                                                    title="Download"
                                                >
                                                    <Download size={18} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => deleteFile(file.id)}
                                                    className="p-2.5 text-gray-300 hover:text-error transition-colors hover:bg-white hover:shadow-sm rounded-lg"
                                                    title="Delete"
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

            {/* Preview Modal */}
            <AnimatePresence>
                {previewFile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={closePreview}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        {previewFile.mime_type?.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 truncate max-w-xs md:max-w-lg">{previewFile.name}</h3>
                                        <p className="text-xs text-gray-400 font-medium">{formatSize(previewFile.size)} • {previewFile.mime_type}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closePreview}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center min-h-[300px]">
                                {previewFile.mime_type?.startsWith('image/') ? (
                                    previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt={previewFile.name}
                                            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-gray-400">
                                            <RefreshCw className="animate-spin" size={32} />
                                            <p className="text-sm font-medium">Loading preview...</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center gap-6 p-12 text-center">
                                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                                            <File size={40} className="text-gray-200" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 font-bold text-lg">Preview not available</p>
                                            <p className="text-gray-500 max-w-xs">This file type cannot be previewed directly. You can download it to view the content.</p>
                                        </div>
                                        <button
                                            onClick={() => { handleDownload(previewFile); closePreview(); }}
                                            className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <Download size={18} />
                                            Download Now
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
                                <button
                                    onClick={closePreview}
                                    className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => handleDownload(previewFile)}
                                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center gap-2"
                                >
                                    <Download size={18} />
                                    Download
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
