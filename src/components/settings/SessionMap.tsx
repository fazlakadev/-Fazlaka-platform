"use client"

import { useEffect, useRef, useState } from "react"
import type { Map as LeafletMap } from "leaflet"

interface SessionMapProps {
  lat: number
  lng: number
  city: string
  country: string
  flag: string
  isDark: boolean
}

export default function SessionMap({ lat, lng, city, country, flag, isDark }: SessionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let cancelled = false

    async function init() {
      const L = await import("leaflet")

      if (cancelled || !containerRef.current) return

      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"

      const map = L.map(containerRef.current, {
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

      L.tileLayer(tileUrl, {
        attribution: '&copy; CARTO',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map)

      // Outer pulsing ring
      const pulseRingIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:48px;height:48px;border-radius:50%;
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          border:2px solid rgba(59,130,246,0.3);
          animation:sessionMapPulse 2s ease-out infinite;
        "></div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      })
      L.marker([lat, lng], { icon: pulseRingIcon, interactive: false }).addTo(map)

      // Inner pulsing ring
      const innerPulseIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:32px;height:32px;border-radius:50%;
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          border:2px solid rgba(59,130,246,0.5);
          animation:sessionMapPulse 2s ease-out infinite 0.5s;
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      L.marker([lat, lng], { icon: innerPulseIcon, interactive: false }).addTo(map)

      // Main marker
      const mainIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:20px;height:20px;border-radius:50%;
          background:linear-gradient(135deg,#3b82f6,#2563eb);
          border:3px solid white;
          box-shadow:0 0 0 2px rgba(59,130,246,0.4),0 4px 12px rgba(59,130,246,0.4);
          position:relative;z-index:999;
          transition:transform 0.2s;
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })
      L.marker([lat, lng], { icon: mainIcon }).addTo(map)

      map.invalidateSize()
      mapRef.current = map

      setTimeout(() => setIsLoaded(true), 300)
    }

    // Inject pulse animation
    if (!document.getElementById("session-map-styles")) {
      const style = document.createElement("style")
      style.id = "session-map-styles"
      style.textContent = `
        @keyframes sessionMapPulse {
          0% { transform: translate(-50%,-50%) scale(0.5); opacity:1; }
          100% { transform: translate(-50%,-50%) scale(1.8); opacity:0; }
        }
      `
      document.head.appendChild(style)
    }

    init()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [lat, lng, isDark])

  return (
    <div className="relative w-full h-full min-h-[220px] overflow-hidden rounded-xl">
      {/* Map container */}
      <div
        ref={containerRef}
        className={`absolute inset-0 transition-opacity duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />

      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
      )}

      {/* Top gradient overlay */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/10 to-transparent z-[998] pointer-events-none" />

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent z-[998] pointer-events-none" />

      {/* Location badge */}
      <div className="absolute top-3 left-3 z-[1000]">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl shadow-lg border border-white/50 dark:border-white/10">
          <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 leading-tight">
              {flag} {city}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{country}</p>
          </div>
        </div>
      </div>

      {/* Coordinates badge */}
      <div className="absolute bottom-3 right-3 z-[1000]">
        <div className="px-2 py-1 rounded-lg bg-black/50 dark:bg-black/60 backdrop-blur-sm">
          <p className="text-[10px] text-white/80 font-mono">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  )
}
