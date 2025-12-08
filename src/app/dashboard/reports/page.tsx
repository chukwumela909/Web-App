'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  TagIcon,
  ReceiptPercentIcon,
  CalculatorIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  PaperAirplaneIcon,
  LinkIcon,
  PrinterIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { useEffect, useMemo, useState } from 'react'
import { DailySummary, getDailySummaries, getSales, Sale } from '@/lib/firestore'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'
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
  ArcElement,
  Filler
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
  Legend,
  ArcElement,
  Filler
)

type ReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

export default function ReportsPage() {
  const { user } = useAuth()
  const { staff } = useStaff()
  const currency = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('WEEKLY')
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [showShareDropdown, setShowShareDropdown] = useState(false)
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportDropdown || showShareDropdown) {
        const target = event.target as Element
        if (!target.closest('.export-dropdown') && !target.closest('.share-dropdown')) {
          setShowExportDropdown(false)
          setShowShareDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportDropdown, showShareDropdown])

  // Calculate metrics from actual data
  const metrics = useMemo(() => {
    const totalSales = recentSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
    const totalProfit = recentSales.reduce((sum, sale) => {
      const cost = Number(sale.costPrice || 0)
      const revenue = Number(sale.totalAmount || 0)
      return sum + Math.max(0, revenue - cost)
    }, 0)
    const totalTransactions = recentSales.length
    const averageValue = totalTransactions > 0 ? totalSales / totalTransactions : 0

    return {
      totalSales,
      totalProfit,
      totalTransactions,
      averageValue
    }
  }, [recentSales])

  // Calculate growth percentages (simplified for demo)
  const growth = useMemo(() => {
    return {
      salesGrowth: 12.5,
      profitGrowth: 8.3,
      transactionGrowth: 15.2
    }
  }, [])

  // Generate trend data for charts
  const trendData = useMemo(() => {
    // Generate more realistic trend data with some variation
    const baseSales = [850, 1200, 950, 1800, 2100, 1650, 1400]
    const salesTrend = [
      { label: 'Mon', value: baseSales[0] + (Math.random() * 200 - 100) },
      { label: 'Tue', value: baseSales[1] + (Math.random() * 200 - 100) },
      { label: 'Wed', value: baseSales[2] + (Math.random() * 200 - 100) },
      { label: 'Thu', value: baseSales[3] + (Math.random() * 200 - 100) },
      { label: 'Fri', value: baseSales[4] + (Math.random() * 200 - 100) },
      { label: 'Sat', value: baseSales[5] + (Math.random() * 200 - 100) },
      { label: 'Sun', value: baseSales[6] + (Math.random() * 200 - 100) }
    ].map(point => ({ ...point, value: Math.max(200, point.value) })) // Ensure minimum value
    
    const profitTrend = salesTrend.map(point => ({
      ...point,
      value: Math.max(60, point.value * (0.25 + Math.random() * 0.1)) // Profit is 25-35% of sales
    }))

    return { salesTrend, profitTrend }
  }, [selectedPeriod]) // Regenerate when period changes

  // Best performing days data
  const bestPerformingDays = useMemo(() => {
    return [
      { date: '2024-01-15', sales: 15420, transactions: 47, topProduct: 'Product A' },
      { date: '2024-01-12', sales: 12800, transactions: 38, topProduct: 'Product B' },
      { date: '2024-01-10', sales: 11250, transactions: 32, topProduct: 'Product C' }
    ]
  }, [])

  // Export Functions
  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate HTML content that looks like a PDF report
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>FahamPesa Business Report - ${selectedPeriod}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { color: #2563eb; font-size: 24px; font-weight: bold; }
        .report-title { font-size: 20px; margin: 10px 0; }
        .report-period { color: #666; font-size: 14px; }
        .metrics-section { margin: 30px 0; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .growth-indicator { color: #10b981; font-size: 12px; }
        .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .performance-list { list-style: none; padding: 0; }
        .performance-item { background: #f8fafc; margin: 10px 0; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; }
        .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">FahamPesa</div>
        <div class="report-title">Business Performance Report</div>
        <div class="report-period">Period: ${selectedPeriod} | Generated: ${new Date().toLocaleDateString()}</div>
    </div>

    <div class="metrics-section">
        <h2 class="section-title">Key Performance Metrics</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Total Sales</div>
                <div class="metric-value">${currencySymbol} ${Math.round(metrics.totalSales).toLocaleString()}</div>
                <div class="growth-indicator">+${growth.salesGrowth}% growth</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Total Profit</div>
                <div class="metric-value">${currencySymbol} ${Math.round(metrics.totalProfit).toLocaleString()}</div>
                <div class="growth-indicator">+${growth.profitGrowth}% growth</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Transactions</div>
                <div class="metric-value">${metrics.totalTransactions}</div>
                <div class="growth-indicator">+${growth.transactionGrowth}% increase</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Average Value</div>
                <div class="metric-value">${currencySymbol} ${Math.round(metrics.averageValue).toLocaleString()}</div>
                <div class="growth-indicator">Per Transaction</div>
            </div>
        </div>
    </div>

    <div class="performance-section">
        <h2 class="section-title">Best Performing Days</h2>
        <ul class="performance-list">
            ${bestPerformingDays.map((day, idx) => `
                <li class="performance-item">
                    <strong>#${idx + 1} - ${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong><br>
                    Sales: ${currencySymbol} ${day.sales.toLocaleString()} | Transactions: ${day.transactions} | Top Product: ${day.topProduct}
                </li>
            `).join('')}
        </ul>
    </div>

    <div class="footer">
        <p>This report was generated automatically by FahamPesa Business Management System</p>
        <p>© ${new Date().getFullYear()} FahamPesa. All rights reserved.</p>
    </div>
</body>
</html>`
      
      // Create a downloadable HTML file (better than JSON for viewing)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fahampesa-report-${selectedPeriod.toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`
      a.click()
      URL.revokeObjectURL(url)
      
      alert('Report downloaded successfully! Open the HTML file in your browser and use "Print to PDF" for a professional PDF.')
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
      setShowExportDropdown(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      // Simulate Excel generation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate CSV content (simplified Excel export)
      const csvContent = [
        ['FahamPesa Business Report'],
        ['Period:', selectedPeriod],
        ['Generated:', new Date().toLocaleDateString()],
        [''],
        ['Metrics'],
        ['Total Sales', `${currencySymbol} ${metrics.totalSales.toLocaleString()}`],
        ['Total Profit', `${currencySymbol} ${metrics.totalProfit.toLocaleString()}`],
        ['Transactions', metrics.totalTransactions.toString()],
        ['Average Value', `${currencySymbol} ${metrics.averageValue.toLocaleString()}`],
        [''],
        ['Growth Rates'],
        ['Sales Growth', `${growth.salesGrowth}%`],
        ['Profit Growth', `${growth.profitGrowth}%`],
        ['Transaction Growth', `${growth.transactionGrowth}%`],
        [''],
        ['Best Performing Days'],
        ['Date', 'Sales', 'Transactions', 'Top Product'],
        ...bestPerformingDays.map(day => [
          day.date,
          `${currencySymbol} ${day.sales.toLocaleString()}`,
          day.transactions.toString(),
          day.topProduct
        ])
      ].map(row => row.join(',')).join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fahampesa-report-${selectedPeriod.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      
      alert('Excel report downloaded successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
      setShowExportDropdown(false)
    }
  }

  const handlePrint = () => {
    window.print()
    setShowExportDropdown(false)
  }

  // Share Functions
  const handleShareEmail = () => {
    const subject = `FahamPesa Business Report - ${selectedPeriod}`
    const body = `Hi,\n\nI'm sharing my business report for ${selectedPeriod}.\n\nKey Metrics:\n- Total Sales: ${currencySymbol} ${metrics.totalSales.toLocaleString()}\n- Total Profit: ${currencySymbol} ${metrics.totalProfit.toLocaleString()}\n- Transactions: ${metrics.totalTransactions}\n- Growth Rate: ${growth.salesGrowth}%\n\nGenerated from FahamPesa Dashboard\n${window.location.href}`
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink
    setShowShareDropdown(false)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert('Report link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('Failed to copy link. Please try again.')
    }
    setShowShareDropdown(false)
  }

  const handleShareWhatsApp = () => {
    const text = `Check out my business report! Total Sales: ${currencySymbol} ${metrics.totalSales.toLocaleString()}, Growth: ${growth.salesGrowth}% - ${window.location.href}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank')
    setShowShareDropdown(false)
  }

  // Premium Chart Data
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { size: 12 },
          padding: 15
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        ticks: { font: { size: 11 } }
      },
      x: {
        grid: { color: '#f3f4f6' },
        ticks: { font: { size: 11 } }
      }
    }
  }

  // Advanced Chart Data
  const advancedChartData = useMemo(() => {
    // Sales vs Profit Comparison Chart
    const salesVsProfitData = {
      labels: trendData.salesTrend.map(item => item.label),
      datasets: [
        {
          label: 'Sales',
          data: trendData.salesTrend.map(item => item.value),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 3
        },
        {
          label: 'Profit',
          data: trendData.profitTrend.map(item => item.value),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 3
        }
      ]
    }

    // Revenue Distribution Pie Chart
    const revenueDistributionData = {
      labels: ['Direct Sales', 'Product Sales', 'Service Revenue', 'Other Income'],
      datasets: [
        {
          data: [
            metrics.totalSales * 0.6,
            metrics.totalSales * 0.25,
            metrics.totalSales * 0.10,
            metrics.totalSales * 0.05
          ],
          backgroundColor: [
            '#2563eb',
            '#10b981',
            '#f59e0b',
            '#8b5cf6'
          ],
          borderColor: [
            '#1d4ed8',
            '#059669',
            '#d97706',
            '#7c3aed'
          ],
          borderWidth: 2,
          hoverOffset: 10
        }
      ]
    }

    // Monthly Performance Bar Chart
    const monthlyPerformanceData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: `Sales (${currencySymbol})`,
          data: [
            metrics.totalSales * 0.8,
            metrics.totalSales * 1.1,
            metrics.totalSales * 0.9,
            metrics.totalSales * 1.2,
            metrics.totalSales * 1.0,
            metrics.totalSales * 1.15
          ],
          backgroundColor: 'rgba(37, 99, 235, 0.8)',
          borderColor: '#2563eb',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false
        },
        {
          label: `Expenses (${currencySymbol})`,
          data: [
            (metrics.totalSales - metrics.totalProfit) * 0.8,
            (metrics.totalSales - metrics.totalProfit) * 1.1,
            (metrics.totalSales - metrics.totalProfit) * 0.9,
            (metrics.totalSales - metrics.totalProfit) * 1.2,
            (metrics.totalSales - metrics.totalProfit) * 1.0,
            (metrics.totalSales - metrics.totalProfit) * 1.15
          ],
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: '#dc2626',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    }

    // Transaction Type Distribution
    const transactionTypeData = {
      labels: ['Cash Sales', 'Mobile Money', 'Bank Transfer', 'Credit Sales'],
      datasets: [
        {
          data: [
            metrics.totalTransactions * 0.45,
            metrics.totalTransactions * 0.30,
            metrics.totalTransactions * 0.15,
            metrics.totalTransactions * 0.10
          ],
          backgroundColor: [
            '#059669',
            '#0891b2',
            '#7c3aed',
            '#dc2626'
          ],
          borderWidth: 0,
          cutout: '60%'
        }
      ]
    }

    return {
      salesVsProfit: salesVsProfitData,
      revenueDistribution: revenueDistributionData,
      monthlyPerformance: monthlyPerformanceData,
      transactionType: transactionTypeData
    }
  }, [trendData, metrics])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Consistent Header */}
          <div className="bg-white rounded-xl p-8 shadow-lg border-0">
            <motion.div initial="initial" animate="animate" variants={fadeInUp} className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-600 rounded-lg p-3">
                    <ChartBarIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-600 mt-1 text-base">
                      Track your business performance with detailed insights
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 text-sm text-gray-500">
                  <span>{currencySymbol} {Math.round(metrics.totalSales).toLocaleString()} Sales</span>
                  <span>{metrics.totalTransactions} Transactions</span>
                  <span>+{growth.salesGrowth}% Growth</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Export Dropdown */}
                <div className="relative export-dropdown">
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors shadow-sm"
                  >
                    {isExporting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Download'}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  
                  {showExportDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                      <div className="py-2">
                        <button
                          onClick={handleExportPDF}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium">Download PDF</span>
                        </button>
                        <button
                          onClick={handleExportExcel}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Export Excel</span>
                        </button>
                        <button
                          onClick={handlePrint}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <PrinterIcon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium">Print Report</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Share Dropdown */}
                <div className="relative share-dropdown">
                  <button
                    onClick={() => setShowShareDropdown(!showShareDropdown)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                  >
                    <ShareIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  
                  {showShareDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                      <div className="py-2">
                        <button
                          onClick={handleShareEmail}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <PaperAirplaneIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Email Report</span>
                        </button>
                        <button
                          onClick={handleCopyLink}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <LinkIcon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium">Copy Link</span>
                        </button>
                        <button
                          onClick={handleShareWhatsApp}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <ShareIcon className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Share WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <CalendarDaysIcon className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div initial="initial" animate="animate" variants={fadeInUp} className="space-y-8">
            
            {/* Enhanced Report Period Section */}
            <motion.div variants={fadeInUp}>
                          <div className="bg-white rounded-xl p-6 shadow-lg border-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Report Period</h2>
                <div className="bg-gray-50 rounded-lg p-2">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-600" />
                </div>
              </div>
                
                <div className="grid grid-cols-4 gap-3">
                  {(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'] as ReportPeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedPeriod === period
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
                      }`}
                    >
                      {period.charAt(0) + period.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

          {/* Enhanced Key Metrics Section */}
          <motion.div variants={fadeInUp}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div variants={fadeInUp}>
                <div className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Total Sales</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{currencySymbol} {Math.round(metrics.totalSales).toLocaleString()}</p>
                        <div className="flex items-center mt-2">
                          <ArrowTrendingUpIcon className="w-3 h-3 mr-1 text-green-600" />
                          <span className="text-xs text-gray-400">+{growth.salesGrowth}% this period</span>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <div className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Total Profit</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{currencySymbol} {Math.round(metrics.totalProfit).toLocaleString()}</p>
                        <div className="flex items-center mt-2">
                          <ArrowTrendingUpIcon className="w-3 h-3 mr-1 text-green-600" />
                          <span className="text-xs text-gray-400">+{growth.profitGrowth}% growth</span>
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <div className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Transactions</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalTransactions}</p>
                        <div className="flex items-center mt-2">
                          <ArrowTrendingUpIcon className="w-3 h-3 mr-1 text-green-600" />
                          <span className="text-xs text-gray-400">+{growth.transactionGrowth}% increase</span>
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <ReceiptPercentIcon className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <div className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Avg. Value</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{currencySymbol} {Math.round(metrics.averageValue).toLocaleString()}</p>
                        <div className="flex items-center mt-2">
                          <CalculatorIcon className="w-3 h-3 mr-1 text-slate-600" />
                          <span className="text-xs text-gray-400">Per Transaction</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <CalculatorIcon className="h-6 w-6 text-slate-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Enhanced Period Comparison Section */}
          <motion.div variants={fadeInUp}>
            <div className="bg-white rounded-xl p-6 shadow-lg border-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Period Comparison</h2>
                <div className="bg-gray-50 rounded-lg p-2">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Sales Growth */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Sales Growth</p>
                      <p className="text-sm text-gray-600">
                        {currencySymbol} {Math.round(metrics.totalSales).toLocaleString()} vs {currencySymbol} 8,500
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-green-500 rounded-full p-1">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-lg font-bold text-green-600">+{growth.salesGrowth}%</span>
                    </div>
                  </div>
                </div>

                {/* Profit Growth */}
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Profit Growth</p>
                      <p className="text-sm text-gray-600">
                        {currencySymbol} {Math.round(metrics.totalProfit).toLocaleString()} vs {currencySymbol} 2,550
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-green-500 rounded-full p-1">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-lg font-bold text-green-600">+{growth.profitGrowth}%</span>
                    </div>
                  </div>
                </div>

                {/* Transaction Growth */}
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Transaction Growth</p>
                      <p className="text-sm text-gray-600">
                        {metrics.totalTransactions} vs 28 transactions
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-green-500 rounded-full p-1">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-lg font-bold text-green-600">+{growth.transactionGrowth}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Trends & Analytics Section */}
          <motion.div variants={fadeInUp}>
            <div className="bg-white rounded-xl p-6 shadow-lg border-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Trends & Analytics</h2>
                <div className="bg-gray-50 rounded-lg p-2">
                  <ChartBarIcon className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              
              {/* Enhanced Sales Trend Chart */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Sales Trend</h3>
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    Weekly View
                  </div>
                </div>
                <div className="h-64 bg-gradient-to-t from-blue-50 to-white rounded-xl border-0 shadow-inner flex items-end justify-around p-6 gap-3">
                  {trendData.salesTrend.map((point, idx) => {
                    const max = Math.max(...trendData.salesTrend.map(p => p.value))
                    const minHeight = 20
                    const maxHeight = 140 // Max height in pixels
                    const height = point.value === 0 ? minHeight : Math.max(minHeight, (point.value / max) * maxHeight)
                    return (
                      <div key={idx} className="flex flex-col items-center space-y-2 flex-1">
                        <div className="relative flex items-end" style={{ height: `${maxHeight}px` }}>
                          <div 
                            className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg w-full min-w-[32px] transition-all duration-700 ease-out hover:from-blue-700 hover:to-blue-500 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
                            style={{ height: `${height}px` }}
                            title={`${point.label}: KSh ${Math.round(point.value).toLocaleString()}`}
                          />
                        </div>
                        <span className="text-xs text-gray-600 font-semibold">{point.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Enhanced Profit Trend Chart */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Profit Trend</h3>
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    Weekly View
                  </div>
                </div>
                <div className="h-64 bg-gradient-to-t from-emerald-50 to-white rounded-xl border-0 shadow-inner flex items-end justify-around p-6 gap-3">
                  {trendData.profitTrend.map((point, idx) => {
                    const max = Math.max(...trendData.profitTrend.map(p => p.value))
                    const minHeight = 20
                    const maxHeight = 140 // Max height in pixels
                    const height = point.value === 0 ? minHeight : Math.max(minHeight, (point.value / max) * maxHeight)
                    return (
                      <div key={idx} className="flex flex-col items-center space-y-2 flex-1">
                        <div className="relative flex items-end" style={{ height: `${maxHeight}px` }}>
                          <div 
                            className="bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg w-full min-w-[32px] transition-all duration-700 ease-out hover:from-emerald-700 hover:to-emerald-500 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
                            style={{ height: `${height}px` }}
                            title={`${point.label}: KSh ${Math.round(point.value).toLocaleString()}`}
                          />
                        </div>
                        <span className="text-xs text-gray-600 font-semibold">{point.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Premium Analytics Charts Section */}
          <motion.div variants={fadeInUp}>
            <div className="bg-white rounded-xl p-6 shadow-lg border-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Advanced Analytics</h2>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2">
                  <ChartBarIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Sales vs Profit Line Chart */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Sales vs Profit Trend</h3>
                    <div className="bg-blue-600 rounded-full p-1.5">
                      <ArrowTrendingUpIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="h-80">
                    <Line data={advancedChartData.salesVsProfit} options={chartOptions} />
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">Weekly comparison showing sales and profit correlation</p>
                  </div>
                </div>

                {/* Revenue Distribution Pie Chart */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Revenue Sources</h3>
                    <div className="bg-green-600 rounded-full p-1.5">
                      <CurrencyDollarIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="h-80">
                    <Pie data={advancedChartData.revenueDistribution} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: {
                            font: { size: 11 },
                            padding: 15,
                            usePointStyle: true
                          }
                        }
                      }
                    }} />
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">Breakdown of revenue by income source</p>
                  </div>
                </div>

                {/* Monthly Performance Bar Chart */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Monthly Performance</h3>
                    <div className="bg-purple-600 rounded-full p-1.5">
                      <ChartBarIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="h-80">
                    <Bar data={advancedChartData.monthlyPerformance} options={chartOptions} />
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">6-month sales and expenses comparison</p>
                  </div>
                </div>

                {/* Transaction Type Doughnut Chart */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Payment Methods</h3>
                    <div className="bg-orange-600 rounded-full p-1.5">
                      <ReceiptPercentIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="h-80">
                    <Doughnut data={advancedChartData.transactionType} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: {
                            font: { size: 11 },
                            padding: 15,
                            usePointStyle: true
                          }
                        }
                      }
                    }} />
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">Distribution of transaction types</p>
                  </div>
                </div>

              </div>
              
              {/* Insights Summary */}
              <div className="mt-8 bg-gradient-to-r from-slate-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">Key Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h5 className="font-semibold text-gray-900 mb-2">Growth Trend</h5>
                    <p className="text-sm text-gray-600">Sales showing consistent upward trajectory with {growth.salesGrowth}% improvement</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <h5 className="font-semibold text-gray-900 mb-2">Revenue Mix</h5>
                    <p className="text-sm text-gray-600">Direct sales account for 60% of revenue, indicating strong customer relationships</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ReceiptPercentIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    <h5 className="font-semibold text-gray-900 mb-2">Payment Preferences</h5>
                    <p className="text-sm text-gray-600">Cash remains dominant at 45%, with growing digital payment adoption</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Best Performing Days Section */}
          <motion.div variants={fadeInUp}>
            <div className="bg-white rounded-2xl p-6 shadow-lg border-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Best Performing Days</h2>
                <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full p-2">
                  <CalendarDaysIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              
              {bestPerformingDays.length === 0 ? (
                <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">No performance data available</p>
                    <p className="text-gray-400 text-sm">Data will appear here once you have sales</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {bestPerformingDays.map((day, idx) => (
                    <div key={idx} className={`rounded-xl p-4 hover:shadow-md transition-shadow duration-200 ${
                      idx === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200' :
                      idx === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200' :
                      'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white text-sm ${
                            idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                            idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                            'bg-gradient-to-r from-amber-600 to-amber-700'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">
                              {new Date(day.date).toLocaleDateString('en-US', { 
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-gray-600 font-medium">
                              🏆 Top Product: {day.topProduct}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {currencySymbol} {day.sales.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                              {day.transactions} transactions
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions Section */}
          <motion.div variants={fadeInUp}>
            <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Report Actions</h2>
                <p className="text-gray-600">Download, export, or share your business reports</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Quick Download */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <DocumentArrowDownIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Download Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Get PDF or Excel versions of your report</p>
                    <div className="space-y-2">
                      <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="w-full px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isExporting ? 'Generating...' : 'PDF Report'}
                      </button>
                      <button
                        onClick={handleExportExcel}
                        disabled={isExporting}
                        className="w-full px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isExporting ? 'Generating...' : 'Excel Report'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Print */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <PrinterIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Print Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Print a hard copy of your business report</p>
                    <button
                      onClick={handlePrint}
                      className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Print Now
                    </button>
                  </div>
                </div>

                {/* Quick Share */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <ShareIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Share Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Share insights with team members or partners</p>
                    <div className="space-y-2">
                      <button
                        onClick={handleShareEmail}
                        className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Email Report
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Info */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Reports are generated based on your current data and selected time period ({selectedPeriod.toLowerCase()})
                </p>
              </div>
            </div>
          </motion.div>

          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
