import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'
import { SuperAdminService, BroadcastAnnouncement } from '@/lib/super-admin-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { announcementId, announcement } = body as {
      announcementId: string
      announcement: BroadcastAnnouncement
    }

    if (!announcementId || !announcement) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: announcementId and announcement'
      }, { status: 400 })
    }

    // Validate announcement data
    if (!announcement.title || !announcement.message || !announcement.type || 
        !announcement.channel || !announcement.targetAudience) {
      return NextResponse.json({
        success: false,
        error: 'Invalid announcement data'
      }, { status: 400 })
    }

    // Send the announcement
    const result = await SuperAdminService.sendAnnouncement(announcementId, announcement)

    return NextResponse.json({
      success: result.success,
      recipientCount: result.recipientCount,
      error: result.error
    })

  } catch (error) {
    console.error('Error in send notification API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// GET endpoint to fetch notification history
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const announcementId = url.searchParams.get('announcementId')

    if (announcementId) {
      // Return specific announcement details
      const announcements = await SuperAdminService.getAnnouncements()
      const announcement = announcements.find(a => a.id === announcementId)
      
      if (!announcement) {
        return NextResponse.json({
          success: false,
          error: 'Announcement not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        announcement
      })
    }

    // Return all announcements
    const announcements = await SuperAdminService.getAnnouncements()
    return NextResponse.json({
      success: true,
      announcements
    })

  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch announcements'
    }, { status: 500 })
  }
}
