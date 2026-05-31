import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getBusinessProfile } from '@/lib/firestore'

type Currency = 'USD' | 'KES' | 'KSH' | 'EUR' | 'GBP' | 'UGX' | 'TZS' | 'NGN' | 'GHS' | 'ZAR' | 'RWF' | 'ETB'

export const CURRENCY_CACHE_KEY = 'fahampesa_user_currency'
export const CURRENCY_UPDATED_EVENT = 'fahampesa:currency-updated'

interface CurrencyCache {
  currency: Currency
  country: string
  timestamp: number
  uid: string
}

const DEFAULT_CURRENCY: Currency = 'USD'

// Map country names (lowercase) to ISO codes
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  kenya: 'KE',
  uganda: 'UG',
  tanzania: 'TZ',
  nigeria: 'NG',
  ghana: 'GH',
  'south africa': 'ZA',
  rwanda: 'RW',
  ethiopia: 'ET',
  'united states': 'US',
  usa: 'US',
  'united kingdom': 'GB',
  uk: 'GB',
  england: 'GB',
  somalia: 'SO'
}

// Map ISO country codes to currencies
const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
  KE: 'KES',
  UG: 'UGX',
  TZ: 'TZS',
  NG: 'NGN',
  GH: 'GHS',
  ZA: 'ZAR',
  RW: 'RWF',
  ET: 'ETB',
  US: 'USD',
  GB: 'GBP',
  SO: 'USD' // Somalia uses USD commonly
}

/**
 * Normalize country input to ISO 2-letter code
 * Handles both country codes (e.g., "NG") and full names (e.g., "Nigeria")
 */
const normalizeCountry = (value: string | undefined | null): string => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  
  // If it's already a 2-letter code, return it uppercase
  if (trimmed.length === 2) return trimmed.toUpperCase()
  
  // Try to match by name (case-insensitive)
  const key = trimmed.toLowerCase()
  const code = COUNTRY_NAME_TO_CODE[key]
  
  console.log('[useCurrency] Normalizing country:', { input: value, normalized: code || '' })
  return code || ''
}

const getCurrencyForCountry = (countryCode: string): Currency => {
  if (!countryCode) return DEFAULT_CURRENCY
  const currency = COUNTRY_TO_CURRENCY[countryCode]
  console.log('[useCurrency] Getting currency for country:', { countryCode, currency: currency || DEFAULT_CURRENCY })
  return currency || DEFAULT_CURRENCY
}

const normalizeCurrency = (value: unknown): Currency | '' => {
  if (typeof value !== 'string') return ''
  const normalized = value.trim().toUpperCase()
  if (!normalized) return ''
  if (normalized === 'KSH') return 'KES'
  return normalized as Currency
}

const readCurrencyCache = (): CurrencyCache | null => {
  if (typeof window === 'undefined') return null

  const cachedData = localStorage.getItem(CURRENCY_CACHE_KEY)
  if (!cachedData) return null

  try {
    return JSON.parse(cachedData) as CurrencyCache
  } catch {
    localStorage.removeItem(CURRENCY_CACHE_KEY)
    return null
  }
}

const writeCurrencyCache = (cacheData: CurrencyCache) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(cacheData))
}

export function cacheUserCurrency(uid: string, currencyInput: unknown, country = '') {
  const currency = normalizeCurrency(currencyInput)
  if (!uid || !currency || typeof window === 'undefined') return

  const existing = readCurrencyCache()
  const cacheData: CurrencyCache = {
    currency,
    country: country || (existing?.uid === uid ? existing.country : ''),
    timestamp: Date.now(),
    uid
  }

  writeCurrencyCache(cacheData)
  window.dispatchEvent(new CustomEvent<CurrencyCache>(CURRENCY_UPDATED_EVENT, { detail: cacheData }))
}

/**
 * Custom hook to detect user's currency based on their profile country
 * - Fetches from userProfiles Firestore document
 * - Uses real-time listener for updates
 * - Caches result per user
 */
export function useCurrency() {
  const { user, backendSession } = useAuth()
  const [currency, setCurrency] = useState<Currency>('USD')
  const [isLoading, setIsLoading] = useState(true)
  const [country, setCountry] = useState<string>('')
  const previousUidRef = useRef<string | null>(null)

  useEffect(() => {
    // Clear cache and reset if user changed
    if (user?.uid !== previousUidRef.current) {
      console.log('[useCurrency] User changed:', { from: previousUidRef.current, to: user?.uid })
      previousUidRef.current = user?.uid || null
      
      // Clear old cache when user changes
      if (user?.uid) {
        const cache = readCurrencyCache()
        if (cache && cache.uid !== user.uid) {
          console.log('[useCurrency] Clearing old cache for different user')
          localStorage.removeItem(CURRENCY_CACHE_KEY)
        }
      }
    }

    if (!user) {
      console.log('[useCurrency] No user, using default currency')
      setCurrency(DEFAULT_CURRENCY)
      setCountry('')
      setIsLoading(false)
      return
    }

    let cancelled = false

    // Try to load from cache first for immediate display
    const cache = readCurrencyCache()
    const userCache = cache?.uid === user.uid ? cache : null
    if (userCache) {
      console.log('[useCurrency] Using cached currency:', userCache)
      setCurrency(userCache.currency)
      setCountry(userCache.country)
    }

    const statusData = backendSession?.onboardingStatus?.data as any
    const rawCountry = statusData?.businessProfile?.country || statusData?.business?.country || ''
    const rawCurrency = statusData?.businessProfile?.currency || statusData?.business?.currency || ''
    const detectedCountry = normalizeCountry(rawCountry)
    const detectedCurrency = normalizeCurrency(rawCurrency) || getCurrencyForCountry(detectedCountry)

    const applyCurrency = (nextCurrency: Currency, nextCountry: string) => {
      if (cancelled) return
      setCurrency(nextCurrency)
      setCountry(nextCountry)
      setIsLoading(false)
      writeCurrencyCache({
        currency: nextCurrency,
        country: nextCountry,
        timestamp: Date.now(),
        uid: user.uid
      })
    }

    applyCurrency(userCache?.currency || detectedCurrency as Currency, userCache?.country || detectedCountry)

    const loadSavedBusinessCurrency = async () => {
      try {
        const profile = await getBusinessProfile(user.uid)
        const savedCurrency = normalizeCurrency(profile?.currency)
        if (savedCurrency) {
          applyCurrency(savedCurrency, detectedCountry)
        }
      } catch (error) {
        console.warn('[useCurrency] Unable to load saved business currency:', error)
      }
    }

    loadSavedBusinessCurrency()

    return () => {
      cancelled = true
    }
  }, [user?.uid, backendSession])

  useEffect(() => {
    if (!user || typeof window === 'undefined') return

    const applyCache = (cache: CurrencyCache | null) => {
      if (!cache || cache.uid !== user.uid) return
      setCurrency(normalizeCurrency(cache.currency) || DEFAULT_CURRENCY)
      setCountry(cache.country)
      setIsLoading(false)
    }

    const handleCurrencyUpdated = (event: Event) => {
      applyCache((event as CustomEvent<CurrencyCache>).detail)
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CURRENCY_CACHE_KEY) return
      applyCache(readCurrencyCache())
    }

    window.addEventListener(CURRENCY_UPDATED_EVENT, handleCurrencyUpdated)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(CURRENCY_UPDATED_EVENT, handleCurrencyUpdated)
      window.removeEventListener('storage', handleStorage)
    }
  }, [user?.uid])

  return { currency, isLoading, country }
}

/**
 * Utility function to format currency display
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = getCurrencySymbol(currency)
  return `${symbol} ${amount.toLocaleString()}`
}

/**
 * Utility function to get currency symbol
 */
export function getCurrencySymbol(input: Currency | { currency: Currency } | string): string {
  const currency = normalizeCurrency(typeof input === 'string' ? input : input.currency)
  switch (currency) {
    case 'USD':
      return '$'
    case 'KES':
    case 'KSH':
      return 'KSh'
    case 'EUR':
      return '€'
    case 'GBP':
      return '£'
    case 'UGX':
      return 'USh'
    case 'TZS':
      return 'TSh'
    case 'NGN':
      return '₦'
    case 'GHS':
      return 'GH₵'
    case 'ZAR':
      return 'R'
    case 'RWF':
      return 'RF'
    case 'ETB':
      return 'Br'
    default:
      return '$'
  }
}
