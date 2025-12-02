'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  Lock, 
  Mail, 
  Building2, 
  UserPlus,
  ArrowLeft,
  Chrome,
  CheckCircle
} from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { login, register, resetPassword, user, isSuperAdmin, loading, roleLoading } = useAuth()
  const { staff, hasPermission, loading: staffLoading } = useStaff()
  const router = useRouter()

  // Smart redirect logic - wait for auth data to load
  React.useEffect(() => {
    if (!loading && !roleLoading && user) {
      if (isSuperAdmin) {
        console.log('Redirecting super admin to /super-admin')
        router.push('/super-admin')
      } else {
        // Check if user is a staff member by trying to fetch their staff data
        checkStaffStatus()
      }
    }
  }, [user, isSuperAdmin, loading, roleLoading, router])

  const checkStaffStatus = async () => {
    try {
      const response = await fetch(`/api/admin/staff/${user?.uid}`)
      const data = await response.json()
      
      if (data.success) {
        // User is a staff member, redirect to staff dashboard
        console.log('Redirecting staff member to /staff-dashboard')
        router.push('/staff-dashboard')
      } else {
        // User is not a staff member, redirect to regular dashboard
        console.log('Redirecting regular user to /dashboard')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error checking staff status:', error)
      // Fallback to regular dashboard
      router.push('/dashboard')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email address is required')
      return false
    }

    // For forgot password, only email validation is needed
    if (isForgotPassword) {
      return true
    }

    if (!formData.password.trim()) {
      setError('Password is required')
      return false
    }

    if (!isLogin) {
      if (!formData.businessName.trim()) {
        setError('Business name is required')
        return false
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long')
        return false
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
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
        await login(formData.email, formData.password)
        // Wait a moment for auth context and role to update
        setTimeout(() => {
          // The useEffect above will handle the redirect
        }, 500)
      } else {
        await register(formData.email, formData.password, formData.businessName)
        // Immediately redirect to onboarding wizard after successful registration
        router.push('/onboarding')
      }
    } catch (error: unknown) {
      console.error('Authentication error:', error)
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : ''
      setError(getErrorMessage(errorCode))
    } finally {
      setFormLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('Google Sign-In will be available soon! Please use email registration for now.')
    // TODO: Implement Google Sign-In
    // This would require setting up Google OAuth in Firebase
  }

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return isForgotPassword 
          ? 'No account found with this email address.'
          : 'No account found with this email address.'
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.'
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
      default:
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
    setError('')
    setSuccess('')
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      businessName: ''
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
      businessName: ''
    })
  }

  const switchToLogin = () => {
    setIsForgotPassword(false)
    setIsLogin(true)
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Beautiful Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#001122] via-[#004AAD] to-[#FF9500] pointer-events-none">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3Ccircle cx='27' cy='27' r='1.5'/%3E%3Ccircle cx='47' cy='47' r='2'/%3E%3Ccircle cx='67' cy='67' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating elements */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-[#FF9500] to-transparent rounded-full opacity-30 pointer-events-none"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-[#0056CC] to-transparent rounded-full opacity-20 pointer-events-none"
          animate={{
            y: [0, 30, 0],
            rotate: [0, -360]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      

      {/* Back to Home */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-4 left-4 z-50"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="text-white hover:bg-white/20 border border-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </motion.div>
      
      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white shadow-2xl border-0">
            <CardHeader className="text-center pb-6">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#004AAD] to-[#FF9500] shadow-lg"
              >
                <span className="text-white font-bold text-2xl">F</span>
              </motion.div>

              <div className="mb-4">
                <h1 className="text-2xl font-bold text-[#004AAD] mb-2">
                  FahamPesa
                </h1>
                <p className="text-sm text-gray-600">
                  Smart Business Tools
                </p>
              </div>

              <CardTitle className="text-2xl font-bold text-gray-900">
                {isForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back!' : 'Join FahamPesa')}
              </CardTitle>
                              <CardDescription className="text-gray-600">
                {isForgotPassword 
                  ? 'Enter your email address to receive a password reset link' 
                  : (isLogin 
                    ? 'Sign in to access your business dashboard' 
                    : 'Create your account in seconds - we\'ll help you set up everything else'
                  )
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Success Message */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Business Name - Only for Registration (Simplified) */}
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <label htmlFor="businessName" className="text-sm font-medium text-gray-700">
                        Business Name
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          id="businessName"
                          name="businessName"
                          type="text"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          placeholder="Your business name"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors"
                          required={!isLogin}
                          autoComplete="organization"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        We'll help you set up the rest during onboarding
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Address */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors"
                      required
                      autoComplete="email"
                      style={{ 
                        WebkitUserSelect: 'text',
                        userSelect: 'text',
                        pointerEvents: 'auto',
                        zIndex: 10,
                        position: 'relative'
                      }}
                    />
                  </div>
                </div>

                {/* Password - Hidden in forgot password mode */}
                {!isForgotPassword && (
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder={isLogin ? "Enter your password" : "Choose a strong password"}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors"
                        required={!isForgotPassword}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        style={{ 
                          WebkitUserSelect: 'text',
                          userSelect: 'text',
                          pointerEvents: 'auto',
                          zIndex: 10,
                          position: 'relative'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {!isLogin && (
                      <p className="text-xs text-gray-500">
                        Password must be at least 6 characters long
                      </p>
                    )}
                  </div>
                )}

                {/* Confirm Password - Only for Registration and not in forgot password mode */}
                <AnimatePresence>
                  {!isLogin && !isForgotPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Confirm your password"
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors"
                          required={!isLogin}
                          autoComplete="new-password"
                          style={{ 
                            WebkitUserSelect: 'text',
                            userSelect: 'text',
                            pointerEvents: 'auto',
                            zIndex: 10,
                            position: 'relative'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full py-3 bg-[#004AAD] hover:bg-[#003a8c] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isForgotPassword ? 'Sending Reset Link...' : (isLogin ? 'Signing In...' : 'Creating Account...')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isForgotPassword ? <Mail className="h-4 w-4" /> : (isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />)}
                      {isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account')}
                    </div>
                  )}
                </Button>
              </form>

              {/* Divider - Hidden in forgot password mode */}
              {!isForgotPassword && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      or continue with
                    </span>
                  </div>
                </div>
              )}

              {/* Google Sign In - Hidden in forgot password mode */}
              {!isForgotPassword && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 border-2 border-gray-300 hover:bg-gray-50 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Chrome className="h-4 w-4 mr-2" />
                  Sign {isLogin ? 'in' : 'up'} with Google
                </Button>
              )}

              {/* Toggle Mode */}
              <div className="text-center pt-4 border-t border-gray-200">
                {isForgotPassword ? (
                  <>
                    <p className="text-sm text-gray-600 mb-3">
                      Remember your password?
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={switchToLogin}
                      className="text-[#004AAD] hover:text-[#FF9500] hover:bg-orange-50 font-semibold transition-colors"
                    >
                      Back to Sign In
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      {isLogin && (
                        <div>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={switchToForgotPassword}
                            className="text-sm text-gray-500 hover:text-[#004AAD] transition-colors"
                          >
                            Forgot your password?
                          </Button>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={toggleMode}
                          className="text-[#004AAD] hover:text-[#FF9500] hover:bg-orange-50 font-semibold transition-colors"
                        >
                          {isLogin ? 'Create Account' : 'Sign In Instead'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Additional Info */}
              <div className="text-center text-xs text-gray-500 pt-2">
                <p>
                  {isLogin ? 'Super Admin access managed separately' : 'By creating an account, you agree to our Terms of Service'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}