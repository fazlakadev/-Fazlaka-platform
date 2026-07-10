"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"

interface AuthInputProps {
  icon: React.ReactNode
  type?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  onFocus?: () => void
  onBlur?: () => void
  autoFocus?: boolean
  disabled?: boolean
}

export default function AuthInput({ icon, type = "text", placeholder, value, onChange, onFocus, onBlur, autoFocus, disabled }: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(false)
  const { isRTL } = useLanguage()
  const isPassword = type === "password"

  return (
    <div className={`relative group transition-all duration-200 ${focused ? "scale-[1.01]" : ""}`}>
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-sm transition-opacity duration-200 ${focused ? "opacity-100" : "opacity-0"}`} />
      <div className={`relative flex items-center rounded-xl border bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-all duration-200 ${focused ? "border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
        <span className={`flex-shrink-0 px-3.5 text-gray-400 dark:text-gray-500 ${isRTL ? "pr-3.5" : "pl-3.5"}`}>
          {icon}
        </span>
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { setFocused(true); onFocus?.() }}
          onBlur={() => { setFocused(false); onBlur?.() }}
          autoFocus={autoFocus}
          disabled={disabled}
          className={`flex-1 py-3 ${isRTL ? "pl-3" : "pr-3"} text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none disabled:opacity-50`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`flex-shrink-0 px-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors`}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}
