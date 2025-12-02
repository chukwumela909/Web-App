'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight,
  Store,
  DollarSign,
  CheckCircle,
  ChevronDown
} from 'lucide-react'
import { OnboardingData } from '../OnboardingWizard'

interface BusinessProfileStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onSkip: () => void
  isLoading: boolean
  isSaving: boolean
}

const businessTypes = [
  { value: '', label: 'Select business type' },
  { value: 'retail', label: 'Retail Store' },
  { value: 'wholesale', label: 'Wholesale Business' },
  { value: 'restaurant', label: 'Restaurant / Food Service' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'electronics', label: 'Electronics Store' },
  { value: 'clothing', label: 'Clothing / Fashion' },
  { value: 'automotive', label: 'Automotive Services' },
  { value: 'beauty', label: 'Beauty & Personal Care' },
  { value: 'hardware', label: 'Hardware Store' },
  { value: 'grocery', label: 'Grocery Store' },
  { value: 'services', label: 'Professional Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'other', label: 'Other' }
]

const currencies = [
  { value: 'KES', label: 'KES - Kenyan Shilling', symbol: 'KSh' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'UGX', label: 'UGX - Ugandan Shilling', symbol: 'USh' },
  { value: 'TZS', label: 'TZS - Tanzanian Shilling', symbol: 'TSh' }
]

export default function BusinessProfileStep({
  data,
  updateData,
  onNext,
  onSkip,
  isLoading,
  isSaving
}: BusinessProfileStepProps) {
  const [formData, setFormData] = useState({
    businessName: data.businessProfile.businessName,
    businessType: data.businessProfile.businessType,
    currency: data.businessProfile.currency
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    }
    
    if (!formData.businessType) {
      newErrors.businessType = 'Please select your business type'
    }
    
    if (!formData.currency) {
      newErrors.currency = 'Please select your preferred currency'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing/selecting
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Auto-save to parent state
    updateData({
      businessProfile: {
        ...data.businessProfile,
        [field]: value
      }
    })
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  const isFormValid = formData.businessName.trim() && formData.businessType && formData.currency
  const selectedCurrency = currencies.find(c => c.value === formData.currency)

  return (
    <div className="max-w-2xl mx-auto">
      <CardHeader className="text-center pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-gradient-to-br from-[#004AAD] to-[#FF9500] rounded-xl flex items-center justify-center mx-auto mb-4"
        >
          <Store className="w-8 h-8 text-white" />
        </motion.div>
        
        <CardTitle className="text-2xl font-bold text-gray-900">
          Business Profile
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Let's configure your business settings to match your operations.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <div className="relative">
            <Store className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="businessName"
              type="text"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="Enter your business name"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors ${
                errors.businessName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              autoComplete="organization"
            />
            {isFormValid && formData.businessName && (
              <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
          {errors.businessName && (
            <p className="mt-2 text-sm text-red-600">{errors.businessName}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            This is the name customers will see on receipts and invoices
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
            Business Type *
          </label>
          <div className="relative">
            <select
              id="businessType"
              value={formData.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              className={`w-full pl-4 pr-10 py-3 border rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors appearance-none ${
                errors.businessType ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              {businessTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            {formData.businessType && !errors.businessType && (
              <CheckCircle className="absolute right-10 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
          {errors.businessType && (
            <p className="mt-2 text-sm text-red-600">{errors.businessType}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            This helps us customize features for your industry
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
            Default Currency *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className={`w-full pl-10 pr-10 py-3 border rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors appearance-none ${
                errors.currency ? 'border-red-300 bg-red-50' : 'border-gray-300'
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
            {formData.currency && !errors.currency && (
              <CheckCircle className="absolute right-10 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
          {errors.currency && (
            <p className="mt-2 text-sm text-red-600">{errors.currency}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            {selectedCurrency 
              ? `All prices will be displayed in ${selectedCurrency.symbol} ${selectedCurrency.value}`
              : 'This will be used for all pricing and transactions'
            }
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
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
