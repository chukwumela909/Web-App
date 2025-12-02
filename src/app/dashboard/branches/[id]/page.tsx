'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Branch, BranchStatus } from '@/lib/branches-types'
import { Staff } from '@/lib/firestore'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  Calendar,
  MapPin,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Users,
  Settings,
  Save,
  X,
  AlertTriangle,
  Search,
  DollarSign,
  Package,
  TrendingUp,
  Activity,
  Plus,
  UserCheck,
  Building,
  Globe,
  Briefcase
} from 'lucide-react'

// Utility functions
const getStatusIcon = (status: BranchStatus) => {
  switch (status) {
    case 'ACTIVE':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'INACTIVE':
      return <XCircle className="h-4 w-4 text-gray-400" />
    case 'UNDER_MAINTENANCE':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    case 'TEMPORARILY_CLOSED':
      return <Clock className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-400" />
  }
}

const getStatusColor = (status: BranchStatus) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800'
    case 'UNDER_MAINTENANCE':
      return 'bg-yellow-100 text-yellow-800'
    case 'TEMPORARILY_CLOSED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getBranchTypeColor = (type: string) => {
  switch (type) {
    case 'MAIN':
      return 'bg-purple-100 text-purple-800'
    case 'BRANCH':
      return 'bg-blue-100 text-blue-800'
    case 'OUTLET':
      return 'bg-green-100 text-green-800'
    case 'WAREHOUSE':
      return 'bg-orange-100 text-orange-800'
    case 'KIOSK':
      return 'bg-teal-100 text-teal-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

interface BranchDetailsPageProps {}

export default function BranchDetailsPage({}: BranchDetailsPageProps) {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  
  const [branch, setBranch] = useState<Branch | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [allStaff, setAllStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editingDetails, setEditingDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showManagerModal, setShowManagerModal] = useState(false)
  const [editingOpeningHours, setEditingOpeningHours] = useState(false)
  
  // Form state for editing details
  const [editForm, setEditForm] = useState({
    name: '',
    branchCode: '',
    branchType: 'BRANCH' as 'MAIN' | 'BRANCH' | 'OUTLET' | 'WAREHOUSE' | 'KIOSK',
    description: '',
    location: {
      address: '',
      city: '',
      region: '',
      postalCode: ''
    },
    contact: {
      phone: '',
      email: ''
    },
    maxCapacity: 0,
    status: 'ACTIVE' as BranchStatus,
    openingHours: [
      { dayOfWeek: 'MONDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 'TUESDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 'WEDNESDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 'THURSDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 'FRIDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { dayOfWeek: 'SATURDAY', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { dayOfWeek: 'SUNDAY', isOpen: false, openTime: '', closeTime: '' }
    ]
  })

  // Load branch details
  useEffect(() => {
    if (user && params.id) {
      loadBranchDetails()
      loadBranchStaff()
      loadAllStaff()
    }
  }, [user, params.id])

  const loadBranchDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/branches/${params.id}?userId=${user?.uid}`)
      if (response.ok) {
        const { data } = await response.json()
        setBranch(data)
        
        // Initialize edit form
        setEditForm({
          name: data.name || '',
          branchCode: data.branchCode || '',
          branchType: data.branchType || 'BRANCH',
          description: data.description || '',
          location: {
            address: data.location?.address || '',
            city: data.location?.city || '',
            region: data.location?.region || '',
            postalCode: data.location?.postalCode || ''
          },
          contact: {
            phone: data.contact?.phone || '',
            email: data.contact?.email || ''
          },
          maxCapacity: data.maxCapacity || 0,
          status: data.status || 'ACTIVE',
          openingHours: data.openingHours && data.openingHours.length > 0 ? data.openingHours : [
            { dayOfWeek: 'MONDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
            { dayOfWeek: 'TUESDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
            { dayOfWeek: 'WEDNESDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
            { dayOfWeek: 'THURSDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
            { dayOfWeek: 'FRIDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
            { dayOfWeek: 'SATURDAY', isOpen: true, openTime: '09:00', closeTime: '17:00' },
            { dayOfWeek: 'SUNDAY', isOpen: false, openTime: '', closeTime: '' }
          ]
        })
      } else {
        console.error('Failed to fetch branch details')
        router.push('/dashboard/branches')
      }
    } catch (error) {
      console.error('Error loading branch details:', error)
      router.push('/dashboard/branches')
    } finally {
      setLoading(false)
    }
  }

  const loadBranchStaff = async () => {
    if (!user?.uid || !params.id) return
    
    try {
      // Get staff assigned to this branch
      const response = await fetch(`/api/staff?userId=${user.uid}&branchId=${params.id}`)
      if (response.ok) {
        const { data } = await response.json()
        setStaff(data)
      }
    } catch (error) {
      console.error('Error loading branch staff:', error)
    }
  }

  const loadAllStaff = async () => {
    if (!user?.uid) return
    
    try {
      // Get all staff for manager assignment
      const response = await fetch(`/api/staff?userId=${user.uid}`)
      if (response.ok) {
        const { data } = await response.json()
        setAllStaff(data)
      }
    } catch (error) {
      console.error('Error loading all staff:', error)
    }
  }

  const handleSaveDetails = async () => {
    if (!branch) return
    
    try {
      const response = await fetch(`/api/branches/${branch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: branch.userId,
          ...editForm
        })
      })

      if (response.ok) {
        setEditingDetails(false)
        setEditingOpeningHours(false)
        await loadBranchDetails() // Refresh data
        alert('Branch details updated successfully!')
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

  const handleDeleteBranch = async () => {
    if (!branch) return
    
    try {
      const response = await fetch(`/api/branches/${branch.id}?userId=${branch.userId}&reason=Deleted by user`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Branch deactivated successfully!')
        router.push('/dashboard/branches')
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`Failed to deactivate branch: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deactivating branch:', error)
      alert('Failed to deactivate branch')
    }
  }

  const handleAssignManager = async (managerId: string) => {
    if (!branch) return
    
    try {
      const selectedStaff = allStaff.find(s => s.id === managerId)
      const response = await fetch(`/api/branches/${branch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: branch.userId,
          managerId: managerId,
          managerName: selectedStaff?.fullName || ''
        })
      })

      if (response.ok) {
        setShowManagerModal(false)
        await loadBranchDetails() // Refresh data
        alert('Manager assigned successfully!')
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`Failed to assign manager: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error assigning manager:', error)
      alert('Failed to assign manager')
    }
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

  if (!branch) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Branch Not Found</h2>
            <p className="text-gray-600 mb-4">The branch you're looking for doesn't exist.</p>
            <button 
              onClick={() => router.push('/dashboard/branches')}
              className="px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Branches List
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
                onClick={() => router.push('/dashboard/branches')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Branch Details</h1>
                <p className="text-gray-600">Manage branch information and operations</p>
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
                onClick={() => setShowManagerModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                Assign Manager
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

          {/* Branch Overview Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-start gap-6">
              {/* Branch Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#004AAD] to-blue-600 rounded-full flex items-center justify-center text-white">
                <Building2 className="h-8 w-8" />
              </div>
              
              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">{branch.name}</h2>
                  {branch.branchCode && (
                    <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {branch.branchCode}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBranchTypeColor(branch.branchType || 'BRANCH')}`}>
                    {branch.branchType || 'BRANCH'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(branch.status)}`}>
                    {branch.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{branch.location.address}</span>
                  </div>
                  {branch.contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{branch.contact.phone}</span>
                    </div>
                  )}
                  {branch.contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{branch.contact.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{staff.length} staff members</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-8">
              {['overview', 'management', 'inventory', 'settings'].map((tab) => (
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
                {/* Location Information */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Location Details</h3>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                          <input
                            type="text"
                            value={editForm.branchCode}
                            onChange={(e) => setEditForm({ ...editForm, branchCode: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Branch Type</label>
                          <select
                            value={editForm.branchType}
                            onChange={(e) => setEditForm({ ...editForm, branchType: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                          >
                            <option value="MAIN">Main Branch</option>
                            <option value="BRANCH">Branch</option>
                            <option value="OUTLET">Outlet</option>
                            <option value="WAREHOUSE">Warehouse</option>
                            <option value="KIOSK">Kiosk</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                          type="text"
                          value={editForm.location.address}
                          onChange={(e) => setEditForm({ 
                            ...editForm, 
                            location: { ...editForm.location, address: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <input
                            type="text"
                            value={editForm.location.city}
                            onChange={(e) => setEditForm({ 
                              ...editForm, 
                              location: { ...editForm.location, city: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                          <input
                            type="text"
                            value={editForm.location.region}
                            onChange={(e) => setEditForm({ 
                              ...editForm, 
                              location: { ...editForm.location, region: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                          placeholder="Optional description"
                        />
                      </div>
                      
                      {/* Contact Information */}
                      <div>
                        <h4 className="text-md font-medium text-gray-700 mb-3">Contact Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                              type="tel"
                              value={editForm.contact.phone}
                              onChange={(e) => setEditForm({ 
                                ...editForm, 
                                contact: { ...editForm.contact, phone: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                              placeholder="e.g., +254 700 000 000"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                              type="email"
                              value={editForm.contact.email}
                              onChange={(e) => setEditForm({ 
                                ...editForm, 
                                contact: { ...editForm.contact, email: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                              placeholder="e.g., branch@company.com"
                            />
                          </div>
                        </div>
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
                            setEditingOpeningHours(false)
                            // Reset form to original values
                            setEditForm({
                              name: branch.name || '',
                              branchCode: branch.branchCode || '',
                              branchType: branch.branchType || 'BRANCH',
                              description: branch.description || '',
                              location: {
                                address: branch.location?.address || '',
                                city: branch.location?.city || '',
                                region: branch.location?.region || '',
                                postalCode: branch.location?.postalCode || ''
                              },
                              contact: {
                                phone: branch.contact?.phone || '',
                                email: branch.contact?.email || ''
                              },
                              maxCapacity: branch.maxCapacity || 0,
                              status: branch.status || 'ACTIVE',
                              openingHours: branch.openingHours && branch.openingHours.length > 0 ? branch.openingHours : [
                                { dayOfWeek: 'MONDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
                                { dayOfWeek: 'TUESDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
                                { dayOfWeek: 'WEDNESDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
                                { dayOfWeek: 'THURSDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
                                { dayOfWeek: 'FRIDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
                                { dayOfWeek: 'SATURDAY', isOpen: true, openTime: '09:00', closeTime: '17:00' },
                                { dayOfWeek: 'SUNDAY', isOpen: false, openTime: '', closeTime: '' }
                              ]
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
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-sm text-gray-500">Address</label>
                          <p className="font-medium">{branch.location.address}</p>
                        </div>
                        {branch.location.city && (
                          <div>
                            <label className="text-sm text-gray-500">City</label>
                            <p className="font-medium">{branch.location.city}</p>
                          </div>
                        )}
                        {branch.location.region && (
                          <div>
                            <label className="text-sm text-gray-500">Region</label>
                            <p className="font-medium">{branch.location.region}</p>
                          </div>
                        )}
                        {branch.description && (
                          <div>
                            <label className="text-sm text-gray-500">Description</label>
                            <p className="font-medium">{branch.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                    {!editingDetails && (
                      <button
                        onClick={() => setEditingDetails(true)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit contact information"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {branch.contact?.phone ? (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <div>
                          <label className="text-sm text-gray-500">Phone</label>
                          <p className="font-medium">{branch.contact.phone}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Phone className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 italic mb-2">No phone number provided</p>
                        <button
                          onClick={() => setEditingDetails(true)}
                          className="text-[#004AAD] hover:text-blue-700 text-sm font-medium"
                        >
                          Add phone number
                        </button>
                      </div>
                    )}
                    {branch.contact?.email ? (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <div>
                          <label className="text-sm text-gray-500">Email</label>
                          <p className="font-medium">{branch.contact.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 italic mb-2">No email address provided</p>
                        <button
                          onClick={() => setEditingDetails(true)}
                          className="text-[#004AAD] hover:text-blue-700 text-sm font-medium"
                        >
                          Add email address
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Branch Statistics */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">Branch Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{branch.totalProducts || 0}</p>
                      <p className="text-sm text-gray-600">Total Products</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">Ksh {(branch.totalInventoryValue || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Inventory Value</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{branch.lowStockItemsCount || 0}</p>
                      <p className="text-sm text-gray-600">Low Stock Items</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
                      <p className="text-sm text-gray-600">Staff Members</p>
                    </div>
                  </div>
                </div>

                {/* Operational Details */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">Operational Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(branch.status)}
                      <div>
                        <label className="text-sm text-gray-500">Status</label>
                        <p className="font-medium capitalize">{branch.status.toLowerCase().replace('_', ' ')}</p>
                      </div>
                    </div>
                    {branch.maxCapacity && (
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-gray-500" />
                        <div>
                          <label className="text-sm text-gray-500">Max Capacity</label>
                          <p className="font-medium">{branch.maxCapacity.toLocaleString()} items</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="text-sm text-gray-500">Created</label>
                        <p className="font-medium">
                          {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    {branch.lastActivityAt && (
                      <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-gray-500" />
                        <div>
                          <label className="text-sm text-gray-500">Last Activity</label>
                          <p className="font-medium">
                            {new Date(branch.lastActivityAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Quick Opening Hours Preview */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Opening Hours</h3>
                    <button
                      onClick={() => {
                        setActiveTab('settings')
                        setTimeout(() => setEditingOpeningHours(true), 100)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Clock className="h-4 w-4" />
                      {branch.openingHours && branch.openingHours.length > 0 ? 'Edit Hours' : 'Configure Hours'}
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {branch.openingHours && branch.openingHours.length > 0 ? (
                      <>
                        {branch.openingHours.slice(0, 3).map((hours, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-900">{hours.dayOfWeek}</span>
                            <span className="text-sm text-gray-600">
                              {hours.isOpen 
                                ? `${hours.openTime || '08:00'} - ${hours.closeTime || '18:00'}`
                                : 'Closed'
                              }
                            </span>
                          </div>
                        ))}
                        {branch.openingHours.length > 3 && (
                          <div className="text-center pt-2">
                            <button
                              onClick={() => setActiveTab('settings')}
                              className="text-[#004AAD] hover:text-blue-700 text-sm font-medium"
                            >
                              View all {branch.openingHours.length} days →
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h4 className="text-md font-medium text-gray-900 mb-2">No Opening Hours Set</h4>
                        <p className="text-sm text-gray-500 mb-3">Configure your business operating hours</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-700">
                            💡 <strong>Tip:</strong> Click "Configure Hours" above to set up your branch schedule
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'management' && (
              <div className="space-y-6">
                {/* Branch Manager */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Branch Manager</h3>
                    <button
                      onClick={() => setShowManagerModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <UserCheck className="h-4 w-4" />
                      {branch.managerId ? 'Change Manager' : 'Assign Manager'}
                    </button>
                  </div>

                  {branch.managerId && branch.managerName ? (
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {branch.managerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{branch.managerName}</p>
                        <p className="text-sm text-gray-600">Branch Manager</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Manager Assigned</h4>
                      <p className="text-gray-600 mb-4">Assign a staff member to manage this branch.</p>
                      <button
                        onClick={() => setShowManagerModal(true)}
                        className="px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Assign Manager
                      </button>
                    </div>
                  )}
                </div>

                {/* Assigned Staff */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-6">Assigned Staff ({staff.length})</h3>

                  {staff.length > 0 ? (
                    <div className="space-y-3">
                      {staff.map((staffMember) => (
                        <div key={staffMember.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {staffMember.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{staffMember.fullName}</p>
                              <p className="text-sm text-gray-600">{staffMember.role} • {staffMember.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              staffMember.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {staffMember.status}
                            </span>
                            <button
                              onClick={() => router.push(`/dashboard/staff/${staffMember.id}`)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Staff Assigned</h4>
                      <p className="text-gray-600 mb-4">No staff members are currently assigned to this branch.</p>
                      <button
                        onClick={() => router.push('/dashboard/staff')}
                        className="px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Manage Staff
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-6">Inventory Overview</h3>
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Inventory Management</h4>
                  <p className="text-gray-600">Detailed inventory tracking for this branch will be available here.</p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Opening Hours */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Opening Hours</h3>
                    <button
                      onClick={() => setEditingOpeningHours(!editingOpeningHours)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      {editingOpeningHours ? 'Cancel' : 'Edit Hours'}
                    </button>
                  </div>
                  
                  {editingOpeningHours ? (
                    <div className="space-y-4">
                      {editForm.openingHours.map((hours, index) => (
                        <div key={hours.dayOfWeek} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="w-24">
                            <span className="font-medium text-gray-900">{hours.dayOfWeek}</span>
                          </div>
                          <div className="flex items-center gap-4 flex-1">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={hours.isOpen}
                                onChange={(e) => {
                                  const updatedHours = [...editForm.openingHours]
                                  updatedHours[index] = {
                                    ...updatedHours[index],
                                    isOpen: e.target.checked,
                                    openTime: e.target.checked ? (hours.openTime || '08:00') : '',
                                    closeTime: e.target.checked ? (hours.closeTime || '18:00') : ''
                                  }
                                  setEditForm({ ...editForm, openingHours: updatedHours })
                                }}
                                className="rounded border-gray-300 text-[#004AAD] focus:ring-[#004AAD]"
                              />
                              <span className="text-sm text-gray-700">Open</span>
                            </label>
                            
                            {hours.isOpen && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={hours.openTime || ''}
                                  onChange={(e) => {
                                    const updatedHours = [...editForm.openingHours]
                                    updatedHours[index] = {
                                      ...updatedHours[index],
                                      openTime: e.target.value
                                    }
                                    setEditForm({ ...editForm, openingHours: updatedHours })
                                  }}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                  type="time"
                                  value={hours.closeTime || ''}
                                  onChange={(e) => {
                                    const updatedHours = [...editForm.openingHours]
                                    updatedHours[index] = {
                                      ...updatedHours[index],
                                      closeTime: e.target.value
                                    }
                                    setEditForm({ ...editForm, openingHours: updatedHours })
                                  }}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                                />
                              </div>
                            )}
                            
                            {!hours.isOpen && (
                              <span className="text-gray-500 text-sm">Closed</span>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSaveDetails}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Save className="h-4 w-4" />
                          Save Hours
                        </button>
                        <button
                          onClick={() => {
                            setEditingOpeningHours(false)
                            // Reset opening hours to original values
                            setEditForm({
                              ...editForm,
                              openingHours: branch.openingHours && branch.openingHours.length > 0 ? branch.openingHours : [
                                { dayOfWeek: 'MONDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
                                { dayOfWeek: 'TUESDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
                                { dayOfWeek: 'WEDNESDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
                                { dayOfWeek: 'THURSDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
                                { dayOfWeek: 'FRIDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
                                { dayOfWeek: 'SATURDAY', isOpen: true, openTime: '09:00', closeTime: '17:00' },
                                { dayOfWeek: 'SUNDAY', isOpen: false, openTime: '', closeTime: '' }
                              ]
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
                    <div className="space-y-3">
                      {branch.openingHours && branch.openingHours.length > 0 ? (
                        branch.openingHours.map((hours, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-900">{hours.dayOfWeek}</span>
                            <span className="text-gray-600">
                              {hours.isOpen 
                                ? `${hours.openTime || '08:00'} - ${hours.closeTime || '18:00'}`
                                : 'Closed'
                              }
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">No Opening Hours Configured</h4>
                          <p className="text-gray-600 mb-4">Set up your branch operating hours.</p>
                          <button
                            onClick={() => setEditingOpeningHours(true)}
                            className="px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Configure Hours
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Advanced Settings */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-6">Branch Settings</h3>
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Advanced Configuration</h4>
                    <p className="text-gray-600">Additional branch settings and configurations will be available here.</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Manager Assignment Modal */}
        {showManagerModal && (
          <ManagerAssignmentModal
            branch={branch}
            allStaff={allStaff}
            onAssign={handleAssignManager}
            onClose={() => setShowManagerModal(false)}
          />
        )}

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
                  <h3 className="text-lg font-semibold">Deactivate Branch</h3>
                  <p className="text-sm text-gray-600">This action will deactivate the branch</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to deactivate <strong>{branch.name}</strong>? 
                This will make the branch inactive but preserve all data.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteBranch}
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
      </DashboardLayout>
    </ProtectedRoute>
  )
}

// Manager Assignment Modal Component
interface ManagerAssignmentModalProps {
  branch: Branch
  allStaff: Staff[]
  onAssign: (managerId: string) => Promise<void>
  onClose: () => void
}

function ManagerAssignmentModal({ branch, allStaff, onAssign, onClose }: ManagerAssignmentModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)

  // Filter staff based on search term and exclude non-managers
  const eligibleStaff = allStaff.filter(staff =>
    (staff.role === 'manager' || staff.role === 'owner') &&
    staff.status === 'active' &&
    (staff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     staff.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleAssign = async (managerId: string) => {
    setSaving(true)
    try {
      await onAssign(managerId)
    } catch (error) {
      console.error('Error assigning manager:', error)
    } finally {
      setSaving(false)
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
              <h3 className="text-lg font-semibold">Assign Branch Manager</h3>
              <p className="text-blue-100 text-sm mt-1">
                Select a manager for {branch.name}
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
                placeholder="Search managers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
              />
            </div>
          </div>

          {/* Staff List */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {eligibleStaff.length > 0 ? (
              eligibleStaff.map(staff => (
                <div 
                  key={staff.id} 
                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
                  onClick={() => handleAssign(staff.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {staff.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staff.fullName}</p>
                        <p className="text-sm text-gray-600">{staff.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            staff.role === 'owner' 
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {staff.role}
                          </span>
                          {staff.id === branch.managerId && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Current Manager
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAssign(staff.id)
                      }}
                      disabled={saving}
                      className="px-3 py-1 bg-[#004AAD] text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Assigning...' : 'Select'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? 'No managers found matching your search' : 'No eligible managers available'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Only staff with Manager or Owner roles can be assigned as branch managers.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
