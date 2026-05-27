'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications, NotificationItem } from '@/contexts/NotificationsContext'
import { getProducts } from '@/lib/firestore'

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const notificationVariant = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
}

// Notification Icons matching Figma design exactly
const WarningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.56 20.74C2.86 20.92 3.21 21.01 3.56 21H20.49C20.84 21.01 21.19 20.92 21.49 20.74C21.79 20.56 22.05 20.3 22.23 20C22.41 19.7 22.5 19.36 22.5 19C22.5 18.64 22.41 18.3 22.23 18L13.76 3.86C13.58 3.56 13.32 3.32 13.02 3.14C12.72 2.96 12.38 2.87 12.03 2.87C11.68 2.87 11.34 2.96 11.04 3.14C10.74 3.32 10.48 3.56 10.29 3.86Z" stroke="#F29F05" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#2175C7" strokeWidth="2"/>
    <path d="M12 16V12M12 8H12.01" stroke="#2175C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const AlertIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2"/>
    <path d="M12 8V12M12 16H12.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="#717171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)


const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'warning':
      return <WarningIcon />
    case 'alert':
      return <AlertIcon />
    case 'info':
    default:
      return <InfoIcon />
  }
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { notifications, dismissNotification, markAllAsSeen, updateNotifications } = useNotifications()

  useEffect(() => {
    const loadLowStockNotifications = async () => {
      if (!user) return

      try {
        const products = await getProducts(user.uid)
        const lowStockNotifications: NotificationItem[] = products
          .filter(product => product.lowStockAlertEnabled !== false)
          .filter(product => product.quantity <= product.minStockLevel && product.quantity > 0)
          .map(product => ({
            id: `low-stock-${product.id}`,
            type: 'warning',
            title: 'Low Stock Alert',
            highlightedText: product.name,
            message: ` is running low in inventory. Only ${product.quantity} units remaining.`,
            createdAt: Date.now(),
            seen: false
          }))

        updateNotifications(prev => {
          const nonLowStock = prev.filter(notification => !notification.id.startsWith('low-stock-'))
          return [...lowStockNotifications, ...nonLowStock]
        })
      } catch (error) {
        console.error('Failed to load low stock notifications:', error)
      }
    }

    loadLowStockNotifications()
  }, [user, updateNotifications])

  useEffect(() => {
    if (notifications.length > 0) {
      markAllAsSeen()
    }
  }, [notifications.length, markAllAsSeen])

  const renderMessage = (notification: NotificationItem) => {
    if (notification.highlightedText) {
      return (
        <p className="font-dm-sans font-normal text-[16px] text-[#717171] leading-normal">
          <span className="font-medium text-[#717171]">{notification.highlightedText}</span>
          {notification.message}
        </p>
      )
    }
    return (
      <p className="font-dm-sans font-normal text-[16px] text-[#717171] leading-normal">
        {notification.message}
      </p>
    )
  }

  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp
    const minutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="space-y-6"
        >
          {/* Activity Header - matching Figma design */}
          <motion.div variants={fadeInUp} className="flex flex-col gap-2">
            <h1 className="font-dm-sans font-black text-[28px] text-black leading-normal">
              Activity
            </h1>
            <p className="font-dm-sans font-normal text-[16px] text-[#717171] leading-normal">
              Stay updated with your business activities
            </p>
          </motion.div>

          {/* Notifications List */}
          <motion.div variants={fadeInUp}>
            <div className="flex flex-col gap-6">
              <AnimatePresence mode="popLayout">
                {notifications.length === 0 ? (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-16 text-center"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="#717171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="font-dm-sans font-semibold text-[18px] text-[#001223] mb-2">
                      No Notifications
                    </h3>
                    <p className="font-dm-sans font-normal text-[14px] text-[#717171]">
                      You&apos;re all caught up! Check back later for updates.
                    </p>
                  </motion.div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      variants={notificationVariant}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      layout
                      className="flex items-center justify-between pb-6 border-b border-[#d9d9e0]"
                    >
                      {/* Left section - Icon and content */}
                      <div className="flex gap-5 items-start flex-1">
                        {/* Icon */}
                        <div className="shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Notification text */}
                        <div className="flex flex-col gap-4 max-w-[534px]">
                          {/* Title section */}
                          <div className="flex flex-col gap-1">
                            <h3 className="font-dm-sans font-semibold text-[16px] text-[#001223] leading-normal">
                              {notification.title}
                            </h3>
                            {renderMessage(notification)}
                          </div>

                          {/* Timestamp */}
                          <p className="font-dm-sans font-light text-[14px] text-[#717171] leading-normal">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Close button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => dismissNotification(notification.id)}
                        className="shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label={`Dismiss ${notification.title}`}
                      >
                        <CloseIcon />
                      </motion.button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
