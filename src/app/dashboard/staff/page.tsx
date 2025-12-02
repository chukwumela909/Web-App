'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Staff, 
  StaffActivityLog, 
  StaffRole, 
  StaffStatus,
  STAFF_PERMISSIONS 
} from '@/lib/firestore'
import { getBranches } from '@/lib/branches-service'
import { Branch } from '@/lib/branches-types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  UserPlus,
  Shield,
  Activity,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Calendar,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Settings,
  Tag
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

// Utility functions
const getStatusIcon = (status: StaffStatus) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'inactive':
      return <XCircle className="h-4 w-4 text-gray-400" />
    case 'suspended':
      return <AlertCircle className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-400" />
  }
}

const getRoleColor = (role: StaffRole) => {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-800'
    case 'manager':
      return 'bg-blue-100 text-blue-800'
    case 'cashier':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getSeverityIcon = (severity: StaffActivityLog['severity']) => {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-red-500" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-400" />
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    case 'info':
    default:
      return <CheckCircle className="h-4 w-4 text-blue-500" />
  }
}



export default function StaffPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('staff-list')
  const [staff, setStaff] = useState<Staff[]>([])
  const [activityLogs, setActivityLogs] = useState<StaffActivityLog[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<StaffRole | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<StaffStatus | 'all'>('all')
  const [selectedBranch, setSelectedBranch] = useState<string | 'all'>('all')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successStaffName, setSuccessStaffName] = useState('')

  useEffect(() => {
    if (user) {
      loadStaff()
      loadActivityLogs()
      loadBranches()
    }
  }, [user])

  // Check for success message from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const created = urlParams.get('created')
    const name = urlParams.get('name')
    
    if (created === 'true' && name) {
      setSuccessStaffName(decodeURIComponent(name))
      setShowSuccessMessage(true)
      // Clean up URL
      router.replace('/dashboard/staff')
    }
  }, [])

  const loadStaff = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/staff?userId=${user?.uid}`)
      const result = await response.json()
      
      if (result.success) {
        setStaff(result.data)
      } else {
        console.error('Failed to load staff:', result.error)
      }
    } catch (error) {
      console.error('Error loading staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActivityLogs = async () => {
    try {
      const response = await fetch(`/api/staff/logs?userId=${user?.uid}&limit=50`)
      const result = await response.json()
      
      if (result.success) {
        setActivityLogs(result.data)
      }
    } catch (error) {
      console.error('Error loading activity logs:', error)
    }
  }

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


  const handleUpdateStaffStatus = async (staffId: string, status: StaffStatus) => {
    try {
      let url = `/api/staff/${staffId}`
      let method = 'PUT'
      let body = JSON.stringify({
        userId: user?.uid,
        status
      })

      // Special case for activation
      if (status === 'active') {
        url = `/api/staff/${staffId}/activate`
        method = 'POST'
        body = JSON.stringify({ userId: user?.uid })
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body
      })

      const result = await response.json()
      
      if (result.success) {
        await loadStaff()
        await loadActivityLogs()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating staff status:', error)
      alert('Failed to update staff status')
    }
  }

  const handleStaffDetails = (staffMember: Staff) => {
    router.push(`/dashboard/staff/${staffMember.id}`)
  }

  // Filter staff based on search and filters
  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = selectedRole === 'all' || s.role === selectedRole
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus
    const matchesBranch = selectedBranch === 'all' || s.branchIds.includes(selectedBranch)
    
    return matchesSearch && matchesRole && matchesStatus && matchesBranch
  })



    if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Card className="bg-white border-0 shadow-lg">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Staff Management</h3>
                <p className="text-gray-600">Fetching your team data...</p>
              </div>
            </div>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <motion.div 
          className="space-y-6"
          {...fadeInUp}
        >
          {/* Consistent Header */}
          <div className="bg-white rounded-xl p-8 shadow-lg border-0">
            <motion.div {...fadeInUp} className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-600 rounded-lg p-3">
                    <Users className="h-8 w-8 text-white" />
                  </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-gray-600 mt-1 text-base">
                Manage your team members, roles, and permissions
              </p>
            </div>
                </div>
                
                <div className="flex items-center gap-8 text-sm text-gray-500">
                  <span>{staff.length} Team Members</span>
                  <span>{staff.filter(s => s.status === 'active').length} Active</span>
                  <span>{activityLogs.length} Recent Activities</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={loadStaff}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
                
                <Button
                  onClick={() => router.push('/dashboard/staff/add')}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
            </div>
            </motion.div>
          </div>

          {/* Consistent Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="initial"
            animate="animate"
            variants={{
              animate: { transition: { staggerChildren: 0.1 } }
            }}
          >
            <motion.div variants={fadeInUp}>
                            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Staff</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{staff.length}</p>
                      <p className="text-xs text-gray-400 mt-1">Team Members</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
            
                        <motion.div variants={fadeInUp}>
              <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Active Staff</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{staff.filter(s => s.status === 'active').length}</p>
                      <div className="flex items-center mt-2">
                        <div className="bg-gray-100 rounded-full h-1.5 w-12 mr-2">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${staff.length ? (staff.filter(s => s.status === 'active').length / staff.length) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {staff.length ? Math.round((staff.filter(s => s.status === 'active').length / staff.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <UserCheck className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Managers</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{staff.filter(s => s.role === 'manager').length}</p>
                      <p className="text-xs text-gray-400 mt-1">Leadership Team</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <Shield className="h-6 w-6 text-slate-600" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Recent Activities</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{activityLogs.length}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activityLogs.length > 0 ? 'Recent Actions' : 'No Activity'}
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <Activity className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Consistent Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <Card className="bg-white border-0 shadow-lg mb-6">
              <div className="p-3">
                <TabsList className="grid w-full grid-cols-3 bg-gray-50 rounded-lg p-1">
                  <TabsTrigger 
                    value="staff-list"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 text-gray-600 font-medium transition-all duration-200"
                  >
                    <Users className="h-4 w-4" />
                    Staff List
                  </TabsTrigger>
                  <TabsTrigger 
                    value="permissions"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 text-gray-600 font-medium transition-all duration-200"
                  >
                    <Shield className="h-4 w-4" />
                    Permissions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="activity-logs"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 text-gray-600 font-medium transition-all duration-200"
                  >
                    <Activity className="h-4 w-4" />
                    Activity
                  </TabsTrigger>
                </TabsList>
              </div>
            </Card>

            {/* Staff List Tab */}
            <TabsContent value="staff-list" className="space-y-6">
                            {/* Consistent Filters */}
              <Card className="bg-white border-0 shadow-lg">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search staff by name, email, or employee ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                    <div className="flex gap-3">
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as StaffRole | 'all')}
                        className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
                      >
                        <option value="all">All Roles</option>
                        <option value="owner">Owner</option>
                        <option value="manager">Manager</option>
                        <option value="cashier">Cashier</option>
                      </select>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as StaffStatus | 'all')}
                        className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
                      >
                        <option value="all">All Branches</option>
                        {branches.map(branch => (
                          <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' || selectedBranch !== 'all') && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                      <span>Filters:</span>
                      {searchTerm && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">"{searchTerm}"</span>
                      )}
                      {selectedRole !== 'all' && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">{selectedRole}</span>
                      )}
                      {selectedStatus !== 'all' && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">{selectedStatus}</span>
                      )}
                      {selectedBranch !== 'all' && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                          {branches.find(b => b.id === selectedBranch)?.name || selectedBranch}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setSelectedRole('all')
                          setSelectedStatus('all')
                          setSelectedBranch('all')
                        }}
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium ml-2"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Enhanced Staff Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredStaff.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-50 rounded-lg p-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                  {member.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                {member.fullName}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getRoleColor(member.role)}`}>
                                  {member.role}
                                </span>
                                {member.employeeId && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium">
                                    ID: {member.employeeId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(member.status)}
                            <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                              member.status === 'active' ? 'bg-green-50 text-green-700' :
                              member.status === 'inactive' ? 'bg-gray-100 text-gray-600' :
                              'bg-red-50 text-red-700'
                            }`}>
                              {member.status}
                            </span>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="font-medium truncate">{member.email}</span>
                          </div>
                          
                                {member.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{member.phone}</span>
                                  </div>
                                )}
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Last Login: {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}</span>
                              </div>
                        </div>

                        {/* Branches */}
                        <div className="mb-6">
                          <p className="text-sm font-medium text-gray-700 mb-2">Assigned Branches</p>
                          {member.branchIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {member.branchIds.slice(0, 2).map(branchId => {
                                const branch = branches.find(b => b.id === branchId)
                                return (
                                  <span key={branchId} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700 font-medium">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {branch?.name || branchId}
                                  </span>
                                )
                              })}
                              {member.branchIds.length > 2 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600 font-medium">
                                  +{member.branchIds.length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No branches assigned</span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStaffDetails(member)}
                            className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {member.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStaffStatus(member.id, 'inactive')}
                              className="hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStaffStatus(member.id, 'active')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                        ))}
                  </div>

                                    {filteredStaff.length === 0 && (
                <Card className="bg-white border-0 shadow-lg">
                  <div className="text-center py-16">
                    <div className="bg-gray-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <Users className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' || selectedBranch !== 'all') ? 'No Staff Match Your Search' : 'No Staff Members Yet'}
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' || selectedBranch !== 'all') 
                        ? 'Try adjusting your search filters or add a new staff member.'
                        : 'Build your team by adding staff members with different roles and permissions.'}
                    </p>
                    
                    {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' || selectedBranch !== 'all') ? (
                      <div className="flex items-center justify-center gap-4">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSearchTerm('')
                            setSelectedRole('all')
                            setSelectedStatus('all')
                            setSelectedBranch('all')
                          }}
                        >
                          Clear Filters
                        </Button>
                        <Button 
                          onClick={() => router.push('/dashboard/staff/add')} 
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Staff Member
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Button 
                          onClick={() => router.push('/dashboard/staff/add')}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-6 py-3"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Your First Staff Member
                        </Button>
                        <div className="flex items-center justify-center gap-8 text-sm text-gray-500 mt-6">
                          <span>• Role-based permissions</span>
                          <span>• Multi-branch access</span>
                          <span>• Activity tracking</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </TabsContent>



            {/* Roles & Permissions Tab */}
            <TabsContent value="permissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Role-Based Permissions
                  </CardTitle>
                  <CardDescription>
                    Overview of what each role can and cannot do in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(STAFF_PERMISSIONS).map(([role, permissions]) => (
                      <div key={role} className="border rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(role as StaffRole)}`}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </span>
                          <span className="text-gray-600">
                            {role === 'owner' ? 'Full system access' : `${permissions.length} permissions`}
                          </span>
                        </div>
                        
                        {role === 'owner' ? (
                          <p className="text-gray-600">
                            Owners have complete access to all system features and can perform any action.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {permissions.map((permission) => (
                              <div key={permission} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>{permission.replace(':', ': ').replace('_', ' ')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Logs Tab */}
            <TabsContent value="activity-logs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Staff Activity Logs
                  </CardTitle>
                  <CardDescription>
                    Track all staff actions and system events for auditing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activityLogs.length > 0 ? (
                    <div className="space-y-4">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex-shrink-0 mt-1">
                            {getSeverityIcon(log.severity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-900">
                                {log.staffName}
                              </p>
                              <span className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">
                              {log.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Action: {log.action}</span>
                              {log.metadata.branchName && (
                                <span>Branch: {log.metadata.branchName}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No activity logs found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Success Dialog */}
        {showSuccessMessage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
            >
              {/* Success Icon */}
              <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              {/* Success Message */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Staff Member Created!</h2>
              <p className="text-gray-600 mb-6">
                <span className="font-medium">{successStaffName}</span> has been successfully added to your team.
                <br />
                <span className="text-sm text-blue-600 mt-2 block">
                  Default access: Sales module only. You can modify permissions later.
                </span>
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </DashboardLayout>
    </ProtectedRoute>
  )
}
