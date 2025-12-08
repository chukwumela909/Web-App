'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import { 
  TruckIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface Supplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone: string
  address: string
  categories: string[]
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION'
  onTimeDeliveryRate: number
  totalOrders: number
  completedOrders: number
  qualityRating?: number
  serviceRating?: number
  pricingRating?: number
  paymentTerms: string
  notes?: string
  createdAt?: Date
  lastOrderDate?: Date
}

interface SupplierDashboard {
  totalSuppliers: number
  activeSuppliers: number
  topSuppliers: {
    supplierId: string
    supplierName: string
    totalOrders: number
    totalAmount: number
    onTimeDeliveryRate: number
  }[]
  recentOrders: any[]
  pendingApprovals: number
  overdueDeliveries: number
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

function SuppliersContent() {
  const { user } = useAuth()
  const currency = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [dashboard, setDashboard] = useState<SupplierDashboard | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState<Supplier | null>(null)

  // Load dashboard data
  const loadDashboard = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/suppliers/dashboard?userId=${user.uid}`)
      const result = await response.json()
      
      if (result.success) {
        setDashboard(result.data)
      }
    } catch (error) {
      console.error('Error loading suppliers dashboard:', error)
    }
  }

  // Load suppliers
  const loadSuppliers = async () => {
    if (!user) return
    
    try {
      const params = new URLSearchParams({
        userId: user.uid
      })
      
      if (statusFilter && statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      
      if (searchTerm.trim()) {
        params.append('searchTerm', searchTerm.trim())
      }

      const response = await fetch(`/api/suppliers?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setSuppliers(result.data)
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  // Create supplier
  const createSupplier = async (supplierData: any) => {
    if (!user) return false
    
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          ...supplierData
        })
      })
      
      const result = await response.json()
      if (result.success) {
        await loadSuppliers()
        await loadDashboard()
        setShowAddModal(false)
        return true
      } else {
        alert('Failed to create supplier: ' + result.error)
        return false
      }
    } catch (error) {
      console.error('Error creating supplier:', error)
      alert('Failed to create supplier')
      return false
    }
  }

  useEffect(() => {
    if (user) {
      setLoading(true)
      Promise.all([
        loadDashboard(),
        loadSuppliers()
      ]).finally(() => setLoading(false))
    }
  }, [user])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user) {
        loadSuppliers()
      }
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'BLOCKED': return 'bg-red-100 text-red-800'
      case 'PENDING_VERIFICATION': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPaymentTerms = (terms: string) => {
    return terms.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
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
                <TruckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
                <p className="text-gray-600 mt-1 text-base">
                  Manage your suppliers and vendor relationships
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-gray-500">
              <span>{dashboard?.totalSuppliers || 0} Suppliers</span>
              <span>{dashboard?.activeSuppliers || 0} Active</span>
              <span>{dashboard?.pendingApprovals || 0} Pending</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={() => {
                loadDashboard()
                loadSuppliers()
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
              Add Supplier
            </Button>
          </div>
        </motion.div>
      </div>

      {loading ? (
        <Card className="border-0 shadow-lg">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-100"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent absolute top-0"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Suppliers Management</h3>
              <p className="text-gray-600">Fetching your supplier data and performance metrics...</p>
            </div>
          </div>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Card className="border-0 shadow-lg mb-6">
            <div className="p-2">
              <TabsList className="grid w-full grid-cols-3 bg-gray-50 rounded-xl p-1">
                <TabsTrigger 
                  value="dashboard"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all duration-200"
                >
                  📊 Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="suppliers"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all duration-200"
                >
                  🚛 Suppliers
                </TabsTrigger>
                <TabsTrigger 
                  value="performance"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all duration-200"
                >
                  📈 Performance
                </TabsTrigger>
              </TabsList>
            </div>
          </Card>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Enhanced Key Metrics */}
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
                        <p className="text-gray-500 text-sm font-medium">Total Suppliers</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.totalSuppliers || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Supply Network</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <UserGroupIcon className="h-6 w-6 text-blue-600" />
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
                        <p className="text-gray-500 text-sm font-medium">Active Suppliers</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.activeSuppliers || 0}</p>
                        <div className="flex items-center mt-2">
                          <div className="bg-gray-100 rounded-full h-1.5 w-12 mr-2">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${dashboard?.totalSuppliers ? (dashboard.activeSuppliers / dashboard.totalSuppliers) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">
                            {dashboard?.totalSuppliers ? Math.round((dashboard.activeSuppliers / dashboard.totalSuppliers) * 100) : 0}%
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
                        <p className="text-gray-500 text-sm font-medium">Pending Approvals</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.pendingApprovals || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(dashboard?.pendingApprovals || 0) > 0 ? 'Needs Review' : 'All Clear'}
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
                        <p className="text-gray-500 text-sm font-medium">Overdue Deliveries</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.overdueDeliveries || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(dashboard?.overdueDeliveries || 0) > 0 ? 'Action Required' : 'On Track'}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3">
                        <XCircleIcon className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>

            {/* Enhanced Top Suppliers */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Top Performing Suppliers</h2>
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-2">
                      <TruckIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {dashboard?.topSuppliers?.map((supplier, index) => (
                      <div key={supplier.supplierId} className="relative group">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-green-50 hover:to-emerald-50 transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white text-sm ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                              index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                              index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                              'bg-gradient-to-r from-green-500 to-green-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                                {supplier.supplierName}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <TruckIcon className="h-3 w-3" />
                                  {supplier.totalOrders} orders
                                </span>
                                <span className="flex items-center gap-1">
                                  <CheckCircleIcon className="h-3 w-3" />
                                  {supplier.onTimeDeliveryRate}% on-time
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">{formatCurrency(supplier.totalAmount)}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span className={`px-2 py-1 rounded-full ${
                                supplier.onTimeDeliveryRate >= 90 ? 'bg-green-100 text-green-700' :
                                supplier.onTimeDeliveryRate >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {supplier.onTimeDeliveryRate}% delivery
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-12">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <TruckIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No supplier performance data available</p>
                        <p className="text-gray-400 text-sm mt-1">Performance metrics will appear here once you have active suppliers</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
            {/* Enhanced Filters */}
            <Card className="border-0 shadow-lg">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-lg">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <TruckIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search suppliers by name, contact, or categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-0 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-green-500 focus:shadow-md transition-all duration-200"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none px-4 py-3 pr-10 border-0 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-green-500 focus:shadow-md transition-all duration-200 cursor-pointer"
                    >
                      <option value="ALL">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="PENDING_VERIFICATION">Pending</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                {(searchTerm || statusFilter !== 'ALL') && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                    <span>Active filters:</span>
                    {searchTerm && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">"{searchTerm}"</span>
                    )}
                    {statusFilter !== 'ALL' && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">{statusFilter}</span>
                    )}
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('ALL')
                      }}
                      className="text-green-600 hover:text-green-800 font-medium ml-2"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Enhanced Suppliers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {suppliers.map((supplier) => (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-xl">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                              <span className="text-white text-lg font-bold">
                                {supplier.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                              {supplier.name}
                            </h3>
                            {supplier.contactPerson && (
                              <p className="text-sm text-gray-600 font-medium">{supplier.contactPerson}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(supplier.status)} border-0 font-medium`}>
                          {supplier.status}
                        </Badge>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{supplier.phone}</span>
                        </div>
                        
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{supplier.email}</span>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="font-medium">{supplier.address}</span>
                        </div>
                      </div>

                      {/* Categories */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Categories:</p>
                        <div className="flex flex-wrap gap-1">
                          {supplier.categories.slice(0, 3).map(category => (
                            <span key={category} className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-green-50 text-green-700 font-medium">
                              {category}
                            </span>
                          ))}
                          {supplier.categories.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-600 font-medium">
                              +{supplier.categories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center mb-1">
                            <TruckIcon className="h-4 w-4 text-blue-600 mr-1" />
                          </div>
                          <p className="text-2xl font-bold text-blue-700">{supplier.totalOrders}</p>
                          <p className="text-xs text-blue-600 font-medium">Orders</p>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center mb-1">
                            <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1" />
                          </div>
                          <p className="text-xl font-bold text-green-700">{supplier.onTimeDeliveryRate}%</p>
                          <p className="text-xs text-green-600 font-medium">On-Time</p>
                        </div>
                      </div>

                      {/* Ratings */}
                      {(supplier.qualityRating || supplier.serviceRating || supplier.pricingRating) && (
                        <div className="space-y-2 mb-4">
                          <p className="text-sm font-medium text-gray-700">Ratings:</p>
                          <div className="space-y-1">
                            {supplier.qualityRating && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Quality:</span>
                                <div className="flex">
                                  {renderStars(supplier.qualityRating)}
                                </div>
                              </div>
                            )}
                            {supplier.serviceRating && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Service:</span>
                                <div className="flex">
                                  {renderStars(supplier.serviceRating)}
                                </div>
                              </div>
                            )}
                            {supplier.pricingRating && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Pricing:</span>
                                <div className="flex">
                                  {renderStars(supplier.pricingRating)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Payment Terms */}
                      <div className="mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700 font-medium">
                          {formatPaymentTerms(supplier.paymentTerms)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowEditModal(supplier)}
                          className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
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

            {suppliers.length === 0 && (
              <Card className="border-0 shadow-lg">
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <TruckIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {(searchTerm || statusFilter !== 'ALL') ? 'No Suppliers Match Your Search' : 'No Suppliers Yet'}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {(searchTerm || statusFilter !== 'ALL') 
                      ? 'Try adjusting your search filters or add a new supplier.'
                      : 'Build your supply network by adding suppliers across different categories.'}
                  </p>
                  
                  {(searchTerm || statusFilter !== 'ALL') ? (
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
                      <Button 
                        onClick={() => setShowAddModal(true)} 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Supplier
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Your First Supplier
                      </Button>
                      <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mt-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Multiple categories</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span>Performance tracking</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                          <span>Rating system</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="p-6">
              <div className="text-center py-12">
                <TruckIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Performance Analytics</h3>
                <p className="text-gray-600 mb-6">
                  Detailed supplier performance analytics and reports coming soon.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <AddSupplierModal
          onSave={createSupplier}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

interface AddSupplierModalProps {
  onSave: (data: any) => Promise<boolean>
  onCancel: () => void
}

function AddSupplierModal({ onSave, onCancel }: AddSupplierModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    categories: [] as string[],
    paymentTerms: 'NET_30',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const success = await onSave(formData)
    if (success) {
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        categories: [],
        paymentTerms: 'NET_30',
        notes: ''
      })
    }
    setSaving(false)
  }

  const addCategory = (category: string) => {
    if (category.trim() && !formData.categories.includes(category.trim())) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, category.trim()]
      }))
    }
  }

  const removeCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-2xl font-semibold mb-6">Add New Supplier</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Supplier Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address *</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categories *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.categories.map(category => (
                <span key={category} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                  {category}
                  <button type="button" onClick={() => removeCategory(category)} className="text-blue-600 hover:text-blue-800">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addCategory(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="flex-1 px-3 py-2 border rounded-md"
              >
                <option value="">Select a category</option>
                <option value="General Hardware">General Hardware</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Tools & Equipment">Tools & Equipment</option>
                <option value="Building Materials">Building Materials</option>
                <option value="Paints & Finishes">Paints & Finishes</option>
                <option value="Safety & Security">Safety & Security</option>
                <option value="Garden & Outdoor">Garden & Outdoor</option>
                <option value="Fasteners & Fixings">Fasteners & Fixings</option>
                <option value="Electronics">Electronics</option>
                <option value="Food & Beverages">Food & Beverages</option>
                <option value="Clothing">Clothing</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Packaging">Packaging</option>
                <option value="Equipment">Equipment</option>
                <option value="Services">Services</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.categories.length === 0 && (
              <p className="text-red-500 text-sm mt-1">Please select at least one category</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Terms</label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
              <option value="NET_7">Net 7 Days</option>
              <option value="NET_15">Net 15 Days</option>
              <option value="NET_30">Net 30 Days</option>
              <option value="ADVANCE_PAYMENT">Advance Payment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Additional notes about this supplier..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={saving || formData.categories.length === 0}
            >
              {saving ? 'Creating...' : 'Create Supplier'}
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

export default function SuppliersPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SuppliersContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}