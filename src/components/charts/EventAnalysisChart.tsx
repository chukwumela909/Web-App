'use client'

import React from 'react'
import { motion } from 'framer-motion'
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
  Pie,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Line
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RealEventData } from '@/lib/firebase-events-service'
import { TrendingUp, Users, Zap, DollarSign } from 'lucide-react'

interface EventAnalysisChartProps {
  events: RealEventData[]
  className?: string
}

const COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue  
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
]

const formatEventName = (name: string): string => {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/\bId\b/g, 'ID')
    .replace(/\bApi\b/g, 'API')
    .replace(/\bUi\b/g, 'UI')
}

const EventAnalysisChart: React.FC<EventAnalysisChartProps> = ({ events, className = '' }) => {
  // Prepare data for different chart types
  const chartData = events.map((event, index) => ({
    name: formatEventName(event.name),
    shortName: formatEventName(event.name).split(' ').slice(0, 2).join(' '),
    count: event.count,
    users: event.uniqueUsers,
    conversion: event.conversionRate,
    revenue: event.revenueImpact,
    color: COLORS[index % COLORS.length],
    eventVolume: events.length > 0 ? (event.count / Math.max(...events.map(e => e.count))) * 100 : 0,
    userEngagement: events.length > 0 ? (event.uniqueUsers / Math.max(...events.map(e => e.uniqueUsers))) * 100 : 0,
  }))

  const RadialBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-blue-600">Event Volume: {data.eventVolume.toFixed(1)}%</p>
          <p className="text-sm text-green-600">User Engagement: {data.userEngagement.toFixed(1)}%</p>
          <p className="text-sm text-purple-600">Conversion: {data.conversion}%</p>
          {data.revenue > 0 && (
            <p className="text-sm text-orange-600">Revenue: KSh {data.revenue.toLocaleString()}</p>
          )}
        </div>
      )
    }
    return null
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'count' && `Events: ${entry.value.toLocaleString()}`}
              {entry.dataKey === 'users' && `Users: ${entry.value.toLocaleString()}`}
              {entry.dataKey === 'conversion' && `Conversion: ${entry.value}%`}
            </p>
          ))}
          {data.revenue > 0 && (
            <p className="text-sm text-orange-600">Revenue: KSh {data.revenue.toLocaleString()}</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Multi-metric Bar Chart */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Event Performance Overview
              </CardTitle>
              <CardDescription>
                Comprehensive view of event volume, user engagement, and conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="shortName" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Events" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Bar yAxisId="left" dataKey="users" fill="#22c55e" name="Users" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#f59e0b" strokeWidth={3} name="Conversion %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </motion.div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab - Radial Progress Charts */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chartData.slice(0, 6).map((event, index) => (
              <motion.div
                key={event.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{event.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={event.conversion > 50 ? 'default' : 'secondary'}>
                        {event.conversion}% conversion
                      </Badge>
                      {event.revenue > 0 && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <DollarSign className="h-3 w-3" />
                          Revenue
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="30%"
                          outerRadius="90%"
                          data={[{
                            ...event,
                            eventVolume: event.eventVolume,
                            userEngagement: event.userEngagement
                          }]}
                        >
                          <RadialBar
                            dataKey="eventVolume"
                            cornerRadius={10}
                            fill={event.color}
                            background={{ fill: '#f3f4f6' }}
                          />
                          <RadialBar
                            dataKey="userEngagement"
                            cornerRadius={10}
                            fill={`${event.color}80`}
                            background={{ fill: '#f3f4f6' }}
                          />
                          <Tooltip content={<RadialBarTooltip />} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }}></div>
                        <span>Volume: {event.eventVolume.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `${event.color}80` }}></div>
                        <span>Engagement: {event.userEngagement.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Engagement Tab - Horizontal Bar Chart */}
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Engagement Analysis
              </CardTitle>
              <CardDescription>
                User participation and engagement levels across different events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="horizontal"
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={120} fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="userEngagement" fill="#22c55e" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab - Pie Chart + Revenue Bars */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Distribution
                </CardTitle>
                <CardDescription>Revenue generated by each event type</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.filter(d => d.revenue > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="revenue"
                        animationBegin={0}
                        animationDuration={1000}
                      >
                        {chartData.filter(d => d.revenue > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`KSh ${value.toLocaleString()}`, 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Conversion Rates
                </CardTitle>
                <CardDescription>Conversion performance by event</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="shortName" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={11}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value: any) => [`${value}%`, 'Conversion Rate']}
                      />
                      <Bar dataKey="conversion" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EventAnalysisChart
