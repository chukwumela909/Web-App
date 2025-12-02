'use client'

import React from 'react'
import StaffRoute from '@/components/auth/StaffRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Radio,
  UserPlus,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SalesDashboardPage() {
  const router = useRouter()

  const salesFeatures = [
    {
      title: 'User Management',
      description: 'Onboard and manage users',
      icon: Users,
      path: '/super-admin/users',
      permission: 'user_management'
    },
    {
      title: 'Reports & Analytics',
      description: 'View sales reports and analytics',
      icon: FileText,
      path: '/super-admin/reports',
      permission: 'reports_exports'
    },
    {
      title: 'Broadcast Messages',
      description: 'Send announcements to users',
      icon: Radio,
      path: '/super-admin/broadcast',
      permission: 'broadcast_announcements'
    }
  ]

  return (
    <StaffRoute requiredPermission="user_management">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Sales Dashboard</h1>
                <p className="text-muted-foreground">User onboarding and sales management</p>
              </div>
              <Button variant="outline" onClick={() => router.push('/staff-dashboard')}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Staff Portal
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Sales & Onboarding Portal
                  </CardTitle>
                  <CardDescription>
                    Manage user onboarding, sales activities, and customer communications
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>

            {/* Sales Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {salesFeatures.map((feature, index) => {
                  const Icon = feature.icon
                  
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push(feature.path)}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Icon className="h-5 w-5" />
                              </div>
                              {feature.title}
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </CardTitle>
                          <CardDescription>
                            {feature.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Sales Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Sales Overview</CardTitle>
                  <CardDescription>
                    Your sales performance and metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">--</div>
                      <div className="text-sm text-muted-foreground">New Users Today</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">--</div>
                      <div className="text-sm text-muted-foreground">Active Onboarding</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">--</div>
                      <div className="text-sm text-muted-foreground">Messages Sent</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">--</div>
                      <div className="text-sm text-muted-foreground">Conversion Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => router.push('/super-admin/users')}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add New User
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/super-admin/broadcast')}>
                      <Radio className="h-4 w-4 mr-2" />
                      Send Announcement
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/super-admin/reports')}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </StaffRoute>
  )
}
