'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight,
  MapPin,
  DollarSign,
  CheckCircle,
  ChevronDown,
  Plus,
  Info
} from 'lucide-react'
import { OnboardingData } from '../OnboardingWizard'

interface BranchSetupStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onSkip: () => void
  isLoading: boolean
  isSaving: boolean
}

const currencies = [
  { value: 'KES', label: 'KES - Kenyan Shilling', symbol: 'KSh' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'UGX', label: 'UGX - Ugandan Shilling', symbol: 'USh' },
  { value: 'TZS', label: 'TZS - Tanzanian Shilling', symbol: 'TSh' }
]

export default function BranchSetupStep({
  data,
  updateData,
  onNext,
  onSkip,
  isLoading,
  isSaving
}: BranchSetupStepProps) {
  const [formData, setFormData] = useState({
    branchName: data.branchSetup.branchName || data.businessProfile.businessName + ' - Main',
    location: data.branchSetup.location,
    defaultCurrency: data.branchSetup.defaultCurrency || data.businessProfile.currency,
    addMoreLater: data.branchSetup.addMoreLater
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.branchName.trim()) {
      newErrors.branchName = 'Branch name is required'
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }
    
    if (!formData.defaultCurrency) {
      newErrors.defaultCurrency = 'Please select the branch currency'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing/selecting
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }))
    }
    
    // Auto-save to parent state
    updateData({
      branchSetup: {
        ...data.branchSetup,
        [field]: value
      }
    })
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  const isFormValid = formData.branchName.trim() && formData.location.trim() && formData.defaultCurrency
  const selectedCurrency = currencies.find(c => c.value === formData.defaultCurrency)

  return (
    <div className="max-w-2xl mx-auto">
      <CardHeader className="text-center pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-gradient-to-br from-[#004AAD] to-[#FF9500] rounded-xl flex items-center justify-center mx-auto mb-4"
        >
          <MapPin className="w-8 h-8 text-white" />
        </motion.div>
        
        <CardTitle className="text-2xl font-bold text-gray-900">
          Set Up Your First Branch
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Every business needs at least one location. Let's set up your main branch.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-green-800 font-medium mb-1">Multi-Location Ready</p>
            <p className="text-green-700">
              FahamPesa supports multiple branches from day one. You can add more locations, 
              manage inventory transfers, and track performance across all branches.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-2">
            Branch Name *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="branchName"
              type="text"
              value={formData.branchName}
              onChange={(e) => handleInputChange('branchName', e.target.value)}
              placeholder="Main Branch, Downtown Store, etc."
              className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors ${
                errors.branchName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {isFormValid && formData.branchName && (
              <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
          {errors.branchName && (
            <p className="mt-2 text-sm text-red-600">{errors.branchName}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            A friendly name to identify this location
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location Address *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="123 Business Street, Nairobi"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors ${
                errors.location ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {isFormValid && formData.location && (
              <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
          {errors.location && (
            <p className="mt-2 text-sm text-red-600">{errors.location}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            This will appear on receipts and help with delivery planning
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700 mb-2">
            Branch Currency *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              id="defaultCurrency"
              value={formData.defaultCurrency}
              onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
              className={`w-full pl-10 pr-10 py-3 border rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors appearance-none ${
                errors.defaultCurrency ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select currency</option>
              {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            {formData.defaultCurrency && !errors.defaultCurrency && (
              <CheckCircle className="absolute right-10 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
          {errors.defaultCurrency && (
            <p className="mt-2 text-sm text-red-600">{errors.defaultCurrency}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            {selectedCurrency 
              ? `This branch will operate in ${selectedCurrency.symbol} ${selectedCurrency.value}`
              : 'Different branches can use different currencies'
            }
          </p>
        </motion.div>

        {/* Add More Later Checkbox */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gray-50 border border-gray-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="addMoreLater"
              checked={formData.addMoreLater}
              onChange={(e) => handleInputChange('addMoreLater', e.target.checked)}
              className="mt-1 h-4 w-4 text-[#004AAD] focus:ring-[#004AAD] border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="addMoreLater" className="text-sm font-medium text-gray-900 cursor-pointer">
                I plan to add more branches later
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Check this if you have multiple locations or plan to expand. 
                You can add branches anytime from your dashboard.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
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
