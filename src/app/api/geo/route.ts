import { NextRequest, NextResponse } from 'next/server'

/**
 * IP-based geolocation endpoint.
 *
 * Resolves the visiting user's country from their request and maps it to the
 * subscription currency + payment gateway we should show them:
 *   - Kenya (KE)  -> KSH currency, M-Pesa gateway
 *   - Everywhere  -> USD currency, Stripe gateway
 *
 * Resolution order (all IP-derived):
 *   1. `?country=XX` override (manual / testing).
 *   2. Platform geo headers injected by the CDN/proxy in front of the app
 *      (Vercel `x-vercel-ip-country`, Cloudflare `cf-ipcountry`, etc.).
 *   3. A geolocation lookup of the client IP (for self-hosted deployments with
 *      no geo-aware proxy in front).
 *   4. Default to `US` (USD / Stripe) when the location can't be determined.
 */

const KENYA = 'KE'

type Currency = 'KSH' | 'USD'
type Gateway = 'mpesa' | 'stripe'

function currencyForCountry(country: string): Currency {
  return country === KENYA ? 'KSH' : 'USD'
}

function gatewayForCountry(country: string): Gateway {
  return country === KENYA ? 'mpesa' : 'stripe'
}

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip')
}

/** Private / loopback / link-local addresses can't be geolocated. */
function isPrivateIp(ip: string): boolean {
  if (!ip) return true
  if (ip === '::1' || ip === 'localhost' || ip.startsWith('127.')) return true
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true
  const match172 = ip.match(/^172\.(\d{1,3})\./)
  if (match172) {
    const second = Number(match172[1])
    if (second >= 16 && second <= 31) return true
  }
  // IPv6 unique-local (fc00::/7) and link-local (fe80::/10)
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true
  return false
}

async function countryFromIp(ip: string): Promise<string | null> {
  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/country/`, {
      headers: { 'User-Agent': 'FahamPesa/1.0' },
      // Cache per-IP for a day; geolocation is effectively static.
      next: { revalidate: 60 * 60 * 24 },
    })
    if (!response.ok) return null
    const text = (await response.text()).trim().toUpperCase()
    return /^[A-Z]{2}$/.test(text) ? text : null
  } catch {
    return null
  }
}

function normalizeCountry(value: string | null | undefined): string {
  const code = (value ?? '').trim().toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : ''
}

export async function GET(request: NextRequest) {
  const override = normalizeCountry(request.nextUrl.searchParams.get('country'))

  const headerCountry = normalizeCountry(
    request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      request.headers.get('x-country-code') ||
      request.headers.get('x-geo-country')
  )

  let country = override || headerCountry
  let source: 'override' | 'header' | 'ip' | 'default' = override
    ? 'override'
    : headerCountry
      ? 'header'
      : 'default'

  if (!country) {
    const ip = getClientIp(request)
    if (ip && !isPrivateIp(ip)) {
      const looked = await countryFromIp(ip)
      if (looked) {
        country = looked
        source = 'ip'
      }
    }
  }

  const resolved = country || 'US'

  return NextResponse.json(
    {
      country: resolved,
      currency: currencyForCountry(resolved),
      gateway: gatewayForCountry(resolved),
      source,
    },
    { headers: { 'Cache-Control': 'private, max-age=86400' } }
  )
}
