'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  BuildingOffice2Icon,
  TagIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { useBranch } from '@/contexts/BranchContext'
import { useEffect, useMemo, useState } from 'react'
import {
  DailySummary,
  getDailySummaries,
  getSales,
  Sale,
  getProducts,
  Product,
  getStaff,
  Staff,
  getDebtors,
  Debtor,
  getMultiItemSales
} from '@/lib/firestore'
import { MultiItemSale } from '@/lib/multi-item-sales-types'
import { getBranches } from '@/lib/branches-service'
import { Branch } from '@/lib/branches-types'
import {
  getBackendBranchPerformanceReport,
  getBackendDashboardReport,
  getBackendExpensesReport,
  getBackendInventoryValuationReport,
  getBackendLowStockReport,
  getBackendSalesReport,
  getBackendSuppliersReport,
  isBackendAvailable
} from '@/lib/backend-business-api'
import { PlanGate } from '@/components/PlanGate'
import dynamic from 'next/dynamic'

// Dynamically import chart components to avoid SSR issues
const Line = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Line),
  {
    ssr: false,
    loading: () => <div className="h-[200px] flex items-center justify-center"><span className="text-gray-400">Loading chart...</span></div>
  }
)

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components - only on client side
if (typeof window !== 'undefined') {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
  )
}

type ReportPeriod = 'Last 7 Days' | 'Last 30 Days' | 'Last 90 Days' | 'Custom'

type BackendDashboardReport = {
  salesCount?: number
  totalSales?: number
  totalProfit?: number
  totalExpenses?: number
  inventoryValue?: number
  supplierBalance?: number
}

type BackendBranchPerformance = {
  branchId: string
  branchName?: string
  salesCount?: number
  totalSales?: number
  totalProfit?: number
  totalExpenses?: number
  inventoryValue?: number
  supplierBalance?: number
}

function periodToDays(period: ReportPeriod) {
  if (period === 'Last 7 Days') return 7
  if (period === 'Last 30 Days') return 30
  if (period === 'Last 90 Days') return 90
  return 30
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

// File Export Icon Component (matching Figma design)
function FileExportIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M11.6667 1.66669H5.00004C4.55801 1.66669 4.13409 1.84228 3.82153 2.15484C3.50897 2.4674 3.33337 2.89133 3.33337 3.33335V16.6667C3.33337 17.1087 3.50897 17.5326 3.82153 17.8452C4.13409 18.1578 4.55801 18.3334 5.00004 18.3334H15C15.4421 18.3334 15.866 18.1578 16.1786 17.8452C16.4911 17.5326 16.6667 17.1087 16.6667 16.6667V6.66669L11.6667 1.66669Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.6666 1.66669V6.66669H16.6666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 10V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 12.5L10 10L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Stat Card Component
interface StatCardProps {
  title: string
  value: string
  trend?: 'up' | 'down' | null
  trendColor?: 'blue' | 'green' | 'red'
}

function StatCard({ title, value, trend, trendColor = 'green' }: StatCardProps) {
  const colors = {
    blue: { stroke: '#004aad', bg: '#E9F2F8' },
    green: { stroke: '#10B981', bg: '#D1FAE5' },
    red: { stroke: '#F97066', bg: '#FEE2E2' }
  }
  const { stroke, bg } = colors[trendColor]

  return (
    <div className="dashboard-card flex min-h-[142px] flex-col gap-4 px-4 py-5">
      <span className="text-[13px] font-medium text-[#64748b]">{title}</span>
      <div className="flex items-end justify-between">
        <span className="dashboard-metric-value text-2xl font-semibold tracking-[-0.02em] text-[#0f172a]">{value}</span>
        {trend && (
          <svg width="50" height="36" viewBox="0 0 50 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="50" height="36" rx="10" fill={bg}/>
            {trend === 'up' ? (
              <path d="M21.4375 16.4242L21.9928 15.9201L21.457 15.33L20.9006 15.9006L21.4375 16.4242ZM26.5 22L25.9447 22.5042L26.4912 23.106L27.0472 22.513L26.5 22ZM34.7496 13.9758C34.7363 13.5618 34.3898 13.237 33.9758 13.2504L27.2293 13.468C26.8153 13.4814 26.4905 13.8278 26.5039 14.2418C26.5173 14.6558 26.8637 14.9806 27.2777 14.9672L33.2746 14.7738L33.468 20.7707C33.4814 21.1847 33.8278 21.5095 34.2418 21.4961C34.6558 21.4827 34.9806 21.1363 34.9672 20.7223L34.7496 13.9758ZM16 22L16.5369 22.5236L21.9744 16.9479L21.4375 16.4242L20.9006 15.9006L15.4631 21.4764L16 22ZM21.4375 16.4242L20.8822 16.9284L25.9447 22.5042L26.5 22L27.0553 21.4958L21.9928 15.9201L21.4375 16.4242ZM26.5 22L27.0472 22.513L34.5472 14.513L34 14L33.4528 13.487L25.9528 21.487L26.5 22Z" fill={stroke}/>
            ) : (
              <path d="M21.4375 19.5758L21.9928 20.0799L21.457 20.67L20.9006 20.0994L21.4375 19.5758ZM26.5 14L25.9447 13.4958L26.4912 12.894L27.0472 13.487L26.5 14ZM34.7496 22.0242C34.7363 22.4382 34.3898 22.763 33.9758 22.7496L27.2293 22.532C26.8153 22.5186 26.4905 22.1722 26.5039 21.7582C26.5173 21.3442 26.8637 21.0194 27.2777 21.0328L33.2746 21.2262L33.468 15.2293C33.4814 14.8153 33.8278 14.4905 34.2418 14.5039C34.6558 14.5173 34.9806 14.8637 34.9672 15.2777L34.7496 22.0242ZM16 14L16.5369 13.4764L21.9744 19.0521L21.4375 19.5758L20.9006 20.0994L15.4631 14.5236L16 14ZM21.4375 19.5758L20.8822 19.0716L25.9447 13.4958L26.5 14L27.0553 14.5042L21.9928 20.0799L21.4375 19.5758ZM26.5 14L27.0472 13.487L34.5472 21.487L34 22L33.4528 22.513L25.9528 14.513L26.5 14Z" fill={stroke}/>
            )}
          </svg>
        )}
      </div>
    </div>
  )
}

// Payment Method Progress Bar Component
interface PaymentMethodRowProps {
  label: string
  percentage: number
}

function PaymentMethodRow({ label, percentage }: PaymentMethodRowProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <span className="text-[#525252] text-xs font-normal min-w-[80px]">{label}</span>
      <div className="bg-[#e9f2f8] h-1 w-[100px] rounded-sm">
        <div
          className="bg-[#004aad] h-1 rounded-sm transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Medal/Award Icon for Product Rankings (Badge)
function PlaceBadge({ place }: { place: 1 | 2 | 3 }) {
  const colors = {
    1: { from: '#fac200', to: '#f4b800' },
    2: { from: '#7a8291', to: '#9098a6' },
    3: { from: '#da6a00', to: '#c25400' }
  }

  return (
    <div
      className="w-9 h-9 rounded-[18px] flex items-center justify-center text-white text-sm font-semibold shrink-0"
      style={{ background: `linear-gradient(to bottom, ${colors[place].from}, ${colors[place].to})` }}
    >
      {place}
    </div>
  )
}

// Medal icon for category display
function MedalIcon() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="6" r="5" fill="#FFD700" stroke="#DAA520" strokeWidth="1"/>
      <circle cx="6" cy="6" r="3" fill="#FFA500"/>
      <path d="M4 10L6 16L8 10" fill="#FF6B6B"/>
      <path d="M3 10L5 15L6 12" fill="#4169E1"/>
    </svg>
  )
}

// Branch/Staff Icon
function BranchIcon() {
  return (
    <div className="bg-[#e9f2f8] w-[30px] h-[30px] rounded-lg flex items-center justify-center">
      <BuildingOffice2Icon className="w-[18px] h-[18px] text-[#004aad]" />
    </div>
  )
}

export default function ReportsPage() {
  const { user } = useAuth()
  const { staff } = useStaff()
  const { selectedBranchId } = useBranch()
  const currency = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [multiItemSales, setMultiItemSales] = useState<MultiItemSale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [backendDashboardReport, setBackendDashboardReport] = useState<BackendDashboardReport | null>(null)
  const [backendBranchPerformanceReport, setBackendBranchPerformanceReport] = useState<BackendBranchPerformance[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('Last 7 Days')
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Determine the effective user ID for data loading
  const effectiveUserId = staff ? staff.userId : user?.uid
  const activeBranchId = selectedBranchId || undefined

  useEffect(() => {
    const load = async () => {
      if (!effectiveUserId) return
      setLoading(true)
      setSummaries([])
      setRecentSales([])
      setMultiItemSales([])
      setProducts([])
      setDebtors([])
      try {
        const [s, rs, mis, prods, br, st, dbt] = await Promise.all([
          getDailySummaries(effectiveUserId, 90),
          getSales(effectiveUserId, 2000, activeBranchId),
          getMultiItemSales(effectiveUserId, 2000, activeBranchId),
          getProducts(effectiveUserId, activeBranchId),
          getBranches(effectiveUserId),
          getStaff(effectiveUserId),
          getDebtors(effectiveUserId, activeBranchId)
        ])
        console.log('Reports fetch - Summaries:', s.length, 'Sales:', rs.length, 'Multi-item Sales:', mis.length, 'Products:', prods.length)
        setSummaries(s)
        setRecentSales(rs)
        setMultiItemSales(mis)
        setProducts(prods)
        setBranches(br)
        setStaffList(st)
        setDebtors(dbt)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [effectiveUserId, activeBranchId])

  useEffect(() => {
    const loadBackendReports = async () => {
      if (!effectiveUserId || !isBackendAvailable()) return

      setBackendDashboardReport(null)
      setBackendBranchPerformanceReport([])

      const days = periodToDays(selectedPeriod)
      const params: Record<string, string> = {
        from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      }

      if (activeBranchId) {
        params.branchId = activeBranchId
      }

      const [
        dashboardResult,
        branchResult,
        salesResult,
        inventoryValuationResult,
        lowStockResult,
        suppliersResult,
        expensesResult
      ] = await Promise.allSettled([
        getBackendDashboardReport(params),
        getBackendBranchPerformanceReport(params),
        getBackendSalesReport(params),
        getBackendInventoryValuationReport(params),
        getBackendLowStockReport(params),
        getBackendSuppliersReport(params),
        getBackendExpensesReport(params)
      ])

      if (dashboardResult.status === 'fulfilled') {
        setBackendDashboardReport(dashboardResult.value as BackendDashboardReport)
      } else {
        setBackendDashboardReport(null)
        console.warn('Backend dashboard report unavailable:', dashboardResult.reason)
      }

      if (branchResult.status === 'fulfilled' && Array.isArray(branchResult.value)) {
        setBackendBranchPerformanceReport(branchResult.value as BackendBranchPerformance[])
      } else {
        setBackendBranchPerformanceReport([])
        if (branchResult.status === 'rejected') {
          console.warn('Backend branch performance report unavailable:', branchResult.reason)
        }
      }

      for (const [name, result] of [
        ['sales', salesResult],
        ['inventory valuation', inventoryValuationResult],
        ['low stock', lowStockResult],
        ['suppliers', suppliersResult],
        ['expenses', expensesResult]
      ] as const) {
        if (result.status === 'rejected') {
          console.warn(`Backend ${name} report unavailable:`, result.reason)
        }
      }
    }

    loadBackendReports()
  }, [effectiveUserId, selectedPeriod, activeBranchId])

  // Combine single-item and multi-item sales for calculations
  const allSalesData = useMemo(() => {
    // Convert single-item sales to a common format
    const singleSales = recentSales.map(sale => ({
      id: sale.id,
      timestamp: sale.timestamp || 0,
      totalAmount: sale.totalAmount || 0,
      costPrice: (sale.costPrice || 0) * (sale.quantitySold || 1),
      quantitySold: sale.quantitySold || 1,
      paymentMethod: sale.paymentMethod || 'CASH',
      productName: sale.productName,
      productId: sale.productId
    }))

    // Convert multi-item sales to a common format
    const multiSales = multiItemSales.map(sale => {
      const totalCost = sale.items?.reduce((sum, item) => sum + ((item.costPrice || 0) * (item.quantity || 0)), 0) || 0
      const totalQty = sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
      const paymentMethodId = typeof sale.paymentMethod === 'string'
        ? sale.paymentMethod
        : sale.paymentMethod?.id || 'CASH'

      return {
        id: sale.id,
        timestamp: sale.timestamp || 0,
        totalAmount: sale.totalAmount || 0,
        costPrice: totalCost,
        quantitySold: totalQty,
        paymentMethod: paymentMethodId,
        productName: sale.items?.[0]?.productName || 'Multi-item Sale',
        productId: sale.items?.[0]?.productId,
        items: sale.items
      }
    })

    return [...singleSales, ...multiSales].sort((a, b) => b.timestamp - a.timestamp)
  }, [recentSales, multiItemSales])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPeriodDropdown) {
        const target = event.target as Element
        if (!target.closest('.period-dropdown')) {
          setShowPeriodDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPeriodDropdown])

  // Calculate metrics from actual data (combined single and multi-item sales)
  const metrics = useMemo(() => {
    const totalDebt = debtors.reduce((sum, debtor) => sum + (debtor.currentDebt || 0), 0)

    if (backendDashboardReport) {
      return {
        totalSales: Number(backendDashboardReport.totalSales || 0),
        totalProfit: Number(backendDashboardReport.totalProfit || 0),
        totalTransactions: Number(backendDashboardReport.salesCount || 0),
        debt: totalDebt
      }
    }

    // Filter sales based on selected period
    const now = Date.now()
    const periodDays = periodToDays(selectedPeriod)
    const periodStart = now - (periodDays * 24 * 60 * 60 * 1000)

    // Use combined sales data
    const filteredSales = allSalesData.filter(sale => (sale.timestamp || 0) >= periodStart)

    console.log('Metrics calculation - Period:', selectedPeriod, 'Days:', periodDays, 'Filtered sales:', filteredSales.length, 'Total all sales:', allSalesData.length)

    const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
    const totalProfit = filteredSales.reduce((sum, sale) => {
      const cost = Number(sale.costPrice || 0)
      const revenue = Number(sale.totalAmount || 0)
      return sum + Math.max(0, revenue - cost)
    }, 0)
    const totalTransactions = filteredSales.length

    return {
      totalSales,
      totalProfit,
      totalTransactions,
      debt: totalDebt
    }
  }, [allSalesData, backendDashboardReport, debtors, selectedPeriod])

  // Generate trend data for Sales vs Profit chart from actual sales data
  const trendData = useMemo(() => {
    const periodDays = selectedPeriod === 'Last 7 Days' ? 7 :
                       selectedPeriod === 'Last 30 Days' ? 30 :
                       selectedPeriod === 'Last 90 Days' ? 90 : 7

    const now = Date.now()
    const periodStart = now - (periodDays * 24 * 60 * 60 * 1000)

    // Filter sales data to selected period
    const filteredSales = allSalesData.filter(sale => (sale.timestamp || 0) >= periodStart)

    if (filteredSales.length === 0 && summaries.length === 0) {
      return { labels: [], salesData: [], profitData: [] }
    }

    // For 7 days: daily data points
    if (periodDays === 7) {
      const salesByDate: Record<string, { sales: number; profit: number }> = {}

      // Initialize all 7 days with zeros
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000)
        const dateKey = date.toISOString().split('T')[0]
        salesByDate[dateKey] = { sales: 0, profit: 0 }
      }

      // Aggregate sales data
      filteredSales.forEach(sale => {
        const saleDate = new Date(sale.timestamp)
        const dateKey = saleDate.toISOString().split('T')[0]

        if (salesByDate[dateKey]) {
          salesByDate[dateKey].sales += sale.totalAmount || 0
          salesByDate[dateKey].profit += Math.max(0, (sale.totalAmount || 0) - (sale.costPrice || 0))
        }
      })

      const sortedDates = Object.keys(salesByDate).sort()
      const labels = sortedDates.map(dateStr => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })

      return {
        labels,
        salesData: sortedDates.map(d => salesByDate[d].sales),
        profitData: sortedDates.map(d => salesByDate[d].profit)
      }
    }

    // For 30 days: weekly aggregation (~4-5 weeks)
    if (periodDays === 30) {
      const weeks: { label: string; sales: number; profit: number }[] = []

      // Create 4-5 weekly buckets
      for (let i = 4; i >= 0; i--) {
        const weekEnd = new Date(now - i * 7 * 24 * 60 * 60 * 1000)
        const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000)

        if (weekStart.getTime() < periodStart) continue

        const weekSales = filteredSales.filter(sale => {
          const saleTime = sale.timestamp || 0
          return saleTime >= weekStart.getTime() && saleTime <= weekEnd.getTime()
        })

        const totalSales = weekSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
        const totalProfit = weekSales.reduce((sum, sale) =>
          sum + Math.max(0, (sale.totalAmount || 0) - (sale.costPrice || 0)), 0)

        const label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { day: 'numeric' })}`
        weeks.push({ label, sales: totalSales, profit: totalProfit })
      }

      return {
        labels: weeks.map(w => w.label),
        salesData: weeks.map(w => w.sales),
        profitData: weeks.map(w => w.profit)
      }
    }

    // For 90 days: monthly aggregation (3 months)
    if (periodDays === 90) {
      const months: { label: string; sales: number; profit: number }[] = []

      for (let i = 2; i >= 0; i--) {
        const monthDate = new Date(now)
        monthDate.setMonth(monthDate.getMonth() - i)
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999)

        const monthSales = filteredSales.filter(sale => {
          const saleTime = sale.timestamp || 0
          return saleTime >= monthStart.getTime() && saleTime <= monthEnd.getTime()
        })

        const totalSales = monthSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
        const totalProfit = monthSales.reduce((sum, sale) =>
          sum + Math.max(0, (sale.totalAmount || 0) - (sale.costPrice || 0)), 0)

        const label = monthDate.toLocaleDateString('en-US', { month: 'long' })
        months.push({ label, sales: totalSales, profit: totalProfit })
      }

      return {
        labels: months.map(m => m.label),
        salesData: months.map(m => m.sales),
        profitData: months.map(m => m.profit)
      }
    }

    // Default fallback (Custom or unknown)
    return { labels: [], salesData: [], profitData: [] }
  }, [selectedPeriod, allSalesData])

  // Payment methods breakdown from real sales data (combined) - filtered by period
  const paymentMethods = useMemo(() => {
    const periodDays = selectedPeriod === 'Last 7 Days' ? 7 :
                       selectedPeriod === 'Last 30 Days' ? 30 :
                       selectedPeriod === 'Last 90 Days' ? 90 : 30
    const periodStart = Date.now() - (periodDays * 24 * 60 * 60 * 1000)

    const filteredSales = allSalesData.filter(sale => (sale.timestamp || 0) >= periodStart)

    if (filteredSales.length === 0) {
      return [
        { label: 'Cash', percentage: 0 },
        { label: 'M-Pesa', percentage: 0 },
        { label: 'Bank Transfer', percentage: 0 },
        { label: 'Card Payment', percentage: 0 },
        { label: 'Credit Sale', percentage: 0 },
        { label: 'Cheque', percentage: 0 },
        { label: 'Other', percentage: 0 }
      ]
    }

    const methodCounts: Record<string, number> = {
      CASH: 0,
      MPESA: 0,
      BANK_TRANSFER: 0,
      CARD: 0,
      CREDIT: 0,
      CHEQUE: 0,
      OTHER: 0
    }

    filteredSales.forEach(sale => {
      const method = sale.paymentMethod || 'CASH'
      methodCounts[method] = (methodCounts[method] || 0) + 1
    })

    const total = filteredSales.length

    return [
      { label: 'Cash', percentage: Math.round((methodCounts.CASH / total) * 100) },
      { label: 'M-Pesa', percentage: Math.round((methodCounts.MPESA / total) * 100) },
      { label: 'Bank Transfer', percentage: Math.round((methodCounts.BANK_TRANSFER / total) * 100) },
      { label: 'Card Payment', percentage: Math.round((methodCounts.CARD / total) * 100) },
      { label: 'Credit Sale', percentage: Math.round((methodCounts.CREDIT / total) * 100) },
      { label: 'Cheque', percentage: Math.round((methodCounts.CHEQUE / total) * 100) },
      { label: 'Other', percentage: Math.round((methodCounts.OTHER / total) * 100) }
    ]
  }, [allSalesData, selectedPeriod])

  // Inventory stock data from real products
  const inventoryData = useMemo(() => {
    console.log('inventoryData - Products count:', products.length)

    if (products.length === 0) {
      return []
    }

    // Sort by quantity and take top items for display
    const sortedProducts = [...products]
      .filter(p => (p.quantity || 0) > 0) // Only show products with stock
      .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
      .slice(0, 11)

    // If no products with stock, show first 11 products anyway
    const displayProducts = sortedProducts.length > 0
      ? sortedProducts
      : [...products].slice(0, 11)

    console.log('inventoryData - Display products:', displayProducts.length, displayProducts.map(p => ({ name: p.name, qty: p.quantity })))

    return displayProducts.map((product) => ({
      name: product.name.length > 8 ? product.name.substring(0, 6) + '...' : product.name,
      fullName: product.name,
      stock: product.quantity || 0
    }))
  }, [products])

  // Best performing products from real sales data (combined) - filtered by period
  const bestProducts = useMemo(() => {
    if ((recentSales.length === 0 && multiItemSales.length === 0) || products.length === 0) {
      return []
    }

    const periodDays = selectedPeriod === 'Last 7 Days' ? 7 :
                       selectedPeriod === 'Last 30 Days' ? 30 :
                       selectedPeriod === 'Last 90 Days' ? 90 : 30
    const periodStart = Date.now() - (periodDays * 24 * 60 * 60 * 1000)

    // Filter sales by period
    const filteredRecentSales = recentSales.filter(sale => (sale.timestamp || 0) >= periodStart)
    const filteredMultiItemSales = multiItemSales.filter(sale => (sale.timestamp || 0) >= periodStart)

    // Aggregate sales by product
    const productSales: Record<string, {
      productId: string
      productName: string
      totalSales: number
      unitsSold: number
      category: string
    }> = {}

    // Process single-item sales
    filteredRecentSales.forEach(sale => {
      const key = sale.productId || sale.productName
      if (!productSales[key]) {
        const product = products.find(p => p.id === sale.productId || p.name === sale.productName)
        productSales[key] = {
          productId: sale.productId || '',
          productName: sale.productName,
          totalSales: 0,
          unitsSold: 0,
          category: product?.category || 'General'
        }
      }
      productSales[key].totalSales += sale.totalAmount || 0
      productSales[key].unitsSold += sale.quantitySold || 1
    })

    // Process multi-item sales (each item separately)
    filteredMultiItemSales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const key = item.productId || item.productName
        if (!productSales[key]) {
          const product = products.find(p => p.id === item.productId || p.name === item.productName)
          productSales[key] = {
            productId: item.productId || '',
            productName: item.productName,
            totalSales: 0,
            unitsSold: 0,
            category: product?.category || 'General'
          }
        }
        productSales[key].totalSales += item.lineTotal || 0
        productSales[key].unitsSold += item.quantity || 1
      })
    })

    // Sort by total sales and get top 3
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 3)

    return topProducts.map((p, idx) => ({
      name: p.productName,
      category: p.category,
      sales: p.totalSales,
      units: p.unitsSold,
      place: (idx + 1) as 1 | 2 | 3
    }))
  }, [recentSales, multiItemSales, products, selectedPeriod])

  // Branch performance data from real branches and sales
  const branchPerformance = useMemo(() => {
    if (backendBranchPerformanceReport.length > 0) {
      return backendBranchPerformanceReport
        .filter((report) => !activeBranchId || report.branchId === activeBranchId)
        .map((report) => {
        const branch = branches.find((item) => item.id === report.branchId)
        const branchStaff = staffList.filter((staffMember) => staffMember.branchIds?.includes(report.branchId))

        return {
          id: report.branchId,
          name: report.branchName || branch?.name || 'Branch',
          staff: branchStaff.length,
          products: branch?.totalProducts || 0,
          costValue: Number(report.inventoryValue || branch?.totalInventoryValue || 0),
          sales: Number(report.totalSales || 0),
          profit: Math.max(0, Number(report.totalProfit || 0))
        }
      })
    }

    if (branches.length === 0) {
      return []
    }

    // Get all sales data combined
    const allSales = [...recentSales, ...multiItemSales.map(s => ({
      ...s,
      totalAmount: s.totalAmount || 0,
      costPrice: s.items?.reduce((sum, item) => sum + ((item.costPrice || 0) * (item.quantity || 0)), 0) || 0
    }))]

    // Calculate total sales/profit across all data for distribution
    const totalAllSales = allSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
    const totalAllProfit = allSales.reduce((sum, sale) => {
      const cost = 'items' in sale
        ? (sale as any).items?.reduce((itemSum: number, item: any) => itemSum + ((item.costPrice || 0) * (item.quantity || 0)), 0) || 0
        : ((sale as any).costPrice || 0) * ((sale as any).quantitySold || 1)
      return sum + Math.max(0, (sale.totalAmount || 0) - cost)
    }, 0)

    return branches
      .filter((branch) => !activeBranchId || branch.id === activeBranchId)
      .map((branch, idx) => {
      const branchStaff = staffList.filter(s => s.branchIds?.includes(branch.id))
      const branchProducts = branch.totalProducts || 0
      const costValue = branch.totalInventoryValue || 0

      // Try to get branch-specific sales first
      const branchMultiSales = multiItemSales.filter(sale => sale.branchId === branch.id)

      let branchSalesTotal = branchMultiSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
      let branchProfitTotal = branchMultiSales.reduce((sum, sale) => {
        const saleCost = sale.items?.reduce((itemSum, item) =>
          itemSum + ((item.costPrice || 0) * (item.quantity || 0)), 0) || 0
        return sum + ((sale.totalAmount || 0) - saleCost)
      }, 0)

      // If no branch-specific data, distribute total evenly among branches (for display purposes)
      if (branchSalesTotal === 0 && totalAllSales > 0 && branches.length > 0) {
        // Give first branch all sales if only one branch, otherwise distribute
        if (branches.length === 1 || idx === 0) {
          branchSalesTotal = totalAllSales
          branchProfitTotal = totalAllProfit
        }
      }

      return {
        id: branch.id,
        name: branch.name,
        staff: branchStaff.length,
        products: branchProducts,
        costValue: costValue,
        sales: branchSalesTotal,
        profit: Math.max(0, branchProfitTotal)
      }
    })
  }, [backendBranchPerformanceReport, branches, staffList, multiItemSales, recentSales, activeBranchId])

  // Staff performance data from real staff and sales
  const staffPerformance = useMemo(() => {
    if (staffList.length === 0) {
      return []
    }

    // Combine all sales for staff calculation
    const allSalesCount = recentSales.length + multiItemSales.length
    const allSalesTotal = recentSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0) +
                          multiItemSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)

    return staffList
      .filter((staffMember) => !activeBranchId || staffMember.branchIds?.includes(activeBranchId))
      .slice(0, 10)
      .map((staffMember, idx) => {
      // Find the branch name for this staff member
      const staffBranch = branches.find(b => staffMember.branchIds?.includes(b.id))

      // Calculate actual transactions and sales from multi-item sales created by this staff
      const staffMultiSales = multiItemSales.filter(sale =>
        sale.createdBy === staffMember.id ||
        sale.createdBy === staffMember.email ||
        sale.createdBy === staffMember.fullName
      )
      let totalTransactions = staffMultiSales.length
      let totalSalesAmount = staffMultiSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)

      // If no staff-specific data and this is the first staff, show all sales (likely owner)
      if (totalTransactions === 0 && idx === 0 && allSalesCount > 0) {
        totalTransactions = allSalesCount
        totalSalesAmount = allSalesTotal
      }

      return {
        branchId: staffBranch?.id || '',
        branch: staffBranch?.name || 'Main Branch',
        name: staffMember.fullName,
        email: staffMember.email,
        transactions: totalTransactions,
        sales: totalSalesAmount
      }
    })
  }, [staffList, branches, multiItemSales, recentSales, activeBranchId])

  // Calculate total product stats
  const productStats = useMemo(() => {
    const totalCostValue = products.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.quantity || 0)), 0)
    const totalSellingValue = products.reduce((sum, p) => sum + ((p.sellingPrice || 0) * (p.quantity || 0)), 0)
    const topProduct = inventoryData.length > 0 ? inventoryData[0] : null

    return {
      totalProducts: products.length,
      totalCostValue,
      totalSellingValue,
      topProduct
    }
  }, [products, inventoryData])

  // Chart.js configuration for Sales vs Profit
  const chartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Sales',
        data: trendData.salesData,
        borderColor: '#004aad',
        backgroundColor: 'rgba(0, 74, 173, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#004aad',
        borderWidth: 2
      },
      {
        label: 'Profit',
        data: trendData.profitData,
        borderColor: '#027a48',
        backgroundColor: 'rgba(2, 122, 72, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#027a48',
        borderWidth: 2
      }
    ]
  }

  const chartOptions = useMemo(() => {
    const maxSales = Math.max(...(trendData.salesData.length > 0 ? trendData.salesData : [0]), 1000)
    const maxProfit = Math.max(...(trendData.profitData.length > 0 ? trendData.profitData : [0]), 1000)
    const chartMax = Math.ceil(Math.max(maxSales, maxProfit) * 1.2 / 1000) * 1000 || 15000

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: chartMax,
          ticks: {
            stepSize: Math.ceil(chartMax / 3),
            callback: function(value: number | string) {
              if (typeof value === 'number') {
                return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
              }
              return value
            },
            font: { size: 12 },
            color: '#717171'
          },
          grid: {
            color: '#f0f0f0',
            drawBorder: false
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: { size: 12 },
            color: '#89868d'
          }
        }
      }
    }
  }, [trendData])

  // Export handler
  const handleExport = async () => {
    setIsExporting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const csvContent = [
        ['FahamPesa Business Report'],
        ['Period:', selectedPeriod],
        ['Generated:', new Date().toLocaleDateString()],
        [''],
        ['Key Metrics'],
        ['Total Sales', `${currencySymbol} ${metrics.totalSales.toLocaleString()}`],
        ['Total Profit', `${currencySymbol} ${metrics.totalProfit.toLocaleString()}`],
        ['Transactions', metrics.totalTransactions.toString()],
        ['Debt', `${currencySymbol} ${metrics.debt.toLocaleString()}`]
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fahampesa-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PlanGate feature="reports">
          <div className="space-y-6 pb-8 font-dm-sans">
            {/* Header Section */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"
            >
              <div>
                <h1 className="dashboard-page-title">
                  Reports &amp; Analytics
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="dashboard-action-primary px-[18px] py-[14px]"
                >
                  <FileExportIcon />
                  <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                </button>

                {/* Period Filter */}
                <div className="relative period-dropdown">
                  <button
                    onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                    className="dashboard-action-muted min-w-[162px] px-3 py-[15px]"
                  >
                    <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-[#717171] text-sm font-semibold">{selectedPeriod}</span>
                    <ChevronDownIcon className="h-5 w-5 text-gray-500 ml-auto" />
                  </button>

                  {showPeriodDropdown && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-full rounded-[14px] border border-[#e6ebf2] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
                      <div className="py-2">
                        {(['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Custom'] as ReportPeriod[]).map((period) => (
                          <button
                            key={period}
                            onClick={() => {
                              setSelectedPeriod(period)
                              setShowPeriodDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm ${
                              selectedPeriod === period ? 'bg-[#eef5ff] text-[#004aad] font-semibold' : 'text-[#334155]'
                            }`}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Key Metrics Cards */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <StatCard
                title="Total Sales"
                value={`${currencySymbol} ${metrics.totalSales.toLocaleString()}`}
                trend={metrics.totalSales > 0 ? "up" : null}
                trendColor="blue"
              />
              <StatCard
                title="Total Profit"
                value={`${currencySymbol} ${metrics.totalProfit.toLocaleString()}`}
                trend={metrics.totalProfit > 0 ? "up" : null}
                trendColor="green"
              />
              <StatCard
                title="Transactions"
                value={metrics.totalTransactions.toLocaleString()}
                trend={metrics.totalTransactions > 0 ? "up" : null}
                trendColor="red"
              />
              <StatCard
                title="Debt"
                value={`${currencySymbol} ${metrics.debt.toLocaleString()}`}
                trend={null}
              />
            </motion.div>

            {/* Sales Trend + Payment Methods Row */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              className="grid grid-cols-1 lg:grid-cols-4 gap-4"
            >
              {/* Sales vs Profit Trend Chart */}
              <div className="dashboard-panel overflow-hidden p-5 lg:col-span-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="dashboard-section-title text-base">Sales vs Profit Trend</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#004aad]" />
                      <span className="text-sm text-[#004aad]">Sales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#027a48]" />
                      <span className="text-sm text-[#027a48]">Profit</span>
                    </div>
                  </div>
                </div>
                <div className="h-[200px]">
                  {trendData.labels.length > 0 ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      {loading ? 'Loading chart data...' : 'No sales data available for this period'}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="dashboard-panel p-5">
                <h3 className="dashboard-section-title mb-5 text-base">Payment method</h3>
                <div className="flex flex-col gap-[14px]">
                  {paymentMethods.map((method) => (
                    <PaymentMethodRow
                      key={method.label}
                      label={method.label}
                      percentage={method.percentage}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Inventory Stock + Total Products Row */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              className="grid grid-cols-1 lg:grid-cols-4 gap-4"
            >
              {/* Inventory Stock Chart */}
              <div className="dashboard-panel p-5 lg:col-span-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="dashboard-section-title text-base">Inventory Stock</h3>
                </div>

                {/* Bar Chart */}
                {inventoryData.length > 0 ? (
                  <div className="relative h-[180px] mt-4 overflow-visible">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-[120px] w-8 flex flex-col justify-between text-xs text-[#717171]">
                      <span>{Math.max(...inventoryData.map(i => i.stock))}</span>
                      <span>{Math.round(Math.max(...inventoryData.map(i => i.stock)) * 0.66)}</span>
                      <span>{Math.round(Math.max(...inventoryData.map(i => i.stock)) * 0.33)}</span>
                      <span>0</span>
                    </div>

                    {/* Bars Container */}
                    <div className="absolute left-10 right-0 top-0 h-[120px] flex items-end justify-around gap-2 overflow-visible">
                      {inventoryData.map((item, idx) => {
                        const maxStock = Math.max(...inventoryData.map(i => i.stock), 1)
                        const heightPx = Math.max((item.stock / maxStock) * 120, 2) // Min 2px height for visibility
                        return (
                          <div key={idx} className="relative flex-1 h-full flex items-end justify-center overflow-visible">
                            <div
                              className="inventory-bar w-full max-w-[30px] rounded-t-lg cursor-pointer"
                              style={{ height: `${heightPx}px` }}
                              title={`${item.fullName || item.name}: ${item.stock} units`}
                            >
                              <div className="inventory-bar-tooltip">
                                {item.fullName || item.name}, {item.stock}pcs
                                <div className="inventory-bar-tooltip-arrow" />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* X-axis labels */}
                    <div className="absolute left-10 right-0 top-[130px] flex justify-around">
                      {inventoryData.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-[#717171] transform -rotate-45 origin-top-left whitespace-nowrap"
                          title={item.fullName || item.name}
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[150px] flex items-center justify-center text-gray-400">
                    {loading ? 'Loading inventory...' : 'No products available'}
                  </div>
                )}
              </div>

              {/* Total Products Card */}
              <div className="dashboard-panel flex flex-col gap-6 p-5">
                <div className="flex flex-col gap-4">
                  <h3 className="dashboard-section-title text-base">Total Products</h3>
                  <span className="dashboard-metric-value text-base text-[#0f172a]">{productStats.totalProducts}</span>
                </div>

                <div className="flex flex-col gap-[10px]">
                  <div className="flex items-center gap-[5px]">
                    <TagIcon className="w-4 h-4 text-[#717171]" />
                    <span className="text-[#717171] text-sm">Cost Value</span>
                  </div>
                  <span className="text-2xl font-bold text-black">
                    {currencySymbol} {productStats.totalCostValue.toLocaleString()}
                  </span>
                  <span className="text-sm text-[#027a48]">
                    Potential: {currencySymbol} {productStats.totalSellingValue.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Best Performing Products */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              className="dashboard-panel p-5"
            >
              <h3 className="dashboard-section-title mb-5 text-base">Best performing Products</h3>

              {bestProducts.length > 0 ? (
                <div className="flex flex-col gap-5">
                  {bestProducts.map((product) => (
                    <div
                      key={product.place}
                      className={`flex items-center justify-between px-5 py-4 rounded-xl border ${
                        product.place === 1
                          ? 'bg-[#fff8ec] border-[#fff085]'
                          : product.place === 2
                          ? 'bg-[#f8fafb] border-[#e5e7eb]'
                          : 'bg-[#fdffec] border-[#deff85]'
                      }`}
                    >
                      <div className="flex items-center gap-[14px]">
                        <PlaceBadge place={product.place} />
                        <div className="flex flex-col gap-1">
                          <span className="text-base font-medium text-black">{product.name}</span>
                          <div className="flex items-center gap-2">
                            <MedalIcon />
                            <span className="text-[#717171] text-sm">Category: {product.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-[3px]">
                        <span className="text-[#004aad] text-base font-bold">
                          {currencySymbol} {product.sales.toLocaleString()}
                        </span>
                        <span className="bg-[#dbeafe] text-[#004aad] text-sm font-medium px-[10px] py-1 rounded-full">
                          {product.units} units sold
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  {loading ? 'Loading product data...' : 'No sales data available to determine top products'}
                </div>
              )}
            </motion.div>

            {/* Branch Performance */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              className="dashboard-panel p-5"
            >
              <h3 className="dashboard-section-title mb-5 text-base">Branch Performance</h3>

              {branchPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f6f6f6] rounded">
                        <th className="text-left px-4 py-2 text-base font-medium text-black">Branch</th>
                        <th className="text-left px-3 py-2 text-base font-medium text-black">Staff</th>
                        <th className="text-center px-3 py-2 text-base font-medium text-black">Products</th>
                        <th className="text-center px-3 py-2 text-base font-medium text-black">Cost Value</th>
                        <th className="text-center px-3 py-2 text-base font-medium text-black">Sales</th>
                        <th className="text-center px-3 py-2 text-base font-medium text-black">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchPerformance.map((branch, idx) => (
                        <tr key={branch.id || idx} className={idx % 2 === 1 ? 'bg-[#f6f6f6]' : ''}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-[10px]">
                              <BranchIcon />
                              <span className="text-sm text-black">{branch.name}</span>
                            </div>
                          </td>
                          <td className="text-center px-3 py-4 text-sm text-black">{branch.staff}</td>
                          <td className="text-center px-3 py-4 text-sm text-black">{branch.products}</td>
                          <td className="text-center px-3 py-4 text-sm text-black">
                            {currencySymbol} {branch.costValue.toLocaleString()}
                          </td>
                          <td className="text-center px-3 py-4 text-sm text-black">
                            {currencySymbol} {branch.sales.toLocaleString()}
                          </td>
                          <td className="text-center px-3 py-4 text-sm text-black">
                            {currencySymbol} {branch.profit.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  {loading ? 'Loading branch data...' : 'No branches available'}
                </div>
              )}
            </motion.div>

            {/* Staff Performance */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              className="dashboard-panel p-5"
            >
              <h3 className="dashboard-section-title mb-5 text-base">Staff Performance</h3>

              {staffPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f6f6f6] rounded">
                        <th className="text-left px-4 py-2 text-base font-medium text-black">Branch</th>
                        <th className="text-left px-3 py-2 text-base font-medium text-black">Staff</th>
                        <th className="text-left px-3 py-2 text-base font-medium text-black">Email</th>
                        <th className="text-center px-3 py-2 text-base font-medium text-black">Transactions</th>
                        <th className="text-center px-3 py-2 text-base font-medium text-black">Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffPerformance.map((staffMember, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-[#f6f6f6]' : ''}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-[10px]">
                              <BranchIcon />
                              <span className="text-sm text-black">{staffMember.branch}</span>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-black">{staffMember.name}</td>
                          <td className="px-3 py-4 text-sm text-black">{staffMember.email}</td>
                          <td className="text-center px-3 py-4 text-sm text-black">{staffMember.transactions}</td>
                          <td className="text-center px-3 py-4 text-sm text-black">
                            {currencySymbol} {staffMember.sales.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  {loading ? 'Loading staff data...' : 'No staff members available'}
                </div>
              )}
            </motion.div>
          </div>
        </PlanGate>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
