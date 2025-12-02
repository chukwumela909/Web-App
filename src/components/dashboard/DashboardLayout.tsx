'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { useStaffRedirect } from '@/hooks/useStaffRedirect'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { 
  Squares2X2Icon,
  ArchiveBoxIcon,
  ShoppingCartIcon,
  BuildingLibraryIcon,
  PresentationChartBarIcon,
  BellIcon,
  UserCircleIcon,
  TruckIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  QuestionMarkCircleIcon,
  CubeIcon,
  BanknotesIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getBranches } from '@/lib/branches-service'
import { Branch } from '@/lib/branches-types'
import CreditCardIcon from './icons/CreditCardIcon'

// Navigation items with required permissions
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon, permission: 'dashboard:read' },
  { name: 'Products', href: '/dashboard/products', icon: CubeIcon, permission: 'products:read' },
  { name: 'Sales', href: '/dashboard/sales', icon: BanknotesIcon, permission: 'sales:read' },
  { name: 'Inventory', href: '/dashboard/inventory', icon: ArchiveBoxIcon, permission: 'inventory:read' },
  { name: 'Debtors', href: '/dashboard/debtors', icon: BuildingLibraryIcon, permission: 'customers:read' },
  { name: 'Reports', href: '/dashboard/reports', icon: PresentationChartBarIcon, permission: 'reports:basic_read' },
  { name: 'Suppliers', href: '/dashboard/suppliers', icon: TruckIcon, permission: 'transfers:create' },
  { name: 'Branches', href: '/dashboard/branches', icon: BuildingOfficeIcon, permission: 'staff:manage_branch' },
  { name: 'Staff', href: '/dashboard/staff', icon: UsersIcon, permission: 'staff:read' },
  { name: 'Payments & Subscriptions', href: '/dashboard/payments', icon: CreditCardIcon, permission: 'dashboard:read' },
]

// Page titles and subtitles matching mobile app
const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Hello, {{username}}', subtitle: undefined },
  '/dashboard/products': { title: 'Products', subtitle: 'Manage Product Catalog' },
  '/dashboard/inventory': { title: 'Inventory', subtitle: 'Manage Products & Stock' },
  '/dashboard/sales': { title: 'Sales', subtitle: 'Record & Track Sales' },
  '/dashboard/reports': { title: 'Reports & Analytics', subtitle: 'Smart Business Insights' },
  '/dashboard/debtors': { title: 'Debtor', subtitle: 'Create a new credit customer' },
  '/dashboard/expenses': { title: 'Expenses', subtitle: 'Track Business Expenses' },
  '/dashboard/settings': { title: 'Settings', subtitle: 'Manage Account, Business & System Settings' },
  '/dashboard/notifications': { title: 'Notifications', subtitle: 'Stay Updated' },
  '/dashboard/suppliers': { title: 'Suppliers', subtitle: 'Manage Business Suppliers' },
  '/dashboard/payments': { title: 'Payments & Subscriptions', subtitle: 'Keep track of your subscription details' },
  '/dashboard/branches': { title: 'Branches', subtitle: 'Manage Business Locations' },
  '/dashboard/staff': { title: 'Staff', subtitle: 'Manage Team Members' },
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const { staff, hasPermission, loading: staffLoading } = useStaff()
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscriptionStatus()
  const pathname = usePathname()
  const router = useRouter()
  
  // Smart redirect for staff members without appropriate permissions
  useStaffRedirect()
  
  // Branch state management
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [branchesLoading, setBranchesLoading] = useState(true)
  const [showBranchDropdown, setShowBranchDropdown] = useState(false)

  // Determine the effective user ID for data loading
  const effectiveUserId = staff ? staff.userId : user?.uid

  // Load branches when user is available
  useEffect(() => {
    if (effectiveUserId) {
      loadBranches()
    }
  }, [effectiveUserId])

  // Filter navigation items based on staff permissions
  const filteredNavigationItems = navigationItems.filter(item => {
    // If no staff (regular user/owner), show all items
    if (!staff) return true
    
    // For staff members, check permissions
    return hasPermission(item.permission)
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showBranchDropdown && !(event.target as Element).closest('.branch-dropdown')) {
        setShowBranchDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBranchDropdown])

  const loadBranches = async () => {
    try {
      setBranchesLoading(true)
      if (!effectiveUserId) return

      const allBranches = await getBranches(effectiveUserId)
      
      // Filter branches for staff members based on their assigned branches
      let userBranches = allBranches
      if (staff && staff.branchIds.length > 0) {
        userBranches = allBranches.filter(branch => staff.branchIds.includes(branch.id))
      }
      
      setBranches(userBranches)
      
      // Set default branch (first active branch or first branch)
      if (userBranches.length > 0 && !selectedBranch) {
        const defaultBranch = userBranches.find(b => b.status === 'ACTIVE') || userBranches[0]
        setSelectedBranch(defaultBranch.id)
      }
    } catch (error) {
      console.error('Error loading branches:', error)
    } finally {
      setBranchesLoading(false)
    }
  }

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId)
    setShowBranchDropdown(false)
    // You can add additional logic here to refresh dashboard data
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleUserIconClick = () => {
    router.push('/dashboard/settings')
  }

  const handleNotificationClick = () => {
    router.push('/dashboard/notifications')
  }

  // Get current page info
  const currentPageInfo = pageTitles[pathname] || { title: 'Dashboard', subtitle: undefined }
  const displayName = staff ? staff.fullName : (user?.email?.split('@')[0] || 'User')
  const displayTitle = currentPageInfo.title.replace('{{username}}', displayName)
  const currentBranch = branches.find(b => b.id === selectedBranch)

  return (
    <div className="h-screen flex bg-background chrome-flex-row chrome-gpu-acceleration">
      {/* Sidebar Navigation - replacing bottom navigation */}
      <div className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-card/98 border-r border-border/50 shadow-2xl z-50 supports-[backdrop-filter]:bg-card/95 supports-[backdrop-filter]:backdrop-blur-md backdrop-blur-fallback chrome-transition chrome-shadow chrome-performance">
        <div className="flex flex-col w-full">
          {/* Sidebar Header */}
          <div className="flex-shrink-0 flex items-center justify-center h-16 border-b border-border/30 px-4">
            <h2 className="text-xl font-bold text-foreground">FahamPesa</h2>
          </div>
          

          
          {/* Navigation Items */}
          <nav className="flex-1 py-6">
            <div className="space-y-2 px-4">
              {filteredNavigationItems.map((item) => {
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center py-3 px-4 rounded-xl transition-all duration-300 group ${
                      isActive
                        ? 'text-primary bg-primary/10 shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-primary hover:bg-accent/50 hover:shadow-md'
                    }`}
                  >
                    <item.icon
                      className={`h-6 w-6 mr-3 transition-all duration-300 ${
                        isActive 
                          ? 'text-primary scale-110' 
                          : 'text-muted-foreground group-hover:text-primary group-hover:scale-105'
                      }`}
                    />
                    <span className={`text-sm font-semibold transition-all duration-300 ${
                      isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground group-hover:text-primary'
                    }`}>
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </nav>
          
          {/* User Profile Section at Bottom */}
          <div className="flex-shrink-0 border-t border-border/30 px-4 py-4">
            <button
              onClick={handleUserIconClick}
              className="flex items-center w-full py-3 px-4 rounded-xl hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-all duration-200 chrome-flex-fix chrome-transition chrome-border-radius"
              title="Settings"
            >
              <UserCircleIcon className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors mr-3" />
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:ml-64">
        {/* Top navigation bar - mobile app style with transparent/white background */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-background/95 border-b border-border/30 shadow-sm supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur-md backdrop-blur-fallback chrome-flex-fix chrome-transition chrome-shadow">
          <div className="flex-1 px-4 flex justify-between items-center">
            {/* Mobile menu button on mobile - user icon on larger screens */}
            <button
              onClick={handleUserIconClick}
              className="md:hidden inline-flex items-center p-2 rounded-full hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-all duration-200 chrome-flex-fix chrome-transition chrome-border-radius"
              title="Settings"
            >
              <UserCircleIcon className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
            
            {/* Page title in center */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 ml-32">
              <h1 className="text-lg font-bold text-foreground text-center">
                {displayTitle}
              </h1>
              {currentPageInfo.subtitle && (
                <p className="text-sm text-muted-foreground text-center">
                  {currentPageInfo.subtitle}
                </p>
              )}
            </div>
            
            {/* Right side icons */}
            <div className="flex items-center space-x-3">
              {/* Branch Selector - show if user has multiple branches */}
              {branches.length > 1 && (
                <div className="relative branch-dropdown">
                  <button
                    onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground bg-muted/50 border border-border/50 rounded-lg hover:bg-muted/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                  >
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline truncate max-w-24">
                      {branchesLoading ? 'Loading...' : (currentBranch?.name || 'Select Branch')}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 ml-1 flex-shrink-0" />
                  </button>
                  
                  {/* Branch Dropdown */}
                  {showBranchDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                      <div className="py-1">
                        {branches.map((branch) => (
                          <button
                            key={branch.id}
                            onClick={() => handleBranchChange(branch.id)}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors ${
                              selectedBranch === branch.id 
                                ? 'bg-primary/10 text-primary font-medium' 
                                : 'text-foreground hover:text-foreground'
                            }`}
                          >
                            <div className="flex items-center">
                              <BuildingOfficeIcon className={`h-4 w-4 mr-2 ${
                                selectedBranch === branch.id ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{branch.name}</div>
                                {branch.branchCode && (
                                  <div className="text-xs text-muted-foreground truncate">{branch.branchCode}</div>
                                )}
                              </div>
                              {selectedBranch === branch.id && (
                                <CheckIcon className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Go Pro Now Button - Only show if not subscribed */}
              {!isSubscribed && !subscriptionLoading && (
                <Link 
                  href="/dashboard/subscription"
                  className="inline-flex items-center justify-center gap-[2.86px] px-[17.14px] py-[4.29px] rounded-[71.43px] text-white font-semibold transition-all duration-300 "
                  style={{
                    background: 'linear-gradient(90deg, rgba(64, 183, 255, 1) 0%, rgba(0, 50, 117, 1) 55%, rgba(129, 80, 249, 1) 100%)',
                    border: '1.07px solid transparent',
                    backgroundClip: 'padding-box',
                    width: '153.57px',
                    height: '40px',
                    fontFamily: 'Archivo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 600,
                    fontSize: '12.86px',
                    lineHeight: '1.088em',
                    boxShadow: '0 4px 12px rgba(64, 183, 255, 0.3)',
                  }}
                  title="Upgrade to Pro"
                >
                  <Zap className="w-[17.14px] h-[17.14px]" fill="currentColor" strokeWidth={0} />
                  <span>Go Pro Now</span>
                </Link>
              )}
              
              {/* Notification icon */}
              <button
                onClick={handleNotificationClick}
                className="inline-flex items-center p-2 rounded-full hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-all duration-200 chrome-flex-fix chrome-transition chrome-border-radius"
                title="Notifications"
              >
                <BellIcon className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-muted/30">
          <div className="py-6 md:pb-6 pb-32"> {/* Keep bottom padding for mobile bottom nav */}
            <div className="w-full px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation Bar for Mobile - hidden on desktop */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/98 border-t border-border/50 shadow-2xl z-50 supports-[backdrop-filter]:bg-card/95 supports-[backdrop-filter]:backdrop-blur-md backdrop-blur-fallback chrome-transition chrome-shadow chrome-performance">
        <div className="flex justify-center items-center py-3 px-6">
          <div className="flex items-center justify-center space-x-8 max-w-md w-full">
            {filteredNavigationItems.map((item) => {
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-3 px-4 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'text-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-primary hover:bg-accent/50 hover:shadow-md'
                  }`}
                >
                  <item.icon
                    className={`h-6 w-6 transition-all duration-300 ${
                      isActive 
                        ? 'text-primary scale-110' 
                        : 'text-muted-foreground group-hover:text-primary group-hover:scale-105'
                    }`}
                  />
                  <span className={`text-xs mt-2 font-semibold transition-all duration-300 ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground group-hover:text-primary'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      
    </div>
  )
}
