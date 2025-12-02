'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  LayoutDashboard,
  Users,
  FileText,
  ScrollText,
  Monitor,
  Bell,
  Radio,
  UserCog,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  CreditCard
} from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  status: 'active' | 'inactive'
}

// Navigation items with their required permissions
const navigationItems = [
  { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard, permission: 'dashboard' },
  { name: 'Users', href: '/super-admin/users', icon: Users, permission: 'user_management' },
  { name: 'Staff', href: '/super-admin/staff', icon: UserCog, permission: 'staff_management' },
  { name: 'Reports', href: '/super-admin/reports', icon: FileText, permission: 'reports_exports' },
  { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: ScrollText, permission: 'audit_logs' },
  { name: 'System Health', href: '/super-admin/system-health', icon: Monitor, permission: 'system_health' },
  { name: 'Alerts', href: '/super-admin/alerts', icon: Bell, permission: 'alerts_notifications' },
  { name: 'Broadcast', href: '/super-admin/broadcast', icon: Radio, permission: 'broadcast_announcements' },
  { name: 'Settings', href: '/super-admin/settings', icon: Settings, permission: 'settings' },
  { name: 'Payments & Subscriptions', href: '/super-admin/payments', icon: CreditCard, permission: 'payments_subscriptions' }
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, isSuperAdmin } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [user, isSuperAdmin])

  const loadUserData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // If super admin, no need to fetch staff data
      if (isSuperAdmin) {
        setStaff(null)
        setLoading(false)
        return
      }

      // Fetch staff data
      const response = await fetch(`/api/admin/staff/${user.uid}`)
      const data = await response.json()
      
      if (data.success) {
        setStaff(data.staff)
      }
      
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (permission: string): boolean => {
    // Super admin has all permissions
    if (isSuperAdmin) return true
    
    // Staff members need specific permissions
    return staff?.permissions?.includes(permission) || false
  }

  const getAvailableNavigation = () => {
    return navigationItems.filter(item => hasPermission(item.permission))
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account."
      })
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getUserDisplayInfo = () => {
    if (isSuperAdmin) {
      return {
        name: user?.displayName || user?.email || 'Super Admin',
        role: 'Super Admin',
        roleColor: 'bg-red-100 text-red-800'
      }
    }
    
    if (staff) {
      const roleColors: Record<string, string> = {
        'Super Admin': 'bg-red-100 text-red-800',
        'System Admin': 'bg-purple-100 text-purple-800',
        'Customer Support': 'bg-blue-100 text-blue-800',
        'Finance / Accounting': 'bg-green-100 text-green-800',
        'Sales / Onboarding Agent': 'bg-orange-100 text-orange-800'
      }
      
      return {
        name: staff.name,
        role: staff.role,
        roleColor: roleColors[staff.role] || 'bg-gray-100 text-gray-800'
      }
    }
    
    return {
      name: user?.email || 'User',
      role: 'Loading...',
      roleColor: 'bg-gray-100 text-gray-800'
    }
  }

  const availableNavigation = getAvailableNavigation()
  const userInfo = getUserDisplayInfo()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className="fixed left-0 top-0 z-30 h-full bg-card border-r border-border hidden lg:block"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold">FahamPesa</h1>
                    <p className="text-xs text-muted-foreground">Admin Panel</p>
                  </div>
                </motion.div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8 p-0"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* User Info */}
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 border-b border-border"
            >
              <div className="space-y-2">
                <p className="text-sm font-medium truncate">{userInfo.name}</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${userInfo.roleColor}`}>
                  {userInfo.role}
                </span>
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {availableNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <motion.div
                  key={item.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start ${sidebarCollapsed ? 'px-2' : 'px-3'}`}
                    onClick={() => router.push(item.href)}
                  >
                    <Icon className="h-4 w-4" />
                    {!sidebarCollapsed && <span className="ml-2">{item.name}</span>}
                  </Button>
                </motion.div>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-border">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                {!sidebarCollapsed && <span className="ml-2">Sign Out</span>}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed left-0 top-0 z-50 h-full w-80 bg-card border-r border-border lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <h1 className="text-sm font-semibold">FahamPesa</h1>
                      <p className="text-xs text-muted-foreground">Admin Panel</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Mobile User Info */}
              <div className="p-4 border-b border-border">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{userInfo.name}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${userInfo.roleColor}`}>
                    {userInfo.role}
                  </span>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {availableNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Button
                      key={item.name}
                      variant={isActive ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        router.push(item.href)
                        setSidebarOpen(false)
                      }}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Button>
                  )
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="p-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    handleLogout()
                    setSidebarOpen(false)
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'} transition-all duration-300`}>
        {/* Mobile Header */}
        <header className="lg:hidden bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                <Shield className="h-3 w-3" />
              </div>
              <span className="font-semibold text-sm">FahamPesa Admin</span>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${userInfo.roleColor}`}>
              {userInfo.role}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
