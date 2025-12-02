'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BuildingOffice2Icon,
  CubeIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  TruckIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { Product, ProductInventoryData, ProductSupplierLink } from '@/lib/firestore'
import { getProductInventoryData, subscribeToProductInventory, getProductPriceHistory } from '@/lib/product-enhancements'
import { getSuppliers } from '@/lib/suppliers-service'

interface EnhancedProductDetailProps {
  product: Product
  userId: string
  onUpdateProduct?: (updates: Partial<Product>) => void
}

interface Supplier {
  id: string
  name: string
  status: string
  onTimeDeliveryRate: number
  totalOrders: number
  qualityRating?: number
}

export default function EnhancedProductDetail({ product, userId, onUpdateProduct }: EnhancedProductDetailProps) {
  const [inventoryData, setInventoryData] = useState<ProductInventoryData | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'suppliers' | 'inventory' | 'pricing'>('suppliers')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load inventory data
        const inventoryResult = await getProductInventoryData(product.id, userId)
        setInventoryData(inventoryResult)

        // Load suppliers
        const suppliersResult = await getSuppliers(userId)
        setSuppliers(suppliersResult)

        // Load price history
        const priceHistoryResult = await getProductPriceHistory(product.id, undefined, 10)
        setPriceHistory(priceHistoryResult)

        // Subscribe to real-time inventory updates
        const unsubscribe = subscribeToProductInventory(product.id, userId, (data) => {
          setInventoryData(data)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error('Error loading enhanced product data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [product.id, userId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const formatDate = (timestamp: number | Date) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Enhanced Product Details</h3>
        <p className="text-sm text-gray-500">Supplier relationships, inventory tracking, and pricing history</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'suppliers', name: 'Suppliers', icon: BuildingOffice2Icon },
            { id: 'inventory', name: 'Inventory', icon: CubeIcon },
            { id: 'pricing', name: 'Pricing History', icon: ChartBarIcon }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'suppliers' && (
          <SuppliersTab
            product={product}
            suppliers={suppliers}
            onUpdateProduct={onUpdateProduct}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab
            product={product}
            inventoryData={inventoryData}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingTab
            product={product}
            priceHistory={priceHistory}
            suppliers={suppliers}
          />
        )}
      </div>
    </div>
  )
}

// Suppliers Tab Component
function SuppliersTab({ 
  product, 
  suppliers, 
  onUpdateProduct 
}: { 
  product: Product
  suppliers: Supplier[]
  onUpdateProduct?: (updates: Partial<Product>) => void 
}) {
  const supplierLinks = product.supplierLinks || []
  const linkedSupplierIds = new Set(supplierLinks.map(link => link.supplierId))
  const availableSuppliers = suppliers.filter(s => !linkedSupplierIds.has(s.id))

  return (
    <div className="space-y-6">
      {/* Current Supplier Links */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Current Suppliers</h4>
        {supplierLinks.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <BuildingOffice2Icon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No suppliers linked to this product</p>
            <p className="text-sm">Add suppliers to track pricing and lead times</p>
          </div>
        ) : (
          <div className="space-y-3">
            {supplierLinks.map((link) => (
              <motion.div
                key={link.supplierId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border-2 ${
                  link.isPrimary ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      link.isPrimary ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <BuildingOffice2Icon className={`h-5 w-5 ${
                        link.isPrimary ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{link.supplierName}</h5>
                      {link.isPrimary && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Primary Supplier
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {link.lastPurchasePrice && (
                      <div>Last Price: ${link.lastPurchasePrice.toFixed(2)}</div>
                    )}
                    {link.leadTimeInDays && (
                      <div>Lead Time: {link.leadTimeInDays} days</div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {supplierLinks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Primary Supplier</div>
            <div className="font-medium text-gray-900">
              {supplierLinks.find(l => l.isPrimary)?.supplierName || 'None'}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Last Purchase</div>
            <div className="font-medium text-gray-900">
              {product.lastPurchasePrice ? `$${product.lastPurchasePrice.toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Avg Purchase Price</div>
            <div className="font-medium text-gray-900">
              {product.averagePurchasePrice ? `$${product.averagePurchasePrice.toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Total Suppliers</div>
            <div className="font-medium text-gray-900">{supplierLinks.length}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Inventory Tab Component
function InventoryTab({ 
  product, 
  inventoryData 
}: { 
  product: Product
  inventoryData: ProductInventoryData | null 
}) {
  if (!inventoryData) {
    return (
      <div className="text-center py-6 text-gray-500">
        <CubeIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No inventory data available</p>
        <p className="text-sm">Inventory tracking will be displayed here once enabled</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Inventory Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CubeIcon className="h-5 w-5 text-blue-600 mr-2" />
            <div className="text-xs text-blue-600 mb-1">Total Stock</div>
          </div>
          <div className="text-2xl font-bold text-blue-900">{inventoryData.totalStock}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CubeIcon className="h-5 w-5 text-green-600 mr-2" />
            <div className="text-xs text-green-600 mb-1">Available</div>
          </div>
          <div className="text-2xl font-bold text-green-900">{inventoryData.availableStock}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-orange-600 mr-2" />
            <div className="text-xs text-orange-600 mb-1">Reserved</div>
          </div>
          <div className="text-2xl font-bold text-orange-900">{inventoryData.reservedStock}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TruckIcon className="h-5 w-5 text-purple-600 mr-2" />
            <div className="text-xs text-purple-600 mb-1">In Transit</div>
          </div>
          <div className="text-2xl font-bold text-purple-900">{inventoryData.inTransitStock}</div>
        </div>
      </div>

      {/* Branch Stock Breakdown */}
      {Object.keys(inventoryData.branchStock).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Stock by Branch</h4>
          <div className="space-y-2">
            {Object.entries(inventoryData.branchStock).map(([branchId, stock]) => (
              <div key={branchId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Branch {branchId}</div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-600">Stock: {stock.stock}</span>
                  <span className="text-green-600">Available: {stock.available}</span>
                  <span className="text-orange-600">Reserved: {stock.reserved}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {(inventoryData.lowStockAlerts.length > 0 || inventoryData.expiryAlerts.length > 0) && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Alerts</h4>
          <div className="space-y-2">
            {inventoryData.lowStockAlerts.map((alert, index) => (
              <div key={`low-${index}`} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <div className="font-medium text-red-900">Low Stock Alert</div>
                  <div className="text-sm text-red-700">
                    Branch {alert.branchId}: {alert.currentStock} units (Min: {alert.minStockLevel})
                  </div>
                </div>
              </div>
            ))}
            {inventoryData.expiryAlerts.map((alert, index) => (
              <div key={`expiry-${index}`} className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <div className="font-medium text-yellow-900">Expiry Alert</div>
                  <div className="text-sm text-yellow-700">
                    Branch {alert.branchId}: {alert.quantity} units expire in {alert.daysUntilExpiry} days
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Pricing Tab Component
function PricingTab({ 
  product, 
  priceHistory, 
  suppliers 
}: { 
  product: Product
  priceHistory: any[]
  suppliers: Supplier[]
}) {
  if (priceHistory.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No pricing history available</p>
        <p className="text-sm">Purchase history will be displayed here</p>
      </div>
    )
  }

  const getSupplierName = (supplierId: string) => {
    return suppliers.find(s => s.id === supplierId)?.name || 'Unknown Supplier'
  }

  return (
    <div className="space-y-6">
      {/* Pricing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-600 mr-2" />
            <div className="text-xs text-blue-600 mb-1">Current Cost</div>
          </div>
          <div className="text-2xl font-bold text-blue-900">${product.costPrice.toFixed(2)}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 mr-2" />
            <div className="text-xs text-green-600 mb-1">Last Purchase</div>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {product.lastPurchasePrice ? `$${product.lastPurchasePrice.toFixed(2)}` : 'N/A'}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ChartBarIcon className="h-5 w-5 text-purple-600 mr-2" />
            <div className="text-xs text-purple-600 mb-1">Average Purchase</div>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {product.averagePurchasePrice ? `$${product.averagePurchasePrice.toFixed(2)}` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Price History Table */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Purchase History</h4>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {priceHistory.map((entry, index) => (
                <tr key={entry.id || index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(entry.effectiveDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getSupplierName(entry.supplierId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${entry.purchasePrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${(entry.purchasePrice * entry.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function formatDate(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp
  return date.toLocaleDateString()
}
