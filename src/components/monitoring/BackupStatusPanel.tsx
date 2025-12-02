'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// ScrollArea component not available, using div with overflow
import { 
  Database, 
  HardDrive, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Upload,
  Archive,
  Trash2,
  Play,
  RefreshCw,
  Calendar,
  FileText,
  Shield,
  Settings,
  Activity,
  BarChart3,
  Zap
} from 'lucide-react'
import { motion } from 'framer-motion'
import BackupMonitoringService, { BackupStatus, LogRetentionStatus, BackupRecord, RestoreTest } from '@/lib/backup-monitoring-service'
import { useToast } from '@/hooks/use-toast'

interface BackupStatusPanelProps {
  className?: string
}

export default function BackupStatusPanel({ className = '' }: BackupStatusPanelProps) {
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null)
  const [logRetentionStatus, setLogRetentionStatus] = useState<LogRetentionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    
    // Initialize log retention policies on first load
    BackupMonitoringService.initializeLogRetentionPolicies()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [backupData, logData] = await Promise.all([
        BackupMonitoringService.getBackupStatus(),
        BackupMonitoringService.getLogRetentionStatus()
      ])
      
      setBackupStatus(backupData)
      setLogRetentionStatus(logData)
    } catch (error) {
      console.error('Error loading backup data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load backup monitoring data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerBackup = async (type: 'full' | 'incremental' | 'differential') => {
    try {
      setTriggering(true)
      const collections = ['users', 'sales', 'inventory', 'expenses', 'staff', 'branches']
      await BackupMonitoringService.triggerManualBackup(type, collections, 'current-user')
      
      toast({
        title: 'Backup Started',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} backup has been initiated`,
        variant: 'success',
      })
      
      // Refresh data after a short delay
      setTimeout(() => {
        loadData()
      }, 2000)
    } catch (error) {
      console.error('Error triggering backup:', error)
      toast({
        title: 'Error',
        description: 'Failed to trigger backup',
        variant: 'destructive',
      })
    } finally {
      setTriggering(false)
    }
  }

  const handleLogCleanup = async (policyId: string) => {
    try {
      await BackupMonitoringService.performLogCleanup(policyId)
      
      toast({
        title: 'Cleanup Started',
        description: 'Log cleanup has been initiated',
        variant: 'success',
      })
      
      // Refresh data
      loadData()
    } catch (error) {
      console.error('Error performing log cleanup:', error)
      toast({
        title: 'Error',
        description: 'Failed to perform log cleanup',
        variant: 'destructive',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200'
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'failed':
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'overdue': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
      case 'healthy': return CheckCircle
      case 'running': return Activity
      case 'failed':
      case 'critical': return XCircle
      case 'warning':
      case 'overdue': return AlertTriangle
      default: return Clock
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-foreground">Backup & Log Monitoring</h2>
          <p className="text-muted-foreground mt-2">
            Monitor backup status, restore tests, and log retention policies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="backups" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="backups">Backup Status</TabsTrigger>
          <TabsTrigger value="logs">Log Retention</TabsTrigger>
        </TabsList>

        {/* Backup Status Tab */}
        <TabsContent value="backups" className="space-y-6">
          {backupStatus && (
            <>
              {/* Backup Overview Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Backup Health</p>
                        <div className="flex items-center gap-2 mt-1">
                          {React.createElement(getStatusIcon(backupStatus.backupHealth), {
                            className: `h-5 w-5 ${getStatusColor(backupStatus.backupHealth).split(' ')[0]}`
                          })}
                          <span className={`font-medium ${getStatusColor(backupStatus.backupHealth).split(' ')[0]}`}>
                            {backupStatus.backupHealth.charAt(0).toUpperCase() + backupStatus.backupHealth.slice(1)}
                          </span>
                        </div>
                      </div>
                      <Shield className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Backups</p>
                        <p className="text-2xl font-bold">{backupStatus.totalBackups}</p>
                        <p className="text-xs text-muted-foreground">
                          {backupStatus.failedBackupsLast7Days} failed in 7 days
                        </p>
                      </div>
                      <Database className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Size</p>
                        <p className="text-2xl font-bold">{formatBytes(backupStatus.totalBackupSize)}</p>
                        <p className="text-xs text-muted-foreground">
                          Avg: {formatDuration(Math.floor(backupStatus.averageBackupDuration))}
                        </p>
                      </div>
                      <HardDrive className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Last Backup & Restore Test */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Last Backup */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Last Backup
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {backupStatus.lastBackup ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge className={getStatusColor(backupStatus.lastBackup.status)}>
                              {React.createElement(getStatusIcon(backupStatus.lastBackup.status), {
                                className: "h-3 w-3 mr-1"
                              })}
                              {backupStatus.lastBackup.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Type</span>
                            <span className="font-medium capitalize">{backupStatus.lastBackup.type}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Started</span>
                            <span className="text-sm">{formatDate(backupStatus.lastBackup.startTime)}</span>
                          </div>
                          {backupStatus.lastBackup.endTime && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Duration</span>
                              <span className="text-sm">
                                {backupStatus.lastBackup.duration 
                                  ? formatDuration(backupStatus.lastBackup.duration)
                                  : 'N/A'
                                }
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Records</span>
                            <span className="text-sm">{backupStatus.lastBackup.recordCount.toLocaleString()}</span>
                          </div>
                          {backupStatus.lastBackup.size && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Size</span>
                              <span className="text-sm">{formatBytes(backupStatus.lastBackup.size)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No backup records found</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Last Restore Test */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Last Restore Test
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {backupStatus.lastRestoreTest ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge className={getStatusColor(backupStatus.lastRestoreTest.status)}>
                              {React.createElement(getStatusIcon(backupStatus.lastRestoreTest.status), {
                                className: "h-3 w-3 mr-1"
                              })}
                              {backupStatus.lastRestoreTest.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Type</span>
                            <span className="font-medium capitalize">{backupStatus.lastRestoreTest.testType}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Started</span>
                            <span className="text-sm">{formatDate(backupStatus.lastRestoreTest.startTime)}</span>
                          </div>
                          {backupStatus.lastRestoreTest.duration && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Duration</span>
                              <span className="text-sm">{formatDuration(backupStatus.lastRestoreTest.duration)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Verified</span>
                            <span className="text-sm">
                              {backupStatus.lastRestoreTest.verifiedRecords} / {backupStatus.lastRestoreTest.sampledRecords}
                            </span>
                          </div>
                          {backupStatus.lastRestoreTest.performanceMetrics && (
                            <div className="space-y-2 pt-2 border-t">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Read Speed</span>
                                <span className="text-xs">{backupStatus.lastRestoreTest.performanceMetrics.readSpeed} rec/s</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Memory Usage</span>
                                <span className="text-xs">{backupStatus.lastRestoreTest.performanceMetrics.memoryUsage} MB</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No restore tests found</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Manual Backup Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Manual Backup Controls
                    </CardTitle>
                    <CardDescription>
                      Trigger manual backups for immediate data protection
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => handleTriggerBackup('full')}
                        disabled={triggering}
                        className="flex-1"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Full Backup
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleTriggerBackup('incremental')}
                        disabled={triggering}
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Incremental
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleTriggerBackup('differential')}
                        disabled={triggering}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Differential
                      </Button>
                    </div>
                    {backupStatus.nextScheduledBackup && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>Next scheduled backup: {formatDate(backupStatus.nextScheduledBackup)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </TabsContent>

        {/* Log Retention Tab */}
        <TabsContent value="logs" className="space-y-6">
          {logRetentionStatus && (
            <>
              {/* Log Overview */}
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
                        <p className="text-sm text-muted-foreground">Total Log Size</p>
                        <p className="text-2xl font-bold">{formatBytes(logRetentionStatus.totalLogSize)}</p>
                      </div>
                      <Archive className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Cleanup Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          {React.createElement(getStatusIcon(logRetentionStatus.cleanupHealth), {
                            className: `h-5 w-5 ${getStatusColor(logRetentionStatus.cleanupHealth).split(' ')[0]}`
                          })}
                          <span className={`font-medium ${getStatusColor(logRetentionStatus.cleanupHealth).split(' ')[0]}`}>
                            {logRetentionStatus.cleanupHealth.charAt(0).toUpperCase() + logRetentionStatus.cleanupHealth.slice(1)}
                          </span>
                        </div>
                      </div>
                      <Zap className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Last Cleanup</p>
                        <p className="text-sm font-medium">{formatDate(logRetentionStatus.lastCleanup)}</p>
                      </div>
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Next Cleanup</p>
                        <p className="text-sm font-medium">{formatDate(logRetentionStatus.nextCleanup)}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Log Retention Policies */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Log Retention Policies
                    </CardTitle>
                    <CardDescription>
                      Manage log retention settings and perform cleanup operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {logRetentionStatus.policies.map((policy, index) => (
                        <motion.div
                          key={policy.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 border rounded-lg space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{policy.name}</h4>
                              <Badge variant={policy.enabled ? "default" : "secondary"}>
                                {policy.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLogCleanup(policy.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Cleanup Now
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Retention:</span>
                              <div className="font-medium">{policy.retentionDays} days</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Size:</span>
                              <div className="font-medium">{formatBytes(policy.totalSize || 0)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Records:</span>
                              <div className="font-medium">{(policy.recordCount || 0).toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Compression:</span>
                              <div className="font-medium">{policy.compressionEnabled ? 'Yes' : 'No'}</div>
                            </div>
                          </div>

                          {policy.archiveLocation && (
                            <div className="text-xs text-muted-foreground">
                              Archive: {policy.archiveLocation}
                            </div>
                          )}

                          {policy.lastCleanup && (
                            <div className="text-xs text-muted-foreground">
                              Last cleanup: {formatDate(policy.lastCleanup)}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}