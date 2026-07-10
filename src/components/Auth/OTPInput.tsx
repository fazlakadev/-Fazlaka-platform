"use client"

import { useRef, useEffect } from "react"
import { useLanguage } from "@/components/Language/LanguageProvider"

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
}

export default function OTPInput({ value, onChange, length = 6 }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { isRTL } = useLanguage()

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, "")
    if (digit.length > 1) return

    const newValue = value.split("")
    newValue[index] = digit
    const result = newValue.join("").slice(0, length)
    onChange(result)

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, length)
    onChange(pasted)
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div className={`flex gap-2.5 justify-center ${isRTL ? "flex-row-reverse" : ""}`}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
        />
      ))}
    </div>
  )
}
