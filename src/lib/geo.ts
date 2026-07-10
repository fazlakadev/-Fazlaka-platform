export interface GeoInfo {
  country: string
  countryCode: string
  city: string
  flag: string
  lat: number
  lng: number
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
  if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null
  }

  const cached = cache.get(ip)
  if (cached) return cached

  try {
    const res = await fetch(`https://ipwho.is/${ip}`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      success: boolean
      country?: string
      country_code?: string
      city?: string
      latitude?: number
      longitude?: number
    }
    if (!data.success || !data.country) return null
    if (data.latitude == null || data.longitude == null) return null

    const geo: GeoInfo = {
      country: data.country,
      countryCode: data.country_code ?? "",
      city: data.city ?? "",
      flag: countryCodeToFlag(data.country_code ?? ""),
      lat: data.latitude,
      lng: data.longitude,
    }
    cache.set(ip, geo)
    return geo
  } catch {
    return null
  }
}
