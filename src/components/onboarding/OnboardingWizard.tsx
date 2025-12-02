'use client'

import React, { useState, useEffect } from 'react'
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
  Skip,
  X
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { doc, setDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useOnboarding } from './OnboardingProvider'

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
  const { refreshOnboardingStatus, setCompletingOnboarding } = useOnboarding()
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    personalProfile: { fullName: '', phoneNumber: '' },
    companyProfile: { legalCompanyName: '', registrationNumber: '' },
    businessProfile: { 
      businessName: user?.displayName || '', 
      businessType: '', 
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

  // Load existing onboarding data from Firebase
  useEffect(() => {
    const loadOnboardingData = async () => {
      if (!user) return
      
      try {
        // Check if onboarding data exists in userProfiles
        const userProfileRef = doc(db, 'userProfiles', user.uid)
        // Implementation would check for existing data
        // For now, we'll start fresh each time
      } catch (error) {
        console.error('Error loading onboarding data:', error)
      }
    }

    loadOnboardingData()
  }, [user])

  // Save onboarding data to Firebase (incremental saves)
  const saveOnboardingData = async (data: Partial<OnboardingData>) => {
    if (!user) return

    setIsSaving(true)
    try {
      const userProfileRef = doc(db, 'userProfiles', user.uid)
      const onboardingRef = doc(db, 'onboardingData', user.uid)
      
      // Update onboarding progress
      await setDoc(onboardingRef, {
        ...data,
        userId: user.uid,
        lastUpdated: serverTimestamp()
      }, { merge: true })

      console.log('Onboarding data saved successfully')
    } catch (error) {
      console.error('Error saving onboarding data:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateOnboardingData = (updates: Partial<OnboardingData>) => {
    const newData = { ...onboardingData, ...updates }
    setOnboardingData(newData)
    
    // Auto-save to Firebase
    saveOnboardingData(updates)
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
    const currentStepNumber = onboardingData.currentStep
    const skippedSteps = [...onboardingData.skippedSteps]
    
    if (!skippedSteps.includes(currentStepNumber)) {
      skippedSteps.push(currentStepNumber)
    }
    
    const nextStepNumber = Math.min(currentStepNumber + 1, TOTAL_STEPS)
    
    updateOnboardingData({
      currentStep: nextStepNumber,
      skippedSteps
    })
  }

  const skipToEnd = async () => {
    setIsLoading(true)
    setCompletingOnboarding(true) // Disable auto-redirect during completion
    
    try {
      // Mark all remaining steps as skipped
      const allSteps = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1)
      const remainingSteps = allSteps.filter(
        step => 
          step > onboardingData.currentStep && 
          !onboardingData.completedSteps.includes(step)
      )
      
      await updateOnboardingData({
        currentStep: TOTAL_STEPS,
        skippedSteps: [...onboardingData.skippedSteps, ...remainingSteps]
      })
      
      // Mark onboarding as completed (can be resumed later)
      const userProfileRef = doc(db, 'userProfiles', user!.uid)
      
      // Check if user profile exists, create it if it doesn't
      const userProfileSnap = await getDoc(userProfileRef)
      if (!userProfileSnap.exists()) {
        // Create the user profile document
        await setDoc(userProfileRef, {
          businessName: user.displayName || '',
          email: user.email || '',
          onboardingCompleted: true,
          onboardingSkipped: true,
          onboardingCompletedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        })
      } else {
        // Update existing document
        await updateDoc(userProfileRef, {
          onboardingCompleted: true,
          onboardingCompletedAt: serverTimestamp(),
          onboardingSkipped: true
        })
      }
      
      // Refresh onboarding status
      await refreshOnboardingStatus()
      
      // Navigate to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error skipping onboarding:', error)
    } finally {
      setIsLoading(false)
      setCompletingOnboarding(false) // Re-enable auto-redirect
    }
  }

  const completeOnboarding = async () => {
    setIsLoading(true)
    setCompletingOnboarding(true) // Disable auto-redirect during completion
    
    try {
      // Save final onboarding data
      await saveOnboardingData(onboardingData)
      
      // Mark onboarding as completed
      const userProfileRef = doc(db, 'userProfiles', user!.uid)
      
      // Check if user profile exists, create it if it doesn't
      const userProfileSnap = await getDoc(userProfileRef)
      if (!userProfileSnap.exists()) {
        // Create the user profile document with onboarding data
        await setDoc(userProfileRef, {
          businessName: onboardingData.businessProfile.businessName || user.displayName || '',
          email: user.email || '',
          fullName: onboardingData.personalProfile.fullName,
          phoneNumber: onboardingData.personalProfile.phoneNumber,
          onboardingCompleted: true,
          onboardingSkipped: false,
          onboardingCompletedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        })
      } else {
        // Update existing document
        await updateDoc(userProfileRef, {
          onboardingCompleted: true,
          onboardingCompletedAt: serverTimestamp(),
          onboardingSkipped: false
        })
      }
      
      // Create initial business data based on onboarding
      await createInitialBusinessData()
      
      // Refresh onboarding status
      await refreshOnboardingStatus()
      
      // Navigate to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setIsLoading(false)
      setCompletingOnboarding(false) // Re-enable auto-redirect
    }
  }

  const createInitialBusinessData = async () => {
    if (!user) return

    try {
      // Create initial branch if provided
      if (onboardingData.branchSetup.branchName) {
        const branchId = crypto.randomUUID()
        const branchRef = doc(db, 'branches', branchId)
        
        await setDoc(branchRef, {
          id: branchId,
          name: onboardingData.branchSetup.branchName,
          location: { 
            address: onboardingData.branchSetup.location,
            city: '',
            region: ''
          },
          contact: {
            phone: onboardingData.personalProfile.phoneNumber,
            email: user.email
          },
          branchType: 'MAIN',
          status: 'ACTIVE',
          currency: onboardingData.branchSetup.defaultCurrency,
          openingHours: [],
          userId: user.uid,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }

      // Create staff invitations if provided
      if (onboardingData.staffSetup.teamMembers.length > 0) {
        for (const member of onboardingData.staffSetup.teamMembers) {
          const invitationId = crypto.randomUUID()
          const invitationRef = doc(db, 'staffInvitations', invitationId)
          
          await setDoc(invitationRef, {
            id: invitationId,
            email: member.email,
            role: member.role,
            status: 'PENDING',
            invitedBy: user.uid,
            invitedAt: serverTimestamp(),
            userId: user.uid
          })
        }
      }
    } catch (error) {
      console.error('Error creating initial business data:', error)
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
        return <WelcomeStep {...stepProps} onSkipToEnd={skipToEnd} />
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
        return <WelcomeStep {...stepProps} onSkipToEnd={skipToEnd} />
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
                  
                  <Button
                    variant="ghost"
                    onClick={skipToEnd}
                    disabled={isLoading}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Skip Setup & Go to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
