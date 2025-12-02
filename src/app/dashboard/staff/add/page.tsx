'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StaffProtectedRoute from '@/components/auth/StaffProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  StaffRole, 
  STAFF_PERMISSIONS 
} from '@/lib/firestore'
import { getBranches } from '@/lib/branches-service'
import { Branch } from '@/lib/branches-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  UserPlus,
  ArrowLeft,
  Users,
  Shield,
  Search,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

export default function AddStaffPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [branchSearchTerm, setBranchSearchTerm] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  // Form state for adding new staff
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'cashier' as StaffRole,
    branchIds: [] as string[],
    employeeId: '',
    salary: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    twoFactorEnabled: false
  })

  useEffect(() => {
    if (user) {
      loadBranches()
    }
  }, [user])

  const loadBranches = async () => {
    try {
      setBranchesLoading(true)
      const userBranches = await getBranches(user!.uid)
      setBranches(userBranches)
    } catch (error) {
      console.error('Error loading branches:', error)
    } finally {
      setBranchesLoading(false)
    }
  }

  const validatePasswords = (password?: string, confirmPassword?: string) => {
    const pwd = password !== undefined ? password : newStaff.password
    const confirmPwd = confirmPassword !== undefined ? confirmPassword : newStaff.confirmPassword
    
    if (pwd !== confirmPwd) {
      setPasswordError('Passwords do not match')
      return false
    }
    if (pwd.length < 6) {
      setPasswordError('Password must be at least 6 characters long')
      return false
    }
    setPasswordError('')
    return true
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !newStaff.fullName || !newStaff.email || !newStaff.password) {
      alert('Please fill in all required fields')
      return
    }

    if (!validatePasswords()) {
      return
    }

    setCreating(true)
    try {
      // Set default permissions for cashiers (only sales module access)
      const staffData = {
        userId: user.uid,
        fullName: newStaff.fullName,
        email: newStaff.email,
        password: newStaff.password,
        phone: newStaff.phone,
        role: newStaff.role,
        branchIds: newStaff.branchIds,
        employeeId: newStaff.employeeId,
        salary: newStaff.salary ? parseFloat(newStaff.salary) : undefined,
        emergencyContact: newStaff.emergencyContact,
        twoFactorEnabled: newStaff.twoFactorEnabled,
        permissions: newStaff.role === 'cashier' ? ['sales'] : STAFF_PERMISSIONS[newStaff.role as StaffRole] || []
      }

      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(staffData)
      })

      const result = await response.json()
      
      if (result.success) {
        // Navigate back to staff list with success message
        router.push('/dashboard/staff?created=true&name=' + encodeURIComponent(newStaff.fullName))
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating staff:', error)
      alert('Failed to create staff member')
    } finally {
      setCreating(false)
    }
  }

  // Filter branches based on search term
  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(branchSearchTerm.toLowerCase()) ||
    (branch.branchCode && branch.branchCode.toLowerCase().includes(branchSearchTerm.toLowerCase()))
  )

  const isFormValid = newStaff.fullName && newStaff.email && newStaff.password && newStaff.confirmPassword && !passwordError

  return (
    <ProtectedRoute>
      <StaffProtectedRoute requiredPermission="staff:create">
        <DashboardLayout>
          <motion.div 
            className="space-y-6 max-w-4xl mx-auto"
            {...fadeInUp}
          >
            {/* Header */}
            <div className="bg-white rounded-xl p-8 shadow-lg border-0">
              <motion.div {...fadeInUp} className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <Button
                      onClick={() => router.back()}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <div className="bg-blue-600 rounded-lg p-3">
                      <UserPlus className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Add New Staff Member</h1>
                      <p className="text-gray-600 mt-1 text-base">
                        Create a new team member account with proper permissions
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Form */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Staff Information
                </CardTitle>
                <CardDescription>
                  Fill in the details for the new staff member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStaff} className="space-y-8">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newStaff.fullName}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, fullName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={newStaff.email}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={newStaff.password}
                            onChange={(e) => {
                              const newPassword = e.target.value
                              setNewStaff(prev => ({ ...prev, password: newPassword }))
                              if (newStaff.confirmPassword) {
                                validatePasswords(newPassword, newStaff.confirmPassword)
                              }
                            }}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Create a secure password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={newStaff.confirmPassword}
                            onChange={(e) => {
                              const newConfirmPassword = e.target.value
                              setNewStaff(prev => ({ ...prev, confirmPassword: newConfirmPassword }))
                              if (newConfirmPassword && newStaff.password) {
                                validatePasswords(newStaff.password, newConfirmPassword)
                              }
                            }}
                            className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              passwordError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="Confirm your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordError && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {passwordError}
                          </p>
                        )}
                        {!passwordError && newStaff.password && newStaff.confirmPassword && newStaff.password === newStaff.confirmPassword && (
                          <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Passwords match
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={newStaff.phone}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="+254 700 000 000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Employee ID
                        </label>
                        <input
                          type="text"
                          value={newStaff.employeeId}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, employeeId: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="EMP001"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role & Access */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Role & Access Permissions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={newStaff.role}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value as StaffRole }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="cashier">Cashier - Basic sales operations</option>
                          <option value="manager">Manager - Advanced management access</option>
                          <option value="owner">Owner - Full system access</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Salary (Optional)
                        </label>
                        <input
                          type="number"
                          value={newStaff.salary}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, salary: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Monthly salary"
                        />
                      </div>
                    </div>

                    {/* Assigned Branches */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Assigned Branches
                      </label>
                      
                      {/* Branch Search */}
                      <div className="mb-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search branches..."
                            value={branchSearchTerm}
                            onChange={(e) => setBranchSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 max-h-48 overflow-y-auto">
                        {branchesLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            <span className="ml-2 text-sm text-gray-600">Loading branches...</span>
                          </div>
                        ) : filteredBranches.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredBranches.map(branch => (
                              <label key={branch.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-blue-500 transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newStaff.branchIds.includes(branch.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewStaff(prev => ({
                                        ...prev,
                                        branchIds: [...prev.branchIds, branch.id]
                                      }))
                                    } else {
                                      setNewStaff(prev => ({
                                        ...prev,
                                        branchIds: prev.branchIds.filter(id => id !== branch.id)
                                      }))
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                />
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{branch.name}</span>
                                  {branch.branchCode && (
                                    <span className="text-xs text-gray-500 block">({branch.branchCode})</span>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              {branchSearchTerm ? 'No branches found matching your search' : 'No branches available'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Security Options */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newStaff.twoFactorEnabled}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            Enable Two-Factor Authentication
                          </span>
                          <p className="text-xs text-gray-600">
                            Adds an extra layer of security to this account
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Emergency Contact (Optional)</h3>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Name
                          </label>
                          <input
                            type="text"
                            value={newStaff.emergencyContact.name}
                            onChange={(e) => setNewStaff(prev => ({ 
                              ...prev, 
                              emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Emergency contact name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Phone
                          </label>
                          <input
                            type="tel"
                            value={newStaff.emergencyContact.phone}
                            onChange={(e) => setNewStaff(prev => ({ 
                              ...prev, 
                              emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Relationship
                          </label>
                          <select
                            value={newStaff.emergencyContact.relationship}
                            onChange={(e) => setNewStaff(prev => ({ 
                              ...prev, 
                              emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            <option value="">Select relationship</option>
                            <option value="spouse">Spouse</option>
                            <option value="parent">Parent</option>
                            <option value="sibling">Sibling</option>
                            <option value="friend">Friend</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-6 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Info className="h-4 w-4" />
                      All required fields must be filled
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="px-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={creating || !isFormValid}
                        className={`px-8 flex items-center gap-2 ${
                          creating || !isFormValid
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {creating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Create Staff Member
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </DashboardLayout>
      </StaffProtectedRoute>
    </ProtectedRoute>
  )
}
