'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UsersIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  CreditCardIcon, 
  XMarkIcon, 
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  UserIcon,
  BanknotesIcon,
  CalendarIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  TableCellsIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline'
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Debtor, DebtorPayment, PaymentMethod, PaymentStatus, InstallmentFrequency, createDebtor, getDebtors, recordDebtorPayment } from '@/lib/firestore'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

type WizardStep = 'mode' | 'personal' | 'financial' | 'payment'

// Debtor Details Modal Component
interface DebtorDetailsModalProps {
  debtor: Debtor
  onClose: () => void
  onEdit: () => void
  onRecordPayment: () => void
}

function DebtorDetailsModal({ debtor, onClose, onEdit, onRecordPayment }: DebtorDetailsModalProps) {
  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">{debtor.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{debtor.name}</h2>
              <p className="text-blue-100 mt-1">Debtor Details & Payment History</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-card-foreground mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium text-card-foreground">{debtor.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-card-foreground">{debtor.phone}</p>
                  </div>
                </div>
                {debtor.email && (
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-card-foreground">{debtor.email}</p>
                    </div>
                  </div>
                )}
                {debtor.address && (
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium text-card-foreground">{debtor.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {debtor.notes && (
              <div>
                <h3 className="text-lg font-bold text-card-foreground mb-4">Notes</h3>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-card-foreground">{debtor.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Financial Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-card-foreground mb-4">Financial Summary</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">Current Debt</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    KSh {Number(debtor.currentDebt).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">Credit Limit</p>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    KSh {Number(debtor.totalCreditLimit).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">Total Payments</p>
                  <p className="text-xl font-bold text-green-900 dark:text-green-100">
                    KSh {Number(debtor.totalPayments).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-card-foreground mb-4">Status & Dates</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    debtor.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    debtor.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {debtor.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Payment:</span>
                  <span className="font-medium text-card-foreground">
                    {debtor.lastPaymentDate 
                      ? new Date(debtor.lastPaymentDate).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
                {debtor.dueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className={`font-medium ${
                      debtor.dueDate < Date.now() ? 'text-red-600' : 'text-card-foreground'
                    }`}>
                      {new Date(debtor.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Credit Score:</span>
                  <span className="font-medium text-card-foreground">{debtor.creditScore}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-border bg-muted/30">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-border text-muted-foreground rounded-xl hover:bg-muted transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors"
          >
            <PencilIcon className="h-4 w-4 inline mr-2" />
            Edit Debtor
          </button>
          <button
            onClick={onRecordPayment}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-colors shadow-lg"
          >
            <BanknotesIcon className="h-5 w-5 inline mr-2" />
            Record Payment
          </button>
        </div>
      </div>
    </div>
  )
}

// Edit Debtor Modal Component
interface EditDebtorModalProps {
  debtor: Debtor
  onSave: (debtor: Debtor) => void
  onCancel: () => void
}

function EditDebtorModal({ debtor, onSave, onCancel }: EditDebtorModalProps) {
  const [editForm, setEditForm] = useState({
    name: debtor.name,
    phone: debtor.phone,
    email: debtor.email || '',
    address: debtor.address || '',
    totalCreditLimit: debtor.totalCreditLimit,
    notes: debtor.notes || ''
  })

  const handleSave = () => {
    const updatedDebtor: Debtor = {
      ...debtor,
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email || null,
      address: editForm.address || null,
      totalCreditLimit: Number(editForm.totalCreditLimit),
      notes: editForm.notes || null
    }
    onSave(updatedDebtor)
  }

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Edit Debtor</h2>
            <p className="text-amber-100 mt-1">Modify debtor information</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Credit Limit (KSh)
              </label>
              <input
                type="number"
                min="0"
                value={editForm.totalCreditLimit}
                onChange={(e) => setEditForm(prev => ({ ...prev, totalCreditLimit: Number(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Address
            </label>
            <input
              type="text"
              value={editForm.address}
              onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Notes
            </label>
            <textarea
              rows={4}
              value={editForm.notes}
              onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors resize-none"
              placeholder="Add any additional notes..."
            />
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-border bg-muted/30">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-border text-muted-foreground rounded-xl hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editForm.name.trim() || !editForm.phone.trim()}
            className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DebtorsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ALL' | PaymentStatus>('ALL')
  const [showAdd, setShowAdd] = useState(false)
  const [showPayment, setShowPayment] = useState<Debtor | null>(null)
  const [showDetails, setShowDetails] = useState<Debtor | null>(null)
  const [editingDebtor, setEditingDebtor] = useState<Debtor | null>(null)
  const [currentStep, setCurrentStep] = useState<WizardStep>('mode')
  const [mode, setMode] = useState<'NEW' | 'EXISTING'>('NEW')
  const [existingDebtorId, setExistingDebtorId] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  const [debtorForm, setDebtorForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    totalCreditLimit: 10000,
    originalDebtAmount: 0,
    preferredPaymentType: 'FULL' as 'FULL' | 'INSTALLMENT' | 'CUSTOM',
    installmentAmount: 0,
    installmentFrequency: 'MONTHLY' as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY',
    dueDate: '',
    notes: ''
  })
  const [paymentForm, setPaymentForm] = useState<{ amount: number, paymentMethod: PaymentMethod, notes: string }>({ 
    amount: 0, 
    paymentMethod: 'CASH', 
    notes: '' 
  })

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const list = await getDebtors(user.uid)
      setDebtors(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [user])

  const handleDeleteDebtor = async (debtor: Debtor) => {
    if (confirm(`Are you sure you want to delete ${debtor.name}? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'debtors', debtor.id))
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 4000)
        fetchData()
      } catch (error) {
        console.error('Failed to delete debtor:', error)
        alert('Failed to delete debtor. Please try again.')
      }
    }
  }

  const handleEditDebtor = (debtor: Debtor) => {
    setEditingDebtor(debtor)
  }

  const handleUpdateDebtor = async (updatedDebtor: Debtor) => {
    try {
      const ref = doc(db, 'debtors', updatedDebtor.id)
      await updateDoc(ref, {
        ...updatedDebtor,
        updatedAt: serverTimestamp()
      })
      setEditingDebtor(null)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
      fetchData()
    } catch (error) {
      console.error('Failed to update debtor:', error)
      alert('Failed to update debtor. Please try again.')
    }
  }

  const formatPaymentMethod = (method: PaymentMethod) => {
    return method === 'MPESA' ? 'M-Pesa' : method.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'UNPAID':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const filteredDebtors = useMemo(() => {
    const filtered = debtors.filter(debtor => {
      const matchesSearch = debtor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debtor.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debtor.email?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'ALL' || debtor.paymentStatus === filterStatus
      return matchesSearch && matchesStatus
    })

    // Sort by name by default
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    return filtered
  }, [debtors, searchTerm, filterStatus])

  const totalDebt = debtors.reduce((sum, debtor) => sum + (debtor.currentDebt || 0), 0)

  const resetForm = () => {
    setCurrentStep('mode')
    setMode('NEW')
    setExistingDebtorId('')
    setDebtorForm({ 
      name: '', 
      phone: '', 
      email: '', 
      address: '', 
      totalCreditLimit: 10000, 
      originalDebtAmount: 0, 
      preferredPaymentType: 'FULL', 
      installmentAmount: 0, 
      installmentFrequency: 'MONTHLY', 
      dueDate: '', 
      notes: '' 
    })
  }

  const handleNext = () => {
    if (currentStep === 'mode') {
      if (mode === 'NEW') {
        setCurrentStep('personal')
      } else {
        setCurrentStep('financial')
      }
    } else if (currentStep === 'personal') {
      setCurrentStep('financial')
    } else if (currentStep === 'financial') {
      setCurrentStep('payment')
    }
  }

  const handlePrevious = () => {
    if (currentStep === 'payment') {
      setCurrentStep('financial')
    } else if (currentStep === 'financial') {
      if (mode === 'NEW') {
        setCurrentStep('personal')
      } else {
        setCurrentStep('mode')
      }
    } else if (currentStep === 'personal') {
      setCurrentStep('mode')
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'mode':
        return mode === 'NEW' || (mode === 'EXISTING' && existingDebtorId)
      case 'personal':
        return debtorForm.name.trim() && debtorForm.phone.trim()
      case 'financial':
        return debtorForm.totalCreditLimit >= 0
      case 'payment':
        return true
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!user) return
    
    try {
      if (mode === 'NEW') {
        await createDebtor(user.uid, {
          name: debtorForm.name,
          phone: debtorForm.phone,
          email: debtorForm.email,
          address: debtorForm.address,
          totalCreditLimit: Number(debtorForm.totalCreditLimit || 0),
          originalDebtAmount: Number(debtorForm.originalDebtAmount || 0),
          currentDebt: Number(debtorForm.originalDebtAmount || 0),
          preferredPaymentType: debtorForm.preferredPaymentType,
          installmentAmount: debtorForm.preferredPaymentType !== 'FULL' ? Number(debtorForm.installmentAmount || 0) : undefined,
          installmentFrequency: debtorForm.preferredPaymentType === 'INSTALLMENT' ? debtorForm.installmentFrequency : undefined,
          dueDate: debtorForm.dueDate ? new Date(debtorForm.dueDate).getTime() : undefined,
          notes: debtorForm.notes || undefined
        })
      } else if (existingDebtorId) {
        // Get the existing debtor data
        const existingDebtor = debtors.find(d => d.id === existingDebtorId)
        if (!existingDebtor) {
          alert('Debtor not found. Please try again.')
          return
        }
        
        const newDebtAmount = Number(debtorForm.originalDebtAmount || 0)
        const availableCredit = existingDebtor.totalCreditLimit - existingDebtor.currentDebt
        
        // Check if the new debt amount exceeds available credit
        if (newDebtAmount > availableCredit) {
          alert(`Cannot add debt of ${newDebtAmount.toLocaleString()} KSh. Available credit is only ${availableCredit.toLocaleString()} KSh (Limit: ${existingDebtor.totalCreditLimit.toLocaleString()} KSh, Current Debt: ${existingDebtor.currentDebt.toLocaleString()} KSh)`)
          return
        }
        
        const ref = doc(db, 'debtors', existingDebtorId)
        const timestamp = Date.now()
        
        // Add to existing debt instead of replacing it
        await updateDoc(ref, {
          currentDebt: existingDebtor.currentDebt + newDebtAmount,
          totalPurchases: existingDebtor.totalPurchases + newDebtAmount,
          lastPurchaseDate: timestamp,
          preferredPaymentType: debtorForm.preferredPaymentType,
          installmentAmount: debtorForm.preferredPaymentType !== 'FULL' ? Number(debtorForm.installmentAmount || 0) : null,
          installmentFrequency: debtorForm.preferredPaymentType === 'INSTALLMENT' ? debtorForm.installmentFrequency : null,
          dueDate: debtorForm.dueDate ? new Date(debtorForm.dueDate).getTime() : null,
          notes: debtorForm.notes || existingDebtor.notes,
          updatedAt: serverTimestamp()
        })
      }
      
      setShowAdd(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Failed to save debtor:', error)
      alert('Failed to save debtor. Please try again.')
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'mode':
        return 'Select Mode'
      case 'personal':
        return 'Personal Information'
      case 'financial':
        return 'Financial Information'
      case 'payment':
        return 'Payment Terms & Review'
      default:
        return ''
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 'mode':
        return 'Choose whether to add a new debtor or add more debt to an existing one'
      case 'personal':
        return 'Enter basic personal information for the new debtor'
      case 'financial':
        if (mode === 'EXISTING') {
          const existingDebtor = debtors.find(d => d.id === existingDebtorId)
          if (existingDebtor) {
            const availableCredit = existingDebtor.totalCreditLimit - existingDebtor.currentDebt
            return `Add additional debt amount. Available credit: ${availableCredit.toLocaleString()} KSh`
          }
          return 'Add additional debt amount to existing debtor'
        }
        return 'Set credit limits and initial debt amount'
      case 'payment':
        return 'Configure payment terms and review details'
      default:
        return ''
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <motion.div initial="initial" animate="animate" variants={fadeInUp} className="space-y-8">
          {/* Add New Debtor Button */}
          <motion.div variants={fadeInUp}>
            <div className="bg-[#2175C7] rounded-2xl p-6 shadow-lg border border-blue-200/50">
              <button 
                onClick={() => setShowAdd(true)}
                className="w-full flex items-center justify-center space-x-3 text-white hover:bg-white/10 rounded-xl p-4 transition-all duration-200"
              >
                <PlusIcon className="h-6 w-6" />
                <span className="text-lg font-bold">Add New Debtor</span>
              </button>
            </div>
          </motion.div>

          {/* Summary Statistics */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-xl font-bold text-foreground mb-6">Summary</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Row 1 */}
              <div className="bg-[#E3F2FD] rounded-xl p-4 text-center border border-blue-200/50">
                <UsersIcon className="h-6 w-6 text-[#2175C7] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#2175C7] mb-1">
                  {debtors.length}
                </p>
                <p className="text-sm text-[#2175C7] font-medium">Total Debtors</p>
              </div>
              
              <div className="bg-[#FEF3E0] rounded-xl p-4 text-center border border-orange-200/50">
                <BanknotesIcon className="h-6 w-6 text-[#F29F05] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#F29F05] mb-1">
                  KSh {totalDebt.toLocaleString()}
                </p>
                <p className="text-sm text-[#F29F05] font-medium">Outstanding Debt</p>
              </div>
              
              {/* Row 2 */}
              <div className="bg-[#E8F5E8] rounded-xl p-4 text-center border border-green-200/50">
                <CheckCircleIcon className="h-6 w-6 text-[#66BB6A] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#66BB6A] mb-1">
                  KSh 0
                </p>
                <p className="text-sm text-[#66BB6A] font-medium">Today&apos;s Payments</p>
              </div>
              
              <div className="bg-[#FEE2E2] rounded-xl p-4 text-center border border-red-200/50">
                <ExclamationTriangleIcon className="h-6 w-6 text-[#DC2626] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#DC2626] mb-1">
                  {debtors.filter(d => d.currentDebt > d.totalCreditLimit * 0.8).length}
                </p>
                <p className="text-sm text-[#DC2626] font-medium">High Risk</p>
              </div>
            </div>
          </motion.div>

          {/* Search and Filter Section */}
          <motion.div variants={fadeInUp}>
            <div className="bg-muted/30 rounded-2xl p-4 border border-border">
              {/* Search Bar */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search debtors..."
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-[#2175C7] focus:border-[#2175C7] outline-none transition-colors"
                />
              </div>
              
              {/* Filter Chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'ALL', label: 'All' },
                  { value: 'UNPAID', label: 'Active' },
                  { value: 'PARTIAL', label: 'Overdue' },
                  { value: 'HIGH_RISK', label: 'High Risk' },
                  { value: 'AT_LIMIT', label: 'At Limit' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterStatus(filter.value === 'ALL' ? 'ALL' : 
                      filter.value === 'HIGH_RISK' ? 'UNPAID' : 
                      filter.value === 'AT_LIMIT' ? 'UNPAID' :
                      filter.value as PaymentStatus)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      (filterStatus === 'ALL' && filter.value === 'ALL') ||
                      (filterStatus === filter.value)
                        ? 'bg-[#2175C7] text-white'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Success Message */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4"
              >
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-800 font-medium">Operation completed successfully!</span>
            </div>
              </motion.div>
            )}
          </AnimatePresence>



          {/* Debtors List - Mobile Style */}
          <motion.div variants={fadeInUp} className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2175C7]"></div>
                <span className="ml-3 text-muted-foreground">Loading debtors...</span>
              </div>
            ) : filteredDebtors.length === 0 ? (
              <div className="text-center py-16">
                <UsersIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-card-foreground mb-2">No debtors found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search criteria or add your first debtor</p>
                <button 
                  onClick={() => setShowAdd(true)}
                  className="inline-flex items-center px-6 py-3 bg-[#2175C7] text-white font-medium rounded-xl hover:bg-[#1565c0] transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add First Debtor
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDebtors.map(debtor => (
                  <motion.div 
                    key={debtor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-all cursor-pointer"
                    onClick={() => router.push(`/dashboard/debtors/${debtor.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Risk Level Indicator */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2175C7] to-[#1565c0] flex items-center justify-center">
                          <span className="text-white font-bold text-lg">{debtor.name.charAt(0).toUpperCase()}</span>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-card-foreground text-lg">{debtor.name}</h3>
                          <p className="text-sm text-muted-foreground">{debtor.phone}</p>
                          {debtor.currentDebt > 0 && (
                            <p className="text-sm font-medium text-[#F29F05]">
                              Debt: KSh {Number(debtor.currentDebt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Available Credit</p>
                        <p className="text-lg font-bold text-[#66BB6A]">
                          KSh {Number(debtor.totalCreditLimit - debtor.currentDebt).toLocaleString()}
                        </p>
                        
                        {/* Risk Level Badge */}
                        <div className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium mt-1 ${
                          debtor.currentDebt > debtor.totalCreditLimit * 0.8
                            ? 'bg-[#FEE2E2] text-[#DC2626]'
                            : debtor.currentDebt > debtor.totalCreditLimit * 0.5
                            ? 'bg-[#FEF3E0] text-[#F29F05]'
                            : 'bg-[#E8F5E8] text-[#66BB6A]'
                        }`}>
                          {debtor.currentDebt > debtor.totalCreditLimit * 0.8
                            ? 'HIGH'
                            : debtor.currentDebt > debtor.totalCreditLimit * 0.5
                            ? 'MEDIUM'
                            : 'LOW'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Update Status Button for debtors with debt */}
                    {debtor.currentDebt > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowPayment(debtor)
                          }}
                          className="w-full bg-[#66BB6A] text-white py-2 rounded-lg font-medium hover:bg-[#5cb660] transition-colors flex items-center justify-center space-x-2"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>Update Status</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Add Debtor Wizard */}
          <AnimatePresence>
            {showAdd && (
              <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                  className="bg-card/95 backdrop-blur-md rounded-3xl shadow-2xl border border-border max-w-4xl w-full max-h-[95vh] overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-[#004AAD] to-[#0056CC] text-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">Add Debtor</h2>
                        <p className="text-blue-100 text-sm mt-1">{getStepDescription()}</p>
                      </div>
                      <button 
                        onClick={() => { setShowAdd(false); resetForm(); }} 
                        className="p-2 hover:bg-white/20 dark:hover:bg-black/20 rounded-lg"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    
                    {/* Progress Indicators */}
                    <div className="mt-8">
                      <div className="flex items-center justify-center">
                        {(['mode', 'personal', 'financial', 'payment'] as WizardStep[]).map((step, index) => {
                          const stepNames = ['mode', 'personal', 'financial', 'payment'] as WizardStep[]
                          const currentIndex = stepNames.indexOf(currentStep)
                          const isActive = currentStep === step
                          const isCompleted = index < currentIndex
                          
                          return (
                            <div key={step} className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                isActive 
                                  ? 'bg-white text-[#004AAD] shadow-lg scale-110' 
                                  : isCompleted
                                    ? 'bg-blue-200 text-blue-800' 
                                    : 'bg-blue-800/50 text-blue-200'
                              }`}>
                                {isCompleted ? '✓' : index + 1}
                              </div>
                              {index < 3 && (
                                <div className={`h-1 w-16 mx-3 transition-all duration-300 ${
                                  isCompleted 
                                    ? 'bg-blue-200' 
                                    : 'bg-blue-800/30'
                                }`} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-blue-100 mt-4 px-4">
                        <span className={currentStep === 'mode' ? 'font-bold text-white' : ''}>Mode</span>
                        <span className={currentStep === 'personal' ? 'font-bold text-white' : ''}>Personal</span>
                        <span className={currentStep === 'financial' ? 'font-bold text-white' : ''}>Financial</span>
                        <span className={currentStep === 'payment' ? 'font-bold text-white' : ''}>Payment</span>
                      </div>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="p-8 overflow-y-auto max-h-[calc(95vh-280px)]">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h3>
                      <p className="text-gray-600 mt-2">{getStepDescription()}</p>
                    </div>

                    {/* Step 1: Mode Selection */}
                    {currentStep === 'mode' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <button 
                            type="button" 
                            onClick={() => setMode('NEW')} 
                            className={`p-8 rounded-xl border-2 text-center transition-all duration-200 hover:shadow-lg ${
                              mode === 'NEW' 
                                ? 'border-[#004AAD] bg-blue-50 text-[#004AAD] shadow-lg' 
                                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            <UserIcon className="h-12 w-12 mx-auto mb-4" />
                            <div className="font-bold text-lg mb-2">New Debtor</div>
                            <div className="text-sm text-gray-500">Add a new customer to your system</div>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setMode('EXISTING')} 
                            className={`p-8 rounded-xl border-2 text-center transition-all duration-200 hover:shadow-lg ${
                              mode === 'EXISTING' 
                                ? 'border-[#004AAD] bg-blue-50 text-[#004AAD] shadow-lg' 
                                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            <UsersIcon className="h-12 w-12 mx-auto mb-4" />
                            <div className="font-bold text-lg mb-2">Existing Debtor</div>
                            <div className="text-sm text-gray-500">Update existing customer information</div>
                          </button>
                        </div>
                        
                        {mode === 'EXISTING' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-8"
                          >
                            <label className="block text-base font-semibold text-gray-700 mb-3">Choose Debtor</label>
                            <select 
                              value={existingDebtorId} 
                              onChange={e => setExistingDebtorId(e.target.value)} 
                              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-all"
                            >
                              <option value="">Select debtor...</option>
                              {debtors.map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                              ))}
                            </select>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Step 2: Personal Information */}
                    {currentStep === 'personal' && mode === 'NEW' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-base font-semibold text-card-foreground mb-3">Full Name *</label>
                            <input 
                              value={debtorForm.name} 
                              onChange={e => setDebtorForm({ ...debtorForm, name: e.target.value })} 
                              className="w-full px-4 py-3 text-base border border-border rounded-xl bg-card text-card-foreground focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-all" 
                              placeholder="Enter full name"
                            />
                          </div>
                          <div>
                            <label className="block text-base font-semibold text-card-foreground mb-3">Phone Number *</label>
                            <input 
                              value={debtorForm.phone} 
                              onChange={e => setDebtorForm({ ...debtorForm, phone: e.target.value })} 
                              className="w-full px-4 py-3 text-base border border-border rounded-xl bg-card text-card-foreground focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-all" 
                              placeholder="Enter phone number"
                            />
                          </div>
                          <div>
                            <label className="block text-base font-semibold text-gray-700 mb-3">Email (Optional)</label>
                            <input 
                              type="email"
                              value={debtorForm.email} 
                              onChange={e => setDebtorForm({ ...debtorForm, email: e.target.value })} 
                              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-all" 
                              placeholder="Enter email address"
                            />
                          </div>
                          <div>
                            <label className="block text-base font-semibold text-gray-700 mb-3">Address (Optional)</label>
                            <input 
                              value={debtorForm.address} 
                              onChange={e => setDebtorForm({ ...debtorForm, address: e.target.value })} 
                              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-all" 
                              placeholder="Enter address"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Financial Information */}
                    {currentStep === 'financial' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                      >
                        {/* Show current credit info for existing debtors */}
                        {mode === 'EXISTING' && existingDebtorId && (() => {
                          const existingDebtor = debtors.find(d => d.id === existingDebtorId)
                          if (existingDebtor) {
                            const availableCredit = existingDebtor.totalCreditLimit - existingDebtor.currentDebt
                            return (
                              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                                <h4 className="font-semibold text-blue-900 mb-4">Current Credit Status</h4>
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-sm text-blue-600 mb-1">Credit Limit</p>
                                    <p className="text-xl font-bold text-blue-900">{existingDebtor.totalCreditLimit.toLocaleString()} KSh</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-blue-600 mb-1">Current Debt</p>
                                    <p className="text-xl font-bold text-orange-600">{existingDebtor.currentDebt.toLocaleString()} KSh</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-blue-600 mb-1">Available Credit</p>
                                    <p className="text-xl font-bold text-green-600">{availableCredit.toLocaleString()} KSh</p>
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        })()}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {mode === 'NEW' && (
                            <div>
                              <label className="block text-base font-semibold text-gray-700 mb-3">Total Credit Limit (KSh)</label>
                              <input 
                                type="number" 
                                min="0" 
                                value={debtorForm.totalCreditLimit} 
                                onChange={e => setDebtorForm({ ...debtorForm, totalCreditLimit: Number(e.target.value || 0) })} 
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-all" 
                                placeholder="Enter credit limit"
                              />
                            </div>
                          )}
                          <div className={mode === 'NEW' ? '' : 'md:col-span-2'}>
                            <label className="block text-base font-semibold text-gray-700 mb-3">
                              {mode === 'EXISTING' ? 'New Debt Amount to Add (KSh)' : 'Current Debt Amount (KSh)'}
                            </label>
                            <input 
                              type="number" 
                              min="0" 
                              value={debtorForm.originalDebtAmount} 
                              onChange={e => setDebtorForm({ ...debtorForm, originalDebtAmount: Number(e.target.value || 0) })} 
                              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-all" 
                              placeholder={mode === 'EXISTING' ? 'Enter amount to add' : 'Enter current debt'}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-base font-semibold text-gray-700 mb-3">Due Date (Optional)</label>
                            <input 
                              type="date" 
                              value={debtorForm.dueDate} 
                              onChange={e => setDebtorForm({ ...debtorForm, dueDate: e.target.value })} 
                              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-all" 
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-base font-semibold text-gray-700 mb-3">Notes</label>
                          <textarea 
                            rows={4} 
                            value={debtorForm.notes} 
                            onChange={e => setDebtorForm({ ...debtorForm, notes: e.target.value })} 
                            className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-all resize-none" 
                            placeholder="Additional notes about this debtor..."
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: Payment Terms & Review */}
                    {currentStep === 'payment' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                      >
                        <div>
                          <label className="block text-base font-semibold text-gray-700 mb-4">Preferred Payment Type</label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(['FULL', 'INSTALLMENT', 'CUSTOM'] as const).map(type => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setDebtorForm({ ...debtorForm, preferredPaymentType: type })}
                                className={`p-6 rounded-xl border-2 text-center transition-all duration-200 hover:shadow-lg ${
                                  debtorForm.preferredPaymentType === type
                                    ? 'border-[#004AAD] bg-blue-50 text-[#004AAD] shadow-lg'
                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                              >
                                <div className="font-bold text-lg mb-2">{type}</div>
                                <div className="text-sm text-gray-500">
                                  {type === 'FULL' && 'Pay full amount at once'}
                                  {type === 'INSTALLMENT' && 'Fixed regular installments'}
                                  {type === 'CUSTOM' && 'Custom payment schedule'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {debtorForm.preferredPaymentType !== 'FULL' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                          >
                            <div>
                              <label className="block text-base font-semibold text-gray-700 mb-3">Installment Amount (KSh)</label>
                              <input 
                                type="number" 
                                min="0" 
                                value={debtorForm.installmentAmount} 
                                onChange={e => setDebtorForm({ ...debtorForm, installmentAmount: Number(e.target.value || 0) })} 
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-all" 
                                placeholder="Enter installment amount"
                              />
                            </div>
                            <div>
                              <label className="block text-base font-semibold text-gray-700 mb-3">Payment Frequency</label>
                              <select 
                                value={debtorForm.installmentFrequency} 
                                onChange={e => setDebtorForm({ ...debtorForm, installmentFrequency: e.target.value as InstallmentFrequency })} 
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-all"
                              >
                                <option value="WEEKLY">Weekly</option>
                                <option value="BIWEEKLY">Bi-weekly</option>
                                <option value="MONTHLY">Monthly</option>
                                <option value="QUARTERLY">Quarterly</option>
                              </select>
                            </div>
                          </motion.div>
                        )}

                        {/* Review Summary */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                          <h4 className="font-bold text-xl text-gray-900 mb-4">Review Details</h4>
                          <div className="space-y-3 text-base">
                            {mode === 'NEW' && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-700">Name:</span>
                                  <span className="font-semibold text-gray-900">{debtorForm.name || 'Not specified'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-700">Phone:</span>
                                  <span className="font-semibold text-gray-900">{debtorForm.phone || 'Not specified'}</span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-700">Credit Limit:</span>
                              <span className="font-semibold text-gray-900">KSh {debtorForm.totalCreditLimit.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700">Current Debt:</span>
                              <span className="font-semibold text-gray-900">KSh {debtorForm.originalDebtAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700">Payment Type:</span>
                              <span className="font-semibold text-gray-900">{debtorForm.preferredPaymentType}</span>
                            </div>
                            {debtorForm.preferredPaymentType !== 'FULL' && (
                              <div className="flex justify-between">
                                <span className="text-gray-700">Installment:</span>
                                <span className="font-semibold text-gray-900">
                                  KSh {debtorForm.installmentAmount.toLocaleString()} ({debtorForm.installmentFrequency.toLowerCase()})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={currentStep === 'mode' ? () => { setShowAdd(false); resetForm(); } : handlePrevious}
                        className="inline-flex items-center px-6 py-3 text-base border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                      >
                        {currentStep === 'mode' ? (
                          <>
                            <XMarkIcon className="h-5 w-5 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <ArrowLeftIcon className="h-5 w-5 mr-2" />
                            Previous
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={currentStep === 'payment' ? handleSubmit : handleNext}
                        disabled={!canProceed()}
                        className="inline-flex items-center px-8 py-3 text-base bg-[#004AAD] text-white rounded-xl hover:bg-[#003a8c] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg font-semibold"
                      >
                        {currentStep === 'payment' ? (
                          <>
                            <CheckIcon className="h-5 w-5 mr-2" />
                            Add Debtor
                          </>
                        ) : (
                          <>
                            Next
                            <ArrowRightIcon className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Enhanced Record Payment Modal */}
          <AnimatePresence>
            {showPayment && (
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
                        <p className="text-green-100 mt-1">Payment for {showPayment.name}</p>
                      </div>
                    <button 
                      onClick={() => setShowPayment(null)} 
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                    
                    <div className="mt-4 p-4 bg-white/10 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-green-100">Current Debt:</span>
                        <span className="text-xl font-bold">KSh {Number(showPayment.currentDebt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!user || !showPayment) return
                      try {
                      await recordDebtorPayment(user.uid, {
                        debtorId: showPayment.id,
                        amount: Number(paymentForm.amount || 0),
                        paymentMethod: paymentForm.paymentMethod,
                        timestamp: Date.now(),
                        notes: paymentForm.notes || '',
                          recordedBy: user.uid,
                          outstandingBalance: Math.max(0, showPayment.currentDebt - Number(paymentForm.amount || 0))
                      })
                      setShowPayment(null)
                      setPaymentForm({ amount: 0, paymentMethod: 'CASH', notes: '' })
                        setShowSuccess(true)
                        setTimeout(() => setShowSuccess(false), 4000)
                      fetchData()
                      } catch (error) {
                        console.error('Failed to record payment:', error)
                        alert('Failed to record payment. Please try again.')
                      }
                    }}
                    className="p-6 space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-2">Payment Amount (KSh)</label>
                      <input 
                        type="number" 
                        min="0" 
                        max={showPayment.currentDebt}
                        step="0.01"
                        required 
                        value={paymentForm.amount} 
                        onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value || 0) })} 
                        className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-lg font-medium" 
                        placeholder="Enter payment amount"
                      />
                      {paymentForm.amount > 0 && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Remaining debt: <span className="font-bold">KSh {Math.max(0, showPayment.currentDebt - paymentForm.amount).toLocaleString()}</span>
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
                        onClick={() => setShowPayment(null)} 
                        className="flex-1 px-6 py-3 border border-border text-muted-foreground rounded-xl hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={!paymentForm.amount || paymentForm.amount <= 0}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <BanknotesIcon className="h-5 w-5 inline mr-2" />
                        Record Payment
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Debtor Details Modal */}
          <AnimatePresence>
            {showDetails && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                  className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-border"
                >
                  <DebtorDetailsModal 
                    debtor={showDetails}
                    onClose={() => setShowDetails(null)}
                    onEdit={() => {
                      setEditingDebtor(showDetails)
                      setShowDetails(null)
                    }}
                    onRecordPayment={() => {
                      setShowPayment(showDetails)
                      setShowDetails(null)
                    }}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Edit Debtor Modal */}
          <AnimatePresence>
            {editingDebtor && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                  className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border"
                >
                  <EditDebtorModal 
                    debtor={editingDebtor}
                    onSave={handleUpdateDebtor}
                    onCancel={() => setEditingDebtor(null)}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}