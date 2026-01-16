import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'

type Currency = 'USD' | 'KSH' | 'EUR' | 'GBP' | 'UGX' | 'TZS' | 'NGN' | 'GHS' | 'ZAR' | 'RWF' | 'ETB'

const CURRENCY_CACHE_KEY = 'fahampesa_user_currency'

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
  KE: 'KSH',
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

/**
 * Custom hook to detect user's currency based on their profile country
 * - Fetches from userProfiles Firestore document
 * - Uses real-time listener for updates
 * - Caches result per user
 */
export function useCurrency() {
  const { user } = useAuth()
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
        const cachedData = localStorage.getItem(CURRENCY_CACHE_KEY)
        if (cachedData) {
          try {
            const cache: CurrencyCache = JSON.parse(cachedData)
            if (cache.uid !== user.uid) {
              console.log('[useCurrency] Clearing old cache for different user')
              localStorage.removeItem(CURRENCY_CACHE_KEY)
            }
          } catch {
            localStorage.removeItem(CURRENCY_CACHE_KEY)
          }
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

    // Try to load from cache first for immediate display
    const cachedData = localStorage.getItem(CURRENCY_CACHE_KEY)
    if (cachedData) {
      try {
        const cache: CurrencyCache = JSON.parse(cachedData)
        if (cache.uid === user.uid) {
          console.log('[useCurrency] Using cached currency:', cache)
          setCurrency(cache.currency)
          setCountry(cache.country)
        }
      } catch {
        // Ignore cache parse errors
      }
    }

    // Set up real-time listener for profile changes
    console.log('[useCurrency] Setting up listener for user:', user.uid)
    const unsubscribe = onSnapshot(
      doc(db, 'userProfiles', user.uid),
      (snapshot) => {
        const profileData = snapshot.exists() ? snapshot.data() : null
        console.log('[useCurrency] Profile data received:', profileData)
        
        const rawCountry = (profileData?.country || profileData?.countryCode || '') as string
        console.log('[useCurrency] Raw country from profile:', rawCountry)
        
        const detectedCountry = normalizeCountry(rawCountry)
        const detectedCurrency = getCurrencyForCountry(detectedCountry)

        console.log('[useCurrency] Detected:', { country: detectedCountry, currency: detectedCurrency })

        setCurrency(detectedCurrency)
        setCountry(detectedCountry)
        setIsLoading(false)

        // Update cache
        const cacheData: CurrencyCache = {
          currency: detectedCurrency,
          country: detectedCountry,
          timestamp: Date.now(),
          uid: user.uid
        }
        localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(cacheData))
      },
      (error) => {
        console.error('[useCurrency] Error listening to profile:', error)
        setCurrency(DEFAULT_CURRENCY)
        setCountry('')
        setIsLoading(false)
      }
    )

    return () => {
      console.log('[useCurrency] Cleaning up listener')
      unsubscribe()
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
  const currency = typeof input === 'string' ? input : input.currency
  switch (currency) {
    case 'USD':
      return '$'
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
