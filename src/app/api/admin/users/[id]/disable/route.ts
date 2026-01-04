import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK not initialized' },
        { status: 500 }
      )
    }
    
    const { id } = params
    const { disabled } = await request.json()

    // Get current user document using Admin SDK
    const userRef = adminDb.collection('users').doc(id)
    const userDoc = await userRef.get()
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()!
    const currentDisplayName = userData.displayName || userData.name || ''

    // Update user status
    let newDisplayName = currentDisplayName
    if (disabled) {
      // Add disabled prefix if not already present
      if (!currentDisplayName.startsWith('[DISABLED]')) {
        newDisplayName = `[DISABLED] ${currentDisplayName || 'User'}`
      }
    } else {
      // Remove disabled prefix
      newDisplayName = currentDisplayName.replace('[DISABLED] ', '')
    }

    await userRef.update({
      displayName: newDisplayName,
      disabled: disabled,
      disabledAt: disabled ? new Date() : null,
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: `User ${disabled ? 'disabled' : 'enabled'} successfully`
    })

  } catch (error) {
    console.error('Error updating user status:', error)
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    )
  }
}
