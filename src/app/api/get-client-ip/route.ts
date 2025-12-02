import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get client IP from various headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = request.headers.get('x-client-ip')
    
    let ip = 'unknown'
    
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      ip = forwarded.split(',')[0].trim()
    } else if (realIp) {
      ip = realIp
    } else if (clientIp) {
      ip = clientIp
    } else {
      // Fallback to connection remote address
      ip = request.ip || 'unknown'
    }
    
    return NextResponse.json({ ip })
  } catch (error) {
    console.error('Error getting client IP:', error)
    return NextResponse.json({ ip: 'unknown' })
  }
}
