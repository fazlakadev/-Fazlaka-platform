"use client"

import { useEffect, useRef } from "react"
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet"

interface SessionMapProps {
  lat: number
  lng: number
  city: string
  country: string
  isDark: boolean
}

export default function SessionMap({ lat, lng, city, country, isDark }: SessionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let cancelled = false

    async function init() {
      const L = await import("leaflet")

      if (cancelled || !containerRef.current) return

      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      const attribution = isDark
        ? '&copy; <a href="https://carto.com/">CARTO</a>'
        : '&copy; <a href="https://carto.com/">CARTO</a>'

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      })

      L.tileLayer(tileUrl, { attribution, subdomains: "abcd", maxZoom: 19 }).addTo(map)

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:14px;height:14px;border-radius:50%;
          background:#3b82f6;border:3px solid white;
          box-shadow:0 0 0 2px #3b82f6,0 2px 8px rgba(0,0,0,.3);
          position:relative;z-index:999;
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      const marker = L.marker([lat, lng], { icon }).addTo(map)
      map.invalidateSize()

      mapRef.current = map
      markerRef.current = marker
    }

    init()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [lat, lng, isDark])

  return (
    <div className="relative w-full h-full min-h-[180px]">
      <div ref={containerRef} className="absolute inset-0 rounded-xl" />
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-md border border-gray-200/50 dark:border-gray-700/50">
        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
          {city}{country ? `, ${country}` : ""}
        </p>
      </div>
    </div>
  )
}
