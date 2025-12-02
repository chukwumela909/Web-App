import { BroadcastAnnouncement } from './super-admin-service'
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// Brevo configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY || ''

export interface NotificationRecipient {
  id: string
  email: string
  name?: string
  fcmToken?: string
  type: 'user' | 'staff' | 'admin'
}

export interface NotificationResult {
  success: boolean
  sent: number
  failed: number
  errors?: string[]
  messageId?: string
}

export class NotificationService {
  
  /**
   * Get recipients based on target audience
   */
  static async getRecipients(targetAudience: string): Promise<NotificationRecipient[]> {
    const recipients: NotificationRecipient[] = []
    
    try {
      switch (targetAudience) {
        case 'staff':
          // Get staff members
          const staffRef = collection(db, 'staff')
          const staffSnapshot = await getDocs(staffRef)
          staffSnapshot.forEach(doc => {
            const data = doc.data()
            if (data.email && data.status === 'active') {
              recipients.push({
                id: doc.id,
                email: data.email,
                name: data.name,
                fcmToken: data.fcmToken,
                type: 'staff'
              })
            }
          })
          break
          
        case 'admins':
          // Get admin users
          const adminRef = collection(db, 'admin_users')
          const adminSnapshot = await getDocs(adminRef)
          adminSnapshot.forEach(doc => {
            const data = doc.data()
            if (data.email && data.status === 'active') {
              recipients.push({
                id: doc.id,
                email: data.email,
                name: data.name,
                fcmToken: data.fcmToken,
                type: 'admin'
              })
            }
          })
          break
          
        case 'active_users':
          // Get active users (users who logged in within last 30 days)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          
          const activeUsersRef = collection(db, 'users')
          const activeUsersSnapshot = await getDocs(activeUsersRef)
          activeUsersSnapshot.forEach(doc => {
            const data = doc.data()
            const lastLogin = data.lastActiveAt?.toDate() || data.lastLoginAt?.toDate()
            
            if (data.email && lastLogin && lastLogin >= thirtyDaysAgo) {
              recipients.push({
                id: doc.id,
                email: data.email,
                name: data.displayName || data.name,
                fcmToken: data.fcmToken,
                type: 'user'
              })
            }
          })
          break
          
        case 'all_users':
        default:
          // Get all users, staff, and admins
          const [usersSnapshot, allStaffSnapshot, allAdminSnapshot] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'staff')),
            getDocs(collection(db, 'admin_users'))
          ])
          
          // Add regular users
          usersSnapshot.forEach(doc => {
            const data = doc.data()
            if (data.email) {
              recipients.push({
                id: doc.id,
                email: data.email,
                name: data.displayName || data.name,
                fcmToken: data.fcmToken,
                type: 'user'
              })
            }
          })
          
          // Add staff
          allStaffSnapshot.forEach(doc => {
            const data = doc.data()
            if (data.email && data.status === 'active') {
              recipients.push({
                id: doc.id,
                email: data.email,
                name: data.name,
                fcmToken: data.fcmToken,
                type: 'staff'
              })
            }
          })
          
          // Add admins
          allAdminSnapshot.forEach(doc => {
            const data = doc.data()
            if (data.email && data.status === 'active') {
              recipients.push({
                id: doc.id,
                email: data.email,
                name: data.name,
                fcmToken: data.fcmToken,
                type: 'admin'
              })
            }
          })
          break
      }
      
      // Remove duplicates based on email
      const uniqueRecipients = recipients.filter((recipient, index, self) => 
        index === self.findIndex(r => r.email === recipient.email)
      )
      
      return uniqueRecipients
    } catch (error) {
      console.error('Error fetching recipients:', error)
      return []
    }
  }
  
  /**
   * Send in-app notifications using Firebase Cloud Messaging
   */
  static async sendInAppNotifications(
    recipients: NotificationRecipient[],
    announcement: BroadcastAnnouncement
  ): Promise<NotificationResult> {
    let sent = 0
    let failed = 0
    const errors: string[] = []
    
    try {
      // Save notifications to Firestore for each recipient
      const notificationsToSave = recipients
        .filter(recipient => recipient.fcmToken)
        .map(recipient => ({
          userId: recipient.id,
          userEmail: recipient.email,
          title: announcement.title,
          message: announcement.message,
          type: announcement.type,
          data: {
            announcementId: announcement.id,
            targetAudience: announcement.targetAudience
          },
          read: false,
          createdAt: serverTimestamp()
        }))
      
      // Batch save notifications
      const notificationsRef = collection(db, 'notifications')
      for (const notification of notificationsToSave) {
        try {
          await addDoc(notificationsRef, notification)
          sent++
        } catch (error) {
          failed++
          errors.push(`Failed to save notification for ${notification.userEmail}`)
        }
      }
      
      // TODO: Implement actual FCM push notifications
      // This would require Firebase Functions or a backend service
      // For now, we're just saving to Firestore which the apps can listen to
      
      const result: NotificationResult = {
        success: sent > 0,
        sent,
        failed
      }
      
      if (errors.length > 0) {
        result.errors = errors
      }
      
      return result
    } catch (error) {
      console.error('Error sending in-app notifications:', error)
      return {
        success: false,
        sent: 0,
        failed: recipients.length,
        errors: [`Failed to send in-app notifications: ${error}`]
      }
    }
  }
  
  /**
   * Send email notifications using Brevo
   */
  static async sendEmailNotifications(
    recipients: NotificationRecipient[],
    announcement: BroadcastAnnouncement
  ): Promise<NotificationResult> {
    let sent = 0
    let failed = 0
    const errors: string[] = []
    
    try {
      // Check if Brevo API key is configured
      if (!BREVO_API_KEY) {
        return {
          success: false,
          sent: 0,
          failed: recipients.length,
          errors: ['Brevo API key not configured. Please add BREVO_API_KEY to environment variables.']
        }
      }
      
      // Create HTML email template
      const htmlContent = this.createEmailTemplate(announcement)
      
      // Send individual emails using Brevo REST API
      for (const recipient of recipients) {
        try {
          const emailData = {
            sender: {
              name: "FahamPesa",
              email: "info@fahampesa.com"
            },
            to: [{
              email: recipient.email,
              name: recipient.name || recipient.email
            }],
            subject: announcement.title,
            htmlContent: htmlContent,
            textContent: announcement.message,
            tags: [`announcement-${announcement.id}`, `type-${announcement.type}`, `audience-${announcement.targetAudience}`]
          }
          
          const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'api-key': BREVO_API_KEY
            },
            body: JSON.stringify(emailData)
          })
          
          if (response.ok) {
            sent++
          } else {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
            failed++
            
            // Handle specific Brevo API errors
            let errorMessage = errorData.message || 'Unknown error'
            if (response.status === 401) {
              errorMessage = 'authentication not found in headers'
            } else if (response.status === 400) {
              errorMessage = errorData.message || 'Bad request'
            } else if (response.status === 402) {
              errorMessage = 'Insufficient credits'
            }
            
            errors.push(`Failed to send to ${recipient.email}: ${errorMessage}`)
          }
        } catch (error) {
          failed++
          errors.push(`Failed to send to ${recipient.email}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
      
      const result: NotificationResult = {
        success: sent > 0,
        sent,
        failed
      }
      
      if (errors.length > 0) {
        result.errors = errors
      }
      
      return result
    } catch (error) {
      console.error('Error sending email notifications:', error)
      return {
        success: false,
        sent: 0,
        failed: recipients.length,
        errors: [`Failed to send email notifications: ${error}`]
      }
    }
  }
  
  /**
   * Create HTML email template
   */
  private static createEmailTemplate(announcement: BroadcastAnnouncement): string {
    const typeColors = {
      info: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      critical: '#EF4444'
    }
    
    const color = typeColors[announcement.type] || typeColors.info
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${announcement.title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                                <h1 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: bold;">FahamPesa</h1>
                                <p style="margin: 10px 0 0; color: #6b7280; font-size: 14px;">Business Management Platform</p>
                            </td>
                        </tr>
                        
                        <!-- Announcement Type Badge -->
                        <tr>
                            <td style="padding: 20px 40px 0; text-align: center;">
                                <span style="display: inline-block; padding: 8px 16px; background-color: ${color}; color: white; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                                    ${announcement.type}
                                </span>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 20px 40px;">
                                <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 600; line-height: 1.3;">
                                    ${announcement.title}
                                </h2>
                                <div style="color: #4b5563; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
                                    ${announcement.message}
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 40px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
                                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                    This is an automated message from FahamPesa. Please do not reply to this email.
                                </p>
                                <p style="margin: 10px 0 0; color: #6b7280; font-size: 12px;">
                                    © ${new Date().getFullYear()} FahamPesa. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `
  }
  
  /**
   * Send notifications through all specified channels
   */
  static async sendNotification(
    announcement: BroadcastAnnouncement,
    recipients: NotificationRecipient[]
  ): Promise<NotificationResult> {
    const results: NotificationResult[] = []
    
    try {
      // Send based on channel
      if (announcement.channel === 'app' || announcement.channel === 'all') {
        const inAppResult = await this.sendInAppNotifications(recipients, announcement)
        results.push(inAppResult)
      }
      
      if (announcement.channel === 'email' || announcement.channel === 'all') {
        const emailResult = await this.sendEmailNotifications(recipients, announcement)
        results.push(emailResult)
      }
      
      // Combine results
      const totalSent = results.reduce((sum, result) => sum + result.sent, 0)
      const totalFailed = results.reduce((sum, result) => sum + result.failed, 0)
      const allErrors = results.flatMap(result => result.errors || [])
      
      const combinedResult: NotificationResult = {
        success: totalSent > 0,
        sent: totalSent,
        failed: totalFailed
      }
      
      if (allErrors.length > 0) {
        combinedResult.errors = allErrors
      }
      
      return combinedResult
    } catch (error) {
      console.error('Error sending notification:', error)
      return {
        success: false,
        sent: 0,
        failed: recipients.length,
        errors: [`Failed to send notification: ${error}`]
      }
    }
  }
}
