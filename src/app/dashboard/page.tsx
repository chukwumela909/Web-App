'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StaffProtectedRoute from '@/components/auth/StaffProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Image from 'next/image'
import { 
  ChartBarIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import type { Product as FPProduct, Sale, Expense, Debtor, MultiItemSale } from '@/lib/firestore'
import { getProducts, getSales, getExpenses, getDebtors, getMultiItemSales } from '@/lib/firestore'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'

// Dashboard asset paths
const dashboardAssets = {
  cartIcon: '/assets/dashboard/cart-icon.svg',
  receiptIcon: '/assets/dashboard/receipt-icon.svg',
  growthIcon: '/assets/dashboard/growth-icon.svg',
  calendarIcon: '/assets/dashboard/calendar-icon.svg',
  arrowDownIcon: '/assets/dashboard/arrow-down-icon.svg',
  addIcon: '/assets/dashboard/add-icon.svg',
  chartIcon: '/assets/dashboard/chart-icon.svg',
  emptyBoxIcon: '/assets/dashboard/empty-box-icon.svg',
}

type DateFilter = 'today' | 'week' | 'month'

export default function DashboardPage() {
  const { user } = useAuth()
  const { staff } = useStaff()
  const router = useRouter()
  const { currency } = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  const [products, setProducts] = useState<FPProduct[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [multiItemSales, setMultiItemSales] = useState<MultiItemSale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Determine the effective user ID for data loading
  const effectiveUserId = staff ? staff.userId : user?.uid

  const fetchData = async (showLoadingSpinner = true) => {
    if (!effectiveUserId) return
    if (showLoadingSpinner) setLoading(true)
    try {
      const [productList, salesList, multiItemSaleList, expensesList, debtorList] = await Promise.all([
        getProducts(effectiveUserId),
        getSales(effectiveUserId, 2000),
        getMultiItemSales(effectiveUserId, 2000),
        getExpenses(effectiveUserId, 500),
        getDebtors(effectiveUserId)
      ])
      console.log('Dashboard fetch - Sales:', salesList.length, 'Multi-item Sales:', multiItemSaleList.length, 'Products:', productList.length)
      setProducts(productList)
      setSales(salesList)
      setMultiItemSales(multiItemSaleList)
      setExpenses(expensesList)
      setDebtors(debtorList)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
      setInitialLoadDone(true)
    }
  }

  useEffect(() => {
    fetchData(true)
  }, [effectiveUserId])

  // Refetch data when tab becomes visible or when navigating back to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && effectiveUserId && initialLoadDone) {
        fetchData(false)
      }
    }

    const handleFocus = () => {
      if (effectiveUserId && initialLoadDone) {
        fetchData(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [effectiveUserId, initialLoadDone])

  // Combine single-item and multi-item sales like the sales page does
  const allSales = useMemo(() => {
    const singleItemSales = sales.map(sale => ({
      ...sale,
      saleCategory: 'single-item' as const,
      displayName: sale.productName || 'Unknown Product',
      itemCount: 1
    }))

    const multiItemSalesFormatted = multiItemSales.map(sale => ({
      ...sale,
      saleCategory: 'multi-item' as const,
      displayName: sale.items?.[0]?.productName || 'Multi-item Sale',
      itemCount: sale.items?.length || 0,
      productName: sale.items?.[0]?.productName || 'Multi-item Sale',
      quantitySold: sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
    }))

    return [...singleItemSales, ...multiItemSalesFormatted]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
  }, [sales, multiItemSales])

  // Filter data based on selected date range
  const getDateRange = (filter: DateFilter) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (filter) {
      case 'today':
        return {
          start: today.getTime(),
          end: today.getTime() + 24 * 60 * 60 * 1000 - 1
        }
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        return {
          start: weekStart.getTime(),
          end: today.getTime() + 24 * 60 * 60 * 1000 - 1
        }
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        return {
          start: monthStart.getTime(),
          end: today.getTime() + 24 * 60 * 60 * 1000 - 1
        }
      default:
        return { start: 0, end: Date.now() }
    }
  }

  const { start: filterStart, end: filterEnd } = getDateRange(dateFilter)

  // Filtered data based on date range (using allSales now)
  const filteredSales = allSales.filter(sale => sale.timestamp >= filterStart && sale.timestamp <= filterEnd)
  const filteredExpenses = expenses.filter(expense => expense.timestamp >= filterStart && expense.timestamp <= filterEnd)

  // Calculate metrics
  const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  const totalProfit = filteredSales.reduce((sum, sale) => {
    if (sale.saleCategory === 'single-item') {
      const profit = ((sale.unitPrice || 0) - (sale.costPrice || 0)) * (sale.quantitySold || 0)
      return sum + profit
    } else {
      // For multi-item sales, calculate profit from items
      const items = (sale as any).items || []
      return sum + items.reduce((itemSum: number, item: any) => itemSum + (item.profit || 0), 0)
    }
  }, 0)

  // Today's specific metrics for the performance cards
  const todayRange = getDateRange('today')
  const todaysSales = allSales.filter(sale => sale.timestamp >= todayRange.start && sale.timestamp <= todayRange.end)
  const todaysExpenses = expenses.filter(expense => expense.timestamp >= todayRange.start && expense.timestamp <= todayRange.end)
  const todaysSalesTotal = todaysSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
  const todaysExpensesTotal = todaysExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  const todaysProfit = todaysSales.reduce((sum, sale) => {
    if (sale.saleCategory === 'single-item') {
      const profit = ((sale.unitPrice || 0) - (sale.costPrice || 0)) * (sale.quantitySold || 0)
      return sum + profit
    } else {
      const items = (sale as any).items || []
      return sum + items.reduce((itemSum: number, item: any) => itemSum + (item.profit || 0), 0)
    }
  }, 0)

  // Check if dashboard is in empty state (no products AND no sales)
  const isEmptyState = products.length === 0 && allSales.length === 0

  // Get user's first name for greeting
  const userName = user?.displayName?.split(' ')[0] || 'there'

  // Calculate low stock alerts
  const lowStockProducts = products.filter(product => {
    const minStock = product.minStockLevel || 5
    return product.quantity <= minStock && product.quantity > 0
  })

  const outOfStockProducts = products.filter(product => product.quantity === 0)

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // Empty State UI
  if (isEmptyState) {
    return (
      <ProtectedRoute>
        <StaffProtectedRoute requiredPermission="dashboard:read">
          <DashboardLayout>
            <div className="space-y-6">
              {/* Title Section */}
              <div className="flex flex-col gap-2">
                <h1 className="font-dm-sans font-black text-[28px] text-black">
                  Hello {userName},
                </h1>
                <p className="font-dm-sans font-normal text-[16px] text-[#717171]">
                  Monitor your business performance
                </p>
              </div>

              {/* Filter and Actions Row */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Date Filter - Left Side */}
                <div className="relative">
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="flex items-center gap-2 px-4 py-3.5 bg-white border border-[#ececf2] rounded-[10px] hover:bg-gray-50 transition-colors"
                    >
                      <Image src={dashboardAssets.calendarIcon} alt="Calendar" width={20} height={20} />
                      <span className="font-dm-sans font-semibold text-[14px] text-[#717171]">
                        {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : 'This Month'}
                      </span>
                      <Image 
                        src={dashboardAssets.arrowDownIcon} 
                        alt="Arrow" 
                        width={20} 
                        height={20} 
                        className="transform rotate-180"
                      />
                    </button>
                    
                    {showFilterDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#ececf2] rounded-lg shadow-lg z-10">
                        {[
                          { value: 'today' as DateFilter, label: 'Today' },
                          { value: 'week' as DateFilter, label: 'This Week' },
                          { value: 'month' as DateFilter, label: 'This Month' }
                        ].map((filter) => (
                          <button
                            key={filter.value}
                            onClick={() => {
                              setDateFilter(filter.value)
                              setShowFilterDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-[#e9f2f8] transition-colors text-sm first:rounded-t-lg last:rounded-b-lg ${
                              dateFilter === filter.value ? 'bg-[#e9f2f8] text-[#004aad] font-medium' : 'text-[#717171]'
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                {/* Action Buttons - Right Side */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Record Sale Button */}
                  <button
                    onClick={() => router.push('/dashboard/sales?new=1')}
                    className="flex items-center gap-1.5 px-2.5 py-3.5 bg-[#e9f2f8] rounded-[14px] hover:bg-[#004aad] transition-colors group"
                  >
                    <PlusIcon className="w-5 h-5 text-[#004aad] group-hover:text-white transition-colors" />
                    <span className="font-dm-sans font-semibold text-[14px] text-[#004aad] group-hover:text-white transition-colors">Record Sale</span>
                  </button>

                  {/* Add Product Button */}
                  <button
                    onClick={() => router.push('/dashboard/products?new=1')}
                    className="flex items-center gap-1.5 px-2.5 py-3.5 bg-[#e9f2f8] rounded-[14px] hover:bg-[#004aad] transition-colors group"
                  >
                    <PlusIcon className="w-5 h-5 text-[#004aad] group-hover:text-white transition-colors" />
                    <span className="font-dm-sans font-medium text-[14px] text-[#004aad] group-hover:text-white transition-colors">Add Product</span>
                  </button>

                  {/* Add Expense Button */}
                  <button
                    onClick={() => router.push('/dashboard/expenses?new=1')}
                    className="flex items-center gap-1.5 px-2.5 py-3.5 bg-[#e9f2f8] rounded-[14px] hover:bg-[#004aad] transition-colors group"
                  >
                    <PlusIcon className="w-5 h-5 text-[#004aad] group-hover:text-white transition-colors" />
                    <span className="font-dm-sans font-medium text-[14px] text-[#004aad] group-hover:text-white transition-colors">Add Expense</span>
                  </button>

                  {/* View Report Button */}
                  <button
                    onClick={() => router.push('/dashboard/reports')}
                    className="flex items-center gap-1.5 px-2.5 py-3.5 bg-[#e9f2f8] rounded-[14px] hover:bg-[#004aad] transition-colors group"
                  >
                    <ChartBarIcon className="w-5 h-5 text-[#004aad] group-hover:text-white transition-colors" />
                    <span className="font-dm-sans font-medium text-[14px] text-[#004aad] group-hover:text-white transition-colors">View Report</span>
                  </button>
                </div>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sales Card */}
                <div 
                  onClick={() => router.push('/dashboard/sales')}
                  className="bg-white border border-[#ececf2] rounded-[12px] p-5 cursor-pointer hover:shadow-md transition-all flex flex-col gap-6"
                >
                  <div className="bg-[#155dfc] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                    <Image src={dashboardAssets.cartIcon} alt="Cart" width={24} height={24} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-inter font-bold text-[18px] text-[#09090b]">
                      {currencySymbol} {totalSalesAmount.toLocaleString()}
                    </p>
                    <p className="font-inter font-medium text-[14px] text-[#71717a]">
                      {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "This Week's" : "This Month's"} Sales
                    </p>
                  </div>
                </div>

                {/* Expenses Card */}
                <div 
                  onClick={() => router.push('/dashboard/expenses')}
                  className="bg-white border border-[#ececf2] rounded-[12px] p-5 cursor-pointer hover:shadow-md transition-all flex flex-col gap-6"
                >
                  <div className="bg-[#e7000b] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                    <Image src={dashboardAssets.receiptIcon} alt="Receipt" width={24} height={24} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-inter font-bold text-[18px] text-[#09090b]">
                      {currencySymbol} {totalExpenses.toLocaleString()}
                    </p>
                    <p className="font-inter font-medium text-[14px] text-[#71717a]">
                      {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "This Week's" : "This Month's"} Expenses
                    </p>
                  </div>
                </div>

                {/* Profit Card */}
                <div className="bg-white border border-[#ececf2] rounded-[12px] p-5 flex flex-col gap-6">
                  <div className="bg-[#82cd7e] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                    <Image src={dashboardAssets.growthIcon} alt="Growth" width={24} height={24} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-inter font-bold text-[18px] text-[#09090b]">
                      {currencySymbol} {totalProfit.toLocaleString()}
                    </p>
                    <p className="font-inter font-medium text-[14px] text-[#71717a]">
                      {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "This Week's" : "This Month's"} Profit
                    </p>
                  </div>
                </div>

                {/* Total Products Card */}
                <div 
                  onClick={() => router.push('/dashboard/inventory')}
                  className="bg-white border border-[#ececf2] rounded-[12px] p-5 cursor-pointer hover:shadow-md transition-all flex flex-col gap-6"
                >
                  <div className="bg-[#71717a] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                    <Image src={dashboardAssets.emptyBoxIcon} alt="Products" width={24} height={24} className="brightness-0 invert" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-inter font-bold text-[18px] text-[#09090b]">
                      0
                    </p>
                    <p className="font-inter font-medium text-[14px] text-[#71717a]">
                      Total Products
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Sales and Latest Products Row */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Recent Sales */}
                <div className="lg:col-span-3 bg-white border border-[#ececf2] rounded-[12px] p-5 flex flex-col gap-10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-dm-sans font-semibold text-[18px] text-black">
                      Recent Sales
                    </h3>
                    <button 
                      onClick={() => router.push('/dashboard/sales')}
                      className="px-4 py-2 bg-white border border-[#ececf2] rounded-[8px] hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-dm-sans font-bold text-[14px] text-[#1c1d21]">View all</span>
                    </button>
                  </div>
                  
                  {/* Empty State */}
                  <div className="flex-1 border border-[#ececf2] rounded-lg flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-[50px] h-[50px] flex items-center justify-center">
                      <Image src={dashboardAssets.emptyBoxIcon} alt="No Sales" width={50} height={50} className="opacity-50" />
                    </div>
                    <p className="font-inter font-normal text-[16px] text-[#71717a]">
                      No Sales data yet
                    </p>
                  </div>
                </div>

                {/* Latest Products */}
                <div className="lg:col-span-2 bg-white border border-[#ececf2] rounded-[12px] p-5 flex flex-col gap-10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-dm-sans font-semibold text-[18px] text-black">
                      Latest Products
                    </h3>
                    <button 
                      onClick={() => router.push('/dashboard/products')}
                      className="px-4 py-2 bg-white border border-[#ececf2] rounded-[8px] hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-dm-sans font-bold text-[14px] text-[#1c1d21]">View all</span>
                    </button>
                  </div>
                  
                  {/* Empty State */}
                  <div className="flex-1 border border-[#ececf2] rounded-lg flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-[50px] h-[50px] flex items-center justify-center">
                      <Image src={dashboardAssets.emptyBoxIcon} alt="No Products" width={50} height={50} className="opacity-50" />
                    </div>
                    <p className="font-inter font-normal text-[16px] text-[#71717a]">
                      No Product added yet
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DashboardLayout>
        </StaffProtectedRoute>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <StaffProtectedRoute requiredPermission="dashboard:read">
        <DashboardLayout>
          <div className="space-y-6">
            {/* Low Stock Alert Banner */}
            {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
              <div className="bg-[#fff8f0] border border-[#ffecd9] rounded-[12px] p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <ExclamationTriangleIcon className="w-6 h-6 text-[#f97316]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-dm-sans font-semibold text-[16px] text-[#c2410c]">
                        Attention Required
                      </h3>
                      <p className="font-dm-sans font-normal text-[14px] text-[#ea580c]">
                        {lowStockProducts.length + outOfStockProducts.length} alert{(lowStockProducts.length + outOfStockProducts.length) !== 1 ? 's' : ''} need your attention
                      </p>
                      <div className="flex flex-col gap-2 mt-3">
                        {lowStockProducts.slice(0, 3).map((product) => (
                          <div key={product.id} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#f97316]"></span>
                            <span className="font-dm-sans font-medium text-[14px] text-[#1c1d21]">Low Stock Alert</span>
                            <span className="font-dm-sans font-normal text-[14px] text-[#717171]">
                              {product.name} has only {product.quantity} unit{product.quantity !== 1 ? 's' : ''} left
                            </span>
                          </div>
                        ))}
                        {outOfStockProducts.slice(0, 2).map((product) => (
                          <div key={product.id} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#dc2626]"></span>
                            <span className="font-dm-sans font-medium text-[14px] text-[#1c1d21]">Out of Stock</span>
                            <span className="font-dm-sans font-normal text-[14px] text-[#717171]">
                              {product.name} is out of stock
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/inventory')}
                    className="flex-shrink-0 px-4 py-2 bg-[#2175c7] text-white font-dm-sans font-semibold text-[14px] rounded-[8px] hover:bg-[#1a5fa3] transition-colors"
                  >
                    View All
                  </button>
                </div>
              </div>
            )}

            {/* Title Section */}
            <div className="flex flex-col gap-2">
              <h1 className="font-dm-sans font-black text-[28px] text-black">
                Hello {userName},
              </h1>
              <p className="font-dm-sans font-normal text-[16px] text-[#717171]">
                Monitor your business performance
              </p>
            </div>

            {/* Filter and Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Date Filter - Left Side */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-4 py-3.5 bg-white border border-[#ececf2] rounded-[10px] hover:bg-gray-50 transition-colors"
                >
                  <Image src={dashboardAssets.calendarIcon} alt="Calendar" width={20} height={20} />
                  <span className="font-dm-sans font-semibold text-[14px] text-[#717171]">
                    {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : 'This Month'}
                  </span>
                  <Image 
                    src={dashboardAssets.arrowDownIcon} 
                    alt="Arrow" 
                    width={20} 
                    height={20} 
                    className="transform rotate-180"
                  />
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#ececf2] rounded-lg shadow-lg z-10">
                    {[
                      { value: 'today' as DateFilter, label: 'Today' },
                      { value: 'week' as DateFilter, label: 'This Week' },
                      { value: 'month' as DateFilter, label: 'This Month' }
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => {
                          setDateFilter(filter.value)
                          setShowFilterDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-[#e9f2f8] transition-colors text-sm first:rounded-t-lg last:rounded-b-lg ${
                          dateFilter === filter.value ? 'bg-[#e9f2f8] text-[#004aad] font-medium' : 'text-[#717171]'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons - Right Side */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Record Sale Button - Blue Filled */}
                <button
                  onClick={() => router.push('/dashboard/sales?new=1')}
                  className="flex items-center gap-1.5 px-4 py-3.5 bg-[#004aad] rounded-[14px] hover:bg-[#003d8f] transition-colors"
                >
                  <PlusIcon className="w-5 h-5 text-white" />
                  <span className="font-dm-sans font-semibold text-[14px] text-white">Record Sale</span>
                </button>

                {/* Add Product Button - Outlined */}
                <button
                  onClick={() => router.push('/dashboard/products?new=1')}
                  className="flex items-center gap-1.5 px-4 py-3.5 bg-white border border-[#ececf2] rounded-[14px] hover:bg-[#e9f2f8] transition-colors"
                >
                  <PlusIcon className="w-5 h-5 text-[#004aad]" />
                  <span className="font-dm-sans font-medium text-[14px] text-[#004aad]">Add Product</span>
                </button>

                {/* Add Expense Button - Outlined */}
                <button
                  onClick={() => router.push('/dashboard/expenses?new=1')}
                  className="flex items-center gap-1.5 px-4 py-3.5 bg-white border border-[#ececf2] rounded-[14px] hover:bg-[#e9f2f8] transition-colors"
                >
                  <PlusIcon className="w-5 h-5 text-[#004aad]" />
                  <span className="font-dm-sans font-medium text-[14px] text-[#004aad]">Add Expense</span>
                </button>

                {/* View Report Button - Outlined */}
                <button
                  onClick={() => router.push('/dashboard/reports')}
                  className="flex items-center gap-1.5 px-4 py-3.5 bg-white border border-[#ececf2] rounded-[14px] hover:bg-[#e9f2f8] transition-colors"
                >
                  <ChartBarIcon className="w-5 h-5 text-[#004aad]" />
                  <span className="font-dm-sans font-medium text-[14px] text-[#004aad]">View Report</span>
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sales Card */}
              <div 
                onClick={() => router.push('/dashboard/sales')}
                className="bg-white border border-[#ececf2] rounded-[12px] p-5 cursor-pointer hover:shadow-md transition-all flex flex-col gap-6"
              >
                <div className="bg-[#155dfc] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                  <Image src={dashboardAssets.cartIcon} alt="Cart" width={24} height={24} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="font-inter font-bold text-[18px] text-[#09090b]">
                    {currencySymbol} {totalSalesAmount.toLocaleString()}
                  </p>
                  <p className="font-inter font-medium text-[14px] text-[#71717a]">
                    {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "This Week's" : "This Month's"} Sales
                  </p>
                </div>
              </div>

              {/* Expenses Card */}
              <div 
                onClick={() => router.push('/dashboard/expenses')}
                className="bg-white border border-[#ececf2] rounded-[12px] p-5 cursor-pointer hover:shadow-md transition-all flex flex-col gap-6"
              >
                <div className="bg-[#e7000b] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                  <Image src={dashboardAssets.receiptIcon} alt="Receipt" width={24} height={24} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="font-inter font-bold text-[18px] text-[#09090b]">
                    {currencySymbol} {totalExpenses.toLocaleString()}
                  </p>
                  <p className="font-inter font-medium text-[14px] text-[#71717a]">
                    {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "This Week's" : "This Month's"} Expenses
                  </p>
                </div>
              </div>

              {/* Profit Card */}
              <div className="bg-white border border-[#ececf2] rounded-[12px] p-5 flex flex-col gap-6">
                <div className="bg-[#82cd7e] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                  <Image src={dashboardAssets.growthIcon} alt="Growth" width={24} height={24} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="font-inter font-bold text-[18px] text-[#09090b]">
                    {currencySymbol} {totalProfit.toLocaleString()}
                  </p>
                  <p className="font-inter font-medium text-[14px] text-[#71717a]">
                    {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "This Week's" : "This Month's"} Profit
                  </p>
                </div>
              </div>

              {/* Total Products Card */}
              <div 
                onClick={() => router.push('/dashboard/inventory')}
                className="bg-white border border-[#ececf2] rounded-[12px] p-5 cursor-pointer hover:shadow-md transition-all flex flex-col gap-6"
              >
                <div className="bg-[#71717a] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                  <Image src={dashboardAssets.emptyBoxIcon} alt="Products" width={24} height={24} className="brightness-0 invert" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="font-inter font-bold text-[18px] text-[#09090b]">
                    {products.length}
                  </p>
                  <p className="font-inter font-medium text-[14px] text-[#71717a]">
                    Total Products
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Sales and Latest Products Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Recent Sales */}
              <div className="lg:col-span-3 bg-white border border-[#ececf2] rounded-[12px] p-5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-dm-sans font-semibold text-[18px] text-black">
                    Recent Sales
                  </h3>
                  <button 
                    onClick={() => router.push('/dashboard/sales')}
                    className="px-4 py-2 bg-white border border-[#ececf2] rounded-[8px] hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-dm-sans font-bold text-[14px] text-[#1c1d21]">View all</span>
                  </button>
                </div>
                
                {/* Sales List */}
                {allSales.length === 0 ? (
                  <div className="flex-1 border border-[#ececf2] rounded-lg flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-[50px] h-[50px] flex items-center justify-center">
                      <Image src={dashboardAssets.emptyBoxIcon} alt="No Sales" width={50} height={50} className="opacity-50" />
                    </div>
                    <p className="font-inter font-normal text-[16px] text-[#71717a]">
                      No Sales data yet
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {allSales.slice(0, 5).map((sale) => {
                      const saleDate = new Date(sale.timestamp)
                      const shortId = sale.id?.slice(0, 5) || 'N/A'
                      const productName = sale.displayName || sale.productName || 'Unknown Product'
                      const itemCount = sale.itemCount || sale.quantitySold || 1
                      
                      return (
                        <div 
                          key={sale.id} 
                          onClick={() => router.push(`/dashboard/sales/${sale.id}`)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border border-[#ececf2] rounded-[12px] transition-all"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-dm-sans font-semibold text-[14px] text-[#004aad]">
                                Sale #{shortId}
                              </span>
                              <span className="font-dm-sans font-medium text-[14px] text-black">
                                - {productName}
                              </span>
                              <span className="font-dm-sans font-normal text-[14px] text-[#717171]">
                                {itemCount} item{itemCount > 1 ? 's' : ''}
                              </span>
                            </div>
                            <span className="font-dm-sans font-normal text-[12px] text-[#717171]">
                              {saleDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} • {saleDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-dm-sans font-semibold text-[14px] text-[#22c55e]">
                              {currencySymbol} {(sale.totalAmount || 0).toLocaleString()}
                            </span>
                            <span className="font-dm-sans font-normal text-[12px] text-[#717171]">
                              {typeof sale.paymentMethod === 'object' 
                                ? (sale.paymentMethod as any)?.name || (sale.paymentMethod as any)?.displayName || 'Cash'
                                : sale.paymentMethod || 'Cash'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Latest Products */}
              <div className="lg:col-span-2 bg-white border border-[#ececf2] rounded-[12px] p-5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-dm-sans font-semibold text-[18px] text-black">
                    Latest Products
                  </h3>
                  <button 
                    onClick={() => router.push('/dashboard/products')}
                    className="px-4 py-2 bg-white border border-[#ececf2] rounded-[8px] hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-dm-sans font-bold text-[14px] text-[#1c1d21]">View all</span>
                  </button>
                </div>
                
                {/* Products List */}
                {products.length === 0 ? (
                  <div className="flex-1 border border-[#ececf2] rounded-lg flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-[50px] h-[50px] flex items-center justify-center">
                      <Image src={dashboardAssets.emptyBoxIcon} alt="No Products" width={50} height={50} className="opacity-50" />
                    </div>
                    <p className="font-inter font-normal text-[16px] text-[#71717a]">
                      No Product added yet
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-[#ececf2]">
                    {products.slice(0, 5).map((product) => {
                      const shortSku = product.sku || product.id?.slice(0, 8).toUpperCase() || 'N/A'
                      const stockColor = product.quantity <= (product.minStockLevel || 5) ? 'text-[#e7000b]' : 'text-[#22c55e]'
                      
                      return (
                        <div 
                          key={product.id} 
                          onClick={() => router.push(`/dashboard/products/${product.id}`)}
                          className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-dm-sans font-semibold text-[14px] text-black">
                              {product.name}
                            </span>
                            <span className="font-dm-sans font-normal text-[12px] text-[#717171]">
                              {product.category || 'Uncategorized'}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`font-dm-sans font-semibold text-[12px] ${stockColor}`}>
                              Stock: {product.quantity} pcs
                            </span>
                            <span className="font-dm-sans font-normal text-[12px] text-[#717171]">
                              SKU: {shortSku}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DashboardLayout>
      </StaffProtectedRoute>
    </ProtectedRoute>
  )
}
