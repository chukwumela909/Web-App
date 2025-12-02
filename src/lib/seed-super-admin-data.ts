import { SuperAdminService } from './super-admin-service'

// Utility to seed sample data for super admin features
export const seedSuperAdminData = async () => {
  try {
    console.log('Seeding super admin sample data...')
    
    // Create sample system alerts
    const sampleAlerts = [
      {
        type: 'usage_drop' as const,
        title: 'Daily Active Users Drop',
        description: 'DAU decreased by 25% compared to last week average',
        severity: 'high' as const,
        status: 'active' as const,
        affectedUsers: 120,
        actionRequired: true
      },
      {
        type: 'error' as const,
        title: 'Network Timeout Spike',
        description: 'Network timeout errors increased by 400% in the last hour',
        severity: 'critical' as const,
        status: 'active' as const,
        affectedUsers: 45,
        actionRequired: true
      },
      {
        type: 'performance' as const,
        title: 'System Performance Normal',
        description: 'All systems operating within normal parameters',
        severity: 'low' as const,
        status: 'resolved' as const,
        affectedUsers: 0,
        actionRequired: false
      }
    ]

    // Create sample broadcast announcements
    const sampleAnnouncements = [
      {
        title: 'System Maintenance Scheduled',
        message: 'We will be performing scheduled maintenance on January 20th from 2:00 AM to 4:00 AM EST. During this time, the system may be temporarily unavailable.',
        type: 'warning' as const,
        channel: 'all' as const,
        targetAudience: 'all_users' as const,
        status: 'sent' as const,
        createdBy: 'system@fahampesa.com',
        actionRequired: false,
        recipientCount: 1250,
        openRate: 85,
        clickRate: 12
      },
      {
        title: 'New Features Released',
        message: 'Check out our latest features including enhanced reporting and improved user interface. Visit the dashboard to explore new capabilities.',
        type: 'success' as const,
        channel: 'app' as const,
        targetAudience: 'active_users' as const,
        status: 'sent' as const,
        createdBy: 'admin@fahampesa.com',
        actionRequired: false,
        recipientCount: 856,
        openRate: 92,
        clickRate: 35
      }
    ]

    // Seed alerts
    for (const alert of sampleAlerts) {
      await SuperAdminService.createSystemAlert(alert)
    }

    // Seed announcements
    for (const announcement of sampleAnnouncements) {
      await SuperAdminService.createAnnouncement(announcement)
    }

    console.log('Super admin sample data seeded successfully!')
    return true
  } catch (error) {
    console.error('Error seeding super admin data:', error)
    return false
  }
}

// Function to log user actions for audit trail
export const logUserAction = async (
  userId: string,
  userEmail: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: string,
  ipAddress: string = '127.0.0.1',
  userAgent: string = 'Web Browser'
) => {
  try {
    await SuperAdminService.logUserAction({
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      ipAddress,
      userAgent,
      status: 'success',
      details
    })
  } catch (error) {
    console.error('Error logging user action:', error)
  }
}
