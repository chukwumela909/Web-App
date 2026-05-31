import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Super admin access is managed by the backend MongoDB platform-admin data, not Firestore.'
    },
    { status: 410 }
  )
}
