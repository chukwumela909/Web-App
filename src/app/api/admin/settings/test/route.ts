import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = request.nextUrl.origin
    
    // Test all settings endpoints
    const [platformRes, notificationRes, integrationRes] = await Promise.all([
      fetch(`${baseUrl}/api/admin/settings/platform`),
      fetch(`${baseUrl}/api/admin/settings/notifications`),
      fetch(`${baseUrl}/api/admin/settings/integrations`)
    ])
    
    const results = {
      platform: {
        status: platformRes.status,
        ok: platformRes.ok,
        data: platformRes.ok ? await platformRes.json() : null
      },
      notifications: {
        status: notificationRes.status,
        ok: notificationRes.ok,
        data: notificationRes.ok ? await notificationRes.json() : null
      },
      integrations: {
        status: integrationRes.status,
        ok: integrationRes.ok,
        data: integrationRes.ok ? await integrationRes.json() : null
      }
    }
    
    const allWorking = results.platform.ok && results.notifications.ok && results.integrations.ok
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      allEndpointsWorking: allWorking,
      results,
      message: allWorking ? 'All settings endpoints are working correctly' : 'Some endpoints may have issues'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to test settings endpoints',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
