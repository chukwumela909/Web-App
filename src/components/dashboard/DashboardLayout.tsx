'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { useStaffRedirect } from '@/hooks/useStaffRedirect'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useNotifications } from '@/contexts/NotificationsContext'
import { useBranch } from '@/contexts/BranchContext'
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
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import CreditCardIcon from './icons/CreditCardIcon'
import { PhoneVerificationModal } from './PhoneVerificationModal'

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
  '/dashboard': { title: 'Dashboard', subtitle: undefined },
  '/dashboard/products': { title: 'Products', subtitle: 'Manage Product Catalog' },
  '/dashboard/inventory': { title: 'Inventory', subtitle: 'Manage Products & Stock' },
  '/dashboard/sales': { title: 'Sales', subtitle: 'Record & Track Sales' },
  '/dashboard/reports': { title: 'Reports & Analytics', subtitle: '' },
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
  const { notifications } = useNotifications()
  const {
    branches,
    selectedBranchId,
    selectedBranch,
    loading: branchesLoading,
    setSelectedBranchId
  } = useBranch()
  const pathname = usePathname()
  const router = useRouter()
  const hasUnseenNotifications = notifications.some(notification => !notification.seen)
  
  // Smart redirect for staff members without appropriate permissions
  useStaffRedirect()
  
  // Phone verification state - check both Firebase auth provider AND Firestore profile.
  const [phoneVerified, setPhoneVerified] = useState<boolean | null>(null)
  const [phoneCheckLoading, setPhoneCheckLoading] = useState(true)
  const [showBranchDropdown, setShowBranchDropdown] = useState(false)

  useEffect(() => {
    const checkPhoneVerification = async () => {
      if (!user) {
        setPhoneVerified(null)
        setPhoneCheckLoading(false)
        return
      }

      const hasPhoneProvider = user.providerData.some(
        provider => provider.providerId === 'phone'
      )

      if (hasPhoneProvider) {
        setPhoneVerified(true)
        setPhoneCheckLoading(false)
        return
      }

      try {
        const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid))
        setPhoneVerified(profileDoc.exists() && profileDoc.data().phoneVerified === true)
      } catch (error) {
        console.error('Error checking phone verification status:', error)
        setPhoneVerified(false)
      } finally {
        setPhoneCheckLoading(false)
      }
    }

    setPhoneCheckLoading(true)
    checkPhoneVerification()
  }, [user])

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

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId)
    setShowBranchDropdown(false)
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
  const currentBranch = selectedBranch
  const isOnVerifyPhonePage = pathname === '/dashboard/verify-phone'
  const needsPhoneVerification = user && !staff && phoneVerified === false && !phoneCheckLoading && !isOnVerifyPhonePage

  return (
    <div className="h-screen flex bg-[#f6f8fb] font-dm-sans text-[#0f172a] chrome-flex-row chrome-gpu-acceleration">
      <PhoneVerificationModal isOpen={Boolean(needsPhoneVerification)} />
      {/* Sidebar Navigation - replacing bottom navigation */}
      <div className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white/95 border-r border-[#e7ebf2] shadow-[8px_0_30px_rgba(15,23,42,0.04)] z-50 supports-[backdrop-filter]:bg-white/90 supports-[backdrop-filter]:backdrop-blur-md backdrop-blur-fallback chrome-transition chrome-shadow chrome-performance">
        <div className="flex flex-col w-full">
          {/* Sidebar Header */}
          <div className="flex-shrink-0 flex items-center h-[72px] border-b border-[#eef2f7] px-5">
            <div>
              <h2 className="text-[20px] font-bold leading-tight tracking-[-0.02em] text-[#001031]">FahamPesa</h2>
              <p className="text-[11px] font-medium text-[#64748b]">Business console</p>
            </div>
          </div>
          

          
          {/* Navigation Items */}
          <nav className="flex-1 py-5">
            <div className="space-y-1.5 px-3">
              {filteredNavigationItems.map((item) => {
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative flex items-center py-3 px-3.5 rounded-[10px] transition-all duration-200 group ${
                      isActive
                        ? 'text-[#004aad] bg-[#eef5ff]'
                        : 'text-[#64748b] hover:text-[#001031] hover:bg-[#f6f8fb]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#004aad]" />
                    )}
                    <item.icon
                      className={`h-5 w-5 mr-3 transition-colors duration-200 ${
                        isActive
                          ? 'text-[#004aad]'
                          : 'text-[#94a3b8] group-hover:text-[#004aad]'
                      }`}
                    />
                    <span className={`text-sm transition-colors duration-200 ${
                      isActive
                        ? 'font-semibold text-[#004aad]'
                        : 'font-medium text-[#64748b] group-hover:text-[#001031]'
                    }`}>
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </nav>
          
          {/* User Profile Section at Bottom */}
          <div className="flex-shrink-0 border-t border-[#eef2f7] px-3 py-4">
            <button
              onClick={handleUserIconClick}
              className="flex items-center w-full py-3 px-3.5 rounded-[10px] text-[#64748b] hover:bg-[#f6f8fb] hover:text-[#001031] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-all duration-200 chrome-flex-fix chrome-transition chrome-border-radius"
              title="Settings"
            >
              <UserCircleIcon className="h-7 w-7 mr-3" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:ml-64">
        {/* Top navigation bar - mobile app style with transparent/white background */}
        <div className="relative z-10 flex-shrink-0 flex min-h-[72px] bg-white/90 border-b border-[#e7ebf2] supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:backdrop-blur-md backdrop-blur-fallback chrome-flex-fix chrome-transition chrome-shadow">
          <div className="flex-1 px-4 sm:px-6 flex items-center gap-4">
            {/* Mobile menu button on mobile - user icon on larger screens */}
            <button
              onClick={handleUserIconClick}
              className="md:hidden inline-flex items-center p-2 rounded-full text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#001031] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-all duration-200 chrome-flex-fix chrome-transition chrome-border-radius"
              title="Settings"
            >
              <UserCircleIcon className="h-8 w-8 transition-colors" />
            </button>
            
            {/* Page title */}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[17px] sm:text-[19px] font-semibold tracking-[-0.01em] text-[#0f172a]">
                {displayTitle}
              </h1>
              {currentPageInfo.subtitle && (
                <p className="truncate text-[13px] font-medium text-[#64748b]">
                  {currentPageInfo.subtitle}
                </p>
              )}
            </div>
            
            {/* Right side icons */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* Branch Selector - always present at the top of the dashboard.
                  With multiple branches it's an interactive dropdown; with exactly
                  one branch it renders as a static, disabled control. */}
              {branches.length > 0 && (
                <div className="relative branch-dropdown">
                  <button
                    onClick={() => {
                      if (branches.length > 1) setShowBranchDropdown(!showBranchDropdown)
                    }}
                    disabled={branches.length <= 1}
                    aria-haspopup={branches.length > 1 ? 'listbox' : undefined}
                    className={`flex items-center px-3 py-2 text-sm font-medium text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ${
                      branches.length > 1
                        ? 'hover:bg-white hover:text-[#0f172a] hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)]'
                        : 'cursor-default'
                    }`}
                  >
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline truncate max-w-24">
                      {branchesLoading ? 'Loading...' : (currentBranch?.name || 'Select Branch')}
                    </span>
                    {branches.length > 1 && (
                      <ChevronDownIcon className="h-4 w-4 ml-1 flex-shrink-0" />
                    )}
                  </button>

                  {/* Branch Dropdown */}
                  {branches.length > 1 && showBranchDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-[#e2e8f0] rounded-[14px] shadow-[0_18px_45px_rgba(15,23,42,0.12)] z-50 max-h-60 overflow-y-auto">
                      <div className="py-1">
                        {branches.map((branch) => (
                          <button
                            key={branch.id}
                            onClick={() => handleBranchChange(branch.id)}
                            className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                              selectedBranchId === branch.id
                                ? 'bg-[#eef5ff] text-[#004aad] font-medium'
                                : 'text-[#0f172a] hover:bg-[#f8fafc]'
                            }`}
                          >
                            <div className="flex items-center">
                              <BuildingOfficeIcon className={`h-4 w-4 mr-2 ${
                                selectedBranchId === branch.id ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{branch.name}</div>
                                {branch.branchCode && (
                                  <div className="text-xs text-muted-foreground truncate">{branch.branchCode}</div>
                                )}
                              </div>
                              {selectedBranchId === branch.id && (
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
                className="inline-flex items-center p-2 rounded-full text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-all duration-200 chrome-flex-fix chrome-transition chrome-border-radius"
                title="Notifications"
              >
                <span className="relative">
                  <BellIcon className="h-6 w-6 transition-colors" />
                  {hasUnseenNotifications && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-background" />
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-[#f6f8fb]">
          <div className="py-6 md:pb-8 pb-32"> {/* Keep bottom padding for mobile bottom nav */}
            <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation Bar for Mobile - hidden on desktop */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 border-t border-[#e7ebf2] shadow-[0_-12px_30px_rgba(15,23,42,0.08)] z-50 supports-[backdrop-filter]:bg-white/90 supports-[backdrop-filter]:backdrop-blur-md backdrop-blur-fallback chrome-transition chrome-shadow chrome-performance">
        <div className="overflow-x-auto px-3 py-3">
          <div className="flex min-w-max items-center gap-2">
            {filteredNavigationItems.map((item) => {
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex min-w-[76px] flex-col items-center justify-center py-2.5 px-3 rounded-[12px] transition-all duration-200 group ${
                    isActive
                      ? 'text-[#004aad] bg-[#eef5ff]'
                      : 'text-[#64748b] hover:text-[#001031] hover:bg-[#f8fafc]'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 transition-colors duration-200 ${
                      isActive
                        ? 'text-[#004aad]'
                        : 'text-[#94a3b8] group-hover:text-[#004aad]'
                    }`}
                  />
                  <span className={`text-[11px] mt-1.5 font-semibold transition-colors duration-200 ${
                    isActive
                      ? 'text-[#004aad]'
                      : 'text-[#64748b] group-hover:text-[#001031]'
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
