import { SuperAdminService, BroadcastAnnouncement } from './super-admin-service'

export class SchedulerService {
  private static intervalId: NodeJS.Timeout | null = null
  
  /**
   * Start the scheduler to check for and send scheduled announcements
   */
  static startScheduler(): void {
    // Check every minute for scheduled announcements
    this.intervalId = setInterval(async () => {
      await this.processScheduledAnnouncements()
    }, 60000) // 60 seconds
    
    console.log('Announcement scheduler started')
  }
  
  /**
   * Stop the scheduler
   */
  static stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Announcement scheduler stopped')
    }
  }
  
  /**
   * Process scheduled announcements that are due to be sent
   */
  private static async processScheduledAnnouncements(): Promise<void> {
    try {
      const announcements = await SuperAdminService.getAnnouncements()
      const now = new Date()
      
      // Find scheduled announcements that are due
      const dueAnnouncements = announcements.filter(announcement => 
        announcement.status === 'scheduled' &&
        announcement.scheduledAt &&
        new Date(announcement.scheduledAt) <= now
      )
      
      // Send each due announcement
      for (const announcement of dueAnnouncements) {
        try {
          console.log(`Sending scheduled announcement: ${announcement.title}`)
          
          const result = await SuperAdminService.sendAnnouncement(announcement.id, announcement)
          
          if (result.success) {
            console.log(`Scheduled announcement sent successfully: ${announcement.title} to ${result.recipientCount} recipients`)
          } else {
            console.error(`Failed to send scheduled announcement: ${announcement.title}`, result.error)
          }
        } catch (error) {
          console.error(`Error sending scheduled announcement: ${announcement.title}`, error)
        }
      }
    } catch (error) {
      console.error('Error processing scheduled announcements:', error)
    }
  }
  
  /**
   * Manually process scheduled announcements (for testing)
   */
  static async processNow(): Promise<void> {
    await this.processScheduledAnnouncements()
  }
}

// Auto-start the scheduler when the module is imported
if (typeof window !== 'undefined') {
  SchedulerService.startScheduler()
}
