'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StaffProtectedRoute from '@/components/auth/StaffProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import { 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  CreditCardIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import type { Sale, PaymentMethod } from '@/lib/firestore'
import { getSales, deleteSale, getMultiItemSales, deleteMultiItemSale } from '@/lib/firestore'
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

type DateFilter = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS'

type CombinedSale = (Sale & { saleType: 'single-item'; displayName: string; itemCount: number }) | 
  (Omit<MultiItemSale, 'paymentMethod'> & { 
    saleType: 'multi-item'; 
    displayName: string; 
    itemCount: number;
    paymentMethod: string;
    saleNumber?: string;
  })

function SalesHistoryContent() {
  const PAYMENT_METHODS: PaymentMethod[] = ['CASH','MPESA','BANK_TRANSFER','CARD','CREDIT','CHEQUE','OTHER']
  const currency = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [multiItemSales, setMultiItemSales] = useState<MultiItemSale[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 10
  
  const { user } = useAuth()
  const { staff } = useStaff()
  const router = useRouter()

  // Determine the effective user ID for data loading
  const effectiveUserId = staff ? staff.userId : user?.uid

  useEffect(() => {
    const fetchSales = async () => {
      if (!effectiveUserId) return
      setLoading(true)
      try {
        const [salesData, multiItemSalesData] = await Promise.all([
          getSales(effectiveUserId, 2000),
          getMultiItemSales(effectiveUserId, 2000)
        ])
        setSales(salesData)
        setMultiItemSales(multiItemSalesData)
      } catch (error) {
        console.error('Error fetching sales:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSales()
  }, [effectiveUserId])

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

  // Combine and process all sales
  const allSales = useMemo(() => {
    const singleItemSales = sales.map(sale => ({
      ...sale,
      saleType: 'single-item' as const,
      displayName: generateSaleDisplayName(sale.id, sale.productName),
      itemCount: 1
    }))
    
    const multiItemSalesFlattened = multiItemSales.map(multiSale => ({
      id: multiSale.id,
      timestamp: multiSale.timestamp,
      totalAmount: multiSale.totalAmount,
      customerName: multiSale.customerName,
      customerPhone: multiSale.customerPhone,
      paymentMethod: multiSale.paymentMethod.name || multiSale.paymentMethod,
      notes: multiSale.notes,
      isDeleted: multiSale.isDeleted,
      userId: multiSale.userId,
      saleType: 'multi-item' as const,
      displayName: generateSaleDisplayName(multiSale.id, undefined, multiSale.items),
      itemCount: multiSale.items.length,
      items: multiSale.items,
      saleNumber: multiSale.saleNumber
    }))
    
    return [...singleItemSales, ...multiItemSalesFlattened]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
  }, [sales, multiItemSales])

  const filteredSales = useMemo(() => {
    let filtered = allSales

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(sale => {
        const query = searchQuery.toLowerCase()
        if (sale.saleType === 'single-item') {
          return sale.productName?.toLowerCase().includes(query) ||
                 sale.customerName?.toLowerCase().includes(query) ||
                 sale.serviceDescription?.toLowerCase().includes(query)
        } else {
          return sale.displayName?.toLowerCase().includes(query) ||
                 sale.customerName?.toLowerCase().includes(query) ||
                 sale.items?.some(item => item.productName.toLowerCase().includes(query))
        }
      })
    }

    // Date filter
    if (dateFilter !== 'ALL') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.timestamp)
        const saleDateOnly = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate())
        
        switch (dateFilter) {
          case 'TODAY':
            return saleDateOnly.getTime() === today.getTime()
          case 'YESTERDAY':
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            return saleDateOnly.getTime() === yesterday.getTime()
          case 'LAST_7_DAYS':
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 7)
            return saleDateOnly >= weekAgo
          case 'LAST_30_DAYS':
            const monthAgo = new Date(today)
            monthAgo.setDate(monthAgo.getDate() - 30)
            return saleDateOnly >= monthAgo
          default:
            return true
        }
      })
    }

    // Payment method filter
    if (paymentMethodFilter) {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentMethodFilter)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

    return filtered
  }, [allSales, searchQuery, dateFilter, paymentMethodFilter])

  const paginatedSales = useMemo(() => {
    const startIndex = currentPage * itemsPerPage
    return filteredSales.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredSales, currentPage])

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)

  const formatPaymentMethod = (method: PaymentMethod) => {
    return method === 'MPESA' ? 'M-Pesa' : method.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const handleDeleteSale = async (sale: CombinedSale) => {
    if (confirm(`Are you sure you want to delete this sale? This action cannot be undone.`)) {
      try {
        if (sale.saleType === 'single-item') {
          await deleteSale(sale.id)
          // Refresh sales by removing the deleted sale from state
          setSales(prevSales => prevSales.filter(s => s.id !== sale.id))
        } else {
          await deleteMultiItemSale(sale.id)
          // Refresh multi-item sales by removing the deleted sale from state
          setMultiItemSales(prevSales => prevSales.filter(s => s.id !== sale.id))
        }
      } catch (error) {
        console.error('Failed to delete sale:', error)
        alert('Failed to delete sale. Please try again.')
      }
    }
  }

  const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
  const totalProfit = filteredSales.reduce((sum, sale) => sum + (((sale.unitPrice || 0) - (sale.costPrice || 0)) * (sale.quantitySold || 0)), 0)

  return (
    <ProtectedRoute>
      <StaffProtectedRoute requiredPermission="sales:read">
        <DashboardLayout>
        <motion.div 
          initial="initial" 
          animate="animate" 
          variants={staggerChildren}
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/sales')}
                  className="p-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
                  title="Back to Sales"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-muted-foreground" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Sales History</h1>
                  <p className="text-muted-foreground">
                    {filteredSales.length} transactions • Page {currentPage + 1} of {Math.max(1, totalPages)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search and Filter Section */}
          <motion.div variants={fadeInUp} className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by product, customer..."
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap gap-2">
                {/* Date Filter */}
                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    className="appearance-none bg-muted border border-border rounded-lg px-4 py-2 pr-8 text-sm font-medium cursor-pointer hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Time</option>
                    <option value="TODAY">Today</option>
                    <option value="YESTERDAY">Yesterday</option>
                    <option value="LAST_7_DAYS">Last 7 Days</option>
                    <option value="LAST_30_DAYS">Last 30 Days</option>
                  </select>
                  <CalendarIcon className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>

                {/* Payment Method Filter */}
                <div className="relative">
                  <select
                    value={paymentMethodFilter || ''}
                    onChange={(e) => setPaymentMethodFilter(e.target.value ? e.target.value as PaymentMethod : null)}
                    className="appearance-none bg-muted border border-border rounded-lg px-4 py-2 pr-8 text-sm font-medium cursor-pointer hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Payments</option>
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>{formatPaymentMethod(method)}</option>
                    ))}
                  </select>
                  <CreditCardIcon className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>

                {/* Clear Filters */}
                {(dateFilter !== 'ALL' || paymentMethodFilter || searchQuery) && (
                  <button
                    onClick={() => {
                      setDateFilter('ALL')
                      setPaymentMethodFilter(null)
                      setSearchQuery('')
                      setCurrentPage(0)
                    }}
                    className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Statistics Section */}
          {filteredSales.length > 0 && (
            <motion.div variants={fadeInUp} className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{currencySymbol} {totalSales.toLocaleString()}</p>
                  <p className="text-sm text-blue-500">Total Sales</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{currencySymbol} {totalProfit.toLocaleString()}</p>
                  <p className="text-sm text-green-500">Total Profit</p>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{filteredSales.length}</p>
                  <p className="text-sm text-orange-500">Transactions</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Sales List */}
          <motion.div variants={fadeInUp}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-muted-foreground">Loading sales...</span>
              </div>
            ) : paginatedSales.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">No sales found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || dateFilter !== 'ALL' || paymentMethodFilter 
                    ? "Try adjusting your filters or search terms" 
                    : "Start by recording your first sale"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedSales.map((sale, index) => (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-card-foreground">{sale.displayName}</h3>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span>
                            {sale.saleType === 'multi-item' 
                              ? `${sale.itemCount} items` 
                              : `${sale.quantitySold} units`
                            }
                          </span>
                          <span>•</span>
                          <span className="text-[#4CAF50] font-medium">{formatPaymentMethod(sale.paymentMethod)}</span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {new Date(sale.timestamp).toLocaleDateString()} at {new Date(sale.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        
                        {sale.customerName && (
                          <div className="text-sm text-blue-600 mt-1">Customer: {sale.customerName}</div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <p className="text-xl font-bold text-[#4CAF50]">{currencySymbol} {sale.totalAmount.toLocaleString()}</p>
                          <p className="text-sm text-orange-600">
                            Profit: {currencySymbol} {(((sale.unitPrice || 0) - (sale.costPrice || 0)) * (sale.quantitySold || 0)).toLocaleString()}
                          </p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/dashboard/sales/${sale.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Sale"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Sale"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i
                    if (totalPages > 5 && currentPage > 2) {
                      pageNum = currentPage - 2 + i
                      if (pageNum >= totalPages) {
                        pageNum = totalPages - 5 + i
                      }
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-border hover:bg-muted'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </motion.div>


        </motion.div>
        </DashboardLayout>
      </StaffProtectedRoute>
    </ProtectedRoute>
  )
}

export default function SalesHistoryPage() {
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
      <SalesHistoryContent />
    </Suspense>
  )
}
