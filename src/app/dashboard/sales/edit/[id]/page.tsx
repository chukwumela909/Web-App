'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StaffProtectedRoute from '@/components/auth/StaffProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import { 
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import type { Product, Sale, PaymentMethod, SaleType } from '@/lib/firestore'
import { getProducts, getSales, updateSale, getMultiItemSales, updateMultiItemSale } from '@/lib/firestore'
import type { MultiItemSale, SaleItem } from '@/lib/multi-item-sales-types'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

function EditSalePageContent() {
  const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'MPESA', 'BANK_TRANSFER', 'CREDIT']
  
  const { user } = useAuth()
  const { staff } = useStaff()
  const currency = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  const router = useRouter()
  const params = useParams()
  const saleId = params.id as string

  // Determine the effective user ID for data loading
  const effectiveUserId = staff ? staff.userId : user?.uid

  const [sale, setSale] = useState<Sale | MultiItemSale | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [editForm, setEditForm] = useState({
    productName: '',
    saleType: 'PRODUCT' as SaleType,
    quantitySold: 1,
    unitPrice: 0,
    totalAmount: 0,
    paymentMethod: 'CASH' as PaymentMethod,
    customerName: '',
    customerPhone: '',
    notes: '',
    serviceDescription: '',
    items: [] as SaleItem[] // For multi-item sales
  })

  // Fetch sale and products data
  useEffect(() => {
    const fetchData = async () => {
      if (!effectiveUserId || !saleId) return

      setLoading(true)
      try {
        const [salesData, multiItemSalesData, productsData] = await Promise.all([
          getSales(effectiveUserId, 2000),
          getMultiItemSales(effectiveUserId, 2000),
          getProducts(effectiveUserId)
        ])

        // First check regular sales
        let foundSale = salesData.find(s => s.id === saleId)
        
        if (foundSale) {
          setSale(foundSale)
          setEditForm({
            productName: foundSale.productName || '',
            saleType: foundSale.saleType,
            quantitySold: foundSale.quantitySold || 0,
            unitPrice: foundSale.unitPrice || 0,
            totalAmount: foundSale.totalAmount || 0,
            paymentMethod: foundSale.paymentMethod,
            customerName: foundSale.customerName || '',
            customerPhone: foundSale.customerPhone || '',
            notes: foundSale.notes || '',
            serviceDescription: foundSale.serviceDescription || '',
            items: []
          })
        } else {
          // Check multi-item sales
          const foundMultiSale = multiItemSalesData.find(s => s.id === saleId)
          if (foundMultiSale) {
            setSale(foundMultiSale)
            setEditForm({
              productName: '',
              saleType: 'OTHER' as SaleType, // Multi-item sales use OTHER as the base type
              quantitySold: foundMultiSale.itemCount || 0,
              unitPrice: foundMultiSale.itemCount > 0 ? foundMultiSale.totalAmount / foundMultiSale.itemCount : 0,
              totalAmount: foundMultiSale.totalAmount || 0,
              paymentMethod: typeof foundMultiSale.paymentMethod === 'object' ? 
                foundMultiSale.paymentMethod.name : foundMultiSale.paymentMethod,
              customerName: foundMultiSale.customerName || '',
              customerPhone: foundMultiSale.customerPhone || '',
              notes: foundMultiSale.notes || '',
              serviceDescription: '',
              items: foundMultiSale.items || []
            })
          }
        }
        
        setProducts(productsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [effectiveUserId, saleId])

  // Update total amount when quantity or price changes
  useEffect(() => {
    const total = editForm.quantitySold * editForm.unitPrice
    setEditForm(prev => ({ ...prev, totalAmount: total }))
  }, [editForm.quantitySold, editForm.unitPrice])

  const formatPaymentMethod = (method: PaymentMethod): string => {
    switch (method) {
      case 'MPESA':
        return 'M-Pesa'
      case 'BANK_TRANSFER':
        return 'Bank Transfer'
      case 'CREDIT':
        return 'Credit'
      case 'CASH':
      default:
        return 'Cash'
    }
  }

  const handleSave = async () => {
    if (!sale) return

    setSaving(true)
    try {
      if ('items' in sale && sale.items) {
        // Multi-item sale
        const updatedMultiSale: MultiItemSale = {
          ...sale,
          items: editForm.items,
          totalAmount: editForm.totalAmount,
          totalCost: editForm.items.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0),
          totalProfit: editForm.items.reduce((sum, item) => sum + (item.quantity * ((item.unitPrice || 0) - (item.costPrice || 0))), 0),
          itemCount: editForm.items.reduce((sum, item) => sum + item.quantity, 0),
          paymentMethod: editForm.paymentMethod,
          customerName: editForm.customerName || null,
          customerPhone: editForm.customerPhone || null,
          notes: editForm.notes || null,
          lastModifiedAt: Date.now()
        }

        await updateMultiItemSale(sale.id, updatedMultiSale)
      } else {
        // Single-item sale
        const updatedSale: Sale = {
          ...sale as Sale,
          productName: editForm.productName,
          quantitySold: editForm.quantitySold,
          unitPrice: editForm.unitPrice,
          totalAmount: editForm.totalAmount,
          paymentMethod: editForm.paymentMethod,
          customerName: editForm.customerName || null,
          customerPhone: editForm.customerPhone || null,
          notes: editForm.notes || null,
          serviceDescription: editForm.serviceDescription || null,
          lastModifiedAt: Date.now()
        }

        await updateSale(sale.id, updatedSale)
      }
      
      // Navigate back to sales details page with success message
      router.push(`/dashboard/sales/${saleId}?updated=true`)
    } catch (error) {
      console.error('Failed to update sale:', error)
      alert('Failed to update sale. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  // Multi-item sale handlers
  const handleItemChange = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...editForm.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setEditForm(prev => ({ ...prev, items: newItems }))
  }

  const handleAddItem = () => {
    setEditForm(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: 1, unitPrice: 0, costPrice: 0, profit: 0 }]
    }))
  }

  const handleRemoveItem = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  // Update total amount for multi-item sales
  useEffect(() => {
    if (editForm.items.length > 0) {
      const newTotalAmount = editForm.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
      setEditForm(prev => ({ ...prev, totalAmount: newTotalAmount }))
    }
  }, [editForm.items])

  if (loading) {
    return (
      <ProtectedRoute>
        <StaffProtectedRoute>
          <DashboardLayout>
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
          </DashboardLayout>
        </StaffProtectedRoute>
      </ProtectedRoute>
    )
  }

  if (!sale) {
    return (
      <ProtectedRoute>
        <StaffProtectedRoute>
          <DashboardLayout>
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sale Not Found</h2>
                <p className="text-gray-600 mb-4">The sale you're looking for doesn't exist.</p>
                <button
                  onClick={() => router.push('/dashboard/sales')}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Go to Sales
                </button>
              </div>
            </div>
          </DashboardLayout>
        </StaffProtectedRoute>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <StaffProtectedRoute>
        <DashboardLayout>
          <motion.div 
            className="max-w-4xl mx-auto p-6 space-y-6"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Sale</h1>
                <p className="text-gray-600">Sale ID: {sale.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            {/* Edit Form */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
                <h2 className="text-xl font-bold text-gray-900">Sale Information</h2>
                <p className="text-gray-600">Update the sale details below</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Product/Service Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product/Service Name
                  </label>
                  {sale.saleType === 'PRODUCT' ? (
                    <select
                      value={products.find(p => p.name === editForm.productName)?.id || ''}
                      onChange={(e) => {
                        const selectedProduct = products.find(p => p.id === e.target.value)
                        if (selectedProduct) {
                          setEditForm(prev => ({
                            ...prev,
                            productName: selectedProduct.name,
                            unitPrice: selectedProduct.sellingPrice || 0,
                            totalAmount: (selectedProduct.sellingPrice || 0) * prev.quantitySold
                          }))
                        }
                      }}
                      className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                    >
                      <option value="">Select a product...</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {currencySymbol} {product.sellingPrice?.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editForm.productName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, productName: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                    />
                  )}
                  {sale.saleType === 'PRODUCT' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a product to update prices automatically
                    </p>
                  )}
                </div>

                {/* Sale Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Type
                  </label>
                  <select
                    value={editForm.saleType}
                    disabled
                    className="w-full px-4 py-3 border border-border rounded-xl bg-muted text-muted-foreground cursor-not-allowed"
                  >
                    <option value={editForm.saleType}>{editForm.saleType}</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">Sale type cannot be changed</p>
                </div>

                {/* Service Description (only for services) */}
                {sale.saleType === 'SERVICE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Description
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.serviceDescription}
                      onChange={(e) => setEditForm(prev => ({ ...prev, serviceDescription: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors resize-none"
                      placeholder="Describe the service provided..."
                    />
                  </div>
                )}

                {/* Multi-Item Sale Items */}
                {'items' in sale && sale.items && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Sale Items</h3>
                      <button
                        onClick={handleAddItem}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Item
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {editForm.items.map((item, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                            {editForm.items.length > 1 && (
                              <button
                                onClick={() => handleRemoveItem(index)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Product Name */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product Name
                              </label>
                              <select
                                value={products.find(p => p.name === item.productName)?.id || ''}
                                onChange={(e) => {
                                  const selectedProduct = products.find(p => p.id === e.target.value)
                                  if (selectedProduct) {
                                    handleItemChange(index, 'productName', selectedProduct.name)
                                    handleItemChange(index, 'unitPrice', selectedProduct.sellingPrice || 0)
                                    handleItemChange(index, 'costPrice', selectedProduct.costPrice || 0)
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              >
                                <option value="">Select product...</option>
                                {products.map(product => (
                                  <option key={product.id} value={product.id}>
                                    {product.name} - {currencySymbol} {product.sellingPrice?.toLocaleString()}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Quantity */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity || 1}
                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              />
                            </div>

                            {/* Unit Price */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit Price ({currencySymbol})
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice || 0}
                                onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              />
                            </div>

                            {/* Cost Price */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cost Price ({currencySymbol})
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.costPrice || 0}
                                onChange={(e) => handleItemChange(index, 'costPrice', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              />
                            </div>
                          </div>
                          
                          {/* Line Total and Profit */}
                          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm">
                            <span className="text-gray-600">
                              Line Total: {currencySymbol} {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}
                            </span>
                            <span className="text-green-600 font-medium">
                              Profit: {currencySymbol} {(((item.unitPrice || 0) - (item.costPrice || 0)) * (item.quantity || 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity and Price (for single-item sales only) */}
                {!('items' in sale && sale.items) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity Sold
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={isNaN(editForm.quantitySold) ? 1 : editForm.quantitySold}
                      onChange={(e) => setEditForm(prev => ({ ...prev, quantitySold: parseInt(e.target.value) || 1 }))}
                      className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Price (KSh)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={isNaN(editForm.unitPrice) ? 0 : editForm.unitPrice}
                      onChange={(e) => setEditForm(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                    />
                  </div>
                </div>
                )}

                {/* Total Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount (KSh)
                  </label>
                  <input
                    type="number"
                    value={isNaN(editForm.totalAmount) ? 0 : editForm.totalAmount}
                    readOnly
                    className="w-full px-4 py-3 border border-border rounded-xl bg-muted text-card-foreground font-bold cursor-not-allowed"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={editForm.paymentMethod}
                    onChange={(e) => setEditForm(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>{formatPaymentMethod(method)}</option>
                    ))}
                  </select>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={editForm.customerName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Enter customer name (optional)"
                      className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={editForm.customerPhone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                      placeholder="+254... (optional)"
                      className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any additional notes (optional)"
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-4 justify-end">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XMarkIcon className="h-5 w-5 inline mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editForm.productName.trim() || editForm.quantitySold <= 0 || editForm.unitPrice <= 0}
                    className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-5 w-5 inline mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </DashboardLayout>
      </StaffProtectedRoute>
    </ProtectedRoute>
  )
}

export default function EditSalePage() {
  return <EditSalePageContent />
}
