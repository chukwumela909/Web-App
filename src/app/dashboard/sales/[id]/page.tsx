'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  ShareIcon,
  PrinterIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ShoppingCartIcon,
  CalculatorIcon,
  CreditCardIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StaffProtectedRoute from '@/components/auth/StaffProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { getSales, getMultiItemSales, deleteSale, deleteMultiItemSale } from '@/lib/firestore'
import type { Sale } from '@/lib/firestore'
import type { MultiItemSale } from '@/lib/multi-item-sales-types'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

interface SaleDetails extends Sale {
  saleType: 'single-item' | 'multi-item'
  displayName: string
  itemCount: number
  items?: any[]
  saleNumber?: string
  subtotal?: number
  tax?: number
  discount?: number
}

function SaleDetailsContent() {
  const [sale, setSale] = useState<SaleDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  
  const { user } = useAuth()
  const { staff } = useStaff()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const saleId = params.id as string

  // Determine the effective user ID for data loading
  const effectiveUserId = staff ? staff.userId : user?.uid

  // Helper function to generate sale display names
  const generateSaleDisplayName = (saleId: string, productName?: string, items?: any[]) => {
    const shortId = saleId.slice(-4)
    
    if (items && items.length > 0) {
      // Multi-item sale
      const topItem = items[0]?.productName || 'Unknown'
      const additionalCount = items.length - 1
      
      return additionalCount > 0 
        ? `Sale #${shortId} – ${topItem} + ${additionalCount} more items`
        : `Sale #${shortId} – ${topItem}`
    } else {
      // Single-item sale
      return `Sale #${shortId} – ${productName || 'Unknown'}`
    }
  }

  // Check for success message from edit page
  useEffect(() => {
    if (searchParams?.get('updated') === 'true') {
      setShowSuccessMessage(true)
      // Clean up URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      
      // Hide success message after 4 seconds
      setTimeout(() => setShowSuccessMessage(false), 4000)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchSaleDetails = async () => {
      if (!effectiveUserId || !saleId) return
      
      setLoading(true)
      try {
        // Fetch both single-item and multi-item sales
        const [singleSales, multiSales] = await Promise.all([
          getSales(effectiveUserId, 2000),
          getMultiItemSales(effectiveUserId, 2000)
        ])

        // Try to find the sale in single-item sales first
        let foundSale = singleSales.find(s => s.id === saleId)
        if (foundSale) {
          foundSale = {
            ...foundSale,
            saleType: 'single-item' as const,
            displayName: generateSaleDisplayName(foundSale.id, foundSale.productName),
            itemCount: 1
          }
        } else {
          // If not found in single-item sales, check multi-item sales
          const multiSale = multiSales.find(s => s.id === saleId)
          if (multiSale) {
            foundSale = {
              ...multiSale,
              saleType: 'multi-item' as const,
              displayName: generateSaleDisplayName(multiSale.id, undefined, multiSale.items),
              itemCount: multiSale.items.length,
              paymentMethod: typeof multiSale.paymentMethod === 'object' ? 
                multiSale.paymentMethod.name || multiSale.paymentMethod.displayName : 
                multiSale.paymentMethod
            }
          }
        }
        setSale(foundSale || null)
      } catch (error) {
        console.error('Error fetching sale details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSaleDetails()
  }, [effectiveUserId, saleId])

  const formatPaymentMethod = (method: string) => {
    return method === 'MPESA' ? 'M-Pesa' : method.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (!sale) return

    const shareText = `Sale Receipt #${sale.saleNumber || sale.id.slice(-8).toUpperCase()}
    
${sale.saleType === 'multi-item' ? 'Items:' : 'Item:'} ${sale.displayName}
Total: KSh ${sale.totalAmount.toLocaleString()}
Payment: ${formatPaymentMethod(sale.paymentMethod)}
Date: ${new Date(sale.timestamp).toLocaleDateString()}

Generated by FahamPesa`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sale Receipt',
          text: shareText,
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText)
        alert('Receipt details copied to clipboard!')
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText)
      alert('Receipt details copied to clipboard!')
    }
  }

  const handleEdit = () => {
    // Navigate to dedicated edit page
    router.push(`/dashboard/sales/edit/${saleId}`)
  }

  const handleDelete = async () => {
    if (!sale) return
    
    try {
      if (sale.saleType === 'single-item') {
        await deleteSale(sale.id)
      } else {
        // For multi-item sales, use deleteMultiItemSale function
        await deleteMultiItemSale(sale.id)
      }
      
      alert('Sale deleted successfully!')
      router.push('/dashboard/sales/history')
    } catch (error) {
      console.error('Error deleting sale:', error)
      alert('Failed to delete sale. Please try again.')
    }
  }

  const handleDuplicate = () => {
    // Navigate to create a new sale with this sale's data pre-filled
    router.push(`/dashboard/sales?duplicate=${saleId}`)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!sale) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sale Not Found</h1>
            <p className="text-gray-600 mb-6">The sale you're looking for doesn't exist or has been deleted.</p>
            <button
              onClick={() => router.push('/dashboard/sales/history')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Sales History
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <StaffProtectedRoute>
        <DashboardLayout>
          <motion.div 
            className="max-w-7xl mx-auto p-6 space-y-6"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            {/* Success Message */}
            {showSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Sale updated successfully!
                    </p>
                    <p className="text-sm text-green-600">
                      The sale information has been updated with your changes.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Header with Navigation and Actions */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Sale Details</h1>
                  <p className="text-gray-600">#{sale.saleNumber || sale.id.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Share"
                >
                  <ShareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handlePrint}
                  className="p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Print"
                >
                  <PrinterIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleDuplicate}
                  className="p-3 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Duplicate"
                >
                  <DocumentDuplicateIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleEdit}
                  className="p-3 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Receipt Content */}
            <div ref={receiptRef} className="bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none">
              {/* Receipt Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 text-center">
                <div className="max-w-md mx-auto">
                  <h2 className="text-3xl font-bold mb-2">FahamPesa</h2>
                  <p className="text-blue-100 text-lg">Business Management System</p>
                  <div className="mt-6 space-y-1">
                    <p className="text-sm opacity-90">Receipt #{sale.saleNumber || sale.id.slice(-8).toUpperCase()}</p>
                    <p className="text-lg font-semibold">
                      {new Date(sale.timestamp).toLocaleDateString()} at {new Date(sale.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sale Details */}
              <div className="p-8 space-y-8">
                {/* Transaction Details Section */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DocumentDuplicateIcon className="h-6 w-6 text-blue-600" />
                    Transaction Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Sale ID</p>
                      <p className="font-bold text-gray-900">{sale.saleNumber || sale.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-bold text-gray-900">{new Date(sale.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-bold text-gray-900">{new Date(sale.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Items</p>
                      <p className="font-bold text-gray-900">
                        {sale.saleType === 'multi-item' ? sale.itemCount : sale.quantitySold}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Products Details Section */}
                <div className="bg-white border-2 border-blue-100 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
                    Products Details
                  </h3>
                  
                  {sale.saleType === 'multi-item' && sale.items ? (
                    /* Multi-Item Products List */
                    <div className="space-y-4">
                      {sale.items.map((item, index) => (
                        <div key={index} className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-lg mb-1">{item.productName}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Quantity:</span>
                                  <span className="font-semibold ml-1">{item.quantity}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Unit Price:</span>
                                  <span className="font-semibold ml-1">KSh {item.unitPrice.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Cost Price:</span>
                                  <span className="font-semibold ml-1">KSh {(item.costPrice || 0).toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Profit:</span>
                                  <span className="font-semibold ml-1 text-green-600">KSh {((item.unitPrice - (item.costPrice || 0)) * item.quantity).toLocaleString()}</span>
                                </div>
                              </div>
                              {item.notes && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <span className="font-medium">Notes:</span> {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Single Item Product Details */
                    <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-400">
                      <div className="mb-4">
                        <h4 className="text-2xl font-bold text-gray-900 mb-2">{sale.productName}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Quantity</label>
                          <p className="text-xl font-bold text-gray-900">{sale.quantitySold}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Unit Price</label>
                          <p className="text-xl font-bold text-gray-900">KSh {sale.unitPrice?.toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Cost Price</label>
                          <p className="text-xl font-bold text-gray-900">KSh {(sale.costPrice || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Profit</label>
                          <p className="text-xl font-bold text-green-600">KSh {(((sale.unitPrice || 0) - (sale.costPrice || 0)) * (sale.quantitySold || 0)).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Financial Breakdown Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <CalculatorIcon className="h-6 w-6 text-green-600" />
                    Financial Breakdown
                  </h3>
                  
                  <div className="space-y-4">
                    {sale.saleType === 'multi-item' && sale.subtotal ? (
                      /* Multi-Item Financial Breakdown */
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-green-200">
                          <span className="text-gray-700 font-medium">Subtotal</span>
                          <span className="text-lg font-bold text-gray-900">KSh {sale.subtotal.toLocaleString()}</span>
                        </div>
                        {sale.tax && sale.tax > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-green-200">
                            <span className="text-gray-700 font-medium">Tax ({sale.taxRate ? `${sale.taxRate}%` : ''})</span>
                            <span className="text-lg font-bold text-gray-900">KSh {sale.tax.toLocaleString()}</span>
                          </div>
                        )}
                        {sale.discount && sale.discount > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-green-200">
                            <span className="text-gray-700 font-medium">Discount</span>
                            <span className="text-lg font-bold text-red-600">-KSh {sale.discount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-4 border-t-2 border-green-400 bg-green-100 rounded-lg px-4">
                          <span className="text-xl font-bold text-gray-900">TOTAL AMOUNT</span>
                          <span className="text-2xl font-bold text-green-700">KSh {sale.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-700 font-medium">Total Profit</span>
                          <span className="text-lg font-bold text-green-600">
                            KSh {sale.items?.reduce((sum, item) => sum + item.profit, 0).toLocaleString() || '0'}
                          </span>
                        </div>
                      </>
                    ) : (
                      /* Single Item Financial Breakdown */
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-green-200">
                          <span className="text-gray-700 font-medium">Unit Price</span>
                          <span className="text-lg font-bold text-gray-900">KSh {sale.unitPrice?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-green-200">
                          <span className="text-gray-700 font-medium">Quantity</span>
                          <span className="text-lg font-bold text-gray-900">{sale.quantitySold}</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-t-2 border-green-400 bg-green-100 rounded-lg px-4">
                          <span className="text-xl font-bold text-gray-900">TOTAL AMOUNT</span>
                          <span className="text-2xl font-bold text-green-700">KSh {sale.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-700 font-medium">Profit</span>
                          <span className="text-lg font-bold text-green-600">
                            KSh {(((sale.unitPrice || 0) - (sale.costPrice || 0)) * (sale.quantitySold || 0)).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Payment Information Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <CreditCardIcon className="h-6 w-6 text-blue-600" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-100 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                      <p className="font-bold text-lg text-blue-800">{formatPaymentMethod(sale.paymentMethod)}</p>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                      <p className="font-bold text-lg text-blue-800">KSh {sale.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                      <p className="font-bold text-lg text-green-600">Completed</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information Section */}
                {(sale.customerName || sale.customerPhone || sale.customerEmail) && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <PhoneIcon className="h-6 w-6 text-purple-600" />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {sale.customerName && (
                        <div className="bg-purple-100 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Customer Name</p>
                          <p className="font-bold text-lg text-purple-800">{sale.customerName}</p>
                        </div>
                      )}
                      {sale.customerPhone && (
                        <div className="bg-purple-100 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                          <p className="font-bold text-lg text-purple-800">{sale.customerPhone}</p>
                        </div>
                      )}
                      {sale.customerEmail && (
                        <div className="bg-purple-100 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Email Address</p>
                          <p className="font-bold text-lg text-purple-800">{sale.customerEmail}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {sale.notes && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <DocumentDuplicateIcon className="h-6 w-6 text-amber-600" />
                      Notes
                    </h3>
                    <div className="bg-amber-100 rounded-lg p-4">
                      <p className="text-amber-900 leading-relaxed">{sale.notes}</p>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center border-t pt-8 mt-8">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Thank you for your business!</h4>
                    <p className="text-gray-600 mb-2">We appreciate your continued support</p>
                    <p className="text-sm text-gray-500">
                      Generated by FahamPesa • {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Sale</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this sale? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        handleDelete()
                      }}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </DashboardLayout>
      </StaffProtectedRoute>
    </ProtectedRoute>
  )
}

export default function SaleDetailsPage() {
  return <SaleDetailsContent />
}
