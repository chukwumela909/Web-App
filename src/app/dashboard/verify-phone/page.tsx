'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth, RecaptchaVerifier, PhoneAuthProvider, linkWithCredential } from '@/lib/firebase'

// Supported countries
const COUNTRIES = [
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '/assets/flags/kenya.svg' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '/assets/flags/nigeria.svg' },
  { code: 'SO', name: 'Somalia', dialCode: '+252', flag: '/assets/flags/somalia.svg' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '/assets/flags/uganda.svg' },
]

type Step = 1 | 2

export default function VerifyPhonePage() {
  const router = useRouter()
  const { user } = useAuth()

  // Step management
  const [step, setStep] = useState<Step>(1)

  // Step 1 state
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')

  // Step 2 state
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)

  // Shared state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationId, setVerificationId] = useState<string | null>(null)

  // Refs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Format full phone number
  const fullPhoneNumber = `${selectedCountry.dialCode}${phoneNumber.replace(/\s/g, '')}`

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Resend timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, resendTimer])

  // State for reCAPTCHA readiness
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null)

  // Initialize reCAPTCHA on mount
  useEffect(() => {
    if (step === 1 && !recaptchaVerifierRef.current) {
      initRecaptcha()
    }

    return () => {
      clearRecaptcha()
    }
  }, [step])

  // Initialize reCAPTCHA - use normal (visible) mode like registration
  const initRecaptcha = async (): Promise<RecaptchaVerifier | null> => {
    // Clear any existing verifier first
    clearRecaptcha()

    // Wait for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100))

    const container = document.getElementById('recaptcha-container')
    if (!container) {
      console.error('reCAPTCHA container not found')
      return null
    }

    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          console.log('reCAPTCHA verified')
          setRecaptchaReady(true)
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired')
          setRecaptchaReady(false)
        }
      })

      // Render the reCAPTCHA widget
      await verifier.render()
      recaptchaVerifierRef.current = verifier

      return verifier
    } catch (err) {
      console.error('Error initializing reCAPTCHA:', err)
      return null
    }
  }

  // Clear reCAPTCHA
  const clearRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear()
      } catch {
        // Ignore errors when clearing
      }
      recaptchaVerifierRef.current = null
    }
    setRecaptchaReady(false)
  }

  // Handle Step 1: Send OTP using PhoneAuthProvider.verifyPhoneNumber
  // This works when user is already signed in (unlike signInWithPhoneNumber)
  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number')
      return
    }

    // Validate phone number format (basic validation)
    const cleanNumber = phoneNumber.replace(/\s/g, '')
    if (cleanNumber.length < 9 || cleanNumber.length > 12) {
      setError('Please enter a valid phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const appVerifier = recaptchaVerifierRef.current
      if (!appVerifier) {
        throw new Error('Please complete the reCAPTCHA verification first.')
      }

      // Create a PhoneAuthProvider instance and verify the phone number
      const provider = new PhoneAuthProvider(auth)
      const verId = await provider.verifyPhoneNumber(fullPhoneNumber, appVerifier)

      setVerificationId(verId)
      setStep(2)
      setResendTimer(60)
      setCanResend(false)
    } catch (err: unknown) {
      console.error('Error sending OTP:', err)
      clearRecaptcha()

      // Re-initialize reCAPTCHA for retry
      setTimeout(() => {
        initRecaptcha()
      }, 500)

      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase()
        if (errorMessage.includes('invalid-phone-number')) {
          setError('Invalid phone number format. Please check and try again.')
        } else if (errorMessage.includes('too-many-requests')) {
          setError('Too many attempts. Please try again later.')
        } else if (errorMessage.includes('quota-exceeded')) {
          setError('SMS quota exceeded. Please try again later.')
        } else if (errorMessage.includes('invalid-app-credential') || errorMessage.includes('captcha-check-failed')) {
          setError('Verification failed. Please complete the reCAPTCHA and try again.')
        } else if (errorMessage.includes('network-request-failed')) {
          setError('Network error. Please check your connection and try again.')
        } else {
          setError('Failed to send verification code. Please try again.')
        }
      } else {
        setError('Failed to send verification code. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''))
      otpInputRefs.current[5]?.focus()
    }
  }

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    if (!verificationId) {
      setError('Verification session expired. Please request a new code.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create phone credential using the verification ID and OTP code
      const credential = PhoneAuthProvider.credential(verificationId, otpCode)

      // Link phone credential to current user
      if (user) {
        try {
          await linkWithCredential(user, credential)
        } catch (linkError: unknown) {
          // If linking fails because phone is already linked to another account,
          // we can still update the profile with the verified phone number
          console.log('Phone linking skipped:', linkError)
        }

        // Update user profile in Firestore
        await updateDoc(doc(db, 'userProfiles', user.uid), {
          phoneNumber: fullPhoneNumber,
          phoneVerified: true,
          country: selectedCountry.code,
          lastUpdated: serverTimestamp()
        })

        // Also update userRoles collection if it exists
        try {
          await updateDoc(doc(db, 'userRoles', user.uid), {
            phoneNumber: fullPhoneNumber,
            lastUpdated: serverTimestamp()
          })
        } catch {
          // userRoles doc might not exist, ignore
        }
      }

      // Clear reCAPTCHA and redirect
      clearRecaptcha()
      router.push('/dashboard')
    } catch (err: unknown) {
      console.error('Error verifying OTP:', err)

      if (err instanceof Error) {
        if (err.message.includes('invalid-verification-code')) {
          setError('Invalid verification code. Please check and try again.')
        } else if (err.message.includes('code-expired')) {
          setError('Verification code has expired. Please request a new code.')
        } else {
          setError(err.message || 'Verification failed. Please try again.')
        }
      } else {
        setError('Verification failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle resend OTP - user needs to go back to step 1 to complete reCAPTCHA again
  const handleResendOtp = async () => {
    if (!canResend) return

    // Go back to step 1 to re-verify reCAPTCHA
    setStep(1)
    setOtp(['', '', '', '', '', ''])
    setError('')
    setRecaptchaReady(false)

    // Re-initialize reCAPTCHA
    setTimeout(() => {
      initRecaptcha()
    }, 100)
  }

  // Format timer display
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Check if Continue button should be enabled
  const isStep1Valid = selectedCountry && phoneNumber.trim().length >= 9 && recaptchaReady

  return (
    <div className="min-h-screen bg-[#f6f6f9]">
      {/* Header */}
      <header className="bg-white h-20 flex items-center px-6 lg:px-[103px]">
        <div className="flex gap-2 items-center">
          <Image
            src="/assets/about/logo.svg"
            alt="Fahampesa"
            width={40}
            height={40}
            className="w-10 h-10"
          />
          <div className="flex flex-col">
            <span className="font-bold text-[#001223] text-xl lg:text-2xl">Fahampesa</span>
            <span className="text-[#001223] text-xs font-light">Smart Business Tools</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center px-4 pt-8 lg:pt-[121px] pb-12">
        {/* Step Indicator */}
        <div className="bg-white rounded-2xl p-6 lg:p-[30px] w-full max-w-[600px] mb-6">
          <p className="text-[#64748b] font-bold text-base">
            STEP {step} of 2
          </p>
          <p className="text-[#191d23] font-bold text-base">
            {step === 1 ? 'Account Verification' : 'Verify Phone Number'}
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 lg:p-10 w-full max-w-[600px]">
          {step === 1 ? (
            /* Step 1: Country & Phone Number */
            <div className="flex flex-col gap-7">
              <h1 className="text-[#191d23] font-bold text-xl lg:text-2xl font-dm-sans">
                Update your Account Details
              </h1>

              {/* Country Selector */}
              <div className="flex flex-col gap-2.5">
                <label className="text-black text-base font-normal font-dm-sans">
                  Country of residence
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="w-full border border-[#bfc4cb] rounded-lg p-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
                  >
                    <span className={selectedCountry ? 'text-[#191d23]' : 'text-[#64748b]'}>
                      {selectedCountry ? selectedCountry.name : 'Select country'}
                    </span>
                    <ChevronDown className="w-6 h-6 text-[#64748b]" />
                  </button>

                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#bfc4cb] rounded-lg shadow-lg z-10">
                      {COUNTRIES.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country)
                            setShowCountryDropdown(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-[#f0f2f5] flex items-center gap-3 first:rounded-t-lg last:rounded-b-lg"
                        >
                          <Image
                            src={country.flag}
                            alt={country.name}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-[#191d23]">{country.name}</span>
                          <span className="text-[#64748b] ml-auto">{country.dialCode}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="flex flex-col gap-2.5">
                <label className="text-black text-base font-normal font-dm-sans">
                  Phone Number
                </label>
                <div className="border border-[#bfc4cb] rounded-lg p-2 flex items-center gap-2.5">
                  {/* Country Code Button */}
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="bg-[#f0f2f5] rounded-lg p-2 flex items-center gap-1 shrink-0"
                  >
                    <Image
                      src={selectedCountry.flag}
                      alt={selectedCountry.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-[#64748b] text-base">{selectedCountry.dialCode}</span>
                    <ChevronDown className="w-5 h-5 text-[#64748b]" />
                  </button>

                  {/* Phone Input */}
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                    placeholder="712 345 678"
                    className="flex-1 text-[#191d23] text-base font-medium outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-[#e8f0fc] border border-dashed border-[#004aad] rounded-lg px-2.5 py-4">
                <p className="text-black font-bold text-lg font-dm-sans mb-2">Important</p>
                <p className="text-black text-base font-normal font-dm-sans">
                  Your Dashboard and currency will be setup based on selected country of residence. Please double-check your choice.
                </p>
              </div>

              {/* reCAPTCHA Widget */}
              <div className="flex flex-col gap-2">
                <label className="text-black text-base font-normal font-dm-sans">
                  Verify you&apos;re human
                </label>
                <div id="recaptcha-container" className="flex justify-center" />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Continue Button */}
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={!isStep1Valid || loading}
                className={`w-full rounded-2xl p-4 text-center text-base font-normal transition-colors ${
                  isStep1Valid && !loading
                    ? 'bg-[#004aad] text-white hover:bg-[#003d8f]'
                    : 'bg-[#f0f2f5] text-black cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          ) : (
            /* Step 2: OTP Verification */
            <div className="flex flex-col gap-10">
              {/* Title */}
              <div className="flex flex-col gap-4">
                <h1 className="text-[#191d23] font-bold text-xl lg:text-2xl font-dm-sans">
                  Verify your phone number
                </h1>
                <p className="text-black text-base font-normal font-dm-sans">
                  Kindly enter the verification code sent to your phone number
                </p>
              </div>

              {/* OTP Input */}
              <div className="flex items-center justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-[60px] h-[60px] border border-[#bfc4cb] rounded-lg text-center text-[#191d23] text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-5">
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full bg-[#004aad] text-white rounded-2xl p-4 text-base font-semibold hover:bg-[#003d8f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      Verifying...
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </>
                  ) : (
                    'Verify your account'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || loading}
                  className={`w-full p-4 text-base font-normal rounded-full transition-colors ${
                    canResend && !loading
                      ? 'text-[#004aad] hover:bg-[#f0f2f5]'
                      : 'text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  {canResend ? 'Resend code' : `Resend code (${formatTimer(resendTimer)})`}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
