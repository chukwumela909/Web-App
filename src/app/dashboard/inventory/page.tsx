'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useBranch } from '@/contexts/BranchContext'
import { useStaff } from '@/contexts/StaffContext'
import { useCurrency, formatCurrency } from '@/hooks/useCurrency'
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
import { createBranch as createBranchRecord } from '@/lib/branches-service'
import { linkBackendProductToBranch } from '@/lib/backend-business-api'
import {
  adjustStock as adjustStockRecord,
  approveStockTransfer,
  createStockTransfer,
  getInventoryItems,
  getInventorySnapshot,
  getStockTransfers,
  receiveStockTransfer
} from '@/lib/inventory-service'
import type { StockTransfer } from '@/lib/inventory-types'

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
  sku?: string | null
  barcode?: string | null
  minStockLevel?: number
  batchNumber?: string | null
  location?: string
  expiryDate?: number | null
  isPerishable?: boolean
  imageUrl?: string | null
  images?: Array<{
    url: string
    isPrimary?: boolean
  }>
}

function getProductImageUrl(product?: Product | null) {
  return product?.images?.find(image => image.isPrimary)?.url || product?.images?.[0]?.url || product?.imageUrl || null
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
  const { staff } = useStaff()
  const {
    branches,
    selectedBranchId,
    loading: branchesLoading,
    refreshBranches,
    setSelectedBranchId
  } = useBranch()
  const { currency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null)
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showAdjustModal, setShowAdjustModal] = useState<StockLevel | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferActionId, setTransferActionId] = useState<string | null>(null)
  const effectiveUserId = staff ? staff.userId : user?.uid
  const selectedBranch = selectedBranchId || branches[0]?.id || ''

  // Create default branch if none exist
  const createDefaultBranch = async () => {
    if (!user) return

    try {
      await createBranchRecord(user.uid, {
        name: 'Main Branch',
        branchType: 'MAIN',
        location: { address: 'Primary Location', city: '', region: '' },
        contact: { phone: '', email: '' },
        openingHours: []
      } as any)
      await refreshBranches()
    } catch (error) {
      console.error('Error creating default branch:', error)
    }
  }

  const applyInventorySnapshot = async () => {
    if (!effectiveUserId || !selectedBranch) return

    try {
      const { products: snapshotProducts, inventoryItems } = await getInventorySnapshot(effectiveUserId, selectedBranch)
      if (snapshotProducts.length > 0) {
        setProducts(snapshotProducts as Product[])
      }
      setDashboard({
        branchId: selectedBranch,
        totalProducts: inventoryItems.length,
        lowStockItems: inventoryItems.filter((item) => item.currentStock > 0 && item.currentStock <= item.minStockLevel).length,
        outOfStockItems: inventoryItems.filter((item) => item.currentStock === 0).length,
        expiringItems: 0,
        totalInventoryValue: inventoryItems.reduce((sum, item) => sum + Number(item.currentStock || 0) * Number(item.averageCostPrice || 0), 0),
        recentMovements: [],
        alerts: { lowStock: [], expiring: [] }
      })
      setStockLevels(inventoryItems.map((item) => ({
        productId: item.productId,
        branchId: item.branchId,
        currentStock: item.currentStock,
        reservedStock: item.reservedStock,
        availableStock: item.availableStock,
        minStockLevel: item.minStockLevel,
        isLowStock: item.currentStock <= item.minStockLevel
      })))
    } catch (error) {
      console.error('Error loading inventory snapshot:', error)
    }
  }

  // Load stock movements
  const loadMovements = async () => {
    if (!effectiveUserId || !selectedBranch) return

    try {
      setMovements([])
    } catch (error) {
      console.error('Error loading movements:', error)
    }
  }

  const loadTransfers = async () => {
    if (!effectiveUserId || !selectedBranch) return

    try {
      const transferList = await getStockTransfers(effectiveUserId, selectedBranch)
      setTransfers(transferList)
    } catch (error) {
      console.error('Error loading transfers:', error)
    }
  }

  // Initialize inventory for existing products
  const initializeInventory = async () => {
    if (!effectiveUserId || !selectedBranch) return

    const confirmed = confirm(
      `This will create inventory records for all your products with 0 initial stock. ` +
      `You can then adjust stock levels as needed. Continue?`
    )

    if (!confirmed) return

    try {
      setLoading(true)
      alert('Inventory is initialized automatically from backend branch products.')
      await applyInventorySnapshot()
    } catch (error) {
      console.error('Error initializing inventory:', error)
      alert('Failed to initialize inventory')
    } finally {
      setLoading(false)
    }
  }

  // Adjust stock
  const adjustStock = async (productId: string, quantity: number, reason: string, notes?: string) => {
    if (!effectiveUserId || !selectedBranch) return

    try {
      await adjustStockRecord(effectiveUserId, {
        productId,
        branchId: selectedBranch,
        quantity,
        reason,
        notes
      })
      await refreshInventory()
      setShowAdjustModal(null)
    } catch (error) {
      console.error('Error adjusting stock:', error)
      alert('Failed to adjust stock')
    }
  }

  useEffect(() => {
    if (!user || branchesLoading) return

    if (branches.length === 0) {
      createDefaultBranch()
      return
    }

    if (!selectedBranchId) {
      setSelectedBranchId(branches[0].id)
    }
  }, [user, branchesLoading, branches, selectedBranchId])

  useEffect(() => {
    if (!effectiveUserId || !selectedBranch) return

    setLoading(true)
    Promise.all([
      applyInventorySnapshot(),
      loadMovements(),
      loadTransfers()
    ]).finally(() => setLoading(false))
  }, [effectiveUserId, selectedBranch])

  const refreshInventory = async () => {
    await Promise.all([
      applyInventorySnapshot(),
      loadMovements(),
      loadTransfers()
    ])
  }

  const createTransfer = async (data: {
    toBranchId: string
    items: { productId: string; quantity: number }[]
    reason?: string
    notes?: string
  }) => {
    if (!effectiveUserId || !selectedBranch) return false

    try {
      await createStockTransfer(effectiveUserId, {
        fromBranchId: selectedBranch,
        toBranchId: data.toBranchId,
        items: data.items,
        reason: data.reason,
        notes: data.notes
      })
      setShowTransferModal(false)
      await refreshInventory()
      return true
    } catch (error) {
      console.error('Error creating stock transfer:', error)
      alert(error instanceof Error ? error.message : 'Failed to create stock transfer')
      return false
    }
  }

  const approveTransfer = async (transfer: StockTransfer) => {
    if (!user) return

    try {
      setTransferActionId(transfer.id)
      await approveStockTransfer(
        transfer.id,
        user.uid,
        transfer.items.map(item => ({
          productId: item.productId,
          approvedQuantity: item.approvedQuantity ?? item.requestedQuantity
        }))
      )
      await refreshInventory()
    } catch (error) {
      console.error('Error approving transfer:', error)
      alert(error instanceof Error ? error.message : 'Failed to approve transfer')
    } finally {
      setTransferActionId(null)
    }
  }

  const receiveTransfer = async (transfer: StockTransfer) => {
    if (!user) return

    try {
      setTransferActionId(transfer.id)
      await receiveStockTransfer(
        transfer.id,
        user.uid,
        transfer.items.map(item => ({
          productId: item.productId,
          receivedQuantity: item.approvedQuantity ?? item.requestedQuantity
        }))
      )
      await refreshInventory()
    } catch (error) {
      console.error('Error receiving transfer:', error)
      alert(error instanceof Error ? error.message : 'Failed to receive transfer')
    } finally {
      setTransferActionId(null)
    }
  }

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId)
    return product?.name || productId
  }

  const getBranchName = (branchId: string) => {
    return branches.find(branch => branch.id === branchId)?.name || branchId
  }

  const getTransferStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'RECEIVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getProductBySKU = (sku: string) => {
    return products.find(p => p.sku === sku || p.id === sku)
  }

  const formatMovementType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  if (!user) return null

  return (
    <div className="space-y-6 font-dm-sans">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <motion.div {...fadeInUp}>
          <h1 className="dashboard-page-title">Inventory Management</h1>
          <p className="dashboard-page-subtitle mt-1">Track and manage your stock across branches</p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-3">
          {branches.length > 1 && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="dashboard-field px-3 py-2"
            >
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}

          <Button
            onClick={refreshInventory}
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
                      <p className="text-sm font-medium text-[#64748b]">Total Products</p>
                      <p className="dashboard-metric-value text-3xl font-semibold tracking-[-0.02em] text-[#0f172a]">{dashboard?.totalProducts || 0}</p>
                    </div>
                    <CubeIcon className="h-8 w-8 text-[#004aad]" />
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#64748b]">Low Stock Items</p>
                      <p className="dashboard-metric-value text-3xl font-semibold tracking-[-0.02em] text-[#f59e0b]">{dashboard?.lowStockItems || 0}</p>
                    </div>
                    <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#64748b]">Out of Stock</p>
                      <p className="dashboard-metric-value text-3xl font-semibold tracking-[-0.02em] text-[#dc2626]">{dashboard?.outOfStockItems || 0}</p>
                    </div>
                    <ArchiveBoxIcon className="h-8 w-8 text-red-600" />
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#64748b]">Inventory Value</p>
                      <p className="dashboard-metric-value text-3xl font-semibold tracking-[-0.02em] text-[#16a34a]">
                        {formatCurrency(dashboard?.totalInventoryValue || 0, currency)}
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
                <h2 className="dashboard-section-title mb-4">Recent Stock Movements</h2>
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
                    <div className="dashboard-empty-state py-4">No recent movements</div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Enhanced Product Overview */}
            {dashboard && dashboard.totalProducts > 0 && (
              <motion.div variants={fadeInUp}>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="dashboard-section-title">Inventory Overview</h3>
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
                    <div className="dashboard-soft-panel p-6">
                      <h4 className="mb-4 flex items-center font-semibold text-[#004aad]">
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
                    <div className="dashboard-soft-panel p-6">
                      <h4 className="mb-4 flex items-center font-semibold text-[#004aad]">
                        <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                        Quick Actions
                      </h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setActiveTab('movements')}
                          className="dashboard-list-item flex w-full items-center p-3 text-left text-[#334155]"
                        >
                          <ClockIcon className="h-4 w-4 mr-3" />
                          View Movements
                        </button>
                        <button
                          onClick={() => setActiveTab('transfers')}
                          className="dashboard-list-item flex w-full items-center p-3 text-left text-[#334155]"
                        >
                          <TruckIcon className="h-4 w-4 mr-3" />
                          Manage Transfers
                        </button>
                        <button
                          onClick={() => window.open('/dashboard/products/browse', '_blank')}
                          className="dashboard-list-item flex w-full items-center p-3 text-left text-[#334155]"
                        >
                          <CubeIcon className="h-4 w-4 mr-3" />
                          Browse Products
                        </button>
                      </div>
                    </div>

                    {/* Branch & Value Info */}
                    <div className="dashboard-soft-panel p-6">
                      <h4 className="mb-4 flex items-center font-semibold text-[#004aad]">
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Branch Overview
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-[#334155]">Active Branch</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            {branches.find(b => b.id === selectedBranch)?.name || 'Main Branch'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-[#334155]">Total Value</span>
                          <span className="dashboard-tabular font-bold text-[#0f172a]">
                            {formatCurrency(dashboard.totalInventoryValue, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-[#334155]">Last Updated</span>
                          <span className="text-sm font-medium text-[#64748b]">Just now</span>
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
                  const primaryImageUrl = getProductImageUrl(product)
                  return (
                    <div key={`${stock.productId}-${stock.branchId}`}
                         className="flex flex-col gap-4 py-3 border-b border-gray-100 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                          {primaryImageUrl ? (
                            <Image
                              src={primaryImageUrl}
                              alt={product?.name || 'Product image'}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <CubeIcon className="h-7 w-7 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-medium">{product?.name || stock.productId}</h3>
                          {product?.category && (
                            <p className="mb-0.5 text-xs font-medium text-gray-500">{product.category}</p>
                          )}
                          <p className="text-sm text-gray-600">
                            SKU: {product?.sku || 'N/A'} • Min: {stock.minStockLevel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="text-left sm:text-right">
                          <p className="font-medium">{stock.currentStock} units</p>
                          <p className="text-sm text-gray-600">
                            Available: {stock.availableStock}
                            {stock.reservedStock > 0 && ` (${stock.reservedStock} reserved)`}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
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
                      <div className="dashboard-empty-state p-12">
                        <div className="relative">
                          <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[18px] border border-[#e6ebf2] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                            <CubeIcon className="mx-auto h-12 w-12 text-[#004aad]" />
                          </div>
                        </div>

                        <h3 className="mb-3 text-2xl font-semibold tracking-[-0.02em] text-[#0f172a]">Start your inventory journey</h3>
                        <p className="mx-auto mb-8 max-w-md leading-relaxed text-[#64748b]">
                          Create your first products to begin tracking inventory.
                          Build a comprehensive catalog of everything you sell.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button
                            onClick={() => window.open('/dashboard/products', '_blank')}
                            size="lg"
                            className="dashboard-action-primary"
                          >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Your First Product
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => window.open('/dashboard/products/browse', '_blank')}
                            className="dashboard-action-secondary"
                          >
                            Learn More
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Has products but no inventory records
                      <div className="dashboard-empty-state p-12">
                        <div className="relative mb-8">
                          <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-[18px] border border-[#e6ebf2] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                            <ArchiveBoxIcon className="mx-auto h-12 w-12 text-[#004aad]" />
                          </div>
                        </div>

                        <h3 className="mb-3 text-2xl font-semibold tracking-[-0.02em] text-[#0f172a]">Ready to track inventory?</h3>
                        <p className="mx-auto mb-2 max-w-lg leading-relaxed text-[#64748b]">
                          You have <strong className="text-[#004aad]">{products.length} product{products.length !== 1 ? 's' : ''}</strong> in your catalog.
                          Let's set up inventory tracking to monitor stock levels, movements, and alerts.
                        </p>

                        <div className="dashboard-panel mx-auto mb-8 max-w-2xl p-6">
                          <h4 className="mb-4 font-semibold text-[#0f172a]">What happens when you initialize inventory?</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="dashboard-list-item flex items-center gap-3 p-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <CubeIcon className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-[#0f172a]">Stock tracking</p>
                                <p className="text-[#64748b]">Real-time inventory levels</p>
                              </div>
                            </div>

                            <div className="dashboard-list-item flex items-center gap-3 p-3">
                              <div className="p-2 bg-yellow-100 rounded-lg">
                                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-[#0f172a]">Smart alerts</p>
                                <p className="text-[#64748b]">Low stock notifications</p>
                              </div>
                            </div>

                            <div className="dashboard-list-item flex items-center gap-3 p-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <ClockIcon className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-[#0f172a]">Movement history</p>
                                <p className="text-[#64748b]">Track all stock changes</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button
                            onClick={initializeInventory}
                            size="lg"
                            className="dashboard-action-primary"
                          >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Initialize Inventory for {products.length} Products
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => window.open('/dashboard/products', '_blank')}
                            className="dashboard-action-secondary"
                          >
                            <CubeIcon className="h-4 w-4 mr-2" />
                            Manage Products First
                          </Button>
                        </div>

                        <div className="mt-6 text-xs font-medium text-[#64748b]">
                          Tip: You can add more products later and they'll automatically sync with your inventory system.
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Stock Transfers</h2>
                  <p className="text-sm text-gray-600">
                    Move stock from {getBranchName(selectedBranch)} to another branch and track receipt.
                  </p>
                </div>
                <Button
                  onClick={() => setShowTransferModal(true)}
                  disabled={branches.length < 2 || stockLevels.length === 0}
                >
                  <TruckIcon className="h-4 w-4 mr-2" />
                  New Transfer
                </Button>
              </div>

              {branches.length < 2 ? (
                <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <TruckIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="font-semibold text-gray-800">Add another branch first</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Transfers need a source and a destination branch. You currently have {branches.length}.
                  </p>
                </div>
              ) : transfers.length === 0 ? (
                <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <TruckIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="font-semibold text-gray-800">No transfers for this branch yet</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Create a transfer request to move stock between branches.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {transfers.map((transfer) => {
                    const isOutbound = transfer.fromBranchId === selectedBranch
                    const isInbound = transfer.toBranchId === selectedBranch
                    const totalQuantity = transfer.items.reduce(
                      (sum, item) => sum + (item.approvedQuantity ?? item.requestedQuantity ?? 0),
                      0
                    )

                    return (
                      <div key={transfer.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {isOutbound ? 'Outbound' : isInbound ? 'Inbound' : 'Transfer'}
                              </h3>
                              <Badge variant="outline" className={getTransferStatusColor(transfer.status)}>
                                {transfer.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              {getBranchName(transfer.fromBranchId)} -&gt; {getBranchName(transfer.toBranchId)}
                            </p>
                            {transfer.reason && (
                              <p className="mt-1 text-sm text-gray-500">{transfer.reason}</p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {transfer.status === 'PENDING' && isOutbound && (
                              <Button
                                size="sm"
                                onClick={() => approveTransfer(transfer)}
                                disabled={transferActionId === transfer.id}
                              >
                                {transferActionId === transfer.id ? 'Approving...' : 'Approve & Ship'}
                              </Button>
                            )}
                            {transfer.status === 'IN_TRANSIT' && isInbound && (
                              <Button
                                size="sm"
                                onClick={() => receiveTransfer(transfer)}
                                disabled={transferActionId === transfer.id}
                              >
                                {transferActionId === transfer.id ? 'Receiving...' : 'Receive Stock'}
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs font-medium uppercase text-gray-500">Items</p>
                            <p className="mt-1 font-semibold text-gray-900">{transfer.items.length}</p>
                          </div>
                          <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs font-medium uppercase text-gray-500">Units</p>
                            <p className="mt-1 font-semibold text-gray-900">{totalQuantity}</p>
                          </div>
                          <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs font-medium uppercase text-gray-500">Direction</p>
                            <p className="mt-1 font-semibold text-gray-900">{isOutbound ? 'Out' : 'In'}</p>
                          </div>
                        </div>

                        <div className="mt-4 divide-y divide-gray-100 rounded-md border border-gray-100">
                          {transfer.items.map((item) => (
                            <div key={item.productId} className="flex items-center justify-between px-3 py-2 text-sm">
                              <span className="font-medium text-gray-800">{getProductName(item.productId)}</span>
                              <span className="text-gray-600">
                                {item.receivedQuantity || 0} / {item.approvedQuantity ?? item.requestedQuantity} received
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {showTransferModal && (
        <StockTransferModal
          branches={branches}
          selectedBranch={selectedBranch}
          stockLevels={stockLevels}
          products={products}
          getProductName={getProductName}
          onCreate={createTransfer}
          onCancel={() => setShowTransferModal(false)}
        />
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

interface StockTransferModalProps {
  branches: Branch[]
  selectedBranch: string
  stockLevels: StockLevel[]
  products: Product[]
  getProductName: (productId: string) => string
  onCreate: (data: {
    toBranchId: string
    items: { productId: string; quantity: number }[]
    reason?: string
    notes?: string
  }) => Promise<boolean>
  onCancel: () => void
}

function StockTransferModal({
  branches,
  selectedBranch,
  stockLevels,
  products,
  getProductName,
  onCreate,
  onCancel
}: StockTransferModalProps) {
  const destinationBranches = branches.filter(branch => branch.id !== selectedBranch)
  const transferableStock = stockLevels.filter(stock => stock.availableStock > 0)
  const [toBranchId, setToBranchId] = useState(destinationBranches[0]?.id || '')
  const [productId, setProductId] = useState(transferableStock[0]?.productId || '')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('Stock rebalancing')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([])
  const [destinationStock, setDestinationStock] = useState<StockLevel[]>([])
  const [destinationLoading, setDestinationLoading] = useState(false)
  const [destinationError, setDestinationError] = useState<string | null>(null)
  const [linkingProductId, setLinkingProductId] = useState<string | null>(null)
  const [linkErrorsByProductId, setLinkErrorsByProductId] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [setupByProductId, setSetupByProductId] = useState<Record<string, {
    costPrice: string
    sellingPrice: string
    reorderLevel: string
    binLocation: string
    batchNumber: string
    expiryDate: string
  }>>({})
  const [saving, setSaving] = useState(false)

  const selectedStock = transferableStock.find(stock => stock.productId === productId)
  const destinationProductIds = new Set(destinationStock.map(stock => stock.productId))
  const missingItems = items.filter(item => !destinationProductIds.has(item.productId))
  const selectedProductNeedsSetup = Boolean(productId && !destinationProductIds.has(productId))

  const mapDestinationInventory = (inventory: Awaited<ReturnType<typeof getInventoryItems>>) => inventory.map((item) => ({
    productId: item.productId,
    branchId: item.branchId,
    currentStock: item.currentStock,
    reservedStock: item.reservedStock,
    availableStock: item.availableStock,
    minStockLevel: item.minStockLevel,
    isLowStock: item.currentStock <= item.minStockLevel
  }))

  useEffect(() => {
    let cancelled = false

    async function loadDestinationStock() {
      if (!toBranchId) {
        setDestinationStock([])
        return
      }

      setDestinationLoading(true)
      setDestinationError(null)
      setLinkErrorsByProductId({})
      setFormError(null)
      try {
        const inventory = await getInventoryItems('', toBranchId)
        if (cancelled) return
        setDestinationStock(mapDestinationInventory(inventory))
      } catch (error) {
        console.error('Error loading destination inventory:', error)
        if (!cancelled) {
          setDestinationStock([])
          setDestinationError('Could not check destination inventory. Try again before creating the transfer.')
        }
      } finally {
        if (!cancelled) setDestinationLoading(false)
      }
    }

    loadDestinationStock()
    return () => {
      cancelled = true
    }
  }, [toBranchId])

  const addItem = () => {
    if (!productId || !selectedStock) return
    setFormError(null)
    if (quantity <= 0) {
      setFormError('Quantity must be greater than zero')
      return
    }
    if (quantity > selectedStock.availableStock) {
      setFormError('Only ' + selectedStock.availableStock + ' units are available for transfer')
      return
    }

    setItems((currentItems) => {
      const existing = currentItems.find(item => item.productId === productId)
      if (existing) {
        return currentItems.map(item =>
          item.productId === productId ? { ...item, quantity } : item
        )
      }
      return [...currentItems, { productId, quantity }]
    })
  }

  const removeItem = (itemProductId: string) => {
    setItems(currentItems => currentItems.filter(item => item.productId !== itemProductId))
  }

  const getSetup = (itemProductId: string) => {
    const product = products.find(candidate => candidate.id === itemProductId)
    return setupByProductId[itemProductId] || {
      costPrice: String(product?.costPrice ?? ''),
      sellingPrice: String(product?.sellingPrice ?? ''),
      reorderLevel: String(product?.minStockLevel ?? 0),
      binLocation: product?.location || '',
      batchNumber: product?.batchNumber || '',
      expiryDate: product?.expiryDate ? new Date(product.expiryDate).toISOString().slice(0, 10) : ''
    }
  }

  const updateSetup = (itemProductId: string, field: keyof ReturnType<typeof getSetup>, value: string) => {
    setSetupByProductId(current => ({
      ...current,
      [itemProductId]: {
        ...getSetup(itemProductId),
        ...current[itemProductId],
        [field]: value
      }
    }))
  }

  const linkProductToDestination = async (itemProductId: string) => {
    if (!toBranchId) return

    setFormError(null)
    setLinkErrorsByProductId(current => {
      const next = { ...current }
      delete next[itemProductId]
      return next
    })

    const setup = getSetup(itemProductId)
    const costPrice = Number(setup.costPrice || 0)
    const sellingPrice = Number(setup.sellingPrice || 0)
    const reorderLevel = Number(setup.reorderLevel || 0)

    if (costPrice < 0 || sellingPrice < 0 || reorderLevel < 0) {
      setLinkErrorsByProductId(current => ({
        ...current,
        [itemProductId]: 'Cost price, selling price, and reorder level cannot be negative'
      }))
      return
    }

    try {
      setLinkingProductId(itemProductId)
      await linkBackendProductToBranch(itemProductId, toBranchId, {
        costPrice,
        sellingPrice,
        reorderLevel,
        binLocation: setup.binLocation.trim(),
        batchNumber: setup.batchNumber.trim(),
        expiryDate: setup.expiryDate || null
      })
      const inventory = await getInventoryItems('', toBranchId)
      setDestinationStock(mapDestinationInventory(inventory))
      setDestinationError(null)
    } catch (error) {
      console.error('Error linking product to destination branch:', error)
      setLinkErrorsByProductId(current => ({
        ...current,
        [itemProductId]: error instanceof Error ? error.message : 'Failed to link product to destination branch'
      }))
    } finally {
      setLinkingProductId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!toBranchId) {
      setFormError('Choose a destination branch')
      return
    }
    if (items.length === 0) {
      setFormError('Add at least one product to transfer')
      return
    }
    if (destinationError) {
      setFormError(destinationError)
      return
    }
    if (missingItems.length > 0) {
      setFormError('Link all selected products to the destination branch before creating the transfer')
      return
    }

    setSaving(true)
    const success = await onCreate({
      toBranchId,
      items,
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined
    })
    setSaving(false)

    if (success) onCancel()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="dashboard-panel mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900">Create Stock Transfer</h3>
        <p className="mt-1 text-sm text-gray-600">
          Select items from the current branch and send them to another branch.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Destination Branch</label>
            <select
              value={toBranchId}
              onChange={(e) => setToBranchId(e.target.value)}
              className="dashboard-field w-full px-3 py-2"
              required
            >
              {destinationBranches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            {destinationLoading && (
              <p className="mt-2 text-sm text-gray-500">Checking destination inventory...</p>
            )}
            {destinationError && (
              <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{destinationError}</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end">
              <div>
                <label className="block text-sm font-medium mb-2">Product</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="dashboard-field w-full px-3 py-2"
                  disabled={transferableStock.length === 0}
                >
                  {transferableStock.map(stock => {
                    const product = products.find(p => p.id === stock.productId)
                    return (
                      <option key={stock.productId} value={stock.productId}>
                        {getProductName(stock.productId)} ({stock.availableStock} available{product?.sku ? ', ' + product.sku : ''}{destinationProductIds.has(stock.productId) ? '' : ', needs setup'})
                      </option>
                    )
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={selectedStock?.availableStock || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="dashboard-field w-full px-3 py-2"
                />
              </div>
              <Button type="button" variant="outline" onClick={addItem} disabled={!productId}>
                Add
              </Button>
            </div>

            {selectedProductNeedsSetup && (
              <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                This product is not set up in the destination branch yet. Add it to the transfer, then complete destination setup below.
              </p>
            )}

            {transferableStock.length === 0 && (
              <p className="mt-3 text-sm text-gray-500">No available stock in this branch.</p>
            )}
            {formError && (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
            )}
          </div>

          {items.length > 0 && (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {items.map(item => (
                <div key={item.productId} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{getProductName(item.productId)}</p>
                    <p className="text-gray-500">
                      {item.quantity} units
                      {!destinationProductIds.has(item.productId) && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Needs setup in destination</span>
                      )}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => removeItem(item.productId)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {missingItems.length > 0 && (
            <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div>
                <p className="font-medium text-amber-900">Destination setup required</p>
                <p className="mt-1 text-sm text-amber-800">Set branch-specific inventory details before creating this transfer. Stock starts at zero and increases only when the transfer is received.</p>
              </div>
              {missingItems.map(item => {
                const setup = getSetup(item.productId)
                return (
                  <div key={item.productId} className="rounded-md border border-amber-200 bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{getProductName(item.productId)}</p>
                        <p className="text-sm text-gray-500">Create destination inventory with zero starting stock.</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => linkProductToDestination(item.productId)} disabled={linkingProductId === item.productId || destinationLoading}>
                        {linkingProductId === item.productId ? 'Linking...' : 'Link to destination branch'}
                      </Button>
                    </div>
                    {linkErrorsByProductId[item.productId] && (
                      <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {linkErrorsByProductId[item.productId]}
                      </p>
                    )}
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <label className="text-sm font-medium text-gray-700">
                        Cost price
                        <input type="number" min="0" step="0.01" value={setup.costPrice} onChange={(e) => updateSetup(item.productId, 'costPrice', e.target.value)} className="dashboard-field mt-1 w-full px-3 py-2 font-normal" />
                      </label>
                      <label className="text-sm font-medium text-gray-700">
                        Selling price
                        <input type="number" min="0" step="0.01" value={setup.sellingPrice} onChange={(e) => updateSetup(item.productId, 'sellingPrice', e.target.value)} className="dashboard-field mt-1 w-full px-3 py-2 font-normal" />
                      </label>
                      <label className="text-sm font-medium text-gray-700">
                        Reorder level
                        <input type="number" min="0" value={setup.reorderLevel} onChange={(e) => updateSetup(item.productId, 'reorderLevel', e.target.value)} className="dashboard-field mt-1 w-full px-3 py-2 font-normal" />
                      </label>
                      <label className="text-sm font-medium text-gray-700">
                        Bin location
                        <input type="text" value={setup.binLocation} onChange={(e) => updateSetup(item.productId, 'binLocation', e.target.value)} className="dashboard-field mt-1 w-full px-3 py-2 font-normal" placeholder="Shelf or bin" />
                      </label>
                      <label className="text-sm font-medium text-gray-700">
                        Batch number
                        <input type="text" value={setup.batchNumber} onChange={(e) => updateSetup(item.productId, 'batchNumber', e.target.value)} className="dashboard-field mt-1 w-full px-3 py-2 font-normal" placeholder="Optional" />
                      </label>
                      <label className="text-sm font-medium text-gray-700">
                        Expiry date
                        <input type="date" value={setup.expiryDate} onChange={(e) => updateSetup(item.productId, 'expiryDate', e.target.value)} className="dashboard-field mt-1 w-full px-3 py-2 font-normal" />
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="dashboard-field w-full px-3 py-2"
              placeholder="Stock rebalancing"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="dashboard-field w-full px-3 py-2"
              rows={3}
              placeholder="Optional transfer notes"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={saving || items.length === 0 || missingItems.length > 0 || destinationLoading || Boolean(destinationError)}>
              {saving ? 'Creating...' : missingItems.length > 0 ? 'Complete destination setup' : 'Create Transfer'}
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
        className="dashboard-panel mx-4 w-full max-w-md p-6"
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
              className="dashboard-field w-full px-3 py-2"
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
              className="dashboard-field w-full px-3 py-2"
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
              className="dashboard-field w-full px-3 py-2"
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
              className="dashboard-field w-full px-3 py-2"
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
