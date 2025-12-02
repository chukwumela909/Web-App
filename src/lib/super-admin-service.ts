import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Types for real Firebase data
export interface SystemAlert {
  id: string
  type: 'usage_drop' | 'error' | 'security' | 'performance' | 'maintenance'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  status: 'active' | 'resolved' | 'dismissed'
  affectedUsers?: number
  actionRequired: boolean
  resolvedAt?: Date
  resolvedBy?: string
  metadata?: Record<string, any>
}

export interface AuditLogEntry {
  id: string
  userId: string
  userEmail: string
  action: string
  resource: string
  resourceId?: string
  ipAddress: string
  userAgent: string
  timestamp: Date
  status: 'success' | 'failed' | 'warning'
  details?: string
  changes?: Record<string, any>
  sessionId?: string
}

export interface SystemMetrics {
  id: string
  timestamp: Date
  metrics: {
    activeUsers: {
      daily: number
      weekly: number
      monthly: number
    }
    sales: {
      total: number
      monthlyTotal: number
      dailyTotal: number
    }
    products: {
      total: number
      lowStock: number
      outOfStock: number
    }
    regions: {
      active: number
      total: number
    }
    performance: {
      avgResponseTime: number
      errorRate: number
      uptime: number
    }
  }
}

export interface TransactionMetrics {
  daily: {
    count: number
    value: number
    growth: number
  }
  monthly: {
    count: number
    value: number
    growth: number
  }
}

export interface SystemHealthMetrics {
  uptime: number
  database: {
    status: 'healthy' | 'warning' | 'critical'
    responseTime: number
    connections: number
  }
  errorRate: number
  lastUpdated: Date
}

export interface BranchActivity {
  id: string
  name: string
  location: string
  activeUsers: number
  transactions24h: number
  revenue24h: number
  status: 'active' | 'inactive'
}

export interface AnalyticsDepth {
  churn: {
    rate: number
    trend: number
    totalChurned: number
  }
  retention: {
    day1: number
    day7: number
    day30: number
    trend: number
  }
  growth: {
    userGrowth: number
    revenueGrowth: number
    activeUserTrend: number
  }
}

export interface BroadcastAnnouncement {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'critical' | 'success'
  channel: 'app' | 'email' | 'all'
  targetAudience: 'all_users' | 'active_users' | 'staff' | 'admins'
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  createdAt: Date
  createdBy: string
  scheduledAt?: Date
  sentAt?: Date
  recipientCount?: number
  openRate?: number
  clickRate?: number
  metadata?: Record<string, any>
}

export interface AnalyticsReport {
  id: string
  name: string
  type: 'user_analytics' | 'sales_report' | 'behavior_analytics' | 'performance_report'
  description: string
  status: 'generating' | 'ready' | 'failed'
  createdAt: Date
  createdBy: string
  lastViewed?: Date
  lastDownloaded?: Date
  viewCount: number
  downloadCount: number
  size?: string
  data?: Record<string, any>
  fileUrl?: string
}

// Super Admin Analytics Service
export class SuperAdminService {
  
  // Helper function to safely convert various date formats to Date objects
  private static safeDate(dateValue: any): Date | null {
    if (!dateValue) return null
    
    // If it's a Firestore Timestamp, use toDate()
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate()
    }
    
    // If it's already a Date object
    if (dateValue instanceof Date) {
      return dateValue
    }
    
    // If it's a string or number, try to parse it
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const parsed = new Date(dateValue)
      return isNaN(parsed.getTime()) ? null : parsed
    }
    
    // Return null if we can't convert it
    return null
  }
  
  // User Analytics - Now using centralized service
  static async getUserMetrics() {
    try {
      const UserMetricsService = (await import('@/lib/user-metrics-service')).default
      const metrics = await UserMetricsService.getUserMetrics(true) // Force refresh
      const users = await UserMetricsService.getAllUsers(true) // Force refresh
      
      // Count unique regions
      const regions = new Set(users.map(user => user.region).filter(Boolean))
      
      return {
        total: metrics.total,
        daily: metrics.activeToday,
        weekly: metrics.activeThisWeek,
        monthly: metrics.activeThisMonth,
        regions: regions.size
      }
    } catch (error) {
      console.error('Error fetching user metrics:', error)
      return { total: 0, daily: 0, weekly: 0, monthly: 0, regions: 0 }
    }
  }
  
  // Sales Analytics
  static async getSalesMetrics() {
    try {
      const salesRef = collection(db, 'sales')
      const salesSnapshot = await getDocs(salesRef)
      
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      let totalSales = 0
      let monthlySales = 0
      let dailySales = 0
      let totalRevenue = 0
      let monthlyRevenue = 0
      
      salesSnapshot.forEach((doc) => {
        const data = doc.data()
        totalSales++
        
        const timestamp = this.safeDate(data.timestamp)
        const createdAt = this.safeDate(data.createdAt)
        const saleDate = timestamp || createdAt
        
        const amount = data.totalAmount || data.amount || 0
        totalRevenue += amount
        
        if (saleDate && saleDate >= monthStart) {
          monthlySales++
          monthlyRevenue += amount
        }
        if (saleDate && saleDate >= dayStart) {
          dailySales++
        }
      })
      
      return {
        total: totalSales,
        monthly: monthlySales,
        daily: dailySales,
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue
        }
      }
    } catch (error) {
      console.error('Error fetching sales metrics:', error)
      return { total: 0, monthly: 0, daily: 0, revenue: { total: 0, monthly: 0 } }
    }
  }
  
  // Product Analytics
  static async getProductMetrics() {
    try {
      const productsRef = collection(db, 'products')
      const productsSnapshot = await getDocs(productsRef)
      
      let totalProducts = 0
      let lowStock = 0
      let outOfStock = 0
      
      productsSnapshot.forEach((doc) => {
        const data = doc.data()
        totalProducts++
        
        const quantity = data.quantity || 0
        const minStock = data.minStockLevel || 0
        
        if (quantity === 0) outOfStock++
        else if (quantity <= minStock) lowStock++
      })
      
      return {
        total: totalProducts,
        lowStock,
        outOfStock
      }
    } catch (error) {
      console.error('Error fetching product metrics:', error)
      return { total: 0, lowStock: 0, outOfStock: 0 }
    }
  }
  
  // System Alerts
  static async getSystemAlerts(): Promise<SystemAlert[]> {
    try {
      const alertsRef = collection(db, 'system_alerts')
      const alertsQuery = query(alertsRef, orderBy('timestamp', 'desc'), limit(50))
      const alertsSnapshot = await getDocs(alertsQuery)
      
      return alertsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: this.safeDate(doc.data().timestamp) || new Date()
      })) as SystemAlert[]
    } catch (error) {
      console.error('Error fetching system alerts:', error)
      return []
    }
  }
  
  static async createSystemAlert(alert: Omit<SystemAlert, 'id' | 'timestamp'>): Promise<string> {
    try {
      const alertsRef = collection(db, 'system_alerts')
      const docRef = await addDoc(alertsRef, {
        ...alert,
        timestamp: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating system alert:', error)
      throw error
    }
  }
  
  // Audit Logs
  static async getAuditLogs(limit_count = 100): Promise<AuditLogEntry[]> {
    try {
      const logsRef = collection(db, 'audit_logs')
      const logsQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(limit_count))
      const logsSnapshot = await getDocs(logsQuery)
      
      return logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: this.safeDate(doc.data().timestamp) || new Date()
      })) as AuditLogEntry[]
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      return []
    }
  }
  
  static async logUserAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const logsRef = collection(db, 'audit_logs')
      await addDoc(logsRef, {
        ...entry,
        timestamp: serverTimestamp()
      })
    } catch (error) {
      console.error('Error logging user action:', error)
    }
  }
  
  // Broadcast Announcements
  static async getAnnouncements(): Promise<BroadcastAnnouncement[]> {
    try {
      const announcementsRef = collection(db, 'announcements')
      const announcementsQuery = query(announcementsRef, orderBy('createdAt', 'desc'))
      const announcementsSnapshot = await getDocs(announcementsQuery)
      
      return announcementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.safeDate(doc.data().createdAt) || new Date(),
        scheduledAt: this.safeDate(doc.data().scheduledAt),
        sentAt: this.safeDate(doc.data().sentAt)
      })) as BroadcastAnnouncement[]
    } catch (error) {
      console.error('Error fetching announcements:', error)
      return []
    }
  }
  
  static async createAnnouncement(announcement: Omit<BroadcastAnnouncement, 'id' | 'createdAt'>): Promise<string> {
    try {
      const announcementsRef = collection(db, 'announcements')
      const docRef = await addDoc(announcementsRef, {
        ...announcement,
        createdAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating announcement:', error)
      throw error
    }
  }

  static async updateAnnouncement(id: string, updates: Partial<BroadcastAnnouncement>): Promise<void> {
    try {
      const announcementRef = doc(db, 'announcements', id)
      await updateDoc(announcementRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating announcement:', error)
      throw error
    }
  }

  static async deleteAnnouncement(id: string): Promise<void> {
    try {
      const announcementRef = doc(db, 'announcements', id)
      await deleteDoc(announcementRef)
    } catch (error) {
      console.error('Error deleting announcement:', error)
      throw error
    }
  }

  static async sendAnnouncement(
    announcementId: string, 
    announcement: BroadcastAnnouncement
  ): Promise<{ success: boolean; recipientCount: number; error?: string }> {
    try {
      // Import notification service
      const { NotificationService } = await import('./notification-service')
      
      // Get recipients based on target audience
      const recipients = await NotificationService.getRecipients(announcement.targetAudience)
      
      if (recipients.length === 0) {
        return { success: false, recipientCount: 0, error: 'No recipients found for target audience' }
      }
      
      // Send notification
      const result = await NotificationService.sendNotification(announcement, recipients)
      
      // Update announcement status in Firestore
      const announcementRef = doc(db, 'announcements', announcementId)
      const updateData: any = {
        status: result.success ? 'sent' : 'failed',
        sentAt: serverTimestamp(),
        recipientCount: result.sent,
        metadata: {
          totalRecipients: recipients.length,
          sent: result.sent,
          failed: result.failed
        }
      }
      
      // Only add errors if they exist
      if (result.errors && result.errors.length > 0) {
        updateData.metadata.errors = result.errors
      }
      
      await updateDoc(announcementRef, updateData)
      
      return {
        success: result.success,
        recipientCount: result.sent,
        error: result.errors ? result.errors.join('; ') : undefined
      }
    } catch (error) {
      console.error('Error sending announcement:', error)
      
      // Update announcement status to failed
      try {
        const announcementRef = doc(db, 'announcements', announcementId)
        await updateDoc(announcementRef, {
          status: 'failed',
          metadata: { 
            error: String(error),
            failedAt: serverTimestamp()
          }
        })
      } catch (updateError) {
        console.error('Error updating announcement status:', updateError)
      }
      
      return { 
        success: false, 
        recipientCount: 0, 
        error: String(error) 
      }
    }
  }
  
  // Analytics Reports
  static async getReports(): Promise<AnalyticsReport[]> {
    try {
      const reportsRef = collection(db, 'analytics_reports')
      const reportsQuery = query(reportsRef, orderBy('createdAt', 'desc'))
      const reportsSnapshot = await getDocs(reportsQuery)
      
      return reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.safeDate(doc.data().createdAt) || new Date(),
        lastViewed: this.safeDate(doc.data().lastViewed),
        lastDownloaded: this.safeDate(doc.data().lastDownloaded)
      })) as AnalyticsReport[]
    } catch (error) {
      console.error('Error fetching reports:', error)
      return []
    }
  }
  
  // Recent Activity (from audit logs)
  static async getRecentActivity(limit_count = 10) {
    try {
      const logsRef = collection(db, 'audit_logs')
      const recentQuery = query(
        logsRef, 
        where('status', '==', 'success'),
        orderBy('timestamp', 'desc'), 
        limit(limit_count)
      )
      const logsSnapshot = await getDocs(recentQuery)
      
      return logsSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          action: data.action,
          user: data.userEmail,
          time: this.formatTimeAgo(this.safeDate(data.timestamp) || new Date()),
          details: data.details
        }
      })
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }
  
  // Enhanced Transaction Metrics
  static async getTransactionMetrics(): Promise<TransactionMetrics> {
    try {
      const salesRef = collection(db, 'sales')
      const multiSalesRef = collection(db, 'multi_item_sales')
      
      const now = new Date()
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      
      // Get all sales and multi-item sales
      const [salesSnapshot, multiSalesSnapshot] = await Promise.all([
        getDocs(salesRef),
        getDocs(multiSalesRef)
      ])
      
      let dailyCount = 0, dailyValue = 0
      let monthlyCount = 0, monthlyValue = 0
      let lastMonthCount = 0, lastMonthValue = 0
      
      // Process regular sales
      salesSnapshot.forEach((doc) => {
        const data = doc.data()
        const saleDate = this.safeDate(data.timestamp) || this.safeDate(data.createdAt)
        const amount = data.totalAmount || data.amount || 0
        
        if (saleDate) {
          if (saleDate >= dayStart) {
            dailyCount++
            dailyValue += amount
          }
          if (saleDate >= monthStart) {
            monthlyCount++
            monthlyValue += amount
          }
          if (saleDate >= lastMonthStart && saleDate <= lastMonthEnd) {
            lastMonthCount++
            lastMonthValue += amount
          }
        }
      })
      
      // Process multi-item sales
      multiSalesSnapshot.forEach((doc) => {
        const data = doc.data()
        const saleDate = this.safeDate(data.timestamp) || this.safeDate(data.createdAt)
        const amount = data.totalAmount || 0
        
        if (saleDate) {
          if (saleDate >= dayStart) {
            dailyCount++
            dailyValue += amount
          }
          if (saleDate >= monthStart) {
            monthlyCount++
            monthlyValue += amount
          }
          if (saleDate >= lastMonthStart && saleDate <= lastMonthEnd) {
            lastMonthCount++
            lastMonthValue += amount
          }
        }
      })
      
      // Calculate growth percentages
      const dailyGrowth = 15 // Placeholder - would need yesterday's data for real calculation
      const monthlyGrowth = lastMonthCount > 0 ? ((monthlyCount - lastMonthCount) / lastMonthCount) * 100 : 0
      
      return {
        daily: {
          count: dailyCount,
          value: dailyValue,
          growth: dailyGrowth
        },
        monthly: {
          count: monthlyCount,
          value: monthlyValue,
          growth: monthlyGrowth
        }
      }
    } catch (error) {
      console.error('Error fetching transaction metrics:', error)
      return {
        daily: { count: 0, value: 0, growth: 0 },
        monthly: { count: 0, value: 0, growth: 0 }
      }
    }
  }
  
  // System Health Metrics
  static async getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
    try {
      // In a real implementation, this would check actual system status
      // For now, we'll return simulated healthy metrics
      return {
        uptime: 99.97,
        database: {
          status: 'healthy',
          responseTime: 145,
          connections: 12
        },
        errorRate: 0.03,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Error fetching system health:', error)
      return {
        uptime: 0,
        database: { status: 'critical', responseTime: 0, connections: 0 },
        errorRate: 100,
        lastUpdated: new Date()
      }
    }
  }
  
  // Top Branches - Real data only (no fake numbers)
  static async getTopBranches(): Promise<BranchActivity[]> {
    try {
      const branchesRef = collection(db, 'branches')
      const branchesSnapshot = await getDocs(branchesRef)
      
      const activities: BranchActivity[] = []
      
      branchesSnapshot.forEach((doc) => {
        const data = doc.data()
        
        // Safely extract location string from potentially nested object
        let locationString = 'No location specified'
        if (data.location) {
          if (typeof data.location === 'string') {
            locationString = data.location
          } else if (typeof data.location === 'object') {
            // Handle location object with properties like {region, postalCode, address, city}
            const loc = data.location
            locationString = [
              loc.address,
              loc.city,
              loc.region,
              loc.postalCode
            ].filter(Boolean).join(', ') || 'No location specified'
          }
        } else if (data.address) {
          if (typeof data.address === 'string') {
            locationString = data.address
          } else if (typeof data.address === 'object') {
            // Handle address object
            const addr = data.address
            locationString = [
              addr.address,
              addr.city,
              addr.region,
              addr.postalCode
            ].filter(Boolean).join(', ') || 'No location specified'
          }
        }
        
        // Only show real data - no fake numbers
        activities.push({
          id: doc.id,
          name: data.name || 'Unnamed Branch',
          location: locationString,
          activeUsers: 0, // Set to 0 since we don't have real user tracking per branch
          transactions24h: 0, // Set to 0 since we don't have real transaction tracking per branch
          revenue24h: 0, // Set to 0 since we don't have real revenue tracking per branch
          status: data.status === 'ACTIVE' ? 'active' : 'inactive'
        })
      })
      
      // Sort by name alphabetically since we don't have real activity data
      return activities
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 5)
    } catch (error) {
      console.error('Error fetching branches:', error)
      return []
    }
  }
  
  // Analytics Depth - Churn, Retention, Growth
  static async getAnalyticsDepth(): Promise<AnalyticsDepth> {
    try {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      const now = new Date()
      const day1Ago = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
      const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const day60Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      
      let totalUsers = 0
      let activeDay1 = 0
      let activeDay7 = 0
      let activeDay30 = 0
      let newUsers30Days = 0
      let newUsers60Days = 0
      let churnedUsers = 0
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data()
        totalUsers++
        
        const createdAt = this.safeDate(data.createdAt)
        const lastActive = this.safeDate(data.lastActiveAt) || this.safeDate(data.lastLoginAt)
        
        if (createdAt) {
          if (createdAt >= day30Ago) newUsers30Days++
          if (createdAt >= day60Ago && createdAt < day30Ago) newUsers60Days++
        }
        
        if (lastActive) {
          if (lastActive >= day1Ago) activeDay1++
          if (lastActive >= day7Ago) activeDay7++
          if (lastActive >= day30Ago) activeDay30++
          
          // Consider users churned if they haven't been active for 30+ days
          if (lastActive < day30Ago) churnedUsers++
        }
      })
      
      // Calculate metrics
      const churnRate = totalUsers > 0 ? (churnedUsers / totalUsers) * 100 : 0
      const retentionDay1 = newUsers30Days > 0 ? (activeDay1 / newUsers30Days) * 100 : 0
      const retentionDay7 = newUsers30Days > 0 ? (activeDay7 / newUsers30Days) * 100 : 0
      const retentionDay30 = newUsers30Days > 0 ? (activeDay30 / newUsers30Days) * 100 : 0
      
      const userGrowth = newUsers60Days > 0 ? ((newUsers30Days - newUsers60Days) / newUsers60Days) * 100 : 0
      
      return {
        churn: {
          rate: churnRate,
          trend: -2.5, // Placeholder - would need historical data
          totalChurned: churnedUsers
        },
        retention: {
          day1: retentionDay1,
          day7: retentionDay7,
          day30: retentionDay30,
          trend: 5.2 // Placeholder - would need historical data
        },
        growth: {
          userGrowth,
          revenueGrowth: 18.5, // Would calculate from actual revenue data
          activeUserTrend: 12.3 // Would calculate from active user trends
        }
      }
    } catch (error) {
      console.error('Error fetching analytics depth:', error)
      return {
        churn: { rate: 0, trend: 0, totalChurned: 0 },
        retention: { day1: 0, day7: 0, day30: 0, trend: 0 },
        growth: { userGrowth: 0, revenueGrowth: 0, activeUserTrend: 0 }
      }
    }
  }
  
  // Utility function
  private static formatTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }
}
