'use client'

import { auth, db } from '@/lib/firebase'
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { User } from 'firebase/auth'

export interface BackupData {
  version: string
  timestamp: string
  userId: string
  businessName?: string
  data: {
    products?: any[]
    inventory?: any[]
    sales?: any[]
    expenses?: any[]
    debtors?: any[]
    suppliers?: any[]
    branches?: any[]
    staff?: any[]
    settings?: any
  }
}

export interface BackupFile {
  id: string
  filename: string
  url: string
  size: number
  uploadedAt: string
  description?: string
}

// VPS API configuration
const VPS_API_BASE = process.env.NEXT_PUBLIC_VPS_API_URL || 'https://storage.fahampesa.com/api'

/**
 * Generate backup data from current user's Firestore collections
 */
export const generateBackupData = async (user: User): Promise<BackupData> => {
  if (!user) throw new Error('User not authenticated')

  const backupData: BackupData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    userId: user.uid,
    businessName: user.displayName || undefined,
    data: {}
  }

  try {
    // Backup Products
    const productsSnapshot = await getDocs(collection(db, `users/${user.uid}/products`))
    backupData.data.products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Backup Inventory 
    const inventorySnapshot = await getDocs(collection(db, `users/${user.uid}/inventory`))
    backupData.data.inventory = inventorySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Backup Sales
    const salesSnapshot = await getDocs(collection(db, `users/${user.uid}/sales`))
    backupData.data.sales = salesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Backup Expenses
    const expensesSnapshot = await getDocs(collection(db, `users/${user.uid}/expenses`))
    backupData.data.expenses = expensesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Backup Debtors
    const debtorsSnapshot = await getDocs(collection(db, `users/${user.uid}/debtors`))
    backupData.data.debtors = debtorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Backup Suppliers
    const suppliersSnapshot = await getDocs(collection(db, `users/${user.uid}/suppliers`))
    backupData.data.suppliers = suppliersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Backup Branches
    const branchesSnapshot = await getDocs(collection(db, `users/${user.uid}/branches`))
    backupData.data.branches = branchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Backup Staff
    const staffSnapshot = await getDocs(collection(db, `users/${user.uid}/staff`))
    backupData.data.staff = staffSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Backup Settings
    const settingsCollections = ['businessProfiles', 'userProfiles', 'notificationSettings', 'deviceSettings', 'dataSyncSettings']
    const settings: any = {}
    
    for (const collectionName of settingsCollections) {
      try {
        const settingsSnapshot = await getDocs(collection(db, collectionName))
        settings[collectionName] = settingsSnapshot.docs
          .filter(doc => doc.id === user.uid)
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
      } catch (error) {
        console.warn(`Failed to backup ${collectionName}:`, error)
      }
    }
    backupData.data.settings = settings

    return backupData
  } catch (error) {
    console.error('Error generating backup data:', error)
    throw new Error('Failed to generate backup data')
  }
}

/**
 * Upload backup file to VPS (with fallback to local download)
 */
export const uploadBackupToVPS = async (
  backupData: BackupData, 
  description?: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; fileUrl?: string; error?: string }> => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')

    // Convert backup data to JSON blob
    const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json'
    })
    const filename = `fahampesa-backup-${user.uid}-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`

    // Try VPS upload first
    try {
      // Get Firebase auth token
      const token = await user.getIdToken()
      
      // Create form data
      const formData = new FormData()
      formData.append('file', jsonBlob, filename)
      formData.append('description', description || '')
      formData.append('userId', user.uid)

      // Upload to VPS
      const response = await fetch(`${VPS_API_BASE}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`VPS upload failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      // Save backup record to Firestore
      const backupRecord: BackupFile = {
        id: result.fileId || filename,
        filename: result.filename || filename,
        url: result.url,
        size: jsonBlob.size,
        uploadedAt: new Date().toISOString(),
        description: description
      }

      await setDoc(doc(db, `users/${user.uid}/backups`, backupRecord.id), {
        ...backupRecord,
        createdAt: serverTimestamp()
      })

      return { success: true, fileUrl: result.url }

    } catch (vpsError) {
      console.warn('VPS upload failed, using fallback method:', vpsError)
      
      // Fallback: Download backup locally and save record to Firestore
      const url = URL.createObjectURL(jsonBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Save backup record to Firestore (local backup)
      const backupRecord: BackupFile = {
        id: filename,
        filename: filename,
        url: 'local', // Indicates local backup
        size: jsonBlob.size,
        uploadedAt: new Date().toISOString(),
        description: `${description} (Local backup - VPS not available)`
      }

      await setDoc(doc(db, `users/${user.uid}/backups`, backupRecord.id), {
        ...backupRecord,
        createdAt: serverTimestamp()
      })

      return { 
        success: true, 
        fileUrl: 'local',
        error: 'VPS not available - backup downloaded locally. Please upload manually after VPS setup.' 
      }
    }

  } catch (error) {
    console.error('Error creating backup:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Backup creation failed' 
    }
  }
}

/**
 * Get list of user's backup files
 */
export const getUserBackups = async (): Promise<BackupFile[]> => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')

    const backupsSnapshot = await getDocs(collection(db, `users/${user.uid}/backups`))
    const backups = backupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BackupFile))

    // Sort by upload date, newest first
    return backups.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
  } catch (error) {
    console.error('Error fetching backups:', error)
    return []
  }
}

/**
 * Download and parse backup file
 */
export const downloadBackupFile = async (fileUrl: string): Promise<BackupData> => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')

    const token = await user.getIdToken()
    
    const response = await fetch(fileUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to download backup file')
    }

    const backupData = await response.json()
    
    // Validate backup data structure
    if (!backupData.version || !backupData.userId || !backupData.data) {
      throw new Error('Invalid backup file format')
    }

    return backupData
  } catch (error) {
    console.error('Error downloading backup:', error)
    throw new Error('Failed to download backup file')
  }
}

/**
 * Restore data from backup
 */
export const restoreFromBackup = async (
  backupData: BackupData,
  options: {
    clearExisting?: boolean
    collections?: string[]
    onProgress?: (progress: number, step: string) => void
  } = {}
): Promise<{ success: boolean; error?: string; restored: string[] }> => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')

    if (backupData.userId !== user.uid) {
      throw new Error('Backup file belongs to a different user')
    }

    const restored: string[] = []
    const totalCollections = Object.keys(backupData.data).length
    let currentCollection = 0

    const updateProgress = (step: string) => {
      const progress = (currentCollection / totalCollections) * 100
      options.onProgress?.(progress, step)
    }

    // Restore Products
    if (backupData.data.products && (!options.collections || options.collections.includes('products'))) {
      updateProgress('Restoring products...')
      
      if (options.clearExisting) {
        const existingProducts = await getDocs(collection(db, `users/${user.uid}/products`))
        for (const doc of existingProducts.docs) {
          await deleteDoc(doc.ref)
        }
      }

      for (const product of backupData.data.products) {
        const { id, ...productData } = product
        await setDoc(doc(db, `users/${user.uid}/products`, id), {
          ...productData,
          restoredAt: serverTimestamp()
        })
      }
      restored.push('products')
      currentCollection++
    }

    // Restore Inventory
    if (backupData.data.inventory && (!options.collections || options.collections.includes('inventory'))) {
      updateProgress('Restoring inventory...')
      
      if (options.clearExisting) {
        const existingInventory = await getDocs(collection(db, `users/${user.uid}/inventory`))
        for (const doc of existingInventory.docs) {
          await deleteDoc(doc.ref)
        }
      }

      for (const item of backupData.data.inventory) {
        const { id, ...itemData } = item
        await setDoc(doc(db, `users/${user.uid}/inventory`, id), {
          ...itemData,
          restoredAt: serverTimestamp()
        })
      }
      restored.push('inventory')
      currentCollection++
    }

    // Restore Sales
    if (backupData.data.sales && (!options.collections || options.collections.includes('sales'))) {
      updateProgress('Restoring sales...')
      
      if (options.clearExisting) {
        const existingSales = await getDocs(collection(db, `users/${user.uid}/sales`))
        for (const doc of existingSales.docs) {
          await deleteDoc(doc.ref)
        }
      }

      for (const sale of backupData.data.sales) {
        const { id, ...saleData } = sale
        await setDoc(doc(db, `users/${user.uid}/sales`, id), {
          ...saleData,
          restoredAt: serverTimestamp()
        })
      }
      restored.push('sales')
      currentCollection++
    }

    // Restore Expenses
    if (backupData.data.expenses && (!options.collections || options.collections.includes('expenses'))) {
      updateProgress('Restoring expenses...')
      
      if (options.clearExisting) {
        const existingExpenses = await getDocs(collection(db, `users/${user.uid}/expenses`))
        for (const doc of existingExpenses.docs) {
          await deleteDoc(doc.ref)
        }
      }

      for (const expense of backupData.data.expenses) {
        const { id, ...expenseData } = expense
        await setDoc(doc(db, `users/${user.uid}/expenses`, id), {
          ...expenseData,
          restoredAt: serverTimestamp()
        })
      }
      restored.push('expenses')
      currentCollection++
    }

    // Restore other collections (debtors, suppliers, branches, staff)
    const otherCollections = ['debtors', 'suppliers', 'branches', 'staff']
    for (const collectionName of otherCollections) {
      if (backupData.data[collectionName] && (!options.collections || options.collections.includes(collectionName))) {
        updateProgress(`Restoring ${collectionName}...`)
        
        if (options.clearExisting) {
          const existingDocs = await getDocs(collection(db, `users/${user.uid}/${collectionName}`))
          for (const doc of existingDocs.docs) {
            await deleteDoc(doc.ref)
          }
        }

        for (const item of backupData.data[collectionName]) {
          const { id, ...itemData } = item
          await setDoc(doc(db, `users/${user.uid}/${collectionName}`, id), {
            ...itemData,
            restoredAt: serverTimestamp()
          })
        }
        restored.push(collectionName)
        currentCollection++
      }
    }

    // Restore Settings
    if (backupData.data.settings && (!options.collections || options.collections.includes('settings'))) {
      updateProgress('Restoring settings...')
      
      for (const [settingType, settingData] of Object.entries(backupData.data.settings)) {
        if (Array.isArray(settingData) && settingData.length > 0) {
          const { id, ...data } = settingData[0]
          await setDoc(doc(db, settingType, user.uid), {
            ...data,
            restoredAt: serverTimestamp()
          })
        }
      }
      restored.push('settings')
      currentCollection++
    }

    updateProgress('Restore completed!')

    return { success: true, restored }
  } catch (error) {
    console.error('Error restoring from backup:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Restore failed',
      restored: []
    }
  }
}

/**
 * Delete backup file
 */
export const deleteBackup = async (backupId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')

    // Delete from Firestore
    await deleteDoc(doc(db, `users/${user.uid}/backups`, backupId))

    // TODO: Also delete from VPS if needed
    // This would require a DELETE endpoint on the VPS API

    return { success: true }
  } catch (error) {
    console.error('Error deleting backup:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    }
  }
}

/**
 * Validate backup file before restore
 */
export const validateBackupFile = (file: File): Promise<{ valid: boolean; error?: string; preview?: any }> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const backupData = JSON.parse(content)
        
        // Basic validation
        if (!backupData.version) {
          resolve({ valid: false, error: 'Missing version information' })
          return
        }
        
        if (!backupData.userId) {
          resolve({ valid: false, error: 'Missing user ID' })
          return
        }
        
        if (!backupData.data || typeof backupData.data !== 'object') {
          resolve({ valid: false, error: 'Invalid data structure' })
          return
        }

        // Create preview
        const preview = {
          version: backupData.version,
          timestamp: backupData.timestamp,
          businessName: backupData.businessName,
          collections: Object.keys(backupData.data).filter(key => 
            Array.isArray(backupData.data[key]) && backupData.data[key].length > 0
          ),
          counts: {}
        }
        
        for (const [key, value] of Object.entries(backupData.data)) {
          if (Array.isArray(value)) {
            preview.counts[key] = value.length
          }
        }
        
        resolve({ valid: true, preview })
      } catch (error) {
        resolve({ valid: false, error: 'Invalid JSON format' })
      }
    }
    
    reader.onerror = () => {
      resolve({ valid: false, error: 'Failed to read file' })
    }
    
    reader.readAsText(file)
  })
}
