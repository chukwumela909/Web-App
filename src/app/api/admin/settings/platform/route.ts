import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

export interface PlatformSettings {
  platformName: string
  timezone: string
  defaultLanguage: string
  dataRetentionDays: number
  backupFrequency: string
  updatedAt?: any
  updatedBy?: string
}

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'FahamPesa System',
  timezone: 'Africa/Nairobi (EAT)',
  defaultLanguage: 'English',
  dataRetentionDays: 365,
  backupFrequency: 'Daily'
}

export async function GET(request: NextRequest) {
  try {
    const settingsRef = doc(db, 'platform_settings', 'general')
    const settingsSnap = await getDoc(settingsRef)
    
    if (settingsSnap.exists()) {
      const data = settingsSnap.data() as PlatformSettings
      return NextResponse.json({
        success: true,
        settings: {
          ...data,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
        }
      })
    } else {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
        isDefault: true
      })
    }
    
  } catch (error) {
    console.error('Error fetching platform settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch platform settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platformName, timezone, defaultLanguage, dataRetentionDays, backupFrequency, updatedBy } = body
    
    // Validate required fields
    if (!platformName || !timezone || !defaultLanguage || dataRetentionDays === undefined || !backupFrequency) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        required: ['platformName', 'timezone', 'defaultLanguage', 'dataRetentionDays', 'backupFrequency']
      }, { status: 400 })
    }
    
    // Validate data types and ranges
    if (typeof dataRetentionDays !== 'number' || dataRetentionDays < 1 || dataRetentionDays > 3650) {
      return NextResponse.json({
        success: false,
        error: 'Data retention days must be a number between 1 and 3650'
      }, { status: 400 })
    }
    
    const validBackupFrequencies = ['Hourly', 'Daily', 'Weekly', 'Monthly']
    if (!validBackupFrequencies.includes(backupFrequency)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid backup frequency',
        validOptions: validBackupFrequencies
      }, { status: 400 })
    }
    
    const settings: PlatformSettings = {
      platformName: platformName.trim(),
      timezone,
      defaultLanguage,
      dataRetentionDays: Number(dataRetentionDays),
      backupFrequency,
      updatedAt: serverTimestamp(),
      updatedBy: updatedBy || 'Unknown'
    }
    
    const settingsRef = doc(db, 'platform_settings', 'general')
    await setDoc(settingsRef, settings, { merge: true })
    
    return NextResponse.json({
      success: true,
      message: 'Platform settings updated successfully',
      settings: {
        ...settings,
        updatedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Error updating platform settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update platform settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
