'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StaffProtectedRoute from '@/components/auth/StaffProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  XMarkIcon,
  CheckIcon,
  ArrowTrendingUpIcon,
  TagIcon,
  ReceiptPercentIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import type { Product, Sale, PaymentMethod, SaleType } from '@/lib/firestore'
import { createSale, getProducts, getSales, updateSale, getMultiItemSales } from '@/lib/firestore'
import MultiItemSalesForm from '@/components/sales/MultiItemSalesForm'
import type { MultiItemSale } from '@/lib/multi-item-sales-types'

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

function SalesPageContent() {
  const PAYMENT_METHODS: PaymentMethod[] = ['CASH','MPESA','BANK_TRANSFER','CARD','CREDIT','CHEQUE','OTHER']
  const [showReceiptModal, setShowReceiptModal] = useState<Sale | null>(null)
  const [showMultiItemReceiptModal, setShowMultiItemReceiptModal] = useState<any | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [showMultiItemForm, setShowMultiItemForm] = useState(false)
  const [showRecordSale, setShowRecordSale] = useState(false)
  const [multiItemSales, setMultiItemSales] = useState<MultiItemSale[]>([])
  const receiptRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { staff } = useStaff()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Determine the effective user ID for data loading
  const effectiveUserId = staff ? staff.userId : user?.uid

  // Sale form state matching mobile app structure
  const [saleForm, setSaleForm] = useState({
    saleType: 'PRODUCT' as SaleType,
    selectedProductId: '' as string,
    serviceName: '',
    serviceDescription: '',
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    paymentMethod: 'CASH' as PaymentMethod,
    customerName: '',
    customerPhone: '',
    notes: ''
  })

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

  // Combine and sort all sales (single-item and multi-item)
  const allSales = useMemo(() => {
    const singleItemSales = sales.map(sale => ({
      ...sale,
      saleType: 'single-item' as const,
      displayName: generateSaleDisplayName(sale.id, sale.productName),
      itemCount: 1
    }))

    const multiItemSalesFormatted = multiItemSales.map(sale => ({
      ...sale,
      saleType: 'multi-item' as const,
      displayName: generateSaleDisplayName(sale.id, undefined, sale.items),
      itemCount: sale.items.length,
      paymentMethod: typeof sale.paymentMethod === 'object' ? 
        sale.paymentMethod.name || sale.paymentMethod.displayName : 
        sale.paymentMethod
    }))

    return [...singleItemSales, ...multiItemSalesFormatted]
      .sort((a, b) => b.timestamp - a.timestamp)
  }, [sales, multiItemSales])

  // Calculate total profit for all sales
  const totalProfit = allSales.reduce((sum, sale) => {
    if (sale.saleType === 'single-item') {
      return sum + (sale.profit || 0)
    } else {
      // For multi-item sales, calculate profit from items
      return sum + (sale.items?.reduce((itemSum, item) => itemSum + (item.profit || 0), 0) || 0)
    }
  }, 0)
  const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)

  // Update total amount when quantity or price changes
  useEffect(() => {
    const total = saleForm.quantity * saleForm.unitPrice
    setSaleForm(prev => ({ ...prev, totalAmount: total }))
  }, [saleForm.quantity, saleForm.unitPrice])

  const selectedProduct = useMemo(() => products.find(p => p.id === saleForm.selectedProductId) || null, [products, saleForm.selectedProductId])
  useEffect(() => {
    if (selectedProduct) {
      setSaleForm(prev => ({ ...prev, unitPrice: selectedProduct.sellingPrice }))
    }
  }, [selectedProduct])

  const fetchData = async () => {
    if (!effectiveUserId) return
    try {
      const [saleList, productList, multiItemSaleList] = await Promise.all([
        getSales(effectiveUserId, 2000),
        getProducts(effectiveUserId),
        getMultiItemSales(effectiveUserId, 2000)
      ])
      setSales(saleList)
      setProducts(productList)
      setMultiItemSales(multiItemSaleList)
    } catch (error) {
      console.error('Error fetching sales data:', error)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId])

  useEffect(() => {
    if (searchParams?.get('new')) {
      setShowRecordSale(true)
      router.replace('/dashboard/sales')
    }
  }, [searchParams, router])

  const resetSaleForm = () => {
    setSaleForm({
      saleType: 'PRODUCT',
      selectedProductId: '',
      serviceName: '',
      serviceDescription: '',
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0,
      paymentMethod: 'CASH',
      customerName: '',
      customerPhone: '',
      notes: ''
    })
  }

  const handleSubmitSale = async () => {
    if (!effectiveUserId) return
    
    try {
      const product = selectedProduct
      const isProductSale = saleForm.saleType === 'PRODUCT'
      const saleId = crypto.randomUUID()
      
      // Create the sale object for the receipt
      const completedSale: Sale = {
        id: saleId,
        productId: isProductSale ? product?.id : null,
        productName: isProductSale ? (product?.name || '') : saleForm.serviceName,
        saleType: saleForm.saleType,
        serviceDescription: saleForm.saleType === 'SERVICE' ? saleForm.serviceDescription : null,
        quantitySold: saleForm.quantity,
        unitPrice: saleForm.unitPrice,
        costPrice: isProductSale ? (product?.costPrice || 0) : 0,
        totalAmount: saleForm.totalAmount,
        paymentMethod: saleForm.paymentMethod,
        customerName: saleForm.customerName || null,
        customerPhone: saleForm.customerPhone || null,
        notes: saleForm.notes || null,
        timestamp: Date.now(),
        userId: effectiveUserId
      }
      
      // Save to database
      await createSale(effectiveUserId, {
        id: saleId,
        productId: completedSale.productId,
        productName: completedSale.productName,
        saleType: completedSale.saleType,
        serviceDescription: completedSale.serviceDescription,
        quantitySold: completedSale.quantitySold,
        unitPrice: completedSale.unitPrice,
        costPrice: completedSale.costPrice,
        totalAmount: completedSale.totalAmount,
        paymentMethod: completedSale.paymentMethod,
        customerName: completedSale.customerName,
        customerPhone: completedSale.customerPhone,
        notes: completedSale.notes,
        timestamp: completedSale.timestamp
      })
      
      setShowRecordSale(false)
      resetSaleForm()
      
      // Show receipt modal instead of success message
      setShowReceiptModal(completedSale)
      
      fetchData()
    } catch (error) {
      console.error('Failed to create sale:', error)
      alert('Failed to record sale. Please try again.')
    }
  }

  const downloadReceipt = () => {
    if (receiptRef.current && showReceiptModal) {
      const printContents = receiptRef.current.innerHTML
      const printWindow = window.open('', '', 'width=600,height=800')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .receipt { max-width: 400px; margin: 0 auto; }
              </style>
            </head>
            <body>
              <div class="receipt">${printContents}</div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const formatPaymentMethod = (method: PaymentMethod) => {
    return method === 'MPESA' ? 'M-Pesa' : method.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <ProtectedRoute>
      <StaffProtectedRoute requiredPermission="sales:read">
        <DashboardLayout>
          <motion.div 
            initial="initial" 
            animate="animate" 
            variants={fadeInUp}
            className="p-4 md:p-6 space-y-6"
          >
            {/* Success Message */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="bg-green-50 border border-green-200 rounded-xl p-4"
                >
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Sale recorded successfully!</p>
                      <p className="text-sm text-green-600">The transaction has been added to your records.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Actions Section */}
            <motion.div variants={fadeInUp}>
              <h2 className="text-xl font-bold text-foreground mb-6">Quick Actions</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowMultiItemForm(true)}
                  className="flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <TagIcon className="h-5 w-5" />
                  <span>Record Sale</span>
                </button>
                
                <button 
                  onClick={() => router.push('/dashboard/sales/history')}
                  className="flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <ReceiptPercentIcon className="h-5 w-5" />
                  <span>View History</span>
                </button>
              </div>
            </motion.div>

            {/* Today's Performance Section */}
            <motion.div variants={fadeInUp}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Today&apos;s Performance</h2>
                <ArrowTrendingUpIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Today&apos;s Sales</p>
                    <p className="text-2xl font-bold text-[#4CAF50] mt-2">
                      {allSales.filter(sale => {
                        const today = new Date()
                        const saleDate = new Date(sale.timestamp)
                        return saleDate.toDateString() === today.toDateString()
                      }).length}
                    </p>
                  </div>
                </div>
                
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Today&apos;s Revenue</p>
                    <p className="text-2xl font-bold text-[#2196F3] mt-2">
                      KSh {allSales.filter(sale => {
                        const today = new Date()
                        const saleDate = new Date(sale.timestamp)
                        return saleDate.toDateString() === today.toDateString()
                      }).reduce((sum, sale) => sum + (sale.totalAmount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Today&apos;s Profit</p>
                    <p className="text-2xl font-bold text-[#FF9800] mt-2">
                      KSh {allSales.filter(sale => {
                        const today = new Date()
                        const saleDate = new Date(sale.timestamp)
                        return saleDate.toDateString() === today.toDateString()
                      }).reduce((sum, sale) => {
                        if (sale.saleType === 'single-item') {
                          return sum + (sale.profit || 0)
                        } else {
                          return sum + (sale.items?.reduce((itemSum, item) => itemSum + (item.profit || 0), 0) || 0)
                        }
                      }, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Monthly Overview Section */}
            <motion.div variants={fadeInUp}>
              <h2 className="text-xl font-bold text-foreground mb-6">Monthly Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Total Sales This Month</p>
                    <p className="text-3xl font-bold text-[#4CAF50] mt-2">{allSales.length}</p>
                  </div>
                </div>
                
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-3xl font-bold text-[#2196F3] mt-2">KSh {totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Sales Section */}
            <motion.div variants={fadeInUp}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Recent Sales</h2>
                <button 
                  onClick={() => router.push('/dashboard/sales/history')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  View All →
                </button>
              </div>

              {allSales.length === 0 ? (
                <div className="bg-card rounded-xl p-8 border border-border text-center">
                  <p className="text-muted-foreground">No sales recorded yet</p>
                  <button 
                    onClick={() => setShowMultiItemForm(true)}
                    className="mt-4 bg-[#2175C7] text-white px-6 py-2 rounded-lg hover:bg-[#1565c0] transition-colors"
                  >
                    Record Your First Sale
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {allSales.slice(0, 5).map((sale) => (
                    <div 
                      key={sale.id} 
                      onClick={() => router.push(`/dashboard/sales/${sale.id}`)}
                      className="bg-card p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-card-foreground">{sale.displayName}</h3>
                            <span className="text-xs text-muted-foreground">
                              {sale.itemCount} {sale.itemCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(sale.timestamp).toLocaleDateString()} • {new Date(sale.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#4CAF50]">KSh {sale.totalAmount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{formatPaymentMethod(sale.paymentMethod)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Receipt Modal */}
          <AnimatePresence>
            {showReceiptModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-border"
                >
                  {/* Fixed Header */}
                  <div className="p-6 border-b border-border flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-card-foreground">Receipt Preview</h2>
                      <button
                        onClick={() => setShowReceiptModal(null)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-6" ref={receiptRef}>
                    <div className="text-center border-b border-border pb-4 mb-4">
                      <h3 className="text-lg font-bold text-card-foreground">FahamPesa</h3>
                      <p className="text-sm text-muted-foreground">Sales Receipt</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(showReceiptModal.timestamp).toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Product:</span>
                        <span className="font-medium text-card-foreground">{showReceiptModal.productName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium text-card-foreground">{showReceiptModal.quantitySold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unit Price:</span>
                        <span className="font-medium text-card-foreground">KSh {showReceiptModal.unitPrice?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-3">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="font-bold text-card-foreground text-lg">KSh {showReceiptModal.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="font-medium text-card-foreground">{formatPaymentMethod(showReceiptModal.paymentMethod)}</span>
                      </div>
                      {showReceiptModal.customerName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Customer:</span>
                          <span className="font-medium text-card-foreground">{showReceiptModal.customerName}</span>
                        </div>
                      )}
                      {showReceiptModal.notes && (
                        <div className="border-t border-border pt-3">
                          <p className="text-sm text-muted-foreground">Notes:</p>
                          <p className="text-sm text-card-foreground mt-1">{showReceiptModal.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-center text-xs text-muted-foreground border-t border-border pt-4">
                      <p>Thank you for your business!</p>
                      <p className="mt-1">Generated by FahamPesa</p>
                    </div>
                  </div>

                  {/* Fixed Footer */}
                  <div className="p-6 border-t border-border bg-muted flex-shrink-0">
                    <div className="flex gap-3">
                      <button
                        onClick={downloadReceipt}
                        className="flex-1 px-4 py-3 bg-[#2175C7] text-white rounded-xl hover:bg-[#1565c0] transition-colors flex items-center justify-center space-x-2"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        <span>Print Receipt</span>
                      </button>
                      <button
                        onClick={() => setShowReceiptModal(null)}
                        className="flex-1 px-4 py-3 border border-border text-muted-foreground rounded-xl hover:bg-muted transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Multi-Item Receipt Modal */}
          <AnimatePresence>
            {showMultiItemReceiptModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-border"
                >
                  {/* Fixed Header */}
                  <div className="p-6 border-b border-border flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-card-foreground">Receipt Preview</h2>
                      <button
                        onClick={() => setShowMultiItemReceiptModal(null)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-6" ref={receiptRef}>
                    <div className="text-center border-b border-border pb-4 mb-4">
                      <h3 className="text-lg font-bold text-card-foreground">FahamPesa</h3>
                      <p className="text-sm text-muted-foreground">Sales Receipt</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(showMultiItemReceiptModal.timestamp).toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Receipt #:</span>
                        <span className="font-medium text-card-foreground">#{showMultiItemReceiptModal.id.slice(-8).toUpperCase()}</span>
                      </div>
                      
                      {showMultiItemReceiptModal.customerName && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Customer:</span>
                          <span className="font-medium text-card-foreground">{showMultiItemReceiptModal.customerName}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="font-medium text-card-foreground">{showMultiItemReceiptModal.paymentMethod?.display || 'Cash'}</span>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 mb-4">
                      <h4 className="font-semibold text-card-foreground mb-3">Items:</h4>
                      <div className="space-y-2">
                        {showMultiItemReceiptModal.items?.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <div className="flex-1">
                              <div className="font-medium text-card-foreground">{item.productName}</div>
                              <div className="text-muted-foreground">{item.quantity} x KSh {item.unitPrice?.toLocaleString()}</div>
                            </div>
                            <div className="font-medium text-card-foreground">
                              KSh {item.lineTotal?.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium text-card-foreground">KSh {showMultiItemReceiptModal.subtotal?.toLocaleString()}</span>
                      </div>
                      
                      {showMultiItemReceiptModal.tax && showMultiItemReceiptModal.tax > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax ({showMultiItemReceiptModal.taxRate}%):</span>
                          <span className="font-medium text-card-foreground">KSh {showMultiItemReceiptModal.tax.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {showMultiItemReceiptModal.discount && showMultiItemReceiptModal.discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Discount:</span>
                          <span className="font-medium text-card-foreground">-KSh {showMultiItemReceiptModal.discount.toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                        <span className="text-card-foreground">Total:</span>
                        <span className="text-card-foreground">KSh {showMultiItemReceiptModal.totalAmount?.toLocaleString()}</span>
                      </div>
                    </div>

                    {showMultiItemReceiptModal.notes && (
                      <div className="border-t border-border pt-4 mt-4">
                        <h4 className="font-semibold text-card-foreground mb-2">Notes:</h4>
                        <p className="text-sm text-muted-foreground">{showMultiItemReceiptModal.notes}</p>
                      </div>
                    )}

                    <div className="text-center text-xs text-muted-foreground mt-6 pt-4 border-t border-border">
                      <p>Thank you for your business!</p>
                      <p>Powered by FahamPesa</p>
                    </div>
                  </div>

                  {/* Fixed Footer */}
                  <div className="p-6 border-t border-border bg-muted flex-shrink-0">
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (receiptRef.current) {
                            const printContents = receiptRef.current.innerHTML
                            const printWindow = window.open('', '', 'width=600,height=800')
                            if (printWindow) {
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Receipt - FahamPesa</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; margin: 20px; }
                                      .receipt { max-width: 400px; margin: 0 auto; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="receipt">${printContents}</div>
                                  </body>
                                </html>
                              `)
                              printWindow.document.close()
                              printWindow.print()
                            }
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-[#2175C7] text-white rounded-xl hover:bg-[#1565c0] transition-colors flex items-center justify-center space-x-2"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        <span>Print Receipt</span>
                      </button>
                      <button
                        onClick={() => setShowMultiItemReceiptModal(null)}
                        className="flex-1 px-4 py-3 border border-border text-muted-foreground rounded-xl hover:bg-muted transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Multi-Item Sales Form */}
          <MultiItemSalesForm
            isOpen={showMultiItemForm}
            onClose={() => setShowMultiItemForm(false)}
            onSuccess={(saleData) => {
              fetchData()
              if (saleData) {
                // Show multi-item receipt modal
                setShowMultiItemReceiptModal(saleData)
              } else {
                // Fallback to success message
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 3000)
              }
            }}
            products={products}
            userId={effectiveUserId || ''}
          />
        </DashboardLayout>
      </StaffProtectedRoute>
    </ProtectedRoute>
  )
}

export default function SalesPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    }>
      <SalesPageContent />
    </Suspense>
  )
}