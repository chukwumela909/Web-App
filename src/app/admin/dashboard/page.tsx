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
  Settings,
  Monitor,
  ScrollText,
  ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminDashboardPage() {
  const router = useRouter()

  const adminFeatures = [
    {
      title: 'User Management',
      description: 'Manage system users and their access',
      icon: Users,
      path: '/super-admin/users',
      permission: 'user_management'
    },
    {
      title: 'System Health',
      description: 'Monitor system performance and health',
      icon: Monitor,
      path: '/super-admin/system-health',
      permission: 'system_health'
    },
    {
      title: 'Audit Logs',
      description: 'View system audit trails and logs',
      icon: ScrollText,
      path: '/super-admin/audit-logs',
      permission: 'audit_logs'
    },
    {
      title: 'Settings',
      description: 'Configure system settings',
      icon: Settings,
      path: '/super-admin/settings',
      permission: 'settings'
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
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">System administration and management</p>
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
                    <LayoutDashboard className="h-5 w-5" />
                    Admin Control Panel
                  </CardTitle>
                  <CardDescription>
                    Access administrative features and system management tools
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>

            {/* Admin Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminFeatures.map((feature, index) => {
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

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                  <CardDescription>
                    Quick system statistics and status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">--</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">Online</div>
                      <div className="text-sm text-muted-foreground">System Status</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">--</div>
                      <div className="text-sm text-muted-foreground">Active Sessions</div>
                    </div>
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
