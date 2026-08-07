'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { authedFetch } from '@/lib/authed-fetch'
import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'
import Image from 'next/image'

const countries = [
  { code: 'KE', name: 'Kenya', dial_code: '+254', flag: '🇰🇪' },
  { code: 'NG', name: 'Nigeria', dial_code: '+234', flag: '🇳🇬' },
  { code: 'SO', name: 'Somalia', dial_code: '+252', flag: '🇸🇴' },
  { code: 'UG', name: 'Uganda', dial_code: '+256', flag: '🇺🇬' },
]

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
  const [selectedCountry, setSelectedCountry] = useState<typeof countries[0] | null>(null)
  const [showCountrySelect, setShowCountrySelect] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    phoneNumber: '',
    otp: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { 
    login, 
    register, 
    resetPassword, 
    user, 
    isSuperAdmin, 
    loading, 
    roleLoading,
    backendSession,
    backendSessionLoading,
    sendOtp,
    verifyOtp,
    sendLoginOtp,
    verifyLoginOtp,
    verificationId,
    setPendingRegistration,
    clearRecaptcha,
    logout
  } = useAuth()
  const { staff, hasPermission, loading: staffLoading } = useStaff()
  const router = useRouter()
  
  // Phone login state
  const [loginPhoneStep, setLoginPhoneStep] = useState<'phone' | 'otp'>('phone')
  const [loginPhoneNumber, setLoginPhoneNumber] = useState('')

  // Only auto-redirect after the user actively signs in on this page (or explicitly
  // chooses to continue with the existing session). A leftover Firebase session must
  // not lock visitors out of the login form.
  const [authSubmitted, setAuthSubmitted] = useState(false)

  // Smart redirect logic - wait for auth data to load
  React.useEffect(() => {
    if (loading || roleLoading || backendSessionLoading || !user) return
    if (!authSubmitted) return

    // During signup, let the registration handler route to onboarding after OTP verification.
    if (!isLogin) return

    if (isSuperAdmin) {
      console.log('Redirecting super admin to /super-admin')
      router.push('/super-admin')
      return
    }

    if (backendSession?.onboardingStatus && !backendSession.onboardingStatus.hasBusiness) {
      console.log('Redirecting owner without business to /onboarding')
      router.push('/onboarding')
      return
    }

    // Check if user is a staff member by trying to fetch their staff data.
    checkStaffStatus()
  }, [user, isSuperAdmin, loading, roleLoading, backendSessionLoading, backendSession, isLogin, authSubmitted, router])

  const checkStaffStatus = async () => {
    try {
      const response = await authedFetch(`/api/admin/staff/${user?.uid}`)
      const data = await response.json()
      
      if (data.success) {
        // User is a staff member, redirect to staff dashboard
        console.log('Redirecting staff member to /staff-dashboard')
        router.push('/staff-dashboard')
      } else {
        // User is not a legacy staff member. Invited cashiers (backend role) go straight
        // to the sales page — they have no access to the dashboard home.
        if (backendSession?.onboardingStatus && !backendSession.onboardingStatus.hasBusiness) {
          console.log('Redirecting owner without business to /onboarding')
          router.push('/onboarding')
        } else if (String(backendSession?.role ?? '').toLowerCase() === 'cashier') {
          console.log('Redirecting cashier to /dashboard/sales')
          router.push('/dashboard/sales')
        } else {
          console.log('Redirecting regular user to /dashboard')
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error checking staff status:', error)
      if (backendSession?.onboardingStatus?.hasBusiness === false) {
        router.push('/onboarding')
      } else if (String(backendSession?.role ?? '').toLowerCase() === 'cashier') {
        router.push('/dashboard/sales')
      } else {
        router.push('/dashboard')
      }
    }
  }

  const [timer, setTimer] = useState(52)

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      clearRecaptcha()
    }
  }, [clearRecaptcha])

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout
    if ((step === 4 || loginPhoneStep === 'otp') && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, loginPhoneStep, timer])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1]
    if (!/^\d*$/.test(value)) return

    const currentOtp = formData.otp.padEnd(6, ' ').split('')
    currentOtp[index] = value
    const newOtp = currentOtp.join('')
    
    setFormData(prev => ({ ...prev, otp: newOtp }))
    
    if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        nextInput?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && (!formData.otp[index] || formData.otp[index] === ' ') && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`)
        prevInput?.focus()
    }
  }

    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        lowercase: false,
        uppercase: false,
        special: false,
        number: false
    })

    const checkPasswordRequirements = (pass: string) => {
        setPasswordRequirements({
            length: pass.length >= 8,
            lowercase: /[a-z]/.test(pass),
            uppercase: /[A-Z]/.test(pass),
            special: /[!#$%&*+,\-./:;<>=?@^_|~]/.test(pass),
            number: /[0-9]/.test(pass)
        })
    }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'password') {
        checkPasswordRequirements(value)
    }
  }

  const validateForm = () => {
    // Phone login validation
    if (isLogin && loginMethod === 'phone') {
        if (loginPhoneStep === 'phone') {
            if (!loginPhoneNumber.trim()) {
                setError('Phone number is required')
                return false
            }
            return true
        }
        if (loginPhoneStep === 'otp') {
            if (formData.otp.replace(/ /g, '').length !== 6) {
                setError('Please enter the 6-digit verification code')
                return false
            }
            return true
        }
    }

    // For forgot password, only email validation is needed
    if (isForgotPassword) {
        if (!formData.email.trim()) {
            setError('Email address is required')
            return false
        }
        return true
    }

    if (isLogin) {
        if (!formData.email.trim()) {
            setError('Email address is required')
            return false
        }
        if (!formData.password.trim()) {
            setError('Password is required')
            return false
        }
        return true
    }

    // Registration Validation
    if (!isLogin) {
        if (step === 1) {
            if (!selectedCountry) {
                setError('Please select a country')
                return false
            }
            return true
        }
        
        if (step === 2) {
            if (!formData.businessName.trim()) {
                setError('Business name is required')
                return false
            }
            if (!formData.email.trim()) {
                setError('Email address is required')
                return false
            }
            if (!formData.phoneNumber.trim()) {
                setError('Phone number is required')
                return false
            }
            return true
        }

        if (step === 3) {
            if (!passwordRequirements.length || 
                !passwordRequirements.lowercase || 
                !passwordRequirements.uppercase || 
                !passwordRequirements.special || 
                !passwordRequirements.number) {
                setError('Please meet all password requirements')
                return false
            }

            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match')
                return false
            }
            return true
        }

        if (step === 4) {
            if (formData.otp.replace(/ /g, '').length !== 6) {
                setError('Please enter the 6-digit verification code')
                return false
            }
            return true
        }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setFormLoading(false)
      return
    }

    try {
      if (isForgotPassword) {
        await resetPassword(formData.email)
        setSuccess('Password reset email sent! Check your inbox for instructions.')
        setTimeout(() => {
          setIsForgotPassword(false)
          setIsLogin(true)
          setSuccess('')
        }, 3000)
      } else if (isLogin) {
        // Phone Login Flow
        if (loginMethod === 'phone') {
          if (loginPhoneStep === 'phone') {
            // Send OTP for phone login
            const cleanedPhone = loginPhoneNumber.replace(/^0+/, '').replace(/[\s-]/g, '')
            const fullPhoneNumber = (selectedCountry?.dial_code || '+254') + cleanedPhone
            console.log('Sending login OTP to:', fullPhoneNumber) // Debug log
            await sendLoginOtp(fullPhoneNumber)
            setLoginPhoneStep('otp')
            setTimer(52)
            setFormLoading(false)
            return
          }
          if (loginPhoneStep === 'otp') {
            // Verify OTP and login
            await verifyLoginOtp(formData.otp.replace(/ /g, ''))
            setAuthSubmitted(true)
            // useEffect will handle redirect
          }
        } else {
          // Email login
          await login(formData.email, formData.password)
          setAuthSubmitted(true)
          // The useEffect above will handle the redirect once auth context updates
        }
      } else {
        // Registration Flow
        if (step === 1) {
            setStep(2)
            setFormLoading(false)
            return
        }
        if (step === 2) {
            setStep(3)
            setFormLoading(false)
            return
        }
        if (step === 3) {
            // Store pending registration data and send OTP
            // Clean phone number: remove leading zeros and any spaces/dashes
            const cleanedPhone = formData.phoneNumber.replace(/^0+/, '').replace(/[\s-]/g, '')
            const fullPhoneNumber = (selectedCountry?.dial_code || '+254') + cleanedPhone
            console.log('Sending OTP to:', fullPhoneNumber) // Debug log
            setPendingRegistration({
              email: formData.email,
              password: formData.password,
              businessName: formData.businessName,
              phoneNumber: fullPhoneNumber,
              country: selectedCountry?.name || 'Kenya'
            })
            await sendOtp(fullPhoneNumber)
            setStep(4)
            setTimer(52)
            setFormLoading(false)
            return
        }
        
        // Step 4: Verify OTP and complete registration
        await verifyOtp(formData.otp.replace(/ /g, ''))
        // Immediately redirect to onboarding wizard after successful registration
        router.push('/onboarding')
      }
    } catch (error: unknown) {
      console.error('Authentication error:', error)
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : ''
      const errorMessage = error instanceof Error ? error.message : ''
      setError(getErrorMessage(errorCode, errorMessage))
    } finally {
      if (isLogin || isForgotPassword || step > 2) {
          setFormLoading(false)
      }
    }
  }

  const getErrorMessage = (errorCode: string, errorMessage?: string) => {
    // Check for custom error messages first
    if (errorMessage && !errorCode) {
      return errorMessage
    }
    
    switch (errorCode) {
      case 'auth/user-not-found':
        return isForgotPassword 
          ? 'No account found with this email address.'
          : 'No account found with this email address.'
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.'
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your details and try again.'
      case 'auth/invalid-email':
        return 'Invalid email address format.'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.'
      case 'auth/user-disabled':
        return 'This account has been disabled.'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.'
      // Phone auth specific errors
      case 'auth/invalid-phone-number':
        return 'Invalid phone number format. Please enter a valid number (e.g., 712345678).'
      case 'auth/missing-phone-number':
        return 'Phone number is required.'
      case 'auth/quota-exceeded':
        return 'SMS quota exceeded. Please try again later.'
      case 'auth/captcha-check-failed':
        return 'reCAPTCHA verification failed. Please refresh the page and try again.'
      case 'auth/invalid-verification-code':
        return 'Invalid verification code. Please check and try again.'
      case 'auth/code-expired':
        return 'Verification code has expired. Please request a new one.'
      case 'auth/credential-already-in-use':
        return 'This phone number is already linked to another account.'
      case 'auth/provider-already-linked':
        return 'Phone number already linked to this account.'
      case 'auth/internal-error':
        return 'An error occurred sending the verification code. Please check your phone number format and try again.'
      case 'auth/invalid-app-credential':
        return 'Phone verification failed. Please refresh the page and try again.'
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.'
      default:
        if (errorMessage?.startsWith('Firebase: Error')) {
          return isLogin
            ? 'Login failed. Please check your credentials and try again.'
            : 'Registration failed. Please check your details and try again.'
        }
        if (errorMessage) return errorMessage
        if (isForgotPassword) {
          return 'Failed to send password reset email. Please try again.'
        }
        return isLogin 
          ? 'Login failed. Please check your credentials and try again.'
          : 'Registration failed. Please try again.'
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setIsForgotPassword(false)
    setStep(1)
    setLoginPhoneStep('phone')
    setLoginPhoneNumber('')
    setError('')
    setSuccess('')
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      phoneNumber: '',
      otp: ''
    })
  }

  const switchToForgotPassword = () => {
    setIsForgotPassword(true)
    setIsLogin(true) // Keep login mode logic but show forgot password form
    setError('')
    setSuccess('')
    setFormData({
      email: formData.email, // Keep email if already entered
      password: '',
      confirmPassword: '',
      businessName: '',
      phoneNumber: '',
      otp: ''
    })
  }

  const switchToLogin = () => {
    setIsForgotPassword(false)
    setIsLogin(true)
    setError('')
    setSuccess('')
  }
  const isFormValid = () => {
    if (isForgotPassword) return !!formData.email.trim()

    if (isLogin) {
        if (loginMethod === 'email') return !!formData.email.trim() && !!formData.password.trim()
        if (loginMethod === 'phone') {
            if (loginPhoneStep === 'phone') return !!loginPhoneNumber.trim()
            if (loginPhoneStep === 'otp') return formData.otp.replace(/ /g, '').length === 6
        }
    } else {
        // Registration
        if (step === 1) {
            return !!selectedCountry
        }
        if (step === 2) {
            return !!formData.businessName.trim() && !!formData.email.trim() && !!formData.phoneNumber.trim()
        }
        if (step === 3) {
             return !!formData.password && !!formData.confirmPassword && 
                    passwordRequirements.length && passwordRequirements.lowercase && 
                    passwordRequirements.uppercase && passwordRequirements.special && 
                    passwordRequirements.number && formData.password === formData.confirmPassword
        }
        if (step === 4) {
            return formData.otp.replace(/ /g, '').length === 6
        }
    }
    
    return true
  }
  return (
    <div className="min-h-screen bg-[#f6f6f9] relative flex flex-col items-center justify-center font-dm-sans overflow-x-hidden">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 h-[80px] bg-white px-4 md:px-[100px] flex items-center justify-between border-b border-gray-100 z-10">
            <div className="flex items-center gap-[7px]">
                {/* Logo */}
                <div className="w-[32px] h-[32px] relative shrink-0">
                    <Image src="/assets/figma/landing/logo-icon.svg" alt="FahamPesa" fill className="object-contain" />
                </div>
                <div className="flex flex-col">
                    <span className="font-roboto font-bold text-[20px] text-[#001223] leading-none">Fahampesa</span>
                    <span className="font-inter font-light text-[10px] text-[#001223]">Smart Business Tools</span>
                </div>
            </div>
            
            <div className="text-[14px] flex items-center gap-1">
                <span className="text-[#64748b] hidden md:inline">
                    {isLogin ? "New to Fahampesa?" : "Got an account?"}
                </span>
                <button 
                    onClick={isLogin ? toggleMode : switchToLogin}
                    className="font-semibold text-[#004aad] hover:underline"
                >
                    {isLogin ? "Sign Up" : "Sign In"}
                </button>
            </div>
        </header>

        {/* Step Indicator Card (Sign Up Only) */}
        {!isLogin && !isForgotPassword && (
            <div className="bg-white rounded-[16px] p-[30px] w-full max-w-[600px] mt-[100px] mx-4 mb-[24px] flex flex-col gap-[4px] animate-in fade-in zoom-in-95 duration-300">
                <span className="text-[#64748b] text-[12px] font-bold tracking-wider uppercase">STEP {step} of 4</span>
                <span className="text-[#191d23] text-[16px] font-bold">
                    {step === 1 ? 'Welcome to Fahampesa' : (step === 2 ? 'Basic Information' : (step === 3 ? 'Set Password' : 'Verify Phone Number'))}
                </span>
            </div>
        )}

        {/* Main Card */}
        <div className={`bg-white rounded-[16px] p-[30px] w-full max-w-[600px] mx-4 flex flex-col gap-[29px] animate-in fade-in zoom-in-95 duration-300 ${!isLogin && !isForgotPassword ? '' : 'mt-[100px]'}`}>
            {/* Title Section */}
            <div>
                <h1 className="font-bold text-[24px] text-[#191d23]">
                    {isForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back!' : (step === 2 ? 'Set up your account' : (step === 3 ? 'Set Password' : (step === 4 ? 'Verify your phone number' : 'Create your Fahampesa Account'))))}
                </h1>
                {(isLogin || isForgotPassword) && (
                    <p className="text-[16px] text-[#64748b] mt-1">
                        {isForgotPassword 
                            ? 'Enter your email to reset password' 
                            : 'Login with Email or Phone Number'}
                    </p>
                )}
                {!isLogin && !isForgotPassword && step === 4 && (
                    <p className="text-[16px] text-[#64748b] mt-1">
                        Kindly enter the verification code sent to your phone number
                    </p>
                )}
            </div>

            {/* Existing session notice - let the user choose instead of force-redirecting */}
            {user && !authSubmitted && !loading && isLogin && !isForgotPassword && (
                <div className="bg-[#eef4ff] border border-[#c7dbff] rounded-[8px] p-4 flex flex-col gap-3">
                    <p className="text-[14px] text-[#191d23]">
                        You&apos;re already signed in{user.email || user.phoneNumber ? ` as ${user.email || user.phoneNumber}` : ''}.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            type="button"
                            onClick={() => setAuthSubmitted(true)}
                            className="flex-1 bg-[#004aad] text-white text-[14px] font-semibold rounded-[8px] px-4 py-2.5 hover:bg-[#003c8c] transition-colors"
                        >
                            Continue to dashboard
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    await logout()
                                } catch (err) {
                                    console.error('Error signing out:', err)
                                    setError('Could not sign out. Please try again.')
                                }
                            }}
                            className="flex-1 bg-white border border-[#e4e4e7] text-[#191d23] text-[14px] font-semibold rounded-[8px] px-4 py-2.5 hover:bg-[#f4f4f5] transition-colors"
                        >
                            Use a different account
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle (Only show for Login/Register, not Forgot Password) */}
            {!isForgotPassword && isLogin && (
                <div className="bg-[#f4f4f5] p-[5px] rounded-[8px] flex gap-[16px] h-[50px] relative">
                    {/* Animated Background Pill */}
                    <motion.div
                        className="absolute top-[5px] bottom-[5px] bg-white rounded-[8px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]"
                        initial={false}
                        animate={{
                            left: loginMethod === 'email' ? '5px' : 'calc(50% + 8px)',
                            width: 'calc(50% - 13px)'
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    
                    <button 
                        onClick={() => setLoginMethod('email')}
                        className={`flex-1 rounded-[8px] text-[16px] font-semibold z-10 transition-colors duration-200 ${
                            loginMethod === 'email' 
                            ? 'text-black' 
                            : 'text-[#717171] hover:text-black'
                        }`}
                    >
                        Email
                    </button>
                    <button 
                        onClick={() => setLoginMethod('phone')}
                        className={`flex-1 rounded-[8px] text-[16px] font-semibold z-10 transition-colors duration-200 ${
                            loginMethod === 'phone' 
                            ? 'text-black' 
                            : 'text-[#717171] hover:text-black'
                        }`}
                    >
                        Phone Number
                    </button>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-[20px] w-full">
                {/* Error/Success Messages */}
                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"
                        >
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {/* Registration Step 1: Country Only */}
                    {!isLogin && !isForgotPassword && step === 1 && (
                        <motion.div
                            key="register-step-1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-[24px]"
                        >
                            {/* Country Selector */}
                            <div className="flex flex-col gap-[8px]">
                                <label className="text-[16px] text-[#191d23] font-normal">Country of residence</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowCountrySelect(!showCountrySelect)}
                                        className="w-full login-input-wrapper border border-[#bfc4cb] rounded-[8px] p-[16px] flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {selectedCountry ? (
                                                <>
                                                    <span className="text-[24px] leading-none">{selectedCountry.flag}</span>
                                                    <span className="text-[#191d23] text-[16px]">{selectedCountry.name}</span>
                                                </>
                                            ) : (
                                                <span className="text-[#64748b] text-[16px]">Select country</span>
                                            )}
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-[#64748b] transition-transform ${showCountrySelect ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Backdrop for click outside */}
                                    {showCountrySelect && (
                                        <div 
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowCountrySelect(false)}
                                        />
                                    )}

                                    {/* Dropdown */}
                                    <AnimatePresence>
                                        {showCountrySelect && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[10px] shadow-[0px_4px_50px_0px_rgba(0,0,0,0.1)] border border-[#bfc4cb] p-[10px] z-50 flex flex-col gap-[10px]"
                                            >
                                                {countries.map((country) => (
                                                    <button
                                                        key={country.code}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCountry(country)
                                                            setShowCountrySelect(false)
                                                        }}
                                                        className={`w-full p-[16px] flex items-center gap-[10px] rounded-[8px] border transition-colors text-left
                                                            ${selectedCountry?.code === country.code 
                                                                ? 'bg-[#e8f0fc] border-[#64748b]' 
                                                                : 'bg-white border-[#edf4fe] hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <span className={`text-[16px] flex-1 ${selectedCountry?.code === country.code ? 'text-[#191d23]' : 'text-[#64748b]'}`}>
                                                            {country.name}
                                                        </span>
                                                        <div className={`w-[20px] h-[20px] rounded-full border flex items-center justify-center
                                                            ${selectedCountry?.code === country.code 
                                                                ? 'border-[#004aad] bg-[#004aad]' 
                                                                : 'border-[#cbd5e1] bg-white'
                                                            }`}
                                                        >
                                                            {selectedCountry?.code === country.code && (
                                                                <div className="w-[8px] h-[8px] rounded-full bg-white" />
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Important Info Box */}
                            <div className="bg-[#EBF5FF] border border-dashed border-[#004AAD] rounded-[8px] p-[16px] flex gap-[12px] items-start">
                                <div className="w-[20px] h-[20px] rounded-full bg-[#004AAD] text-white flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[12px] font-bold italic">i</span>
                                </div>
                                <div className="flex flex-col gap-[4px]">
                                    <span className="text-[#191d23] text-[14px] font-bold">Important</span>
                                    <p className="text-[#191d23] text-[14px] leading-[20px]">
                                        The documents you can use for verification depend only on your selected country of residence. Please double-check your choice.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Registration Step 2: Basic Info */}
                    {!isLogin && !isForgotPassword && step === 2 && (
                        <motion.div
                            key="register-step-2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-[24px]"
                        >
                            {/* Business Name */}
                            <div className="flex flex-col gap-[8px]">
                                <label className="text-[16px] text-[#191d23] font-normal">Business Name</label>
                                <div className="login-input-wrapper border border-[#bfc4cb] rounded-[8px] p-[16px] flex items-center bg-white">
                                    <input 
                                        name="businessName"
                                        value={formData.businessName}
                                        onChange={handleInputChange}
                                        placeholder="Enter your business name"
                                        className="login-input flex-1 text-[#191d23] text-[16px] placeholder:text-[#64748b] bg-transparent border-0 p-0 m-0"
                                        style={{ outline: 'none', boxShadow: 'none' }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email Address */}
                            <div className="flex flex-col gap-[8px]">
                                <label className="text-[16px] text-[#191d23] font-normal">Email Address</label>
                                <div className="login-input-wrapper border border-[#bfc4cb] rounded-[8px] p-[16px] flex items-center bg-white">
                                    <input 
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter your email address"
                                        className="login-input flex-1 text-[#191d23] text-[16px] placeholder:text-[#64748b] bg-transparent border-0 p-0 m-0"
                                        style={{ outline: 'none', boxShadow: 'none' }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="flex flex-col gap-[8px]">
                                <label className="text-[16px] text-[#191d23] font-normal">Phone Number</label>
                                <div className="login-input-wrapper border border-[#bfc4cb] rounded-[8px] p-[16px] flex items-center gap-[12px] bg-white">
                                    <div className="flex items-center gap-2 border-r border-[#e2e8f0] pr-[12px]">
                                        <span className="text-[24px] leading-none">{selectedCountry?.flag}</span>
                                        <span className="text-[#64748b] text-[16px] font-medium">
                                            {selectedCountry?.dial_code}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-[#64748b]" />
                                    </div>
                                    <input 
                                        name="phoneNumber"
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        placeholder="123 4567 18349"
                                        className="login-input flex-1 text-[#191d23] text-[16px] placeholder:text-[#64748b] bg-transparent border-0 p-0 m-0"
                                        style={{ outline: 'none', boxShadow: 'none' }}
                                        required
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Registration Step 3: Password */}
                    {!isLogin && !isForgotPassword && step === 3 && (
                        <motion.div
                            key="register-step-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-[24px]"
                        >
                            {/* Password Input */}
                            <div className="flex flex-col gap-[8px]">
                                <label className="text-[16px] text-[#191d23] font-normal">Password</label>
                                <div className="login-input-wrapper border border-[#bfc4cb] rounded-[8px] p-[16px] flex items-center gap-[10px] bg-white">
                                    <input 
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Enter password (min. of 8 characters)"
                                        className="login-input flex-1 text-[#191d23] text-[16px] placeholder:text-[#64748b] bg-transparent border-0 p-0 m-0"
                                        style={{ outline: 'none', boxShadow: 'none' }}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff className="w-5 h-5 text-[#64748b]" /> : <Eye className="w-5 h-5 text-[#64748b]" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password Input */}
                            <div className="flex flex-col gap-[8px]">
                                <label className="text-[16px] text-[#191d23] font-normal">Confirm Password</label>
                                <div className="login-input-wrapper border border-[#bfc4cb] rounded-[8px] p-[16px] flex items-center gap-[10px] bg-white">
                                    <input 
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="Enter password (min. of 8 characters)"
                                        className="login-input flex-1 text-[#191d23] text-[16px] placeholder:text-[#64748b] bg-transparent border-0 p-0 m-0"
                                        style={{ outline: 'none', boxShadow: 'none' }}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5 text-[#64748b]" /> : <Eye className="w-5 h-5 text-[#64748b]" />}
                                    </button>
                                </div>
                            </div>

                            {/* Password Requirements */}
                            <div className="flex flex-col gap-[8px]">
                                <div className="flex items-center gap-[8px]">
                                    <CheckCircle className={`w-6 h-6 ${passwordRequirements.length ? 'text-[#2a7c4f] fill-[#e6f3eb]' : 'text-[#bdbdbd]'}`} />
                                    <span className={`text-[16px] ${passwordRequirements.length ? 'text-[#212121]' : 'text-[#bdbdbd]'}`}>8 characters minimum</span>
                                </div>
                                <div className="flex items-center gap-[8px]">
                                    <CheckCircle className={`w-6 h-6 ${passwordRequirements.lowercase ? 'text-[#2a7c4f] fill-[#e6f3eb]' : 'text-[#bdbdbd]'}`} />
                                    <span className={`text-[16px] ${passwordRequirements.lowercase ? 'text-[#212121]' : 'text-[#bdbdbd]'}`}>At least one lowercase character</span>
                                </div>
                                <div className="flex items-center gap-[8px]">
                                    <CheckCircle className={`w-6 h-6 ${passwordRequirements.uppercase ? 'text-[#2a7c4f] fill-[#e6f3eb]' : 'text-[#bdbdbd]'}`} />
                                    <span className={`text-[16px] ${passwordRequirements.uppercase ? 'text-[#212121]' : 'text-[#bdbdbd]'}`}>At least one uppercase character</span>
                                </div>
                                <div className="flex items-center gap-[8px]">
                                    <CheckCircle className={`w-6 h-6 ${passwordRequirements.special ? 'text-[#2a7c4f] fill-[#e6f3eb]' : 'text-[#bdbdbd]'}`} />
                                    <span className={`text-[16px] ${passwordRequirements.special ? 'text-[#212121]' : 'text-[#bdbdbd]'}`}>At least one special character e.g !#$%&*+,-./:;&lt;&gt;=?@^_|~</span>
                                </div>
                                <div className="flex items-center gap-[8px]">
                                    <CheckCircle className={`w-6 h-6 ${passwordRequirements.number ? 'text-[#2a7c4f] fill-[#e6f3eb]' : 'text-[#bdbdbd]'}`} />
                                    <span className={`text-[16px] ${passwordRequirements.number ? 'text-[#212121]' : 'text-[#bdbdbd]'}`}>At least one number</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Registration Step 4: OTP */}
                    {!isLogin && !isForgotPassword && step === 4 && (
                        <motion.div
                            key="register-step-4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-[24px]"
                        >
                            <div className="flex justify-between gap-2">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <input
                                        key={index}
                                        id={`otp-${index}`}
                                        type="text"
                                        maxLength={1}
                                        value={formData.otp[index] === ' ' ? '' : (formData.otp[index] || '')}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className="w-[48px] h-[48px] border border-[#bfc4cb] rounded-[8px] text-center text-[20px] font-bold text-[#191d23] focus:border-[#004aad] focus:outline-none transition-colors"
                                    />
                                ))}
                            </div>
                            
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    disabled={timer > 0}
                                    onClick={async () => {
                                        setTimer(52)
                                        try {
                                            const fullPhoneNumber = (selectedCountry?.dial_code || '+254') + formData.phoneNumber.replace(/^0+/, '')
                                            await sendOtp(fullPhoneNumber)
                                        } catch (err) {
                                            console.error('Resend OTP error:', err)
                                            setError('Failed to resend code. Please try again.')
                                        }
                                    }}
                                    className={`text-[14px] ${timer > 0 ? 'text-[#64748b]' : 'text-[#004aad] font-semibold hover:underline'}`}
                                >
                                    {timer > 0 ? `Resend code (0:${timer.toString().padStart(2, '0')})` : 'Resend code'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Login Form (Email) */}
                    {isLogin && loginMethod === 'email' && (
                        <motion.div
                            key="email-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-[20px]"
                        >
                            {/* Business Name (Register only) */}
                            {!isLogin && !isForgotPassword && (
                                 <div className="flex flex-col gap-[10px]">
                                    <label className="text-[16px] text-black">Business Name</label>
                                    <div className="login-input-wrapper border border-[#bfc4cb] rounded-[8px] p-[16px] flex items-center bg-white">
                                        <input 
                                            name="businessName"
                                            value={formData.businessName}
                                            onChange={handleInputChange}
                                            placeholder="Enter your business name"
                                            className="login-input flex-1 text-[#191d23] text-[16px] placeholder:text-[#64748b] bg-transparent border-0 p-0 m-0"
                                            style={{ outline: 'none', boxShadow: 'none' }}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email Input */}
                            <div className="flex flex-col gap-[10px]">
                                <label className="text-[16px] text-black">Email Address</label>
                                <div className="login-input-wrapper border border-[#bfc4cb] rounded-[8px] p-[16px] flex items-center bg-white">
                                    <input 
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter your email address"
                                        className="login-input flex-1 text-[#191d23] text-[16px] placeholder:text-[#64748b] bg-transparent border-0 p-0 m-0"
                                        style={{ outline: 'none', boxShadow: 'none' }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            {!isForgotPassword && (
                                <div className="flex flex-col gap-[10px]">
                                    <label className="text-[16px] text-black">Password</label>
                                    <div className="login-input-wrapper border border-[#bfc4cb] rounded-[8px] p-[16px] flex items-center gap-[10px] bg-white">
                                        <input 
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Enter your password"
                                            className="login-input flex-1 text-[#191d23] text-[16px] placeholder:text-[#64748b] bg-transparent border-0 p-0 m-0"
                                            style={{ outline: 'none', boxShadow: 'none' }}
                                            required
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff className="w-5 h-5 text-[#64748b]" /> : <Eye className="w-5 h-5 text-[#64748b]" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Confirm Password (Register only) */}
                            {!isLogin && !isForgotPassword && (
                                <div className="flex flex-col gap-[10px]">
                                    <label className="text-[16px] text-black">Confirm Password</label>
                                    <div className="login-input-wrapper border border-[#bfc4cb] rounded-[8px] p-[16px] flex items-center gap-[10px] bg-white">
                                        <input 
                                            name="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="Confirm your password"
                                            className="login-input flex-1 text-[#191d23] text-[16px] placeholder:text-[#64748b] bg-transparent border-0 p-0 m-0"
                                            style={{ outline: 'none', boxShadow: 'none' }}
                                            required
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5 text-[#64748b]" /> : <Eye className="w-5 h-5 text-[#64748b]" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Login Phone Form */}
                    {isLogin && loginMethod === 'phone' && (
                        <motion.div
                            key="phone-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-[20px]"
                        >
                            {loginPhoneStep === 'phone' ? (
                                <>
                                    {/* Phone Number Input */}
                                    <div className="flex flex-col gap-[10px]">
                                        <label className="text-[16px] text-black">Phone Number</label>
                                        <div className="login-input-wrapper border border-[#bfc4cb] rounded-[8px] p-[8px] flex items-center gap-[10px] bg-white">
                                            {/* Country Code Selector */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCountrySelect(!showCountrySelect)}
                                                    className="bg-[#f0f2f5] flex items-center gap-[4px] p-[8px] rounded-[8px] cursor-pointer hover:bg-gray-200 transition-colors min-w-[100px]"
                                                >
                                                    <span className="text-[20px] leading-none">{selectedCountry?.flag || countries[0].flag}</span>
                                                    <span className="text-[#64748b] text-[16px] font-normal">{selectedCountry?.dial_code || countries[0].dial_code}</span>
                                                    <ChevronDown className={`w-4 h-4 text-[#64748b] transition-transform ${showCountrySelect ? 'rotate-180' : ''}`} />
                                                </button>

                                                {/* Backdrop for click outside */}
                                                {showCountrySelect && (
                                                    <div 
                                                        className="fixed inset-0 z-40"
                                                        onClick={() => setShowCountrySelect(false)}
                                                    />
                                                )}

                                                {/* Dropdown */}
                                                <AnimatePresence>
                                                    {showCountrySelect && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 10 }}
                                                            className="absolute top-full left-0 mt-2 w-[240px] bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-[300px] overflow-y-auto"
                                                        >
                                                            {countries.map((country) => (
                                                                <button
                                                                    key={country.code}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedCountry(country)
                                                                        setShowCountrySelect(false)
                                                                    }}
                                                                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                                                                >
                                                                    <span className="text-[20px] leading-none">{country.flag}</span>
                                                                    <span className="text-[#191d23] text-[14px] font-medium flex-1">{country.name}</span>
                                                                    <span className="text-[#64748b] text-[14px]">{country.dial_code}</span>
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <input 
                                                type="tel"
                                                value={loginPhoneNumber}
                                                onChange={(e) => setLoginPhoneNumber(e.target.value)}
                                                placeholder="712 345 678"
                                                className="login-input flex-1 text-[#191d23] text-[16px] placeholder:text-[#64748b] bg-transparent border-0 p-0 m-0"
                                                style={{ outline: 'none', boxShadow: 'none' }}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* OTP Verification for Phone Login */}
                                    <div className="flex flex-col gap-[8px]">
                                        <p className="text-[16px] text-[#64748b]">
                                            Enter the verification code sent to {(selectedCountry?.dial_code || '+254')}{loginPhoneNumber}
                                        </p>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        {[0, 1, 2, 3, 4, 5].map((index) => (
                                            <input
                                                key={index}
                                                id={`login-otp-${index}`}
                                                type="text"
                                                maxLength={1}
                                                value={formData.otp[index] === ' ' ? '' : (formData.otp[index] || '')}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                className="w-[48px] h-[48px] border border-[#bfc4cb] rounded-[8px] text-center text-[20px] font-bold text-[#191d23] focus:border-[#004aad] focus:outline-none transition-colors"
                                            />
                                        ))}
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLoginPhoneStep('phone')
                                                setFormData(prev => ({ ...prev, otp: '' }))
                                            }}
                                            className="text-[14px] text-[#64748b] hover:text-[#004aad]"
                                        >
                                            ← Change number
                                        </button>
                                        <button
                                            type="button"
                                            disabled={timer > 0}
                                            onClick={async () => {
                                                setTimer(52)
                                                try {
                                                    const fullPhoneNumber = (selectedCountry?.dial_code || '+254') + loginPhoneNumber.replace(/^0+/, '')
                                                    await sendLoginOtp(fullPhoneNumber)
                                                } catch (err) {
                                                    console.error('Resend OTP error:', err)
                                                }
                                            }}
                                            className={`text-[14px] ${timer > 0 ? 'text-[#64748b]' : 'text-[#004aad] font-semibold hover:underline'}`}
                                        >
                                            {timer > 0 ? `Resend code (0:${timer.toString().padStart(2, '0')})` : 'Resend code'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Forgot Password Link */}
                {isLogin && !isForgotPassword && loginMethod === 'email' && (
                    <button 
                        type="button"
                        onClick={switchToForgotPassword}
                        className="text-[#004aad] font-extrabold text-[16px] self-start hover:underline"
                    >
                        Forgot Password?
                    </button>
                )}

                {/* Visible reCAPTCHA - shows when user needs to send OTP */}
                {((!isLogin && step === 3) || (isLogin && loginMethod === 'phone' && loginPhoneStep === 'phone')) && (
                    <div 
                        id="recaptcha-container" 
                        className="flex justify-center my-4"
                        style={{ minHeight: '78px' }}
                    ></div>
                )}

                {/* Submit Button */}
                <button 
                    type="submit"
                    disabled={formLoading || !isFormValid()}
                    className={`w-full rounded-[16px] p-[16px] text-[16px] font-normal transition-colors duration-200 flex items-center justify-center gap-2
                        ${formLoading 
                            ? 'bg-[#004aad] text-white cursor-wait' 
                            : !isFormValid()
                                ? 'bg-[#f0f2f5] text-[#64748b] cursor-not-allowed'
                                : 'bg-[#004aad] text-white hover:bg-[#003a8c] shadow-md font-semibold'
                        }
                    `}
                >
                    {formLoading ? (
                        <>
                            <span className="font-semibold">
                                {isForgotPassword 
                                    ? 'Sending...' 
                                    : isLogin 
                                        ? (loginMethod === 'phone' 
                                            ? (loginPhoneStep === 'phone' ? 'Sending OTP...' : 'Verifying...') 
                                            : 'Logging in...')
                                        : (step === 3 ? 'Sending OTP...' : (step === 4 ? 'Verifying...' : 'Continue'))
                                }
                            </span>
                            <Loader2 className="animate-spin w-5 h-5" />
                        </>
                    ) : (
                        isForgotPassword 
                            ? 'Reset Password' 
                            : isLogin 
                                ? (loginMethod === 'phone' 
                                    ? (loginPhoneStep === 'phone' ? 'Send OTP' : 'Verify & Login') 
                                    : 'Login')
                                : (step < 3 ? 'Continue' : (step === 3 ? 'Send Verification Code' : 'Verify & Create Account'))
                    )}
                </button>
                
                {/* Back to Login (Forgot Password mode) */}
                {isForgotPassword && (
                    <button 
                        type="button"
                        onClick={switchToLogin}
                        className="text-[#64748b] text-[16px] hover:text-[#004aad] transition-colors"
                    >
                        Back to Login
                    </button>
                )}
            </form>
        </div>
    </div>
  )
}
