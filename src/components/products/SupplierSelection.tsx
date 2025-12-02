'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BuildingOffice2Icon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { getSuppliers } from '@/lib/suppliers-service'

interface Supplier {
  id: string
  name: string
  status: string
  onTimeDeliveryRate: number
  totalOrders: number
  qualityRating?: number
  paymentTerms: string
  categories: string[]
}

interface SelectedSupplier {
  supplierId: string
  supplierName: string
  isPrimary: boolean
  leadTimeInDays?: number
  minimumOrderQuantity?: number
}

interface SupplierSelectionProps {
  selectedSuppliers: SelectedSupplier[]
  onSuppliersChange: (suppliers: SelectedSupplier[]) => void
  userId: string
  productCategory?: string
}

export default function SupplierSelection({
  selectedSuppliers,
  onSuppliersChange,
  userId,
  productCategory
}: SupplierSelectionProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const suppliersData = await getSuppliers(userId)
        setSuppliers(suppliersData)
      } catch (error) {
        console.error('Error loading suppliers:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSuppliers()
  }, [userId])

  const availableSuppliers = suppliers.filter(supplier => {
    const isAlreadySelected = selectedSuppliers.some(s => s.supplierId === supplier.id)
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !productCategory || supplier.categories.includes(productCategory)
    
    return !isAlreadySelected && matchesSearch && (supplier.status === 'ACTIVE')
  })

  const handleAddSupplier = (supplier: Supplier) => {
    const newSupplier: SelectedSupplier = {
      supplierId: supplier.id,
      supplierName: supplier.name,
      isPrimary: selectedSuppliers.length === 0, // First supplier becomes primary
      leadTimeInDays: undefined,
      minimumOrderQuantity: undefined
    }

    onSuppliersChange([...selectedSuppliers, newSupplier])
    setShowAddModal(false)
    setSearchTerm('')
  }

  const handleRemoveSupplier = (supplierId: string) => {
    const updatedSuppliers = selectedSuppliers.filter(s => s.supplierId !== supplierId)
    
    // If we removed the primary supplier, make the first remaining supplier primary
    if (updatedSuppliers.length > 0 && !updatedSuppliers.some(s => s.isPrimary)) {
      updatedSuppliers[0].isPrimary = true
    }

    onSuppliersChange(updatedSuppliers)
  }

  const handleSetPrimary = (supplierId: string) => {
    const updatedSuppliers = selectedSuppliers.map(supplier => ({
      ...supplier,
      isPrimary: supplier.supplierId === supplierId
    }))
    onSuppliersChange(updatedSuppliers)
  }

  const handleUpdateSupplier = (supplierId: string, updates: Partial<SelectedSupplier>) => {
    const updatedSuppliers = selectedSuppliers.map(supplier =>
      supplier.supplierId === supplierId
        ? { ...supplier, ...updates }
        : supplier
    )
    onSuppliersChange(updatedSuppliers)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= rating ? (
              <StarIconSolid className="h-4 w-4 text-yellow-400" />
            ) : (
              <StarIcon className="h-4 w-4 text-gray-300" />
            )}
          </div>
        ))}
        <span className="text-sm text-gray-500 ml-1">({rating})</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Suppliers
        </label>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Supplier
        </button>
      </div>

      {/* Selected Suppliers */}
      {selectedSuppliers.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
          <BuildingOffice2Icon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">No suppliers selected</p>
          <p className="text-xs text-gray-400">Add suppliers to track pricing and manage relationships</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedSuppliers.map((supplier) => (
            <motion.div
              key={supplier.supplierId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-lg border-2 transition-colors ${
                supplier.isPrimary 
                  ? 'border-blue-200 bg-blue-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    supplier.isPrimary ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <BuildingOffice2Icon className={`h-5 w-5 ${
                      supplier.isPrimary ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{supplier.supplierName}</h4>
                    {supplier.isPrimary && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Primary Supplier
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!supplier.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(supplier.supplierId)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Set as Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveSupplier(supplier.supplierId)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Supplier Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Lead Time (days)
                  </label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      value={supplier.leadTimeInDays || ''}
                      onChange={(e) => handleUpdateSupplier(supplier.supplierId, {
                        leadTimeInDays: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter lead time"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Minimum Order Quantity
                  </label>
                  <div className="relative">
                    <TruckIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      value={supplier.minimumOrderQuantity || ''}
                      onChange={(e) => handleUpdateSupplier(supplier.supplierId, {
                        minimumOrderQuantity: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter minimum quantity"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Supplier</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search suppliers..."
                  />
                </div>
              </div>

              {/* Suppliers List */}
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : availableSuppliers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BuildingOffice2Icon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No suppliers found</p>
                  <p className="text-sm">Try adjusting your search or add new suppliers</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableSuppliers.map((supplier) => (
                    <motion.div
                      key={supplier.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => handleAddSupplier(supplier)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>Orders: {supplier.totalOrders}</span>
                            <span>On-time: {supplier.onTimeDeliveryRate}%</span>
                            {supplier.qualityRating && renderStars(supplier.qualityRating)}
                          </div>
                          {supplier.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {supplier.categories.slice(0, 3).map((category) => (
                                <span
                                  key={category}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {category}
                                </span>
                              ))}
                              {supplier.categories.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{supplier.categories.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <PlusIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
