'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StaffProtectedRoute from '@/components/auth/StaffProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { 
  ArchiveBoxIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  UserPlusIcon,
  ReceiptPercentIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  BellIcon,
  CalendarIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import type { Product as FPProduct, Sale, Expense, Debtor } from '@/lib/firestore'
import { getProducts, getSales, getExpenses, getDebtors } from '@/lib/firestore'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

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

type DateFilter = 'today' | 'week' | 'month'

export default function DashboardPage() {
  const { user } = useAuth()
  const { staff } = useStaff()
  const router = useRouter()
  const { currency } = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  const [products, setProducts] = useState<FPProduct[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Determine the effective user ID for data loading
  const effectiveUserId = staff ? staff.userId : user?.uid

  const fetchData = async () => {
    if (!effectiveUserId) return
    setLoading(true)
    try {
      const [productList, salesList, expensesList, debtorList] = await Promise.all([
        getProducts(effectiveUserId),
        getSales(effectiveUserId, 2000), // Get more sales for better analytics
        getExpenses(effectiveUserId, 500), // Get more expenses for better analytics
        getDebtors(effectiveUserId)
      ])
      setProducts(productList)
      setSales(salesList)
      setExpenses(expensesList)
      setDebtors(debtorList)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [effectiveUserId])

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

  // Filtered data based on date range
  const filteredSales = sales.filter(sale => sale.timestamp >= filterStart && sale.timestamp <= filterEnd)
  const filteredExpenses = expenses.filter(expense => expense.timestamp >= filterStart && expense.timestamp <= filterEnd)

  // Calculate metrics
  const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  const totalProfit = filteredSales.reduce((sum, sale) => {
    const profit = ((sale.unitPrice || 0) - (sale.costPrice || 0)) * (sale.quantitySold || 0)
    return sum + profit
  }, 0)

  // Today's specific metrics for the performance cards
  const todayRange = getDateRange('today')
  const todaysSales = sales.filter(sale => sale.timestamp >= todayRange.start && sale.timestamp <= todayRange.end)
  const todaysExpenses = expenses.filter(expense => expense.timestamp >= todayRange.start && expense.timestamp <= todayRange.end)
  const todaysSalesTotal = todaysSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
  const todaysExpensesTotal = todaysExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  const todaysProfit = todaysSales.reduce((sum, sale) => {
    const profit = ((sale.unitPrice || 0) - (sale.costPrice || 0)) * (sale.quantitySold || 0)
    return sum + profit
  }, 0)

  // Weekly data for cashflow
  const weekRange = getDateRange('week')
  const weeklySales = sales.filter(sale => sale.timestamp >= weekRange.start && sale.timestamp <= weekRange.end)
  const weeklyExpenses = expenses.filter(expense => expense.timestamp >= weekRange.start && expense.timestamp <= weekRange.end)
  const weeklySalesTotal = weeklySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
  const weeklyExpensesTotal = weeklyExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  const weeklyBalance = weeklySalesTotal - weeklyExpensesTotal

  // Top selling products this week
  const topProducts = useMemo(() => {
    const productSales: Record<string, { product: FPProduct, totalSold: number, revenue: number }> = {}
    
    weeklySales.forEach(sale => {
      if (sale.productId) {
        const product = products.find(p => p.id === sale.productId)
        if (product) {
          if (!productSales[sale.productId]) {
            productSales[sale.productId] = { product, totalSold: 0, revenue: 0 }
          }
          productSales[sale.productId].totalSold += sale.quantitySold || 0
          productSales[sale.productId].revenue += sale.totalAmount || 0
        }
      }
    })
    
    return Object.values(productSales)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 3)
  }, [weeklySales, products])

  // Alerts
  const alerts = useMemo(() => {
    const alertList: Array<{id: string, type: 'low-stock' | 'overdue-debt' | 'delivery', title: string, message: string, severity: 'high' | 'medium' | 'low'}> = []
    
    // Low stock alerts
    products.forEach(product => {
      if (product.quantity <= (product.minStockLevel || 5)) {
        alertList.push({
          id: `low-stock-${product.id}`,
          type: 'low-stock',
          title: 'Low Stock Alert',
          message: `${product.name} has only ${product.quantity} units left`,
          severity: product.quantity === 0 ? 'high' : 'medium'
        })
      }
    })
    
    // Overdue debtor alerts
    const now = Date.now()
    debtors.forEach(debtor => {
      if (debtor.currentDebt > 0 && debtor.dueDate && debtor.dueDate < now) {
        const daysOverdue = Math.floor((now - debtor.dueDate) / (1000 * 60 * 60 * 24))
        alertList.push({
          id: `overdue-${debtor.id}`,
          type: 'overdue-debt',
          title: 'Overdue Payment',
          message: `${debtor.name} is ${daysOverdue} days overdue (${currencySymbol} ${debtor.currentDebt.toLocaleString()})`,
          severity: daysOverdue > 30 ? 'high' : daysOverdue > 7 ? 'medium' : 'low'
        })
      }
    })
    
    return alertList.slice(0, 5) // Show only top 5 alerts
  }, [products, debtors])

  // Chart data for trends
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date
    })
    
    const dailyData = last7Days.map(date => {
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1
      
      const daySales = sales.filter(sale => sale.timestamp >= dayStart && sale.timestamp <= dayEnd)
      const dayExpenses = expenses.filter(expense => expense.timestamp >= dayStart && expense.timestamp <= dayEnd)
      
      const salesTotal = daySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
      const expensesTotal = dayExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
      const profitTotal = daySales.reduce((sum, sale) => {
        const profit = ((sale.unitPrice || 0) - (sale.costPrice || 0)) * (sale.quantitySold || 0)
        return sum + profit
      }, 0)
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: salesTotal,
        expenses: expensesTotal,
        profit: profitTotal
      }
    })
    
    return {
      labels: dailyData.map(d => d.date),
      datasets: [
        {
          label: 'Sales',
          data: dailyData.map(d => d.sales),
          borderColor: '#2175C7',
          backgroundColor: 'rgba(33, 117, 199, 0.1)',
          tension: 0.4,
          borderWidth: 2
        },
        {
          label: 'Expenses',
          data: dailyData.map(d => d.expenses),
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          tension: 0.4,
          borderWidth: 2
        },
        {
          label: 'Profit',
          data: dailyData.map(d => d.profit),
          borderColor: '#66BB6A',
          backgroundColor: 'rgba(102, 187, 106, 0.1)',
          tension: 0.4,
          borderWidth: 2
        }
      ]
    }
  }, [sales, expenses])

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11,
            weight: '400'
          },
          color: '#6B7280'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#F3F4F6'
        },
        ticks: {
          font: {
            size: 11,
            weight: '400'
          },
          color: '#6B7280',
          callback: function(value) {
            return currencySymbol + ' ' + Number(value).toLocaleString()
          }
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  }

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

  return (
    <ProtectedRoute>
      <StaffProtectedRoute requiredPermission="dashboard:read">
        <DashboardLayout>
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerChildren}
          className="space-y-8"
        >
          {/* Date Filter */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
                <p className="text-muted-foreground">Monitor your business performance</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors text-primary shadow-sm"
                >
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : 'This Month'}</span>
                  <ChevronDownIcon className="h-4 w-4 text-primary" />
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-primary/20 rounded-lg shadow-lg z-10">
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
                        className={`w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors text-sm first:rounded-t-lg last:rounded-b-lg ${
                          dateFilter === filter.value ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <motion.div variants={fadeInUp}>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-900">Attention Required</h3>
                    <p className="text-sm text-orange-700">{alerts.length} alert{alerts.length !== 1 ? 's' : ''} need your attention</p>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/notifications')}
                    className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {alerts.slice(0, 2).map((alert) => (
                    <div key={alert.id} className="bg-white rounded-lg p-3 border border-orange-100">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          alert.severity === 'high' ? 'bg-red-500' : 
                          alert.severity === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm text-gray-900">{alert.title}</p>
                          <p className="text-xs text-gray-600">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Performance Cards */}
          <motion.div variants={fadeInUp}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Today's Sales */}
              <div 
                onClick={() => router.push('/dashboard/sales')}
                className="bg-white rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="bg-blue-600 p-3 rounded-lg mb-4">
                      <ShoppingCartIcon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {currencySymbol} {todaysSalesTotal.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">Today's Sales</p>
                  </div>
                </div>
              </div>

              {/* Today's Expenses */}
              <div 
                onClick={() => router.push('/dashboard/expenses')}
                className="bg-white rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="bg-red-600 p-3 rounded-lg mb-4">
                      <ReceiptPercentIcon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {currencySymbol} {todaysExpensesTotal.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">Today's Expenses</p>
                  </div>
                </div>
              </div>

              {/* Today's Profit */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="bg-secondary p-3 rounded-lg mb-4">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {currencySymbol} {todaysProfit.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">Today's Profit</p>
                  </div>
                </div>
              </div>

              {/* Total Products */}
              <div 
                onClick={() => router.push('/dashboard/inventory')}
                className="bg-white rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="bg-muted-foreground p-3 rounded-lg mb-4">
                      <ArchiveBoxIcon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {products.length}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">Total Products</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-xl font-bold text-foreground mb-6">Quick Actions</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Record Sale */}
              <div 
                onClick={() => router.push('/dashboard/sales?new=1')} 
                className="bg-green-50 hover:bg-green-100 rounded-xl p-6 cursor-pointer transition-all duration-200 shadow-sm border border-green-200 hover:shadow-md hover:border-green-300"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                    <ShoppingCartIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 text-center">Record Sale</h3>
                  <p className="text-xs text-gray-600 text-center mt-1">Add new sales transaction</p>
                </div>
              </div>
              
              {/* Record Expense */}
              <div 
                onClick={() => router.push('/dashboard/expenses?new=1')} 
                className="bg-blue-50 hover:bg-blue-100 rounded-xl p-6 cursor-pointer transition-all duration-200 shadow-sm border border-blue-200 hover:shadow-md hover:border-blue-300"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                    <ReceiptPercentIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 text-center">Record Expense</h3>
                  <p className="text-xs text-gray-600 text-center mt-1">Track business expenses</p>
              </div>
            </div>
            
              {/* Add Debtor */}
              <div 
                onClick={() => router.push('/dashboard/debtors?new=1')} 
                className="bg-red-50 hover:bg-red-100 rounded-xl p-6 cursor-pointer transition-all duration-200 shadow-sm border border-red-200 hover:shadow-md hover:border-red-300"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                    <UserPlusIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 text-center">Add Debtor</h3>
                  <p className="text-xs text-gray-600 text-center mt-1">Manage credit customers</p>
                </div>
              </div>
              
              {/* View Reports */}
              <div 
                onClick={() => router.push('/dashboard/reports')} 
                className="bg-orange-50 hover:bg-orange-100 rounded-xl p-6 cursor-pointer transition-all duration-200 shadow-sm border border-orange-200 hover:shadow-md hover:border-orange-300"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                    <ChartBarIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 text-center">View Reports</h3>
                  <p className="text-xs text-gray-600 text-center mt-1">Business analytics & insights</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cashflow Snapshot */}
          <motion.div variants={fadeInUp}>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Cashflow Snapshot</h3>
                                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon className="h-4 w-4 text-primary" />
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
                      <ArrowUpIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 font-medium">Sales</p>
                      <p className="text-xl font-bold text-gray-900">{currencySymbol} {weeklySalesTotal.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-sm">
                      <ArrowDownIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 font-medium">Expenses</p>
                      <p className="text-xl font-bold text-gray-900">{currencySymbol} {weeklyExpensesTotal.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className={`rounded-lg p-4 border ${
                  weeklyBalance >= 0 
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
                    : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                      weeklyBalance >= 0 ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      <ArrowTrendingUpIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 font-medium">Net Balance</p>
                      <p className="text-xl font-bold text-gray-900">
                        {weeklyBalance >= 0 ? '+' : ''}{currencySymbol} {weeklyBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

                    {/* Charts and Top Products Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Trends Chart */}
            <motion.div variants={fadeInUp} className="lg:col-span-2">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Trend Analysis</h3>
                <div className="h-64">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            </motion.div>

            {/* Top Selling Products */}
            <motion.div variants={fadeInUp}>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Top Products This Week</h3>
                  <button
                    onClick={() => router.push('/dashboard/reports')}
                    className="text-primary hover:text-primary text-sm font-medium hover:bg-primary/5 px-2 py-1 rounded transition-colors"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {topProducts.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <ArchiveBoxIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No sales data this week</p>
                    </div>
                  ) : (
                    topProducts.map((item, index) => (
                      <div key={item.product.id} className="flex items-center space-x-3 py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                          'bg-gradient-to-br from-orange-400 to-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-600">{item.totalSold} units sold</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{currencySymbol} {item.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>


        </motion.div>
      </DashboardLayout>
      </StaffProtectedRoute>
    </ProtectedRoute>
  )
}
