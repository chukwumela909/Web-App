'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight,
  Users,
  Plus,
  X,
  Mail,
  CheckCircle,
  ChevronDown,
  UserCheck,
  Crown,
  Shield,
  User,
  Info
} from 'lucide-react'
import { OnboardingData } from '../OnboardingWizard'

interface StaffSetupStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onSkip: () => void
  isLoading: boolean
  isSaving: boolean
}

type StaffRole = 'admin' | 'manager' | 'staff'

const roles = [
  { 
    value: 'admin', 
    label: 'Admin', 
    icon: Crown,
    description: 'Full access to all features and settings',
    color: 'text-purple-600 bg-purple-100'
  },
  { 
    value: 'manager', 
    label: 'Manager', 
    icon: Shield,
    description: 'Manage inventory, approve transfers, view reports',
    color: 'text-blue-600 bg-blue-100'
  },
  { 
    value: 'staff', 
    label: 'Staff', 
    icon: User,
    description: 'Handle sales, basic inventory, customer management',
    color: 'text-green-600 bg-green-100'
  }
]

export default function StaffSetupStep({
  data,
  updateData,
  onNext,
  onSkip,
  isLoading,
  isSaving
}: StaffSetupStepProps) {
  const [teamMembers, setTeamMembers] = useState(data.staffSetup.teamMembers)
  const [skipForNow, setSkipForNow] = useState(data.staffSetup.skipForNow)
  const [newMember, setNewMember] = useState({ email: '', role: 'staff' as StaffRole })
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const addTeamMember = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!newMember.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(newMember.email)) {
      newErrors.email = 'Please enter a valid email address'
    } else if (teamMembers.some(member => member.email.toLowerCase() === newMember.email.toLowerCase())) {
      newErrors.email = 'This email is already added'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      const updatedMembers = [...teamMembers, { ...newMember }]
      setTeamMembers(updatedMembers)
      setNewMember({ email: '', role: 'staff' })
      
      // Update parent state
      updateData({
        staffSetup: {
          ...data.staffSetup,
          teamMembers: updatedMembers,
          skipForNow: false
        }
      })
    }
  }

  const removeTeamMember = (index: number) => {
    const updatedMembers = teamMembers.filter((_, i) => i !== index)
    setTeamMembers(updatedMembers)
    
    // Update parent state
    updateData({
      staffSetup: {
        ...data.staffSetup,
        teamMembers: updatedMembers
      }
    })
  }

  const handleSkipToggle = (skip: boolean) => {
    setSkipForNow(skip)
    updateData({
      staffSetup: {
        ...data.staffSetup,
        skipForNow: skip,
        teamMembers: skip ? [] : teamMembers
      }
    })
  }

  const handleNext = () => {
    onNext()
  }

  const getRoleIcon = (role: StaffRole) => {
    const roleData = roles.find(r => r.value === role)
    return roleData ? roleData.icon : User
  }

  const getRoleColor = (role: StaffRole) => {
    const roleData = roles.find(r => r.value === role)
    return roleData ? roleData.color : 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="max-w-3xl mx-auto">
      <CardHeader className="text-center pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-gradient-to-br from-[#004AAD] to-[#FF9500] rounded-xl flex items-center justify-center mx-auto mb-4"
        >
          <Users className="w-8 h-8 text-white" />
        </motion.div>
        
        <CardTitle className="text-2xl font-bold text-gray-900">
          Invite Your Team
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Add team members who will help you run your business. They'll receive email invitations to join.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Skip Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-blue-800 font-medium mb-2">Running solo for now?</p>
            <p className="text-blue-700 text-sm mb-3">
              No problem! You can always invite team members later from your dashboard.
            </p>
            <Button
              variant={skipForNow ? "default" : "outline"}
              onClick={() => handleSkipToggle(!skipForNow)}
              className="text-sm"
            >
              {skipForNow ? "✓ I'll add team members later" : "Skip team setup"}
            </Button>
          </div>
        </motion.div>

        {/* Team Member Addition */}
        <AnimatePresence>
          {!skipForNow && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              {/* Add New Member Form */}
              <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Team Member
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="memberEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="memberEmail"
                        type="email"
                        value={newMember.email}
                        onChange={(e) => {
                          setNewMember(prev => ({ ...prev, email: e.target.value }))
                          if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                        }}
                        placeholder="team@example.com"
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        onKeyPress={(e) => e.key === 'Enter' && addTeamMember()}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="memberRole" className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="relative">
                      <select
                        id="memberRole"
                        value={newMember.role}
                        onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value as StaffRole }))}
                        className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-colors appearance-none"
                      >
                        {roles.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={addTeamMember}
                  className="mt-4 bg-[#004AAD] hover:bg-[#003a8c] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              </div>

              {/* Team Members List */}
              {teamMembers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Team Members ({teamMembers.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {teamMembers.map((member, index) => {
                      const RoleIcon = getRoleIcon(member.role)
                      const roleData = roles.find(r => r.value === member.role)
                      
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoleColor(member.role)}`}>
                              <RoleIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{member.email}</p>
                              <p className="text-sm text-gray-600">{roleData?.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                              {member.role}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTeamMember(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Roles Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-3">Role Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {roles.map((role) => {
                    const Icon = role.icon
                    return (
                      <div key={role.value} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${role.color} flex-shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{role.label}</p>
                          <p className="text-xs text-gray-600">{role.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            Skip This Step
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="flex-1 bg-[#004AAD] hover:bg-[#003a8c] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                {skipForNow ? "Continue" : `Continue ${teamMembers.length > 0 ? `(${teamMembers.length} invites)` : ""}`}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </motion.div>
      </CardContent>
    </div>
  )
}
