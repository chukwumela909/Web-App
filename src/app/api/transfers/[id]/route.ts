// DEPRECATED: Legacy Firestore-backed transfer route.
// Transfers are now handled by the REST backend via inventory-service.
// These handlers are retained only so the build/route table stays valid.
import { NextResponse } from 'next/server'

const DEPRECATED_RESPONSE = {
  error: 'This endpoint is deprecated; transfers are handled by the REST backend.'
}

export async function GET() {
  return NextResponse.json(DEPRECATED_RESPONSE, { status: 410 })
}

export async function PUT() {
  return NextResponse.json(DEPRECATED_RESPONSE, { status: 410 })
}
