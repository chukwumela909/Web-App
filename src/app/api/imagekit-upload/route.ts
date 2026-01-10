import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'

const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'fahampesa-8c514.firebasestorage.app'

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'fahampesa-8c514',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: STORAGE_BUCKET
    })
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string
    const folder = formData.get('folder') as string || 'products'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const finalFileName = fileName || `${Date.now()}_${file.name}`
    const filePath = `${folder}/${finalFileName}`

    try {
      // Explicitly pass bucket name to avoid "bucket not specified" error
      const bucket = getStorage().bucket(STORAGE_BUCKET)
      const fileRef = bucket.file(filePath)
      
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      })
      
      // Make the file publicly accessible
      await fileRef.makePublic()
      
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`

      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileId: finalFileName,
        name: finalFileName
      })
    } catch (storageError) {
      console.error('Firebase Storage error:', storageError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Storage upload failed. Please ensure Firebase Storage is properly configured.' 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    )
  }
}
