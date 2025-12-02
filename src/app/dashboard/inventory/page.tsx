'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { 
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ClockIcon,
  CubeIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface StockLevel {
  productId: string
  branchId: string
  currentStock: number
  reservedStock: number
  availableStock: number
  minStockLevel: number
  isLowStock: boolean
  batches?: any[]
}

interface StockMovement {
  id: string
  productId: string
  branchId: string
  movementType: string
  quantity: number
  previousStock: number
  newStock: number
  referenceType?: string
  referenceId?: string
  status: string
  reason?: string
  notes?: string
  createdAt: any
}

interface Branch {
  id: string
  name: string
  address?: string
  isActive: boolean
}

interface InventoryDashboard {
  branchId: string
  totalProducts: number
  lowStockItems: number
  outOfStockItems: number
  expiringItems: number
  totalInventoryValue: number
  recentMovements: StockMovement[]
  alerts: {
    lowStock: any[]
    expiring: any[]
  }
}

interface Product {
  id: string
  name: string
  description?: string
  sellingPrice: number
  costPrice: number
  category: string
  sku?: string
  barcode?: string
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

function InventoryContent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null)
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showAdjustModal, setShowAdjustModal] = useState<StockLevel | null>(null)

  // Create default branch if none exist
  const createDefaultBranch = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          name: 'Main Branch',
          branchType: 'MAIN',
          location: {
            address: 'Primary Location',
            city: '',
            region: ''
          },
          contact: {
            phone: '',
            email: ''
          },
          openingHours: [
            { dayOfWeek: 'MONDAY', isOpen: true, openTime: '09:00', closeTime: '17:00' },
            { dayOfWeek: 'TUESDAY', isOpen: true, openTime: '09:00', closeTime: '17:00' },
            { dayOfWeek: 'WEDNESDAY', isOpen: true, openTime: '09:00', closeTime: '17:00' },
            { dayOfWeek: 'THURSDAY', isOpen: true, openTime: '09:00', closeTime: '17:00' },
            { dayOfWeek: 'FRIDAY', isOpen: true, openTime: '09:00', closeTime: '17:00' },
            { dayOfWeek: 'SATURDAY', isOpen: true, openTime: '09:00', closeTime: '17:00' },
            { dayOfWeek: 'SUNDAY', isOpen: false }
          ]
        })
      })
      
      const result = await response.json()
      if (result.success) {
        await loadBranches()
      }
    } catch (error) {
      console.error('Error creating default branch:', error)
    }
  }

  // Load branches
  const loadBranches = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/inventory/branches?userId=${user.uid}`)
      const result = await response.json()
      
      if (result.success) {
        setBranches(result.data)
        if (result.data.length > 0 && !selectedBranch) {
          setSelectedBranch(result.data[0].id)
        } else if (result.data.length === 0) {
          // No branches exist, create default
          await createDefaultBranch()
        }
      }
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }

  // Load products
  const loadProducts = async () => {
    if (!user) return
    
    try {
      const { getProducts } = await import('@/lib/firestore')
      const productList = await getProducts(user.uid)
      setProducts(productList)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  // Load dashboard data
  const loadDashboard = async () => {
    if (!user || !selectedBranch) return
    
    try {
      const response = await fetch(`/api/inventory/dashboard?userId=${user.uid}&branchId=${selectedBranch}`)
      const result = await response.json()
      
      if (result.success) {
        setDashboard(result.data)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
  }

  // Load stock levels
  const loadStockLevels = async () => {
    if (!user || !selectedBranch) return
    
    try {
      const response = await fetch(`/api/inventory/stock?userId=${user.uid}&branchId=${selectedBranch}`)
      const result = await response.json()
      
      if (result.success) {
        setStockLevels(result.data)
      }
    } catch (error) {
      console.error('Error loading stock levels:', error)
    }
  }

  // Load stock movements
  const loadMovements = async () => {
    if (!user || !selectedBranch) return
    
    try {
      const response = await fetch(`/api/inventory/movements?userId=${user.uid}&branchId=${selectedBranch}&limit=20`)
      const result = await response.json()
      
      if (result.success) {
        setMovements(result.data.movements || [])
      }
    } catch (error) {
      console.error('Error loading movements:', error)
    }
  }

  // Initialize inventory for existing products
  const initializeInventory = async () => {
    if (!user || !selectedBranch) return
    
    const confirmed = confirm(
      `This will create inventory records for all your products with 0 initial stock. ` +
      `You can then adjust stock levels as needed. Continue?`
    )
    
    if (!confirmed) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/inventory/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          branchId: selectedBranch,
          defaultStock: 0
        })
      })
      
      const result = await response.json()
      if (result.success) {
        alert(result.message)
        await loadStockLevels()
        await loadDashboard()
      } else {
        alert('Failed to initialize inventory: ' + result.error)
      }
    } catch (error) {
      console.error('Error initializing inventory:', error)
      alert('Failed to initialize inventory')
    } finally {
      setLoading(false)
    }
  }

  // Adjust stock
  const adjustStock = async (productId: string, quantity: number, reason: string, notes?: string) => {
    if (!user || !selectedBranch) return
    
    try {
      const response = await fetch('/api/inventory/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          productId,
          branchId: selectedBranch,
          quantity,
          reason,
          notes
        })
      })
      
      const result = await response.json()
      if (result.success) {
        await loadStockLevels()
        await loadDashboard()
        await loadMovements()
        setShowAdjustModal(null)
      } else {
        alert('Failed to adjust stock: ' + result.error)
      }
    } catch (error) {
      console.error('Error adjusting stock:', error)
      alert('Failed to adjust stock')
    }
  }

  useEffect(() => {
    if (user) {
      loadBranches()
      loadProducts()
    }
  }, [user])

  useEffect(() => {
    if (selectedBranch) {
      setLoading(true)
      Promise.all([
        loadDashboard(),
        loadStockLevels(),
        loadMovements()
      ]).finally(() => setLoading(false))
    }
  }, [selectedBranch])

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId)
    return product?.name || productId
  }

  const getProductBySKU = (sku: string) => {
    return products.find(p => p.sku === sku || p.id === sku)
  }

  const formatMovementType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <motion.div {...fadeInUp}>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage your stock across branches</p>
        </motion.div>

        <div className="flex items-center gap-4">
          {branches.length > 1 && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}
          
          <Button 
            onClick={() => {
              loadDashboard()
              loadStockLevels()
              loadMovements()
            }}
            variant="outline"
            size="sm"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="stock">Stock Levels</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Metrics */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={staggerChildren}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={fadeInUp}>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Products</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboard?.totalProducts || 0}</p>
                    </div>
                    <CubeIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                      <p className="text-3xl font-bold text-orange-600">{dashboard?.lowStockItems || 0}</p>
                    </div>
                    <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                      <p className="text-3xl font-bold text-red-600">{dashboard?.outOfStockItems || 0}</p>
                    </div>
                    <ArchiveBoxIcon className="h-8 w-8 text-red-600" />
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(dashboard?.totalInventoryValue || 0)}
                      </p>
                    </div>
                    <TruckIcon className="h-8 w-8 text-green-600" />
                  </div>
                </Card>
              </motion.div>
            </motion.div>

            {/* Recent Movements */}
            <motion.div variants={fadeInUp}>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Stock Movements</h2>
                <div className="space-y-3">
                  {dashboard?.recentMovements?.slice(0, 5).map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          movement.movementType === 'SALE' ? 'bg-red-100' :
                          movement.movementType === 'PURCHASE' ? 'bg-green-100' :
                          'bg-blue-100'
                        }`}>
                          <ClockIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{getProductName(movement.productId)}</p>
                          <p className="text-sm text-gray-600">{formatMovementType(movement.movementType)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {movement.movementType === 'SALE' || movement.movementType.includes('OUT') ? '-' : '+'}
                          {movement.quantity}
                        </p>
                        <p className="text-sm text-gray-600">{movement.newStock} remaining</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No recent movements</p>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Enhanced Product Overview */}
            {dashboard && dashboard.totalProducts > 0 && (
              <motion.div variants={fadeInUp}>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Inventory Overview</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab('stock')}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <CubeIcon className="h-4 w-4 mr-2" />
                        View All Stock
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('/dashboard/products', '_blank')}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Products
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Stock Health */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                        <ArchiveBoxIcon className="h-5 w-5 mr-2" />
                        Stock Health
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 font-medium">✓ In Stock</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            {dashboard.totalProducts - dashboard.outOfStockItems}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-yellow-700 font-medium">⚠ Low Stock</span>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            {dashboard.lowStockItems}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-700 font-medium">✗ Out of Stock</span>
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            {dashboard.outOfStockItems}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-4 flex items-center">
                        <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                        Quick Actions
                      </h4>
                      <div className="space-y-2">
                        <button 
                          onClick={() => setActiveTab('movements')}
                          className="w-full text-left p-3 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors flex items-center"
                        >
                          <ClockIcon className="h-4 w-4 mr-3" />
                          View Movements
                        </button>
                        <button 
                          onClick={() => setActiveTab('transfers')}
                          className="w-full text-left p-3 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors flex items-center"
                        >
                          <TruckIcon className="h-4 w-4 mr-3" />
                          Manage Transfers
                        </button>
                        <button 
                          onClick={() => window.open('/dashboard/products/browse', '_blank')}
                          className="w-full text-left p-3 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors flex items-center"
                        >
                          <CubeIcon className="h-4 w-4 mr-3" />
                          Browse Products
                        </button>
                      </div>
                    </div>

                    {/* Branch & Value Info */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Branch Overview
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 font-medium">Active Branch</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            {branches.find(b => b.id === selectedBranch)?.name || 'Main Branch'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 font-medium">Total Value</span>
                          <span className="font-bold text-green-900">
                            {formatCurrency(dashboard.totalInventoryValue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 font-medium">Last Updated</span>
                          <span className="text-sm text-green-600">Just now</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="stock" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Stock Levels</h2>
              {stockLevels.length === 0 && products.length > 0 && (
                <Button onClick={initializeInventory} variant="outline" size="sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Initialize Inventory
                </Button>
              )}
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                {stockLevels.map((stock) => {
                  const product = products.find(p => p.id === stock.productId)
                  return (
                    <div key={`${stock.productId}-${stock.branchId}`} 
                         className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-medium">{product?.name || stock.productId}</h3>
                          <p className="text-sm text-gray-600">
                            SKU: {product?.sku || 'N/A'} • Min: {stock.minStockLevel}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{stock.currentStock} units</p>
                          <p className="text-sm text-gray-600">
                            Available: {stock.availableStock}
                            {stock.reservedStock > 0 && ` (${stock.reservedStock} reserved)`}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {stock.isLowStock && (
                            <Badge variant="destructive">Low Stock</Badge>
                          )}
                          {stock.currentStock === 0 && (
                            <Badge variant="outline" className="border-red-500 text-red-600">Out of Stock</Badge>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAdjustModal(stock)}
                          >
                            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
                            Adjust
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {stockLevels.length === 0 && (
                  <motion.div 
                    variants={fadeInUp}
                    className="relative overflow-hidden"
                  >
                    {products.length === 0 ? (
                      // No products scenario
                      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-12 text-center border border-blue-100">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
                          <div className="relative bg-white/80 backdrop-blur-sm rounded-full p-6 w-24 h-24 mx-auto mb-6 shadow-lg">
                            <CubeIcon className="h-12 w-12 mx-auto text-blue-600" />
                          </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Start Your Inventory Journey</h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                          Create your first products to begin tracking inventory. 
                          Build a comprehensive catalog of everything you sell.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button 
                            onClick={() => window.open('/dashboard/products', '_blank')}
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                          >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Your First Product
                          </Button>
                          <Button 
                            variant="outline" 
                            size="lg"
                            onClick={() => window.open('/dashboard/products/browse', '_blank')}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            Learn More
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Has products but no inventory records
                      <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl p-12 text-center border border-emerald-100">
                        <div className="relative mb-8">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl"></div>
                          <div className="relative bg-white/90 backdrop-blur-sm rounded-full p-6 w-24 h-24 mx-auto shadow-lg">
                            <ArchiveBoxIcon className="h-12 w-12 mx-auto text-emerald-600" />
                          </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Ready to Track Inventory?</h3>
                        <p className="text-gray-600 mb-2 max-w-lg mx-auto leading-relaxed">
                          Great! You have <strong className="text-emerald-700">{products.length} product{products.length !== 1 ? 's' : ''}</strong> in your catalog. 
                          Let's set up inventory tracking to monitor stock levels, movements, and alerts.
                        </p>
                        
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-2xl mx-auto">
                          <h4 className="font-semibold text-gray-800 mb-4">What happens when you initialize inventory?</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <CubeIcon className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-800">Stock Tracking</p>
                                <p className="text-gray-600">Real-time inventory levels</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                              <div className="p-2 bg-yellow-100 rounded-lg">
                                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-800">Smart Alerts</p>
                                <p className="text-gray-600">Low stock notifications</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <ClockIcon className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-800">Movement History</p>
                                <p className="text-gray-600">Track all stock changes</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button 
                            onClick={initializeInventory} 
                            size="lg"
                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg"
                          >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Initialize Inventory for {products.length} Products
                          </Button>
                          <Button 
                            variant="outline" 
                            size="lg"
                            onClick={() => window.open('/dashboard/products', '_blank')}
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            <CubeIcon className="h-4 w-4 mr-2" />
                            Manage Products First
                          </Button>
                        </div>
                        
                        <div className="mt-6 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> You can always add more products later and they'll automatically sync with your inventory system.
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Stock Movement History</h2>
              <div className="space-y-3">
                {movements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        movement.movementType === 'SALE' ? 'bg-red-100' :
                        movement.movementType === 'PURCHASE' ? 'bg-green-100' :
                        movement.movementType.includes('TRANSFER') ? 'bg-purple-100' :
                        'bg-blue-100'
                      }`}>
                        <ClockIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium">{getProductName(movement.productId)}</h3>
                        <p className="text-sm text-gray-600">
                          {formatMovementType(movement.movementType)}
                          {movement.reason && ` • ${movement.reason}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">
                        {movement.movementType === 'SALE' || movement.movementType.includes('OUT') ? '-' : '+'}
                        {movement.quantity}
                      </p>
                      <p className="text-sm text-gray-600">
                        {movement.previousStock} → {movement.newStock}
                      </p>
                    </div>
                  </div>
                ))}
                
                {movements.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No stock movements found</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="transfers" className="space-y-6">
            <Card className="p-6">
              <div className="text-center py-12">
                <TruckIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Stock Transfers</h3>
                <p className="text-gray-600 mb-6">
                  Transfer functionality will be available when you have multiple branches.
                </p>
                {branches.length < 2 && (
                  <p className="text-sm text-gray-500">
                    You currently have {branches.length} branch{branches.length !== 1 ? 's' : ''}. 
                    Add another branch to enable transfers.
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <StockAdjustModal
          stock={showAdjustModal}
          product={products.find(p => p.id === showAdjustModal.productId)}
          onAdjust={adjustStock}
          onCancel={() => setShowAdjustModal(null)}
        />
      )}
    </div>
  )
}

interface StockAdjustModalProps {
  stock: StockLevel
  product?: Product
  onAdjust: (productId: string, quantity: number, reason: string, notes?: string) => void
  onCancel: () => void
}

function StockAdjustModal({ stock, product, onAdjust, onCancel }: StockAdjustModalProps) {
  const [adjustment, setAdjustment] = useState(0)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease' | 'set'>('increase')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      alert('Please provide a reason for the adjustment')
      return
    }

    let finalAdjustment = adjustment
    if (adjustmentType === 'decrease') {
      finalAdjustment = -Math.abs(adjustment)
    } else if (adjustmentType === 'set') {
      finalAdjustment = adjustment - stock.currentStock
    }

    onAdjust(stock.productId, finalAdjustment, reason, notes)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-xl font-semibold mb-4">Adjust Stock</h3>
        
        <div className="mb-4">
          <h4 className="font-medium">{product?.name || stock.productId}</h4>
          <p className="text-sm text-gray-600">Current Stock: {stock.currentStock} units</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Adjustment Type</label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="increase">Increase Stock</option>
              <option value="decrease">Decrease Stock</option>
              <option value="set">Set Stock To</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {adjustmentType === 'set' ? 'Set Stock To' : 'Quantity'}
            </label>
            <input
              type="number"
              value={adjustment}
              onChange={(e) => setAdjustment(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min="0"
              required
            />
            {adjustmentType === 'set' && (
              <p className="text-sm text-gray-600 mt-1">
                This will {adjustment > stock.currentStock ? 'add' : 'remove'} {Math.abs(adjustment - stock.currentStock)} units
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select reason</option>
              <option value="Stock count adjustment">Stock count adjustment</option>
              <option value="Damaged goods">Damaged goods</option>
              <option value="Expired products">Expired products</option>
              <option value="Theft/Loss">Theft/Loss</option>
              <option value="Initial stock setup">Initial stock setup</option>
              <option value="Return from customer">Return from customer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Additional details..."
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              Adjust Stock
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

export default function InventoryPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <InventoryContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}