import { useEffect, useState } from 'react'

/**
 * Detects the visiting (possibly anonymous) user's subscription currency and
 * payment gateway from their IP location, via the `/api/geo` endpoint.
 *
 * Unlike `useCurrency`, this does NOT require the user to be logged in or
 * onboarded — it's meant for public, pre-signup surfaces such as the pricing
 * page where we want Kenyan visitors to see KSH (and M-Pesa) automatically.
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

export function usePublicCurrency() {
  const [geo, setGeo] = useState<GeoCurrency>(DEFAULT_GEO)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // Hydrate instantly from cache so the price doesn't visibly "flip".
    const cached = readCache()
    if (cached) {
      setGeo(cached)
      setIsLoading(false)
    }

    fetch('/api/geo')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: GeoCurrency | null) => {
        if (cancelled || !data?.currency) return
        setGeo(data)
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))
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
    }
  }, [])

  return { ...geo, isLoading }
}
