'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  isLoading,
  isSaving
}: WelcomeStepProps) {
  return (
    <div className="text-center">
      <CardHeader className="pb-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-2"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-[#004AAD] to-[#FF9500] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to FahamPesa! 🎉
          </CardTitle>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Let's set up your account so you can start managing your business like a pro.
            This will only take a few minutes.
          </p>
        </motion.div>
      </CardHeader>

      <CardContent className="space-y-8">
      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
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

        <div className="text-xs text-gray-500 max-w-md mx-auto">
          <p>
            <strong>Pro tip:</strong> Completing setup now gives your account the business workspace it needs.
            You can always update your information later in Settings.
          </p>
        </div>
      </motion.div>
      </CardContent>
    </div>
  )
}
