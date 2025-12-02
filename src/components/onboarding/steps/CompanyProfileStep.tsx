'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight,
  Building2,
  FileText,
  CheckCircle,
  Info
} from 'lucide-react'
import { OnboardingData } from '../OnboardingWizard'

interface CompanyProfileStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onSkip: () => void
  isLoading: boolean
  isSaving: boolean
}

export default function CompanyProfileStep({
  data,
  updateData,
  onNext,
  onSkip,
  isLoading,
  isSaving
}: CompanyProfileStepProps) {
  const [formData, setFormData] = useState({
    legalCompanyName: data.companyProfile.legalCompanyName,
    registrationNumber: data.companyProfile.registrationNumber
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.legalCompanyName.trim()) {
      newErrors.legalCompanyName = 'Legal company name is required'
    }
    
    // Registration number is optional but should be validated if provided
    if (formData.registrationNumber.trim() && formData.registrationNumber.length < 3) {
      newErrors.registrationNumber = 'Registration number must be at least 3 characters'
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
      companyProfile: {
        ...data.companyProfile,
        [field]: value
      }
    })
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  const isFormValid = formData.legalCompanyName.trim()

  return (
    <div className="max-w-2xl mx-auto">
      <CardHeader className="text-center pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-gradient-to-br from-[#004AAD] to-[#FF9500] rounded-xl flex items-center justify-center mx-auto mb-4"
        >
          <Building2 className="w-8 h-8 text-white" />
        </motion.div>
        
        <CardTitle className="text-2xl font-bold text-gray-900">
          Company Information
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Help us understand your business structure for compliance and reporting.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-800 font-medium mb-1">Why do we need this?</p>
            <p className="text-blue-700">
              This information helps with tax reporting, compliance, and professional invoicing. 
              You can always update this later in your settings.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <label htmlFor="legalCompanyName" className="block text-sm font-medium text-gray-700 mb-2">
            Legal Company Name *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="legalCompanyName"
              type="text"
              value={formData.legalCompanyName}
              onChange={(e) => handleInputChange('legalCompanyName', e.target.value)}
              placeholder="ABC Company Ltd."
              className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors ${
                errors.legalCompanyName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              autoComplete="organization"
            />
            {isFormValid && formData.legalCompanyName && (
              <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
          {errors.legalCompanyName && (
            <p className="mt-2 text-sm text-red-600">{errors.legalCompanyName}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            This is how your company name appears on legal documents
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Business Registration Number
            <span className="text-gray-500 text-sm ml-1">(Optional)</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="registrationNumber"
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              placeholder="C123456789"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors ${
                errors.registrationNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {formData.registrationNumber && !errors.registrationNumber && (
              <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
          {errors.registrationNumber && (
            <p className="mt-2 text-sm text-red-600">{errors.registrationNumber}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Your official business registration number (e.g., from CAK, Registrar of Companies)
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
