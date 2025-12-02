'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Sparkles,
  ArrowRight,
  Clock,
  Shield,
  Zap,
  Users
} from 'lucide-react'
import { OnboardingData } from '../OnboardingWizard'

interface WelcomeStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onSkipToEnd: () => void
  isLoading: boolean
  isSaving: boolean
}

const features = [
  {
    icon: Clock,
    title: "Quick Setup",
    description: "Get started in just 5 minutes"
  },
  {
    icon: Shield,
    title: "Secure by design",
    description: "Your data is encrypted and secure"
  },
  {
    icon: Zap,
    title: "Powerful Features",
    description: "Everything you need to run your business"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite and manage your team members"
  }
]

export default function WelcomeStep({
  data,
  updateData,
  onNext,
  onSkipToEnd,
  isLoading,
  isSaving
}: WelcomeStepProps) {
  return (
    <div className="p-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-[#004AAD] to-[#FF9500] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to FahamPesa! 🎉
        </h1>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Let's set up your account so you can start managing your business like a pro. 
          This will only take a few minutes, and you can always complete it later.
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            className="bg-gray-50 rounded-xl p-4 text-center"
          >
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm">
              <feature.icon className="w-6 h-6 text-[#004AAD]" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-600">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-4"
      >
        <Button
          onClick={onNext}
          disabled={isLoading}
          className="w-full max-w-md mx-auto py-3 bg-[#004AAD] hover:bg-[#003a8c] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          size="lg"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              Let's Get Started
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={onSkipToEnd}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700"
          >
            Skip setup and go to dashboard
          </Button>
        </div>

        <div className="text-xs text-gray-500 max-w-md mx-auto">
          <p>
            ✨ <strong>Pro tip:</strong> Completing the setup now will help you get the most out of FahamPesa. 
            You can always update your information later in Settings.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
