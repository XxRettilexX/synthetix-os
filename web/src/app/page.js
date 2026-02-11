import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 sm:p-20 font-sans">
      <main className="text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold mb-4 text-primary">
          Synthetix OS
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Your personal cloud operating system for seamless device management and file synchronization.
        </p>

        <div className="flex gap-4 items-center justify-center">
          <Link
            href="/login"
            className="rounded-full bg-primary text-white px-8 py-3 font-semibold hover:bg-opacity-90 transition-colors"
          >
            Get Started
          </Link>
          <a
            href="https://github.com/vito/synthetix-os"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-gray-300 px-8 py-3 font-semibold hover:bg-gray-50 transition-colors"
          >
            GitHub
          </a>
        </div>
      </main>

      <footer className="mt-20 sm:mt-32 text-gray-400 text-sm">
        <p>© 2024 Synthetix OS. All rights reserved.</p>
      </footer>
    </div>
  )
}
