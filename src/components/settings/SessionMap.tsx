"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"

interface SessionMapProps {
  lat: number
  lng: number
  city: string
  region: string
  country: string
  flag: string
  postal?: string
  isp?: string
  org?: string
  timezone?: string
  continent?: string
  isDark: boolean
}

function SessionMapInner({ lat, lng, city, region, country, flag, postal, isp, timezone, isDark }: SessionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fullscreenMapRef = useRef<unknown>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)

  const locationLabel = region || city
  const fullLocation = [locationLabel, country].filter(Boolean).join(", ")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMarkerIcons = useCallback((L: any) => {
    const pulseOuter = L.divIcon({
      className: "",
      html: `<div style="width:48px;height:48px;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border:2px solid ${isDark ? "rgba(96,165,250,0.3)" : "rgba(59,130,246,0.3)"};animation:smPulse 2s ease-out infinite;"></div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    })
    const pulseInner = L.divIcon({
      className: "",
      html: `<div style="width:32px;height:32px;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border:2px solid ${isDark ? "rgba(96,165,250,0.5)" : "rgba(59,130,246,0.5)"};animation:smPulse 2s ease-out infinite 0.5s;"></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
    const mainPin = L.divIcon({
      className: "",
      html: `<div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#2563eb);border:3px solid white;box-shadow:0 0 0 2px rgba(59,130,246,0.4),0 4px 12px rgba(59,130,246,0.4);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })
    return { pulseOuter, pulseInner, mainPin }
  }, [isDark])

  const initMap = useCallback(async (container: HTMLDivElement, opts: { zoom: number; enableInteraction: boolean }) => {
    const L = (await import("leaflet")).default
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      await new Promise((r) => setTimeout(r, 200))
    }

    const map = L.map(container, {
      center: [lat, lng],
      zoom: opts.zoom,
      zoomControl: false,
      attributionControl: opts.enableInteraction,
      dragging: opts.enableInteraction,
      scrollWheelZoom: opts.enableInteraction,
      doubleClickZoom: opts.enableInteraction,
      touchZoom: opts.enableInteraction,
      keyboard: opts.enableInteraction,
    })

    if (opts.enableInteraction) {
      L.control.zoom({ position: "topright" }).addTo(map)
    }

    const tileLight = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    const tileDark = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    L.tileLayer(isDark ? tileDark : tileLight, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    const icons = createMarkerIcons(L)
    L.marker([lat, lng], { icon: icons.pulseOuter, interactive: false }).addTo(map)
    L.marker([lat, lng], { icon: icons.pulseInner, interactive: false }).addTo(map)
    L.marker([lat, lng], { icon: icons.mainPin }).addTo(map)

    map.invalidateSize()
    return map
  }, [lat, lng, isDark, createMarkerIcons])

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return
    const container = containerRef.current
    let cancelled = false

    async function init() {
      try {
        const map = await initMap(container, { zoom: 5, enableInteraction: false })
        if (cancelled) { map.remove(); return }
        mapInstanceRef.current = map
        setStatus("loaded")
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
  }, [initMap])

  useEffect(() => {
    if (status !== "loaded") return
    if (!document.getElementById("sm-pulse-anim")) {
      const s = document.createElement("style")
      s.id = "sm-pulse-anim"
      s.textContent = `@keyframes smPulse{0%{transform:translate(-50%,-50%) scale(0.5);opacity:1}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0}}`
      document.head.appendChild(s)
    }
  }, [status])

  useEffect(() => {
    if (!isFullscreen) return
    if (!fullscreenContainerRef.current || fullscreenMapRef.current) return
    const container = fullscreenContainerRef.current
    let cancelled = false

    async function init() {
      try {
        const map = await initMap(container, { zoom: 12, enableInteraction: true })
        if (cancelled) { map.remove(); return }
        fullscreenMapRef.current = map
        setTimeout(() => map.invalidateSize(), 200)
      } catch { /* empty */ }
    }
    init()

    return () => {
      cancelled = true
      if (fullscreenMapRef.current) {
        ;(fullscreenMapRef.current as { remove(): void }).remove()
        fullscreenMapRef.current = null
      }
    }
  }, [isFullscreen, initMap])

  useEffect(() => {
    if (!isFullscreen) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setIsFullscreen(false) }
    document.addEventListener("keydown", handleEsc)
    return () => { document.removeEventListener("keydown", handleEsc) }
  }, [isFullscreen])

  const textColor = isDark ? "#e2e8f0" : "#1f2937"
  const subtextColor = isDark ? "#94a3b8" : "#6b7280"

  return (
    <>
      <div
        ref={containerRef}
        className="w-full h-full rounded-xl cursor-pointer relative overflow-hidden"
        style={{ minHeight: "220px", backgroundColor: isDark ? "#1e293b" : "#e5e7eb" }}
        onClick={() => { if (status === "loaded") setIsFullscreen(true) }}
      />

      {status === "loading" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-[10] rounded-xl pointer-events-none"
          style={{ backgroundColor: isDark ? "#1e293b" : "#e5e7eb" }}
        >
          <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className="text-xs mt-3 font-medium" style={{ color: subtextColor }}>{flag} {locationLabel}</p>
        </div>
      )}

      {status === "error" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-[10] rounded-xl"
          style={{ backgroundColor: isDark ? "#1e293b" : "#f9fafb" }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: isDark ? "#334155" : "#f3f4f6" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#ef4444" }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm font-semibold" style={{ color: textColor }}>{flag} {fullLocation}</p>
          <p className="text-xs mt-1" style={{ color: subtextColor }}>تعذر تحميل الخريطة</p>
        </div>
      )}

      {status === "loaded" && (
        <div className="absolute bottom-2 left-2 right-2 z-[10] pointer-events-none">
          <div className="flex items-center justify-between">
            <div
              className="px-2.5 py-1.5 rounded-lg backdrop-blur-md shadow border pointer-events-auto cursor-pointer hover:scale-[1.02] transition-transform"
              style={{
                backgroundColor: isDark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.92)",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              }}
            >
              <p className="text-[10px] font-medium flex items-center gap-1.5" style={{ color: isDark ? "#60a5fa" : "#3b82f6" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                اضغط للتكبير
              </p>
            </div>
            <div
              className="px-2 py-1 rounded-lg backdrop-blur-md shadow"
              style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
            >
              <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.8)" }}>{lat.toFixed(4)}, {lng.toFixed(4)}</p>
            </div>
          </div>
        </div>
      )}

      {isFullscreen && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="relative w-full max-w-3xl flex flex-col rounded-2xl shadow-2xl overflow-hidden border"
            style={{
              height: "min(75vh, 560px)",
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-3.5 shrink-0"
              style={{
                borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))"
                      : "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.03))",
                  }}
                >
                  <span className="text-lg">{flag}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: textColor }}>{locationLabel}</p>
                  <p className="text-xs truncate" style={{ color: subtextColor }}>{country}{timezone ? ` · ${timezone}` : ""}</p>
                </div>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all hover:scale-110 active:scale-95"
                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: textColor }}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div ref={fullscreenContainerRef} className="flex-1 w-full" style={{ minHeight: 0 }} />

            <div
              className="flex items-center justify-between px-5 py-2.5 shrink-0 text-xs"
              style={{
                borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                color: subtextColor,
              }}
            >
              <div className="flex items-center gap-3">
                {isp && <span>{isp}</span>}
                {postal && <span className="font-mono">{postal}</span>}
              </div>
              <span className="font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const SessionMap = dynamic(() => Promise.resolve(SessionMapInner), { ssr: false })
export default SessionMap
