import { useEffect, useState } from 'react'

/**
 * Billing location detected from the user's CURRENT IP (client-side geolocation).
 *
 * This is deliberately INDEPENDENT of the business's onboarding country / configured
 * currency (see `useCurrency`, which drives operating currency for products & sales).
 * Subscription pricing and the payment provider are gated strictly on where the user
 * physically is right now:
 *   - Kenya  -> KSH, pay via M-Pesa
 *   - elsewhere, or unknown / lookup failure -> USD, pay via card (Stripe)
 */

export type BillingCurrency = 'KSH' | 'USD'

const CACHE_KEY = 'fahampesa_billing_location'
const CACHE_TTL_MS = 1000 * 60 * 60 * 6 // 6 hours

interface BillingLocation {
  country: string // ISO 3166-1 alpha-2, '' when unknown
  currency: BillingCurrency
}

interface CachedLocation extends BillingLocation {
  timestamp: number
}

// Billing only ever charges in KSH (Kenya) or USD (everywhere else / unknown).
function currencyForCountry(country: string): BillingCurrency {
  return country.toUpperCase() === 'KE' ? 'KSH' : 'USD'
}

function readCache(): CachedLocation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedLocation
    if (typeof parsed.timestamp !== 'number' || Date.now() - parsed.timestamp > CACHE_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(value: CachedLocation) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(value))
  } catch {
    // sessionStorage may be unavailable (private mode / quota) — detection still works, just uncached.
  }
}

// Free, key-less, CORS-enabled IP geolocation endpoints. Tried in order; first
// valid ISO alpha-2 wins. If all fail we return '' and fall back to USD.
const GEO_SOURCES: Array<{ url: string; pick: (json: any) => unknown }> = [
  { url: 'https://ipwho.is/', pick: (json) => json?.country_code },
  { url: 'https://get.geojs.io/v1/ip/country.json', pick: (json) => json?.country }
]

async function detectCountry(signal: AbortSignal): Promise<string> {
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

export function useBillingLocation() {
  const [state, setState] = useState<{ country: string; currency: BillingCurrency; isLoading: boolean }>(() => {
    const cached = readCache()
    return cached
      ? { country: cached.country, currency: cached.currency, isLoading: false }
      : { country: '', currency: 'USD', isLoading: true }
  })

  useEffect(() => {
    if (!state.isLoading) return // served from a fresh cache

    const controller = new AbortController()
    let cancelled = false

    detectCountry(controller.signal)
      .then((country) => {
        if (cancelled) return
        const currency = currencyForCountry(country)
        writeCache({ country, currency, timestamp: Date.now() })
        setState({ country, currency, isLoading: false })
      })
      .catch(() => {
        if (cancelled) return
        setState({ country: '', currency: 'USD', isLoading: false })
      })

    return () => {
      cancelled = true
      controller.abort()
    }
    // Detection runs once on mount; cache handles subsequent renders/visits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return state
}
