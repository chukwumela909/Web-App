import { NextResponse } from 'next/server'
import ImageKit from 'imagekit'

// Initialize ImageKit with server-side credentials
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'public_BkD10I8kVc0GOzh5B+6y89y/l2Q=',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/eenbmk547'
})

export async function GET() {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters()
    return NextResponse.json(authenticationParameters)
  } catch (error) {
    console.error('ImageKit auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate authentication parameters' },
      { status: 500 }
    )
  }
}
