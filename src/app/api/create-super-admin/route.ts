import { NextRequest, NextResponse } from 'next/server'
import { createSuperAdmin } from '@/lib/adminUtils'

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow in development or with proper authentication
    const { searchParams } = new URL(request.url)
    const secretKey = searchParams.get('secret')
    
    // Use a secret key for security (you can set this in environment variables)
    const expectedSecret = process.env.SUPER_ADMIN_SECRET || 'fahampesa-super-admin-secret-2024'
    
    if (secretKey !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid secret key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, password, displayName } = body

    // Validate required fields
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and displayName are required' },
        { status: 400 }
      )
    }

    console.log('Creating super admin user...')
    console.log('Email:', email)
    console.log('Display Name:', displayName)
    
    const user = await createSuperAdmin(email, password, displayName)
    
    console.log('✅ Super admin created successfully!')
    console.log('User ID:', user.uid)
    console.log('Email:', user.email)
    console.log('Display Name:', user.displayName)
    
    return NextResponse.json({
      success: true,
      message: 'Super admin created successfully',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }
    })
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error creating super admin:', errorMessage)
    
    const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : ''
    
    let statusCode = 500
    let message = errorMessage
    
    if (errorCode === 'auth/email-already-in-use') {
      statusCode = 409
      message = 'User already exists with this email'
    } else if (errorCode === 'auth/weak-password') {
      statusCode = 400
      message = 'Password is too weak. Please use a stronger password.'
    } else if (errorCode === 'auth/invalid-email') {
      statusCode = 400
      message = 'Invalid email format'
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: message,
        code: errorCode
      },
      { status: statusCode }
    )
  }
}
