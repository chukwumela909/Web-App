'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Bell, 
  FileText, 
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Monitor,
  Radio,
  ScrollText,
  UserCog,
  LogOut,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface SuperAdminLayoutProps {
  children: React.ReactNode
  currentPage: string
}

const navigation = [
  { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
  { name: 'User & Staff Management', href: '/super-admin/users', icon: Users },
  { name: 'Reports & Exports', href: '/super-admin/reports', icon: FileText },
  { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: ScrollText },
  { name: 'System Health Monitor', href: '/super-admin/system-health', icon: Monitor },
  { name: 'Alerts & Notifications', href: '/super-admin/alerts', icon: Bell },
  { name: 'Broadcast Announcements', href: '/super-admin/broadcast', icon: Radio },
  { name: 'Staff', href: '/super-admin/staff', icon: UserCog },
  { name: 'Settings', href: '/super-admin/settings', icon: Settings },
  { name: 'Payments & Subscriptions', href: '/super-admin/payments', icon: CreditCard },
]

export default function SuperAdminLayout({ children, currentPage }: SuperAdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { logout } = useAuth()
  const { toast } = useToast()

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: 'Success',
        description: 'Logged out successfully'
      })
    } catch (error) {
      console.error('Error logging out:', error)
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive'
      })
    }
  }

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 }
  }

  const contentVariants = {
    expanded: { marginLeft: 280 },
    collapsed: { marginLeft: 80 }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 z-50 h-screen border-r border-border bg-card hidden lg:flex flex-col"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <span className="font-semibold text-foreground">FahamPesa Admin</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = currentPage === item.href
            return (
              <motion.a
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="ml-3"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.a>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-border">
          <motion.button
            onClick={handleLogout}
            className={cn(
              "flex items-center w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="ml-3"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 z-50 h-screen w-80 border-r border-border bg-card lg:hidden flex flex-col"
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <span className="font-semibold text-foreground">FahamPesa Admin</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navigation.map((item) => {
                const isActive = currentPage === item.href
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="ml-3">{item.name}</span>
                  </a>
                )
              })}
            </nav>

            {/* Mobile Logout Button */}
            <div className="p-4 border-t border-border">
              <button
                onClick={() => {
                  handleLogout()
                  setMobileMenuOpen(false)
                }}
                className="flex items-center w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.main
        variants={contentVariants}
        animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen lg:ml-80"
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card lg:hidden">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground">FahamPesa Admin</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="h-8 w-8"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </motion.main>

      
    </div>
  )
}
