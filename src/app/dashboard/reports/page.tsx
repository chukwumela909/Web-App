'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import { 
  CalendarDaysIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  BuildingOffice2Icon,
  TagIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { useEffect, useMemo, useState } from 'react'
import { DailySummary, getDailySummaries, getSales, Sale } from '@/lib/firestore'
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

// Stat Card Component
interface StatCardProps {
  title: string
  value: string
  trend?: 'up' | 'down' | null
}

function StatCard({ title, value, trend }: StatCardProps) {
  return (
    <div className="bg-white border border-[#ececf2] rounded-xl px-4 py-5 flex flex-col gap-4">
      <span className="text-[#525252] text-base font-normal">{title}</span>
      <div className="flex items-end justify-between">
        <span className="text-[#171717] text-2xl font-bold">{value}</span>
        {trend && (
          <svg width="50" height="36" viewBox="0 0 50 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            {trend === 'up' ? (
              <path d="M1 35L12.5 23.5L25 28L35.5 13.5L49 1" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M1 1L12.5 12.5L25 8L35.5 22.5L49 35" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

// Medal/Award Icon for Product Rankings
function MedalIcon({ place }: { place: 1 | 2 | 3 }) {
  const colors = {
    1: { from: '#fac200', to: '#f4b800' },
    2: { from: '#7a8291', to: '#9098a6' },
    3: { from: '#da6a00', to: '#c25400' }
  }
  
  return (
    <div 
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
      style={{ background: `linear-gradient(to bottom, ${colors[place].from}, ${colors[place].to})` }}
    >
      {place}
    </div>
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
        const [s, rs] = await Promise.all([
          getDailySummaries(effectiveUserId, 14),
          getSales(effectiveUserId, 2000)
        ])
        setSummaries(s)
        setRecentSales(rs)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [effectiveUserId])

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

  // Calculate metrics from actual data
  const metrics = useMemo(() => {
    const totalSales = recentSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
    const totalProfit = recentSales.reduce((sum, sale) => {
      const cost = Number(sale.costPrice || 0)
      const revenue = Number(sale.totalAmount || 0)
      return sum + Math.max(0, revenue - cost)
    }, 0)
    const totalTransactions = recentSales.length
    const debt = 0 // Placeholder for debt calculation

    return {
      totalSales,
      totalProfit,
      totalTransactions,
      debt
    }
  }, [recentSales])

  // Generate trend data for Sales vs Profit chart
  const trendData = useMemo(() => {
    const labels = ['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7']
    const salesData = [2000, 4000, 3500, 10000, 7000, 6000, 5000]
    const profitData = [500, 1500, 1200, 4000, 2500, 2000, 1800]

    return { labels, salesData, profitData }
  }, [selectedPeriod])

  // Payment methods breakdown
  const paymentMethods = useMemo(() => [
    { label: 'Cash', percentage: 70 },
    { label: 'M-Pesa', percentage: 45 },
    { label: 'Bank Transfer', percentage: 45 },
    { label: 'Card Payment', percentage: 20 },
    { label: 'Credit Sale', percentage: 6 },
    { label: 'Cheque', percentage: 12 },
    { label: 'Other', percentage: 45 }
  ], [])

  // Inventory stock data
  const inventoryData = useMemo(() => [
    { name: 'Cooking...', stock: 35 },
    { name: 'Gas co...', stock: 32 },
    { name: 'iPhone...', stock: 32 },
    { name: 'Keybo...', stock: 35 },
    { name: 'Logite...', stock: 45 },
    { name: 'Samsu...', stock: 45 },
    { name: 'Standi...', stock: 27 },
    { name: 'Monito...', stock: 32 },
    { name: 'Laptop...', stock: 40 },
    { name: 'TV Sta...', stock: 50, highlighted: true },
    { name: 'Wristw...', stock: 35 }
  ], [])

  // Best performing products
  const bestProducts = useMemo(() => [
    { name: 'TV Stand', category: 'Furniture', sales: 15420, units: 20, place: 1 as const },
    { name: 'Logitech Mouse', category: 'Gadget', sales: 10420, units: 10, place: 2 as const },
    { name: 'iPhone 16', category: 'Gadget', sales: 8000, units: 9, place: 3 as const }
  ], [])

  // Branch performance data
  const branchPerformance = useMemo(() => [
    { name: 'Main Branch', staff: 2, products: 10, costValue: 3890360, sales: 10800, profit: 4000 },
    { name: 'Northern coast Branch', staff: 1, products: 10, costValue: 3890360, sales: 10800, profit: 4000 },
    { name: '6th Avenue Branch', staff: 4, products: 10, costValue: 3890360, sales: 10800, profit: 4000 }
  ], [])

  // Staff performance data
  const staffPerformance = useMemo(() => [
    { branch: 'Main Branch', name: 'Leslie Alexander', email: 'name@examplemail.com', transactions: 10, sales: 4000 },
    { branch: 'Northern coast Branch', name: 'Bessie Cooper', email: 'name@examplemail.com', transactions: 5, sales: 2000 },
    { branch: '6th Avenue Branch', name: 'Ronald Richards', email: 'name@examplemail.com', transactions: 4, sales: 1200 }
  ], [])

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

  const chartOptions = {
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
        max: 15000,
        ticks: {
          stepSize: 5000,
          callback: function(value: number | string) {
            if (typeof value === 'number') {
              return value >= 1000 ? `${value / 1000}k` : value
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
                <p className="text-[#717171] text-base font-normal mt-2">
                  Track your business performance with detailed insights
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-[18px] py-[14px] bg-[#004aad] hover:bg-[#003d91] text-white rounded-lg font-medium transition-colors"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
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
                value={`${currencySymbol} ${metrics.totalSales > 0 ? metrics.totalSales.toLocaleString() : '10,500'}`}
                trend="up"
              />
              <StatCard 
                title="Total Profit" 
                value={`${currencySymbol} ${metrics.totalProfit > 0 ? metrics.totalProfit.toLocaleString() : '3,000'}`}
                trend="up"
              />
              <StatCard 
                title="Transactions" 
                value={metrics.totalTransactions > 0 ? metrics.totalTransactions.toString() : '30'}
                trend="up"
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
                  <Line data={chartData} options={chartOptions} />
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
                  <div className="bg-[#004aad] text-white text-[10px] font-medium px-[10px] py-[6px] rounded-[10px]">
                    TV stand, 50pcs
                  </div>
                </div>
                
                {/* Bar Chart */}
                <div className="relative h-[150px] mt-4">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-[#717171]">
                    <span>50</span>
                    <span>20</span>
                    <span>10</span>
                    <span>0</span>
                  </div>
                  
                  {/* Bars */}
                  <div className="absolute left-10 right-0 top-0 bottom-6 flex items-end justify-around gap-2">
                    {inventoryData.map((item, idx) => {
                      const height = (item.stock / 50) * 100
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                          <div 
                            className={`w-full max-w-[30px] rounded-t-lg transition-all duration-300 ${
                              item.highlighted ? 'bg-[#004aad]' : 'bg-[#d4e7f4]'
                            }`}
                            style={{ height: `${height}%` }}
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
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total Products Card */}
              <div className="bg-white border border-[#ececf2] rounded-xl p-5 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-semibold text-black">Total Products</h3>
                  <span className="text-base text-black">10</span>
                </div>
                
                <div className="flex flex-col gap-[10px]">
                  <div className="flex items-center gap-[5px]">
                    <TagIcon className="w-4 h-4 text-[#717171]" />
                    <span className="text-[#717171] text-sm">Cost Value</span>
                  </div>
                  <span className="text-2xl font-bold text-black">
                    {currencySymbol} 3,890,360
                  </span>
                  <span className="text-sm text-[#027a48]">
                    Potential: {currencySymbol} 4,420,400
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
                      <MedalIcon place={product.place} />
                      <div className="flex flex-col gap-1">
                        <span className="text-base font-medium text-black">{product.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#717171] text-sm">🏷️ Category: {product.category}</span>
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
            </motion.div>

            {/* Branch Performance */}
            <motion.div 
              initial="initial" 
              animate="animate" 
              variants={fadeInUp}
              className="bg-white border border-[#ececf2] rounded-xl p-5"
            >
              <h3 className="text-base font-bold text-black mb-5">Branch Performance</h3>
              
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
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-[#f6f6f6]' : ''}>
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
            </motion.div>

            {/* Staff Performance */}
            <motion.div 
              initial="initial" 
              animate="animate" 
              variants={fadeInUp}
              className="bg-white border border-[#ececf2] rounded-xl p-5"
            >
              <h3 className="text-base font-bold text-black mb-5">Staff Performance</h3>
              
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
            </motion.div>
          </div>
        </PlanGate>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
