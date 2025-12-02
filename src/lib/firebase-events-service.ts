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

export interface RealEventData {
  name: string
  count: number
  uniqueUsers: number
  conversionRate: number
  revenueImpact: number
}

export interface EventSummary {
  totalEvents: number
  uniqueEvents: number
  conversionRate: number
  topEvents: RealEventData[]
}

class FirebaseEventsService {
  private static instance: FirebaseEventsService
  private cachedEvents: EventSummary | null = null
  private lastFetch = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): FirebaseEventsService {
    if (!FirebaseEventsService.instance) {
      FirebaseEventsService.instance = new FirebaseEventsService()
    }
    return FirebaseEventsService.instance
  }

  async getEventsData(forceRefresh = false): Promise<EventSummary> {
    const now = Date.now()
    
    if (!forceRefresh && this.cachedEvents && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cachedEvents
    }

    try {
      // Get data from the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysTimestamp = Timestamp.fromDate(thirtyDaysAgo)

      // Fetch sales data (record_sale events)
      const salesData = await this.getSalesEvents(thirtyDaysTimestamp)
      
      // Fetch audit logs for other user actions
      const auditData = await this.getAuditLogEvents(thirtyDaysTimestamp)
      
      // Fetch staff activity logs
      const staffData = await this.getStaffActivityEvents(thirtyDaysTimestamp)

      // Combine and process all events
      const allEvents = [...salesData, ...auditData, ...staffData]
      const topEvents = this.processTopEvents(allEvents)
      
      // Calculate summary metrics
      const totalEvents = allEvents.reduce((sum, event) => sum + event.count, 0)
      const uniqueEvents = topEvents.length
      const conversionRate = this.calculateOverallConversionRate(topEvents)

      const eventsData: EventSummary = {
        totalEvents,
        uniqueEvents,
        conversionRate,
        topEvents: topEvents.slice(0, 10) // Top 10 events
      }

      this.cachedEvents = eventsData
      this.lastFetch = now
      return eventsData

    } catch (error) {
      console.error('Error fetching events data:', error)
      // Return fallback data if there's an error
      return {
        totalEvents: 0,
        uniqueEvents: 0,
        conversionRate: 0,
        topEvents: []
      }
    }
  }

  private async getSalesEvents(fromDate: Timestamp): Promise<RealEventData[]> {
    try {
      const salesRef = collection(db, 'sales')
      const salesQuery = query(
        salesRef,
        where('timestamp', '>=', fromDate.toMillis()),
        orderBy('timestamp', 'desc'),
        limit(1000)
      )
      
      const salesSnapshot = await getDocs(salesQuery)
      const salesByUser = new Map<string, number>()
      let totalSales = 0
      let totalRevenue = 0

      salesSnapshot.docs.forEach(doc => {
        const data = doc.data()
        const userId = data.userId
        
        if (userId) {
          salesByUser.set(userId, (salesByUser.get(userId) || 0) + 1)
        }
        totalSales++
        totalRevenue += Number(data.totalAmount || 0)
      })

      return [{
        name: 'record_sale',
        count: totalSales,
        uniqueUsers: salesByUser.size,
        conversionRate: totalSales > 0 ? Math.min(100, (totalSales / Math.max(salesByUser.size, 1)) * 15) : 0,
        revenueImpact: totalRevenue
      }]
    } catch (error) {
      console.error('Error fetching sales events:', error)
      return []
    }
  }

  private async getAuditLogEvents(fromDate: Timestamp): Promise<RealEventData[]> {
    try {
      const auditRef = collection(db, 'audit_logs')
      const auditQuery = query(
        auditRef,
        where('timestamp', '>=', fromDate),
        orderBy('timestamp', 'desc'),
        limit(1000)
      )
      
      const auditSnapshot = await getDocs(auditQuery)
      const eventCounts = new Map<string, { count: number, users: Set<string> }>()

      auditSnapshot.docs.forEach(doc => {
        const data = doc.data()
        const action = data.action || 'unknown_action'
        const userId = data.userId
        
        if (!eventCounts.has(action)) {
          eventCounts.set(action, { count: 0, users: new Set() })
        }
        
        const eventData = eventCounts.get(action)!
        eventData.count++
        if (userId) {
          eventData.users.add(userId)
        }
      })

      const events: RealEventData[] = []
      eventCounts.forEach((data, eventName) => {
        events.push({
          name: eventName,
          count: data.count,
          uniqueUsers: data.users.size,
          conversionRate: data.count > 0 ? Math.min(100, (data.count / Math.max(data.users.size, 1)) * 8) : 0,
          revenueImpact: 0 // Audit logs typically don't have direct revenue impact
        })
      })

      return events
    } catch (error) {
      console.error('Error fetching audit log events:', error)
      return []
    }
  }

  private async getStaffActivityEvents(fromDate: Timestamp): Promise<RealEventData[]> {
    try {
      const staffRef = collection(db, 'staff_activity_logs')
      const staffQuery = query(
        staffRef,
        where('timestamp', '>=', fromDate.toMillis()),
        orderBy('timestamp', 'desc'),
        limit(1000)
      )
      
      const staffSnapshot = await getDocs(staffQuery)
      const eventCounts = new Map<string, { count: number, users: Set<string> }>()

      staffSnapshot.docs.forEach(doc => {
        const data = doc.data()
        const action = data.action || 'staff_activity'
        const userId = data.userId
        
        if (!eventCounts.has(action)) {
          eventCounts.set(action, { count: 0, users: new Set() })
        }
        
        const eventData = eventCounts.get(action)!
        eventData.count++
        if (userId) {
          eventData.users.add(userId)
        }
      })

      const events: RealEventData[] = []
      eventCounts.forEach((data, eventName) => {
        events.push({
          name: eventName,
          count: data.count,
          uniqueUsers: data.users.size,
          conversionRate: data.count > 0 ? Math.min(100, (data.count / Math.max(data.users.size, 1)) * 12) : 0,
          revenueImpact: 0 // Staff activities typically don't have direct revenue impact
        })
      })

      return events
    } catch (error) {
      console.error('Error fetching staff activity events:', error)
      return []
    }
  }

  private processTopEvents(allEvents: RealEventData[]): RealEventData[] {
    // Group events by name and sum their counts
    const eventMap = new Map<string, RealEventData>()
    
    allEvents.forEach(event => {
      if (eventMap.has(event.name)) {
        const existing = eventMap.get(event.name)!
        existing.count += event.count
        existing.uniqueUsers = Math.max(existing.uniqueUsers, event.uniqueUsers)
        existing.revenueImpact += event.revenueImpact
        existing.conversionRate = Math.max(existing.conversionRate, event.conversionRate)
      } else {
        eventMap.set(event.name, { ...event })
      }
    })

    // Sort by count (descending) and return top events
    return Array.from(eventMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private calculateOverallConversionRate(events: RealEventData[]): number {
    if (events.length === 0) return 0
    
    const totalConversions = events.reduce((sum, event) => sum + (event.conversionRate * event.count / 100), 0)
    const totalEvents = events.reduce((sum, event) => sum + event.count, 0)
    
    return totalEvents > 0 ? Math.round((totalConversions / totalEvents) * 100 * 100) / 100 : 0
  }

  // Method to get additional event categories for better insights
  async getEventCategories(forceRefresh = false): Promise<{ [key: string]: number }> {
    try {
      const eventsData = await this.getEventsData(forceRefresh)
      const categories: { [key: string]: number } = {}

      eventsData.topEvents.forEach(event => {
        const category = this.categorizeEvent(event.name)
        categories[category] = (categories[category] || 0) + event.count
      })

      return categories
    } catch (error) {
      console.error('Error getting event categories:', error)
      return {}
    }
  }

  private categorizeEvent(eventName: string): string {
    if (eventName.includes('sale') || eventName.includes('payment')) return 'Sales'
    if (eventName.includes('product') || eventName.includes('inventory')) return 'Inventory'
    if (eventName.includes('user') || eventName.includes('login')) return 'User Management'
    if (eventName.includes('report') || eventName.includes('analytics')) return 'Reports'
    if (eventName.includes('staff') || eventName.includes('employee')) return 'Staff Management'
    return 'Other'
  }

  // Force refresh cache
  async forceRefresh(): Promise<EventSummary> {
    this.cachedEvents = null
    this.lastFetch = 0
    return this.getEventsData(true)
  }

  // Helper method to format event names for better readability
  static formatEventName(eventName: string): string {
    return eventName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/\bId\b/g, 'ID')
      .replace(/\bApi\b/g, 'API')
      .replace(/\bUi\b/g, 'UI')
  }
}

const eventsServiceInstance = FirebaseEventsService.getInstance()

export { FirebaseEventsService }
export default eventsServiceInstance
