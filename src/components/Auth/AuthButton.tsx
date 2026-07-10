"use client"

import { RefreshCw } from "lucide-react"

interface AuthButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: "button" | "submit"
  variant?: "primary" | "secondary" | "google"
  isLoading?: boolean
  loadingText?: string
  disabled?: boolean
  className?: string
}

export default function AuthButton({ children, onClick, type = "button", variant = "primary", isLoading, loadingText, disabled, className = "" }: AuthButtonProps) {
  const base = "w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"

  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]",
    secondary: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 active:scale-[0.98]",
    google: "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 active:scale-[0.98]",
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {isLoading ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}
