'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StaffProtectedRoute from '@/components/auth/StaffProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BusinessProfile, 
  UserProfile, 
  NotificationSettings,
  DeviceSettings,
  DataSyncSettings,
  getBusinessProfile, 
  getUserProfile, 
  getNotificationSettings,
  getDeviceSettings,
  getDataSyncSettings,
  upsertBusinessProfile, 
  upsertUserProfile,
  upsertNotificationSettings,
  upsertDeviceSettings,
  upsertDataSyncSettings
} from '@/lib/firestore'
import { 
  generateBackupData,
  uploadBackupToVPS,
  getUserBackups,
  downloadBackupFile,
  restoreFromBackup,
  deleteBackup,
  validateBackupFile,
  BackupFile,
  BackupData
} from '@/lib/backup-service'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  User,
  Building2,
  Smartphone,
  Database,
  DollarSign,
  HelpCircle,
  Bell,
  Shield,
  LogOut,
  Save,
  Upload,
  Printer,
  Bluetooth,
  BarChart3,
  Cloud,
  RefreshCw,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  QrCode,
  Settings2,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  X,
  Monitor,
  Laptop,
  Smartphone as SmartphoneIcon,
  Loader2,
  Download,
  FolderOpen,
  HardDrive,
  ShieldCheck
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}


export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { staff, hasPermission } = useStaff()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('account')

  // Define which tabs are available based on permissions
  const availableTabs = [
    { id: 'account', label: 'Account', icon: User, permission: 'settings:account_read' },
    { id: 'business', label: 'Business', icon: Building2, permission: 'settings:business_read' },
    { id: 'devices', label: 'Devices', icon: Smartphone, permission: 'settings:devices_read' },
    { id: 'data-sync', label: 'Data & Sync', icon: Database, permission: 'settings:data_sync_read' },
    { id: 'pricing-taxes', label: 'Pricing', icon: DollarSign, permission: 'settings:pricing_read' },
    { id: 'support', label: 'Support', icon: HelpCircle, permission: 'settings:support_read' }
  ].filter(tab => {
    // If no staff (owner), show all tabs
    if (!staff) return true
    // For staff members, check permissions
    return hasPermission(tab.permission)
  })

  // Ensure active tab is accessible
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id)
    }
  }, [availableTabs, activeTab])
  
  // States for all settings
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)
  const [deviceSettings, setDeviceSettings] = useState<DeviceSettings | null>(null)
  const [dataSyncSettings, setDataSyncSettings] = useState<DataSyncSettings | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  
  // Backup & Restore state
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([])
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState({ progress: 0, step: '' })
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null)
  const [backupPreview, setBackupPreview] = useState<any>(null)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showClearCacheModal, setShowClearCacheModal] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [showBackupDetailsModal, setShowBackupDetailsModal] = useState(false)
  const [cacheClearing, setCacheClearing] = useState(false)
  const [syncChecking, setSyncChecking] = useState(false)
  const [cacheValues, setCacheValues] = useState({
    browserCache: 12,
    appData: 8,
    tempFiles: 3
  })

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return
      setLoading(true)
      try {
        const [up, bp, ns, ds, dss] = await Promise.all([
          getUserProfile(user.uid),
          getBusinessProfile(user.uid),
          getNotificationSettings(user.uid),
          getDeviceSettings(user.uid),
          getDataSyncSettings(user.uid)
        ])
        
        setUserProfile(up || { 
          uid: user.uid, 
          fullName: '', 
          email: user.email || '', 
          phoneNumber: '', 
          profileImageUrl: '' 
        })
        
        setBusinessProfile(bp || { 
          uid: user.uid, 
          businessName: '', 
          businessType: '', 
          businessAddress: '', 
          businessPhone: '', 
          businessEmail: user.email || '', 
          currency: 'KES', 
          taxRate: 0, 
          lowStockThreshold: 5,
          companyLegalName: '',
          companyRegistrationNumber: '',
          companyLogoUrl: '',
          receiptHeaderText: '',
          receiptFooterText: '',
          receiptThankYouMessage: '',
          receiptLogoUrl: ''
        })
        
        setNotificationSettings(ns || {
          uid: user.uid,
          emailNotifications: true,
          smsNotifications: false,
          appNotifications: true,
          lowStockAlerts: true,
          salesAlerts: false,
          debtorPaymentReminders: true
        })
        
        setDeviceSettings(ds || {
          uid: user.uid,
          pairedDevices: [],
          printerSettings: {
            defaultPrinterId: undefined,
            receiptPrinterId: undefined,
            labelPrinterId: undefined,
            invoicePrinterId: undefined,
            barcodePrinterId: undefined,
            autoPrintReceipts: false,
            printCopies: 1,
            paperSize: '80mm',
            printQuality: 'NORMAL',
            headerLogo: true,
            footerText: true,
            printBarcodes: false
          },
          scannerSettings: {
            defaultScannerId: undefined,
            barcodeScannerId: undefined,
            documentScannerId: undefined,
            autoScanEnabled: false,
            scanQuality: 'MEDIUM',
            scanFormat: 'PDF',
            ocrEnabled: false
          },
          barcodeSettings: { 
            format: 'CODE128', 
            autoGenerate: true,
            printOnLabels: false,
            includePriceInBarcode: false
          },
          bluetoothEnabled: true,
          wifiEnabled: true,
          usbEnabled: true,
          networkDiscoveryEnabled: false,
          autoConnectDevices: false,
          deviceTimeout: 30,
          lastDeviceScan: undefined
        })
        
        setDataSyncSettings(dss || {
          uid: user.uid,
          offlineSyncEnabled: false,
          autoSyncInterval: 30,
          backupSettings: {
            autoBackup: false,
            backupFrequency: 'WEEKLY',
            cloudStorage: 'GOOGLE_DRIVE'
          }
        })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [user])

  // Load backup files
  useEffect(() => {
    const loadBackupFiles = async () => {
      if (!user) return
      try {
        const backups = await getUserBackups()
        setBackupFiles(backups)
      } catch (error) {
        console.error('Failed to load backup files:', error)
      }
    }
    loadBackupFiles()
  }, [user])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  const saveAccountSettings = async () => {
    if (!user || !userProfile || !notificationSettings) return
    setSaving(true)
    try {
      await Promise.all([
        upsertUserProfile(user.uid, userProfile),
        upsertNotificationSettings(user.uid, notificationSettings)
      ])
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveBusinessSettings = async () => {
    if (!user || !businessProfile) return
    setSaving(true)
    try {
      await upsertBusinessProfile(user.uid, businessProfile)
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveDeviceSettings = async () => {
    if (!user || !deviceSettings) return
    setSaving(true)
    try {
      await upsertDeviceSettings(user.uid, deviceSettings)
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveDataSyncSettings = async () => {
    if (!user || !dataSyncSettings) return
    setSaving(true)
    try {
      await upsertDataSyncSettings(user.uid, dataSyncSettings)
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  // Backup functions
  const handleCreateBackup = async () => {
    if (!user) return
    setBackupLoading(true)
    setBackupProgress(0)
    try {
      // Generate backup data
      const backupData = await generateBackupData(user)
      
      // Upload to VPS
      const result = await uploadBackupToVPS(
        backupData,
        'Manual backup created from settings',
        (progress) => setBackupProgress(progress)
      )
      
      if (result.success) {
        // Reload backup files list
        const backups = await getUserBackups()
        setBackupFiles(backups)
        alert('Backup created successfully!')
      } else {
        alert('Backup failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Backup error:', error)
      alert('Backup failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setBackupLoading(false)
      setBackupProgress(0)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedBackupFile(file)
    
    // Validate file
    try {
      const validation = await validateBackupFile(file)
      if (validation.valid) {
        setBackupPreview(validation.preview)
        setShowRestoreModal(true)
      } else {
        alert('Invalid backup file: ' + (validation.error || 'Unknown error'))
        setSelectedBackupFile(null)
      }
    } catch (error) {
      alert('Failed to validate backup file')
      setSelectedBackupFile(null)
    }
  }

  const handleRestoreFromFile = async (clearExisting: boolean = false) => {
    if (!selectedBackupFile || !user) return
    
    setRestoreLoading(true)
    setRestoreProgress({ progress: 0, step: 'Reading backup file...' })
    
    try {
      // Validate and read backup file
      const validation = await validateBackupFile(selectedBackupFile)
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid backup file')
      }

      // Read file content
      const reader = new FileReader()
      const backupData: BackupData = await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            resolve(JSON.parse(content))
          } catch (error) {
            reject(new Error('Failed to parse backup file'))
          }
        }
        reader.onerror = () => reject(new Error('Failed to read backup file'))
        reader.readAsText(selectedBackupFile)
      })

      // Restore data
      const result = await restoreFromBackup(backupData, {
        clearExisting,
        onProgress: (progress, step) => {
          setRestoreProgress({ progress, step })
        }
      })

      if (result.success) {
        alert(`Restore completed! Restored collections: ${result.restored.join(', ')}`)
        setShowRestoreModal(false)
        setSelectedBackupFile(null)
        setBackupPreview(null)
        
        // Reload settings to reflect restored data
        window.location.reload()
      } else {
        alert('Restore failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Restore error:', error)
      alert('Restore failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setRestoreLoading(false)
      setRestoreProgress({ progress: 0, step: '' })
    }
  }

  const handleRestoreFromCloud = async (backupFile: BackupFile, clearExisting: boolean = false) => {
    if (!user) return
    
    setRestoreLoading(true)
    setRestoreProgress({ progress: 0, step: 'Downloading backup...' })
    
    try {
      // Download backup data
      const backupData = await downloadBackupFile(backupFile.url)
      
      // Restore data
      const result = await restoreFromBackup(backupData, {
        clearExisting,
        onProgress: (progress, step) => {
          setRestoreProgress({ progress, step })
        }
      })

      if (result.success) {
        alert(`Restore completed! Restored collections: ${result.restored.join(', ')}`)
        
        // Reload settings to reflect restored data
        window.location.reload()
      } else {
        alert('Restore failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Restore error:', error)
      alert('Restore failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setRestoreLoading(false)
      setRestoreProgress({ progress: 0, step: '' })
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return
    
    try {
      const result = await deleteBackup(backupId)
      if (result.success) {
        // Remove from local list
        setBackupFiles(prev => prev.filter(b => b.id !== backupId))
      } else {
        alert('Failed to delete backup: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Delete backup error:', error)
      alert('Failed to delete backup')
    }
  }

  // Enhanced Backup Creation with Modal
  const handleCreateBackupWithModal = async () => {
    setShowBackupDetailsModal(true)
  }

  // Clear Cache Functionality
  const handleClearCache = async () => {
    setCacheClearing(true)
    try {
      // Simulate cache clearing operations
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Clear various caches
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Temporarily clear cache values until page refresh
      setCacheValues({
        browserCache: 0,
        appData: 0,
        tempFiles: 0
      })
      
      setCacheClearing(false)
      setShowClearCacheModal(false)
      alert('Cache cleared successfully!')
    } catch (error) {
      console.error('Cache clear error:', error)
      setCacheClearing(false)
      alert('Failed to clear cache')
    }
  }

  // Manual Sync Check
  const handleManualSync = async () => {
    setSyncChecking(true)
    try {
      // Simulate checking for desktop apps
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setSyncChecking(false)
      // Always show no desktop app found for now
    } catch (error) {
      console.error('Sync check error:', error)
      setSyncChecking(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004AAD]"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <motion.div 
          className="space-y-6 p-4 md:p-6"
          {...fadeInUp}
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your account, business preferences, and system configuration
            </p>
          </div>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile-responsive tabs list - filtered based on permissions */}
            <TabsList className={`grid gap-1 w-full bg-gray-100 p-1 rounded-xl mb-6`} style={{gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))`}}>
              {availableTabs.map(tab => {
                const IconComponent = tab.icon
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 text-xs md:text-sm">
                    <IconComponent className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Account Tab - Available to all staff with settings:account_read */}
            <TabsContent value="account" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your personal information and account details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={userProfile?.fullName || ''}
                        onChange={(e) => setUserProfile(prev => prev ? {...prev, fullName: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={userProfile?.email || ''}
                        onChange={(e) => setUserProfile(prev => prev ? {...prev, email: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={userProfile?.phoneNumber || ''}
                        onChange={(e) => setUserProfile(prev => prev ? {...prev, phoneNumber: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        placeholder="+254 700 000 000"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Settings
                    </CardTitle>
                    <CardDescription>
                      Configure how you want to receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Email Notifications</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings?.emailNotifications || false}
                          onChange={(e) => setNotificationSettings(prev => prev ? {...prev, emailNotifications: e.target.checked} : null)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">SMS Notifications</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings?.smsNotifications || false}
                          onChange={(e) => setNotificationSettings(prev => prev ? {...prev, smsNotifications: e.target.checked} : null)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Low Stock Alerts</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings?.lowStockAlerts || false}
                          onChange={(e) => setNotificationSettings(prev => prev ? {...prev, lowStockAlerts: e.target.checked} : null)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Security & Actions */}
                <Card className="rounded-xl shadow-sm lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security & Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <Button
                          onClick={handleLogout}
                          disabled={loggingOut}
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          {loggingOut ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                          {loggingOut ? 'Logging out...' : 'Logout'}
                        </Button>
                        
                        <Button onClick={saveAccountSettings} disabled={saving} className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Business Tab */}
            <TabsContent value="business" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Profile */}
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Business Profile
                    </CardTitle>
                    <CardDescription>
                      Basic business information and settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                      <input
                        type="text"
                        value={businessProfile?.businessName || ''}
                        onChange={(e) => setBusinessProfile(prev => prev ? {...prev, businessName: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        placeholder="Your business name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                      <select
                        value={businessProfile?.businessType || ''}
                        onChange={(e) => setBusinessProfile(prev => prev ? {...prev, businessType: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                      >
                        <option value="">Select business type</option>
                        <option value="RETAIL">Retail</option>
                        <option value="WHOLESALE">Wholesale</option>
                        <option value="SERVICE">Service</option>
                        <option value="MANUFACTURING">Manufacturing</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <select
                        value={businessProfile?.currency || 'KES'}
                        onChange={(e) => setBusinessProfile(prev => prev ? {...prev, currency: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                      >
                        <option value="KES">KES - Kenyan Shilling</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Tax Settings */}
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Tax Settings
                    </CardTitle>
                    <CardDescription>
                      Configure tax rates and stock thresholds
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                      <input
                        type="number"
                        value={businessProfile?.taxRate || 0}
                        onChange={(e) => setBusinessProfile(prev => prev ? {...prev, taxRate: Number(e.target.value)} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        placeholder="16"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                      <input
                        type="number"
                        value={businessProfile?.lowStockThreshold || 5}
                        onChange={(e) => setBusinessProfile(prev => prev ? {...prev, lowStockThreshold: Number(e.target.value)} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        placeholder="5"
                        min="1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Company Profile */}
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Company Profile
                    </CardTitle>
                    <CardDescription>
                      Legal information and branding
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Legal Company Name</label>
                      <input
                        type="text"
                        value={businessProfile?.companyLegalName || ''}
                        onChange={(e) => setBusinessProfile(prev => prev ? {...prev, companyLegalName: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        placeholder="Legal company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                      <input
                        type="text"
                        value={businessProfile?.companyRegistrationNumber || ''}
                        onChange={(e) => setBusinessProfile(prev => prev ? {...prev, companyRegistrationNumber: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        placeholder="Registration number"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Receipt Template */}
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Receipt Template
                    </CardTitle>
                    <CardDescription>
                      Customize receipt appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Header Text</label>
                      <input
                        type="text"
                        value={businessProfile?.receiptHeaderText || ''}
                        onChange={(e) => setBusinessProfile(prev => prev ? {...prev, receiptHeaderText: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        placeholder="Welcome to our store"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thank You Message</label>
                      <input
                        type="text"
                        value={businessProfile?.receiptThankYouMessage || ''}
                        onChange={(e) => setBusinessProfile(prev => prev ? {...prev, receiptThankYouMessage: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        placeholder="Thank you for your business!"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Save Business Settings */}
                <Card className="rounded-xl shadow-sm lg:col-span-2">
                  <CardContent className="pt-6">
                    <div className="flex justify-end">
                      <Button onClick={saveBusinessSettings} disabled={saving} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Business Settings'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Devices Tab */}
            <TabsContent value="devices" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Device Pairing */}
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Device Pairing
                    </CardTitle>
                    <CardDescription>
                      Manage connected devices and terminals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Device Discovery */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Smartphone className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">Device Discovery</p>
                          <p className="text-xs text-blue-600">Scan for nearby devices</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          // Simulated device scan
                          const mockDevices = [
                            { id: '1', name: 'Thermal Printer TP-200', type: 'PRINTER', status: 'DISCONNECTED', connectionType: 'BLUETOOTH' },
                            { id: '2', name: 'Barcode Scanner BS-100', type: 'SCANNER', status: 'DISCONNECTED', connectionType: 'USB' },
                            { id: '3', name: 'POS Terminal PT-300', type: 'TERMINAL', status: 'DISCONNECTED', connectionType: 'NETWORK' }
                          ]
                          
                          // Add discovered devices to paired devices
                          if (deviceSettings) {
                            const newPairedDevices = [
                              ...deviceSettings.pairedDevices,
                              ...mockDevices.filter(device => !deviceSettings.pairedDevices.find(d => d.id === device.id))
                            ]
                            setDeviceSettings({
                              ...deviceSettings,
                              pairedDevices: newPairedDevices,
                              lastDeviceScan: Date.now()
                            })
                          }
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Scan
                      </Button>
                    </div>

                    {/* Paired Devices List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">Paired Devices</h4>
                        <span className="text-xs text-gray-500">
                          {deviceSettings?.pairedDevices?.length || 0} devices
                        </span>
                      </div>
                      
                      {deviceSettings?.pairedDevices && deviceSettings.pairedDevices.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {deviceSettings.pairedDevices.map((device) => (
                            <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${
                                  device.status === 'CONNECTED' 
                                    ? 'bg-green-100 text-green-600'
                                    : device.status === 'PAIRING'
                                    ? 'bg-yellow-100 text-yellow-600'
                                    : device.status === 'ERROR'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {device.type === 'PRINTER' && <Printer className="h-4 w-4" />}
                                  {device.type === 'SCANNER' && <QrCode className="h-4 w-4" />}
                                  {device.type === 'TERMINAL' && <Settings2 className="h-4 w-4" />}
                                  {!['PRINTER', 'SCANNER', 'TERMINAL'].includes(device.type) && <Smartphone className="h-4 w-4" />}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{device.name}</p>
                                  <p className="text-xs text-gray-500 capitalize">
                                    {device.type.toLowerCase()} • {device.connectionType.toLowerCase()}
                                  </p>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  device.status === 'CONNECTED'
                                    ? 'bg-green-100 text-green-800'
                                    : device.status === 'PAIRING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : device.status === 'ERROR'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {device.status === 'CONNECTED' && (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 inline mr-1" />
                                      Connected
                                    </>
                                  )}
                                  {device.status === 'DISCONNECTED' && (
                                    <>
                                      <WifiOff className="h-3 w-3 inline mr-1" />
                                      Disconnected
                                    </>
                                  )}
                                  {device.status === 'PAIRING' && (
                                    <>
                                      <RefreshCw className="h-3 w-3 inline mr-1 animate-spin" />
                                      Pairing
                                    </>
                                  )}
                                  {device.status === 'ERROR' && (
                                    <>
                                      <AlertCircle className="h-3 w-3 inline mr-1" />
                                      Error
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant={device.status === 'CONNECTED' ? 'destructive' : 'default'}
                                  onClick={() => {
                                    if (deviceSettings) {
                                      const updatedDevices = deviceSettings.pairedDevices.map(d => 
                                        d.id === device.id 
                                          ? { 
                                              ...d, 
                                              status: d.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED' as any,
                                              lastConnected: d.status === 'CONNECTED' ? undefined : Date.now()
                                            }
                                          : d
                                      )
                                      setDeviceSettings({
                                        ...deviceSettings,
                                        pairedDevices: updatedDevices
                                      })
                                    }
                                  }}
                                >
                                  {device.status === 'CONNECTED' ? 'Disconnect' : 'Connect'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (deviceSettings) {
                                      const updatedDevices = deviceSettings.pairedDevices.filter(d => d.id !== device.id)
                                      setDeviceSettings({
                                        ...deviceSettings,
                                        pairedDevices: updatedDevices
                                      })
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <Smartphone className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-500">No paired devices</p>
                          <p className="text-xs text-gray-400 mt-1">Click scan to discover nearby devices</p>
                        </div>
                      )}
                    </div>

                    {/* Connection Settings */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Connection Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wifi className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Network Discovery</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={deviceSettings?.networkDiscoveryEnabled || false}
                              onChange={(e) => setDeviceSettings(prev => prev ? {...prev, networkDiscoveryEnabled: e.target.checked} : null)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Settings2 className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Auto-connect devices</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={deviceSettings?.autoConnectDevices || false}
                              onChange={(e) => setDeviceSettings(prev => prev ? {...prev, autoConnectDevices: e.target.checked} : null)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Printers & Scanners */}
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Printer className="h-5 w-5" />
                      Printers & Scanners
                    </CardTitle>
                    <CardDescription>
                      Configure printing and scanning devices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={() => {
                          // Add a mock printer
                          if (deviceSettings) {
                            const newPrinter = {
                              id: `printer_${Date.now()}`,
                              name: `Receipt Printer ${deviceSettings.pairedDevices.filter(d => d.type === 'PRINTER').length + 1}`,
                              type: 'PRINTER' as const,
                              status: 'DISCONNECTED' as const,
                              connectionType: 'USB' as const,
                              lastConnected: Date.now(),
                              model: 'TP-200',
                              manufacturer: 'Thermal Systems'
                            }
                            setDeviceSettings({
                              ...deviceSettings,
                              pairedDevices: [...deviceSettings.pairedDevices, newPrinter]
                            })
                          }
                        }}
                      >
                        <Printer className="h-6 w-6 text-blue-600" />
                        <div className="text-center">
                          <p className="text-sm font-medium">Add Printer</p>
                          <p className="text-xs text-gray-500">Configure new printer</p>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={() => {
                          // Add a mock scanner
                          if (deviceSettings) {
                            const newScanner = {
                              id: `scanner_${Date.now()}`,
                              name: `Barcode Scanner ${deviceSettings.pairedDevices.filter(d => d.type === 'SCANNER').length + 1}`,
                              type: 'SCANNER' as const,
                              status: 'DISCONNECTED' as const,
                              connectionType: 'BLUETOOTH' as const,
                              lastConnected: Date.now(),
                              model: 'BS-100',
                              manufacturer: 'Scan Tech'
                            }
                            setDeviceSettings({
                              ...deviceSettings,
                              pairedDevices: [...deviceSettings.pairedDevices, newScanner]
                            })
                          }
                        }}
                      >
                        <QrCode className="h-6 w-6 text-green-600" />
                        <div className="text-center">
                          <p className="text-sm font-medium">Add Scanner</p>
                          <p className="text-xs text-gray-500">Configure new scanner</p>
                        </div>
                      </Button>
                    </div>

                    {/* Printer List */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Configured Printers</h4>
                      {deviceSettings?.pairedDevices?.filter(d => d.type === 'PRINTER').length > 0 ? (
                        <div className="space-y-2">
                          {deviceSettings.pairedDevices
                            .filter(d => d.type === 'PRINTER')
                            .map((printer) => (
                            <div key={printer.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${
                                  printer.status === 'CONNECTED' 
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-100 text-blue-600'
                                }`}>
                                  <Printer className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-blue-900">{printer.name}</p>
                                  <p className="text-xs text-blue-600">
                                    {printer.model} • {printer.connectionType?.toLowerCase()}
                                    {deviceSettings.printerSettings.defaultPrinterId === printer.id && ' • Default'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                  onClick={() => {
                                    // Simulate test print
                                    alert(`Test print sent to ${printer.name}`)
                                  }}
                                >
                                  Test Print
                                </Button>
                                <Button
                                  size="sm"
                                  variant={deviceSettings.printerSettings.defaultPrinterId === printer.id ? 'default' : 'outline'}
                                  className={deviceSettings.printerSettings.defaultPrinterId === printer.id ? 'bg-blue-600' : 'border-blue-300 text-blue-700'}
                                  onClick={() => {
                                    if (deviceSettings) {
                                      setDeviceSettings({
                                        ...deviceSettings,
                                        printerSettings: {
                                          ...deviceSettings.printerSettings,
                                          defaultPrinterId: printer.id
                                        }
                                      })
                                    }
                                  }}
                                >
                                  {deviceSettings.printerSettings.defaultPrinterId === printer.id ? 'Default' : 'Set Default'}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-blue-50 rounded-lg border border-dashed border-blue-300">
                          <Printer className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                          <p className="text-sm text-blue-600">No printers configured</p>
                        </div>
                      )}
                    </div>

                    {/* Scanner List */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Configured Scanners</h4>
                      {deviceSettings?.pairedDevices?.filter(d => d.type === 'SCANNER').length > 0 ? (
                        <div className="space-y-2">
                          {deviceSettings.pairedDevices
                            .filter(d => d.type === 'SCANNER')
                            .map((scanner) => (
                            <div key={scanner.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${
                                  scanner.status === 'CONNECTED'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-100 text-green-600'
                                }`}>
                                  <QrCode className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-green-900">{scanner.name}</p>
                                  <p className="text-xs text-green-600">
                                    {scanner.model} • {scanner.connectionType?.toLowerCase()}
                                    {deviceSettings.scannerSettings?.defaultScannerId === scanner.id && ' • Default'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-300 text-green-700 hover:bg-green-100"
                                  onClick={() => {
                                    // Simulate test scan
                                    alert(`Test scan initiated on ${scanner.name}`)
                                  }}
                                >
                                  Test Scan
                                </Button>
                                <Button
                                  size="sm"
                                  variant={deviceSettings.scannerSettings?.defaultScannerId === scanner.id ? 'default' : 'outline'}
                                  className={deviceSettings.scannerSettings?.defaultScannerId === scanner.id ? 'bg-green-600' : 'border-green-300 text-green-700'}
                                  onClick={() => {
                                    if (deviceSettings) {
                                      setDeviceSettings({
                                        ...deviceSettings,
                                        scannerSettings: {
                                          ...deviceSettings.scannerSettings,
                                          defaultScannerId: scanner.id
                                        }
                                      })
                                    }
                                  }}
                                >
                                  {deviceSettings.scannerSettings?.defaultScannerId === scanner.id ? 'Default' : 'Set Default'}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-green-50 rounded-lg border border-dashed border-green-300">
                          <QrCode className="h-8 w-8 text-green-400 mx-auto mb-2" />
                          <p className="text-sm text-green-600">No scanners configured</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Printer Configuration */}
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings2 className="h-5 w-5" />
                      Printer Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure default printing preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Print Quality</label>
                        <select
                          value={deviceSettings?.printerSettings.printQuality || 'NORMAL'}
                          onChange={(e) => setDeviceSettings(prev => prev ? {
                            ...prev,
                            printerSettings: { ...prev.printerSettings, printQuality: e.target.value as any }
                          } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        >
                          <option value="DRAFT">Draft (Fast)</option>
                          <option value="NORMAL">Normal</option>
                          <option value="HIGH">High Quality</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
                        <select
                          value={deviceSettings?.printerSettings.paperSize || '80mm'}
                          onChange={(e) => setDeviceSettings(prev => prev ? {
                            ...prev,
                            printerSettings: { ...prev.printerSettings, paperSize: e.target.value }
                          } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        >
                          <option value="58mm">58mm (Small)</option>
                          <option value="80mm">80mm (Standard)</option>
                          <option value="A4">A4</option>
                          <option value="Letter">Letter</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Copies</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={deviceSettings?.printerSettings.printCopies || 1}
                        onChange={(e) => setDeviceSettings(prev => prev ? {
                          ...prev,
                          printerSettings: { ...prev.printerSettings, printCopies: Number(e.target.value) }
                        } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        placeholder="1"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Auto-print receipts</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deviceSettings?.printerSettings.autoPrintReceipts || false}
                            onChange={(e) => setDeviceSettings(prev => prev ? {
                              ...prev,
                              printerSettings: { ...prev.printerSettings, autoPrintReceipts: e.target.checked }
                            } : null)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Include header logo</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deviceSettings?.printerSettings.headerLogo || false}
                            onChange={(e) => setDeviceSettings(prev => prev ? {
                              ...prev,
                              printerSettings: { ...prev.printerSettings, headerLogo: e.target.checked }
                            } : null)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Print barcodes</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deviceSettings?.printerSettings.printBarcodes || false}
                            onChange={(e) => setDeviceSettings(prev => prev ? {
                              ...prev,
                              printerSettings: { ...prev.printerSettings, printBarcodes: e.target.checked }
                            } : null)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Scanner Configuration */}
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      Scanner Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure scanning preferences and quality
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scan Quality</label>
                        <select
                          value={deviceSettings?.scannerSettings?.scanQuality || 'MEDIUM'}
                          onChange={(e) => setDeviceSettings(prev => prev ? {
                            ...prev,
                            scannerSettings: { ...prev.scannerSettings, scanQuality: e.target.value as any }
                          } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        >
                          <option value="LOW">Low (Fast)</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High Quality</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scan Format</label>
                        <select
                          value={deviceSettings?.scannerSettings?.scanFormat || 'PDF'}
                          onChange={(e) => setDeviceSettings(prev => prev ? {
                            ...prev,
                            scannerSettings: { ...prev.scannerSettings, scanFormat: e.target.value as any }
                          } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        >
                          <option value="PDF">PDF</option>
                          <option value="JPEG">JPEG</option>
                          <option value="PNG">PNG</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Auto-scan enabled</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deviceSettings?.scannerSettings?.autoScanEnabled || false}
                            onChange={(e) => setDeviceSettings(prev => prev ? {
                              ...prev,
                              scannerSettings: { ...prev.scannerSettings, autoScanEnabled: e.target.checked }
                            } : null)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">OCR text recognition</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deviceSettings?.scannerSettings?.ocrEnabled || false}
                            onChange={(e) => setDeviceSettings(prev => prev ? {
                              ...prev,
                              scannerSettings: { ...prev.scannerSettings, ocrEnabled: e.target.checked }
                            } : null)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Barcode Settings */}
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      Barcode Settings
                    </CardTitle>
                    <CardDescription>
                      Configure barcode format and generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Barcode Format</label>
                      <select
                        value={deviceSettings?.barcodeSettings.format || 'CODE128'}
                        onChange={(e) => setDeviceSettings(prev => prev ? {
                          ...prev,
                          barcodeSettings: { ...prev.barcodeSettings, format: e.target.value as any }
                        } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                      >
                        <option value="EAN">EAN</option>
                        <option value="UPC">UPC</option>
                        <option value="QR">QR Code</option>
                        <option value="CODE128">Code 128</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Auto-generate barcodes</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deviceSettings?.barcodeSettings.autoGenerate || false}
                            onChange={(e) => setDeviceSettings(prev => prev ? {
                              ...prev,
                              barcodeSettings: { ...prev.barcodeSettings, autoGenerate: e.target.checked }
                            } : null)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Print on labels</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deviceSettings?.barcodeSettings.printOnLabels || false}
                            onChange={(e) => setDeviceSettings(prev => prev ? {
                              ...prev,
                              barcodeSettings: { ...prev.barcodeSettings, printOnLabels: e.target.checked }
                            } : null)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Include price in barcode</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deviceSettings?.barcodeSettings.includePriceInBarcode || false}
                            onChange={(e) => setDeviceSettings(prev => prev ? {
                              ...prev,
                              barcodeSettings: { ...prev.barcodeSettings, includePriceInBarcode: e.target.checked }
                            } : null)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Connection Settings */}
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bluetooth className="h-5 w-5" />
                      Advanced Connection Settings
                    </CardTitle>
                    <CardDescription>
                      Configure connectivity options and timeouts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-900">Connection Types</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Bluetooth className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">Bluetooth</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={deviceSettings?.bluetoothEnabled || false}
                                onChange={(e) => setDeviceSettings(prev => prev ? {...prev, bluetoothEnabled: e.target.checked} : null)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Wifi className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">WiFi/Network</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={deviceSettings?.wifiEnabled || false}
                                onChange={(e) => setDeviceSettings(prev => prev ? {...prev, wifiEnabled: e.target.checked} : null)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Settings2 className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">USB</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={deviceSettings?.usbEnabled || false}
                                onChange={(e) => setDeviceSettings(prev => prev ? {...prev, usbEnabled: e.target.checked} : null)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Connection Timeout (seconds)</label>
                        <input
                          type="number"
                          min="5"
                          max="300"
                          value={deviceSettings?.deviceTimeout || 30}
                          onChange={(e) => setDeviceSettings(prev => prev ? {
                            ...prev,
                            deviceTimeout: Number(e.target.value)
                          } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                          placeholder="30"
                        />
                        <p className="text-xs text-gray-500 mt-1">Time to wait before timing out device connections</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Device Health & Troubleshooting */}
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Device Health & Diagnostics
                    </CardTitle>
                    <CardDescription>
                      Monitor device status and troubleshoot issues
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Device Health Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-600 rounded-full">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-900">Connected</p>
                            <p className="text-xs text-green-600">
                              {deviceSettings?.pairedDevices?.filter(d => d.status === 'CONNECTED').length || 0} devices
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-600 rounded-full">
                            <AlertCircle className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-yellow-900">Issues</p>
                            <p className="text-xs text-yellow-600">
                              {deviceSettings?.pairedDevices?.filter(d => d.status === 'ERROR').length || 0} devices
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-600 rounded-full">
                            <WifiOff className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Offline</p>
                            <p className="text-xs text-gray-600">
                              {deviceSettings?.pairedDevices?.filter(d => d.status === 'DISCONNECTED').length || 0} devices
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Simulate running diagnostics
                          if (deviceSettings?.pairedDevices?.length) {
                            alert('Running diagnostics on all paired devices...')
                          } else {
                            alert('No devices available for diagnostics')
                          }
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Run Diagnostics
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Reset all device connections
                          if (deviceSettings) {
                            const resetDevices = deviceSettings.pairedDevices.map(device => ({
                              ...device,
                              status: 'DISCONNECTED' as const,
                              errorMessage: undefined,
                              lastError: undefined
                            }))
                            setDeviceSettings({
                              ...deviceSettings,
                              pairedDevices: resetDevices
                            })
                            alert('All device connections have been reset')
                          }
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Connections
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Clear device cache
                          alert('Device cache and temporary files cleared')
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Cache
                      </Button>
                    </div>

                    {/* Last Scan Info */}
                    {deviceSettings?.lastDeviceScan && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-900">
                            Last device scan: {new Date(deviceSettings.lastDeviceScan).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Save Device Settings */}
                <Card className="rounded-xl shadow-sm lg:col-span-2">
                  <CardContent className="pt-6">
                    <div className="flex justify-end">
                      <Button onClick={saveDeviceSettings} disabled={saving} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Device Settings'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Data & Sync Tab */}
            <TabsContent value="data-sync" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Offline Sync */}
                <Card className="rounded-xl shadow-sm border-[#004AAD]/20 bg-[#004AAD]/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#004AAD]">
                      <Wifi className="h-5 w-5" />
                      Offline Sync Controls
                    </CardTitle>
                    <CardDescription className="text-[#004AAD]/70">
                      Manage offline mode and intelligent synchronization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <WifiOff className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Enable Offline Mode</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dataSyncSettings?.offlineSyncEnabled || false}
                          onChange={(e) => setDataSyncSettings(prev => prev ? {...prev, offlineSyncEnabled: e.target.checked} : null)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Auto-sync Interval (minutes)</label>
                      <input
                        type="number"
                        value={dataSyncSettings?.autoSyncInterval || 30}
                        onChange={(e) => setDataSyncSettings(prev => prev ? {...prev, autoSyncInterval: Number(e.target.value)} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        placeholder="30"
                        min="5"
                        max="1440"
                      />
                    </div>
                    <div className="pt-2">
                      <Button 
                        onClick={() => {
                          setShowSyncModal(true)
                          handleManualSync()
                        }}
                        className="w-full bg-[#004AAD] hover:bg-[#003875] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        disabled={syncChecking}
                      >
                        {syncChecking ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Scanning for Desktop Apps...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Manual Sync
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Backup */}
                <Card className="rounded-xl shadow-sm border-[#004AAD]/20 bg-[#004AAD]/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#004AAD]">
                      <Cloud className="h-5 w-5" />
                      Data Backup
                    </CardTitle>
                    <CardDescription className="text-[#004AAD]/70">
                      Create and manage your business data backups with cloud storage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Manual Backup */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Manual Backup</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Button
                          onClick={handleCreateBackupWithModal}
                          disabled={backupLoading}
                          className="bg-[#004AAD] hover:bg-[#003875] text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          {backupLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Cloud className="h-4 w-4 mr-2" />
                              Quick Backup
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleCreateBackup}
                          disabled={backupLoading}
                          variant="outline"
                          className="border-2 border-[#004AAD] text-[#004AAD] hover:bg-[#004AAD] hover:text-white transition-all duration-300"
                        >
                          {backupLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Full Backup
                            </>
                          )}
                        </Button>
                      </div>
                      {backupLoading && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#004AAD] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${backupProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    {/* Backup History */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Recent Backups</h4>
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {backupFiles.length === 0 ? (
                          <p className="text-sm text-gray-500">No backups created yet</p>
                        ) : (
                          backupFiles.slice(0, 5).map((backup) => (
                            <div key={backup.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-900">{backup.filename}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(backup.uploadedAt).toLocaleDateString()} • 
                                  {(backup.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRestoreFromCloud(backup, false)}
                                  disabled={restoreLoading}
                                  className="text-xs px-2 py-1"
                                >
                                  Restore
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteBackup(backup.id)}
                                  className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Auto Backup Settings */}
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Auto Backup</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dataSyncSettings?.backupSettings.autoBackup || false}
                            onChange={(e) => setDataSyncSettings(prev => prev ? {
                              ...prev,
                              backupSettings: { ...prev.backupSettings, autoBackup: e.target.checked }
                            } : null)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AAD]"></div>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency</label>
                        <select
                          value={dataSyncSettings?.backupSettings.backupFrequency || 'WEEKLY'}
                          onChange={(e) => setDataSyncSettings(prev => prev ? {
                            ...prev,
                            backupSettings: { ...prev.backupSettings, backupFrequency: e.target.value as any }
                          } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        >
                          <option value="DAILY">Daily</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="MONTHLY">Monthly</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Restore Data */}
                <Card className="rounded-xl shadow-sm border-[#004AAD]/20 bg-[#004AAD]/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#004AAD]">
                      <Upload className="h-5 w-5" />
                      Restore Data
                    </CardTitle>
                    <CardDescription className="text-[#004AAD]/70">
                      Upload and restore from backup files with smart data merging
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {restoreLoading ? (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004AAD] mx-auto mb-4"></div>
                        <p className="text-sm font-medium text-gray-900">{restoreProgress.step}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div
                            className="bg-[#004AAD] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${restoreProgress.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{Math.round(restoreProgress.progress)}% complete</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* File Upload */}
                        <div className="text-center">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm mb-4">Upload backup file (.json) to restore your data</p>
                          <div className="relative">
                            <input
                              id="backup-file"
                              type="file"
                              accept=".json"
                              onChange={handleFileSelect}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <Button className="w-full bg-[#004AAD] hover:bg-[#003875] text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative z-0">
                              <FolderOpen className="h-4 w-4 mr-2" />
                              Choose Backup File
                            </Button>
                          </div>
                        </div>

                        {/* Cloud Backups */}
                        {backupFiles.length > 0 && (
                          <div className="space-y-3 pt-3 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900">Restore from Cloud Backup</h4>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                              {backupFiles.map((backup) => (
                                <div key={backup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{backup.filename}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(backup.uploadedAt).toLocaleString()} • 
                                      {(backup.size / 1024).toFixed(1)} KB
                                    </p>
                                    {backup.description && (
                                      <p className="text-xs text-gray-600 mt-1">{backup.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRestoreFromCloud(backup, false)}
                                      className="text-xs"
                                    >
                                      Restore (Merge)
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        if (confirm('This will clear all existing data and replace it with backup data. Continue?')) {
                                          handleRestoreFromCloud(backup, true)
                                        }
                                      }}
                                      className="text-xs text-orange-600 hover:text-orange-700"
                                    >
                                      Replace All
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Warning */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex">
                            <AlertCircle className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-yellow-800">
                              <p className="font-medium">Important:</p>
                              <p>Restoring will add backup data to your current data. Choose "Replace All" only if you want to clear existing data first.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Clear Cache */}
                <Card className="rounded-xl shadow-sm border-red-100 bg-red-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <HardDrive className="h-5 w-5" />
                      Clear Cache
                    </CardTitle>
                    <CardDescription className="text-red-600">
                      Clear local cache and temporary data to free up space
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6 space-y-4">
                      <div className="relative">
                        <div className="p-4 bg-white rounded-full inline-block shadow-lg">
                          <HardDrive className="h-8 w-8 text-orange-500" />
                        </div>
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                          !
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-gray-700 text-sm font-medium">Cache Status</p>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <p className="text-gray-500">Browser Cache</p>
                            <p className="font-semibold text-[#004AAD]">~{cacheValues.browserCache} MB</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <p className="text-gray-500">App Data</p>
                            <p className="font-semibold text-[#004AAD]">~{cacheValues.appData} MB</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <p className="text-gray-500">Temp Files</p>
                            <p className="font-semibold text-[#004AAD]">~{cacheValues.tempFiles} MB</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => setShowClearCacheModal(true)}
                        variant="destructive" 
                        className="w-full bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All Cache ({cacheValues.browserCache + cacheValues.appData + cacheValues.tempFiles} MB)
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Data Sync Settings */}
                <Card className="rounded-xl shadow-sm lg:col-span-2">
                  <CardContent className="pt-6">
                    <div className="flex justify-end">
                      <Button onClick={saveDataSyncSettings} disabled={saving} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Sync Settings'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Pricing & Taxes Tab */}
            <TabsContent value="pricing-taxes" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing Rules
                    </CardTitle>
                    <CardDescription>
                      Configure pricing strategies and discounts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Advanced pricing management</p>
                      <p className="text-sm text-gray-400 mb-4">Create multiple price lists, volume discounts, and wholesale pricing</p>
                      <Button disabled>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Configure Pricing (Coming Soon)
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Tax Profiles
                    </CardTitle>
                    <CardDescription>
                      Manage multiple tax types and rates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Standard VAT</h4>
                            <p className="text-sm text-gray-600">Current rate: {businessProfile?.taxRate || 0}%</p>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                      <Button disabled className="w-full">
                        <Settings2 className="h-4 w-4 mr-2" />
                        Add Tax Profile (Coming Soon)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              {/* Contact Support and Help Center - Top Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Support
                    </CardTitle>
                    <CardDescription>
                      Get in touch with our support team
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg space-y-3 border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#004AAD] rounded-full">
                          <Phone className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Phone Support</p>
                          <p className="text-sm text-gray-600">+254 722 628885</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#004AAD] rounded-full">
                          <Mail className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Email Support</p>
                          <p className="text-sm text-gray-600">support@fahampesa.com</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-600 rounded-full">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">WhatsApp Support</p>
                          <p className="text-sm text-gray-600">Quick responses, 9 AM - 6 PM</p>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1"
                          onClick={() => {
                            // Open WhatsApp directly
                            const whatsappUrl = 'https://wa.me/254722628885?text=Hello%20FahamPesa%20Support%2C%0D%0A%0D%0AI%20need%20assistance%20with%20my%20FahamPesa%20account.%0D%0A%0D%0APlease%20help%20me%20with%3A%20'
                            window.open(whatsappUrl, '_blank')
                          }}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        className="text-sm"
                        onClick={() => {
                          // Open WhatsApp with the support phone number
                          const whatsappUrl = 'https://wa.me/254722628885?text=Hello%20FahamPesa%20Support%2C%20I%20need%20help%20with...'
                          window.open(whatsappUrl, '_blank')
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Now
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-sm"
                        onClick={() => {
                          // Open email client with support email
                          const emailUrl = 'mailto:support@fahampesa.com?subject=FahamPesa Support Request&body=Hello FahamPesa Support Team,%0D%0A%0D%0AI need assistance with:%0D%0A%0D%0APlease describe your issue here...'
                          window.open(emailUrl, '_blank')
                        }}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email Us
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5" />
                      Quick Help
                    </CardTitle>
                    <CardDescription>
                      Instant access to help resources
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-blue-50 transition-colors"
                      onClick={() => {
                        // Open User Guide PDF
                        window.open('/doc/FahamPesa_User_Guide.pdf', '_blank')
                      }}
                    >
                      <FileText className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">User Guide</p>
                        <p className="text-xs text-gray-500">Step-by-step instructions</p>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-blue-50 transition-colors"
                      onClick={() => {
                        // Open FAQ PDF
                        window.open('/doc/FahamPesa_FAQ.pdf', '_blank')
                      }}
                    >
                      <HelpCircle className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">Frequently Asked Questions</p>
                        <p className="text-xs text-gray-500">Quick answers to common questions</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="w-full justify-start hover:bg-blue-50 transition-colors">
                      <Calendar className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">Schedule Training</p>
                        <p className="text-xs text-gray-500">1-on-1 guided setup</p>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </div>


              {/* Support Ticket Section */}
              <Card className="rounded-xl shadow-sm bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-[#004AAD]" />
                    Need More Help?
                  </CardTitle>
                  <CardDescription>
                    Can't find what you're looking for? Our support team is here to help
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-left">
                      <h3 className="font-semibold text-gray-900 mb-1">Submit a Support Ticket</h3>
                      <p className="text-sm text-gray-600">Get personalized help for your specific issue</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className="bg-[#004AAD] hover:bg-blue-700"
                        onClick={() => {
                          // Open email client to submit a support ticket
                          const ticketEmailUrl = 'mailto:support@fahampesa.com?subject=Support Ticket - FahamPesa Issue&body=Hello FahamPesa Support Team,%0D%0A%0D%0ATicket Details:%0D%0A- Issue Type: [Please specify]%0D%0A- Priority: [High/Medium/Low]%0D%0A- Description:%0D%0A%0D%0A[Please describe your issue in detail]%0D%0A%0D%0ASteps to reproduce:%0D%0A1. %0D%0A2. %0D%0A3. %0D%0A%0D%0AExpected behavior:%0D%0A%0D%0AActual behavior:%0D%0A%0D%0AAdditional information:%0D%0A- Browser: %0D%0A- Device: %0D%0A- Account ID: '
                          window.open(ticketEmailUrl, '_blank')
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Open Ticket
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          // Open WhatsApp to request a call back
                          const callRequestUrl = 'https://wa.me/254722628885?text=Hello%20FahamPesa%20Support%2C%0D%0A%0D%0AI%20would%20like%20to%20request%20a%20callback.%0D%0A%0D%0ABest%20time%20to%20call%3A%20%0D%0APreferred%20language%3A%20%0D%0AIssue%20summary%3A%20'
                          window.open(callRequestUrl, '_blank')
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Request Call
                      </Button>
                    </div>
                  </div>
                  
                  {/* Support Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#004AAD]">&lt; 2hrs</div>
                      <div className="text-xs text-gray-600">Average Response</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">98%</div>
                      <div className="text-xs text-gray-600">Satisfaction Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">24/7</div>
                      <div className="text-xs text-gray-600">Email Support</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Clear Cache Modal */}
          {showClearCacheModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-full">
                        <HardDrive className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Clear Cache</h3>
                        <p className="text-red-100 text-sm">Free up storage space</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white hover:bg-opacity-20"
                      onClick={() => setShowClearCacheModal(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {cacheClearing ? (
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <div className="w-20 h-20 mx-auto">
                          <div className="w-full h-full border-4 border-red-200 rounded-full">
                            <div className="w-full h-full border-4 border-red-500 rounded-full border-t-transparent animate-spin"></div>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Trash2 className="h-8 w-8 text-red-500 animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">Clearing Cache...</p>
                        <p className="text-sm text-gray-600">This may take a moment</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                          <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">Clear All Cache?</p>
                          <p className="text-sm text-gray-600">This will remove all cached data and temporary files.</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Browser Cache</span>
                          <span className="text-sm font-semibold text-red-600">{cacheValues.browserCache} MB</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Application Data</span>
                          <span className="text-sm font-semibold text-red-600">{cacheValues.appData} MB</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Temporary Files</span>
                          <span className="text-sm font-semibold text-red-600">{cacheValues.tempFiles} MB</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between items-center font-semibold">
                          <span className="text-gray-900">Total</span>
                          <span className="text-red-600">{cacheValues.browserCache + cacheValues.appData + cacheValues.tempFiles} MB</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowClearCacheModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1 bg-red-500 hover:bg-red-600"
                          onClick={handleClearCache}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear Cache
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Manual Sync Modal */}
          {showSyncModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
              >
                <div className="bg-gradient-to-r from-[#004AAD] to-[#0066CC] p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-full">
                        <RefreshCw className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Manual Sync</h3>
                        <p className="text-blue-100 text-sm">Desktop App Detection</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white hover:bg-opacity-20"
                      onClick={() => setShowSyncModal(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {syncChecking ? (
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <div className="w-24 h-24 mx-auto">
                          <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping"></div>
                          <div className="relative w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Monitor className="h-10 w-10 text-blue-500 animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">Scanning for Desktop Apps...</p>
                        <p className="text-sm text-gray-600">Looking for FahamPesa desktop clients</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                          <Monitor className="h-10 w-10 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">No Desktop Apps Found</h4>
                          <p className="text-sm text-gray-600">We couldn't find any FahamPesa desktop applications on your network.</p>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-900 mb-1">Desktop Sync Requirements:</p>
                            <ul className="text-blue-700 space-y-1 text-xs">
                              <li>• FahamPesa Desktop App (Windows/Mac/Linux)</li>
                              <li>• Same network connection</li>
                              <li>• Sync service enabled on desktop</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <Monitor className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">Windows</p>
                          <p className="text-xs text-red-500">Not Found</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <Laptop className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">Mac</p>
                          <p className="text-xs text-red-500">Not Found</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <SmartphoneIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">Linux</p>
                          <p className="text-xs text-red-500">Not Found</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setShowSyncModal(false)
                            setSyncChecking(false)
                          }}
                        >
                          Close
                        </Button>
                        <Button
                          className="flex-1 bg-[#004AAD] hover:bg-[#003875]"
                          onClick={() => {
                            setSyncChecking(true)
                            handleManualSync()
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Scan Again
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Backup Details Modal */}
          {showBackupDetailsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="bg-[#004AAD] p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-full">
                        <Cloud className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Quick Backup</h3>
                        <p className="text-blue-100 text-sm">Create instant backup</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white hover:bg-opacity-20"
                      onClick={() => setShowBackupDetailsModal(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <FolderOpen className="h-8 w-8 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">Ready to Create Backup</p>
                      <p className="text-sm text-gray-600">This will include all your business data</p>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-emerald-900">What's Included:</h4>
                    <div className="grid grid-cols-2 gap-1 text-xs text-emerald-700">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Products
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Inventory
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Sales
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Expenses
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Customers
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Settings
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowBackupDetailsModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-[#004AAD] hover:bg-[#003875]"
                      onClick={() => {
                        setShowBackupDetailsModal(false)
                        handleCreateBackup()
                      }}
                    >
                      <Cloud className="h-4 w-4 mr-2" />
                      Create Backup
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}