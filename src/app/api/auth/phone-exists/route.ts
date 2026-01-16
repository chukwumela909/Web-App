import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 })
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK not initialized. Please configure server credentials.' },
        { status: 503 }
      )
    }

    const snapshot = await adminDb
      .collection('userProfiles')
      .where('phoneNumber', '==', phone)
      .limit(1)
      .get()

    return NextResponse.json({ exists: !snapshot.empty })
  } catch (error) {
    console.error('Error checking phone existence:', error)
    return NextResponse.json(
      { error: 'Failed to verify phone number. Please try again later.' },
      { status: 500 }
    )
  }
}
