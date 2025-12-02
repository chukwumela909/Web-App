import { 
  doc, 
  updateDoc, 
  getDoc, 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp,
  setDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
// Note: crypto import removed as we'll implement TOTP differently for browser compatibility

export interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
  manualEntryKey: string
}

export interface TwoFactorStatus {
  enabled: boolean
  setupAt?: Date
  lastUsed?: Date
  backupCodesRemaining: number
  deviceName?: string
}

export interface TwoFactorAttempt {
  id: string
  userId: string
  userEmail: string
  success: boolean
  method: 'totp' | 'backup_code' | 'recovery'
  ipAddress: string
  userAgent: string
  timestamp: Date
  failureReason?: string
}

class TwoFactorAuthService {
  private static instance: TwoFactorAuthService

  static getInstance(): TwoFactorAuthService {
    if (!TwoFactorAuthService.instance) {
      TwoFactorAuthService.instance = new TwoFactorAuthService()
    }
    return TwoFactorAuthService.instance
  }

  // Base32 decoder for browser compatibility
  private base32Decode(encoded: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let bits = 0
    let value = 0
    let output = []

    for (let i = 0; i < encoded.length; i++) {
      const char = encoded[i].toUpperCase()
      if (char === '=') break
      
      const index = alphabet.indexOf(char)
      if (index === -1) continue

      value = (value << 5) | index
      bits += 5

      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255)
        bits -= 8
      }
    }

    return new Uint8Array(output)
  }

  // HMAC-SHA1 implementation for browser
  private async hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, message)
    return new Uint8Array(signature)
  }

  // Convert number to 8-byte array (big-endian)
  private numberToBytes(num: number): Uint8Array {
    const bytes = new Uint8Array(8)
    for (let i = 7; i >= 0; i--) {
      bytes[i] = num & 0xff
      num = Math.floor(num / 256)
    }
    return bytes
  }

  // Generate a new 2FA secret
  private generateSecret(): string {
    // Generate a 32-character base32 secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)]
    }
    return secret
  }

  // Generate backup codes
  private generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      // Generate 8-digit backup codes
      const code = Math.floor(10000000 + Math.random() * 90000000).toString()
      codes.push(code)
    }
    return codes
  }

  // Generate TOTP token (browser-compatible implementation)
  private async generateTOTP(secret: string, timeStep: number = 30): Promise<string> {
    const time = Math.floor(Date.now() / 1000 / timeStep)
    
    try {
      const key = this.base32Decode(secret)
      const timeBytes = this.numberToBytes(time)
      const hmac = await this.hmacSha1(key, timeBytes)
      
      const offset = hmac[hmac.length - 1] & 0x0f
      const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
      ) % 1000000
      
      return code.toString().padStart(6, '0')
    } catch (error) {
      console.error('Error generating TOTP:', error)
      throw new Error('Failed to generate TOTP code')
    }
  }

  // Verify TOTP token
  private async verifyTOTP(secret: string, token: string, window: number = 1): Promise<boolean> {
    const timeStep = 30
    const currentTime = Math.floor(Date.now() / 1000 / timeStep)
    
    try {
      const key = this.base32Decode(secret)
      
      // Check current time and ±window time steps for clock drift
      for (let i = -window; i <= window; i++) {
        const time = currentTime + i
        const timeBytes = this.numberToBytes(time)
        const hmac = await this.hmacSha1(key, timeBytes)
        
        const offset = hmac[hmac.length - 1] & 0x0f
        const code = (
          ((hmac[offset] & 0x7f) << 24) |
          ((hmac[offset + 1] & 0xff) << 16) |
          ((hmac[offset + 2] & 0xff) << 8) |
          (hmac[offset + 3] & 0xff)
        ) % 1000000
        
        if (code.toString().padStart(6, '0') === token) {
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('Error verifying TOTP:', error)
      return false
    }
  }

  // Setup 2FA for a user
  async setupTwoFactor(userId: string, userEmail: string, deviceName?: string): Promise<TwoFactorSetup> {
    try {
      const secret = this.generateSecret()
      const backupCodes = this.generateBackupCodes()
      
      // Generate QR code URL for authenticator apps
      const issuer = 'FahamPesa'
      const accountName = userEmail
      const qrCodeUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
      
      // Check if user document exists, create if it doesn't
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      const twoFactorSetup = {
        secret,
        backupCodes,
        setupAt: Timestamp.now(),
        enabled: false,
        deviceName: deviceName || 'Unknown Device',
        qrCodeGenerated: true
      }
      
      if (!userDoc.exists()) {
        // Create new user document with 2FA setup
        await setDoc(userRef, {
          email: userEmail,
          createdAt: Timestamp.now(),
          twoFactorSetup
        })
      } else {
        // Update existing user document with 2FA setup
        await updateDoc(userRef, {
          twoFactorSetup
        })
      }

      return {
        secret,
        qrCodeUrl,
        backupCodes,
        manualEntryKey: secret.match(/.{1,4}/g)?.join(' ') || secret
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      throw new Error('Failed to setup two-factor authentication')
    }
  }

  // Enable 2FA after verification
  async enableTwoFactor(userId: string, verificationCode: string): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }

      const userData = userDoc.data()
      const twoFactorSetup = userData.twoFactorSetup

      if (!twoFactorSetup || !twoFactorSetup.secret) {
        throw new Error('2FA setup not found')
      }

      // Verify the code
      const isValid = await this.verifyTOTP(twoFactorSetup.secret, verificationCode)
      
      if (!isValid) {
        await this.logTwoFactorAttempt(userId, userData.email, false, 'totp', '', '', 'Invalid verification code')
        return false
      }

      // Enable 2FA
      await updateDoc(userRef, {
        'twoFactorSetup.enabled': true,
        'twoFactorSetup.enabledAt': Timestamp.now(),
        'twoFactorSetup.lastUsed': Timestamp.now()
      })

      await this.logTwoFactorAttempt(userId, userData.email, true, 'totp', 'unknown', 'unknown', 'Setup completed')
      return true
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      throw error
    }
  }

  // Verify 2FA code during login
  async verifyTwoFactor(
    userId: string, 
    code: string, 
    ipAddress: string, 
    userAgent: string
  ): Promise<{ success: boolean; method?: 'totp' | 'backup_code'; error?: string }> {
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        return { success: false, error: 'User not found' }
      }

      const userData = userDoc.data()
      const twoFactorSetup = userData.twoFactorSetup

      if (!twoFactorSetup || !twoFactorSetup.enabled) {
        return { success: false, error: '2FA not enabled' }
      }

      // Try TOTP verification first
      if (await this.verifyTOTP(twoFactorSetup.secret, code)) {
        await updateDoc(userRef, {
          'twoFactorSetup.lastUsed': Timestamp.now()
        })
        
        await this.logTwoFactorAttempt(userId, userData.email, true, 'totp', ipAddress, userAgent, 'Login successful')
        return { success: true, method: 'totp' }
      }

      // Try backup code verification
      const backupCodes = twoFactorSetup.backupCodes || []
      const codeIndex = backupCodes.indexOf(code)
      
      if (codeIndex !== -1) {
        // Remove used backup code
        const updatedBackupCodes = [...backupCodes]
        updatedBackupCodes.splice(codeIndex, 1)
        
        await updateDoc(userRef, {
          'twoFactorSetup.backupCodes': updatedBackupCodes,
          'twoFactorSetup.lastUsed': Timestamp.now()
        })
        
        await this.logTwoFactorAttempt(userId, userData.email, true, 'backup_code', ipAddress, userAgent, 'Backup code used')
        return { success: true, method: 'backup_code' }
      }

      // Log failed attempt
      await this.logTwoFactorAttempt(userId, userData.email, false, 'totp', ipAddress, userAgent, 'Invalid code')
      return { success: false, error: 'Invalid verification code' }
    } catch (error) {
      console.error('Error verifying 2FA:', error)
      return { success: false, error: 'Verification failed' }
    }
  }

  // Get 2FA status for a user
  async getTwoFactorStatus(userId: string): Promise<TwoFactorStatus> {
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        return { enabled: false, backupCodesRemaining: 0 }
      }

      const userData = userDoc.data()
      const twoFactorSetup = userData.twoFactorSetup

      if (!twoFactorSetup) {
        return { enabled: false, backupCodesRemaining: 0 }
      }

      return {
        enabled: twoFactorSetup.enabled || false,
        setupAt: twoFactorSetup.setupAt?.toDate(),
        lastUsed: twoFactorSetup.lastUsed?.toDate(),
        backupCodesRemaining: (twoFactorSetup.backupCodes || []).length,
        deviceName: twoFactorSetup.deviceName
      }
    } catch (error) {
      console.error('Error getting 2FA status:', error)
      return { enabled: false, backupCodesRemaining: 0 }
    }
  }

  // Disable 2FA
  async disableTwoFactor(userId: string, verificationCode: string): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }

      const userData = userDoc.data()
      const twoFactorSetup = userData.twoFactorSetup

      if (!twoFactorSetup || !twoFactorSetup.enabled) {
        throw new Error('2FA not enabled')
      }

      // Verify current code before disabling
      const isValid = (await this.verifyTOTP(twoFactorSetup.secret, verificationCode)) ||
                     (twoFactorSetup.backupCodes || []).includes(verificationCode)
      
      if (!isValid) {
        await this.logTwoFactorAttempt(userId, userData.email, false, 'totp', 'unknown', 'unknown', 'Invalid code for disable')
        return false
      }

      // Disable 2FA
      await updateDoc(userRef, {
        twoFactorSetup: {
          enabled: false,
          disabledAt: Timestamp.now()
        }
      })

      await this.logTwoFactorAttempt(userId, userData.email, true, 'totp', 'unknown', 'unknown', 'Disabled 2FA')
      return true
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      throw error
    }
  }

  // Generate new backup codes
  async generateNewBackupCodes(userId: string, verificationCode: string): Promise<string[]> {
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }

      const userData = userDoc.data()
      const twoFactorSetup = userData.twoFactorSetup

      if (!twoFactorSetup || !twoFactorSetup.enabled) {
        throw new Error('2FA not enabled')
      }

      // Verify current code
      const isValid = await this.verifyTOTP(twoFactorSetup.secret, verificationCode)
      
      if (!isValid) {
        throw new Error('Invalid verification code')
      }

      // Generate new backup codes
      const newBackupCodes = this.generateBackupCodes()
      
      await updateDoc(userRef, {
        'twoFactorSetup.backupCodes': newBackupCodes,
        'twoFactorSetup.backupCodesGeneratedAt': Timestamp.now()
      })

      return newBackupCodes
    } catch (error) {
      console.error('Error generating backup codes:', error)
      throw error
    }
  }

  // Log 2FA attempt
  private async logTwoFactorAttempt(
    userId: string,
    userEmail: string,
    success: boolean,
    method: 'totp' | 'backup_code' | 'recovery',
    ipAddress: string,
    userAgent: string,
    failureReason?: string
  ): Promise<void> {
    try {
      const attemptData: any = {
        userId,
        userEmail,
        success,
        method,
        ipAddress,
        userAgent,
        timestamp: Timestamp.now()
      }
      
      // Only include failureReason if it's defined
      if (failureReason !== undefined && failureReason !== null) {
        attemptData.failureReason = failureReason
      }
      
      await addDoc(collection(db, 'two_factor_attempts'), attemptData)
    } catch (error) {
      console.error('Error logging 2FA attempt:', error)
    }
  }

  // Get 2FA attempt history
  async getTwoFactorAttempts(userId: string, limitCount: number = 50): Promise<TwoFactorAttempt[]> {
    try {
      const attemptsRef = collection(db, 'two_factor_attempts')
      const attemptsQuery = query(
        attemptsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )
      
      const attemptsSnapshot = await getDocs(attemptsQuery)
      const attempts: TwoFactorAttempt[] = []
      
      attemptsSnapshot.forEach(doc => {
        const data = doc.data()
        attempts.push({
          id: doc.id,
          userId: data.userId,
          userEmail: data.userEmail,
          success: data.success,
          method: data.method,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: data.timestamp?.toDate() || new Date(),
          failureReason: data.failureReason
        })
      })
      
      return attempts
    } catch (error) {
      console.error('Error getting 2FA attempts:', error)
      return []
    }
  }

  // Check if user requires 2FA (for super admins)
  async requiresTwoFactor(userId: string): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        return false
      }

      const userData = userDoc.data()
      
      // Require 2FA for super admins and admins
      const role = userData.role || userData.userType || 'user'
      return role === 'super_admin' || role === 'admin'
    } catch (error) {
      console.error('Error checking 2FA requirement:', error)
      return false
    }
  }

  // Emergency disable 2FA (for admin use)
  async emergencyDisableTwoFactor(userId: string, adminUserId: string): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId)
      
      // Log the emergency disable
      await addDoc(collection(db, 'admin_actions'), {
        action: 'emergency_disable_2fa',
        targetUserId: userId,
        adminUserId,
        timestamp: Timestamp.now(),
        reason: 'Emergency 2FA disable'
      })

      // Disable 2FA
      await updateDoc(userRef, {
        'twoFactorSetup.enabled': false,
        'twoFactorSetup.emergencyDisabledAt': Timestamp.now(),
        'twoFactorSetup.emergencyDisabledBy': adminUserId
      })

      return true
    } catch (error) {
      console.error('Error emergency disabling 2FA:', error)
      return false
    }
  }
}

export default TwoFactorAuthService.getInstance()
