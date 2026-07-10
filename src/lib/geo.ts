// lib/geo.ts
// IP-based geolocation using the free ip-api.com endpoint.
// Returns country, city, and a flag emoji for the Sessions UI.

export interface GeoInfo {
  country: string
  countryCode: string
  city: string
  flag: string
}

const cache = new Map<string, GeoInfo>()

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return ""
  const A = 0x1f1e6
  const base = code.toUpperCase().charCodeAt(0) - 65
  return String.fromCodePoint(A + base, A + base + 1)
}

export async function getGeoFromIp(ip: string | null): Promise<GeoInfo | null> {
  if (!ip) return null
  // Skip localhost / private addresses
  if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null
  }

  // Check cache
  const cached = cache.get(ip)
  if (cached) return cached

  try {
    const res = await fetch(`https://ip-api.com/json/${ip}?fields=status,country,countryCode,city`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      status: string
      country?: string
      countryCode?: string
      city?: string
    }
    if (data.status !== "success" || !data.country) return null
    const geo: GeoInfo = {
      country: data.country,
      countryCode: data.countryCode ?? "",
      city: data.city ?? "",
      flag: countryCodeToFlag(data.countryCode ?? ""),
    }
    cache.set(ip, geo)
    return geo
  } catch {
    return null
  }
}
