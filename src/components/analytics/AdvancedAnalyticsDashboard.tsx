'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Globe, 
  Building, 
  Smartphone, 
  Users, 
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  UserCheck,
  UserX,
  UserPlus
} from 'lucide-react'
import { motion } from 'framer-motion'
import AdvancedAnalyticsService, { SegmentationData, CohortData, WeeklyTrend } from '@/lib/advanced-analytics-service'

interface AdvancedAnalyticsDashboardProps {
  className?: string
}

export default function AdvancedAnalyticsDashboard({ className = '' }: AdvancedAnalyticsDashboardProps) {
  const [segmentationData, setSegmentationData] = useState<SegmentationData | null>(null)
  const [cohortData, setCohortData] = useState<CohortData[]>([])
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      const [segmentation, cohorts, trends] = await Promise.all([
        AdvancedAnalyticsService.getSegmentationData(),
        AdvancedAnalyticsService.getCohortAnalysis(),
        AdvancedAnalyticsService.getWeeklyTrends(12)
      ])

      setSegmentationData(segmentation)
      setCohortData(cohorts)
      setWeeklyTrends(trends)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getRetentionColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getChurnColor = (rate: number): string => {
    if (rate <= 10) return 'text-green-600'
    if (rate <= 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-foreground">Advanced Analytics</h2>
        <p className="text-muted-foreground mt-2">
          Deep insights into user behavior, segmentation, and retention patterns
        </p>
      </motion.div>

      <Tabs defaultValue="segmentation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="segmentation">User Segmentation</TabsTrigger>
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="trends">Weekly Trends</TabsTrigger>
        </TabsList>

        {/* User Segmentation Tab */}
        <TabsContent value="segmentation" className="space-y-6">
          {segmentationData && (
            <>
              {/* Country Segmentation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Geographic Distribution
                  </CardTitle>
                  <CardDescription>
                    User distribution and performance by country
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(segmentationData.country)
                      .sort(([,a], [,b]) => b.users - a.users)
                      .slice(0, 8)
                      .map(([country, data], index) => (
                        <motion.div
                          key={country}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{country}</h4>
                              <Badge variant="secondary">{data.users} users</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Revenue:</span> {formatCurrency(data.revenue)}
                              </div>
                              <div>
                                <span className="font-medium">Sessions:</span> {data.sessions.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Retention:</span> 
                                <span className={getRetentionColor(data.retention)}> {data.retention.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Branch Performance */}
              {Object.keys(segmentationData.branch).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Branch Performance
                    </CardTitle>
                    <CardDescription>
                      Performance metrics by business branch
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(segmentationData.branch)
                        .sort(([,a], [,b]) => b.revenue - a.revenue)
                        .map(([branch, data], index) => (
                          <motion.div
                            key={branch}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 border rounded-lg space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{branch}</h4>
                              <Badge variant="outline">{data.users} users</Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Revenue:</span>
                                <span className="font-medium">{formatCurrency(data.revenue)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Active Users:</span>
                                <span className="font-medium">{data.activeUsers}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Sessions:</span>
                                <span className="font-medium">{data.sessions.toLocaleString()}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Device & User Type Segmentation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Device Segmentation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Device Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(segmentationData.device).map(([device, data]) => (
                      <div key={device} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="capitalize font-medium">{device}</span>
                          <span className="text-sm text-muted-foreground">{data.users} users</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>Sessions: {data.sessions.toLocaleString()}</div>
                          <div>Revenue: {formatCurrency(data.revenue)}</div>
                        </div>
                        <Progress 
                          value={(data.users / Object.values(segmentationData.device).reduce((sum, d) => sum + d.users, 0)) * 100} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* User Type Segmentation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Type Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(segmentationData.userType).map(([type, data]) => (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="capitalize font-medium">{type}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{data.users} users</Badge>
                            <span className={`text-sm ${getChurnColor(data.churnRate)}`}>
                              {data.churnRate.toFixed(1)}% churn
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Revenue: {formatCurrency(data.revenue)}
                        </div>
                        <Progress 
                          value={(data.users / Object.values(segmentationData.userType).reduce((sum, d) => sum + d.users, 0)) * 100} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Cohort Analysis Tab */}
        <TabsContent value="cohorts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cohort Retention Analysis
              </CardTitle>
              <CardDescription>
                User retention patterns by signup month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cohortData.slice(0, 6).map((cohort, index) => (
                  <motion.div
                    key={cohort.cohortMonth}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{cohort.cohortMonth}</h4>
                        <p className="text-sm text-muted-foreground">
                          {cohort.cohortSize} users • {formatCurrency(cohort.revenuePerUser)} per user
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getChurnColor(cohort.churnRate)}`}>
                          {cohort.churnRate.toFixed(1)}% churn
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium">Week 1</div>
                        <div className={getRetentionColor(cohort.retentionRates.week1)}>
                          {cohort.retentionRates.week1.toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Week 2</div>
                        <div className={getRetentionColor(cohort.retentionRates.week2)}>
                          {cohort.retentionRates.week2.toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Week 3</div>
                        <div className={getRetentionColor(cohort.retentionRates.week3)}>
                          {cohort.retentionRates.week3.toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Week 4</div>
                        <div className={getRetentionColor(cohort.retentionRates.week4)}>
                          {cohort.retentionRates.week4.toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Month 2</div>
                        <div className={getRetentionColor(cohort.retentionRates.month2)}>
                          {cohort.retentionRates.month2.toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Month 3</div>
                        <div className={getRetentionColor(cohort.retentionRates.month3)}>
                          {cohort.retentionRates.month3.toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Month 6</div>
                        <div className={getRetentionColor(cohort.retentionRates.month6)}>
                          {cohort.retentionRates.month6.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {weeklyTrends.slice(0, 4).map((trend, index) => (
              <motion.div
                key={trend.week}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Week of {trend.week}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">New Users</span>
                      <div className="flex items-center gap-1">
                        <UserPlus className="h-3 w-3" />
                        <span className="font-medium">{trend.newUsers}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Users</span>
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span className="font-medium">{trend.activeUsers}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium">{formatCurrency(trend.revenue)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Retention</span>
                      <div className="flex items-center gap-1">
                        {trend.retention >= 70 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={`font-medium ${getRetentionColor(trend.retention)}`}>
                          {trend.retention.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                12-Week Trend Analysis
              </CardTitle>
              <CardDescription>
                Key metrics over the past 12 weeks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Simple trend visualization */}
                <div className="space-y-4">
                  <h4 className="font-medium">Weekly Active Users</h4>
                  <div className="flex items-end space-x-1 h-32">
                    {weeklyTrends.map((trend, index) => {
                      const maxUsers = Math.max(...weeklyTrends.map(t => t.activeUsers))
                      const height = (trend.activeUsers / maxUsers) * 100
                      return (
                        <div
                          key={index}
                          className="flex-1 bg-blue-500 rounded-t"
                          style={{ height: `${height}%` }}
                          title={`Week ${trend.week}: ${trend.activeUsers} users`}
                        />
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{weeklyTrends[0]?.week}</span>
                    <span>{weeklyTrends[weeklyTrends.length - 1]?.week}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Weekly Revenue</h4>
                  <div className="flex items-end space-x-1 h-32">
                    {weeklyTrends.map((trend, index) => {
                      const maxRevenue = Math.max(...weeklyTrends.map(t => t.revenue))
                      const height = maxRevenue > 0 ? (trend.revenue / maxRevenue) * 100 : 0
                      return (
                        <div
                          key={index}
                          className="flex-1 bg-green-500 rounded-t"
                          style={{ height: `${height}%` }}
                          title={`Week ${trend.week}: ${formatCurrency(trend.revenue)}`}
                        />
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{weeklyTrends[0]?.week}</span>
                    <span>{weeklyTrends[weeklyTrends.length - 1]?.week}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
