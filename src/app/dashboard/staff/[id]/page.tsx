'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { getBranches } from '@/lib/branches-service'
import { Branch } from '@/lib/branches-types'
import { Staff, StaffRole, STAFF_PERMISSIONS } from '@/lib/firestore'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Tag,
  MapPin,
  Users,
  Settings,
  Plus,
  Save,
  X,
  AlertTriangle,
  Search
} from 'lucide-react'

// Utility functions (same as before)
const getStatusIcon = (status: Staff['status']) => {
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

const getStatusColor = (status: Staff['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'suspended':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

interface StaffDetailsPageProps {}

export default function StaffDetailsPage({}: StaffDetailsPageProps) {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const currency = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  
  const [staff, setStaff] = useState<Staff | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [branchesLoading, setBranchesLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editingPermissions, setEditingPermissions] = useState(false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showBranchManager, setShowBranchManager] = useState(false)
  
  const [staffPermissions, setStaffPermissions] = useState<string[]>([])
  
  // Convert structured permissions to module names for UI display
  const getModuleFromPermissions = (permissions: string[]): string[] => {
    const modules = new Set<string>()
    permissions.forEach(permission => {
      if (permission.includes(':')) {
        const permissionModule = permission.split(':')[0]
        modules.add(permissionModule)
      } else {
        modules.add(permission)
      }
    })
    return Array.from(modules)
  }
  
  // Convert module names back to structured permissions
  const getPermissionsFromModules = (modules: string[]): string[] => {
    const allPermissions: string[] = []
    modules.forEach(module => {
      switch (module) {
        case 'sales':
          allPermissions.push('sales:create', 'sales:read')
          break
        case 'products':
          allPermissions.push('products:read', 'products:create', 'products:update')
          break
        case 'inventory':
          allPermissions.push('inventory:read', 'inventory:adjust')
          break
        case 'reports':
          allPermissions.push('reports:basic_read', 'reports:full_read')
          break
        case 'staff':
          allPermissions.push('staff:read', 'staff:manage_branch')
          break
        case 'branches':
          allPermissions.push('branches:read', 'branches:manage')
          break
        case 'suppliers':
          allPermissions.push('suppliers:read', 'suppliers:manage')
          break
        default:
          allPermissions.push(module)
      }
    })
    return allPermissions
  }
  
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  
  // Form state for editing details
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'cashier' as StaffRole,
    employeeId: '',
    salary: 0,
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  })

  const availableModules = [
    { id: 'sales', name: 'Sales', description: 'Record sales and manage transactions' },
    { id: 'products', name: 'Products', description: 'Manage product catalog and inventory' },
    { id: 'inventory', name: 'Inventory', description: 'Track stock levels and movements' },
    { id: 'reports', name: 'Reports', description: 'View and generate business reports' },
    { id: 'staff', name: 'Staff', description: 'Manage team members and permissions' },
    { id: 'branches', name: 'Branches', description: 'Manage branch locations and settings' },
    { id: 'suppliers', name: 'Suppliers', description: 'Manage supplier relationships' }
  ]

  // Load staff member details
  useEffect(() => {
    if (user && params.id) {
      loadStaffDetails()
      loadBranches()
    }
  }, [user, params.id])

  const loadStaffDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/staff/${params.id}`)
      if (response.ok) {
        const { data } = await response.json()
        setStaff(data)
        setStaffPermissions(data.permissions || STAFF_PERMISSIONS[data.role as StaffRole] || [])
        setSelectedModules(getModuleFromPermissions(data.permissions || []))
        
        // Initialize edit form
        setEditForm({
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || 'cashier',
          employeeId: data.employeeId || '',
          salary: data.salary || 0,
          emergencyContact: data.emergencyContact || {
            name: '',
            phone: '',
            relationship: ''
          }
        })
      } else {
        console.error('Failed to fetch staff details')
        router.push('/dashboard/staff')
      }
    } catch (error) {
      console.error('Error loading staff details:', error)
      router.push('/dashboard/staff')
    } finally {
      setLoading(false)
    }
  }

  const loadBranches = async () => {
    if (!user?.uid) return
    
    try {
      setBranchesLoading(true)
      const fetchedBranches = await getBranches(user.uid)
      setBranches(fetchedBranches)
    } catch (error) {
      console.error('Error loading branches:', error)
    } finally {
      setBranchesLoading(false)
    }
  }

  const handleSavePermissions = async () => {
    if (!staff) return
    
    try {
      const structuredPermissions = getPermissionsFromModules(selectedModules)
      
      const response = await fetch(`/api/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: staff.userId,
          permissions: structuredPermissions 
        })
      })

      if (response.ok) {
        setStaffPermissions(structuredPermissions)
        setEditingPermissions(false)
        await loadStaffDetails() // Refresh data
        alert('Permissions updated successfully!')
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`Failed to update permissions: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      alert('Failed to update permissions')
    }
  }

  const handleSaveDetails = async () => {
    if (!staff) return
    
    try {
      const response = await fetch(`/api/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: staff.userId,
          ...editForm
        })
      })

      if (response.ok) {
        setEditingDetails(false)
        await loadStaffDetails() // Refresh data
        alert('Staff details updated successfully!')
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`Failed to update details: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating details:', error)
      alert('Failed to update details')
    }
  }

  const handleDeleteStaff = async () => {
    if (!staff) return
    
    try {
      const response = await fetch(`/api/staff/${staff.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: staff.userId })
      })

      if (response.ok) {
        alert('Staff member deactivated successfully!')
        router.push('/dashboard/staff')
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`Failed to deactivate staff: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deactivating staff:', error)
      alert('Failed to deactivate staff')
    }
  }

  const handleRemoveBranch = async (branchIdToRemove: string) => {
    if (!staff) return
    
    try {
      const updatedBranchIds = staff.branchIds.filter(id => id !== branchIdToRemove)
      
      const response = await fetch(`/api/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: staff.userId,
          branchIds: updatedBranchIds
        })
      })

      if (response.ok) {
        await loadStaffDetails() // Refresh data
        alert('Branch removed successfully!')
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`Failed to remove branch: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error removing branch:', error)
      alert('Failed to remove branch')
    }
  }

  const handleSaveBranches = async (selectedBranchIds: string[]) => {
    if (!staff) return
    
    try {
      const response = await fetch(`/api/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: staff.userId,
          branchIds: selectedBranchIds
        })
      })

      if (response.ok) {
        await loadStaffDetails() // Refresh data
        setShowBranchManager(false)
        alert('Branch assignments updated successfully!')
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`Failed to update branches: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating branches:', error)
      alert('Failed to update branches')
    }
  }

  const getBranchNames = (branchIds: string[]) => {
    return branchIds.map(id => {
      const branch = branches.find(b => b.id === id)
      return branch?.name || 'Unknown Branch'
    }).join(', ')
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004AAD]"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!staff) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Staff Member Not Found</h2>
            <p className="text-gray-600 mb-4">The staff member you're looking for doesn't exist.</p>
            <button 
              onClick={() => router.push('/dashboard/staff')}
              className="px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Staff List
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => router.push('/dashboard/staff')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Staff Details</h1>
                <p className="text-gray-600">Manage staff member information and permissions</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setEditingDetails(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Details
              </button>
              <button
                onClick={() => setEditingPermissions(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Shield className="h-4 w-4" />
                Manage Permissions
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Deactivate
              </button>
            </div>
          </div>

          {/* Staff Overview Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#004AAD] to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {staff.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              
              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">{staff.fullName}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(staff.role)}`}>
                    {staff.role}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(staff.status)}`}>
                    {staff.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{staff.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{staff.phone}</span>
                  </div>
                  {staff.employeeId && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">ID: {staff.employeeId}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{staff.branchIds.length} branches</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-8">
              {['overview', 'permissions', 'branches', 'activity'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-[#004AAD] text-[#004AAD]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    {!editingDetails && (
                      <button
                        onClick={() => setEditingDetails(true)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {editingDetails ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as StaffRole })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                          >
                            <option value="cashier">Cashier</option>
                            <option value="manager">Manager</option>
                            <option value="owner">Owner</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                          <input
                            type="text"
                            value={editForm.employeeId}
                            onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                        <input
                          type="number"
                          value={editForm.salary}
                          onChange={(e) => setEditForm({ ...editForm, salary: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSaveDetails}
                          className="flex items-center gap-2 px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Save className="h-4 w-4" />
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditingDetails(false)
                            // Reset form to original values
                            setEditForm({
                              fullName: staff.fullName || '',
                              email: staff.email || '',
                              phone: staff.phone || '',
                              role: staff.role || 'cashier',
                              employeeId: staff.employeeId || '',
                              salary: staff.salary || 0,
                              emergencyContact: staff.emergencyContact || {
                                name: '',
                                phone: '',
                                relationship: ''
                              }
                            })
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-500">Full Name</label>
                          <p className="font-medium">{staff.fullName}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Email</label>
                          <p className="font-medium">{staff.email}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Phone</label>
                          <p className="font-medium">{staff.phone}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Role</label>
                          <p className="font-medium">{staff.role}</p>
                        </div>
                        {staff.employeeId && (
                          <div>
                            <label className="text-sm text-gray-500">Employee ID</label>
                            <p className="font-medium">{staff.employeeId}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm text-gray-500">Salary</label>
                          <p className="font-medium">
                            {staff.salary ? `${currencySymbol} ${staff.salary.toLocaleString()}` : 'Not set'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Employment Details */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">Employment Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="text-sm text-gray-500">Hire Date</label>
                        <p className="font-medium">
                          {staff.hireDate ? new Date(staff.hireDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="text-sm text-gray-500">Last Login</label>
                        <p className="font-medium">
                          {staff.lastLogin ? new Date(staff.lastLogin).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(staff.status)}
                      <div>
                        <label className="text-sm text-gray-500">Status</label>
                        <p className="font-medium capitalize">{staff.status}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                  {staff.emergencyContact ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-500">Name</label>
                        <p className="font-medium">{staff.emergencyContact.name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Phone</label>
                        <p className="font-medium">{staff.emergencyContact.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Relationship</label>
                        <p className="font-medium">{staff.emergencyContact.relationship}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No emergency contact information provided</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Module Permissions</h3>
                  <div className="flex gap-2">
                    {editingPermissions ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingPermissions(false)
                            setSelectedModules(getModuleFromPermissions(staffPermissions))
                          }}
                          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSavePermissions}
                          className="px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Save Changes
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditingPermissions(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Permissions
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableModules.map(module => (
                    <div key={module.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedModules.includes(module.id)}
                          onChange={(e) => {
                            if (!editingPermissions) return
                            if (e.target.checked) {
                              setSelectedModules(prev => [...prev, module.id])
                            } else {
                              setSelectedModules(prev => prev.filter(p => p !== module.id))
                            }
                          }}
                          disabled={!editingPermissions}
                          className="mt-1 rounded border-gray-300 text-[#004AAD] focus:ring-[#004AAD]"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{module.name}</span>
                          <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                {staff.role === 'cashier' && selectedModules.length === 1 && selectedModules.includes('sales') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-blue-700">
                      ℹ️ This cashier has default permissions (Sales only). You can grant additional privileges by checking more modules above.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'branches' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Assigned Branches</h3>
                  <button 
                    onClick={() => setShowBranchManager(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Manage Branches
                  </button>
                </div>

                {staff.branchIds.length > 0 ? (
                  <div className="space-y-3">
                    {staff.branchIds.map((branchId) => {
                      const branch = branches.find(b => b.id === branchId)
                      return (
                        <div key={branchId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="font-medium">{branch?.name || 'Unknown Branch'}</p>
                              <p className="text-sm text-gray-600">{branch?.location.address || 'No address'}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveBranch(branchId)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Remove branch"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Branches Assigned</h4>
                    <p className="text-gray-600 mb-4">This staff member is not assigned to any branches yet.</p>
                    <button 
                      onClick={() => setShowBranchManager(true)}
                      className="px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Assign Branches
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-6">Activity Log</h3>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Activity Tracking</h4>
                  <p className="text-gray-600">Staff activity logs will be displayed here.</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Deactivate Staff Member</h3>
                  <p className="text-sm text-gray-600">This action will deactivate the staff member</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to deactivate <strong>{staff.fullName}</strong>? 
                They will no longer be able to access the system.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteStaff}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, Deactivate
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Branch Manager Modal */}
        {showBranchManager && (
          <BranchManagerModal
            staff={staff}
            branches={branches}
            onSave={handleSaveBranches}
            onClose={() => setShowBranchManager(false)}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

// Branch Manager Modal Component
interface BranchManagerModalProps {
  staff: Staff
  branches: Branch[]
  onSave: (selectedBranchIds: string[]) => Promise<void>
  onClose: () => void
}

function BranchManagerModal({ staff, branches, onSave, onClose }: BranchManagerModalProps) {
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>(staff.branchIds || [])
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)

  // Filter branches based on search term
  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (branch.branchCode && branch.branchCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    branch.location.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(selectedBranchIds)
    } catch (error) {
      console.error('Error saving branches:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleBranch = (branchId: string) => {
    if (selectedBranchIds.includes(branchId)) {
      setSelectedBranchIds(prev => prev.filter(id => id !== branchId))
    } else {
      setSelectedBranchIds(prev => [...prev, branchId])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-[#004AAD] to-[#0056CC] text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Manage Branch Assignments</h3>
              <p className="text-blue-100 text-sm mt-1">
                Select branches for {staff.fullName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search branches by name, code, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
              />
            </div>
          </div>

          {/* Selection Summary */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>{selectedBranchIds.length}</strong> branches selected
              {selectedBranchIds.length > 0 && (
                <span className="ml-2 text-blue-600">
                  • {branches.filter(b => selectedBranchIds.includes(b.id)).map(b => b.name).join(', ')}
                </span>
              )}
            </p>
          </div>

          {/* Branch List */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredBranches.length > 0 ? (
              filteredBranches.map(branch => (
                <div 
                  key={branch.id} 
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedBranchIds.includes(branch.id)
                      ? 'border-[#004AAD] bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleToggleBranch(branch.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedBranchIds.includes(branch.id)}
                        onChange={() => handleToggleBranch(branch.id)}
                        className="rounded border-gray-300 text-[#004AAD] focus:ring-[#004AAD]"
                      />
                      <Building2 className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{branch.name}</p>
                          {branch.branchCode && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {branch.branchCode}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{branch.location.address}</p>
                        {branch.location.city && (
                          <p className="text-xs text-gray-500">{branch.location.city}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {branch.status === 'ACTIVE' ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-gray-400">{branch.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? 'No branches found matching your search' : 'No branches available'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedBranchIds.length} of {branches.length} branches selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#004AAD] text-white hover:bg-blue-700'
                }`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
