'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BanknotesIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  TagIcon
} from '@heroicons/react/24/outline'

import { useAuth } from '@/contexts/AuthContext'
import type { Debtor, PaymentMethod, PaymentStatus } from '@/lib/firestore'
import { getDebtors, recordDebtorPayment, deleteDebtor } from '@/lib/firestore'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

function DebtorDetailsContent() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const debtorId = params.id as string
  
  const [debtor, setDebtor] = useState<Debtor | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentForm, setPaymentForm] = useState<{ amount: number, paymentMethod: PaymentMethod, notes: string }>({ 
    amount: 0, 
    paymentMethod: 'CASH', 
    notes: '' 
  })
  const [confirmDelete, setConfirmDelete] = useState(false)
  
  const fetchDebtor = async () => {
    if (!user || !debtorId) return
    setLoading(true)
    try {
      const debtors = await getDebtors(user.uid)
      const foundDebtor = debtors.find(d => d.id === debtorId)
      setDebtor(foundDebtor || null)
    } catch (error) {
      console.error('Error fetching debtor:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchDebtor()
  }, [user, debtorId])

  const getRiskLevel = (debtor: Debtor) => {
    if (debtor.currentDebt > debtor.totalCreditLimit * 0.8) return 'HIGH'
    if (debtor.currentDebt > debtor.totalCreditLimit * 0.5) return 'MEDIUM'
    return 'LOW'
  }

  const handleDeleteDebtor = async () => {
    if (!debtor) return
    try {
      await deleteDebtor(debtor.id)
      router.push('/dashboard/debtors')
    } catch (error) {
      console.error('Failed to delete debtor:', error)
      alert('Failed to delete debtor. Please try again.')
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-[#DC2626]'
      case 'MEDIUM': return 'text-[#F29F05]'
      default: return 'text-[#66BB6A]'
    }
  }

  const getRiskLevelBg = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-[#FEE2E2]'
      case 'MEDIUM': return 'bg-[#FEF3E0]'
      default: return 'bg-[#E8F5E8]'
    }
  }

  const formatPaymentMethod = (method: PaymentMethod) => {
    return method === 'MPESA' ? 'M-Pesa' : method.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const handleRecordPayment = async (amount: number, paymentMethod: PaymentMethod, notes: string) => {
    if (!user || !debtor) return
    
    try {
      await recordDebtorPayment(user.uid, {
        debtorId: debtor.id,
        amount: amount,
        paymentMethod: paymentMethod,
        timestamp: Date.now(),
        notes: notes || '',
        recordedBy: user.uid,
        outstandingBalance: Math.max(0, debtor.currentDebt - amount)
      })
      
      setShowPaymentDialog(false)
      setPaymentForm({ amount: 0, paymentMethod: 'CASH', notes: '' })
      fetchDebtor() // Refresh debtor data
    } catch (error) {
      console.error('Failed to record payment:', error)
      alert('Failed to record payment. Please try again.')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2175C7]"></div>
            <span className="ml-3 text-muted-foreground">Loading debtor details...</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!debtor) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-card-foreground mb-2">Debtor not found</h3>
              <p className="text-muted-foreground mb-6">The debtor you&apos;re looking for doesn&apos;t exist.</p>
              <button
                onClick={() => router.push('/dashboard/debtors')}
                className="bg-[#2175C7] text-white px-6 py-3 rounded-xl hover:bg-[#1565c0] transition-colors"
              >
                Back to Debtors
              </button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const riskLevel = getRiskLevel(debtor)
  const availableCredit = debtor.totalCreditLimit - debtor.currentDebt

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <motion.div initial="initial" animate="animate" variants={staggerChildren} className="space-y-6">
          {/* Header */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => router.push('/dashboard/debtors')}
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                title="Back to Debtors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-muted-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Debtor Details</h1>
                <p className="text-muted-foreground">{debtor.name}</p>
              </div>
            </div>
          </motion.div>

          {/* Debtor Overview Card */}
          <motion.div variants={fadeInUp}>
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {/* Risk Level Indicator */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getRiskLevelBg(riskLevel)}`}>
                    {riskLevel === 'HIGH' ? (
                      <ExclamationTriangleIcon className={`h-7 w-7 ${getRiskLevelColor(riskLevel)}`} />
                    ) : riskLevel === 'MEDIUM' ? (
                      <ClockIcon className={`h-7 w-7 ${getRiskLevelColor(riskLevel)}`} />
                    ) : (
                      <CheckCircleIcon className={`h-7 w-7 ${getRiskLevelColor(riskLevel)}`} />
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-card-foreground">{debtor.name}</h2>
                    <p className="text-lg text-muted-foreground">{debtor.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 rounded-xl border border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
                {/* Risk Level Badge */}
                <div className={`px-3 py-2 rounded-xl font-bold text-sm ${getRiskLevelBg(riskLevel)} ${getRiskLevelColor(riskLevel)}`}>
                  {riskLevel}
                </div>
              </div>
              
              {/* Financial Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF3E0] flex items-center justify-center mx-auto mb-2">
                    <BanknotesIcon className="h-5 w-5 text-[#F29F05]" />
                  </div>
                  <p className="text-xl font-bold text-[#F29F05] mb-1">
                    KSh {debtor.currentDebt.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Current Debt</p>
                </div>
                
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] flex items-center justify-center mx-auto mb-2">
                    <CreditCardIcon className="h-5 w-5 text-[#2175C7]" />
                  </div>
                  <p className="text-xl font-bold text-[#2175C7] mb-1">
                    KSh {debtor.totalCreditLimit.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Credit Limit</p>
                </div>
                
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F5E8] flex items-center justify-center mx-auto mb-2">
                    <TagIcon className="h-5 w-5 text-[#66BB6A]" />
                  </div>
                  <p className="text-xl font-bold text-[#66BB6A] mb-1">
                    KSh {availableCredit.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Available Credit</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions Card */}
          <motion.div variants={fadeInUp}>
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="text-lg font-bold text-card-foreground mb-4">Quick Actions</h3>
              
              {debtor.currentDebt > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setShowPaymentDialog(true)}
                    className="bg-[#66BB6A] text-white py-3 rounded-xl font-medium hover:bg-[#5cb660] transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <span className="text-sm">Mark Paid</span>
                  </button>
                  
                  <button
                    onClick={() => setShowPaymentDialog(true)}
                    className="border border-[#F29F05] text-[#F29F05] py-3 rounded-xl font-medium hover:bg-[#F29F05]/10 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ClockIcon className="h-4 w-4" />
                    <span className="text-sm">Partial</span>
                  </button>
                  
                  <button className="border border-[#DC2626] text-[#DC2626] py-3 rounded-xl font-medium hover:bg-[#DC2626]/10 transition-colors flex items-center justify-center space-x-2">
                    <XMarkIcon className="h-4 w-4" />
                    <span className="text-sm">Unpaid</span>
                  </button>
                </div>
              ) : (
                <div className="bg-[#E8F5E8] rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-6 w-6 text-[#66BB6A]" />
                    <span className="text-lg font-medium text-[#66BB6A]">No outstanding debt</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Contact Information Card */}
          <motion.div variants={fadeInUp}>
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="text-lg font-bold text-card-foreground mb-4">Contact Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E3F2FD] flex items-center justify-center">
                    <PhoneIcon className="h-4 w-4 text-[#2175C7]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-card-foreground">{debtor.phone}</p>
                  </div>
                </div>
                
                {debtor.email && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E8F5E8] flex items-center justify-center">
                      <EnvelopeIcon className="h-4 w-4 text-[#66BB6A]" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-card-foreground">{debtor.email}</p>
                    </div>
                  </div>
                )}
                
                {debtor.address && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FEF3E0] flex items-center justify-center">
                      <MapPinIcon className="h-4 w-4 text-[#F29F05]" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium text-card-foreground">{debtor.address}</p>
                    </div>
                  </div>
                )}
                
                {debtor.notes && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FFF3CD] flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-[#856404]" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium text-card-foreground">{debtor.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Payment History Header */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">Payment History</h3>
              <span className="text-sm text-muted-foreground">0 payments</span>
            </div>
          </motion.div>

          {/* Empty Payment History */}
          <motion.div variants={fadeInUp}>
            <div className="bg-muted/30 rounded-2xl p-8 text-center">
              <CheckCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h4 className="text-lg font-bold text-card-foreground mb-2">No Payment History</h4>
              <p className="text-muted-foreground">Payment history will appear here once payments are made</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Payment Dialog */}
        {showPaymentDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-border"
            >
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Record Payment</h2>
                    <p className="text-green-100 mt-1">Payment for {debtor.name}</p>
                  </div>
                  <button 
                    onClick={() => setShowPaymentDialog(false)} 
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mt-4 p-4 bg-white/10 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-green-100">Current Debt:</span>
                    <span className="text-xl font-bold">KSh {debtor.currentDebt.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleRecordPayment(paymentForm.amount, paymentForm.paymentMethod, paymentForm.notes)
                }}
                className="p-6 space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">Payment Amount (KSh)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max={debtor.currentDebt}
                    step="0.01"
                    required 
                    value={paymentForm.amount || ''} 
                    onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) || 0 })} 
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-lg font-medium" 
                    placeholder="Enter payment amount"
                  />
                  {paymentForm.amount > 0 && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Remaining debt: <span className="font-bold">KSh {Math.max(0, debtor.currentDebt - paymentForm.amount).toLocaleString()}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">Payment Method</label>
                  <select 
                    value={paymentForm.paymentMethod} 
                    onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })} 
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  >
                    {(['CASH','MPESA','BANK_TRANSFER','CARD','CREDIT','CHEQUE','OTHER'] as PaymentMethod[]).map(m => (
                      <option key={m} value={m}>{formatPaymentMethod(m)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">Notes (Optional)</label>
                  <textarea 
                    rows={3} 
                    value={paymentForm.notes} 
                    onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} 
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-none" 
                    placeholder="Add any notes about this payment..."
                  />
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-border">
                  <button 
                    type="button" 
                    onClick={() => setShowPaymentDialog(false)} 
                    className="flex-1 px-6 py-3 border border-border text-muted-foreground rounded-xl hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={!paymentForm.amount || paymentForm.amount <= 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirm Dialog */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-border"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-card-foreground mb-2">Delete Debtor?</h2>
                <p className="text-muted-foreground mb-6">This will permanently remove this debtor and their record.</p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 px-6 py-3 border border-border text-muted-foreground rounded-xl hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteDebtor}
                    className="flex-1 px-6 py-3 bg-[#DC2626] text-white rounded-xl hover:bg-[#b91c1c] font-semibold transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default function DebtorDetailsPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2175C7]"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    }>
      <DebtorDetailsContent />
    </Suspense>
  )
}
