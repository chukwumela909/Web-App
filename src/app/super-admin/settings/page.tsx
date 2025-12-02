'use client'

import React, { useState, useEffect } from 'react'
import AdminRoute from '@/components/auth/AdminRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Bell,
  Users,
  Shield,
  Globe,
  Database,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Clock,
  Lock,
  UserX
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface PlatformSettings {
  platformName: string
  timezone: string
  defaultLanguage: string
  dataRetentionDays: number
  backupFrequency: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Settings states
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    platformName: '',
    timezone: '',
    defaultLanguage: '',
    dataRetentionDays: 365,
    backupFrequency: ''
  })

  // Load settings on component mount
  useEffect(() => {
    loadPlatformSettings()
  }, [])

  const loadPlatformSettings = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/settings/platform')
      const data = await response.json()
      
      if (data.success) {
        setPlatformSettings(data.settings)
      } else {
        throw new Error(data.error || 'Failed to load settings')
      }
      
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load platform settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const savePlatformSettings = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/admin/settings/platform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...platformSettings,
          updatedBy: user?.email || 'Unknown'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Platform settings saved successfully'
        })
        setPlatformSettings(data.settings)
      } else {
        throw new Error(data.error || 'Failed to save settings')
      }
      
    } catch (error) {
      console.error('Error saving platform settings:', error)
      toast({
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setPlatformSettings({
      platformName: 'FahamPesa System',
      timezone: 'Africa/Nairobi (EAT)',
      defaultLanguage: 'English',
      dataRetentionDays: 365,
      backupFrequency: 'Daily'
    })
  }


  const timezoneOptions = [
    'Africa/Nairobi (EAT)',
    'UTC',
    'America/New_York (EST)',
    'Europe/London (GMT)',
    'Asia/Dubai (GST)',
    'Asia/Kolkata (IST)',
    'Asia/Shanghai (CST)'
  ]

  const languageOptions = [
    'English',
    'Kiswahili',
    'Arabic',
    'French'
  ]

  const backupFrequencyOptions = [
    'Hourly',
    'Daily', 
    'Weekly',
    'Monthly'
  ]

  if (loading) {
    return (
      <AdminRoute requiredPermission="settings">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading settings...</p>
          </div>
        </div>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute requiredPermission="settings">
      <div className="space-y-6 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Configure platform settings, integrations, and admin access
            </p>
          </div>
          <Button onClick={loadPlatformSettings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="notifications">Notification Preferences</TabsTrigger>
            <TabsTrigger value="security">Security & 2FA</TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    General Platform Settings
                  </CardTitle>
                  <CardDescription>
                    Configure basic platform settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Platform Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Platform Name</label>
                    <Input
                      value={platformSettings.platformName}
                      onChange={(e) => setPlatformSettings({
                        ...platformSettings,
                        platformName: e.target.value
                      })}
                      placeholder="Enter platform name"
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      This name will appear throughout the admin interface
                    </p>
                  </div>

                  {/* Timezone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timezone</label>
                    <select
                      value={platformSettings.timezone}
                      onChange={(e) => setPlatformSettings({
                        ...platformSettings,
                        timezone: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={saving}
                    >
                      <option value="">Select timezone...</option>
                      {timezoneOptions.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Default timezone for the platform
                    </p>
                  </div>

                  {/* Default Language */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Language</label>
                    <select
                      value={platformSettings.defaultLanguage}
                      onChange={(e) => setPlatformSettings({
                        ...platformSettings,
                        defaultLanguage: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={saving}
                    >
                      <option value="">Select language...</option>
                      {languageOptions.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Default language for new users
                    </p>
                  </div>

                  {/* Data Retention Days */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Retention (Days)</label>
                    <Input
                      type="number"
                      min="1"
                      max="3650"
                      value={platformSettings.dataRetentionDays}
                      onChange={(e) => setPlatformSettings({
                        ...platformSettings,
                        dataRetentionDays: parseInt(e.target.value) || 365
                      })}
                      placeholder="365"
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of days to retain user data (1-3650 days)
                    </p>
                  </div>

                  {/* Backup Frequency */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Backup Frequency</label>
                    <select
                      value={platformSettings.backupFrequency}
                      onChange={(e) => setPlatformSettings({
                        ...platformSettings,
                        backupFrequency: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={saving}
                    >
                      <option value="">Select frequency...</option>
                      {backupFrequencyOptions.map((freq) => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      How often to create data backups
                    </p>
                  </div>


                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={savePlatformSettings} 
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={resetToDefaults}
                      disabled={saving}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notification Preferences Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure when to receive email notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'systemAlerts', label: 'System Alerts', description: 'Critical system issues and errors' },
                    { key: 'securityEvents', label: 'Security Events', description: 'Login attempts and security issues' },
                    { key: 'dailyReports', label: 'Daily Reports', description: 'Daily summary of platform activity' },
                    { key: 'weeklyReports', label: 'Weekly Reports', description: 'Weekly analytics and insights' }
                  ].map((notification) => (
                    <div key={notification.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">{notification.label}</h4>
                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          defaultChecked={notification.key !== 'weeklyReports'}
                          disabled={saving}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alert Thresholds
                  </CardTitle>
                  <CardDescription>
                    Set thresholds for automatic alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">High User Activity Threshold</label>
                      <Input
                        type="number"
                        min="1"
                        defaultValue="1000"
                        placeholder="1000"
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert when daily active users exceed this number
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Error Rate Threshold (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        defaultValue="5.0"
                        placeholder="5.0"
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert when error rate exceeds this percentage
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Response Time Threshold (ms)</label>
                      <Input
                        type="number"
                        min="1"
                        defaultValue="2000"
                        placeholder="2000"
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert when average response time exceeds this value
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Storage Usage Threshold (%)</label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        defaultValue="85"
                        placeholder="85"
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert when storage usage exceeds this percentage
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Notification Schedule
                  </CardTitle>
                  <CardDescription>
                    Configure when notifications are sent
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Daily Report Time</label>
                      <Input
                        type="time"
                        defaultValue="09:00"
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Time to send daily reports
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Weekly Report Day</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        defaultValue="monday"
                        disabled={saving}
                      >
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Day of the week to send weekly reports
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quiet Hours</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        defaultValue="22:00"
                        disabled={saving}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        type="time"
                        defaultValue="08:00"
                        disabled={saving}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      No non-critical notifications will be sent during these hours
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>


          {/* Security & 2FA Tab */}
          <TabsContent value="security" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Password Policy
                  </CardTitle>
                  <CardDescription>
                    Configure password requirements for all users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Minimum Password Length</label>
                      <Input
                        type="number"
                        min="6"
                        max="50"
                        defaultValue="8"
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum number of characters required
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password Expiry (Days)</label>
                      <Input
                        type="number"
                        min="0"
                        max="365"
                        defaultValue="90"
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Set to 0 for no expiry
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Password Requirements</h4>
                    {[
                      { key: 'uppercase', label: 'Require uppercase letters (A-Z)' },
                      { key: 'lowercase', label: 'Require lowercase letters (a-z)' },
                      { key: 'numbers', label: 'Require numbers (0-9)' },
                      { key: 'symbols', label: 'Require special characters (!@#$...)' },
                      { key: 'noCommon', label: 'Prevent common passwords' }
                    ].map((requirement) => (
                      <div key={requirement.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={requirement.key}
                          defaultChecked={requirement.key !== 'symbols'}
                          disabled={saving}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={requirement.key} className="text-sm">
                          {requirement.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription>
                    Configure 2FA settings for enhanced security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Require 2FA for Admin Users</h4>
                      <p className="text-xs text-muted-foreground">
                        Force all admin users to enable two-factor authentication
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked={true}
                        disabled={saving}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Allow SMS 2FA</h4>
                      <p className="text-xs text-muted-foreground">
                        Enable SMS-based two-factor authentication
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked={true}
                        disabled={saving}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Allow Authenticator Apps</h4>
                      <p className="text-xs text-muted-foreground">
                        Enable TOTP authenticator apps (Google Authenticator, Authy, etc.)
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked={true}
                        disabled={saving}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">2FA Grace Period (Hours)</label>
                    <Input
                      type="number"
                      min="0"
                      max="168"
                      defaultValue="24"
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Time users have to set up 2FA after it becomes required (0-168 hours)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserX className="h-5 w-5" />
                    Session Management
                  </CardTitle>
                  <CardDescription>
                    Configure user session and login policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Session Timeout (Minutes)</label>
                      <Input
                        type="number"
                        min="5"
                        max="1440"
                        defaultValue="60"
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Auto-logout after inactivity (5-1440 minutes)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Failed Login Attempts</label>
                      <Input
                        type="number"
                        min="3"
                        max="20"
                        defaultValue="5"
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Account lockout after failed attempts
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Account Lockout Duration (Minutes)</label>
                      <Input
                        type="number"
                        min="5"
                        max="1440"
                        defaultValue="30"
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        How long accounts remain locked
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Concurrent Sessions</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        defaultValue="3"
                        disabled={saving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum simultaneous login sessions per user
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Force Logout on Password Change</h4>
                      <p className="text-xs text-muted-foreground">
                        Automatically log out all sessions when password is changed
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked={true}
                        disabled={saving}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

        </Tabs>
      </div>
    </AdminRoute>
  )
}