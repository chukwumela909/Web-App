'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Bell, 
  Radio, 
  Monitor, 
  ScrollText, 
  Settings,
  UserCog,
  Eye,
  LogOut,
  Loader2,
  Shield
} from 'lucide-react'

// Define staff roles and their permissions (same as in super-admin)
const STAFF_ROLES = {
  'Super Admin': {
    name: 'Super Admin',
    color: 'bg-red-100 text-red-800',
    permissions: [
      'dashboard',
      'user_management', 
      'reports_exports',
      'audit_logs',
      'system_health',
      'alerts_notifications',
      'broadcast_announcements',
      'staff_management',
      'settings'
    ]
  },
  'System Admin': {
    name: 'System Admin', 
    color: 'bg-purple-100 text-purple-800',
    permissions: [
      'dashboard',
      'user_management',
      'audit_logs', 
      'system_health',
      'broadcast_announcements',
      'settings'
    ]
  },
  'Customer Support': {
    name: 'Customer Support',
    color: 'bg-blue-100 text-blue-800', 
    permissions: [
      'user_management_view',
      'alerts_notifications',
      'broadcast_announcements'
    ]
  },
  'Finance / Accounting': {
    name: 'Finance / Accounting',
    color: 'bg-green-100 text-green-800',
    permissions: [
      'reports_exports'
    ]
  },
  'Sales / Onboarding Agent': {
    name: 'Sales / Onboarding Agent',
    color: 'bg-orange-100 text-orange-800',
    permissions: [
      'user_management',
      'reports_exports', 
      'broadcast_announcements'
    ]
  }
}

const PERMISSIONS = {
  dashboard: { name: 'Dashboard', icon: LayoutDashboard, description: 'Access to main dashboard', path: '/dashboard' },
  user_management: { name: 'User & Staff Management', icon: Users, description: 'Full user and staff management access', path: '/super-admin/users' },
  user_management_view: { name: 'User Management (View Only)', icon: Eye, description: 'View-only access to user management', path: '/super-admin/users' },
  reports_exports: { name: 'Reports & Exports', icon: FileText, description: 'Access to reports and data exports', path: '/super-admin/reports' },
  audit_logs: { name: 'Audit Logs', icon: ScrollText, description: 'View system audit logs', path: '/super-admin/audit-logs' },
  system_health: { name: 'System Health Monitor', icon: Monitor, description: 'Monitor system health and performance', path: '/super-admin/system-health' },
  alerts_notifications: { name: 'Alerts & Notifications', icon: Bell, description: 'Manage alerts and notifications', path: '/super-admin/alerts' },
  broadcast_announcements: { name: 'Broadcast Announcements', icon: Radio, description: 'Send broadcast messages', path: '/super-admin/broadcast' },
  staff_management: { name: 'Staff Management', icon: UserCog, description: 'Manage staff members and roles', path: '/super-admin/staff' },
  settings: { name: 'Settings', icon: Settings, description: 'Access system settings', path: '/super-admin/settings' }
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: keyof typeof STAFF_ROLES
  permissions: string[]
  status: 'active' | 'inactive'
  createdAt: string
  lastLogin?: string
}

export default function StaffDashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState<StaffMember | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    loadStaffData()
  }, [user, router])

  const loadStaffData = async () => {
    try {
      setLoading(true)
      
      // Fetch staff data by Firebase Auth UID
      const response = await fetch(`/api/admin/staff/${user?.uid}`)
      const data = await response.json()
      
      if (data.success) {
        setStaff(data.staff)
      } else {
        // If not found in staff collection, redirect to regular dashboard
        router.push('/dashboard')
      }
      
    } catch (error) {
      console.error('Error loading staff data:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const hasPermission = (permission: string) => {
    return staff?.permissions?.includes(permission) || false
  }

  const getAccessibleFeatures = () => {
    if (!staff) return []
    
    return staff.permissions.map(permission => PERMISSIONS[permission as keyof typeof PERMISSIONS]).filter(Boolean)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have staff access to this system.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Main Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const accessibleFeatures = getAccessibleFeatures()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">FahamPesa Staff Portal</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {staff.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge className={STAFF_ROLES[staff.role].color}>
                {staff.role}
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
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
                  <UserCog className="h-5 w-5" />
                  Staff Dashboard
                </CardTitle>
                <CardDescription>
                  Access your assigned features and manage your responsibilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Your Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {staff.name}</p>
                      <p><span className="font-medium">Email:</span> {staff.email}</p>
                      <p><span className="font-medium">Role:</span> {staff.role}</p>
                      <p><span className="font-medium">Status:</span> {staff.status}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Access Summary</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Permissions:</span> {staff.permissions.length}</p>
                      <p><span className="font-medium">Created:</span> {staff.createdAt}</p>
                      {staff.lastLogin && <p><span className="font-medium">Last Login:</span> {staff.lastLogin}</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Available Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Available Features
                </CardTitle>
                <CardDescription>
                  Features you have access to based on your role and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accessibleFeatures.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Features Available</p>
                    <p className="text-sm">Contact your administrator to get access to features.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accessibleFeatures.map((feature) => {
                      const Icon = feature.icon
                      
                      return (
                        <motion.div
                          key={feature.name}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(feature.path)}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-sm">{feature.name}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {feature.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
                  {hasPermission('dashboard') && (
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Main Dashboard
                    </Button>
                  )}
                  
                  {/* Role-specific dashboards */}
                  {(staff?.role === 'Super Admin' || staff?.role === 'System Admin') && hasPermission('user_management') && (
                    <Button onClick={() => router.push('/admin/dashboard')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  )}
                  
                  {staff?.role === 'Sales / Onboarding Agent' && hasPermission('user_management') && (
                    <Button onClick={() => router.push('/sales/dashboard')}>
                      <Users className="h-4 w-4 mr-2" />
                      Sales Dashboard
                    </Button>
                  )}
                  
                  {hasPermission('user_management') && (
                    <Button variant="outline" onClick={() => router.push('/super-admin/users')}>
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users
                    </Button>
                  )}
                  {hasPermission('reports_exports') && (
                    <Button variant="outline" onClick={() => router.push('/super-admin/reports')}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Reports
                    </Button>
                  )}
                  {hasPermission('settings') && (
                    <Button variant="outline" onClick={() => router.push('/super-admin/settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
