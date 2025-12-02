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

export interface UserMetrics {
  total: number
  active: number
  disabled: number
  newThisWeek: number
  newThisMonth: number
  activeToday: number
  activeThisWeek: number
  activeThisMonth: number
  inactiveWeek: number
  retentionRate: number
  churnRate: number
}

export interface User {
  id: string
  email: string
  displayName?: string
  createdAt: Date
  lastActiveAt: Date
  disabled: boolean
  region?: string
}

class UserMetricsService {
  private static instance: UserMetricsService
  private cachedUsers: User[] | null = null
  private lastFetch: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 

  static getInstance(): UserMetricsService {
    if (!UserMetricsService.instance) {
      UserMetricsService.instance = new UserMetricsService()
    }
    return UserMetricsService.instance
  }

  private async fetchUsers(forceRefresh = false): Promise<User[]> {
    const now = Date.now()
    
    // Return cached data if it's still fresh and not forcing refresh
    if (!forceRefresh && this.cachedUsers && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cachedUsers
    }

    try {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      const users: User[] = []
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data()
        
        // Only skip obvious test/dummy users (keep users without email)
        if (data.email === 'user@example.com' || data.email === 'test@example.com') {
          return
        }
        
        
        const safeDate = (dateValue: any): Date => {
          if (!dateValue) return new Date()
          
          if (dateValue && typeof dateValue.toDate === 'function') {
            return dateValue.toDate()
          }
          
          if (dateValue instanceof Date) {
            return dateValue
          }
          
          if (typeof dateValue === 'string' || typeof dateValue === 'number') {
            const parsed = new Date(dateValue)
            return isNaN(parsed.getTime()) ? new Date() : parsed
          }
          
          return new Date()
        }
        
        // Check if user is disabled
        const displayName = data.displayName || data.name || ''
        const disabled = data.disabled === true || displayName.startsWith('[DISABLED]')
        
        users.push({
          id: doc.id,
          email: data.email || '',
          displayName: displayName,
          createdAt: safeDate(data.createdAt),
          lastActiveAt: safeDate(data.lastActiveAt),
          disabled: disabled,
          region: data.region
        })
      })
      
      // Cache the results
      this.cachedUsers = users
      this.lastFetch = now
      
      return users
    } catch (error) {
      console.error('Error fetching users:', error)
      return []
    }
  }

  async getUserMetrics(forceRefresh = false): Promise<UserMetrics> {
    const users = await this.fetchUsers(forceRefresh)
    
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const total = users.length
    const active = users.filter(user => !user.disabled).length
    const disabled = users.filter(user => user.disabled).length
    
    const newThisWeek = users.filter(user => user.createdAt >= weekAgo).length
    const newThisMonth = users.filter(user => user.createdAt >= monthAgo).length
    
    const activeToday = users.filter(user => 
      !user.disabled && user.lastActiveAt >= dayAgo
    ).length
    
    const activeThisWeek = users.filter(user => 
      !user.disabled && user.lastActiveAt >= weekAgo
    ).length
    
    const activeThisMonth = users.filter(user => 
      !user.disabled && user.lastActiveAt >= monthAgo
    ).length
    
    const inactiveWeek = users.filter(user => 
      !user.disabled && user.lastActiveAt < weekAgo
    ).length
    
    // Calculate retention rate (users active in last week who joined more than a week ago)
    const eligibleForRetention = users.filter(user => 
      user.createdAt < weekAgo && !user.disabled
    ).length
    const retained = users.filter(user => 
      user.createdAt < weekAgo && user.lastActiveAt >= weekAgo && !user.disabled
    ).length
    const retentionRate = eligibleForRetention > 0 ? (retained / eligibleForRetention) * 100 : 0
    
    // Calculate churn rate (users who haven't been active in the last month)
    const eligibleForChurn = users.filter(user => 
      user.createdAt < monthAgo && !user.disabled
    ).length
    const churned = users.filter(user => 
      user.createdAt < monthAgo && user.lastActiveAt < monthAgo && !user.disabled
    ).length
    const churnRate = eligibleForChurn > 0 ? (churned / eligibleForChurn) * 100 : 0
    
    return {
      total,
      active,
      disabled,
      newThisWeek,
      newThisMonth,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      inactiveWeek,
      retentionRate,
      churnRate
    }
  }

  async getAllUsers(forceRefresh = false): Promise<User[]> {
    return this.fetchUsers(forceRefresh)
  }

  // Clear cache to force refresh
  clearCache(): void {
    this.cachedUsers = null
    this.lastFetch = 0
  }

  // Force complete refresh (clears cache and fetches fresh data)
  async forceRefresh(): Promise<User[]> {
    this.clearCache()
    return this.fetchUsers(true)
  }
}

export default UserMetricsService.getInstance()
