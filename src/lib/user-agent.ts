// lib/user-agent.ts
// Dependency-free User-Agent parser focused on what the Sessions UI needs:
// device type, browser name+version, OS name+version. Covers the common clients
// (Chrome, Safari, Edge, Firefox, Opera, Samsung) and OSes (Windows, macOS, iOS,
// Android, Linux). Falls back gracefully for unknown bots/clients.

export interface ParsedUserAgent {
  browser: string
  browserVersion?: string
  os: string
  osVersion?: string
  device: string
  deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown"
  raw: string
}

const UNKNOWN = "Unknown"

function firstMatch(ua: string, regex: RegExp): string | undefined {
  const m = ua.match(regex)
  return m?.[1]
}

function parseBrowser(ua: string): { name: string; version?: string } {
  // Order matters: more specific identifiers first.
  // Edge (Chromium) uses "Edg/" not "Edge/"
  if (/Edg\//i.test(ua)) {
    return { name: "Edge", version: firstMatch(ua, /Edg\/([\d.]+)/i) }
  }
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    return { name: "Opera", version: firstMatch(ua, /(?:OPR|Opera)[\/ ]([\d.]+)/i) }
  }
  if (/SamsungBrowser/i.test(ua)) {
    return { name: "Samsung Internet", version: firstMatch(ua, /SamsungBrowser\/([\d.]+)/i) }
  }
  if (/Firefox\//i.test(ua)) {
    return { name: "Firefox", version: firstMatch(ua, /Firefox\/([\d.]+)/i) }
  }
  // Chrome: appears in many UA strings (Edge, Opera). Check last.
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) {
    return { name: "Chrome", version: firstMatch(ua, /Chrome\/([\d.]+)/i) }
  }
  if (/Chromium\//i.test(ua)) {
    return { name: "Chromium", version: firstMatch(ua, /Chromium\/([\d.]+)/i) }
  }
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) {
    return { name: "Safari", version: firstMatch(ua, /Version\/([\d.]+)/i) }
  }
  return { name: UNKNOWN }
}

function parseOs(ua: string): { name: string; version?: string } {
  if (/Windows NT/i.test(ua)) {
    const v = firstMatch(ua, /Windows NT ([\d.]+)/i)
    const name = "Windows"
    let version: string | undefined
    if (v === "10.0") version = "10/11"
    else if (v === "6.3") version = "8.1"
    else if (v === "6.2") version = "8"
    else if (v === "6.1") version = "7"
    else if (v) version = v
    return { name, version }
  }
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return { name: "iOS", version: firstMatch(ua, /OS ([\d_]+)/i)?.replace(/_/g, ".") }
  }
  if (/Mac OS X/i.test(ua)) {
    return { name: "macOS", version: firstMatch(ua, /Mac OS X ([\d_]+)/i)?.replace(/_/g, ".") }
  }
  if (/Android/i.test(ua)) {
    return { name: "Android", version: firstMatch(ua, /Android ([\d.]+)/i) }
  }
  if (/CrOS/i.test(ua)) return { name: "ChromeOS" }
  if (/Linux/i.test(ua)) return { name: "Linux", version: firstMatch(ua, /Linux ([\d.]+)/i) }
  return { name: UNKNOWN }
}

function parseDevice(ua: string, osName: string): { device: string; deviceType: ParsedUserAgent["deviceType"] } {
  // Bot detection
  if (/bot|crawler|spider|slurp|facebookexternalhit|twitterbot/i.test(ua)) {
    return { device: "Bot", deviceType: "bot" }
  }

  // iPad (newer reports as Mac, older as iPad)
  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && "ontouchend" in (globalThis as Record<string, unknown>))) {
    return { device: "iPad", deviceType: "tablet" }
  }
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) {
    return { device: "Android Tablet", deviceType: "tablet" }
  }
  if (/Tablet/i.test(ua)) {
    return { device: "Tablet", deviceType: "tablet" }
  }

  // iPhone / Android phone
  if (/iPhone/i.test(ua)) return { device: "iPhone", deviceType: "mobile" }
  if (/Android/i.test(ua) && /Mobile/i.test(ua)) {
    // Try to extract model (after the semicolon, before Build)
    const model = firstMatch(ua, /Android[^;]+;\s*([^);]+)\s*Build/i)
    return { device: model?.trim() || "Android Phone", deviceType: "mobile" }
  }
  if (/Mobile\/Safari/i.test(ua) && osName === "iOS") {
    return { device: "iPhone", deviceType: "mobile" }
  }
  if (/Windows Phone/i.test(ua)) {
    return { device: firstMatch(ua, /Windows Phone[^;]*;\s*([^);]+)/i)?.trim() || "Windows Phone", deviceType: "mobile" }
  }

  // Desktop hints
  if (osName === "Windows" || osName === "macOS" || osName === "Linux" || osName === "ChromeOS") {
    return { device: "Desktop", deviceType: "desktop" }
  }

  return { device: UNKNOWN, deviceType: "unknown" }
}

export function parseUserAgent(userAgent?: string | null): ParsedUserAgent {
  const raw = (userAgent ?? "").trim()
  if (!raw) {
    return {
      browser: UNKNOWN,
      os: UNKNOWN,
      device: UNKNOWN,
      deviceType: "unknown",
      raw: "",
    }
  }
  const { name: browser, version: browserVersion } = parseBrowser(raw)
  const { name: os, version: osVersion } = parseOs(raw)
  const { device, deviceType } = parseDevice(raw, os)
  return { browser, browserVersion, os, osVersion, device, deviceType, raw }
}

// Get client IP from a Next.js Request, respecting common forwarded headers.
export function getClientIp(headers: Headers): string | null {
  // Vercel / common proxy headers
  const xff = headers.get("x-forwarded-for")
  if (xff) {
    // Take the first IP in the chain
    return xff.split(",")[0]?.trim() || null
  }
  const vercelFf = headers.get("x-vercel-forwarded-for")
  if (vercelFf) {
    return vercelFf.split(",")[0]?.trim() || null
  }
  const real = headers.get("x-real-ip")
  if (real) return real.trim()
  // Fallback: check the host header for local development
  return null
}
