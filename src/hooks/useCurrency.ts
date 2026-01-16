import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'

type Currency = 'USD' | 'KSH' | 'EUR' | 'GBP' | 'UGX' | 'TZS' | 'NGN' | 'GHS' | 'ZAR' | 'RWF' | 'ETB'

const CURRENCY_CACHE_KEY = 'fahampesa_user_currency'
const COUNTRY_CACHE_KEY = 'fahampesa_user_country'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

interface CurrencyCache {
  currency: Currency
  country: string
  timestamp: number
  uid?: string
}

const DEFAULT_CURRENCY: Currency = 'USD'

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
  england: 'GB'
}

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
  GB: 'GBP'
}

const normalizeCountry = (value: string | undefined | null): string => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.length === 2) return trimmed.toUpperCase()
  const key = trimmed.toLowerCase()
  return COUNTRY_NAME_TO_CODE[key] || ''
}

const getCurrencyForCountry = (country: string): Currency => {
  if (!country) return DEFAULT_CURRENCY
  return COUNTRY_TO_CURRENCY[country] || DEFAULT_CURRENCY
}

/**
 * Custom hook to detect and cache user's currency based on IP location
 * - Kenya (KE) users get KSH
 * - All other countries get USD (default)
 * - Results are cached in localStorage for 7 days
 */
export function useCurrency() {
  const { user } = useAuth()
  const [currency, setCurrency] = useState<Currency>('USD')
  const [isLoading, setIsLoading] = useState(true)
  const [country, setCountry] = useState<string>('')

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        // Check localStorage cache first
        const cachedData = localStorage.getItem(CURRENCY_CACHE_KEY)
        if (cachedData) {
          const cache: CurrencyCache = JSON.parse(cachedData)
          const now = Date.now()
          const cacheUid = cache.uid
          
          // Use cache if it's still valid
          if (now - cache.timestamp < CACHE_DURATION && (!cacheUid || cacheUid === user?.uid)) {
            setCurrency(cache.currency)
            setCountry(cache.country)
            setIsLoading(false)
            return
          }
        }

        if (user) {
          const profileSnap = await getDoc(doc(db, 'userProfiles', user.uid))
          const profileData = profileSnap.exists() ? profileSnap.data() : null
          const rawCountry = (profileData?.country || profileData?.countryCode || '') as string
          const detectedCountry = normalizeCountry(rawCountry)
          const detectedCurrency = getCurrencyForCountry(detectedCountry)

          setCurrency(detectedCurrency)
          setCountry(detectedCountry)

          const cacheData: CurrencyCache = {
            currency: detectedCurrency,
            country: detectedCountry,
            timestamp: Date.now(),
            uid: user.uid
          }
          localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(cacheData))
          return
        }

        setCurrency(DEFAULT_CURRENCY)
        setCountry('')

        const cacheData: CurrencyCache = {
          currency: DEFAULT_CURRENCY,
          country: '',
          timestamp: Date.now()
        }
        localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(cacheData))
      } catch (error) {
        console.error('Currency detection failed, defaulting to USD:', error)
        // Default to USD on error
        setCurrency(DEFAULT_CURRENCY)
        setCountry('')
        
        // Cache the default
        const cacheData: CurrencyCache = {
          currency: DEFAULT_CURRENCY,
          country: '',
          timestamp: Date.now(),
          uid: user?.uid
        }
        localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(cacheData))
      } finally {
        setIsLoading(false)
      }
    }

    detectCurrency()
  }, [user])

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
