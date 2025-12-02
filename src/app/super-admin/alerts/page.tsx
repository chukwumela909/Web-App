'use client'

import React, { useEffect, useState } from 'react'
import AdminRoute from '@/components/auth/AdminRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  Bell, 
  TrendingDown, 
  AlertTriangle,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Smartphone,
  Bug,
  Zap,
  Activity,
  Search,
  RefreshCw,
  ExternalLink,
  Calendar,
  BarChart3,
  Filter,
  Eye,
  AlertCircle,
  Shield
} from 'lucide-react'
import { SuperAdminService, SystemAlert } from '@/lib/super-admin-service'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import FirebaseCrashlyticsService, { CrashIssue, CrashAnalytics } from '@/lib/firebase-crashlytics-service'


export default function AlertsNotificationsPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [crashIssues, setCrashIssues] = useState<CrashIssue[]>([])
  const [errorAnalytics, setErrorAnalytics] = useState<CrashAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('crashes')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [platformFilter, setPlatformFilter] = useState<'all' | 'android' | 'ios' | 'web'>('all')

  useEffect(() => {
    fetchAlerts()
    fetchCrashData()
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchAlerts(), fetchCrashData()])
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      
      // Fetch real alerts from Firebase
      const systemAlerts = await SuperAdminService.getSystemAlerts()
      setAlerts(systemAlerts)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCrashData = async () => {
    try {
      console.log('Fetching real crash data from Firebase...')
      
      // Fetch real crash issues from Firebase
      const realCrashIssues = await FirebaseCrashlyticsService.getCrashIssues()
      setCrashIssues(realCrashIssues)
      
      // Fetch real crash analytics from Firebase
      const realCrashAnalytics = await FirebaseCrashlyticsService.getCrashAnalytics()
      setErrorAnalytics(realCrashAnalytics)
      
      console.log(`Loaded ${realCrashIssues.length} crash issues and analytics:`, realCrashAnalytics)
    } catch (error) {
      console.error('Error fetching crash data:', error)
      
      // Set empty states if there's an error
      setCrashIssues([])
      setErrorAnalytics({
        totalCrashes: 0,
        crashFreeUsers: 100,
        crashRate: 0,
        openIssues: 0,
        criticalIssues: 0,
        affectedUsers: 0,
        totalEvents: 0
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4 text-orange-500" />
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'dismissed': return <XCircle className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filterAlertsByType = (type: string) => {
    return alerts.filter(alert => alert.type === type)
  }

  const filteredCrashIssues = crashIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.appVersion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.device?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter
    const matchesPlatform = platformFilter === 'all' || issue.platform === platformFilter
    
    return matchesSearch && matchesStatus && matchesPlatform
  })

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'android': return <Smartphone className="h-4 w-4 text-green-600" />
      case 'ios': return <Smartphone className="h-4 w-4 text-blue-600" />
      case 'web': return <Activity className="h-4 w-4 text-purple-600" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crash': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'non_fatal': return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'anr': return <Clock className="h-4 w-4 text-yellow-600" />
      default: return <Bug className="h-4 w-4" />
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return 'Less than 1 hour ago'
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  const StatsCard = ({ title, value, description, icon: Icon, trend }: {
    title: string
    value: string
    description: string
    icon: React.ElementType
    trend?: string
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{trend}</p>
        )}
      </CardContent>
    </Card>
  )

  const CrashIssueCard = ({ issue }: { issue: CrashIssue }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getTypeIcon(issue.type)}
            {getPlatformIcon(issue.platform)}
            <h3 className="font-semibold text-foreground text-sm leading-tight">{issue.title}</h3>
            <Badge variant={issue.status === 'open' ? 'destructive' : issue.status === 'resolved' ? 'default' : 'secondary'}>
              {issue.status}
            </Badge>
            <Badge variant="outline" className={getSeverityColor(issue.severity)}>
              {issue.severity}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
            <div>
              <span className="text-muted-foreground">Events:</span>
              <span className="font-medium ml-2">{issue.eventCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Users:</span>
              <span className="font-medium ml-2">{issue.userCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">App Version:</span>
              <span className="font-medium ml-2">{issue.appVersion || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Seen:</span>
              <span className="font-medium ml-2">{formatTimeAgo(issue.lastSeen)}</span>
            </div>
          </div>
          
          {issue.device && (
            <div className="text-xs text-muted-foreground mb-2">
              <span className="font-medium">{issue.device}</span> • <span>{issue.osVersion}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {issue.status === 'open' && (
            <Button variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolve
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )

  const AlertCard = ({ alert }: { alert: SystemAlert }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(alert.status)}
            <h3 className="font-semibold text-foreground">{alert.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
              {alert.severity}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{alert.timestamp.toLocaleString()}</span>
            {alert.affectedUsers && <span>{alert.affectedUsers} users affected</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {alert.status === 'active' && (
            <>
              <Button variant="outline" size="sm">Resolve</Button>
              <Button variant="ghost" size="sm">Dismiss</Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <AdminRoute requiredPermission="alerts_notifications">
        <div className="space-y-6 p-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
        </div>
      </AdminRoute>
    )
  }

  const activeAlerts = alerts.filter(alert => alert.status === 'active')
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical')
  const usageDropAlerts = filterAlertsByType('usage_drop')
  const errorAlerts = filterAlertsByType('error')
  const dataDeletionAlerts = filterAlertsByType('data_deletion')
  const weeklySummaryAlerts = filterAlertsByType('weekly_summary')
  
  const openCrashes = crashIssues.filter(issue => issue.status === 'open')
  const criticalCrashes = crashIssues.filter(issue => issue.severity === 'critical')
  const totalCrashEvents = crashIssues.reduce((sum, issue) => sum + issue.eventCount, 0)
  const totalAffectedUsers = crashIssues.reduce((sum, issue) => sum + issue.userCount, 0)

  return (
    <AdminRoute requiredPermission="alerts_notifications">
      <div className="space-y-6 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Crash Analytics & Alerts</h1>
          <p className="text-muted-foreground mt-2">
                Monitor app crashes, system alerts, and platform stability
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-6"
        >
          <StatsCard
            title="Open Crashes"
            value={(errorAnalytics?.openIssues || openCrashes.length).toString()}
            description="Active crash issues"
            icon={AlertTriangle}
          />
          <StatsCard
            title="Critical Issues"
            value={(errorAnalytics?.criticalIssues || criticalCrashes.length).toString()}
            description="High severity crashes"
            icon={Bug}
          />
          <StatsCard
            title="Total Events"
            value={(errorAnalytics?.totalEvents || totalCrashEvents).toLocaleString()}
            description="Crash occurrences"
            icon={Activity}
          />
          <StatsCard
            title="Affected Users"
            value={(errorAnalytics?.affectedUsers || totalAffectedUsers).toString()}
            description="Users experiencing crashes"
            icon={Users}
          />
          <StatsCard
            title="Crash-Free Rate"
            value={`${errorAnalytics?.crashFreeUsers.toFixed(1) || 100}%`}
            description="Users without crashes"
            icon={Shield}
            trend={errorAnalytics?.crashFreeUsers > 95 ? '+Good' : 'Needs attention'}
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="crashes">Crash Issues</TabsTrigger>
              <TabsTrigger value="system-alerts">System Alerts</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="crashes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bug className="h-5 w-5" />
                      Crash Issues
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search crashes..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-3 py-2 border border-input rounded-md text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                      <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value as any)}
                        className="px-3 py-2 border border-input rounded-md text-sm"
                      >
                        <option value="all">All Platforms</option>
                        <option value="android">Android</option>
                        <option value="ios">iOS</option>
                        <option value="web">Web</option>
                      </select>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage app crashes sorted by event count • {filteredCrashIssues.length} issues
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filteredCrashIssues.length > 0 ? (
                    filteredCrashIssues
                      .sort((a, b) => b.eventCount - a.eventCount)
                      .map(issue => (
                        <CrashIssueCard key={issue.id} issue={issue} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No crash issues found</p>
                      <p className="text-sm mt-2">
                        {crashIssues.length === 0 
                          ? "Your app is running smoothly! 🎉" 
                          : "Try adjusting your filters to see more results."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system-alerts" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                      Error Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {errorAlerts.length > 0 ? (
                    errorAlerts.map(alert => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))
                  ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>No error alerts</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5" />
                      Usage Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {usageDropAlerts.length > 0 ? (
                      usageDropAlerts.map(alert => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))
                  ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>No usage alerts</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Crash Trends
                    </CardTitle>
                    <CardDescription>
                      Daily crash occurrences over the last 7 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {errorAnalytics?.trends.daily.map((count, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full" 
                                style={{ width: `${(count / Math.max(...(errorAnalytics?.trends.daily || [1]))) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Platform Distribution
                  </CardTitle>
                  <CardDescription>
                      Crashes by platform
                  </CardDescription>
                </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['android', 'ios', 'web'].map(platform => {
                        const platformCrashes = crashIssues.filter(issue => issue.platform === platform)
                        const count = platformCrashes.reduce((sum, issue) => sum + issue.eventCount, 0)
                        const percentage = totalCrashEvents > 0 ? (count / totalCrashEvents) * 100 : 0
                        
                        return (
                          <div key={platform} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(platform)}
                              <span className="capitalize">{platform}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                              <span className="text-sm font-medium">{count}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                </CardContent>
              </Card>
              </div>
            </TabsContent>

          </Tabs>
        </motion.div>
      </div>
    </AdminRoute>
  )
}
