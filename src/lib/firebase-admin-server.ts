import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // For local development, you can use the service account key
    // In production, make sure to use environment variables
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || "fahampesa-8c514",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    }

    // Check if we have the required environment variables
    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      console.warn('Firebase Admin SDK credentials not found in environment variables')
      // If no credentials are available, we'll use the client SDK approach
      return null
    }

    try {
      const app = initializeApp({
        credential: cert(serviceAccount as any),
        projectId: serviceAccount.project_id,
      })
      return app
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error)
      return null
    }
  }
  
  return getApps()[0]
}

export const adminApp = initializeFirebaseAdmin()
export const adminAuth = adminApp ? getAuth(adminApp) : null
export const adminDb = adminApp ? getFirestore(adminApp) : null

export interface FirebaseAuthUser {
  uid: string
  email?: string
  displayName?: string
  emailVerified: boolean
  disabled: boolean
  metadata: {
    creationTime?: string
    lastSignInTime?: string
    lastRefreshTime?: string
  }
  customClaims?: Record<string, any>
  providerData: Array<{
    uid: string
    email?: string
    displayName?: string
    providerId: string
  }>
}

export async function listAllUsers(maxResults = 1000): Promise<FirebaseAuthUser[]> {
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK not initialized. Please check your service account credentials.')
  }

  const users: FirebaseAuthUser[] = []
  let pageToken: string | undefined
  
  try {
    do {
      const listUsersResult = await adminAuth.listUsers(maxResults, pageToken)
      
      for (const userRecord of listUsersResult.users) {
        users.push({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          emailVerified: userRecord.emailVerified,
          disabled: userRecord.disabled,
          metadata: {
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime,
            lastRefreshTime: userRecord.metadata.lastRefreshTime,
          },
          customClaims: userRecord.customClaims,
          providerData: userRecord.providerData.map(provider => ({
            uid: provider.uid,
            email: provider.email,
            displayName: provider.displayName,
            providerId: provider.providerId,
          }))
        })
      }
      
      pageToken = listUsersResult.pageToken
    } while (pageToken)
    
    return users
  } catch (error) {
    console.error('Error listing users:', error)
    throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getUserByEmail(email: string): Promise<FirebaseAuthUser | null> {
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK not initialized. Please check your service account credentials.')
  }

  try {
    const userRecord = await adminAuth.getUserByEmail(email)
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        lastRefreshTime: userRecord.metadata.lastRefreshTime,
      },
      customClaims: userRecord.customClaims,
      providerData: userRecord.providerData.map(provider => ({
        uid: provider.uid,
        email: provider.email,
        displayName: provider.displayName,
        providerId: provider.providerId,
      }))
    }
  } catch (error) {
    if ((error as any).code === 'auth/user-not-found') {
      return null
    }
    console.error('Error getting user by email:', error)
    throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
