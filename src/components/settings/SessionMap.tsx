"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"

interface SessionMapProps {
  lat: number
  lng: number
  city: string
  country: string
  flag: string
  isDark: boolean
}

function SessionMapInner({ lat, lng, city, country, flag, isDark }: SessionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading")

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return
    const container = containerRef.current

    let cancelled = false

    async function init() {
      try {
        const L = (await import("leaflet")).default
        if (cancelled || !container) return

        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
          await new Promise((r) => setTimeout(r, 200))
          if (cancelled || !container) return
        }

        const map = L.map(container, {
          center: [lat, lng],
          zoom: 5,
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
          keyboard: false,
        })

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)

        const pulseOuter = L.divIcon({
          className: "",
          html: `<div style="width:48px;height:48px;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border:2px solid ${isDark ? "rgba(96,165,250,0.3)" : "rgba(59,130,246,0.3)"};animation:smPulse 2s ease-out infinite;"></div>`,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        })
        L.marker([lat, lng], { icon: pulseOuter, interactive: false }).addTo(map)

        const pulseInner = L.divIcon({
          className: "",
          html: `<div style="width:32px;height:32px;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border:2px solid ${isDark ? "rgba(96,165,250,0.5)" : "rgba(59,130,246,0.5)"};animation:smPulse 2s ease-out infinite 0.5s;"></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
        L.marker([lat, lng], { icon: pulseInner, interactive: false }).addTo(map)

        const mainPin = L.divIcon({
          className: "",
          html: `<div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#2563eb);border:3px solid white;box-shadow:0 0 0 2px rgba(59,130,246,0.4),0 4px 12px rgba(59,130,246,0.4);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
        L.marker([lat, lng], { icon: mainPin }).addTo(map)

        mapInstanceRef.current = map
        map.invalidateSize()

        if (!cancelled) setStatus("loaded")
      } catch {
        if (!cancelled) setStatus("error")
      }
    }

    init()

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        ;(mapInstanceRef.current as { remove(): void }).remove()
        mapInstanceRef.current = null
      }
    }
  }, [lat, lng, isDark])

  useEffect(() => {
    if (status !== "loaded") return
    if (!document.getElementById("sm-pulse-anim")) {
      const s = document.createElement("style")
      s.id = "sm-pulse-anim"
      s.textContent = `@keyframes smPulse{0%{transform:translate(-50%,-50%) scale(0.5);opacity:1}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0}}`
      document.head.appendChild(s)
    }
  }, [status])

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl"
      style={{
        minHeight: "220px",
        backgroundColor: isDark ? "#1e293b" : "#e5e7eb",
        position: "relative",
      }}
    >
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[1000] rounded-xl" style={{ backgroundColor: isDark ? "#1e293b" : "#e5e7eb" }}>
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-3" />
          <p className="text-xs" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{flag} {city}</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[1000] rounded-xl" style={{ backgroundColor: isDark ? "#1e293b" : "#f3f4f6" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: isDark ? "#334155" : "#e5e7eb" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <p className="text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#1f2937" }}>{flag} {city}, {country}</p>
          <p className="text-xs mt-1" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{lat.toFixed(4)}, {lng.toFixed(4)}</p>
        </div>
      )}

      {status === "loaded" && (
        <>
          <div className="absolute top-2 left-2 z-[1000]">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl backdrop-blur-xl shadow-lg border" style={{ backgroundColor: isDark ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.9)", borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)" }}>
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: isDark ? "rgba(59,130,246,0.2)" : "#dbeafe" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: isDark ? "#60a5fa" : "#2563eb" }}>
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold leading-tight" style={{ color: isDark ? "#e2e8f0" : "#1f2937" }}>{flag} {city}</p>
                <p className="text-[10px] leading-tight" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{country}</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 right-2 z-[1000]">
            <div className="px-2 py-1 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
              <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.8)" }}>{lat.toFixed(4)}, {lng.toFixed(4)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const SessionMap = dynamic(() => Promise.resolve(SessionMapInner), { ssr: false })
export default SessionMap
