'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight,
  User,
  Phone,
  CheckCircle
} from 'lucide-react'
import { OnboardingData } from '../OnboardingWizard'

interface PersonalProfileStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onSkip: () => void
  isLoading: boolean
  isSaving: boolean
}

export default function PersonalProfileStep({
  data,
  updateData,
  onNext,
  onSkip,
  isLoading,
  isSaving
}: PersonalProfileStepProps) {
  const [formData, setFormData] = useState({
    fullName: data.personalProfile.fullName,
    phoneNumber: data.personalProfile.phoneNumber
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Auto-save to parent state
    updateData({
      personalProfile: {
        ...data.personalProfile,
        [field]: value
      }
    })
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  const isFormValid = formData.fullName.trim() && formData.phoneNumber.trim()

  return (
    <div className="max-w-2xl mx-auto">
      <CardHeader className="text-center pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-gradient-to-br from-[#004AAD] to-[#FF9500] rounded-xl flex items-center justify-center mx-auto mb-4"
        >
          <User className="w-8 h-8 text-white" />
        </motion.div>
        
        <CardTitle className="text-2xl font-bold text-gray-900">
          Personal Information
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Let's get to know you better. This helps us personalize your experience.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full name"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors ${
                errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              autoComplete="name"
            />
            {isFormValid && formData.fullName && (
              <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
          {errors.fullName && (
            <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="+254 700 000 000"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors ${
                errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              autoComplete="tel"
            />
            {isFormValid && formData.phoneNumber && (
              <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
          {errors.phoneNumber && (
            <p className="mt-2 text-sm text-red-600">{errors.phoneNumber}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            We'll use this for important account notifications
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex gap-4 pt-6"
        >
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isLoading}
            className="flex-1"
          >
            Skip for Now
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isLoading || !isFormValid}
            className="flex-1 bg-[#004AAD] hover:bg-[#003a8c] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </motion.div>
      </CardContent>
    </div>
  )
}
