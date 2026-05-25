'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  clearStoredBranchId,
  getBackendBranches,
  getStoredBranchId,
  setStoredBranchId
} from '@/lib/backend-business-api'
import type { Branch } from '@/lib/branches-types'

interface BranchContextType {
  branches: Branch[]
  selectedBranchId: string
  selectedBranch: Branch | null
  loading: boolean
  error: string | null
  setSelectedBranchId: (branchId: string) => void
  refreshBranches: () => Promise<void>
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

export function useBranch() {
  const context = useContext(BranchContext)
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider')
  }
  return context
}

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user, backendSessionLoading } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchIdState, setSelectedBranchIdState] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshBranches = async () => {
    if (!user) {
      setBranches([])
      setSelectedBranchIdState('')
      clearStoredBranchId()
      return
    }

    setLoading(true)
    setError(null)
    try {
      const nextBranches = await getBackendBranches()
      setBranches(nextBranches)
      const stored = getStoredBranchId()
      const selected = nextBranches.find((branch) => branch.id === stored)
        || nextBranches.find((branch) => branch.status === 'ACTIVE')
        || nextBranches[0]
      if (selected) {
        setStoredBranchId(selected.id)
        setSelectedBranchIdState(selected.id)
      } else {
        clearStoredBranchId()
        setSelectedBranchIdState('')
      }
    } catch (branchError) {
      console.error('Error loading backend branches:', branchError)
      setError(branchError instanceof Error ? branchError.message : 'Unable to load branches.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!backendSessionLoading) {
      refreshBranches()
    }
  }, [user?.uid, backendSessionLoading])

  const setSelectedBranchId = (branchId: string) => {
    if (!branchId) {
      clearStoredBranchId()
      setSelectedBranchIdState('')
      return
    }

    setStoredBranchId(branchId)
    setSelectedBranchIdState(branchId)
  }

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchIdState) || null,
    [branches, selectedBranchIdState]
  )

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranchId: selectedBranchIdState,
        selectedBranch,
        loading,
        error,
        setSelectedBranchId,
        refreshBranches
      }}
    >
      {children}
    </BranchContext.Provider>
  )
}
