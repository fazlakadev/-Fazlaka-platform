export interface GeoInfo {
  country: string
  countryCode: string
  city: string
  region: string
  flag: string
  lat: number
  lng: number
  postal: string
  isp: string
  org: string
  timezone: string
  continent: string
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
    const res = await fetch(
      `https://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,continent`,
      { signal: AbortSignal.timeout(3000) },
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      status: string
      country?: string
      countryCode?: string
      region?: string
      regionName?: string
      city?: string
      zip?: string
      lat?: number
      lon?: number
      timezone?: string
      isp?: string
      org?: string
      continent?: string
    }
    if (data.status !== "success" || !data.country) return null
    if (data.lat == null || data.lon == null) return null

    const geo: GeoInfo = {
      country: data.country,
      countryCode: data.countryCode ?? "",
      city: data.city ?? "",
      region: data.regionName ?? data.region ?? "",
      flag: countryCodeToFlag(data.countryCode ?? ""),
      lat: data.lat,
      lng: data.lon,
      postal: data.zip ?? "",
      isp: data.isp ?? "",
      org: data.org ?? "",
      timezone: data.timezone ?? "",
      continent: data.continent ?? "",
    }
    cache.set(ip, geo)
    return geo
  } catch {
    return null
  }
}
