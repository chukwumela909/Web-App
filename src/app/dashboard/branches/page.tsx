'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BuildingOfficeIcon,
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface Branch {
  id: string
  name: string
  branchCode?: string
  branchType: 'MAIN' | 'BRANCH' | 'OUTLET' | 'WAREHOUSE' | 'KIOSK'
  location: {
    address: string
    city?: string
    region?: string
    postalCode?: string
  }
  contact: {
    phone?: string
    email?: string
  }
  openingHours: {
    dayOfWeek: string
    isOpen: boolean
    openTime?: string
    closeTime?: string
  }[]
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE' | 'TEMPORARILY_CLOSED'
  managerId?: string
  managerName?: string
  totalProducts?: number
  totalInventoryValue?: number
  lowStockItemsCount?: number
  description?: string
  createdAt?: Date
  lastActivityAt?: Date
}

interface BranchTransfer {
  id: string
  transferNumber: string
  fromBranchId: string
  fromBranchName?: string
  toBranchId: string
  toBranchName?: string
  status: 'REQUESTED' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED' | 'REJECTED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  totalItems: number
  totalValue: number
  transferType: string
  requestedAt: Date
  requestedBy: string
}

interface BranchDashboard {
  totalBranches: number
  activeBranches: number
  totalProducts: number
  totalInventoryValue: number
  lowStockAlerts: number
  pendingTransfers: number
  inTransitTransfers: number
  recentTransfers: BranchTransfer[]
  topPerformingBranches: {
    branchId: string
    branchName: string
    inventoryValue: number
    productsCount: number
    transfersIn: number
    transfersOut: number
  }[]
}

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

function BranchesContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [branches, setBranches] = useState<Branch[]>([])
  const [transfers, setTransfers] = useState<BranchTransfer[]>([])
  const [dashboard, setDashboard] = useState<BranchDashboard | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState<Branch | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)

  // Load dashboard data
  const loadDashboard = async () => {
    if (!user) return
    
    try {
      console.log('Frontend: Loading dashboard for user ID:', user.uid)
      const response = await fetch(`/api/branches/dashboard?userId=${user.uid}`)
      const result = await response.json()
      
      console.log('Frontend: Dashboard API response:', result)
      
      if (result.success) {
        setDashboard(result.data)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
  }

  // Load branches
  const loadBranches = async () => {
    if (!user) return
    
    try {
      console.log('Frontend: Loading branches for user ID:', user.uid)
      
      const params = new URLSearchParams({
        userId: user.uid
      })
      
      if (statusFilter && statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      
      if (searchTerm.trim()) {
        params.append('searchTerm', searchTerm.trim())
      }

      const response = await fetch(`/api/branches?${params}`)
      const result = await response.json()
      
      console.log('Frontend: Branches API response:', result)
      
      if (result.success) {
        setBranches(result.data)
        console.log('Frontend: Set branches count:', result.data.length)
      }
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }

  // Load transfers
  const loadTransfers = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/transfers?userId=${user.uid}&limit=20`)
      const result = await response.json()
      
      if (result.success) {
        setTransfers(result.data)
      }
    } catch (error) {
      console.error('Error loading transfers:', error)
    }
  }

  // Create branch
  const createBranch = async (branchData: any) => {
    if (!user) return false
    
    try {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          ...branchData
        })
      })
      
      const result = await response.json()
      if (result.success) {
        await loadBranches()
        await loadDashboard()
        setShowAddModal(false)
        return true
      } else {
        alert('Failed to create branch: ' + result.error)
        return false
      }
    } catch (error) {
      console.error('Error creating branch:', error)
      alert('Failed to create branch')
      return false
    }
  }

  // Update branch
  const updateBranch = async (branchId: string, branchData: any) => {
    if (!user) return false
    
    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          ...branchData
        })
      })
      
      const result = await response.json()
      if (result.success) {
        await loadBranches()
        await loadDashboard()
        setShowEditModal(null)
        return true
      } else {
        alert('Failed to update branch: ' + result.error)
        return false
      }
    } catch (error) {
      console.error('Error updating branch:', error)
      alert('Failed to update branch')
      return false
    }
  }

  useEffect(() => {
    if (user) {
      setLoading(true)
      Promise.all([
        loadDashboard(),
        loadBranches(),
        loadTransfers()
      ]).finally(() => setLoading(false))
    }
  }, [user])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user) {
        loadBranches()
      }
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'UNDER_MAINTENANCE': return 'bg-yellow-100 text-yellow-800'
      case 'TEMPORARILY_CLOSED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransferStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'bg-blue-100 text-blue-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'IN_TRANSIT': return 'bg-yellow-100 text-yellow-800'
      case 'RECEIVED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const formatOpeningHours = (hours: any[]) => {
    if (!hours || hours.length === 0) return 'Hours not set'
    
    const openDays = hours.filter(h => h.isOpen)
    if (openDays.length === 0) return 'Closed all days'
    
    const firstOpen = openDays[0]
    if (openDays.length === 7 && openDays.every(h => h.openTime === firstOpen.openTime && h.closeTime === firstOpen.closeTime)) {
      return `Daily ${firstOpen.openTime} - ${firstOpen.closeTime}`
    }
    
    return `${openDays.length} days/week`
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Consistent Header */}
      <div className="bg-white rounded-xl p-8 shadow-lg border-0">
        <motion.div {...fadeInUp} className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-600 rounded-lg p-3">
                <BuildingOfficeIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Branch Management</h1>
                <p className="text-gray-600 mt-1 text-base">
                  Manage your locations and track inventory transfers
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-gray-500">
              <span>{dashboard?.totalBranches || 0} Total Locations</span>
              <span>{dashboard?.activeBranches || 0} Active</span>
              <span>{dashboard?.pendingTransfers || 0} Pending Transfers</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={() => {
                loadDashboard()
                loadBranches()
                loadTransfers()
              }}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
                
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </div>
        </motion.div>
      </div>

      {loading ? (
        <Card className="border-0 shadow-lg">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Branch Management</h3>
              <p className="text-gray-600">Fetching your branch data and analytics...</p>
            </div>
          </div>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Card className="border-0 shadow-lg mb-6">
            <div className="p-2">
              <TabsList className="grid w-full grid-cols-4 bg-gray-50 rounded-xl p-1">
                <TabsTrigger 
                  value="dashboard"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all duration-200"
                >
                  📊 Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="branches"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all duration-200"
                >
                  🏢 Branches
                </TabsTrigger>
                <TabsTrigger 
                  value="transfers"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all duration-200"
                >
                  🚚 Transfers
                </TabsTrigger>
                <TabsTrigger 
                  value="reports"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all duration-200"
                >
                  📈 Reports
                </TabsTrigger>
              </TabsList>
            </div>
          </Card>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Key Metrics */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={staggerChildren}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={fadeInUp}>
                <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Total Branches</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.totalBranches || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Network Coverage</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
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
                        <p className="text-gray-500 text-sm font-medium">Active Branches</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.activeBranches || 0}</p>
                        <div className="flex items-center mt-2">
                          <div className="bg-gray-100 rounded-full h-1.5 w-12 mr-2">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${dashboard?.totalBranches ? (dashboard.activeBranches / dashboard.totalBranches) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">
                            {dashboard?.totalBranches ? Math.round((dashboard.activeBranches / dashboard.totalBranches) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
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
                        <p className="text-gray-500 text-sm font-medium">Pending Transfers</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.pendingTransfers || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(dashboard?.pendingTransfers || 0) > 0 ? 'Needs Attention' : 'All Clear'}
                        </p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <ClockIcon className="h-6 w-6 text-amber-600" />
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
                        <p className="text-gray-500 text-sm font-medium">Total Inventory</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(dashboard?.totalInventoryValue || 0)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{dashboard?.totalProducts || 0} Products</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <CubeIcon className="h-6 w-6 text-slate-600" />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>

            {/* Performance Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Branches */}
              <motion.div variants={fadeInUp}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Top Performing Branches</h2>
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-2">
                        <BuildingOfficeIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      {dashboard?.topPerformingBranches?.map((branch, index) => (
                        <div key={branch.branchId} className="relative group">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white text-sm ${
                                index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                                index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                                'bg-gradient-to-r from-blue-500 to-blue-600'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                  {branch.branchName}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <CubeIcon className="h-3 w-3" />
                                    {branch.productsCount} products
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <TruckIcon className="h-3 w-3" />
                                    {branch.transfersIn + branch.transfersOut} transfers
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-gray-900">{formatCurrency(branch.inventoryValue)}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">↓{branch.transfersIn}</span>
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">↑{branch.transfersOut}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-12">
                          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">No branch performance data available</p>
                          <p className="text-gray-400 text-sm mt-1">Branch analytics will appear here once you have active branches</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div variants={fadeInUp}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Recent Transfers</h2>
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-2">
                        <TruckIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      {dashboard?.recentTransfers?.slice(0, 5).map((transfer) => (
                        <div key={transfer.id} className="relative group">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-green-50 hover:to-emerald-50 transition-all duration-200 cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-2">
                                <TruckIcon className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                                  {transfer.transferNumber}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">{transfer.fromBranchName}</span>
                                  <span className="mx-2 text-gray-400">→</span>
                                  <span className="font-medium">{transfer.toBranchName}</span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={`${getTransferStatusColor(transfer.status)} border-0 font-medium`}>
                                {transfer.status}
                              </Badge>
                              <p className="text-sm text-gray-600 mt-1">
                                {transfer.totalItems} items
                              </p>
                            </div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-12">
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <TruckIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">No recent transfers</p>
                          <p className="text-gray-400 text-sm mt-1">Transfer activity will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>


          </TabsContent>

          <TabsContent value="branches" className="space-y-6">
            {/* Enhanced Filters */}
            <Card className="border-0 shadow-lg">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-lg">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search branches by name, code, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-0 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:shadow-md transition-all duration-200"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none px-4 py-3 pr-10 border-0 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:shadow-md transition-all duration-200 cursor-pointer"
                    >
                      <option value="ALL">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                      <option value="TEMPORARILY_CLOSED">Temporarily Closed</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                {searchTerm && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                    <span>Searching for:</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">{searchTerm}</span>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-blue-600 hover:text-blue-800 font-medium ml-2"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Enhanced Branches Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {branches.map((branch) => (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${
                            branch.branchType === 'MAIN' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                            branch.branchType === 'BRANCH' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                            branch.branchType === 'OUTLET' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            branch.branchType === 'WAREHOUSE' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                            'bg-gradient-to-r from-gray-500 to-gray-600'
                          }`}>
                            <BuildingOfficeIcon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {branch.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              {branch.branchCode && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                                  {branch.branchCode}
                                </span>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {branch.branchType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(branch.status)} border-0 font-medium`}>
                          {branch.status}
                        </Badge>
                      </div>

                      {/* Location & Contact */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mt-0.5 text-gray-400" />
                          <span className="font-medium">
                            {branch.location.address}
                            {branch.location.city && `, ${branch.location.city}`}
                          </span>
                        </div>
                        
                        {branch.contact.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            <span>{branch.contact.phone}</span>
                          </div>
                        )}
                        
                        {branch.contact.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{branch.contact.email}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span>{formatOpeningHours(branch.openingHours)}</span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center mb-1">
                            <CubeIcon className="h-4 w-4 text-blue-600 mr-1" />
                          </div>
                          <p className="text-2xl font-bold text-blue-700">{branch.totalProducts || 0}</p>
                          <p className="text-xs text-blue-600 font-medium">Products</p>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center mb-1">
                            <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1" />
                          </div>
                          <p className="text-lg font-bold text-green-700">
                            {formatCurrency(branch.totalInventoryValue || 0).replace('KES', 'K').replace('Ksh', 'K')}
                          </p>
                          <p className="text-xs text-green-600 font-medium">Inventory</p>
                        </div>
                      </div>

                      {/* Alerts & Manager */}
                      <div className="space-y-2 mb-4">
                        {(branch.lowStockItemsCount || 0) > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <span className="text-orange-600 font-medium">
                              {branch.lowStockItemsCount} low stock alerts
                            </span>
                          </div>
                        )}
                        
                        {branch.managerName && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {branch.managerName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{branch.managerName}</span>
                            <span className="text-gray-400">• Manager</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/dashboard/branches/${branch.id}`)}
                          className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowEditModal(branch)}
                          className="hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
                
            </div>

            {branches.length === 0 && (
              <Card className="border-0 shadow-lg">
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {searchTerm || statusFilter !== 'ALL' ? 'No Branches Match Your Search' : 'No Branches Yet'}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {searchTerm || statusFilter !== 'ALL' 
                      ? 'Try adjusting your search filters or create a new branch if needed.'
                      : 'Transform your business with multiple locations. Start by creating your first branch to expand your reach.'}
                  </p>
                  
                  {searchTerm || statusFilter !== 'ALL' ? (
                    <div className="flex items-center justify-center gap-4">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('')
                          setStatusFilter('ALL')
                        }}
                        className="hover:bg-gray-50"
                      >
                        Clear Filters
                      </Button>
                      <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create Branch
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create Your First Branch
                      </Button>
                      <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mt-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Multi-location management</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Inventory tracking</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Performance analytics</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transfers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Branch Transfers</h2>
              <Button onClick={() => setShowTransferModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Transfer
              </Button>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                {transfers.map((transfer) => (
                  <div key={transfer.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{transfer.transferNumber}</h3>
                        <p className="text-sm text-gray-600">
                          {transfer.fromBranchName} → {transfer.toBranchName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTransferStatusColor(transfer.status)}>
                          {transfer.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {transfer.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Items: </span>
                        <span>{transfer.totalItems}</span>
                      </div>
                      <div>
                        <span className="font-medium">Value: </span>
                        <span>{formatCurrency(transfer.totalValue)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Type: </span>
                        <span>{transfer.transferType.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {transfers.length === 0 && (
                  <div className="text-center py-12">
                    <TruckIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Transfers Found</h3>
                    <p className="text-gray-600 mb-6">
                      Start by creating your first branch transfer.
                    </p>
                    <Button onClick={() => setShowTransferModal(true)}>
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create First Transfer
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="p-6">
              <div className="text-center py-12">
                <BuildingOfficeIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Branch Reports</h3>
                <p className="text-gray-600 mb-6">
                  Detailed branch performance reports and analytics coming soon.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Add Branch Modal */}
      {showAddModal && (
        <AddBranchModal
          onSave={createBranch}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Branch Modal */}
      {showEditModal && (
        <EditBranchModal
          branch={showEditModal}
          onSave={(data) => updateBranch(showEditModal.id, data)}
          onCancel={() => setShowEditModal(null)}
        />
      )}
    </div>
  )
}

interface AddBranchModalProps {
  onSave: (data: any) => Promise<boolean>
  onCancel: () => void
}

function AddBranchModal({ onSave, onCancel }: AddBranchModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    branchCode: '',
    branchType: 'BRANCH',
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
    description: '',
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
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const success = await onSave(formData)
    if (success) {
      setFormData({
        name: '',
        branchCode: '',
        branchType: 'BRANCH',
        location: { address: '', city: '', region: '', postalCode: '' },
        contact: { phone: '', email: '' },
        description: '',
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
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-2xl font-semibold mb-6">Add New Branch</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-lg font-medium mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Branch Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Branch Code</label>
                <input
                  type="text"
                  value={formData.branchCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchCode: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., BR001 (auto-generated if empty)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Branch Type</label>
                <select
                  value={formData.branchType}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchType: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="MAIN">Main Branch</option>
                  <option value="BRANCH">Branch</option>
                  <option value="OUTLET">Outlet</option>
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="KIOSK">Kiosk</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Brief description of the branch"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div>
            <h4 className="text-lg font-medium mb-4">Location</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Address *</label>
                <textarea
                  value={formData.location.address}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, address: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, city: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Region/State</label>
                <input
                  type="text"
                  value={formData.location.region}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, region: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-medium mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.contact.phone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Branch'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

interface EditBranchModalProps {
  branch: Branch
  onSave: (data: any) => Promise<boolean>
  onCancel: () => void
}

function EditBranchModal({ branch, onSave, onCancel }: EditBranchModalProps) {
  const [formData, setFormData] = useState({
    name: branch.name,
    branchCode: branch.branchCode || '',
    branchType: branch.branchType,
    status: branch.status,
    location: branch.location,
    contact: branch.contact,
    description: branch.description || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const success = await onSave(formData)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-2xl font-semibold mb-6">Edit Branch</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Branch Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="TEMPORARILY_CLOSED">Temporarily Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address *</label>
            <textarea
              value={formData.location.address}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                location: { ...prev.location, address: e.target.value }
              }))}
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update Branch'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function BranchesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <BranchesContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
