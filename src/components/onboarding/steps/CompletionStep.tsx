'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle,
  Sparkles,
  ArrowRight,
  Settings,
  BarChart3,
  Users,
  Package,
  Store,
  Star
} from 'lucide-react'
import { OnboardingData } from '../OnboardingWizard'
import { useAuth } from '@/contexts/AuthContext'

interface CompletionStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onComplete: () => void
  isLoading: boolean
  isSaving: boolean
}

const nextSteps = [
  {
    icon: Package,
    title: "Add Your First Products",
    description: "Start by adding the products you sell to your inventory",
    color: "text-blue-600 bg-blue-100"
  },
  {
    icon: BarChart3,
    title: "Record Your First Sale",
    description: "Make your first transaction and see the magic happen",
    color: "text-green-600 bg-green-100"
  },
  {
    icon: Store,
    title: "Customize Your Store",
    description: "Set up your branding, receipts, and business preferences",
    color: "text-purple-600 bg-purple-100"
  },
  {
    icon: Users,
    title: "Invite Your Team",
    description: "Add team members and assign roles for collaboration",
    color: "text-orange-600 bg-orange-100"
  }
]

const features = [
  "Multi-branch inventory management",
  "Real-time sales tracking",
  "Team collaboration tools",
  "Detailed business reports",
  "Customer management",
  "Automated low stock alerts"
]

export default function CompletionStep({
  data,
  updateData,
  onComplete,
  isLoading,
  isSaving
}: CompletionStepProps) {
  const { user } = useAuth()

  const completedFeatures = [
    data.personalProfile.fullName && "Personal profile",
    data.companyProfile.legalCompanyName && "Company information", 
    data.businessProfile.businessName && "Business settings",
    data.branchSetup.branchName && "First branch location",
    data.staffSetup.teamMembers.length > 0 && `${data.staffSetup.teamMembers.length} team member${data.staffSetup.teamMembers.length > 1 ? 's' : ''} invited`
  ].filter(Boolean)

  const getWelcomeMessage = () => {
    const name = data.personalProfile.fullName || user?.displayName || 'there'
    const businessName = data.businessProfile.businessName || 'your business'
    
    return {
      greeting: `Welcome to FahamPesa, ${name}! 🎉`,
      message: `${businessName} is now ready to take off with professional business management tools.`
    }
  }

  const { greeting, message } = getWelcomeMessage()

  return (
    <div className="max-w-3xl mx-auto">
      <CardHeader className="text-center pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-white" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
            {greeting}
          </CardTitle>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {message}
          </p>
        </motion.div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Setup Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-green-50 border border-green-200 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Setup Complete!</h3>
          </div>
          
          {completedFeatures.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {completedFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-2 text-sm text-green-800"
                >
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* What's Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-gray-900 text-center">
            What's Next?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nextSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${step.color} flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Features Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-gradient-to-br from-[#004AAD]/5 to-[#FF9500]/5 border border-[#004AAD]/20 rounded-xl p-6"
        >
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              You now have access to:
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.05 }}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <Star className="w-4 h-4 text-[#FF9500] flex-shrink-0" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-center space-y-6"
        >
          <Button
            onClick={onComplete}
            disabled={isLoading}
            className="w-full max-w-md mx-auto py-4 text-lg bg-gradient-to-r from-[#004AAD] to-[#003a8c] hover:from-[#003a8c] hover:to-[#002a6c] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
            size="lg"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Go to Dashboard
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </Button>

          <div className="text-sm text-gray-500 space-y-2">
            <p>
              You can always update your settings by visiting the{' '}
              <Settings className="w-4 h-4 inline" /> Settings page.
            </p>
            <p>
              Need help? Our support team is ready to assist you at every step.
            </p>
          </div>
        </motion.div>
      </CardContent>
    </div>
  )
}
