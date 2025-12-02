import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface UserSegment {
  id: string
  email: string
  country: string
  branch?: string
  deviceType: 'mobile' | 'desktop' | 'tablet'
  userType: 'free' | 'pro' | 'enterprise' | 'admin'
  createdAt: Date
  lastActiveAt: Date
  totalSessions: number
  totalRevenue: number
  disabled: boolean
}

export interface SegmentationData {
  country: {
    [key: string]: {
      users: number
      revenue: number
      sessions: number
      retention: number
    }
  }
  branch: {
    [key: string]: {
      users: number
      revenue: number
      sessions: number
      activeUsers: number
    }
  }
  device: {
    mobile: { users: number; sessions: number; revenue: number }
    desktop: { users: number; sessions: number; revenue: number }
    tablet: { users: number; sessions: number; revenue: number }
  }
  userType: {
    free: { users: number; revenue: number; churnRate: number }
    pro: { users: number; revenue: number; churnRate: number }
    enterprise: { users: number; revenue: number; churnRate: number }
    admin: { users: number; revenue: number; churnRate: number }
  }
}

export interface CohortData {
  cohortMonth: string
  cohortSize: number
  retentionRates: {
    week1: number
    week2: number
    week3: number
    week4: number
    month2: number
    month3: number
    month6: number
  }
  revenuePerUser: number
  churnRate: number
}

export interface WeeklyTrend {
  week: string
  newUsers: number
  activeUsers: number
  revenue: number
  retention: number
  churnRate: number
  averageSessionDuration: number
}

class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService
  private cachedSegments: UserSegment[] | null = null
  private lastFetch: number = 0
  private readonly CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

  static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService()
    }
    return AdvancedAnalyticsService.instance
  }

  private async fetchUserSegments(forceRefresh = false): Promise<UserSegment[]> {
    const now = Date.now()
    
    if (!forceRefresh && this.cachedSegments && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cachedSegments
    }

    try {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      const segments: UserSegment[] = []
      
      for (const doc of usersSnapshot.docs) {
        const data = doc.data()
        
        // Skip test/dummy users
        if (!data.email || data.email === 'user@example.com') {
          continue
        }
        
        // Helper function to safely convert dates
        const safeDate = (dateValue: any): Date => {
          if (!dateValue) return new Date()
          if (dateValue && typeof dateValue.toDate === 'function') {
            return dateValue.toDate()
          }
          if (dateValue instanceof Date) return dateValue
          if (typeof dateValue === 'string' || typeof dateValue === 'number') {
            const parsed = new Date(dateValue)
            return isNaN(parsed.getTime()) ? new Date() : parsed
          }
          return new Date()
        }

        // Determine device type from user agent or device info
        const deviceType = this.determineDeviceType(data.userAgent || data.deviceInfo)
        
        // Determine user type from subscription or role
        const userType = this.determineUserType(data.subscription, data.role)
        
        // Get additional metrics
        const totalSessions = await this.getUserSessions(doc.id)
        const totalRevenue = await this.getUserRevenue(doc.id)
        
        segments.push({
          id: doc.id,
          email: data.email,
          country: data.country || this.extractCountryFromEmail(data.email) || 'Unknown',
          branch: data.branchId || data.branch,
          deviceType,
          userType,
          createdAt: safeDate(data.createdAt),
          lastActiveAt: safeDate(data.lastActiveAt),
          totalSessions,
          totalRevenue,
          disabled: data.disabled === true || (data.displayName || '').startsWith('[DISABLED]')
        })
      }
      
      this.cachedSegments = segments
      this.lastFetch = now
      
      return segments
    } catch (error) {
      console.error('Error fetching user segments:', error)
      return []
    }
  }

  private determineDeviceType(userAgent?: string): 'mobile' | 'desktop' | 'tablet' {
    if (!userAgent) return 'desktop'
    
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile'
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet'
    }
    return 'desktop'
  }

  private determineUserType(subscription?: any, role?: string): 'free' | 'pro' | 'enterprise' | 'admin' {
    if (role === 'admin' || role === 'super_admin') return 'admin'
    if (subscription?.plan === 'enterprise') return 'enterprise'
    if (subscription?.plan === 'pro') return 'pro'
    return 'free'
  }

  private extractCountryFromEmail(email: string): string | null {
    // Simple country extraction from email domain
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return null
    
    const countryMappings: { [key: string]: string } = {
      '.ke': 'Kenya',
      '.ug': 'Uganda',
      '.tz': 'Tanzania',
      '.rw': 'Rwanda',
      '.et': 'Ethiopia',
      '.ng': 'Nigeria',
      '.za': 'South Africa',
      '.gh': 'Ghana',
      'gmail.com': 'Global',
      'yahoo.com': 'Global',
      'outlook.com': 'Global'
    }
    
    for (const [suffix, country] of Object.entries(countryMappings)) {
      if (domain.includes(suffix)) {
        return country
      }
    }
    
    return 'Other'
  }

  private async getUserSessions(userId: string): Promise<number> {
    try {
      const sessionsRef = collection(db, 'user_sessions')
      const sessionsQuery = query(sessionsRef, where('userId', '==', userId))
      const sessionsSnapshot = await getDocs(sessionsQuery)
      return sessionsSnapshot.size
    } catch (error) {
      return 0
    }
  }

  private async getUserRevenue(userId: string): Promise<number> {
    try {
      const salesRef = collection(db, 'sales')
      const salesQuery = query(salesRef, where('userId', '==', userId))
      const salesSnapshot = await getDocs(salesQuery)
      
      let totalRevenue = 0
      salesSnapshot.forEach(doc => {
        const data = doc.data()
        totalRevenue += data.total || data.amount || 0
      })
      
      return totalRevenue
    } catch (error) {
      return 0
    }
  }

  async getSegmentationData(forceRefresh = false): Promise<SegmentationData> {
    const segments = await this.fetchUserSegments(forceRefresh)
    
    const segmentation: SegmentationData = {
      country: {},
      branch: {},
      device: {
        mobile: { users: 0, sessions: 0, revenue: 0 },
        desktop: { users: 0, sessions: 0, revenue: 0 },
        tablet: { users: 0, sessions: 0, revenue: 0 }
      },
      userType: {
        free: { users: 0, revenue: 0, churnRate: 0 },
        pro: { users: 0, revenue: 0, churnRate: 0 },
        enterprise: { users: 0, revenue: 0, churnRate: 0 },
        admin: { users: 0, revenue: 0, churnRate: 0 }
      }
    }

    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    segments.forEach(segment => {
      // Country segmentation
      if (!segmentation.country[segment.country]) {
        segmentation.country[segment.country] = {
          users: 0,
          revenue: 0,
          sessions: 0,
          retention: 0
        }
      }
      segmentation.country[segment.country].users++
      segmentation.country[segment.country].revenue += segment.totalRevenue
      segmentation.country[segment.country].sessions += segment.totalSessions

      // Branch segmentation
      if (segment.branch) {
        if (!segmentation.branch[segment.branch]) {
          segmentation.branch[segment.branch] = {
            users: 0,
            revenue: 0,
            sessions: 0,
            activeUsers: 0
          }
        }
        segmentation.branch[segment.branch].users++
        segmentation.branch[segment.branch].revenue += segment.totalRevenue
        segmentation.branch[segment.branch].sessions += segment.totalSessions
        if (segment.lastActiveAt >= monthAgo) {
          segmentation.branch[segment.branch].activeUsers++
        }
      }

      // Device segmentation
      segmentation.device[segment.deviceType].users++
      segmentation.device[segment.deviceType].sessions += segment.totalSessions
      segmentation.device[segment.deviceType].revenue += segment.totalRevenue

      // User type segmentation
      segmentation.userType[segment.userType].users++
      segmentation.userType[segment.userType].revenue += segment.totalRevenue
    })

    // Calculate retention rates for countries
    for (const country in segmentation.country) {
      const countrySegments = segments.filter(s => s.country === country)
      const activeInMonth = countrySegments.filter(s => s.lastActiveAt >= monthAgo).length
      segmentation.country[country].retention = countrySegments.length > 0 
        ? (activeInMonth / countrySegments.length) * 100 
        : 0
    }

    // Calculate churn rates for user types
    for (const userType in segmentation.userType) {
      const typeSegments = segments.filter(s => s.userType === userType as any)
      const churned = typeSegments.filter(s => s.lastActiveAt < monthAgo).length
      segmentation.userType[userType as keyof typeof segmentation.userType].churnRate = 
        typeSegments.length > 0 ? (churned / typeSegments.length) * 100 : 0
    }

    return segmentation
  }

  async getCohortAnalysis(): Promise<CohortData[]> {
    const segments = await this.fetchUserSegments()
    const cohorts: { [key: string]: UserSegment[] } = {}

    // Group users by their signup month
    segments.forEach(segment => {
      const cohortMonth = segment.createdAt.toISOString().substring(0, 7) // YYYY-MM
      if (!cohorts[cohortMonth]) {
        cohorts[cohortMonth] = []
      }
      cohorts[cohortMonth].push(segment)
    })

    const cohortData: CohortData[] = []

    for (const [cohortMonth, cohortUsers] of Object.entries(cohorts)) {
      const cohortStartDate = new Date(cohortMonth + '-01')
      const now = new Date()

      // Calculate retention rates for different periods
      const retentionRates = {
        week1: this.calculateRetention(cohortUsers, cohortStartDate, 7),
        week2: this.calculateRetention(cohortUsers, cohortStartDate, 14),
        week3: this.calculateRetention(cohortUsers, cohortStartDate, 21),
        week4: this.calculateRetention(cohortUsers, cohortStartDate, 28),
        month2: this.calculateRetention(cohortUsers, cohortStartDate, 60),
        month3: this.calculateRetention(cohortUsers, cohortStartDate, 90),
        month6: this.calculateRetention(cohortUsers, cohortStartDate, 180)
      }

      const totalRevenue = cohortUsers.reduce((sum, user) => sum + user.totalRevenue, 0)
      const revenuePerUser = cohortUsers.length > 0 ? totalRevenue / cohortUsers.length : 0

      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const churned = cohortUsers.filter(user => user.lastActiveAt < monthAgo).length
      const churnRate = cohortUsers.length > 0 ? (churned / cohortUsers.length) * 100 : 0

      cohortData.push({
        cohortMonth,
        cohortSize: cohortUsers.length,
        retentionRates,
        revenuePerUser,
        churnRate
      })
    }

    return cohortData.sort((a, b) => b.cohortMonth.localeCompare(a.cohortMonth))
  }

  private calculateRetention(cohortUsers: UserSegment[], cohortStart: Date, days: number): number {
    const targetDate = new Date(cohortStart.getTime() + days * 24 * 60 * 60 * 1000)
    const activeUsers = cohortUsers.filter(user => user.lastActiveAt >= targetDate).length
    return cohortUsers.length > 0 ? (activeUsers / cohortUsers.length) * 100 : 0
  }

  async getWeeklyTrends(weeks: number = 12): Promise<WeeklyTrend[]> {
    const segments = await this.fetchUserSegments()
    const trends: WeeklyTrend[] = []

    const now = new Date()
    
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      
      const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`
      
      const newUsers = segments.filter(s => 
        s.createdAt >= weekStart && s.createdAt < weekEnd
      ).length

      const activeUsers = segments.filter(s => 
        s.lastActiveAt >= weekStart && s.lastActiveAt < weekEnd
      ).length

      const weekRevenue = segments
        .filter(s => s.lastActiveAt >= weekStart && s.lastActiveAt < weekEnd)
        .reduce((sum, s) => sum + s.totalRevenue, 0)

      // Calculate retention (users active this week who were also active last week)
      const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)
      const lastWeekActive = segments.filter(s => 
        s.lastActiveAt >= lastWeekStart && s.lastActiveAt < weekStart
      )
      const retained = lastWeekActive.filter(s => 
        s.lastActiveAt >= weekStart && s.lastActiveAt < weekEnd
      ).length
      const retention = lastWeekActive.length > 0 ? (retained / lastWeekActive.length) * 100 : 0

      // Calculate churn rate
      const totalEligible = segments.filter(s => s.createdAt < weekStart).length
      const churned = segments.filter(s => 
        s.createdAt < weekStart && s.lastActiveAt < weekStart
      ).length
      const churnRate = totalEligible > 0 ? (churned / totalEligible) * 100 : 0

      trends.unshift({
        week: weekLabel,
        newUsers,
        activeUsers,
        revenue: weekRevenue,
        retention,
        churnRate,
        averageSessionDuration: 0 // Would need session data to calculate
      })
    }

    return trends
  }

  // Clear cache to force refresh
  clearCache(): void {
    this.cachedSegments = null
    this.lastFetch = 0
  }
}

export default AdvancedAnalyticsService.getInstance()
