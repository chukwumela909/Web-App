// DEPRECATED: Legacy Firestore-backed transfer receive route.
// Transfers are now handled by the REST backend via inventory-service.
// This handler is retained only so the build/route table stays valid.
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated; transfers are handled by the REST backend.' },
    { status: 410 }
  )
}
