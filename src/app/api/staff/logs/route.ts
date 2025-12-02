import { NextRequest, NextResponse } from 'next/server'
import {
  getStaffActivityLogs,
  createStaffActivityLog,
  StaffActivityLog
} from '@/lib/firestore'

// GET /api/staff/logs - Get staff activity logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const staffId = searchParams.get('staffId')
    const branchId = searchParams.get('branchId')
    const severity = searchParams.get('severity') as 'info' | 'warning' | 'error' | 'critical' | null
    const action = searchParams.get('action')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const filters: any = {}
    if (staffId) filters.staffId = staffId
    if (branchId) filters.branchId = branchId
    if (severity) filters.severity = severity
    if (action) filters.action = action
    if (startDate) filters.startDate = parseInt(startDate)
    if (endDate) filters.endDate = parseInt(endDate)

    const logs = await getStaffActivityLogs(userId, filters, limit)

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length
    })
  } catch (error) {
    console.error('Error fetching staff activity logs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}

// POST /api/staff/logs - Create a new activity log
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const {
      userId,
      staffId,
      staffName,
      action,
      description,
      metadata = {},
      severity = 'info'
    } = data

    if (!userId || !staffId || !action || !description) {
      return NextResponse.json(
        { error: 'userId, staffId, action, and description are required' },
        { status: 400 }
      )
    }

    // Validate severity
    if (!['info', 'warning', 'error', 'critical'].includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity. Must be info, warning, error, or critical' },
        { status: 400 }
      )
    }

    // Create the activity log
    await createStaffActivityLog(userId, {
      staffId,
      staffName,
      action,
      description,
      metadata,
      severity
    })

    return NextResponse.json({
      success: true,
      message: 'Activity log created successfully'
    })
  } catch (error) {
    console.error('Error creating activity log:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create activity log' },
      { status: 500 }
    )
  }
}
