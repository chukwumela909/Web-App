import { NextRequest, NextResponse } from 'next/server'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { disabled } = await request.json()

    // Get current user document
    const userRef = doc(db, 'users', id)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
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

    await updateDoc(userRef, {
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
