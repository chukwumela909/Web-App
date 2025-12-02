'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Key, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Smartphone,
  FileText,
  ArrowLeft
} from 'lucide-react'
import { motion } from 'framer-motion'
import TwoFactorAuthService from '@/lib/two-factor-auth-service'
import { useToast } from '@/hooks/use-toast'

interface TwoFactorVerificationProps {
  userId: string
  userEmail: string
  onVerificationSuccess: () => void
  onVerificationCancel: () => void
  className?: string
}

export default function TwoFactorVerification({ 
  userId, 
  userEmail, 
  onVerificationSuccess, 
  onVerificationCancel,
  className = ''
}: TwoFactorVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)
  const { toast } = useToast()

  const maxAttempts = 5
  const lockoutTime = 300 // 5 minutes in seconds

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            setAttempts(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [remainingTime])

  const handleVerification = async () => {
    if (!verificationCode || (useBackupCode ? verificationCode.length !== 8 : verificationCode.length !== 6)) {
      toast({
        title: 'Invalid Code',
        description: `Please enter a ${useBackupCode ? '8-digit backup code' : '6-digit verification code'}`,
        variant: 'destructive',
      })
      return
    }

    if (attempts >= maxAttempts) {
      toast({
        title: 'Too Many Attempts',
        description: `Please wait ${Math.ceil(remainingTime / 60)} minutes before trying again`,
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      
      // Get client IP and user agent for logging
      const ipAddress = await fetch('/api/get-client-ip').then(res => res.json()).catch(() => ({ ip: 'unknown' }))
      const userAgent = navigator.userAgent

      const result = await TwoFactorAuthService.verifyTwoFactor(
        userId, 
        verificationCode, 
        ipAddress.ip || 'unknown', 
        userAgent
      )

      if (result.success) {
        toast({
          title: 'Verification Successful',
          description: `Verified using ${result.method === 'backup_code' ? 'backup code' : 'authenticator app'}`,
          variant: 'success',
        })
        onVerificationSuccess()
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        
        if (newAttempts >= maxAttempts) {
          setRemainingTime(lockoutTime)
          toast({
            title: 'Account Temporarily Locked',
            description: `Too many failed attempts. Please wait ${lockoutTime / 60} minutes.`,
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Verification Failed',
            description: `${result.error}. ${maxAttempts - newAttempts} attempts remaining.`,
            variant: 'destructive',
          })
        }
        
        setVerificationCode('')
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error)
      toast({
        title: 'Error',
        description: 'Failed to verify two-factor authentication',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && remainingTime === 0) {
      handleVerification()
    }
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const isLocked = remainingTime > 0

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter the verification code to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Signing in as</p>
              <p className="font-medium">{userEmail}</p>
            </div>

            {/* Lockout Warning */}
            {isLocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Account Temporarily Locked</p>
                    <p className="text-sm text-red-600">
                      Too many failed attempts. Try again in {formatTime(remainingTime)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Attempts Warning */}
            {!isLocked && attempts > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    {maxAttempts - attempts} attempts remaining
                  </p>
                </div>
              </motion.div>
            )}

            {/* Verification Method Toggle */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant={!useBackupCode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setUseBackupCode(false)
                  setVerificationCode('')
                }}
                disabled={loading || isLocked}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Authenticator App
              </Button>
              <Button
                variant={useBackupCode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setUseBackupCode(true)
                  setVerificationCode('')
                }}
                disabled={loading || isLocked}
              >
                <FileText className="h-4 w-4 mr-2" />
                Backup Code
              </Button>
            </div>

            {/* Code Input */}
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  {useBackupCode 
                    ? 'Enter one of your 8-digit backup codes'
                    : 'Enter the 6-digit code from your authenticator app'
                  }
                </p>
                
                <Input
                  type="text"
                  placeholder={useBackupCode ? "12345678" : "000000"}
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    const maxLength = useBackupCode ? 8 : 6
                    setVerificationCode(value.slice(0, maxLength))
                  }}
                  onKeyPress={handleKeyPress}
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={useBackupCode ? 8 : 6}
                  disabled={loading || isLocked}
                  autoFocus
                />
              </div>

              {!useBackupCode && (
                <div className="text-center text-xs text-muted-foreground">
                  <p>Open your authenticator app and enter the current code</p>
                  <p>Codes refresh every 30 seconds</p>
                </div>
              )}

              {useBackupCode && (
                <div className="text-center text-xs text-muted-foreground">
                  <p>Each backup code can only be used once</p>
                  <p>Generate new codes after using all of them</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleVerification}
                disabled={
                  loading || 
                  isLocked || 
                  !verificationCode || 
                  (useBackupCode ? verificationCode.length !== 8 : verificationCode.length !== 6)
                }
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify & Continue
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={onVerificationCancel}
                disabled={loading}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Having trouble? Contact your system administrator for assistance.
              </p>
              
              {!useBackupCode && (
                <p className="text-xs text-muted-foreground">
                  Lost your device? Use a backup code instead.
                </p>
              )}
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 pt-4 border-t">
              <Key className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                Secured with 2FA
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
