'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PlusIcon, 
  TrashIcon, 
  XMarkIcon,
  CheckIcon,
  CalculatorIcon,
  ShoppingCartIcon 
} from '@heroicons/react/24/outline'
import type { Product, SaleType } from '@/lib/firestore'
import { createMultiItemSaleAndReturn } from '@/lib/firestore'
import { 
  SaleCalculations,
  PAYMENT_METHODS 
} from '@/lib/multi-item-sales-types'
import type { DiscountType, MultiItemSale, SaleItem } from '@/lib/multi-item-sales-types'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'

interface MultiItemSalesFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (saleData?: MultiItemSale) => void
  products: Product[]
  userId: string
}

interface FormSaleItem extends Partial<SaleItem> {
  tempId: string
  quantity: number
  unitPrice: number
  costPrice: number
  discount: number
  discountType: DiscountType
}

const defaultItem: FormSaleItem = {
  tempId: '',
  productId: null,
  productName: '',
  saleType: 'PRODUCT',
  serviceDescription: null,
  quantity: 1,
  unitPrice: 0,
  costPrice: 0,
  discount: 0,
  discountType: 'fixed',
  notes: null
}

function lineGross(item: Pick<FormSaleItem, 'quantity' | 'unitPrice'>): number {
  return SaleCalculations.calculateLineTotal(item.quantity, item.unitPrice)
}

function lineDiscountAmount(item: Pick<FormSaleItem, 'quantity' | 'unitPrice' | 'discount' | 'discountType'>): number {
  return SaleCalculations.calculateLineDiscount(item.quantity, item.unitPrice, item.discount, item.discountType)
}

function lineSubtotal(item: Pick<FormSaleItem, 'quantity' | 'unitPrice' | 'discount' | 'discountType'>): number {
  return SaleCalculations.calculateLineSubtotal(item.quantity, item.unitPrice, item.discount, item.discountType)
}

function discountValidationMessage(value: number, discountType: DiscountType, fixedMaximum: number, label: string): string | null {
  if (value < 0) return `${label} discount cannot be negative.`
  if (discountType === 'percentage' && value > 100) return `${label} percentage discount cannot exceed 100%.`
  if (discountType === 'fixed' && value > fixedMaximum) return `${label} fixed discount cannot exceed ${fixedMaximum.toLocaleString()}.`
  return null
}

export default function MultiItemSalesForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  products, 
  userId 
}: MultiItemSalesFormProps) {
  const { currency } = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  const [items, setItems] = useState<FormSaleItem[]>([
    { ...defaultItem, tempId: crypto.randomUUID() }
  ])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [taxRate, setTaxRate] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountType, setDiscountType] = useState<DiscountType>('fixed')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productSearchQueries, setProductSearchQueries] = useState<{[key: string]: string}>({})
  
  // Filter products based on search query for a specific item
  const getFilteredProducts = (tempId: string) => {
    const searchQuery = productSearchQueries[tempId] || ''
    if (!searchQuery.trim()) {
      return products.sort((a, b) => a.name.localeCompare(b.name))
    }
    
    const query = searchQuery.toLowerCase()
    return products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.barcode?.toLowerCase().includes(query)
    ).sort((a, b) => {
      // Prioritize exact matches in name
      const aStartsWithQuery = a.name.toLowerCase().startsWith(query)
      const bStartsWithQuery = b.name.toLowerCase().startsWith(query)
      if (aStartsWithQuery && !bStartsWithQuery) return -1
      if (!aStartsWithQuery && bStartsWithQuery) return 1
      return a.name.localeCompare(b.name)
    })
  }
  
  // Update product search query
  const updateProductSearch = (tempId: string, query: string) => {
    setProductSearchQueries(prev => ({
      ...prev,
      [tempId]: query
    }))
  }

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setItems([{ ...defaultItem, tempId: crypto.randomUUID() }])
      setCustomerName('')
      setCustomerPhone('')
      setCustomerEmail('')
      setPaymentMethod('CASH')
      setTaxRate(0)
      setDiscountAmount(0)
      setDiscountType('fixed')
      setNotes('')
      setProductSearchQueries({})
    }
  }, [isOpen])

  // Add new item
  const addItem = () => {
    setItems([...items, { ...defaultItem, tempId: crypto.randomUUID() }])
  }

  // Remove item
  const removeItem = (tempId: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.tempId !== tempId))
    }
  }

  // Update item
  const updateItem = (tempId: string, updates: Partial<FormSaleItem>) => {
    setItems(items.map(item => 
      item.tempId === tempId ? { ...item, ...updates } : item
    ))
  }

  // Handle product selection
  const handleProductSelection = (tempId: string, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      updateItem(tempId, {
        productId: product.id,
        productName: product.name,
        unitPrice: product.sellingPrice || 0,
        costPrice: product.costPrice || 0,
        saleType: 'PRODUCT'
      })
    }
  }

  // Calculate totals
  const calculations = useMemo(() => {
    const validItems = items.filter(item =>
      (item.productName || '').trim() && item.quantity > 0 && item.unitPrice > 0
    )
    
    const subtotal = validItems.reduce((sum, item) => sum + lineSubtotal(item), 0)
    
    const tax = taxRate > 0 ? SaleCalculations.calculateTax(subtotal, taxRate) : 0
    const discountBase = subtotal + tax
    const discount = discountAmount > 0 
      ? Math.min(discountBase, SaleCalculations.calculateDiscount(discountBase, discountAmount, discountType))
      : 0
    
    const total = SaleCalculations.calculateTotal(subtotal, tax, discount)
    
    return { subtotal, tax, discount, total, itemCount: validItems.length }
  }, [items, taxRate, discountAmount, discountType])

  const itemDiscountValidation = useMemo(() => {
    return items
      .map(item => discountValidationMessage(item.discount, item.discountType, lineGross(item), item.productName || 'Line'))
      .find(Boolean) || null
  }, [items])

  const cartDiscountValidation = useMemo(() => {
    return discountValidationMessage(discountAmount, discountType, calculations.subtotal + calculations.tax, 'Cart')
  }, [calculations.subtotal, calculations.tax, discountAmount, discountType])

  const saleValidationMessage = itemDiscountValidation || cartDiscountValidation

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validItems = items.filter(item =>
      (item.productName || '').trim() && item.quantity > 0 && item.unitPrice > 0
    )
    
    if (validItems.length === 0) {
      alert('Please add at least one valid item')
      return
    }

    if (saleValidationMessage) {
      alert(saleValidationMessage)
      return
    }

    setIsSubmitting(true)
    
    try {
      // Calculate totals for the sale
      const completedSale = await createMultiItemSaleAndReturn(userId, {
        items: validItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          saleType: item.saleType || 'PRODUCT',
          serviceDescription: item.serviceDescription,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          discount: item.discount,
          discountType: item.discountType,
          discountAmount: lineDiscountAmount(item),
          lineSubtotal: lineSubtotal(item),
          lineTotal: lineGross(item),
          notes: item.notes
        })),
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        paymentMethod,
        taxRate: taxRate > 0 ? taxRate : undefined,
        discount: discountAmount,
        discountType,
        notes: notes.trim() || undefined
      })

      onSuccess(completedSale)
      onClose()
    } catch (error) {
      console.error('Error creating multi-item sale:', error)
      alert('Failed to create sale. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCartIcon className="h-6 w-6" />
                Record Sale
              </h2>
              <p className="text-blue-100 mt-1">Add one or more products/services to your transaction</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[80vh]">
          {/* Items Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Sale Items</h3>
            
            <div className="space-y-4">
              <AnimatePresence>
                {items.map((item, index) => {
                  const gross = lineGross(item)
                  const itemDiscount = lineDiscountAmount(item)
                  const itemSubtotal = lineSubtotal(item)
                  const itemDiscountError = discountValidationMessage(item.discount, item.discountType, gross, 'Line')

                  return (
                    <motion.div
                      key={item.tempId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                    >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Item #{index + 1}</h4>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.tempId)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Product/Service Selection */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product/Service <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                          <select
                            value={item.saleType}
                            onChange={(e) => updateItem(item.tempId, { 
                              saleType: e.target.value as SaleType,
                              productId: e.target.value === 'PRODUCT' ? item.productId : null,
                              productName: e.target.value !== 'PRODUCT' ? '' : item.productName
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="PRODUCT">Product</option>
                            <option value="SERVICE">Service</option>
                            <option value="OTHER">Other</option>
                          </select>
                          
                          {item.saleType === 'PRODUCT' ? (
                            <div className="space-y-2">
                              {/* Product Search Input */}
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search products..."
                                  value={productSearchQueries[item.tempId] || ''}
                                  onChange={(e) => updateProductSearch(item.tempId, e.target.value)}
                                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                                {productSearchQueries[item.tempId] && (
                                  <button
                                    type="button"
                                    onClick={() => updateProductSearch(item.tempId, '')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                  >
                                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              
                              {/* Product Selection Dropdown */}
                              <select
                                value={item.productId || ''}
                                onChange={(e) => handleProductSelection(item.tempId, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">
                                  {productSearchQueries[item.tempId] 
                                    ? `${getFilteredProducts(item.tempId).length} products found` 
                                    : 'Select a product...'
                                  }
                                </option>
                                {getFilteredProducts(item.tempId).map(product => (
                                  <option key={product.id} value={product.id}>
                                    {product.name} - {currencySymbol} {product.sellingPrice?.toLocaleString()} 
                                    {product.quantity !== undefined && ` (${product.quantity} in stock)`}
                                  </option>
                                ))}
                              </select>
                              
                              {/* Search Results Info */}
                              {productSearchQueries[item.tempId] && (
                                <div className="text-sm text-gray-600">
                                  {getFilteredProducts(item.tempId).length === 0 
                                    ? 'No products found. Try different search terms.'
                                    : `Showing ${getFilteredProducts(item.tempId).length} of ${products.length} products`
                                  }
                                </div>
                              )}
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder={item.saleType === 'SERVICE' ? 'Service description' : 'Item description'}
                              value={item.productName}
                              onChange={(e) => updateItem(item.tempId, { productName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.tempId, { quantity: Number(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Unit Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit Price ({currencySymbol}) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.tempId, { unitPrice: Number(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Cost Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cost Price ({currencySymbol})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.costPrice}
                          onChange={(e) => updateItem(item.tempId, { costPrice: Number(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Line Discount */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Line Discount
                        </label>
                        <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount}
                            onChange={(e) => updateItem(item.tempId, { discount: Number(e.target.value) || 0 })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${itemDiscountError ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="0"
                          />
                          <select
                            value={item.discountType}
                            onChange={(e) => updateItem(item.tempId, { discountType: e.target.value as DiscountType })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="fixed">Fixed</option>
                            <option value="percentage">Percentage</option>
                          </select>
                        </div>
                        <p className={`mt-1 text-xs ${itemDiscountError ? 'text-red-600' : 'text-gray-500'}`}>
                          {itemDiscountError || `Discount amount: ${currencySymbol} ${itemDiscount.toLocaleString()}`}
                        </p>
                      </div>

                      {/* Line Totals */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Line Subtotal
                        </label>
                        <div className="space-y-1 rounded-lg border bg-white px-3 py-2 text-sm">
                          <div className="flex justify-between gap-3 text-gray-500">
                            <span>Gross</span>
                            <span>{currencySymbol} {gross.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-3 text-red-600">
                            <span>Discount</span>
                            <span>-{currencySymbol} {itemDiscount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-3 border-t pt-1 font-semibold text-gray-900">
                            <span>Subtotal</span>
                            <span>{currencySymbol} {itemSubtotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Item Notes */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Notes
                      </label>
                      <input
                        type="text"
                        placeholder="Optional notes for this item..."
                        value={item.notes || ''}
                        onChange={(e) => updateItem(item.tempId, { notes: e.target.value || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Add Item Button */}
              <button
                type="button"
                onClick={addItem}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <PlusIcon className="h-5 w-5" />
                Add Another Item
              </button>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-6 mt-8">
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Customer Information (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="customer@email.com"
                />
              </div>
            </div>
          </div>

          {/* Payment and Totals */}
          <div className="space-y-6 mt-8">
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Payment Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Payment Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method.id} value={method.name}>
                        {method.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cart Discount ({discountType === 'percentage' ? '%' : currencySymbol})
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${cartDiscountValidation ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="fixed">Fixed</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                    {cartDiscountValidation && (
                      <p className="mt-1 text-xs text-red-600">{cartDiscountValidation}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sale Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Optional notes for this sale..."
                  />
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CalculatorIcon className="h-5 w-5" />
                  Sale Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">{calculations.itemCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{currencySymbol} {calculations.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({taxRate}%):</span>
                    <span className="font-medium">{currencySymbol} {calculations.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cart discount amount:</span>
                    <span className="font-medium text-red-600">-{currencySymbol} {calculations.discount.toLocaleString()}</span>
                  </div>
                  {saleValidationMessage && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                      {saleValidationMessage}
                    </div>
                  )}
                  <hr className="border-gray-300" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-blue-600">{currencySymbol} {calculations.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculations.itemCount === 0 || Boolean(saleValidationMessage)}
              className={`px-8 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isSubmitting || calculations.itemCount === 0 || Boolean(saleValidationMessage)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Recording Sale...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Record Sale ({currencySymbol} {calculations.total.toLocaleString()})
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
