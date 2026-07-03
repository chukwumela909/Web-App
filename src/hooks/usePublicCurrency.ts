import { useEffect, useState } from 'react'

/**
 * Detects the visiting (possibly anonymous) user's subscription currency and
 * payment gateway from their IP location.
 *
 * Unlike `useCurrency`, this does NOT require the user to be logged in or
 * onboarded — it's meant for public, pre-signup surfaces such as the pricing
 * page where we want Kenyan visitors to see KSH (and M-Pesa) automatically.
 *
 * Detection uses two independent signals and lets Kenya win from EITHER:
 *   1. A client-side IP lookup (ipwho.is / geojs) — sees the real browser IP
 *      directly, so it works even when the app server sits behind a proxy that
 *      doesn't forward the client IP or emit CDN geo headers.
 *   2. The server-side `/api/geo` endpoint (CDN geo headers + IP lookup).
 * If both fail to resolve a country we default to USD / Stripe.
 *
 * This mirrors the client-side detection used by `useBillingLocation` (the
 * logged-in subscription surface) so anonymous and authenticated visitors
 * resolve their currency the same, reliable way.
 */

type Currency = 'KSH' | 'USD'
type Gateway = 'mpesa' | 'stripe'

interface GeoCurrency {
  country: string
  currency: Currency
  gateway: Gateway
}

const DEFAULT_GEO: GeoCurrency = { country: 'US', currency: 'USD', gateway: 'stripe' }
const CACHE_KEY = 'fahampesa_geo_currency'

const KENYA = 'KE'

// Kenya -> KSH / M-Pesa; everywhere else (or unknown) -> USD / Stripe.
function geoForCountry(country: string): GeoCurrency {
  const code = country.toUpperCase()
  return code === KENYA
    ? { country: KENYA, currency: 'KSH', gateway: 'mpesa' }
    : { country: code || 'US', currency: 'USD', gateway: 'stripe' }
}

function readCache(): GeoCurrency | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const parsed = JSON.parse(cached) as GeoCurrency
    return parsed?.currency ? parsed : null
  } catch {
    return null
  }
}

// Free, key-less, CORS-enabled IP geolocation endpoints (same sources as
// `useBillingLocation`). Tried in order; first valid ISO alpha-2 wins.
const GEO_SOURCES: Array<{ url: string; pick: (json: any) => unknown }> = [
  { url: 'https://ipwho.is/', pick: (json) => json?.country_code },
  { url: 'https://get.geojs.io/v1/ip/country.json', pick: (json) => json?.country },
]

async function detectCountryClientSide(signal: AbortSignal): Promise<string> {
  for (const source of GEO_SOURCES) {
    try {
      const res = await fetch(source.url, { signal })
      if (!res.ok) continue
      const json = await res.json()
      const code = String(source.pick(json) ?? '').trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(code)) return code
    } catch {
      if (signal.aborted) return ''
      // try the next source
    }
  }
  return ''
}

async function detectCountryServerSide(signal: AbortSignal): Promise<string> {
  try {
    const res = await fetch('/api/geo', { signal })
    if (!res.ok) return ''
    const data = (await res.json()) as Partial<GeoCurrency> | null
    return String(data?.country ?? '').trim().toUpperCase()
  } catch {
    return ''
  }
}

export function usePublicCurrency() {
  const [geo, setGeo] = useState<GeoCurrency>(DEFAULT_GEO)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    // Hydrate instantly from cache so the price doesn't visibly "flip".
    const cached = readCache()
    if (cached) {
      setGeo(cached)
      setIsLoading(false)
    }

    // Ask both signals in parallel; Kenya from EITHER source wins so a single
    // provider (or the server not seeing the client IP) can't wrongly downgrade
    // a Kenyan visitor to USD.
    Promise.all([
      detectCountryClientSide(controller.signal),
      detectCountryServerSide(controller.signal),
    ])
      .then(([clientCountry, serverCountry]) => {
        if (cancelled) return
        const country =
          clientCountry === KENYA || serverCountry === KENYA
            ? KENYA
            : clientCountry || serverCountry
        if (!country) return // keep default / cached value when nothing resolved
        const resolved = geoForCountry(country)
        setGeo(resolved)
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(resolved))
        } catch {
          /* ignore storage failures */
        }
      })
      .catch(() => {
        /* keep default / cached value on failure */
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  return { ...geo, isLoading }
}
