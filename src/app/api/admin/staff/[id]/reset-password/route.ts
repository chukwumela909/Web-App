import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { adminApp } from '@/lib/firebase-admin-server'
import { requirePlatformAdmin } from '@/lib/api-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePlatformAdmin(request)
    if ('response' in authResult) return authResult.response

    const { id: staffId } = await params
    const body = await request.json()
    const { password } = body
    
    if (!password) {
      return NextResponse.json({
        success: false,
        error: 'Password is required'
      }, { status: 400 })
    }

    if (!adminApp) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin SDK not initialized'
      }, { status: 500 })
    }

    // Reset Firebase Auth password
    const auth = getAuth(adminApp)
    
    try {
      // Update the user's password in Firebase Auth
      await auth.updateUser(staffId, {
        password: password
      })
      
      console.log(`Password reset successfully for staff ${staffId}`)
      
      return NextResponse.json({
        success: true,
        message: 'Password reset successfully',
        staffId,
        // Don't return the actual password in production
        newPassword: password
      })
      
    } catch (authError: any) {
      console.error('Error resetting Firebase Auth password:', authError)
      
      if (authError.code === 'auth/user-not-found') {
        return NextResponse.json({
          success: false,
          error: 'Staff member not found in authentication system'
        }, { status: 404 })
      } else if (authError.code === 'auth/weak-password') {
        return NextResponse.json({
          success: false,
          error: 'Password is too weak'
        }, { status: 400 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to reset password: ' + (authError.message || 'Unknown error')
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error resetting password:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to reset password'
    }, { status: 500 })
  }
}
