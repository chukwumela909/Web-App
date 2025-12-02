import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const targetAudience = url.searchParams.get('targetAudience')

    if (!targetAudience) {
      return NextResponse.json({
        success: false,
        error: 'targetAudience parameter is required'
      }, { status: 400 })
    }

    const validAudiences = ['all_users', 'active_users', 'staff', 'admins']
    if (!validAudiences.includes(targetAudience)) {
      return NextResponse.json({
        success: false,
        error: `Invalid target audience. Must be one of: ${validAudiences.join(', ')}`
      }, { status: 400 })
    }

    // Get recipients for the target audience
    const recipients = await NotificationService.getRecipients(targetAudience)

    // Return summary information (not full recipient details for privacy)
    const summary = {
      total: recipients.length,
      breakdown: {
        users: recipients.filter(r => r.type === 'user').length,
        staff: recipients.filter(r => r.type === 'staff').length,
        admins: recipients.filter(r => r.type === 'admin').length
      },
      hasEmailRecipients: recipients.some(r => r.email),
      hasAppRecipients: recipients.some(r => r.fcmToken)
    }

    return NextResponse.json({
      success: true,
      summary
    })

  } catch (error) {
    console.error('Error fetching recipients:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch recipients'
    }, { status: 500 })
  }
}
