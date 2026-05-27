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
import { useBranch } from '@/contexts/BranchContext'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import type { Product as FPProduct } from '@/lib/firestore'
import type { SaleItem } from '@/lib/multi-item-sales-types'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import { useDashboardDataQuery } from '@/hooks/useBusinessQueries'

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

function getProductImageUrl(product: Pick<FPProduct, 'images' | 'imageUrl'>) {
  return product.images?.find(image => image.isPrimary)?.url || product.images?.[0]?.url || product.imageUrl || null
}

type DateFilter = 'today' | 'week' | 'month'

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="dashboard-skeleton h-8 w-56 rounded-[10px]" />
        <div className="dashboard-skeleton h-5 w-72 max-w-full rounded-[8px]" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="dashboard-skeleton h-12 w-36 rounded-[12px]" />
        <div className="flex flex-wrap gap-3">
          <div className="dashboard-skeleton h-12 w-32 rounded-[14px]" />
          <div className="dashboard-skeleton h-12 w-32 rounded-[14px]" />
          <div className="dashboard-skeleton h-12 w-32 rounded-[14px]" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="dashboard-card flex min-h-[168px] flex-col justify-between gap-6 p-5">
            <div className="dashboard-skeleton h-[52px] w-[100px] rounded-[12px]" />
            <div className="space-y-2">
              <div className="dashboard-skeleton h-7 w-32 rounded-[8px]" />
              <div className="dashboard-skeleton h-4 w-28 rounded-[8px]" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="dashboard-panel p-5 lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <div className="dashboard-skeleton h-6 w-32 rounded-[8px]" />
            <div className="dashboard-skeleton h-9 w-20 rounded-[8px]" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="dashboard-skeleton h-16 rounded-[12px]" />
            ))}
          </div>
        </div>
        <div className="dashboard-panel p-5 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div className="dashboard-skeleton h-6 w-36 rounded-[8px]" />
            <div className="dashboard-skeleton h-9 w-20 rounded-[8px]" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="dashboard-skeleton h-14 rounded-[12px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { staff } = useStaff()
  const { selectedBranchId } = useBranch()
  const router = useRouter()
  const { currency } = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Determine the effective user ID for data loading
  const effectiveUserId = staff ? staff.userId : user?.uid
  const { data: dashboardData, isLoading } = useDashboardDataQuery({ userId: effectiveUserId, branchId: selectedBranchId })
  const products = dashboardData?.products || []
  const sales = dashboardData?.sales || []
  const multiItemSales = dashboardData?.multiItemSales || []
  const expenses = dashboardData?.expenses || []

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
      quantitySold: sale.items?.reduce((sum: number, item: SaleItem) => sum + (item.quantity || 0), 0) || 0
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

  if (isLoading && !dashboardData) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <DashboardSkeleton />
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
            <div className="space-y-6 font-dm-sans">
              {/* Title Section */}
              <div className="flex flex-col gap-2">
                <h1 className="font-dm-sans text-[28px] font-semibold tracking-[-0.02em] text-[#0f172a]">
                  Hello {userName},
                </h1>
                <p className="font-dm-sans text-[15px] font-medium text-[#64748b]">
                  Monitor your business performance
                </p>
              </div>

              {/* Filter and Actions Row */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Date Filter - Left Side */}
                <div className="relative">
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="flex items-center gap-2 px-4 py-3.5 bg-white border border-[#e6ebf2] rounded-[12px] text-[#64748b] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#d7e0ec] hover:bg-[#f8fafc] hover:text-[#0f172a] transition-all"
                    >
                      <Image src={dashboardAssets.calendarIcon} alt="Calendar" width={20} height={20} />
                      <span className="font-dm-sans font-semibold text-[14px]">
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
                    className="flex items-center gap-1.5 px-3.5 py-3.5 bg-[#004aad] rounded-[14px] active:scale-[0.98] transition-transform"
                  >
                    <span className="font-dm-sans font-semibold text-[14px] text-white">Fahampesa POS</span>
                  </button>

                  {/* Add Product Button */}
                  <button
                    onClick={() => router.push('/dashboard/products?new=1')}
                    className="flex items-center gap-1.5 px-3.5 py-3.5 bg-[#e9f2f8] rounded-[14px] hover:bg-[#004aad] active:scale-[0.98] transition-all group"
                  >
                    <PlusIcon className="w-5 h-5 text-[#004aad] group-hover:text-white transition-colors" />
                    <span className="font-dm-sans font-medium text-[14px] text-[#004aad] group-hover:text-white transition-colors">Add Product</span>
                  </button>

                  {/* Add Expense Button */}
                  <button
                    onClick={() => router.push('/dashboard/expenses?new=1')}
                    className="flex items-center gap-1.5 px-3.5 py-3.5 bg-[#e9f2f8] rounded-[14px] hover:bg-[#004aad] active:scale-[0.98] transition-all group"
                  >
                    <PlusIcon className="w-5 h-5 text-[#004aad] group-hover:text-white transition-colors" />
                    <span className="font-dm-sans font-medium text-[14px] text-[#004aad] group-hover:text-white transition-colors">Add Expense</span>
                  </button>

                  {/* View Report Button */}
                  <button
                    onClick={() => router.push('/dashboard/reports')}
                    className="flex items-center gap-1.5 px-3.5 py-3.5 bg-[#e9f2f8] rounded-[14px] hover:bg-[#004aad] active:scale-[0.98] transition-all group"
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
                  className="dashboard-card flex min-h-[168px] cursor-pointer flex-col justify-between gap-6 p-5"
                >
                  <div className="bg-[#155dfc] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                    <Image src={dashboardAssets.cartIcon} alt="Cart" width={24} height={24} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="dashboard-metric-value font-dm-sans text-[22px] font-semibold tracking-[-0.01em] text-[#0f172a]">
                      {currencySymbol} {totalSalesAmount.toLocaleString()}
                    </p>
                    <p className="font-dm-sans text-[13px] font-medium text-[#64748b]">
                      {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "This Week's" : "This Month's"} Sales
                    </p>
                  </div>
                </div>

                {/* Expenses Card */}
                <div
                  onClick={() => router.push('/dashboard/expenses')}
                  className="dashboard-card flex min-h-[168px] cursor-pointer flex-col justify-between gap-6 p-5"
                >
                  <div className="bg-[#e7000b] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                    <Image src={dashboardAssets.receiptIcon} alt="Receipt" width={24} height={24} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="dashboard-metric-value font-dm-sans text-[22px] font-semibold tracking-[-0.01em] text-[#0f172a]">
                      {currencySymbol} {totalExpenses.toLocaleString()}
                    </p>
                    <p className="font-dm-sans text-[13px] font-medium text-[#64748b]">
                      {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "This Week's" : "This Month's"} Expenses
                    </p>
                  </div>
                </div>

                {/* Profit Card */}
                <div className="dashboard-card flex min-h-[168px] flex-col justify-between gap-6 p-5">
                  <div className="bg-[#82cd7e] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                    <Image src={dashboardAssets.growthIcon} alt="Growth" width={24} height={24} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="dashboard-metric-value font-dm-sans text-[22px] font-semibold tracking-[-0.01em] text-[#0f172a]">
                      {currencySymbol} {totalProfit.toLocaleString()}
                    </p>
                    <p className="font-dm-sans text-[13px] font-medium text-[#64748b]">
                      {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "This Week's" : "This Month's"} Profit
                    </p>
                  </div>
                </div>

                {/* Total Products Card */}
                <div
                  onClick={() => router.push('/dashboard/inventory')}
                  className="dashboard-card flex min-h-[168px] cursor-pointer flex-col justify-between gap-6 p-5"
                >
                  <div className="bg-[#71717a] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                    <Image src={dashboardAssets.emptyBoxIcon} alt="Products" width={24} height={24} className="brightness-0 invert" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="dashboard-metric-value font-dm-sans text-[22px] font-semibold tracking-[-0.01em] text-[#0f172a]">
                      0
                    </p>
                    <p className="font-dm-sans text-[13px] font-medium text-[#64748b]">
                      Total Products
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Sales and Latest Products Row */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Recent Sales */}
                <div className="dashboard-panel lg:col-span-3 p-5 flex flex-col gap-7">
                  <div className="flex items-center justify-between">
                    <h3 className="font-dm-sans font-semibold text-[18px] tracking-[-0.01em] text-[#0f172a]">
                      Recent Sales
                    </h3>
                    <button
                      onClick={() => router.push('/dashboard/sales')}
                      className="px-4 py-2 bg-white border border-[#e6ebf2] rounded-[10px] text-[#334155] hover:bg-[#f8fafc] hover:text-[#004aad] transition-colors"
                    >
                      <span className="font-dm-sans font-semibold text-[14px]">View all</span>
                    </button>
                  </div>

                  {/* Empty State */}
                  <div className="flex-1 border border-dashed border-[#dbe3ee] rounded-[14px] bg-[#f8fafc] flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-[50px] h-[50px] flex items-center justify-center">
                      <Image src={dashboardAssets.emptyBoxIcon} alt="No Sales" width={50} height={50} className="opacity-50" />
                    </div>
                    <p className="font-inter font-normal text-[16px] text-[#71717a]">
                      No Sales data yet
                    </p>
                  </div>
                </div>

                {/* Latest Products */}
                <div className="dashboard-panel lg:col-span-2 p-5 flex flex-col gap-7">
                  <div className="flex items-center justify-between">
                    <h3 className="font-dm-sans font-semibold text-[18px] tracking-[-0.01em] text-[#0f172a]">
                      Latest Products
                    </h3>
                    <button
                      onClick={() => router.push('/dashboard/products')}
                      className="px-4 py-2 bg-white border border-[#e6ebf2] rounded-[10px] text-[#334155] hover:bg-[#f8fafc] hover:text-[#004aad] transition-colors"
                    >
                      <span className="font-dm-sans font-semibold text-[14px]">View all</span>
                    </button>
                  </div>

                  {/* Empty State */}
                  <div className="flex-1 border border-dashed border-[#dbe3ee] rounded-[14px] bg-[#f8fafc] flex flex-col items-center justify-center py-20 gap-4">
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
          <div className="space-y-6 font-dm-sans">
            {/* Low Stock Alert Banner */}
            {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
              <div className="border border-[#fed7aa] bg-[#fff7ed] rounded-[16px] p-4 shadow-[0_1px_2px_rgba(154,52,18,0.05)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <ExclamationTriangleIcon className="w-6 h-6 text-[#f97316]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-dm-sans font-semibold text-[16px] text-[#9a3412]">
                        Attention Required
                      </h3>
                      <p className="font-dm-sans text-[14px] font-medium text-[#c2410c]">
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
                    className="flex-shrink-0 px-4 py-2 bg-[#2175c7] text-white font-dm-sans font-semibold text-[14px] rounded-[10px] hover:bg-[#1a5fa3] active:scale-[0.98] transition-all"
                  >
                    View All
                  </button>
                </div>
              </div>
            )}

            {/* Title Section */}
            <div className="flex flex-col gap-2">
              <h1 className="font-dm-sans text-[28px] font-semibold tracking-[-0.02em] text-[#0f172a]">
                Hello {userName},
              </h1>
              <p className="font-dm-sans text-[15px] font-medium text-[#64748b]">
                Monitor your business performance
              </p>
            </div>

            {/* Filter and Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Date Filter - Left Side */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-4 py-3.5 bg-white border border-[#e6ebf2] rounded-[12px] text-[#64748b] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#d7e0ec] hover:bg-[#f8fafc] hover:text-[#0f172a] transition-all"
                >
                  <Image src={dashboardAssets.calendarIcon} alt="Calendar" width={20} height={20} />
                  <span className="font-dm-sans font-semibold text-[14px]">
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
                  className="flex items-center gap-1.5 px-4 py-3.5 bg-[#004aad] rounded-[14px] hover:bg-[#003d8f] active:scale-[0.98] transition-all shadow-[0_10px_22px_rgba(0,74,173,0.18)]"
                >
                  <span className="font-dm-sans font-semibold text-[14px] text-white">Fahampesa POS</span>
                </button>

                {/* Add Product Button - Outlined */}
                <button
                  onClick={() => router.push('/dashboard/products?new=1')}
                  className="flex items-center gap-1.5 px-4 py-3.5 bg-white border border-[#e6ebf2] rounded-[14px] hover:bg-[#e9f2f8] active:scale-[0.98] transition-all"
                >
                  <PlusIcon className="w-5 h-5 text-[#004aad]" />
                  <span className="font-dm-sans font-medium text-[14px] text-[#004aad]">Add Product</span>
                </button>

                {/* Add Expense Button - Outlined */}
                <button
                  onClick={() => router.push('/dashboard/expenses?new=1')}
                  className="flex items-center gap-1.5 px-4 py-3.5 bg-white border border-[#e6ebf2] rounded-[14px] hover:bg-[#e9f2f8] active:scale-[0.98] transition-all"
                >
                  <PlusIcon className="w-5 h-5 text-[#004aad]" />
                  <span className="font-dm-sans font-medium text-[14px] text-[#004aad]">Add Expense</span>
                </button>

                {/* View Report Button - Outlined */}
                <button
                  onClick={() => router.push('/dashboard/reports')}
                  className="flex items-center gap-1.5 px-4 py-3.5 bg-white border border-[#e6ebf2] rounded-[14px] hover:bg-[#e9f2f8] active:scale-[0.98] transition-all"
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
                className="dashboard-card flex min-h-[168px] cursor-pointer flex-col justify-between gap-6 p-5"
              >
                <div className="bg-[#155dfc] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                  <Image src={dashboardAssets.cartIcon} alt="Cart" width={24} height={24} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="dashboard-metric-value font-dm-sans text-[22px] font-semibold tracking-[-0.01em] text-[#0f172a]">
                    {currencySymbol} {totalSalesAmount.toLocaleString()}
                  </p>
                  <p className="font-dm-sans text-[13px] font-medium text-[#64748b]">
                    {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "This Week's" : "This Month's"} Sales
                  </p>
                </div>
              </div>

              {/* Expenses Card */}
              <div
                onClick={() => router.push('/dashboard/expenses')}
                className="dashboard-card flex min-h-[168px] cursor-pointer flex-col justify-between gap-6 p-5"
              >
                <div className="bg-[#e7000b] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                  <Image src={dashboardAssets.receiptIcon} alt="Receipt" width={24} height={24} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="dashboard-metric-value font-dm-sans text-[22px] font-semibold tracking-[-0.01em] text-[#0f172a]">
                    {currencySymbol} {totalExpenses.toLocaleString()}
                  </p>
                  <p className="font-dm-sans text-[13px] font-medium text-[#64748b]">
                    {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "This Week's" : "This Month's"} Expenses
                  </p>
                </div>
              </div>

              {/* Profit Card */}
              <div className="dashboard-card flex min-h-[168px] flex-col justify-between gap-6 p-5">
                <div className="bg-[#82cd7e] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                  <Image src={dashboardAssets.growthIcon} alt="Growth" width={24} height={24} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="dashboard-metric-value font-dm-sans text-[22px] font-semibold tracking-[-0.01em] text-[#0f172a]">
                    {currencySymbol} {totalProfit.toLocaleString()}
                  </p>
                  <p className="font-dm-sans text-[13px] font-medium text-[#64748b]">
                    {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "This Week's" : "This Month's"} Profit
                  </p>
                </div>
              </div>

              {/* Total Products Card */}
              <div
                onClick={() => router.push('/dashboard/inventory')}
                className="dashboard-card flex min-h-[168px] cursor-pointer flex-col justify-between gap-6 p-5"
              >
                <div className="bg-[#71717a] w-[100px] h-[52px] rounded-[12px] flex items-center justify-center">
                  <Image src={dashboardAssets.emptyBoxIcon} alt="Products" width={24} height={24} className="brightness-0 invert" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="dashboard-metric-value font-dm-sans text-[22px] font-semibold tracking-[-0.01em] text-[#0f172a]">
                    {products.length}
                  </p>
                  <p className="font-dm-sans text-[13px] font-medium text-[#64748b]">
                    Total Products
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Sales and Latest Products Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Recent Sales */}
              <div className="dashboard-panel lg:col-span-3 p-5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-dm-sans font-semibold text-[18px] tracking-[-0.01em] text-[#0f172a]">
                    Recent Sales
                  </h3>
                  <button
                    onClick={() => router.push('/dashboard/sales')}
                    className="px-4 py-2 bg-white border border-[#e6ebf2] rounded-[10px] text-[#334155] hover:bg-[#f8fafc] hover:text-[#004aad] transition-colors"
                  >
                    <span className="font-dm-sans font-semibold text-[14px]">View all</span>
                  </button>
                </div>

                {/* Sales List */}
                {allSales.length === 0 ? (
                  <div className="flex-1 border border-dashed border-[#dbe3ee] rounded-[14px] bg-[#f8fafc] flex flex-col items-center justify-center py-20 gap-4">
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
                          className="flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-[#f8fafc] border border-[#e6ebf2] rounded-[14px] transition-all"
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
                            <span className="font-dm-sans text-[12px] font-medium text-[#64748b]">
                              {saleDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} • {saleDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="dashboard-tabular font-dm-sans font-semibold text-[14px] text-[#16a34a]">
                              {currencySymbol} {(sale.totalAmount || 0).toLocaleString()}
                            </span>
                            <span className="font-dm-sans text-[12px] font-medium text-[#64748b]">
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
              <div className="dashboard-panel lg:col-span-2 p-5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-dm-sans font-semibold text-[18px] tracking-[-0.01em] text-[#0f172a]">
                    Latest Products
                  </h3>
                  <button
                    onClick={() => router.push('/dashboard/products')}
                    className="px-4 py-2 bg-white border border-[#e6ebf2] rounded-[10px] text-[#334155] hover:bg-[#f8fafc] hover:text-[#004aad] transition-colors"
                  >
                    <span className="font-dm-sans font-semibold text-[14px]">View all</span>
                  </button>
                </div>

                {/* Products List */}
                {products.length === 0 ? (
                  <div className="flex-1 border border-dashed border-[#dbe3ee] rounded-[14px] bg-[#f8fafc] flex flex-col items-center justify-center py-20 gap-4">
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
                      const primaryImageUrl = getProductImageUrl(product)

                      return (
                        <div
                          key={product.id}
                          onClick={() => router.push(`/dashboard/products/${product.id}`)}
                          className="flex items-center justify-between gap-3 py-4 cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[#e6ebf2] bg-[#f8fafc]">
                              {primaryImageUrl ? (
                                <Image
                                  src={primaryImageUrl}
                                  alt={product.name}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              ) : (
                                <span className="font-dm-sans text-[18px] font-semibold text-[#94a3b8]">
                                  {product.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex min-w-0 flex-col gap-1">
                              <span className="truncate font-dm-sans font-semibold text-[14px] text-black">
                                {product.name}
                              </span>
                              <span className="truncate font-dm-sans font-normal text-[12px] text-[#717171]">
                                {product.category || 'Uncategorized'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-shrink-0 flex-col items-end gap-1">
                            <span className={`font-dm-sans font-semibold text-[12px] ${stockColor}`}>
                              Stock: {product.quantity} {product.unitOfMeasure || 'pcs'}
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
