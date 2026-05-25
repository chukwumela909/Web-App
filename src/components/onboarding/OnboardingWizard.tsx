'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Building2,
  Store,
  MapPin,
  Users,
  Sparkles,
  X
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useOnboarding } from './OnboardingProvider'
import {
  completeBusinessOnboarding,
  CompleteBusinessOnboardingPayload,
  isBackendApiError,
  saveOnboardingProgress
} from '@/lib/backend-api'

// Step Components
import WelcomeStep from './steps/WelcomeStep'
import PersonalProfileStep from './steps/PersonalProfileStep'
import CompanyProfileStep from './steps/CompanyProfileStep'
import BusinessProfileStep from './steps/BusinessProfileStep'
import BranchSetupStep from './steps/BranchSetupStep'
import StaffSetupStep from './steps/StaffSetupStep'
import CompletionStep from './steps/CompletionStep'

export interface OnboardingData {
  // Personal Profile
  personalProfile: {
    fullName: string
    phoneNumber: string
  }
  
  // Company Profile
  companyProfile: {
    legalCompanyName: string
    registrationNumber: string
  }
  
  // Business Profile
  businessProfile: {
    businessName: string
    businessType: string
    country: string
    currency: string
  }
  
  // Branch Setup
  branchSetup: {
    branchName: string
    location: string
    defaultCurrency: string
    addMoreLater: boolean
  }
  
  // Staff Setup
  staffSetup: {
    teamMembers: Array<{
      email: string
      role: 'admin' | 'manager' | 'staff'
    }>
    skipForNow: boolean
  }
  
  // Meta
  currentStep: number
  completedSteps: number[]
  skippedSteps: number[]
}

const TOTAL_STEPS = 7

const steps = [
  { id: 1, title: 'Welcome', icon: Sparkles, description: 'Let\'s set up your account' },
  { id: 2, title: 'Personal', icon: User, description: 'Your personal information' },
  { id: 3, title: 'Company', icon: Building2, description: 'Legal company details' },
  { id: 4, title: 'Business', icon: Store, description: 'Business preferences' },
  { id: 5, title: 'Branch', icon: MapPin, description: 'Your first location' },
  { id: 6, title: 'Team', icon: Users, description: 'Invite team members' },
  { id: 7, title: 'Complete', icon: CheckCircle, description: 'You\'re all set!' }
]

export default function OnboardingWizard() {
  const { user } = useAuth()
  const router = useRouter()
  const { onboardingStatus, refreshOnboardingStatus, setCompletingOnboarding } = useOnboarding()
  const hasLoadedDraft = useRef(false)
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    personalProfile: { fullName: '', phoneNumber: '' },
    companyProfile: { legalCompanyName: '', registrationNumber: '' },
    businessProfile: { 
      businessName: user?.displayName || '', 
      businessType: '', 
      country: 'Kenya',
      currency: 'KES' 
    },
    branchSetup: { branchName: '', location: '', defaultCurrency: 'KES', addMoreLater: false },
    staffSetup: { teamMembers: [], skipForNow: false },
    currentStep: 1,
    completedSteps: [],
    skippedSteps: []
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Load existing onboarding data from the backend draft state.
  useEffect(() => {
    if (!user || !onboardingStatus || hasLoadedDraft.current) return

    const storedBusinessName = typeof window !== 'undefined'
      ? window.localStorage.getItem('fahampesa:onboardingBusinessName')
      : null
    const storedPhoneNumber = typeof window !== 'undefined'
      ? window.localStorage.getItem('fahampesa:onboardingPhoneNumber')
      : null
    const storedCountry = typeof window !== 'undefined'
      ? window.localStorage.getItem('fahampesa:onboardingCountry')
      : null

    const draft = isRecord(onboardingStatus.data) ? onboardingStatus.data : {}

    setOnboardingData((current) => ({
      ...current,
      ...draft,
      personalProfile: {
        ...current.personalProfile,
        ...(isRecord(draft.personalProfile) ? draft.personalProfile : {}),
        phoneNumber: String(
          (isRecord(draft.personalProfile) ? draft.personalProfile.phoneNumber : '') ||
          storedPhoneNumber ||
          user.phoneNumber ||
          current.personalProfile.phoneNumber
        )
      },
      companyProfile: {
        ...current.companyProfile,
        ...(isRecord(draft.companyProfile) ? draft.companyProfile : {})
      },
      businessProfile: {
        ...current.businessProfile,
        ...(isRecord(draft.businessProfile) ? draft.businessProfile : {}),
        businessName: String(
          (isRecord(draft.businessProfile) ? draft.businessProfile.businessName : '') ||
          storedBusinessName ||
          user.displayName ||
          current.businessProfile.businessName
        ),
        country: String(
          (isRecord(draft.businessProfile) ? draft.businessProfile.country : '') ||
          storedCountry ||
          current.businessProfile.country ||
          'Kenya'
        )
      },
      branchSetup: {
        ...current.branchSetup,
        ...(isRecord(draft.branchSetup) ? draft.branchSetup : {})
      },
      staffSetup: {
        ...current.staffSetup,
        ...(isRecord(draft.staffSetup) ? draft.staffSetup : {})
      },
      currentStep: onboardingStatus.currentStep || current.currentStep,
      completedSteps: onboardingStatus.completedSteps || current.completedSteps,
      skippedSteps: onboardingStatus.skippedSteps || current.skippedSteps
    }) as OnboardingData)

    hasLoadedDraft.current = true
  }, [user, onboardingStatus])

  const saveOnboardingData = async (data: OnboardingData) => {
    if (!user) return

    setIsSaving(true)
    try {
      await saveOnboardingProgress(user, {
        currentStep: data.currentStep,
        completedSteps: data.completedSteps,
        skippedSteps: data.skippedSteps,
        data: toProgressData(data)
      })
      setError('')
    } catch (error) {
      console.error('Error saving onboarding data:', error)
      if (isBackendApiError(error) && (error.code === 'missing_auth_token' || error.code === 'invalid_auth_token')) {
        router.push('/login')
        return
      }
      setError(error instanceof Error ? error.message : 'Unable to save onboarding progress.')
    } finally {
      setIsSaving(false)
    }
  }

  const updateOnboardingData = (updates: Partial<OnboardingData>) => {
    const newData = { ...onboardingData, ...updates }
    setOnboardingData(newData)
    saveOnboardingData(newData)
  }

  const nextStep = () => {
    const currentStepNumber = onboardingData.currentStep
    const completedSteps = [...onboardingData.completedSteps]
    
    if (!completedSteps.includes(currentStepNumber)) {
      completedSteps.push(currentStepNumber)
    }
    
    const nextStepNumber = Math.min(currentStepNumber + 1, TOTAL_STEPS)
    
    updateOnboardingData({
      currentStep: nextStepNumber,
      completedSteps
    })
  }

  const previousStep = () => {
    const prevStepNumber = Math.max(onboardingData.currentStep - 1, 1)
    updateOnboardingData({ currentStep: prevStepNumber })
  }

  const skipStep = () => {
    setError('Business setup is required before opening the dashboard.')
  }

  const completeOnboarding = async () => {
    const validationError = getCompletionValidationError(onboardingData)
    if (validationError) {
      setError(validationError.message)
      updateOnboardingData({ currentStep: validationError.step })
      return
    }

    setIsLoading(true)
    setCompletingOnboarding(true)
    
    try {
      await saveOnboardingData(onboardingData)

      await completeBusinessOnboarding(user!, buildCompletionPayload(onboardingData, user!))

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('fahampesa:onboardingBusinessName')
        window.localStorage.removeItem('fahampesa:onboardingPhoneNumber')
        window.localStorage.removeItem('fahampesa:onboardingCountry')
      }

      await refreshOnboardingStatus()
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      if (isBackendApiError(error)) {
        if (error.code === 'business_already_exists') {
          setError('This account already has a business. Refreshing your dashboard access...')
          await refreshOnboardingStatus()
          router.push('/dashboard')
          return
        }
        if (error.code === 'missing_auth_token' || error.code === 'invalid_auth_token') {
          router.push('/login')
          return
        }
      }
      setError(getCompletionErrorMessage(error))
    } finally {
      setIsLoading(false)
      setCompletingOnboarding(false)
    }
  }

  const renderStep = () => {
    const stepProps = {
      data: onboardingData,
      updateData: updateOnboardingData,
      onNext: nextStep,
      onSkip: skipStep,
      isLoading,
      isSaving
    }

    switch (onboardingData.currentStep) {
      case 1:
        return <WelcomeStep {...stepProps} onSkipToEnd={skipStep} />
      case 2:
        return <PersonalProfileStep {...stepProps} />
      case 3:
        return <CompanyProfileStep {...stepProps} />
      case 4:
        return <BusinessProfileStep {...stepProps} />
      case 5:
        return <BranchSetupStep {...stepProps} />
      case 6:
        return <StaffSetupStep {...stepProps} />
      case 7:
        return <CompletionStep {...stepProps} onComplete={completeOnboarding} />
      default:
        return <WelcomeStep {...stepProps} onSkipToEnd={skipStep} />
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004AAD] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001122] via-[#004AAD] to-[#FF9500] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-[#004AAD] font-bold text-xl">F</span>
            </div>
            <h1 className="text-2xl font-bold text-white">FahamPesa</h1>
          </div>
          
          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                    ${onboardingData.currentStep === step.id 
                      ? 'bg-white text-[#004AAD] scale-110' 
                      : onboardingData.completedSteps.includes(step.id)
                      ? 'bg-green-500 text-white'
                      : onboardingData.skippedSteps.includes(step.id)
                      ? 'bg-gray-400 text-white'
                      : 'bg-white/20 text-white'
                    }
                  `}>
                    {onboardingData.completedSteps.includes(step.id) ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : onboardingData.skippedSteps.includes(step.id) ? (
                      <X className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-12 h-1 mx-2 transition-colors duration-300
                      ${onboardingData.completedSteps.includes(step.id) || onboardingData.skippedSteps.includes(step.id)
                        ? 'bg-white/50' 
                        : 'bg-white/20'
                      }
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-white/80 text-sm">
              Step {onboardingData.currentStep} of {TOTAL_STEPS}: {steps[onboardingData.currentStep - 1]?.description}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <Card className="bg-white shadow-2xl border-0 overflow-hidden">
          <div className="relative">
            {error && (
              <div className="mx-6 mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Saving Indicator */}
            {isSaving && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-4 right-4 z-10 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Saving...
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={onboardingData.currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
            
            {/* Navigation */}
            {onboardingData.currentStep > 1 && onboardingData.currentStep < TOTAL_STEPS && (
              <div className="px-6 pb-6">
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={previousStep}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  
                  <div className="text-sm text-gray-500">
                    Business setup is required before opening the dashboard.
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPhoneVerifiedByFirebase(user: import('firebase/auth').User, phoneNumber: string) {
  if (!user.phoneNumber || !phoneNumber) return false
  return normalizePhone(user.phoneNumber) === normalizePhone(phoneNumber)
}

function normalizePhone(phoneNumber: string) {
  return phoneNumber.replace(/[^\d+]/g, '')
}

function getCompletionValidationError(data: OnboardingData): { step: number; message: string } | null {
  const branchName = getEffectiveBranchName(data)

  if (!data.businessProfile.businessName.trim() || !data.businessProfile.businessType.trim()) {
    return {
      step: 4,
      message: 'Complete your business name and business type before opening the dashboard.'
    }
  }

  if (!data.businessProfile.country.trim() || !data.businessProfile.currency.trim()) {
    return {
      step: 4,
      message: 'Choose your business country and currency before opening the dashboard.'
    }
  }

  if (!branchName.trim() || !data.branchSetup.location.trim()) {
    return {
      step: 5,
      message: 'Add your first branch name and address before opening the dashboard.'
    }
  }

  const invalidInvitation = data.staffSetup.teamMembers.find((member) => !isValidEmail(member.email))
  if (invalidInvitation) {
    return {
      step: 6,
      message: 'Review team invitations and remove or fix invalid email addresses.'
    }
  }

  return null
}

function buildCompletionPayload(data: OnboardingData, user: import('firebase/auth').User): CompleteBusinessOnboardingPayload {
  const payload: CompleteBusinessOnboardingPayload = {
    business: {
      businessName: data.businessProfile.businessName.trim(),
      businessType: data.businessProfile.businessType.trim(),
      country: data.businessProfile.country.trim() || 'Kenya',
      currency: data.businessProfile.currency.trim()
    },
    branch: {
      name: getEffectiveBranchName(data).trim(),
      location: {
        address: data.branchSetup.location.trim(),
        country: data.businessProfile.country.trim() || 'Kenya'
      },
      branchCode: 'MAIN',
      branchType: 'MAIN',
      currency: data.branchSetup.defaultCurrency.trim() || data.businessProfile.currency.trim()
    }
  }

  const personalProfile: NonNullable<CompleteBusinessOnboardingPayload['personalProfile']> = {}
  if (data.personalProfile.fullName.trim()) {
    personalProfile.fullName = data.personalProfile.fullName.trim()
  }
  if (data.personalProfile.phoneNumber.trim()) {
    personalProfile.phoneNumber = data.personalProfile.phoneNumber.trim()
    if (isPhoneVerifiedByFirebase(user, data.personalProfile.phoneNumber)) {
      personalProfile.phoneVerified = true
    }
  }
  if (Object.keys(personalProfile).length > 0) {
    payload.personalProfile = personalProfile
  }

  const companyProfile: NonNullable<CompleteBusinessOnboardingPayload['companyProfile']> = {}
  if (data.companyProfile.legalCompanyName.trim()) {
    companyProfile.legalCompanyName = data.companyProfile.legalCompanyName.trim()
  }
  if (data.companyProfile.registrationNumber.trim()) {
    companyProfile.registrationNumber = data.companyProfile.registrationNumber.trim()
  }
  if (Object.keys(companyProfile).length > 0) {
    payload.companyProfile = companyProfile
  }

  const contact: NonNullable<CompleteBusinessOnboardingPayload['branch']['contact']> = {}
  if (data.personalProfile.phoneNumber.trim()) {
    contact.phone = data.personalProfile.phoneNumber.trim()
    contact.whatsapp = data.personalProfile.phoneNumber.trim()
  }
  if (user.email) {
    contact.email = user.email
  }
  if (Object.keys(contact).length > 0) {
    payload.branch.contact = contact
  }

  const staffInvitations = data.staffSetup.teamMembers
    .filter((member) => member.email.trim())
    .map((member) => ({
      email: member.email.trim(),
      role: member.role
    }))
  if (staffInvitations.length > 0) {
    payload.staffInvitations = staffInvitations
  }

  return payload
}

function getEffectiveBranchName(data: OnboardingData) {
  return data.branchSetup.branchName.trim() || `${data.businessProfile.businessName.trim()} - Main`
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function getCompletionErrorMessage(error: unknown) {
  if (isBackendApiError(error) && error.code === 'validation_error') {
    return 'Some setup details are incomplete. Please review your business and branch details.'
  }

  return error instanceof Error ? error.message : 'Unable to complete onboarding.'
}

function toProgressData(data: OnboardingData): Record<string, unknown> {
  return {
    personalProfile: data.personalProfile,
    companyProfile: data.companyProfile,
    businessProfile: data.businessProfile,
    branchSetup: data.branchSetup,
    staffSetup: data.staffSetup,
    currentStep: data.currentStep,
    completedSteps: data.completedSteps,
    skippedSteps: data.skippedSteps
  }
}
