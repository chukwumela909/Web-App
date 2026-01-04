import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin-server'

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin SDK not initialized'
      }, { status: 500 })
    }
    
    const alertsSnapshot = await adminDb.collection('security_alerts').get()
    
    const alerts: any[] = []
    alertsSnapshot.forEach((doc) => {
      alerts.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return NextResponse.json({
      success: true,
      totalAlerts: alerts.length,
      alerts: alerts.slice(0, 10), // Show first 10 for preview
      hasAlerts: alerts.length > 0,
      message: alerts.length === 0 
        ? 'No security alerts found. The security_alerts collection is empty.' 
        : `Found ${alerts.length} security alerts.`
    })
    
  } catch (error) {
    console.error('Error checking security alerts:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check security alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
