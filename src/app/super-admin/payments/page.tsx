'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import AdminRoute from '@/components/auth/AdminRoute'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

// Types for subscriptions from API
interface SubscriptionData {
  id: string
  email: string
  planName: string
  planType: string
  amount: number
  currency: 'KSH' | 'USD'
  status: 'active' | 'expired' | 'failed' | 'pending' | 'cancelled'
  startDate: string | null
  endDate: string | null
  transactionId: string | null
  phoneNumber: string
  createdAt: string
}

interface SubscriptionStats {
  totalRevenue: number
  totalRevenueKSH: number
  totalRevenueUSD: number
  activeSubscriptions: number
  expiredSubscriptions: number
  pendingSubscriptions: number
}

type ChartRange = '30d' | '90d'
type ChartTab = 'kenya' | 'usd'

const chartRanges: { label: string; value: ChartRange }[] = [
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' }
]

const chartTabConfigs: Record<ChartTab, {
  label: string
  currency: 'KSH' | 'USD'
  color: string
}> = {
  kenya: {
    label: 'Active Subscription Kenya (KSH)',
    currency: 'KSH',
    color: '#0B63CE',
  },
  usd: {
    label: 'Active Subscription Outside Kenya (USD)',
    currency: 'USD',
    color: '#179171',
  }
}

// Helper to group subscriptions by week
function getWeekNumber(date: Date, startDate: Date): number {
  const diffTime = date.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 7) + 1
}

function generateChartData(
  subscriptions: SubscriptionData[],
  currency: 'KSH' | 'USD',
  days: number
): { week: string; subscriptions: number; invoice: number; currency: 'KSH' | 'USD' }[] {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - days)
  
  // Filter subscriptions by currency and date range
  const filteredSubs = subscriptions.filter(sub => {
    if (sub.currency !== currency) return false
    if (!sub.createdAt) return false
    const subDate = new Date(sub.createdAt)
    return subDate >= startDate && subDate <= now
  })
  
  // Calculate number of weeks
  const numWeeks = Math.ceil(days / 7)
  
  // Initialize weeks
  const weeks: { week: string; subscriptions: number; invoice: number; currency: 'KSH' | 'USD' }[] = []
  for (let i = 1; i <= numWeeks; i++) {
    weeks.push({ week: `Week ${i}`, subscriptions: 0, invoice: 0, currency })
  }
  
  // Group subscriptions by week
  filteredSubs.forEach(sub => {
    const subDate = new Date(sub.createdAt)
    const weekNum = getWeekNumber(subDate, startDate)
    if (weekNum >= 1 && weekNum <= numWeeks) {
      weeks[weekNum - 1].subscriptions += 1
      // Only count active/expired subscriptions in revenue (not failed/pending)
      if (sub.status === 'active' || sub.status === 'expired') {
        weeks[weekNum - 1].invoice += sub.amount || 0
      }
    }
  })
  
  return weeks
}

const formatCurrencyShort = (currency: 'KSH' | 'USD', value: number) => {
  if (value >= 1000) {
    const short = `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`
    return currency === 'USD' ? `$ ${short}` : `KSH ${short}`
  }
  return currency === 'USD' ? `$ ${value.toLocaleString()}` : `KSH ${value.toLocaleString()}`
}

// Helper to format date
const formatDate = (dateString: string | null) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-')
  } catch {
    return dateString
  }
}

const getStatusBadge = (status: SubscriptionData['status']) => {
  const configs: Record<SubscriptionData['status'], { bg: string; text: string; dot: string; label: string }> = {
    active: {
      bg: 'bg-[#ecfdf3]',
      text: 'text-[#027a48]',
      dot: '/assets/figma/payments/dot-green.svg',
      label: 'Active'
    },
    expired: {
      bg: 'bg-zinc-100',
      text: 'text-[#717171]',
      dot: '/assets/figma/payments/dot-gray.svg',
      label: 'Expired'
    },
    failed: {
      bg: 'bg-[#fef3f2]',
      text: 'text-[#f04438]',
      dot: '/assets/figma/payments/dot-red.svg',
      label: 'Failed'
    },
    pending: {
      bg: 'bg-[#fffaeb]',
      text: 'text-[#b54708]',
      dot: '/assets/figma/payments/dot-yellow.svg',
      label: 'Pending'
    },
    cancelled: {
      bg: 'bg-[#fef3f2]',
      text: 'text-[#f04438]',
      dot: '/assets/figma/payments/dot-red.svg',
      label: 'Cancelled'
    }
  }
  return configs[status] || configs.expired
}

const CashflowTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const point = payload[0].payload as { subscriptions: number; invoice: number; currency: 'KSH' | 'USD' }
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-sm text-slate-600">Subscriptions: {point.subscriptions}</p>
      <p className="text-sm text-slate-600">Invoice: {formatCurrencyShort(point.currency, point.invoice)}</p>
    </div>
  )
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState<ChartTab>('kenya')
  const [range, setRange] = useState<ChartRange>('30d')
  const [searchEmail, setSearchEmail] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionData['status']>('all')
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  const [extendModalOpen, setExtendModalOpen] = useState(false)
  const [revokeModalOpen, setRevokeModalOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionData | null>(null)
  const [extendDuration, setExtendDuration] = useState('')
  
  // Subscription data from API
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Fetch subscriptions from API
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/admin/subscriptions?includeStats=true')
        if (!response.ok) {
          throw new Error('Failed to fetch subscriptions')
        }
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
        setStats(data.stats || null)
      } catch (error) {
        console.error('Error fetching subscriptions:', error)
        toast({
          title: 'Error',
          description: 'Failed to load subscriptions',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSubscriptions()
  }, [toast])

  // Generate metrics from stats
  const metrics = useMemo(() => {
    if (!stats) {
      return [
        {
          label: 'Total Revenue',
          value: 'KSH 0',
          helper: '(+0 USD)',
          iconSrc: '/assets/figma/payments/total-revenue-icon.svg',
          iconAlt: 'revenue'
        },
        {
          label: 'Active Subscriptions',
          value: '0',
          helper: 'Total Active',
          iconSrc: '/assets/figma/payments/active-subscription-icon.svg',
          iconAlt: 'active'
        },
        {
          label: 'Expired Subscriptions',
          value: '0',
          helper: 'Total Expired',
          iconSrc: '/assets/figma/payments/expired-subscription-icon.svg',
          iconAlt: 'expired'
        },
        {
          label: 'Pending Subscriptions',
          value: '0',
          helper: 'Total Pending',
          iconSrc: '/assets/figma/payments/pending-subscription-icon.svg',
          iconAlt: 'pending'
        }
      ]
    }
    
    return [
      {
        label: 'Total Revenue',
        value: formatCurrencyShort('KSH', stats.totalRevenueKSH),
        helper: `(+${formatCurrencyShort('USD', stats.totalRevenueUSD)})`,
        iconSrc: '/assets/figma/payments/total-revenue-icon.svg',
        iconAlt: 'revenue'
      },
      {
        label: 'Active Subscriptions',
        value: stats.activeSubscriptions.toString(),
        helper: 'Total Active',
        iconSrc: '/assets/figma/payments/active-subscription-icon.svg',
        iconAlt: 'active'
      },
      {
        label: 'Expired Subscriptions',
        value: stats.expiredSubscriptions.toString(),
        helper: 'Total Expired',
        iconSrc: '/assets/figma/payments/expired-subscription-icon.svg',
        iconAlt: 'expired'
      },
      {
        label: 'Pending Subscriptions',
        value: stats.pendingSubscriptions.toString(),
        helper: 'Total Pending',
        iconSrc: '/assets/figma/payments/pending-subscription-icon.svg',
        iconAlt: 'pending'
      }
    ]
  }, [stats])

  const activeConfig = chartTabConfigs[activeTab]
  
  // Generate chart data from real subscriptions
  const chartData = useMemo(() => {
    const days = range === '30d' ? 30 : 90
    return generateChartData(subscriptions, activeConfig.currency, days)
  }, [subscriptions, activeConfig.currency, range])

  const summary = useMemo(() => {
    const subscriptionsTotal = chartData.reduce((sum, entry) => sum + entry.subscriptions, 0)
    const invoiceTotal = chartData.reduce((sum, entry) => sum + entry.invoice, 0)
    return {
      subscriptions: subscriptionsTotal,
      invoice: formatCurrencyShort(activeConfig.currency, invoiceTotal)
    }
  }, [chartData, activeConfig.currency])

  // Handler to activate a pending subscription
  const handleActivateSubscription = async (subscription: SubscriptionData) => {
    try {
      setIsActionLoading(true)
      const response = await fetch('/api/admin/subscriptions/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          transactionId: `MANUAL-ADMIN-${Date.now()}`
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate subscription')
      }
      
      toast({
        title: 'Success',
        description: `Subscription for ${subscription.email} has been activated`,
        variant: 'default'
      })
      
      // Refresh the subscriptions list
      const refreshResponse = await fetch('/api/admin/subscriptions?includeStats=true')
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        setSubscriptions(refreshData.subscriptions || [])
        setStats(refreshData.stats || null)
      }
      
      setOpenPopoverId(null)
    } catch (error) {
      console.error('Error activating subscription:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to activate subscription',
        variant: 'destructive'
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesEmail = searchEmail === '' || sub.email.toLowerCase().includes(searchEmail.toLowerCase())
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
      return matchesEmail && matchesStatus
    })
  }, [searchEmail, statusFilter, subscriptions])

  return (
    <AdminRoute requiredPermission="payments_subscriptions">
      <div className="flex-1 space-y-8 p-8 pt-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-black text-[#0F172A]">Payments &amp; Subscriptions</h1>
          <p className="text-base text-[#717171]">
            Monitor and manage Payment for all users
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-black/60 bg-white px-6 py-5 shadow-sm"
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="text-base font-semibold text-[#717171]">{metric.label}</p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full ">
                  <Image
                    src={metric.iconSrc}
                    alt={metric.iconAlt}
                    width={20}
                    height={20}
                  />
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-semibold text-[#001223]">{metric.value}</p>
                <p className="text-xs text-[#717171]">{metric.helper}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Tab Controls */}
        <div className="flex gap-4 rounded-lg bg-zinc-100 p-1.5">
          {Object.entries(chartTabConfigs).map(([key, config]) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key as ChartTab)}
              className={`flex h-10 flex-1 items-center justify-center gap-2.5 rounded-lg px-2.5 text-base font-semibold transition-all ${
                activeTab === key
                  ? 'bg-white text-black shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]'
                  : 'bg-transparent text-[#717171]'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Chart Card */}
        <section className="rounded-xl border border-black bg-white p-5">
          <div className="mb-5 flex items-start justify-between">
            <p className="text-2xl font-semibold text-black">Cash Flow</p>

            <Select value={range} onValueChange={(value: ChartRange) => setRange(value)}>
              <SelectTrigger className="h-10 w-40 rounded-lg border-[#B6BABF] text-base text-[#717171]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {chartRanges.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_160px]">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#D0D5DD" strokeDasharray="5 5" vertical={false} />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fill: '#717171', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fill: '#717171', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                    width={25}
                    dx={-5}
                  />
                  <Tooltip content={<CashflowTooltip />} cursor={{ stroke: activeConfig.color, strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="subscriptions"
                    stroke={activeConfig.color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cashflowGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <aside className="space-y-[26px] mt-32">
              <div>
                <p className="text-xs font-medium text-[#257dc1]">Subscriptions</p>
                <p className="text-[32px] font-semibold leading-none text-[#001223]">{summary.subscriptions}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#0f866c]">Invoice</p>
                <p className="text-[32px] font-semibold leading-none text-[#001223]">{summary.invoice}</p>
              </div>
            </aside>
          </div>
        </section>

        {/* All Invoices Table */}
        <section className="rounded-xl border border-[#222222] bg-white p-4">
          <div className="mb-[30px] flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#001223]">All Invoices</h2>
            
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search user by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="h-10 rounded-lg border border-[#b6babf] px-4 text-base text-[#717171] outline-none focus:border-[#717171]"
              />
              
              <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="h-10 w-[119px] rounded-lg border-[#b6babf] text-base">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            {/* Table Header */}
            <div className="flex items-center gap-5 rounded-lg bg-zinc-100 px-2 py-0">
              <div className="w-[250px] p-2.5">
                <p className="text-sm text-[#717171]">Email</p>
              </div>
              <div className="w-[172px] p-2.5">
                <p className="text-sm text-[#717171]">Plan Name</p>
              </div>
              <div className="flex-1 p-2.5">
                <p className="text-sm text-[#717171]">Amount</p>
              </div>
              <div className="flex-1 p-2.5">
                <p className="text-sm text-[#717171]">Start Date</p>
              </div>
              <div className="flex-1 p-2.5">
                <p className="text-sm text-[#717171]">Due Date</p>
              </div>
              <div className="flex-1 p-2.5">
                <p className="text-sm text-[#717171]">Status</p>
              </div>
              <div className="flex-1 p-2.5">
                <p className="text-sm text-[#717171]">Actions</p>
              </div>
            </div>

            {/* Table Rows */}
            {isLoading ? (
              <div className="py-8 text-center">
                <p className="text-base text-[#717171]">Loading subscriptions...</p>
              </div>
            ) : (
              filteredSubscriptions.map((sub) => {
                const statusBadge = getStatusBadge(sub.status)
                return (
                  <div key={sub.id} className="flex items-center gap-5 rounded-lg px-2 py-0">
                    <div className="w-[250px] p-2.5">
                      <p className="text-sm text-[#222222] truncate">{sub.email}</p>
                    </div>
                    <div className="w-[172px] p-2.5">
                      <p className="text-sm text-[#222222]">{sub.planName}</p>
                    </div>
                    <div className="flex-1 p-2.5">
                      <p className="text-sm whitespace-nowrap">
                        <span className="text-[#717171]">{sub.currency === 'USD' ? '$' : sub.currency} </span>
                        <span className="text-black">{formatCurrencyShort(sub.currency, sub.amount).replace(/^(KSH|USD|\$)\s*/, '')}</span>
                      </p>
                    </div>
                    <div className="flex-1 p-2.5">
                      <p className="text-sm text-[#222222] whitespace-nowrap">{formatDate(sub.startDate)}</p>
                    </div>
                    <div className="flex-1 p-2.5">
                      <p className="text-sm text-[#222222] whitespace-nowrap">{formatDate(sub.endDate)}</p>
                    </div>
                    <div className="flex-1 px-2.5 py-1.5">
                      <div className="inline-flex">
                        <div className={`flex items-center justify-center gap-1.5 rounded-2xl ${statusBadge.bg} px-2 py-1`}>
                          <Image src={statusBadge.dot} alt="" width={8} height={8} />
                          <span className={`text-sm font-medium leading-[18px] ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-1 items-center justify-center p-2.5">
                      <Popover open={openPopoverId === sub.id} onOpenChange={(open: boolean) => setOpenPopoverId(open ? sub.id : null)}>
                        <PopoverTrigger asChild>
                          <button className="flex h-6 w-6 items-center justify-center">
                            <Image src="/assets/figma/payments/more-icon.svg" alt="Actions" width={24} height={24} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] rounded-lg border border-black bg-white p-0 shadow-lg" align="end" sideOffset={5}>
                          <div className="flex flex-col gap-1.5">
                            <div className="border-b border-[#e5e9eb] p-2">
                              <p className="text-base font-semibold text-black">User Actions</p>
                            </div>
                            {/* Show Activate button only for pending subscriptions */}
                            {sub.status === 'pending' && (
                              <>
                                <button 
                                  className="mx-2 mb-1 flex items-center justify-center gap-2.5 rounded-md px-4 py-2 text-base text-white bg-green-600 transition-colors hover:bg-green-700 disabled:opacity-50"
                                  onClick={() => handleActivateSubscription(sub)}
                                  disabled={isActionLoading}
                                >
                                  {isActionLoading ? 'Activating...' : 'Activate Subscription'}
                                </button>
                                <div className="h-px bg-[#e5e9eb]" />
                              </>
                            )}
                            <button 
                              className="mx-2 mb-1 flex items-center justify-center gap-2.5 rounded-md px-4 py-2 text-base text-black transition-colors hover:bg-[#257dc1] hover:text-white"
                              onClick={() => {
                                setSelectedSubscription(sub)
                                setExtendModalOpen(true)
                                setOpenPopoverId(null)
                              }}
                            >
                              Extend Subscription
                            </button>
                            <div className=" h-px bg-[#e5e9eb]" />
                            <button 
                              className="mx-2 mb-1 flex items-center justify-center gap-2.5 rounded-md px-4 py-2 text-base text-black transition-colors hover:bg-[#257dc1] hover:text-white"
                              onClick={() => {
                                setSelectedSubscription(sub)
                                setRevokeModalOpen(true)
                                setOpenPopoverId(null)
                              }}
                            >
                              Revoke Subscription
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )
              })
            )}

            {!isLoading && filteredSubscriptions.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-base text-[#717171]">No subscriptions found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="mt-[30px] flex items-center justify-between border-t border-[#eaecf0] px-6 pb-4 pt-3">
            <p className="text-sm font-medium leading-5 text-[#717171]">Page 1 of 1</p>
            <div className="flex gap-3">
              <button className="rounded-lg border border-[#d0d5dd] bg-white px-3.5 py-2">
                <span className="text-sm font-medium leading-5 text-[#d7d7d7]">Previous</span>
              </button>
              <button className="rounded-lg border border-[#d0d5dd] bg-white px-3.5 py-2">
                <span className="text-sm font-medium leading-5 text-[#717171]">Next</span>
              </button>
            </div>
          </div>
        </section>

        {/* <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-muted-foreground/40 bg-card/30 p-12 text-center">
          <p className="text-lg font-semibold text-foreground">Figma design coming soon</p>
          <p className="text-sm text-muted-foreground">
            We&rsquo;ll plug in the remaining payment dashboards once the next handoff arrives.
          </p>
        </div> */}
      </div>

      {/* Extend Subscription Modal */}
      <Dialog open={extendModalOpen} onOpenChange={setExtendModalOpen}>
        <DialogContent className="max-w-[704px] rounded-2xl border border-black bg-white p-6">
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-semibold text-black">Extend Subscription</h2>
              <p className="text-base font-medium text-[#717171]">Manually extend User Subscription Plan</p>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-5">
              {/* Current Plan */}
              <div className="flex flex-col gap-[5px]">
                <label className="text-base font-medium text-[#191d23]">Current plan</label>
                <div className="flex h-10 items-center rounded-lg border border-[#b6babf] px-4 py-2.5">
                  <p className="text-base text-black">{selectedSubscription?.planName}</p>
                </div>
              </div>

              {/* Start Date and Due Date */}
              <div className="flex gap-5">
                <div className="flex flex-1 flex-col gap-[5px]">
                  <label className="text-base font-medium text-[#191d23]">Start Date</label>
                  <div className="flex h-10 items-center rounded-lg border border-[#b6babf] px-4 py-2.5">
                    <p className="text-base text-[#717171]">{formatDate(selectedSubscription?.startDate || null)}</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-[5px]">
                  <label className="text-base font-medium text-[#191d23]">End Date</label>
                  <div className="flex h-10 items-center rounded-lg border border-[#b6babf] px-4 py-2.5">
                    <p className="text-base text-[#717171]">{formatDate(selectedSubscription?.endDate || null)}</p>
                  </div>
                </div>
              </div>

              {/* Extend Plan Dropdown */}
              <div className="flex flex-col gap-[5px]">
                <label className="text-base font-medium text-[#191d23]">Extend plan</label>
                <Select value={extendDuration} onValueChange={setExtendDuration}>
                  <SelectTrigger className="h-10 rounded-lg border-[#b6babf] text-base">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-month">1 month</SelectItem>
                    <SelectItem value="2-months">2 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-5">
              <button
                onClick={() => {
                  setExtendModalOpen(false)
                  setExtendDuration('')
                }}
                disabled={isActionLoading}
                className="flex h-12 w-[103px] items-center justify-center rounded-lg border border-[#b6babf] bg-white px-4 py-3 text-base font-medium text-[#555555] transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedSubscription || !extendDuration || !user?.uid) return
                  
                  try {
                    setIsActionLoading(true)
                    const response = await fetch('/api/admin/subscriptions/extend', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        subscriptionId: selectedSubscription.id,
                        duration: extendDuration,
                        adminId: user.uid,
                        reason: `Extended by admin for ${extendDuration}`
                      })
                    })
                    
                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Failed to extend subscription')
                    }
                    
                    toast({
                      title: 'Success',
                      description: `Subscription extended by ${extendDuration.replace('-', ' ')}`
                    })
                    
                    // Refresh subscriptions
                    const refreshResponse = await fetch('/api/admin/subscriptions?includeStats=true')
                    if (refreshResponse.ok) {
                      const data = await refreshResponse.json()
                      setSubscriptions(data.subscriptions || [])
                      setStats(data.stats || null)
                    }
                    
                    setExtendModalOpen(false)
                    setExtendDuration('')
                    setSelectedSubscription(null)
                  } catch (error) {
                    console.error('Error extending subscription:', error)
                    toast({
                      title: 'Error',
                      description: error instanceof Error ? error.message : 'Failed to extend subscription',
                      variant: 'destructive'
                    })
                  } finally {
                    setIsActionLoading(false)
                  }
                }}
                disabled={!extendDuration || isActionLoading}
                className="flex h-12 w-[220px] items-center justify-center rounded-lg bg-[#257dc1] px-4 py-3 text-base font-bold text-white transition-colors hover:bg-[#1e6aa8] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isActionLoading ? 'Extending...' : 'Extend Subscription'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Subscription Modal */}
      <Dialog open={revokeModalOpen} onOpenChange={setRevokeModalOpen}>
        <DialogContent className="max-w-[520px] rounded-2xl border border-black bg-white p-6">
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold text-[#f04438] uppercase tracking-wide">REVOKE SUBSCRIPTION</h2>
              <h3 className="text-2xl font-semibold text-black">You&apos;re about to cancel this user&apos;s subscription</h3>
              <p className="text-base text-[#717171]">
                Once the subscription is canceled, the user will lose access to the FahampPesa Pro Features
              </p>
            </div>

            {/* Features List */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f04438]">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L3 9M3 3L9 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-base text-[#555555]">User will lose access to Debtors record</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f04438]">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L3 9M3 3L9 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-base text-[#555555]">User will lose access to Unlimited Branches</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f04438]">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L3 9M3 3L9 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-base text-[#555555]">User will lose access to Advanced reports (Profit)</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f04438]">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L3 9M3 3L9 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-base text-[#555555]">Staff Management & Permissions</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f04438]">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L3 9M3 3L9 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-base text-[#555555]">Sync across Mobile, Web, and Desktop</p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  setRevokeModalOpen(false)
                  setSelectedSubscription(null)
                }}
                disabled={isActionLoading}
                className="flex h-12 items-center justify-center rounded-lg border border-[#b6babf] bg-white px-6 py-3 text-base font-medium text-[#555555] transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Leave subscription
              </button>
              <button
                onClick={async () => {
                  if (!selectedSubscription || !user?.uid) return
                  
                  try {
                    setIsActionLoading(true)
                    const response = await fetch('/api/admin/subscriptions/revoke', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        subscriptionId: selectedSubscription.id,
                        adminId: user.uid,
                        reason: 'Revoked by admin'
                      })
                    })
                    
                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Failed to revoke subscription')
                    }
                    
                    toast({
                      title: 'Subscription Revoked',
                      description: `Subscription for ${selectedSubscription.email} has been cancelled`
                    })
                    
                    // Refresh subscriptions
                    const refreshResponse = await fetch('/api/admin/subscriptions?includeStats=true')
                    if (refreshResponse.ok) {
                      const data = await refreshResponse.json()
                      setSubscriptions(data.subscriptions || [])
                      setStats(data.stats || null)
                    }
                    
                    setRevokeModalOpen(false)
                    setSelectedSubscription(null)
                  } catch (error) {
                    console.error('Error revoking subscription:', error)
                    toast({
                      title: 'Error',
                      description: error instanceof Error ? error.message : 'Failed to revoke subscription',
                      variant: 'destructive'
                    })
                  } finally {
                    setIsActionLoading(false)
                  }
                }}
                disabled={isActionLoading}
                className="flex h-12 items-center justify-center rounded-lg bg-[#f04438] px-6 py-3 text-base font-bold text-white transition-colors hover:bg-[#d63b2f] disabled:opacity-50"
              >
                {isActionLoading ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminRoute>
  )
}
