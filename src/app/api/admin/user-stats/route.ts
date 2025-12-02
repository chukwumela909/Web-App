import { NextRequest, NextResponse } from 'next/server'
import UserMetricsService from '@/lib/user-metrics-service'

export async function GET(request: NextRequest) {
  try {
    // Force refresh to get latest data
    const userMetrics = await UserMetricsService.getUserMetrics(true)
    const allUsers = await UserMetricsService.getAllUsers(true)
    
    // Get detailed breakdown
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const activeUsers = allUsers.filter(user => !user.disabled)
    const disabledUsers = allUsers.filter(user => user.disabled)
    
    const activeToday = allUsers.filter(user => 
      !user.disabled && user.lastActiveAt >= dayAgo
    )
    
    const activeThisWeek = allUsers.filter(user => 
      !user.disabled && user.lastActiveAt >= weekAgo
    )
    
    const activeThisMonth = allUsers.filter(user => 
      !user.disabled && user.lastActiveAt >= monthAgo
    )
    
    const newThisWeek = allUsers.filter(user => user.createdAt >= weekAgo)
    const newThisMonth = allUsers.filter(user => user.createdAt >= monthAgo)
    
    // Get unique regions
    const regions = new Set(allUsers.map(user => user.region).filter(Boolean))
    
    const stats = {
      total: allUsers.length,
      active: activeUsers.length,
      disabled: disabledUsers.length,
      activeToday: activeToday.length,
      activeThisWeek: activeThisWeek.length,
      activeThisMonth: activeThisMonth.length,
      newThisWeek: newThisWeek.length,
      newThisMonth: newThisMonth.length,
      uniqueRegions: regions.size,
      regions: Array.from(regions),
      breakdown: {
        withEmail: allUsers.filter(user => user.email && user.email !== '').length,
        withDisplayName: allUsers.filter(user => user.displayName && user.displayName !== '').length,
        recentlyCreated: allUsers.filter(user => {
          const daysSinceCreation = (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceCreation <= 7
        }).length
      },
      sampleUsers: allUsers.slice(0, 5).map(user => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt.toISOString(),
        lastActiveAt: user.lastActiveAt.toISOString(),
        disabled: user.disabled,
        region: user.region
      }))
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats
    })
    
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
