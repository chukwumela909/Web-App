'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StaffProtectedRoute from '@/components/auth/StaffProtectedRoute'
import { authedFetch } from '@/lib/authed-fetch'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  StaffRole,
  STAFF_PERMISSIONS
} from '@/lib/firestore'
import { createBackendStaffInvitation } from '@/lib/backend-business-api'
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
  const [inviteResult, setInviteResult] = useState<{ inviteUrl: string; email: string; emailed: boolean } | null>(null)
  const [copied, setCopied] = useState(false)

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
    salary: ''
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

    const email = newStaff.email.trim()
    if (!user || !email) {
      alert("Please enter the staff member's email")
      return
    }
    if (newStaff.branchIds.length === 0) {
      alert('Please assign at least one branch')
      return
    }

    setCreating(true)
    try {
      // Cashiers get sales-only access; managers get their full permission set
      const permissions = newStaff.role === 'cashier' ? ['sales'] : STAFF_PERMISSIONS[newStaff.role as StaffRole] || []
      const invitation = await createBackendStaffInvitation({
        email,
        role: newStaff.role,
        branchIds: newStaff.branchIds,
        permissions
      })

      // Build the invite link from THIS app's origin + token — the backend's inviteUrl
      // host depends on its own env and may not point at the web app.
      const rawUrl = String((invitation as { inviteUrl?: string })?.inviteUrl || '')
      let token = ''
      try { token = new URL(rawUrl).searchParams.get('token') || '' } catch { token = '' }
      const inviteUrl = token ? `${window.location.origin}/staff/invite?token=${token}` : rawUrl

      // Best-effort email delivery; the link is shown regardless so it can be shared manually.
      // The route returns HTTP 200 even when it couldn't send (e.g. no Brevo key), so trust the
      // `emailed` flag in the body — not res.ok — or we'd falsely report success.
      let emailed = false
      try {
        const res = await authedFetch('/api/staff/invite-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, inviteUrl, role: newStaff.role, businessName: user.displayName || undefined })
        })
        const data = await res.json().catch(() => null)
        emailed = res.ok && data?.emailed === true
      } catch {
        emailed = false
      }

      setInviteResult({ inviteUrl, email, emailed })
    } catch (error) {
      console.error('Error inviting staff:', error)
      alert(error instanceof Error ? error.message : 'Failed to send invitation')
    } finally {
      setCreating(false)
    }
  }

  const copyInviteLink = async () => {
    if (!inviteResult) return
    try {
      await navigator.clipboard.writeText(inviteResult.inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore clipboard failures
    }
  }

  // Filter branches based on search term
  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(branchSearchTerm.toLowerCase()) ||
    (branch.branchCode && branch.branchCode.toLowerCase().includes(branchSearchTerm.toLowerCase()))
  )

  const isFormValid = Boolean(newStaff.email && newStaff.branchIds.length > 0)

  return (
    <ProtectedRoute>
      <StaffProtectedRoute requiredPermission="staff:create">
        <DashboardLayout>
          <motion.div
            className="space-y-6 max-w-4xl mx-auto"
            {...fadeInUp}
          >
            {/* Header */}
            <div className="dashboard-panel p-8">
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
                      <h1 className="dashboard-page-title">Add New Staff Member</h1>
                      <p className="dashboard-page-subtitle mt-1">
                        Create a new team member account with proper permissions
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {inviteResult && (
              <div className="dashboard-panel p-6 border border-green-200 bg-green-50">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900">Invitation sent</h3>
                    <p className="text-sm text-green-800 mt-1">
                      {inviteResult.emailed
                        ? `An invitation email was sent to ${inviteResult.email}.`
                        : `Invitation created for ${inviteResult.email}. Email delivery could not be confirmed — share the link below.`}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <input
                        readOnly
                        value={inviteResult.inviteUrl}
                        onFocus={(e) => e.currentTarget.select()}
                        className="flex-1 px-3 py-2 text-sm border border-green-300 rounded-lg bg-white"
                      />
                      <Button type="button" variant="outline" onClick={copyInviteLink} className="px-4">
                        {copied ? 'Copied!' : 'Copy link'}
                      </Button>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <Button
                        type="button"
                        onClick={() => router.push('/dashboard/staff')}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        Done
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setInviteResult(null)
                          setNewStaff(prev => ({ ...prev, email: '', fullName: '', branchIds: [] }))
                        }}
                      >
                        Invite another
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            {!inviteResult && (
            <Card className="dashboard-panel">
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
                          Full Name <span className="text-gray-400 text-xs">(optional, for your reference)</span>
                        </label>
                        <input
                          type="text"
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
                      <div className="md:col-span-2 bg-blue-50 rounded-xl p-4 border border-blue-200 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-900">
                          An invitation link will be emailed to this address. The staff member sets
                          their own password when they accept — you don&apos;t set a password here.
                        </p>
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
                            Sending...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Send Invitation
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
            )}
          </motion.div>
        </DashboardLayout>
      </StaffProtectedRoute>
    </ProtectedRoute>
  )
}
