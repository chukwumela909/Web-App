import { useState, useEffect } from 'react'

type Currency = 'KSH' | 'USD'

const CURRENCY_CACHE_KEY = 'fahampesa_user_currency'
const COUNTRY_CACHE_KEY = 'fahampesa_user_country'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

interface CurrencyCache {
  currency: Currency
  country: string
  timestamp: number
}

/**
 * Custom hook to detect and cache user's currency based on IP location
 * - Kenya (KE) users get KSH
 * - All other countries get USD (default)
 * - Results are cached in localStorage for 7 days
 */
export function useCurrency() {
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
          
          // Use cache if it's still valid
          if (now - cache.timestamp < CACHE_DURATION) {
            setCurrency(cache.currency)
            setCountry(cache.country)
            setIsLoading(false)
            return
          }
        }

        // Fetch fresh location data
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        
        const detectedCountry = data.country_code || ''
        const detectedCurrency: Currency = detectedCountry === 'KE' ? 'KSH' : 'USD'

        // Update state
        setCurrency(detectedCurrency)
        setCountry(detectedCountry)

        // Cache the result
        const cacheData: CurrencyCache = {
          currency: detectedCurrency,
          country: detectedCountry,
          timestamp: Date.now()
        }
        localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(cacheData))

        console.log(`Currency detected: ${detectedCurrency} (Country: ${detectedCountry})`)
      } catch (error) {
        console.error('Currency detection failed, defaulting to USD:', error)
        // Default to USD on error
        setCurrency('USD')
        setCountry('')
        
        // Cache the default
        const cacheData: CurrencyCache = {
          currency: 'USD',
          country: '',
          timestamp: Date.now()
        }
        localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(cacheData))
      } finally {
        setIsLoading(false)
      }
    }

    detectCurrency()
  }, [])

  return { currency, isLoading, country }
}

/**
 * Utility function to format currency display
 */
export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString()}`
  }
  return `KSH ${amount.toLocaleString()}`
}

/**
 * Utility function to get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return currency === 'USD' ? '$' : 'KSH'
}
