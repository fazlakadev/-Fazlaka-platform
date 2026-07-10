"use client"

import { useEffect, useRef, useState, useCallback } from "react"
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
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const fullscreenMapRef = useRef<unknown>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)

  const locationLabel = region || city
  const fullLocation = [locationLabel, country].filter(Boolean).join(", ")

  const initMap = useCallback(async (container: HTMLDivElement, opts: { zoom: number; enableInteraction: boolean; fullscreen?: boolean }) => {
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
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://carto.com/">CARTO</a>',
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

    if (opts.fullscreen) {
      const popupContent = `
        <div style="font-family:system-ui,-apple-system,sans-serif;min-width:180px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-size:20px;">${flag}</span>
            <div>
              <div style="font-weight:600;font-size:13px;color:#1f2937;">${locationLabel}</div>
              <div style="font-size:11px;color:#6b7280;">${country}</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:3px;font-size:11px;color:#6b7280;">
            <div style="display:flex;align-items:center;gap:4px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${timezone || "N/A"}
            </div>
            ${postal ? `<div style="display:flex;align-items:center;gap:4px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> ${postal}</div>` : ""}
          </div>
        </div>
      `
      L.popup({ closeButton: false, className: "session-map-popup" })
        .setLatLng([lat, lng])
        .setContent(popupContent)
        .openOn(map)
    }

    map.invalidateSize()
    return map
  }, [lat, lng, isDark, locationLabel, country, flag, timezone, postal])

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
        if (!cancelled) {
          setStatus("error")
          setShowErrorPopup(true)
        }
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
        const map = await initMap(container, { zoom: 12, enableInteraction: true, fullscreen: true })
        if (cancelled) { map.remove(); return }
        fullscreenMapRef.current = map
        setTimeout(() => map.invalidateSize(), 150)
      } catch {}
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
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = ""
    }
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
          className="absolute inset-0 flex flex-col items-center justify-center z-[1000] rounded-xl"
          style={{ backgroundColor: isDark ? "#1e293b" : "#e5e7eb" }}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-blue-500/20" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-lg">{flag}</span>
            <p className="text-xs font-medium" style={{ color: subtextColor }}>{locationLabel}</p>
          </div>
        </div>
      )}

      {status === "error" && showErrorPopup && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowErrorPopup(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl shadow-2xl border overflow-hidden"
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-6 pt-8 pb-6 flex flex-col items-center text-center"
              style={{
                background: isDark
                  ? "linear-gradient(180deg, rgba(59,130,246,0.1) 0%, transparent 100%)"
                  : "linear-gradient(180deg, rgba(59,130,246,0.05) 0%, transparent 100%)",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: isDark
                    ? "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))"
                    : "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.03))",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#ef4444" }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: textColor }}>تعذر تحميل الخريطة</h3>
              <p className="text-sm leading-relaxed" style={{ color: subtextColor }}>
                لا يمكن عرض الموقع على الخريطة حالياً. يمكنك تأكيد الموقع من المعلومات أدناه.
              </p>
            </div>
            <div className="px-6 pb-6">
              <div
                className="rounded-2xl p-4 border"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{flag}</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: textColor }}>{fullLocation}</p>
                    {postal && <p className="text-xs" style={{ color: subtextColor }}>الرمز البريدي: {postal}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl px-3 py-2" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}>
                    <p className="text-[10px] mb-0.5" style={{ color: subtextColor }}>خط العرض</p>
                    <p className="text-xs font-mono font-semibold" style={{ color: textColor }}>{lat.toFixed(4)}</p>
                  </div>
                  <div className="rounded-xl px-3 py-2" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}>
                    <p className="text-[10px] mb-0.5" style={{ color: subtextColor }}>خط الطول</p>
                    <p className="text-xs font-mono font-semibold" style={{ color: textColor }}>{lng.toFixed(4)}</p>
                  </div>
                </div>
                {timezone && (
                  <div className="mt-2 rounded-xl px-3 py-2" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}>
                    <p className="text-[10px] mb-0.5" style={{ color: subtextColor }}>المنطقة الزمنية</p>
                    <p className="text-xs font-mono font-semibold" style={{ color: textColor }}>{timezone}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowErrorPopup(false)}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
              >
                حسناً
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "loaded" && (
        <>
          <div className="absolute top-2 left-2 z-[1000]">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl backdrop-blur-xl shadow-lg border"
              style={{
                backgroundColor: isDark ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.9)",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)",
              }}
            >
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: isDark ? "rgba(59,130,246,0.2)" : "#dbeafe" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: isDark ? "#60a5fa" : "#2563eb" }}>
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold leading-tight" style={{ color: textColor }}>{flag} {locationLabel}</p>
                <p className="text-[10px] leading-tight" style={{ color: subtextColor }}>{country}</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 right-2 z-[1000]">
            <div className="px-2 py-1 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
              <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.8)" }}>{lat.toFixed(4)}, {lng.toFixed(4)}</p>
            </div>
          </div>
          <div className="absolute bottom-2 left-2 z-[1000]">
            <div
              className="px-2.5 py-1.5 rounded-lg backdrop-blur-xl shadow-md border cursor-pointer hover:scale-105 transition-transform"
              style={{
                backgroundColor: isDark ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.9)",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)",
              }}
            >
              <p className="text-[10px] font-medium flex items-center gap-1.5" style={{ color: subtextColor }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: isDark ? "#60a5fa" : "#3b82f6" }}>
                  <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                <span style={{ color: isDark ? "#60a5fa" : "#3b82f6" }}>اضغط للتكبير</span>
              </p>
            </div>
          </div>
        </>
      )}

      {isFullscreen && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col"
          style={{ backgroundColor: isDark ? "#0f172a" : "#f8fafc" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b shrink-0"
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: isDark
                    ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))"
                    : "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.03))",
                }}
              >
                <span className="text-xl">{flag}</span>
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: textColor }}>{locationLabel}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs" style={{ color: subtextColor }}>{country}</p>
                  {timezone && (
                    <>
                      <span style={{ color: subtextColor }}>·</span>
                      <p className="text-xs" style={{ color: subtextColor }}>{timezone}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: textColor }}>
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div ref={fullscreenContainerRef} className="flex-1 w-full relative" style={{ minHeight: 0 }} />

          <div
            className="px-5 py-3 border-t shrink-0"
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium" style={{ color: textColor }}>موقع الجلسة</span>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  {isp && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: subtextColor }}>
                      {isp}
                    </span>
                  )}
                  {postal && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: subtextColor }}>
                      {postal}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs font-mono" style={{ color: subtextColor }}>{lat.toFixed(6)}, {lng.toFixed(6)}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import dynamic from "next/dynamic"
const SessionMap = dynamic(() => Promise.resolve(SessionMapInner), { ssr: false })
export default SessionMap
