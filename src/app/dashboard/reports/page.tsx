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
    <div className="bg-white border border-[#ececf2] rounded-xl px-4 py-5 flex flex-col gap-4">
      <span className="text-[#525252] text-base font-normal">{title}</span>
      <div className="flex items-end justify-between">
        <span className="text-[#171717] text-2xl font-bold">{value}</span>
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
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('Last 7 Days')
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Determine the effective user ID for data loading
  const effectiveUserId = staff ? staff.userId : user?.uid

  useEffect(() => {
    const load = async () => {
      if (!effectiveUserId) return
      setLoading(true)
      try {
        const [s, rs, mis, prods, br, st, dbt] = await Promise.all([
          getDailySummaries(effectiveUserId, 90),
          getSales(effectiveUserId, 2000),
          getMultiItemSales(effectiveUserId, 2000),
          getProducts(effectiveUserId),
          getBranches(effectiveUserId),
          getStaff(effectiveUserId),
          getDebtors(effectiveUserId)
        ])
        console.log('Reports fetch - Sales:', rs.length, 'Multi-item Sales:', mis.length)
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
  }, [effectiveUserId])

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
    // Filter sales based on selected period
    const now = Date.now()
    const periodDays = selectedPeriod === 'Last 7 Days' ? 7 : 
                       selectedPeriod === 'Last 30 Days' ? 30 : 
                       selectedPeriod === 'Last 90 Days' ? 90 : 30
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
    
    // Calculate debt from debtors
    const totalDebt = debtors.reduce((sum, debtor) => sum + (debtor.currentDebt || 0), 0)

    return {
      totalSales,
      totalProfit,
      totalTransactions,
      debt: totalDebt
    }
  }, [allSalesData, debtors, selectedPeriod])

  // Generate trend data for Sales vs Profit chart from real summaries
  const trendData = useMemo(() => {
    const periodDays = selectedPeriod === 'Last 7 Days' ? 7 : 
                       selectedPeriod === 'Last 30 Days' ? 30 : 
                       selectedPeriod === 'Last 90 Days' ? 90 : 7
    
    // Get the most recent summaries for the period
    const recentSummaries = summaries.slice(0, Math.min(periodDays, 7))
    
    if (recentSummaries.length === 0) {
      // Return empty arrays if no data
      return { labels: [], salesData: [], profitData: [] }
    }
    
    // Sort by date ascending for chart display
    const sortedSummaries = [...recentSummaries].reverse()
    
    const labels = sortedSummaries.map(s => {
      const date = new Date(s.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
    
    const salesData = sortedSummaries.map(s => s.totalSales || 0)
    const profitData = sortedSummaries.map(s => s.totalProfit || 0)

    return { labels, salesData, profitData }
  }, [summaries, selectedPeriod])

  // Payment methods breakdown from real sales data (combined)
  const paymentMethods = useMemo(() => {
    if (allSalesData.length === 0) {
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
    
    allSalesData.forEach(sale => {
      const method = sale.paymentMethod || 'CASH'
      methodCounts[method] = (methodCounts[method] || 0) + 1
    })
    
    const total = allSalesData.length
    
    return [
      { label: 'Cash', percentage: Math.round((methodCounts.CASH / total) * 100) },
      { label: 'M-Pesa', percentage: Math.round((methodCounts.MPESA / total) * 100) },
      { label: 'Bank Transfer', percentage: Math.round((methodCounts.BANK_TRANSFER / total) * 100) },
      { label: 'Card Payment', percentage: Math.round((methodCounts.CARD / total) * 100) },
      { label: 'Credit Sale', percentage: Math.round((methodCounts.CREDIT / total) * 100) },
      { label: 'Cheque', percentage: Math.round((methodCounts.CHEQUE / total) * 100) },
      { label: 'Other', percentage: Math.round((methodCounts.OTHER / total) * 100) }
    ]
  }, [allSalesData])

  // Inventory stock data from real products
  const inventoryData = useMemo(() => {
    if (products.length === 0) {
      return []
    }
    
    // Sort by quantity and take top items for display
    const sortedProducts = [...products]
      .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
      .slice(0, 11)
    
    const maxStock = Math.max(...sortedProducts.map(p => p.quantity || 0), 1)
    const topProduct = sortedProducts[0]
    
    return sortedProducts.map((product, idx) => ({
      name: product.name.length > 8 ? product.name.substring(0, 6) + '...' : product.name,
      fullName: product.name,
      stock: product.quantity || 0,
      highlighted: idx === 0
    }))
  }, [products])

  // Best performing products from real sales data (combined)
  const bestProducts = useMemo(() => {
    if ((recentSales.length === 0 && multiItemSales.length === 0) || products.length === 0) {
      return []
    }
    
    // Aggregate sales by product
    const productSales: Record<string, { 
      productId: string
      productName: string
      totalSales: number
      unitsSold: number
      category: string
    }> = {}
    
    // Process single-item sales
    recentSales.forEach(sale => {
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
    multiItemSales.forEach(sale => {
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
  }, [recentSales, multiItemSales, products])

  // Branch performance data from real branches and sales
  const branchPerformance = useMemo(() => {
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
    
    return branches.map((branch, idx) => {
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
  }, [branches, staffList, multiItemSales, recentSales])

  // Staff performance data from real staff and sales
  const staffPerformance = useMemo(() => {
    if (staffList.length === 0) {
      return []
    }
    
    // Combine all sales for staff calculation
    const allSalesCount = recentSales.length + multiItemSales.length
    const allSalesTotal = recentSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0) + 
                          multiItemSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
    
    return staffList.slice(0, 10).map((staffMember, idx) => {
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
  }, [staffList, branches, multiItemSales, recentSales])

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
          <div className="space-y-6 pb-8">
            {/* Header Section */}
            <motion.div 
              initial="initial" 
              animate="animate" 
              variants={fadeInUp}
              className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"
            >
              <div>
                <h1 className="text-[28px] font-black text-black font-dm-sans">
                  Reports &amp; Analytics
                </h1>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-[18px] py-[14px] bg-[#004aad] hover:bg-[#003d91] text-white rounded-lg font-medium transition-colors"
                >
                  <FileExportIcon />
                  <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                </button>

                {/* Period Filter */}
                <div className="relative period-dropdown">
                  <button
                    onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                    className="flex items-center gap-2 px-3 py-[15px] bg-white border border-[#d9d9d9] rounded-[10px] min-w-[162px]"
                  >
                    <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-[#717171] text-sm font-semibold">{selectedPeriod}</span>
                    <ChevronDownIcon className="h-5 w-5 text-gray-500 ml-auto" />
                  </button>
                  
                  {showPeriodDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                      <div className="py-2">
                        {(['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Custom'] as ReportPeriod[]).map((period) => (
                          <button
                            key={period}
                            onClick={() => {
                              setSelectedPeriod(period)
                              setShowPeriodDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm ${
                              selectedPeriod === period ? 'text-[#004aad] font-semibold' : 'text-gray-700'
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
              <div className="lg:col-span-3 bg-white border border-[#ececf2] rounded-xl p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-black">Sales vs Profit Trend</h3>
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
              <div className="bg-white border border-[#ececf2] rounded-xl p-5">
                <h3 className="text-base font-semibold text-black mb-5">Payment method</h3>
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
              <div className="lg:col-span-3 bg-white border border-[#ececf2] rounded-xl p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-black">Inventory Stock</h3>
                  {productStats.topProduct && (
                    <div className="bg-[#004aad] text-white text-[10px] font-medium px-[10px] py-[6px] rounded-[10px]">
                      {productStats.topProduct.fullName || productStats.topProduct.name}, {productStats.topProduct.stock}pcs
                    </div>
                  )}
                </div>
                
                {/* Bar Chart */}
                {inventoryData.length > 0 ? (
                  <div className="relative h-[150px] mt-4">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-[#717171]">
                      <span>{Math.max(...inventoryData.map(i => i.stock))}</span>
                      <span>{Math.round(Math.max(...inventoryData.map(i => i.stock)) * 0.66)}</span>
                      <span>{Math.round(Math.max(...inventoryData.map(i => i.stock)) * 0.33)}</span>
                      <span>0</span>
                    </div>
                    
                    {/* Bars */}
                    <div className="absolute left-10 right-0 top-0 bottom-6 flex items-end justify-around gap-2">
                      {inventoryData.map((item, idx) => {
                        const maxStock = Math.max(...inventoryData.map(i => i.stock), 1)
                        const height = (item.stock / maxStock) * 100
                        return (
                          <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                            <div 
                              className={`w-full max-w-[30px] rounded-t-lg transition-all duration-300 ${
                                item.highlighted ? 'bg-[#004aad]' : 'bg-[#d4e7f4]'
                              }`}
                              style={{ height: `${height}%` }}
                              title={`${item.fullName || item.name}: ${item.stock} units`}
                            />
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* X-axis labels */}
                    <div className="absolute left-10 right-0 bottom-0 flex justify-around">
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
              <div className="bg-white border border-[#ececf2] rounded-xl p-5 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-semibold text-black">Total Products</h3>
                  <span className="text-base text-black">{productStats.totalProducts}</span>
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
              className="bg-white border border-[#ececf2] rounded-xl p-5"
            >
              <h3 className="text-base font-bold text-black mb-5">Best performing Products</h3>
              
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
              className="bg-white border border-[#ececf2] rounded-xl p-5"
            >
              <h3 className="text-base font-bold text-black mb-5">Branch Performance</h3>
              
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
              className="bg-white border border-[#ececf2] rounded-xl p-5"
            >
              <h3 className="text-base font-bold text-black mb-5">Staff Performance</h3>
              
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
