'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert-dialog'
import { 
  Shield, 
  Smartphone, 
  Copy, 
  Check, 
  AlertTriangle, 
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  QrCode,
  Key,
  Lock,
  Unlock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import TwoFactorAuthService, { TwoFactorSetup, TwoFactorStatus } from '@/lib/two-factor-auth-service'
import { useToast } from '@/hooks/use-toast'

interface TwoFactorSetupProps {
  userId: string
  userEmail: string
  onSetupComplete?: () => void
  onSetupCancel?: () => void
}

export default function TwoFactorSetupComponent({ 
  userId, 
  userEmail, 
  onSetupComplete, 
  onSetupCancel 
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'backup'>('status')
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null)
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedBackup, setCopiedBackup] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadTwoFactorStatus()
  }, [userId])

  const loadTwoFactorStatus = async () => {
    try {
      setLoading(true)
      const twoFactorStatus = await TwoFactorAuthService.getTwoFactorStatus(userId)
      setStatus(twoFactorStatus)
    } catch (error) {
      console.error('Error loading 2FA status:', error)
      toast({
        title: 'Error',
        description: 'Failed to load two-factor authentication status',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetupTwoFactor = async () => {
    try {
      setLoading(true)
      const setup = await TwoFactorAuthService.setupTwoFactor(userId, userEmail)
      setSetupData(setup)
      setStep('setup')
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      toast({
        title: 'Error',
        description: 'Failed to setup two-factor authentication',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit verification code',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      const success = await TwoFactorAuthService.enableTwoFactor(userId, verificationCode)
      
      if (success) {
        setStep('backup')
        toast({
          title: 'Success',
          description: 'Two-factor authentication has been enabled',
          variant: 'success',
        })
      } else {
        toast({
          title: 'Invalid Code',
          description: 'The verification code is incorrect. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error verifying 2FA setup:', error)
      toast({
        title: 'Error',
        description: 'Failed to verify two-factor authentication',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDisableTwoFactor = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit verification code to disable 2FA',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      const success = await TwoFactorAuthService.disableTwoFactor(userId, verificationCode)
      
      if (success) {
        await loadTwoFactorStatus()
        setVerificationCode('')
        toast({
          title: 'Disabled',
          description: 'Two-factor authentication has been disabled',
          variant: 'success',
        })
      } else {
        toast({
          title: 'Invalid Code',
          description: 'The verification code is incorrect. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      toast({
        title: 'Error',
        description: 'Failed to disable two-factor authentication',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateNewBackupCodes = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit verification code to generate new backup codes',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      const newCodes = await TwoFactorAuthService.generateNewBackupCodes(userId, verificationCode)
      
      if (setupData) {
        setSetupData({ ...setupData, backupCodes: newCodes })
      }
      
      setVerificationCode('')
      toast({
        title: 'Success',
        description: 'New backup codes have been generated',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error generating backup codes:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate new backup codes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'secret' | 'backup', index?: number) => {
    try {
      await navigator.clipboard.writeText(text)
      
      if (type === 'secret') {
        setCopiedSecret(true)
        setTimeout(() => setCopiedSecret(false), 2000)
      } else if (type === 'backup' && index !== undefined) {
        setCopiedBackup(index)
        setTimeout(() => setCopiedBackup(null), 2000)
      }
      
      toast({
        title: 'Copied',
        description: `${type === 'secret' ? 'Secret key' : 'Backup code'} copied to clipboard`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  const downloadBackupCodes = () => {
    if (!setupData) return
    
    const content = `FahamPesa Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}
Email: ${userEmail}

IMPORTANT: Store these codes in a safe place. Each code can only be used once.

${setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Instructions:
- Use these codes if you lose access to your authenticator app
- Each code can only be used once
- Generate new codes if you use all of them
- Keep these codes secure and private`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fahampesa-2fa-backup-codes-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading && !status) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading two-factor authentication status...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <AnimatePresence mode="wait">
        {step === 'status' && (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your super admin account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {status?.enabled ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">2FA Enabled</p>
                          <p className="text-sm text-green-600">
                            Your account is protected with two-factor authentication
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Setup Date:</span>
                        <div className="font-medium">
                          {status.setupAt ? status.setupAt.toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Used:</span>
                        <div className="font-medium">
                          {status.lastUsed ? status.lastUsed.toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Backup Codes:</span>
                        <div className="font-medium">{status.backupCodesRemaining} remaining</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Device:</span>
                        <div className="font-medium">{status.deviceName || 'Unknown'}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          placeholder="Enter 6-digit code to manage 2FA"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="flex-1"
                          maxLength={6}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleGenerateNewBackupCodes}
                          disabled={loading || verificationCode.length !== 6}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Generate New Backup Codes
                        </Button>
                        
                        <Button
                          variant="destructive"
                          onClick={handleDisableTwoFactor}
                          disabled={loading || verificationCode.length !== 6}
                        >
                          <Unlock className="h-4 w-4 mr-2" />
                          Disable 2FA
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-yellow-800">2FA Not Enabled</p>
                          <p className="text-sm text-yellow-600">
                            Your super admin account requires two-factor authentication
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                        Required
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Why enable 2FA?</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Protects against unauthorized access
                        </li>
                        <li className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Required for super admin privileges
                        </li>
                        <li className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Works with any authenticator app
                        </li>
                      </ul>
                    </div>

                    <Button onClick={handleSetupTwoFactor} disabled={loading} className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      Setup Two-Factor Authentication
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'setup' && setupData && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Setup Authenticator App
                </CardTitle>
                <CardDescription>
                  Scan the QR code or enter the secret key manually
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">QR Code</p>
                    <div className="w-48 h-48 bg-white border-2 border-dashed border-muted-foreground mx-auto rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <QrCode className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">QR Code would appear here</p>
                        <p className="text-xs text-muted-foreground">Use your authenticator app to scan</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-left space-y-3">
                    <p className="text-sm font-medium">Manual Entry Key:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                        {setupData.manualEntryKey}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(setupData.secret, 'secret')}
                      >
                        {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Popular Authenticator Apps:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 border rounded">Google Authenticator</div>
                    <div className="p-2 border rounded">Microsoft Authenticator</div>
                    <div className="p-2 border rounded">Authy</div>
                    <div className="p-2 border rounded">1Password</div>
                  </div>
                </div>

                <Button onClick={() => setStep('verify')} className="w-full">
                  Continue to Verification
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Verify Setup
                </CardTitle>
                <CardDescription>
                  Enter the 6-digit code from your authenticator app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                  />
                  
                  <p className="text-sm text-muted-foreground text-center">
                    Open your authenticator app and enter the 6-digit code for FahamPesa
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep('setup')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleVerifySetup}
                    disabled={loading || verificationCode.length !== 6}
                    className="flex-1"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                    Verify & Enable
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'backup' && setupData && (
          <motion.div
            key="backup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Save Backup Codes
                </CardTitle>
                <CardDescription>
                  Store these codes safely. You'll need them if you lose access to your authenticator app.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 mb-1">Important:</p>
                      <ul className="text-yellow-700 space-y-1">
                        <li>• Each code can only be used once</li>
                        <li>• Store them in a secure location</li>
                        <li>• Don't share these codes with anyone</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Backup Codes</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBackupCodes(!showBackupCodes)}
                    >
                      {showBackupCodes ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showBackupCodes ? 'Hide' : 'Show'} Codes
                    </Button>
                  </div>

                  {showBackupCodes && (
                    <div className="grid grid-cols-2 gap-2">
                      {setupData.backupCodes.map((code, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <code className="flex-1 text-sm font-mono">{code}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(code, 'backup', index)}
                          >
                            {copiedBackup === index ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Codes
                  </Button>
                  <Button 
                    onClick={() => {
                      setStep('status')
                      loadTwoFactorStatus()
                      onSetupComplete?.()
                    }} 
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Complete Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
