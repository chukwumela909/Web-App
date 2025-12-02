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
  ScrollText, 
  Search, 
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react'
import { SuperAdminService, AuditLogEntry } from '@/lib/super-admin-service'

// Using AuditLogEntry interface from our service

// Mock data removed - using real Firebase data

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'failed':
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case 'warning':
      return <Clock className="h-4 w-4 text-yellow-500" />
    default:
      return <Activity className="h-4 w-4 text-gray-500" />
  }
}

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true)
      const logs = await SuperAdminService.getAuditLogs(100)
      setAuditLogs(logs)
      setFilteredLogs(logs)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      setAuditLogs([])
      setFilteredLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let filtered = auditLogs

    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(log => log.status === selectedFilter)
    }

    setFilteredLogs(filtered)
  }, [auditLogs, searchQuery, selectedFilter])

  const handleRefresh = () => {
    fetchAuditLogs()
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting audit logs...')
  }

  return (
    <AdminRoute requiredPermission="audit_logs">
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
            <p className="text-muted-foreground">
              Track all system activities and user actions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="security">Security Events</TabsTrigger>
            <TabsTrigger value="system">System Changes</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search logs by user, action, or resource..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="warning">Warning</option>
            </select>
          </div>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ScrollText className="h-5 w-5 mr-2" />
                  Recent Audit Logs
                </CardTitle>
                <CardDescription>
                  Latest system activities and user actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(log.status)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{log.action}</span>
                            <Badge className={getStatusColor(log.status)}>
                              {log.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{log.userEmail}</span>
                              <span>•</span>
                              <Calendar className="h-3 w-3" />
                              <span>{log.timestamp.toLocaleString()}</span>
                            </span>
                          </div>
                          {log.details && (
                            <div className="text-sm text-gray-600 mt-1">
                              {log.details}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{log.resource}</span>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Events</CardTitle>
                <CardDescription>
                  Authentication and authorization related activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Security events will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Changes</CardTitle>
                <CardDescription>
                  Configuration and system-level modifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>System changes will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminRoute>
  )
}
