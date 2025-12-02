'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// ScrollArea component not available, using div with overflow
import { 
  AlertTriangle, 
  Shield, 
  UserX, 
  Settings, 
  Bug,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Filter,
  RefreshCw,
  AlertCircle,
  XCircle,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import RealtimeAlertsService, { AlertEvent, AlertStats } from '@/lib/realtime-alerts-service'
import { useToast } from '@/hooks/use-toast'

interface RealtimeAlertsPanelProps {
  className?: string
}

export default function RealtimeAlertsPanel({ className = '' }: RealtimeAlertsPanelProps) {
  const [alerts, setAlerts] = useState<AlertEvent[]>([])
  const [stats, setStats] = useState<AlertStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'critical' | 'high'>('unacknowledged')
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadInitialData()
    
    let unsubscribe: (() => void) | null = null
    
    if (realTimeEnabled) {
      // Subscribe to real-time alerts
      unsubscribe = RealtimeAlertsService.subscribeToAlerts((newAlert) => {
        setAlerts(prev => [newAlert, ...prev])
        
        // Show toast notification for high/critical alerts
        if (newAlert.severity === 'critical' || newAlert.severity === 'high') {
          toast({
            title: `${newAlert.severity.toUpperCase()} Alert`,
            description: newAlert.title,
            variant: 'destructive',
          })
        }
      })
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [realTimeEnabled, toast])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [alertsData, statsData] = await Promise.all([
        RealtimeAlertsService.getRecentAlerts(100),
        RealtimeAlertsService.getAlertStats()
      ])
      
      setAlerts(alertsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading alerts data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load alerts data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledge = async (alertId: string) => {
    try {
      await RealtimeAlertsService.acknowledgeAlert(alertId, 'current-user') // Replace with actual user ID
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, acknowledgedBy: 'current-user', acknowledgedAt: new Date() }
          : alert
      ))
      
      toast({
        title: 'Alert Acknowledged',
        description: 'Alert has been marked as acknowledged',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error acknowledging alert:', error)
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert',
        variant: 'destructive',
      })
    }
  }

  const handleResolve = async (alertId: string) => {
    try {
      await RealtimeAlertsService.resolveAlert(alertId, 'current-user') // Replace with actual user ID
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true, resolvedBy: 'current-user', resolvedAt: new Date() }
          : alert
      ))
      
      toast({
        title: 'Alert Resolved',
        description: 'Alert has been marked as resolved',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error resolving alert:', error)
      toast({
        title: 'Error',
        description: 'Failed to resolve alert',
        variant: 'destructive',
      })
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'failed_login': return UserX
      case 'role_change': return Settings
      case 'crash_rate': return Bug
      case 'security_breach': return Shield
      default: return AlertTriangle
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return XCircle
      case 'high': return AlertCircle
      case 'medium': return AlertTriangle
      case 'low': return Info
      default: return Info
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'unacknowledged': return !alert.acknowledged
      case 'critical': return alert.severity === 'critical'
      case 'high': return alert.severity === 'high'
      default: return true
    }
  })

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
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
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-foreground">Security Alerts</h2>
          <p className="text-muted-foreground mt-2">
            Real-time monitoring and alerts for sensitive events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={realTimeEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          >
            {realTimeEnabled ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
            Real-time {realTimeEnabled ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadInitialData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Alert Statistics */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Alerts</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unacknowledged</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.unacknowledged}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last 24h</p>
                  <p className="text-2xl font-bold">{stats.last24Hours}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Alerts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Alerts</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">All Alerts</option>
                  <option value="unacknowledged">Unacknowledged</option>
                  <option value="critical">Critical</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-y-auto">
              <AnimatePresence>
                {filteredAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {filteredAlerts.map((alert, index) => {
                      const IconComponent = getAlertIcon(alert.type)
                      const SeverityIcon = getSeverityIcon(alert.severity)
                      
                      return (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)} ${
                            alert.acknowledged ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="flex-shrink-0">
                                <IconComponent className="h-5 w-5 mt-0.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">{alert.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    <SeverityIcon className="h-3 w-3 mr-1" />
                                    {alert.severity}
                                  </Badge>
                                  {alert.acknowledged && (
                                    <Badge variant="secondary" className="text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Acknowledged
                                    </Badge>
                                  )}
                                  {alert.resolved && (
                                    <Badge variant="default" className="text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Resolved
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {alert.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>{formatTimeAgo(alert.timestamp)}</span>
                                  {alert.userEmail && (
                                    <span>User: {alert.userEmail}</span>
                                  )}
                                  {alert.ipAddress && (
                                    <span>IP: {alert.ipAddress}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              {!alert.acknowledged && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAcknowledge(alert.id)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Acknowledge
                                </Button>
                              )}
                              {!alert.resolved && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleResolve(alert.id)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      No alerts found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {filter === 'all' 
                        ? 'No security alerts have been generated yet.'
                        : `No ${filter} alerts found. Try changing the filter.`
                      }
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
