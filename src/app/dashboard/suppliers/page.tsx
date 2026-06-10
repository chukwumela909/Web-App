'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useBranch } from '@/contexts/BranchContext'
import { useStaff } from '@/contexts/StaffContext'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import {
  TruckIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { UpgradeModal } from '@/components/UpgradeModal'
import {
  createSupplier as createSupplierRecord,
  getSupplierDashboard,
  getSuppliers
} from '@/lib/suppliers-service'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts'

interface Supplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone: string
  address: string
  categories: string[]
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION'
  onTimeDeliveryRate: number
  totalOrders: number
  completedOrders: number
  qualityRating?: number
  serviceRating?: number
  pricingRating?: number
  paymentTerms: string
  notes?: string
  createdAt?: Date
  lastOrderDate?: Date
  branchId?: string | null
}

interface SupplierDashboard {
  totalSuppliers: number
  activeSuppliers: number
  topSuppliers: {
    supplierId: string
    supplierName: string
    totalOrders: number
    totalAmount: number
    onTimeDeliveryRate: number
  }[]
  recentOrders: any[]
  pendingApprovals: number
  overdueDeliveries: number
}

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

function normalizeSupplierForDisplay(supplier: Partial<Supplier> & { id: string }): Supplier {
  return {
    id: supplier.id,
    name: supplier.name || 'Unnamed supplier',
    contactPerson: supplier.contactPerson || '',
    email: supplier.email || '',
    phone: supplier.phone || '',
    address: supplier.address || '',
    categories: Array.isArray(supplier.categories) ? supplier.categories : [],
    status: supplier.status || 'ACTIVE',
    onTimeDeliveryRate: Number(supplier.onTimeDeliveryRate || 0),
    totalOrders: Number(supplier.totalOrders || 0),
    completedOrders: Number(supplier.completedOrders || 0),
    qualityRating: supplier.qualityRating,
    serviceRating: supplier.serviceRating,
    pricingRating: supplier.pricingRating,
    paymentTerms: supplier.paymentTerms || 'NET_30',
    notes: supplier.notes || '',
    createdAt: supplier.createdAt,
    lastOrderDate: supplier.lastOrderDate,
    branchId: supplier.branchId || null
  }
}

const PERFORMANCE_COLORS = {
  excellent: '#22c55e',
  good: '#f59e0b',
  needsAttention: '#ef4444'
}

function shortLabel(name: string) {
  return name.length <= 14 ? name : `${name.slice(0, 13)}…`
}

function getRateColor(rate: number) {
  if (rate >= 90) return PERFORMANCE_COLORS.excellent
  if (rate >= 70) return PERFORMANCE_COLORS.good
  return PERFORMANCE_COLORS.needsAttention
}

function getScoreColor(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-700'
  if (score >= 60) return 'bg-amber-100 text-amber-700'
  if (score >= 40) return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

interface SupplierPerformanceTabProps {
  suppliers: Supplier[]
  renderStars: (rating: number) => ReactNode
}

function SupplierPerformanceTab({ suppliers, renderStars }: SupplierPerformanceTabProps) {
  const analytics = useMemo(() => {
    const withOrders = suppliers.filter(s => (s.totalOrders || 0) > 0)
    const totalOrders = suppliers.reduce((sum, s) => sum + (s.totalOrders || 0), 0)
    const totalCompleted = suppliers.reduce((sum, s) => sum + (s.completedOrders || 0), 0)
    const fulfillmentRate = totalOrders > 0 ? Math.round((totalCompleted / totalOrders) * 100) : 0
    const avgOnTime = withOrders.length > 0
      ? Math.round(withOrders.reduce((sum, s) => sum + (s.onTimeDeliveryRate || 0), 0) / withOrders.length)
      : 0

    const ratingAverage = (key: 'qualityRating' | 'serviceRating' | 'pricingRating') => {
      const values = suppliers
        .map(s => s[key])
        .filter((v): v is number => typeof v === 'number' && v > 0)
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    }
    const avgQuality = ratingAverage('qualityRating')
    const avgService = ratingAverage('serviceRating')
    const avgPricing = ratingAverage('pricingRating')
    const ratedValues = [avgQuality, avgService, avgPricing].filter(v => v > 0)
    const avgOverall = ratedValues.length > 0
      ? ratedValues.reduce((a, b) => a + b, 0) / ratedValues.length
      : 0

    const excellent = withOrders.filter(s => (s.onTimeDeliveryRate || 0) >= 90).length
    const good = withOrders.filter(s => (s.onTimeDeliveryRate || 0) >= 70 && (s.onTimeDeliveryRate || 0) < 90).length
    const needsAttention = withOrders.filter(s => (s.onTimeDeliveryRate || 0) < 70).length

    const distribution = [
      { name: 'Excellent', detail: '≥ 90% on-time', value: excellent, fill: PERFORMANCE_COLORS.excellent },
      { name: 'Good', detail: '70–89% on-time', value: good, fill: PERFORMANCE_COLORS.good },
      { name: 'Needs Attention', detail: '< 70% on-time', value: needsAttention, fill: PERFORMANCE_COLORS.needsAttention }
    ]

    const topByOrders = [...withOrders]
      .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
      .slice(0, 8)
      .map(s => ({
        name: shortLabel(s.name),
        fullName: s.name,
        onTime: Math.round(s.onTimeDeliveryRate || 0),
        orders: s.totalOrders || 0,
        fill: getRateColor(s.onTimeDeliveryRate || 0)
      }))

    const ranked = suppliers
      .map(s => {
        const orders = s.totalOrders || 0
        const completed = s.completedOrders || 0
        const hasOrders = orders > 0
        const fulfillment = hasOrders ? Math.round((completed / orders) * 100) : 0
        const ratingValues = [s.qualityRating, s.serviceRating, s.pricingRating]
          .filter((v): v is number => typeof v === 'number' && v > 0)
        const avgRating = ratingValues.length > 0
          ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
          : 0
        const effectiveOnTime = hasOrders ? (s.onTimeDeliveryRate || 0) : 0
        const score = Math.round(effectiveOnTime * 0.45 + fulfillment * 0.3 + (avgRating / 5) * 100 * 0.25)
        return { supplier: s, orders, fulfillment, avgRating, onTime: Math.round(s.onTimeDeliveryRate || 0), hasOrders, score }
      })
      .sort((a, b) => b.score - a.score)

    return {
      totalOrders,
      fulfillmentRate,
      avgOnTime,
      avgQuality,
      avgService,
      avgPricing,
      avgOverall,
      distribution,
      topByOrders,
      ranked,
      hasOrderData: withOrders.length > 0
    }
  }, [suppliers])

  if (suppliers.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Performance Data Yet</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Add suppliers and record purchase orders to start tracking delivery performance, fulfillment rates, and quality ratings here.
          </p>
        </div>
      </Card>
    )
  }

  const SupplierTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900">{data.fullName}</p>
          <p className="text-sm text-gray-600">On-time delivery: <span className="font-medium text-gray-900">{data.onTime}%</span></p>
          <p className="text-sm text-gray-600">Total orders: <span className="font-medium text-gray-900">{data.orders}</span></p>
        </div>
      )
    }
    return null
  }

  const ratingRows = [
    { label: 'Quality', value: analytics.avgQuality, bar: 'bg-emerald-500' },
    { label: 'Service', value: analytics.avgService, bar: 'bg-blue-500' },
    { label: 'Pricing', value: analytics.avgPricing, bar: 'bg-violet-500' }
  ]

  const distributionWithValues = analytics.distribution.filter(d => d.value > 0)
  const orderVolumeHeight = Math.max(240, analytics.topByOrders.length * 44)

  return (
    <div className="space-y-6">
      {!analytics.hasOrderData && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <ClockIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>
            Delivery and fulfillment metrics will populate as purchase orders are recorded and received. Quality
            ratings you enter are reflected below.
          </span>
        </div>
      )}

      {/* Key performance indicators */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeInUp}>
          <Card className="dashboard-panel transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Avg On-Time Delivery</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.avgOnTime}%</p>
                  <p className="text-xs text-gray-400 mt-1">Across suppliers with orders</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="dashboard-panel transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Order Fulfillment</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.fulfillmentRate}%</p>
                  <p className="text-xs text-gray-400 mt-1">Completed of all orders</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="dashboard-panel transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Avg Rating</p>
                  {analytics.avgOverall > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.avgOverall.toFixed(1)}<span className="text-base font-medium text-gray-400">/5</span></p>
                      <div className="flex mt-1">{renderStars(analytics.avgOverall)}</div>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900 mt-1">—</p>
                      <p className="text-xs text-gray-400 mt-1">No ratings recorded</p>
                    </>
                  )}
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <StarIcon className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="dashboard-panel transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.totalOrders.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">Lifetime purchase orders</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3">
                  <TruckIcon className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* On-time delivery + distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">On-Time Delivery by Supplier</h2>
                <p className="text-sm text-gray-500">Top suppliers ranked by order volume</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            {analytics.topByOrders.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topByOrders} margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<SupplierTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                    <Bar dataKey="onTime" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {analytics.topByOrders.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-center">
                <TruckIcon className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No delivery data yet</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="border-0 shadow-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Delivery Performance</h2>
                <p className="text-sm text-gray-500">Reliability breakdown</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            {distributionWithValues.length > 0 ? (
              <>
                <div className="relative h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionWithValues}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={80}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {distributionWithValues.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any) => [`${value} supplier${value === 1 ? '' : 's'}`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-gray-900">{analytics.avgOnTime}%</span>
                    <span className="text-xs text-gray-400">avg on-time</span>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  {analytics.distribution.map(item => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-gray-700">{item.name}</span>
                        <span className="text-gray-400 text-xs">{item.detail}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <ChartBarIcon className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No delivery data to chart yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Ratings + order volume */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Service Quality</h2>
              <div className="bg-yellow-50 rounded-lg p-2">
                <StarIcon className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
            <div className="space-y-5">
              {ratingRows.map(row => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-semibold text-gray-900">
                      {row.value > 0 ? `${row.value.toFixed(1)} / 5` : 'Not rated'}
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2.5 w-full">
                    <div
                      className={`${row.bar} h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${(row.value / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-lg lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Order Volume by Supplier</h2>
                <p className="text-sm text-gray-500">Most active supply relationships</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-2">
                <TruckIcon className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            {analytics.topByOrders.length > 0 ? (
              <div style={{ height: orderVolumeHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={analytics.topByOrders}
                    margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={110} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<SupplierTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                    <Bar dataKey="orders" fill="#6366f1" radius={[0, 6, 6, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center text-center">
                <TruckIcon className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No order volume to chart yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Performance leaderboard */}
      <Card className="border-0 shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Supplier Performance Leaderboard</h2>
              <p className="text-sm text-gray-500">Ranked by a blended score of on-time delivery, fulfillment, and ratings</p>
            </div>
            <div className="bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full p-2">
              <TrophyIcon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-3 pr-4 font-medium">#</th>
                  <th className="py-3 pr-4 font-medium">Supplier</th>
                  <th className="py-3 px-4 font-medium text-right">Orders</th>
                  <th className="py-3 px-4 font-medium text-right">On-Time</th>
                  <th className="py-3 px-4 font-medium text-right">Fulfillment</th>
                  <th className="py-3 px-4 font-medium text-right">Rating</th>
                  <th className="py-3 pl-4 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {analytics.ranked.slice(0, 10).map((row, index) => (
                  <tr key={row.supplier.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 pr-4">
                      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                        'bg-gray-300'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-gray-900">{row.supplier.name}</p>
                      {!row.hasOrders && <p className="text-xs text-gray-400">No orders yet</p>}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{row.orders}</td>
                    <td className="py-3 px-4 text-right">
                      {row.hasOrders ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.onTime >= 90 ? 'bg-green-100 text-green-700' :
                          row.onTime >= 70 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {row.onTime}%
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{row.hasOrders ? `${row.fulfillment}%` : <span className="text-gray-300">—</span>}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{row.avgRating > 0 ? row.avgRating.toFixed(1) : <span className="text-gray-300">—</span>}</td>
                    <td className="py-3 pl-4 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getScoreColor(row.score)}`}>
                        {row.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {analytics.ranked.length > 10 && (
            <p className="text-xs text-gray-400 mt-4 text-center">
              Showing top 10 of {analytics.ranked.length} suppliers
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}

function SuppliersContent() {
  const { user } = useAuth()
  const { staff } = useStaff()
  const { selectedBranchId, selectedBranch } = useBranch()
  const currency = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [dashboard, setDashboard] = useState<SupplierDashboard | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState<Supplier | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState<Supplier | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalData, setUpgradeModalData] = useState<{
    feature: 'suppliers'
    currentCount: number
    limit: number
    message: string
  } | null>(null)
  const { canAddSupplier } = usePlanLimits()
  const effectiveUserId = staff ? staff.userId : user?.uid
  const activeBranchId = selectedBranchId || undefined

  // Load dashboard data
  const loadDashboard = async () => {
    if (!effectiveUserId) return

    try {
      const data = await getSupplierDashboard(effectiveUserId, activeBranchId)
      setDashboard(data as any)
    } catch (error) {
      console.error('Error loading suppliers dashboard:', error)
    }
  }

  // Load suppliers
  const loadSuppliers = async () => {
    if (!effectiveUserId) return

    try {
      const data = await getSuppliers(
        effectiveUserId,
        {
          status: statusFilter && statusFilter !== 'ALL' ? [statusFilter as any] : undefined,
          searchTerm: searchTerm.trim() || undefined
        },
        'name',
        'asc',
        undefined,
        activeBranchId
      )
      setSuppliers(data.map((supplier: Supplier) => normalizeSupplierForDisplay(supplier)))
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  // Create supplier
  const createSupplier = async (supplierData: any) => {
    if (!effectiveUserId) return false

    try {
      await createSupplierRecord(effectiveUserId, supplierData, activeBranchId)
      await loadSuppliers()
      await loadDashboard()
      setShowAddModal(false)
      return true
    } catch (error) {
      console.error('Error creating supplier:', error)
      alert('Failed to create supplier')
      return false
    }
  }

  useEffect(() => {
    if (effectiveUserId) {
      setLoading(true)
      setDashboard(null)
      setSuppliers([])
      setShowDetailsModal(null)
      setShowEditModal(null)
      Promise.all([
        loadDashboard(),
        loadSuppliers()
      ]).finally(() => setLoading(false))
    }
  }, [effectiveUserId, activeBranchId])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (effectiveUserId) {
        loadSuppliers()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, effectiveUserId, activeBranchId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'BLOCKED': return 'bg-red-100 text-red-800'
      case 'PENDING_VERIFICATION': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPaymentTerms = (terms?: string) => {
    return (terms || 'NET_30').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatCurrency = (amount: number) => `${currencySymbol} ${amount.toLocaleString()}`

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature={upgradeModalData?.feature}
        currentCount={upgradeModalData?.currentCount}
        limit={upgradeModalData?.limit}
        message={upgradeModalData?.message}
      />
      {/* Consistent Header */}
      <div className="dashboard-panel p-8">
        <motion.div {...fadeInUp} className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-600 rounded-lg p-3">
                <TruckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="dashboard-page-title">Supplier Management</h1>
                <p className="dashboard-page-subtitle mt-1">
                  Manage your suppliers and vendor relationships
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 text-sm text-gray-500">
              <span>{dashboard?.totalSuppliers || 0} Suppliers</span>
              <span>{dashboard?.activeSuppliers || 0} Active</span>
              <span>{dashboard?.pendingApprovals || 0} Pending</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                loadDashboard()
                loadSuppliers()
              }}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Button
              onClick={async () => {
                const limitCheck = await canAddSupplier()
                if (!limitCheck.allowed) {
                  setUpgradeModalData({
                    feature: 'suppliers',
                    currentCount: limitCheck.currentCount,
                    limit: typeof limitCheck.limit === 'number' ? limitCheck.limit : 0,
                    message: limitCheck.message || 'Supplier limit reached'
                  })
                  setShowUpgradeModal(true)
                } else {
                  setShowAddModal(true)
                }
              }}
              className="dashboard-action-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </motion.div>
      </div>

      {loading ? (
        <Card className="border-0 shadow-lg">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-100"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent absolute top-0"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Suppliers Management</h3>
              <p className="text-gray-600">Fetching your supplier data and performance metrics...</p>
            </div>
          </div>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Card className="border-0 shadow-lg mb-6">
            <div className="p-2">
              <TabsList className="grid w-full grid-cols-3 bg-gray-50 rounded-xl p-1">
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all duration-200"
                >
                  📊 Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="suppliers"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all duration-200"
                >
                  🚛 Suppliers
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all duration-200"
                >
                  📈 Performance
                </TabsTrigger>
              </TabsList>
            </div>
          </Card>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Enhanced Key Metrics */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={staggerChildren}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={fadeInUp}>
                <Card className="dashboard-panel transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Total Suppliers</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.totalSuppliers || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Supply Network</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <UserGroupIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="dashboard-panel transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Active Suppliers</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.activeSuppliers || 0}</p>
                        <div className="flex items-center mt-2">
                          <div className="bg-gray-100 rounded-full h-1.5 w-12 mr-2">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${dashboard?.totalSuppliers ? (dashboard.activeSuppliers / dashboard.totalSuppliers) * 100 : 0}%`
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">
                            {dashboard?.totalSuppliers ? Math.round((dashboard.activeSuppliers / dashboard.totalSuppliers) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="dashboard-panel transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Pending Approvals</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.pendingApprovals || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(dashboard?.pendingApprovals || 0) > 0 ? 'Needs Review' : 'All Clear'}
                        </p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <ClockIcon className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="dashboard-panel transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Overdue Deliveries</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard?.overdueDeliveries || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(dashboard?.overdueDeliveries || 0) > 0 ? 'Action Required' : 'On Track'}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3">
                        <XCircleIcon className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>

            {/* Enhanced Top Suppliers */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Top Performing Suppliers</h2>
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-2">
                      <TruckIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {dashboard?.topSuppliers?.map((supplier, index) => (
                      <div key={supplier.supplierId} className="relative group">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-green-50 hover:to-emerald-50 transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white text-sm ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                              index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                              index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                              'bg-gradient-to-r from-green-500 to-green-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                                {supplier.supplierName}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <TruckIcon className="h-3 w-3" />
                                  {supplier.totalOrders} orders
                                </span>
                                <span className="flex items-center gap-1">
                                  <CheckCircleIcon className="h-3 w-3" />
                                  {supplier.onTimeDeliveryRate}% on-time
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">{formatCurrency(supplier.totalAmount)}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span className={`px-2 py-1 rounded-full ${
                                supplier.onTimeDeliveryRate >= 90 ? 'bg-green-100 text-green-700' :
                                supplier.onTimeDeliveryRate >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {supplier.onTimeDeliveryRate}% delivery
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-12">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <TruckIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No supplier performance data available</p>
                        <p className="text-gray-400 text-sm mt-1">Performance metrics will appear here once you have active suppliers</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
            {/* Enhanced Filters */}
            <Card className="border-0 shadow-lg">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-lg">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <TruckIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search suppliers by name, contact, or categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="dashboard-field w-full py-3 pl-10 pr-4 transition-all duration-200"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="dashboard-field appearance-none px-4 py-3 pr-10 transition-all duration-200 cursor-pointer"
                    >
                      <option value="ALL">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="PENDING_VERIFICATION">Pending</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                {(searchTerm || statusFilter !== 'ALL') && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                    <span>Active filters:</span>
                    {searchTerm && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">"{searchTerm}"</span>
                    )}
                    {statusFilter !== 'ALL' && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">{statusFilter}</span>
                    )}
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('ALL')
                      }}
                      className="text-green-600 hover:text-green-800 font-medium ml-2"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Enhanced Suppliers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {suppliers.map((supplier) => (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-xl">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                              <span className="text-white text-lg font-bold">
                                {supplier.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                              {supplier.name}
                            </h3>
                            {supplier.contactPerson && (
                              <p className="text-sm text-gray-600 font-medium">{supplier.contactPerson}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(supplier.status)} border-0 font-medium`}>
                          {supplier.status}
                        </Badge>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{supplier.phone}</span>
                        </div>

                        {supplier.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{supplier.email}</span>
                          </div>
                        )}

                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="font-medium">{supplier.address}</span>
                        </div>
                      </div>

                      {/* Categories */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Categories:</p>
                        <div className="flex flex-wrap gap-1">
                          {supplier.categories.slice(0, 3).map(category => (
                            <span key={category} className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-green-50 text-green-700 font-medium">
                              {category}
                            </span>
                          ))}
                          {supplier.categories.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-600 font-medium">
                              +{supplier.categories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center mb-1">
                            <TruckIcon className="h-4 w-4 text-blue-600 mr-1" />
                          </div>
                          <p className="text-2xl font-bold text-blue-700">{supplier.totalOrders}</p>
                          <p className="text-xs text-blue-600 font-medium">Orders</p>
                        </div>

                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center mb-1">
                            <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1" />
                          </div>
                          <p className="text-xl font-bold text-green-700">{supplier.onTimeDeliveryRate}%</p>
                          <p className="text-xs text-green-600 font-medium">On-Time</p>
                        </div>
                      </div>

                      {/* Ratings */}
                      {(supplier.qualityRating || supplier.serviceRating || supplier.pricingRating) && (
                        <div className="space-y-2 mb-4">
                          <p className="text-sm font-medium text-gray-700">Ratings:</p>
                          <div className="space-y-1">
                            {supplier.qualityRating && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Quality:</span>
                                <div className="flex">
                                  {renderStars(supplier.qualityRating)}
                                </div>
                              </div>
                            )}
                            {supplier.serviceRating && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Service:</span>
                                <div className="flex">
                                  {renderStars(supplier.serviceRating)}
                                </div>
                              </div>
                            )}
                            {supplier.pricingRating && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Pricing:</span>
                                <div className="flex">
                                  {renderStars(supplier.pricingRating)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Payment Terms */}
                      <div className="mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700 font-medium">
                          {formatPaymentTerms(supplier.paymentTerms)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDetailsModal(normalizeSupplierForDisplay(supplier))}
                          className="flex-1 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowEditModal(supplier)}
                          className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {suppliers.length === 0 && (
              <Card className="border-0 shadow-lg">
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <TruckIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {(searchTerm || statusFilter !== 'ALL') ? 'No Suppliers Match Your Search' : 'No Suppliers Yet'}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {(searchTerm || statusFilter !== 'ALL')
                      ? 'Try adjusting your search filters or add a new supplier.'
                      : 'Build your supply network by adding suppliers across different categories.'}
                  </p>

                  {(searchTerm || statusFilter !== 'ALL') ? (
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('')
                          setStatusFilter('ALL')
                        }}
                        className="hover:bg-gray-50"
                      >
                        Clear Filters
                      </Button>
                      <Button
                        onClick={() => setShowAddModal(true)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Supplier
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button
                        onClick={() => setShowAddModal(true)}
                        className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Your First Supplier
                      </Button>
                      <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mt-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Multiple categories</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span>Performance tracking</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                          <span>Rating system</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <SupplierPerformanceTab suppliers={suppliers} renderStars={renderStars} />
          </TabsContent>
        </Tabs>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <AddSupplierModal
          onSave={createSupplier}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {showDetailsModal && (
        <SupplierDetailsModal
          supplier={showDetailsModal}
          branchName={selectedBranch?.name}
          onClose={() => setShowDetailsModal(null)}
          formatPaymentTerms={formatPaymentTerms}
          renderStars={renderStars}
        />
      )}
    </div>
  )
}

interface SupplierDetailsModalProps {
  supplier: Supplier
  branchName?: string
  onClose: () => void
  formatPaymentTerms: (terms: string) => string
  renderStars: (rating: number) => ReactNode
}

function SupplierDetailsModal({
  supplier,
  branchName,
  onClose,
  formatPaymentTerms,
  renderStars
}: SupplierDetailsModalProps) {
  const averageRating = [
    supplier.qualityRating,
    supplier.serviceRating,
    supplier.pricingRating
  ].filter((rating): rating is number => typeof rating === 'number')

  const overallRating = averageRating.length > 0
    ? averageRating.reduce((sum, rating) => sum + rating, 0) / averageRating.length
    : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">{supplier.name}</h3>
            <p className="text-sm text-gray-500">
              {supplier.contactPerson || 'No contact person listed'}
              {branchName ? ` - ${branchName}` : ''}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <Card className="p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-gray-400" />
                <span>{supplier.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                <span>{supplier.email || 'Not provided'}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                <span>{supplier.address || 'Not provided'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Performance</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-blue-600">Orders</p>
                <p className="text-2xl font-bold text-blue-800">{supplier.totalOrders}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-green-600">On-time</p>
                <p className="text-2xl font-bold text-green-800">{supplier.onTimeDeliveryRate}%</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{supplier.completedOrders}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-gray-600">Terms</p>
                <p className="font-semibold text-gray-900">{formatPaymentTerms(supplier.paymentTerms)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {supplier.categories.length > 0 ? supplier.categories.map((category) => (
                <span key={category} className="rounded-lg bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                  {category}
                </span>
              )) : (
                <span className="text-sm text-gray-500">No categories listed</span>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Ratings</h4>
            {overallRating ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Overall</span>
                  <div className="flex">{renderStars(overallRating)}</div>
                </div>
                {supplier.qualityRating && <RatingRow label="Quality" rating={supplier.qualityRating} renderStars={renderStars} />}
                {supplier.serviceRating && <RatingRow label="Service" rating={supplier.serviceRating} renderStars={renderStars} />}
                {supplier.pricingRating && <RatingRow label="Pricing" rating={supplier.pricingRating} renderStars={renderStars} />}
              </div>
            ) : (
              <span className="text-sm text-gray-500">No ratings recorded</span>
            )}
          </Card>

          <Card className="p-4 md:col-span-2">
            <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{supplier.notes || 'No notes recorded for this supplier.'}</p>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}

function RatingRow({
  label,
  rating,
  renderStars
}: {
  label: string
  rating: number
  renderStars: (rating: number) => ReactNode
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <div className="flex">{renderStars(rating)}</div>
    </div>
  )
}

interface AddSupplierModalProps {
  onSave: (data: any) => Promise<boolean>
  onCancel: () => void
}

function AddSupplierModal({ onSave, onCancel }: AddSupplierModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    categories: [] as string[],
    paymentTerms: 'NET_30',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const success = await onSave(formData)
    if (success) {
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        categories: [],
        paymentTerms: 'NET_30',
        notes: ''
      })
    }
    setSaving(false)
  }

  const addCategory = (category: string) => {
    if (category.trim() && !formData.categories.includes(category.trim())) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, category.trim()]
      }))
    }
  }

  const removeCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-2xl font-semibold mb-6">Add New Supplier</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Supplier Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address *</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categories *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.categories.map(category => (
                <span key={category} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                  {category}
                  <button type="button" onClick={() => removeCategory(category)} className="text-blue-600 hover:text-blue-800">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addCategory(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="flex-1 px-3 py-2 border rounded-md"
              >
                <option value="">Select a category</option>
                <option value="General Hardware">General Hardware</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Tools & Equipment">Tools & Equipment</option>
                <option value="Building Materials">Building Materials</option>
                <option value="Paints & Finishes">Paints & Finishes</option>
                <option value="Safety & Security">Safety & Security</option>
                <option value="Garden & Outdoor">Garden & Outdoor</option>
                <option value="Fasteners & Fixings">Fasteners & Fixings</option>
                <option value="Electronics">Electronics</option>
                <option value="Food & Beverages">Food & Beverages</option>
                <option value="Clothing">Clothing</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Packaging">Packaging</option>
                <option value="Equipment">Equipment</option>
                <option value="Services">Services</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.categories.length === 0 && (
              <p className="text-red-500 text-sm mt-1">Please select at least one category</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Terms</label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
              <option value="NET_7">Net 7 Days</option>
              <option value="NET_15">Net 15 Days</option>
              <option value="NET_30">Net 30 Days</option>
              <option value="ADVANCE_PAYMENT">Advance Payment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Additional notes about this supplier..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || formData.categories.length === 0}
            >
              {saving ? 'Creating...' : 'Create Supplier'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function SuppliersPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SuppliersContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
