'use client'

import React, { useEffect, useState } from 'react'
import AdminRoute from '@/components/auth/AdminRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { 
  Monitor, 
  Server, 
  Database,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Globe
} from 'lucide-react'

interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
    status: 'healthy' | 'warning' | 'critical'
  }
  memory: {
    used: number
    total: number
    percentage: number
    status: 'healthy' | 'warning' | 'critical'
  }
  disk: {
    used: number
    total: number
    percentage: number
    status: 'healthy' | 'warning' | 'critical'
  }
  network: {
    incoming: number
    outgoing: number
    status: 'healthy' | 'warning' | 'critical'
  }
  database: {
    connections: number
    queryTime: number
    status: 'healthy' | 'warning' | 'critical'
  }
  uptime: number
  lastUpdated: Date
}

interface Service {
  name: string
  status: 'running' | 'stopped' | 'error'
  uptime: number
  lastChecked: Date
  url?: string
}

const mockSystemMetrics: SystemMetrics = {
  cpu: {
    usage: 45,
    cores: 8,
    status: 'healthy'
  },
  memory: {
    used: 6.2,
    total: 16,
    percentage: 39,
    status: 'healthy'
  },
  disk: {
    used: 180,
    total: 500,
    percentage: 36,
    status: 'healthy'
  },
  network: {
    incoming: 1250,
    outgoing: 890,
    status: 'healthy'
  },
  database: {
    connections: 15,
    queryTime: 125,
    status: 'healthy'
  },
  uptime: 99.97,
  lastUpdated: new Date()
}

const mockServices: Service[] = [
  {
    name: 'Web Server',
    status: 'running',
    uptime: 99.99,
    lastChecked: new Date(),
    url: 'https://fahampesa.com'
  },
  {
    name: 'API Server',
    status: 'running',
    uptime: 99.95,
    lastChecked: new Date(),
    url: 'https://api.fahampesa.com'
  },
  {
    name: 'Database',
    status: 'running',
    uptime: 99.98,
    lastChecked: new Date()
  },
  {
    name: 'Firebase Auth',
    status: 'running',
    uptime: 100,
    lastChecked: new Date()
  },
  {
    name: 'File Storage',
    status: 'running',
    uptime: 99.92,
    lastChecked: new Date()
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
    case 'running':
      return 'bg-green-100 text-green-800'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800'
    case 'critical':
    case 'error':
      return 'bg-red-100 text-red-800'
    case 'stopped':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
    case 'running':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'warning':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'critical':
    case 'error':
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    default:
      return <Activity className="h-4 w-4 text-gray-500" />
  }
}

export default function SystemHealthPage() {
  const [metrics, setMetrics] = useState<SystemMetrics>(mockSystemMetrics)
  const [services, setServices] = useState<Service[]>(mockServices)
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setMetrics({ ...mockSystemMetrics, lastUpdated: new Date() })
      setIsLoading(false)
    }, 1000)
  }

  return (
    <AdminRoute requiredPermission="system_health">
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">System Health Monitor</h2>
            <p className="text-muted-foreground">
              Real-time monitoring of system performance and services
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor('healthy')}>
              System Healthy
            </Badge>
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
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.uptime}%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Services</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {services.filter(s => s.status === 'running').length}/{services.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Services online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">DB Connections</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.database.connections}</div>
              <p className="text-xs text-muted-foreground">
                Active connections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.database.queryTime}ms</div>
              <p className="text-xs text-muted-foreground">
                Avg query time
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Cpu className="h-5 w-5 mr-2" />
                    CPU Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Usage</span>
                    <span className="text-sm text-muted-foreground">{metrics.cpu.usage}%</span>
                  </div>
                  <Progress value={metrics.cpu.usage} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    {metrics.cpu.cores} cores available
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="h-5 w-5 mr-2" />
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Used Memory</span>
                    <span className="text-sm text-muted-foreground">
                      {metrics.memory.used}GB / {metrics.memory.total}GB
                    </span>
                  </div>
                  <Progress value={metrics.memory.percentage} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    {metrics.memory.percentage}% utilized
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HardDrive className="h-5 w-5 mr-2" />
                    Disk Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Used Space</span>
                    <span className="text-sm text-muted-foreground">
                      {metrics.disk.used}GB / {metrics.disk.total}GB
                    </span>
                  </div>
                  <Progress value={metrics.disk.percentage} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    {metrics.disk.percentage}% utilized
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wifi className="h-5 w-5 mr-2" />
                    Network Traffic
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Incoming</span>
                      <span className="text-sm text-muted-foreground">{metrics.network.incoming} KB/s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Outgoing</span>
                      <span className="text-sm text-muted-foreground">{metrics.network.outgoing} KB/s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
                <CardDescription>
                  Current status of all system services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <motion.div
                      key={service.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(service.status)}
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-500">
                            Uptime: {service.uptime}% • Last checked: {service.lastChecked.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                        {service.url && (
                          <Button variant="ghost" size="sm">
                            <Globe className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* CPU Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Cpu className="h-5 w-5 mr-2" />
                    CPU Usage Trend
                  </CardTitle>
                  <CardDescription>Last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Current: {metrics.cpu.usage}%</span>
                      <span className="text-muted-foreground">Peak: 78%</span>
                    </div>
                    <div className="h-32 bg-gray-50 rounded-lg p-4 relative overflow-hidden">
                      {/* Simple CSS-based chart */}
                      <div className="flex items-end justify-between h-full space-x-1">
                        {[35, 42, 38, 45, 52, 48, 55, 62, 58, 65, 72, 68, 75, 78, 72, 68, 65, 62, 58, 55, 52, 48, 45, 42].map((value, index) => (
                          <div
                            key={index}
                            className="bg-blue-500 rounded-t-sm flex-1 transition-all duration-300 hover:bg-blue-600"
                            style={{ height: `${(value / 100) * 100}%` }}
                            title={`${value}% at ${index}:00`}
                          />
                        ))}
                      </div>
                      <div className="absolute bottom-2 left-4 text-xs text-gray-500">00:00</div>
                      <div className="absolute bottom-2 right-4 text-xs text-gray-500">23:00</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Avg: 56%</span>
                      <span>Min: 35%</span>
                      <span>Max: 78%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Memory Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="h-5 w-5 mr-2" />
                    Memory Usage Trend
                  </CardTitle>
                  <CardDescription>Last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Current: {metrics.memory.percentage}%</span>
                      <span className="text-muted-foreground">Peak: 65%</span>
                    </div>
                    <div className="h-32 bg-gray-50 rounded-lg p-4 relative overflow-hidden">
                      <div className="flex items-end justify-between h-full space-x-1">
                        {[28, 32, 35, 38, 42, 45, 48, 52, 55, 58, 62, 65, 62, 58, 55, 52, 48, 45, 42, 38, 35, 32, 28, 25].map((value, index) => (
                          <div
                            key={index}
                            className="bg-green-500 rounded-t-sm flex-1 transition-all duration-300 hover:bg-green-600"
                            style={{ height: `${(value / 100) * 100}%` }}
                            title={`${value}% at ${index}:00`}
                          />
                        ))}
                      </div>
                      <div className="absolute bottom-2 left-4 text-xs text-gray-500">00:00</div>
                      <div className="absolute bottom-2 right-4 text-xs text-gray-500">23:00</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Avg: 44%</span>
                      <span>Min: 25%</span>
                      <span>Max: 65%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network Traffic Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wifi className="h-5 w-5 mr-2" />
                    Network Traffic
                  </CardTitle>
                  <CardDescription>Incoming/Outgoing data flow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>In: {metrics.network.incoming} KB/s</span>
                      <span>Out: {metrics.network.outgoing} KB/s</span>
                    </div>
                    <div className="h-32 bg-gray-50 rounded-lg p-4 relative overflow-hidden">
                      <div className="flex items-end justify-between h-full space-x-1">
                        {Array.from({ length: 24 }, (_, index) => {
                          const inValue = Math.floor(Math.random() * 2000) + 500
                          const outValue = Math.floor(Math.random() * 1500) + 300
                          return (
                            <div key={index} className="flex flex-col justify-end flex-1 space-y-1">
                              <div
                                className="bg-blue-400 rounded-t-sm transition-all duration-300 hover:bg-blue-500"
                                style={{ height: `${(inValue / 2500) * 50}%` }}
                                title={`In: ${inValue} KB/s at ${index}:00`}
                              />
                              <div
                                className="bg-orange-400 rounded-t-sm transition-all duration-300 hover:bg-orange-500"
                                style={{ height: `${(outValue / 2500) * 50}%` }}
                                title={`Out: ${outValue} KB/s at ${index}:00`}
                              />
                            </div>
                          )
                        })}
                      </div>
                      <div className="absolute bottom-2 left-4 text-xs text-gray-500">00:00</div>
                      <div className="absolute bottom-2 right-4 text-xs text-gray-500">23:00</div>
                    </div>
                    <div className="flex items-center justify-center space-x-6 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-400 rounded"></div>
                        <span>Incoming</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-400 rounded"></div>
                        <span>Outgoing</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Database Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Database Response Time
                  </CardTitle>
                  <CardDescription>Query performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Current: {metrics.database.queryTime}ms</span>
                      <span className="text-muted-foreground">Peak: 280ms</span>
                    </div>
                    <div className="h-32 bg-gray-50 rounded-lg p-4 relative overflow-hidden">
                      <div className="flex items-end justify-between h-full space-x-1">
                        {[120, 135, 142, 158, 165, 172, 185, 195, 210, 225, 240, 255, 280, 265, 250, 235, 220, 205, 190, 175, 160, 145, 130, 125].map((value, index) => (
                          <div
                            key={index}
                            className={`rounded-t-sm flex-1 transition-all duration-300 ${
                              value > 200 ? 'bg-red-500 hover:bg-red-600' : 
                              value > 150 ? 'bg-yellow-500 hover:bg-yellow-600' : 
                              'bg-green-500 hover:bg-green-600'
                            }`}
                            style={{ height: `${(value / 300) * 100}%` }}
                            title={`${value}ms at ${index}:00`}
                          />
                        ))}
                      </div>
                      <div className="absolute bottom-2 left-4 text-xs text-gray-500">00:00</div>
                      <div className="absolute bottom-2 right-4 text-xs text-gray-500">23:00</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Avg: 185ms</span>
                      <span>Min: 120ms</span>
                      <span>Max: 280ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Performance Summary
                </CardTitle>
                <CardDescription>
                  Key performance indicators and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">99.8%</div>
                    <div className="text-sm text-blue-800">Uptime</div>
                    <div className="text-xs text-blue-600 mt-1">↑ 0.2% vs last week</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">185ms</div>
                    <div className="text-sm text-green-800">Avg Response</div>
                    <div className="text-xs text-green-600 mt-1">↓ 15ms vs last week</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">1.2GB/h</div>
                    <div className="text-sm text-yellow-800">Data Transfer</div>
                    <div className="text-xs text-yellow-600 mt-1">↑ 8% vs last week</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">15</div>
                    <div className="text-sm text-purple-800">DB Connections</div>
                    <div className="text-xs text-purple-600 mt-1">→ No change</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>
                  Active alerts and system notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                  <p className="font-medium text-green-600">All systems operational</p>
                  <p className="text-sm">No active alerts at this time</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminRoute>
  )
}
