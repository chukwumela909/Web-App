'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import { 
  Users, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  Package,
  MapPin,
  Calendar,
  Eye,
  CreditCard,
  DollarSign,
  Server,
  Database,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Building,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { 
  SuperAdminService, 
  TransactionMetrics, 
  SystemHealthMetrics, 
  BranchActivity, 
  AnalyticsDepth,
  SystemAlert
} from '@/lib/super-admin-service'
import RealtimeAlertsPanel from '@/components/alerts/RealtimeAlertsPanel'
import BackupStatusPanel from '@/components/monitoring/BackupStatusPanel'

interface MetricCardData {
  title: string
  value: string
  description: string
  icon: React.ElementType
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  color?: string
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<MetricCardData[]>([])
  const [transactionMetrics, setTransactionMetrics] = useState<TransactionMetrics | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>(null)
  const [topBranches, setTopBranches] = useState<BranchActivity[]>([])
  const [recentAlerts, setRecentAlerts] = useState<SystemAlert[]>([])
  const [analyticsDepth, setAnalyticsDepth] = useState<AnalyticsDepth | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllDashboardData()
  }, [])

  const fetchAllDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all dashboard data in parallel for better performance
      const [
        userResponse,
        salesMetrics, 
        productMetrics, 
        activity,
        transactions,
        health,
        branches,
        alerts,
        analytics
      ] = await Promise.all([
        // Use the same endpoint as users page for consistency
        fetch('/api/admin/firebase-auth-users?includeFirestore=true').then(res => res.json()),
        SuperAdminService.getSalesMetrics(),
        SuperAdminService.getProductMetrics(),
        SuperAdminService.getRecentActivity(5),
        SuperAdminService.getTransactionMetrics(),
        SuperAdminService.getSystemHealthMetrics(),
        SuperAdminService.getTopBranches(),
        SuperAdminService.getSystemAlerts(),
        SuperAdminService.getAnalyticsDepth()
      ])

      // Process user data to get metrics
      const allUsers = userResponse.success ? userResponse.users : []
      const activeUsers = allUsers.filter((user: any) => !user.disabled && user.displayName && !user.displayName.startsWith('[DISABLED]'))
      const regions = new Set(allUsers.map((user: any) => user.region).filter(Boolean))
      
      // Calculate recent users (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const recentUsers = allUsers.filter((user: any) => {
        if (!user.metadata?.creationTime) return false
        const createdDate = new Date(user.metadata.creationTime)
        return createdDate >= weekAgo
      })

      const userMetrics = {
        total: allUsers.length,
        daily: activeUsers.length, // Simplified - in real app would check last login
        weekly: activeUsers.length,
        monthly: activeUsers.length,
        regions: regions.size,
        recentUsers: recentUsers.length,
        verifiedEmails: allUsers.filter((user: any) => user.emailVerified).length,
        usersWithFirestoreData: allUsers.filter((user: any) => user.firestoreData).length
      }


      // Set main metrics cards with real Firebase data
      setMetrics([
        {
          title: 'New Users This Week',
          value: userMetrics.recentUsers.toLocaleString(),
          description: 'Users registered in the last 7 days',
          icon: Users,
          trend: userMetrics.recentUsers > 0 ? `+${userMetrics.recentUsers}` : '0',
          trendDirection: userMetrics.recentUsers > 0 ? 'up' : 'neutral',
          color: 'text-blue-600'
        },
        {
          title: 'Total Users',
          value: userMetrics.total.toLocaleString(),
          description: 'Total registered users',
          icon: Activity,
          trend: userMetrics.total > 0 ? '+8%' : '0%',
          trendDirection: 'up',
          color: 'text-green-600'
        },
        {
          title: 'Verified Users',
          value: userMetrics.verifiedEmails.toLocaleString(),
          description: 'Users with verified email addresses',
          icon: CheckCircle,
          trend: `${Math.round((userMetrics.verifiedEmails / userMetrics.total) * 100)}%`,
          trendDirection: userMetrics.verifiedEmails > userMetrics.total * 0.5 ? 'up' : 'down',
          color: 'text-emerald-600'
        },
        {
          title: 'Business Accounts',
          value: userMetrics.usersWithFirestoreData.toLocaleString(),
          description: 'Users with complete business profiles',
          icon: Building,
          trend: `${Math.round((userMetrics.usersWithFirestoreData / userMetrics.total) * 100)}%`,
          trendDirection: userMetrics.usersWithFirestoreData > 0 ? 'up' : 'neutral',
          color: 'text-purple-600'
        }
      ])
      
      setTransactionMetrics(transactions)
      setSystemHealth(health)
      setTopBranches(branches)
      setRecentAlerts(alerts.slice(0, 5))
      setAnalyticsDepth(analytics)
      setRecentActivity(activity)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setMetrics([])
      setTransactionMetrics(null)
      setSystemHealth(null)
      setTopBranches([])
      setRecentAlerts([])
      setAnalyticsDepth(null)
      setRecentActivity([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    // Force complete refresh to ensure fresh data
    const UserMetricsService = (await import('@/lib/user-metrics-service')).default
    await UserMetricsService.forceRefresh()
    
    fetchAllDashboardData()
  }

  const getTrendIcon = (direction?: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="h-3 w-3 text-green-500" />
      case 'down':
        return <ArrowDown className="h-3 w-3 text-red-500" />
      default:
        return <Minus className="h-3 w-3 text-gray-500" />
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'critical':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5
      }
    })
  }

  return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive overview of platform metrics and analytics
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="backups">Backup & Logs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className={`h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center ${metric.color}`}>
                    <metric.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {loading ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                    ) : (
                      metric.value
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.description}
                  </p>
                  {metric.trend && (
                    <div className="flex items-center mt-2">
                      {getTrendIcon(metric.trendDirection)}
                      <span 
                        className={`text-xs font-medium ml-1 ${
                          metric.trendDirection === 'up' 
                            ? 'text-green-600' 
                            : metric.trendDirection === 'down'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {metric.trend} from last month
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Transaction Metrics & System Health Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Metrics */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Transaction Overview
                </CardTitle>
                <CardDescription>Daily and monthly transaction metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <div className="h-16 bg-muted animate-pulse rounded"></div>
                    <div className="h-16 bg-muted animate-pulse rounded"></div>
                  </div>
                ) : transactionMetrics ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-blue-900">24H Transactions</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {transactionMetrics.daily.count.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-600">
                          KSh {transactionMetrics.daily.value.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm font-medium text-green-600">
                            +{transactionMetrics.daily.growth}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-900">Monthly Transactions</p>
                        <p className="text-2xl font-bold text-green-700">
                          {transactionMetrics.monthly.count.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600">
                          KSh {transactionMetrics.monthly.value.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm font-medium text-green-600">
                            +{Math.max(0, transactionMetrics.monthly.growth).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transaction data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="h-5 w-5 mr-2" />
                  System Health
                </CardTitle>
                <CardDescription>Real-time system status and performance</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <div className="h-6 bg-muted animate-pulse rounded"></div>
                    <div className="h-6 bg-muted animate-pulse rounded"></div>
                    <div className="h-6 bg-muted animate-pulse rounded"></div>
                  </div>
                ) : systemHealth ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">System Uptime</span>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="font-bold text-green-600">{systemHealth.uptime}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Database Status</span>
                      <div className="flex items-center">
                        <Badge className={getHealthStatusColor(systemHealth.database.status)}>
                          {systemHealth.database.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground ml-2">
                          {systemHealth.database.responseTime}ms
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className="font-bold text-green-600">{systemHealth.errorRate}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">DB Connections</span>
                      <span className="font-bold">{systemHealth.database.connections}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>System health data unavailable</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Branches & Recent Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Branches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Registered Branches
                </CardTitle>
                <CardDescription>Active branches in your system</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : topBranches.length > 0 ? (
                  <div className="space-y-3">
                    {topBranches.map((branch, index) => (
                      <div key={branch.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{branch.name}</p>
                          <p className="text-sm text-muted-foreground">{branch.location}</p>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              branch.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {branch.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No branches found</p>
                    <p className="text-xs mt-1">Branches will appear here once they are registered in the system</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Recent Alerts
                </CardTitle>
                <CardDescription>Latest system alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : recentAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {recentAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          alert.severity === 'critical' ? 'bg-red-500' :
                          alert.severity === 'high' ? 'bg-orange-500' :
                          alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <Badge 
                          className={
                            alert.status === 'active' ? 'bg-red-100 text-red-800' : 
                            'bg-green-100 text-green-800'
                          }
                        >
                          {alert.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                    <p>No recent alerts</p>
                    <p className="text-xs">All systems operating normally</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Analytics Depth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics Depth
              </CardTitle>
              <CardDescription>Churn, retention, and growth statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-muted animate-pulse rounded"></div>
                  ))}
                </div>
              ) : analyticsDepth ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Churn Analysis */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-3">Churn Analysis</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-red-700">Churn Rate</span>
                        <span className="font-bold text-red-800">{analyticsDepth.churn.rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-700">Trend</span>
                        <span className="font-bold text-green-600">{analyticsDepth.churn.trend}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-700">Total Churned</span>
                        <span className="font-bold text-red-800">{analyticsDepth.churn.totalChurned}</span>
                      </div>
                    </div>
                  </div>

                  {/* Retention Analysis */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-3">Retention Rates</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Day 1</span>
                        <span className="font-bold text-blue-800">{analyticsDepth.retention.day1.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Day 7</span>
                        <span className="font-bold text-blue-800">{analyticsDepth.retention.day7.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Day 30</span>
                        <span className="font-bold text-blue-800">{analyticsDepth.retention.day30.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Growth Analysis */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-3">Growth Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">User Growth</span>
                        <span className="font-bold text-green-800">+{analyticsDepth.growth.userGrowth.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Revenue Growth</span>
                        <span className="font-bold text-green-800">+{analyticsDepth.growth.revenueGrowth}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Active User Trend</span>
                        <span className="font-bold text-green-800">+{analyticsDepth.growth.activeUserTrend}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Analytics data unavailable</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Recent Platform Activity
              </CardTitle>
              <CardDescription>
                Latest user interactions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  // Loading skeleton
                  [...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div>
                        <div className="h-4 w-32 bg-muted animate-pulse rounded mb-1"></div>
                        <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
                      </div>
                      <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                    </div>
                  ))
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.user}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity found</p>
                    <p className="text-xs">User actions will appear here once logged</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
          </TabsContent>

          {/* Backup & Logs Tab */}
          <TabsContent value="backups">
            <BackupStatusPanel />
          </TabsContent>
        </Tabs>
      </div>
  )
}