'use client'

import type { User } from 'firebase/auth'

const DEFAULT_API_BASE_URL = 'http://localhost:4000/api/v1'

export const BACKEND_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL

export class BackendApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'BackendApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function isBackendApiError(error: unknown): error is BackendApiError {
  return error instanceof BackendApiError
}

export interface BackendOnboardingStatus {
  completed: boolean
  skipped: boolean
  currentStep: number
  completedSteps: number[]
  skippedSteps: number[]
  hasOnboardingData: boolean
  hasBusiness: boolean
  businessAccountId: string | null
  status: 'not_started' | 'in_progress' | 'skipped' | 'completed' | string
  data: Record<string, unknown>
}

export interface BackendSession {
  auth: {
    firebaseUid: string
    email?: string
    phone?: string
    name?: string
    platformRole?: string
  }
  userId: string
  businessAccountId?: string | null
  role?: 'owner' | 'admin' | 'manager' | 'cashier' | string
  assignedBranchIds: string[]
  accountStatus?: string
  planTier?: string
  subscriptionStatus?: string
  subscriptionEndsAt?: string | null
  onboardingStatus: BackendOnboardingStatus
}

export interface OnboardingProgressPayload {
  currentStep?: number
  completedSteps?: number[]
  skippedSteps?: number[]
  data?: Record<string, unknown>
}

export interface CompleteBusinessOnboardingPayload {
  personalProfile?: {
    fullName?: string
    phoneNumber?: string
    phoneVerified?: boolean
  }
  companyProfile?: {
    legalCompanyName?: string
    registrationNumber?: string
  }
  business: {
    businessName: string
    businessType: string
    country: string
    currency: string
  }
  branch: {
    name: string
    location: {
      address: string
      city?: string
      region?: string
      country?: string
    }
    contact?: {
      phone?: string
      email?: string
      whatsapp?: string
    }
    branchCode?: string
    branchType?: 'MAIN' | 'BRANCH' | 'OUTLET' | 'WAREHOUSE' | 'KIOSK'
    currency?: string
  }
  staffInvitations?: Array<{
    email: string
    role: 'admin' | 'manager' | 'staff' | 'cashier'
  }>
}

interface ApiEnvelope<T> {
  data: T
}

interface ApiErrorEnvelope {
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
}

export async function request<T>(
  path: string,
  options: RequestInit & { user?: User | null } = {}
): Promise<T> {
  const { user, headers, ...requestOptions } = options
  const token = user ? await user.getIdToken() : null

  const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      ...(requestOptions.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    }
  })

  const body = await response.json().catch(() => null) as ApiEnvelope<T> | ApiErrorEnvelope | null

  if (!response.ok) {
    const error = (body as ApiErrorEnvelope | null)?.error
    throw new BackendApiError(
      response.status,
      error?.code || `http_${response.status}`,
      error?.message || 'Request failed',
      error?.details
    )
  }

  if (body && typeof body === 'object' && 'data' in body) {
    return (body as ApiEnvelope<T>).data
  }

  return body as T
}

export async function requestText(
  path: string,
  options: RequestInit & { user?: User | null } = {}
): Promise<string> {
  const { user, headers, ...requestOptions } = options
  const token = user ? await user.getIdToken() : null

  const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    }
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as ApiErrorEnvelope | null
    const error = body?.error
    throw new BackendApiError(
      response.status,
      error?.code || `http_${response.status}`,
      error?.message || 'Request failed',
      error?.details
    )
  }

  return response.text()
}

export async function phoneExists(phone: string) {
  const result = await request<{ exists: boolean }>(
    `/auth/phone-exists?phone=${encodeURIComponent(phone)}`
  )
  return result.exists
}

export function getMe(user: User) {
  return request<BackendSession>('/me', { user })
}

export function getOnboardingStatus(user: User) {
  return request<BackendOnboardingStatus>('/onboarding/status', { user })
}

export function saveOnboardingProgress(user: User, payload: OnboardingProgressPayload) {
  return request<BackendOnboardingStatus>('/onboarding/progress', {
    user,
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export function skipOnboarding(user: User, payload: OnboardingProgressPayload = {}) {
  return request<BackendOnboardingStatus>('/onboarding/skip', {
    user,
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function completeBusinessOnboarding(
  user: User,
  payload: CompleteBusinessOnboardingPayload
) {
  return request('/onboarding/business', {
    user,
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
