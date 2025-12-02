'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { 
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

// Mock notifications data
const notifications = [
  {
    id: 1,
    type: 'info',
    title: 'Welcome to FahamPesa!',
    message: 'Your account has been successfully set up. Start managing your business today.',
    time: '2 hours ago',
    read: false
  },
  {
    id: 2,
    type: 'warning',
    title: 'Low Stock Alert',
    message: 'Product "Maize Flour" is running low in inventory. Only 5 units remaining.',
    time: '1 day ago',
    read: true
  },
  {
    id: 3,
    type: 'success',
    title: 'Payment Received',
    message: 'KSh 2,500 payment received from customer John Doe.',
    time: '2 days ago',
    read: true
  },
  {
    id: 4,
    type: 'info',
    title: 'Weekly Report Available',
    message: 'Your weekly sales report is ready for review.',
    time: '3 days ago',
    read: true
  }
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon className="h-6 w-6 text-[#66BB6A]" />
    case 'warning':
      return <ExclamationTriangleIcon className="h-6 w-6 text-[#F29F05]" />
    case 'error':
      return <ExclamationTriangleIcon className="h-6 w-6 text-[#DC2626]" />
    default:
      return <InformationCircleIcon className="h-6 w-6 text-[#2175C7]" />
  }
}

const getNotificationBg = (type: string, read: boolean) => {
  const baseClasses = read ? 'bg-card' : 'bg-muted/50'
  return baseClasses
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <motion.div initial="initial" animate="animate" variants={fadeInUp} className="space-y-6">
          
          {/* Notifications Header */}
          <motion.div variants={fadeInUp}>
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex items-center space-x-3">
                <BellIcon className="h-8 w-8 text-[#2175C7]" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">All Notifications</h1>
                  <p className="text-muted-foreground">Stay updated with your business activities</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notifications List */}
          <motion.div variants={fadeInUp}>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="bg-card rounded-2xl p-8 shadow-sm border border-border text-center">
                  <BellIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-card-foreground mb-2">No Notifications</h3>
                  <p className="text-muted-foreground">You&apos;re all caught up! Check back later for updates.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    variants={fadeInUp}
                    className={`${getNotificationBg(notification.type, notification.read)} rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-all cursor-pointer`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-card-foreground mb-1">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {notification.message}
                            </p>
                          </div>
                          
                          {!notification.read && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="w-3 h-3 bg-[#2175C7] rounded-full"></div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center mt-3 space-x-2">
                          <ClockIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Mark All as Read Button */}
          {notifications.some(n => !n.read) && (
            <motion.div variants={fadeInUp} className="text-center">
              <button className="bg-[#2175C7] text-white px-6 py-3 rounded-xl hover:bg-[#1565c0] transition-colors font-medium">
                Mark All as Read
              </button>
            </motion.div>
          )}

        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
