import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface BackupRecord {
  id: string
  type: 'full' | 'incremental' | 'differential'
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  duration?: number // in seconds
  size?: number // in bytes
  location: string
  collections: string[]
  recordCount: number
  errorMessage?: string
  triggeredBy: 'scheduled' | 'manual' | 'system'
  triggeredByUser?: string
  metadata?: Record<string, any>
}

export interface RestoreTest {
  id: string
  backupId: string
  status: 'running' | 'passed' | 'failed' | 'skipped'
  startTime: Date
  endTime?: Date
  duration?: number
  testType: 'integrity' | 'performance' | 'full_restore'
  sampledCollections: string[]
  sampledRecords: number
  verifiedRecords: number
  errorMessage?: string
  performanceMetrics?: {
    readSpeed: number // records per second
    writeSpeed: number
    memoryUsage: number // in MB
  }
}

export interface LogRetentionPolicy {
  id: string
  name: string
  logType: 'security' | 'application' | 'system' | 'audit' | 'backup'
  retentionDays: number
  compressionEnabled: boolean
  archiveLocation?: string
  enabled: boolean
  lastCleanup?: Date
  totalSize?: number // in bytes
  recordCount?: number
}

export interface BackupStatus {
  lastBackup?: BackupRecord
  lastSuccessfulBackup?: BackupRecord
  lastRestoreTest?: RestoreTest
  lastSuccessfulRestoreTest?: RestoreTest
  nextScheduledBackup?: Date
  backupHealth: 'healthy' | 'warning' | 'critical'
  totalBackups: number
  failedBackupsLast7Days: number
  averageBackupDuration: number
  totalBackupSize: number
}

export interface LogRetentionStatus {
  policies: LogRetentionPolicy[]
  totalLogSize: number
  oldestLogDate: Date
  newestLogDate: Date
  lastCleanup: Date
  nextCleanup: Date
  cleanupHealth: 'healthy' | 'warning' | 'overdue'
}

class BackupMonitoringService {
  private static instance: BackupMonitoringService

  static getInstance(): BackupMonitoringService {
    if (!BackupMonitoringService.instance) {
      BackupMonitoringService.instance = new BackupMonitoringService()
    }
    return BackupMonitoringService.instance
  }

  // Create a new backup record
  async createBackupRecord(
    type: 'full' | 'incremental' | 'differential',
    collections: string[],
    triggeredBy: 'scheduled' | 'manual' | 'system',
    triggeredByUser?: string
  ): Promise<string> {
    try {
      const backupDoc = await addDoc(collection(db, 'backup_records'), {
        type,
        status: 'running',
        startTime: Timestamp.now(),
        location: `gs://fahampesa-backups/${Date.now()}-${type}`,
        collections,
        recordCount: 0,
        triggeredBy,
        triggeredByUser,
        metadata: {
          version: '1.0',
          environment: process.env.NODE_ENV || 'development'
        }
      })
      
      return backupDoc.id
    } catch (error) {
      console.error('Error creating backup record:', error)
      throw error
    }
  }

  // Update backup record with completion details
  async completeBackupRecord(
    backupId: string,
    status: 'completed' | 'failed' | 'cancelled',
    recordCount: number,
    size?: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      const backupRef = doc(db, 'backup_records', backupId)
      const endTime = new Date()
      
      // Calculate duration (we'll need to fetch start time)
      const backupDoc = await getDocs(query(
        collection(db, 'backup_records'),
        where('__name__', '==', backupId)
      ))
      
      let duration = 0
      if (!backupDoc.empty) {
        const startTime = backupDoc.docs[0].data().startTime?.toDate()
        if (startTime) {
          duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
        }
      }
      
      const updateData: any = {
        status,
        endTime: Timestamp.fromDate(endTime),
        duration,
        recordCount
      }
      
      // Only add fields that are not undefined
      if (size !== undefined) {
        updateData.size = size
      }
      if (errorMessage !== undefined) {
        updateData.errorMessage = errorMessage
      }
      
      await updateDoc(backupRef, updateData)

      // Schedule restore test for successful backups
      if (status === 'completed') {
        await this.scheduleRestoreTest(backupId)
      }
    } catch (error) {
      console.error('Error completing backup record:', error)
    }
  }

  // Schedule a restore test
  async scheduleRestoreTest(backupId: string): Promise<string> {
    try {
      const testDoc = await addDoc(collection(db, 'restore_tests'), {
        backupId,
        status: 'running',
        startTime: Timestamp.now(),
        testType: 'integrity',
        sampledCollections: ['users', 'sales', 'inventory'], // Sample key collections
        sampledRecords: 0,
        verifiedRecords: 0
      })
      
      // Simulate restore test (in real implementation, this would trigger actual test)
      setTimeout(() => {
        this.completeRestoreTest(testDoc.id, 'passed', 1000, 950)
      }, 30000) // 30 second test
      
      return testDoc.id
    } catch (error) {
      console.error('Error scheduling restore test:', error)
      throw error
    }
  }

  // Complete restore test
  async completeRestoreTest(
    testId: string,
    status: 'passed' | 'failed' | 'skipped',
    sampledRecords: number,
    verifiedRecords: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      const testRef = doc(db, 'restore_tests', testId)
      const endTime = new Date()
      
      // Calculate performance metrics
      const performanceMetrics = {
        readSpeed: Math.floor(sampledRecords / 30), // records per second
        writeSpeed: Math.floor(verifiedRecords / 35),
        memoryUsage: Math.floor(Math.random() * 100) + 50 // 50-150 MB
      }
      
      const updateData: any = {
        status,
        endTime: Timestamp.fromDate(endTime),
        duration: 30, // 30 seconds
        sampledRecords,
        verifiedRecords,
        performanceMetrics
      }
      
      // Only add errorMessage if it's not undefined
      if (errorMessage !== undefined) {
        updateData.errorMessage = errorMessage
      }
      
      await updateDoc(testRef, updateData)
    } catch (error) {
      console.error('Error completing restore test:', error)
    }
  }

  // Get backup status
  async getBackupStatus(): Promise<BackupStatus> {
    try {
      const backupsRef = collection(db, 'backup_records')
      const recentBackupsQuery = query(
        backupsRef,
        orderBy('startTime', 'desc'),
        limit(50)
      )
      
      const backupsSnapshot = await getDocs(recentBackupsQuery)
      const backups: BackupRecord[] = []
      
      backupsSnapshot.forEach(doc => {
        const data = doc.data()
        backups.push({
          id: doc.id,
          type: data.type,
          status: data.status,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate(),
          duration: data.duration,
          size: data.size,
          location: data.location,
          collections: data.collections || [],
          recordCount: data.recordCount || 0,
          errorMessage: data.errorMessage,
          triggeredBy: data.triggeredBy,
          triggeredByUser: data.triggeredByUser,
          metadata: data.metadata
        })
      })

      // Get restore tests
      const testsRef = collection(db, 'restore_tests')
      const recentTestsQuery = query(
        testsRef,
        orderBy('startTime', 'desc'),
        limit(10)
      )
      
      const testsSnapshot = await getDocs(recentTestsQuery)
      const tests: RestoreTest[] = []
      
      testsSnapshot.forEach(doc => {
        const data = doc.data()
        tests.push({
          id: doc.id,
          backupId: data.backupId,
          status: data.status,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate(),
          duration: data.duration,
          testType: data.testType,
          sampledCollections: data.sampledCollections || [],
          sampledRecords: data.sampledRecords || 0,
          verifiedRecords: data.verifiedRecords || 0,
          errorMessage: data.errorMessage,
          performanceMetrics: data.performanceMetrics
        })
      })

      // Calculate statistics
      const lastBackup = backups[0]
      const lastSuccessfulBackup = backups.find(b => b.status === 'completed')
      const lastRestoreTest = tests[0]
      const lastSuccessfulRestoreTest = tests.find(t => t.status === 'passed')
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const failedBackupsLast7Days = backups.filter(b => 
        b.status === 'failed' && b.startTime >= sevenDaysAgo
      ).length
      
      const completedBackups = backups.filter(b => b.status === 'completed' && b.duration)
      const averageBackupDuration = completedBackups.length > 0
        ? completedBackups.reduce((sum, b) => sum + (b.duration || 0), 0) / completedBackups.length
        : 0
      
      const totalBackupSize = backups
        .filter(b => b.size)
        .reduce((sum, b) => sum + (b.size || 0), 0)

      // Determine backup health
      let backupHealth: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (!lastSuccessfulBackup || 
          (new Date().getTime() - lastSuccessfulBackup.startTime.getTime()) > 24 * 60 * 60 * 1000) {
        backupHealth = 'critical'
      } else if (failedBackupsLast7Days > 2 || 
                 !lastSuccessfulRestoreTest ||
                 (new Date().getTime() - lastSuccessfulRestoreTest.startTime.getTime()) > 7 * 24 * 60 * 60 * 1000) {
        backupHealth = 'warning'
      }

      // Calculate next scheduled backup (daily at 2 AM)
      const nextScheduledBackup = new Date()
      nextScheduledBackup.setDate(nextScheduledBackup.getDate() + 1)
      nextScheduledBackup.setHours(2, 0, 0, 0)

      return {
        lastBackup,
        lastSuccessfulBackup,
        lastRestoreTest,
        lastSuccessfulRestoreTest,
        nextScheduledBackup,
        backupHealth,
        totalBackups: backups.length,
        failedBackupsLast7Days,
        averageBackupDuration,
        totalBackupSize
      }
    } catch (error) {
      console.error('Error getting backup status:', error)
      return {
        backupHealth: 'critical',
        totalBackups: 0,
        failedBackupsLast7Days: 0,
        averageBackupDuration: 0,
        totalBackupSize: 0
      }
    }
  }

  // Initialize log retention policies
  async initializeLogRetentionPolicies(): Promise<void> {
    try {
      const policies: Omit<LogRetentionPolicy, 'id'>[] = [
        {
          name: 'Security Logs',
          logType: 'security',
          retentionDays: 90,
          compressionEnabled: true,
          archiveLocation: 'gs://fahampesa-logs/security',
          enabled: true
        },
        {
          name: 'Application Logs',
          logType: 'application',
          retentionDays: 30,
          compressionEnabled: true,
          archiveLocation: 'gs://fahampesa-logs/application',
          enabled: true
        },
        {
          name: 'System Logs',
          logType: 'system',
          retentionDays: 14,
          compressionEnabled: false,
          enabled: true
        },
        {
          name: 'Audit Logs',
          logType: 'audit',
          retentionDays: 365,
          compressionEnabled: true,
          archiveLocation: 'gs://fahampesa-logs/audit',
          enabled: true
        },
        {
          name: 'Backup Logs',
          logType: 'backup',
          retentionDays: 180,
          compressionEnabled: true,
          archiveLocation: 'gs://fahampesa-logs/backup',
          enabled: true
        }
      ]

      const policiesRef = collection(db, 'log_retention_policies')
      
      for (const policy of policies) {
        // Check if policy already exists
        const existingQuery = query(
          policiesRef,
          where('logType', '==', policy.logType)
        )
        const existing = await getDocs(existingQuery)
        
        if (existing.empty) {
          await addDoc(policiesRef, {
            ...policy,
            lastCleanup: Timestamp.now(),
            totalSize: Math.floor(Math.random() * 1000000000), // Random size for demo
            recordCount: Math.floor(Math.random() * 100000)
          })
        }
      }
    } catch (error) {
      console.error('Error initializing log retention policies:', error)
    }
  }

  // Get log retention status
  async getLogRetentionStatus(): Promise<LogRetentionStatus> {
    try {
      const policiesRef = collection(db, 'log_retention_policies')
      const policiesSnapshot = await getDocs(policiesRef)
      
      const policies: LogRetentionPolicy[] = []
      let totalLogSize = 0
      
      policiesSnapshot.forEach(doc => {
        const data = doc.data()
        const policy: LogRetentionPolicy = {
          id: doc.id,
          name: data.name,
          logType: data.logType,
          retentionDays: data.retentionDays,
          compressionEnabled: data.compressionEnabled,
          archiveLocation: data.archiveLocation,
          enabled: data.enabled,
          lastCleanup: data.lastCleanup?.toDate(),
          totalSize: data.totalSize || 0,
          recordCount: data.recordCount || 0
        }
        
        policies.push(policy)
        totalLogSize += policy.totalSize || 0
      })

      // Calculate dates
      const now = new Date()
      const oldestLogDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) // 1 year ago
      const newestLogDate = now
      const lastCleanup = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Yesterday
      const nextCleanup = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Tomorrow

      // Determine cleanup health
      let cleanupHealth: 'healthy' | 'warning' | 'overdue' = 'healthy'
      const daysSinceLastCleanup = (now.getTime() - lastCleanup.getTime()) / (24 * 60 * 60 * 1000)
      
      if (daysSinceLastCleanup > 7) {
        cleanupHealth = 'overdue'
      } else if (daysSinceLastCleanup > 3) {
        cleanupHealth = 'warning'
      }

      return {
        policies,
        totalLogSize,
        oldestLogDate,
        newestLogDate,
        lastCleanup,
        nextCleanup,
        cleanupHealth
      }
    } catch (error) {
      console.error('Error getting log retention status:', error)
      return {
        policies: [],
        totalLogSize: 0,
        oldestLogDate: new Date(),
        newestLogDate: new Date(),
        lastCleanup: new Date(),
        nextCleanup: new Date(),
        cleanupHealth: 'overdue'
      }
    }
  }

  // Perform log cleanup
  async performLogCleanup(policyId: string): Promise<void> {
    try {
      const policyRef = doc(db, 'log_retention_policies', policyId)
      await updateDoc(policyRef, {
        lastCleanup: Timestamp.now(),
        totalSize: Math.floor(Math.random() * 500000000), // Simulate size reduction
        recordCount: Math.floor(Math.random() * 50000)
      })
    } catch (error) {
      console.error('Error performing log cleanup:', error)
    }
  }

  // Trigger manual backup
  async triggerManualBackup(
    type: 'full' | 'incremental' | 'differential',
    collections: string[],
    userId: string
  ): Promise<string> {
    try {
      const backupId = await this.createBackupRecord(type, collections, 'manual', userId)
      
      // Simulate backup process
      setTimeout(async () => {
        const recordCount = Math.floor(Math.random() * 100000) + 10000
        const size = Math.floor(Math.random() * 1000000000) + 100000000 // 100MB - 1GB
        await this.completeBackupRecord(backupId, 'completed', recordCount, size)
      }, 60000) // 1 minute backup
      
      return backupId
    } catch (error) {
      console.error('Error triggering manual backup:', error)
      throw error
    }
  }
}

export default BackupMonitoringService.getInstance()