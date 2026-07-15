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
import { useEffect, useMemo, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Debtor, PaymentMethod, createDebtor, getDebtors, recordDebtorPayment, updateDebtor, deleteDebtor, addDebtorPurchase } from '@/lib/firestore'
import { isBackendApiError } from '@/lib/backend-api'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { UpgradeModal } from '@/components/UpgradeModal'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

// Add Debt Modal — add more debt to an existing debtor
function AddDebtModal({ debtor, currencySymbol, onCancel, onSubmit }: {
  debtor: Debtor
  currencySymbol: string
  onCancel: () => void
  onSubmit: (amount: number, dueDate?: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const valid = Number(amount) > 0

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-border"
      >
        <div className="bg-gradient-to-r from-[#004AAD] to-[#0056CC] text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Add Debt</h2>
              <p className="text-blue-100 text-sm mt-1">{debtor.name}</p>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
            Currently owes <span className="font-semibold text-[#F29F05]">{currencySymbol} {Number(debtor.currentDebt).toLocaleString()}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Amount ({currencySymbol})</label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">New Due Date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-colors"
            />
          </div>
        </div>
        <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-6 py-3 border border-border text-muted-foreground rounded-xl hover:bg-muted transition-colors">Cancel</button>
          <button
            onClick={() => onSubmit(Number(amount), dueDate || undefined)}
            disabled={!valid}
            className="px-8 py-3 bg-gradient-to-r from-[#004AAD] to-[#0056CC] text-white font-semibold rounded-xl hover:opacity-95 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Debt
          </button>
        </div>
      </motion.div>
    </div>
  )
}


// Edit Debtor Modal Component
interface EditDebtorModalProps {
  debtor: Debtor
  onSave: (debtor: Debtor) => void
  onCancel: () => void
  currencySymbol: string
}

function EditDebtorModal({ debtor, onSave, onCancel, currencySymbol }: EditDebtorModalProps) {
  const [editForm, setEditForm] = useState({
    name: debtor.name,
    phone: debtor.phone,
    address: debtor.address || '',
    dueDate: debtor.dueDate ? new Date(debtor.dueDate).toISOString().slice(0, 10) : '',
    notes: debtor.notes || ''
  })

  const handleSave = () => {
    const updatedDebtor: Debtor = {
      ...debtor,
      name: editForm.name,
      phone: editForm.phone,
      address: editForm.address || null,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate).getTime() : null,
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
                Due Date
              </label>
              <input
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
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
  const { currency } = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  const [loading, setLoading] = useState(true)
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'COMPLETED' | 'OVERDUE'>('ACTIVE')
  const [showAdd, setShowAdd] = useState(false)
  const [showPayment, setShowPayment] = useState<Debtor | null>(null)
  const [editingDebtor, setEditingDebtor] = useState<Debtor | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  // Disabled-while-submitting guard: a double-click on Record Payment previously
  // recorded the payment twice against the balance.
  const [submitting, setSubmitting] = useState(false)
  // Small "add more debt to this debtor" modal (partial of the old wizard's EXISTING mode)
  const [addingDebtTo, setAddingDebtTo] = useState<Debtor | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalData, setUpgradeModalData] = useState<{
    feature: 'debtors'
    currentCount: number
    limit: number
    message: string
  } | null>(null)
  const { canAddDebtor } = usePlanLimits()
  // Simple debtor form: name, phone, address, amount owed, date taken, due date, note.
  const [debtorForm, setDebtorForm] = useState({
    name: '',
    phone: '',
    address: '',
    amountOwed: '',
    debtDate: new Date().toISOString().slice(0, 10),
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
        await deleteDebtor(debtor.id)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 4000)
        fetchData()
      } catch (error) {
        console.error('Failed to delete debtor:', error)
        if (isBackendApiError(error) && error.code === 'debtor_has_outstanding_debt') {
          alert('This debtor still owes money. Settle or write off the outstanding balance before deleting.')
        } else {
          alert('Failed to delete debtor. Please try again.')
        }
      }
    }
  }

  const handleEditDebtor = (debtor: Debtor) => {
    setEditingDebtor(debtor)
  }

  const handleUpdateDebtor = async (updatedDebtor: Debtor) => {
    try {
      await updateDebtor(updatedDebtor.id, updatedDebtor)
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

  const filteredDebtors = useMemo(() => {
    const filtered = debtors.filter(debtor => {
      const matchesSearch = debtor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debtor.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debtor.email?.toLowerCase().includes(searchTerm.toLowerCase())
      // Mutually exclusive tabs: Active (owing, not past due), Overdue (owing, past due),
      // Completed (fully paid).
      const isOverdue = debtor.currentDebt > 0 && !!debtor.dueDate && debtor.dueDate < Date.now()
      const matchesStatus = (() => {
        switch (filterStatus) {
          case 'ACTIVE':
            return debtor.currentDebt > 0 && !isOverdue
          case 'OVERDUE':
            return isOverdue
          case 'COMPLETED':
            return debtor.currentDebt <= 0
        }
      })()
      return matchesSearch && matchesStatus
    })

    // Sort by name by default
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    return filtered
  }, [debtors, searchTerm, filterStatus])

  const totalDebt = debtors.reduce((sum, debtor) => sum + (debtor.currentDebt || 0), 0)

  const resetForm = () => {
    setDebtorForm({
      name: '',
      phone: '',
      address: '',
      amountOwed: '',
      debtDate: new Date().toISOString().slice(0, 10),
      dueDate: '',
      notes: ''
    })
  }

  const amountOwedNum = Number(debtorForm.amountOwed || 0)
  const dueBeforeTaken = Boolean(debtorForm.dueDate && debtorForm.debtDate && debtorForm.dueDate < debtorForm.debtDate)
  const canSubmit = Boolean(debtorForm.name.trim() && debtorForm.phone.trim()) && amountOwedNum >= 0 && !dueBeforeTaken

  const handleSubmit = async () => {
    if (!user || !canSubmit || submitting) return
    setSubmitting(true)
    try {
      await createDebtor(user.uid, {
        name: debtorForm.name.trim(),
        phone: debtorForm.phone.trim(),
        address: debtorForm.address.trim() || undefined,
        originalDebtAmount: Number(debtorForm.amountOwed || 0),
        currentDebt: Number(debtorForm.amountOwed || 0),
        debtDate: debtorForm.debtDate ? new Date(debtorForm.debtDate).getTime() : undefined,
        dueDate: debtorForm.dueDate ? new Date(debtorForm.dueDate).getTime() : undefined,
        notes: debtorForm.notes || undefined
      })
      setShowAdd(false)
      resetForm()
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
      fetchData()
    } catch (error) {
      console.error('Failed to save debtor:', error)
      alert('Failed to save debtor. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Add more debt to an existing debtor (partial of the old wizard's EXISTING mode).
  const handleAddDebt = async (amount: number, dueDate?: string) => {
    if (!addingDebtTo || amount <= 0) return
    try {
      await addDebtorPurchase(addingDebtTo.id, amount, dueDate ? new Date(dueDate).getTime() : null)
      setAddingDebtTo(null)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
      fetchData()
    } catch (error) {
      console.error('Failed to add debt:', error)
      alert('Failed to add debt. Please try again.')
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          feature={upgradeModalData?.feature}
          currentCount={upgradeModalData?.currentCount}
          limit={upgradeModalData?.limit}
          message={upgradeModalData?.message}
        />
        <motion.div initial="initial" animate="animate" variants={fadeInUp} className="space-y-8">
          {/* Add New Debtor Button */}
          <motion.div variants={fadeInUp}>
            <div className="bg-[#2175C7] rounded-2xl p-6 shadow-lg border border-blue-200/50">
              <button 
                onClick={async () => {
                  const limitCheck = await canAddDebtor()
                  if (!limitCheck.allowed) {
                    setUpgradeModalData({
                      feature: 'debtors',
                      currentCount: limitCheck.currentCount,
                      limit: typeof limitCheck.limit === 'number' ? limitCheck.limit : 0,
                      message: limitCheck.message || 'Debtor limit reached'
                    })
                    setShowUpgradeModal(true)
                  } else {
                    setShowAdd(true)
                  }
                }}
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
                  {currencySymbol} {totalDebt.toLocaleString()}
                </p>
                <p className="text-sm text-[#F29F05] font-medium">Outstanding Debt</p>
              </div>
              
              {/* Row 2 */}
              <div className="bg-[#E8F5E8] rounded-xl p-4 text-center border border-green-200/50">
                <CheckCircleIcon className="h-6 w-6 text-[#66BB6A] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#66BB6A] mb-1">
                  {currencySymbol} {debtors.reduce((sum, d) => sum + (d.totalPayments || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-[#66BB6A] font-medium">Total Collected</p>
              </div>
              
              <div className="bg-[#FEE2E2] rounded-xl p-4 text-center border border-red-200/50">
                <ExclamationTriangleIcon className="h-6 w-6 text-[#DC2626] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#DC2626] mb-1">
                  {debtors.filter(d => d.currentDebt > 0 && !!d.dueDate && d.dueDate < Date.now()).length}
                </p>
                <p className="text-sm text-[#DC2626] font-medium">Overdue</p>
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
              
              {/* Status Tabs */}
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'OVERDUE', label: 'Overdue' }
                ] as const).map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterStatus(filter.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filterStatus === filter.value
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
                          {debtor.address && (
                            <p className="text-xs text-muted-foreground">{debtor.address}</p>
                          )}
                          {debtor.dueDate ? (
                            <p className={`text-xs font-medium ${debtor.currentDebt > 0 && debtor.dueDate < Date.now() ? 'text-[#DC2626]' : 'text-muted-foreground'}`}>
                              Due {new Date(debtor.dueDate).toLocaleDateString()}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Owes</p>
                        <p className={`text-lg font-bold ${debtor.currentDebt > 0 ? 'text-[#F29F05]' : 'text-[#66BB6A]'}`}>
                          {currencySymbol} {Number(debtor.currentDebt).toLocaleString()}
                        </p>

                        {/* Status Badge */}
                        {(() => {
                          const overdue = debtor.currentDebt > 0 && !!debtor.dueDate && debtor.dueDate < Date.now()
                          const label = debtor.currentDebt <= 0 ? 'Completed' : overdue ? 'Overdue' : 'Active'
                          const tone = debtor.currentDebt <= 0
                            ? 'bg-[#E8F5E8] text-[#66BB6A]'
                            : overdue
                            ? 'bg-[#FEE2E2] text-[#DC2626]'
                            : 'bg-[#E3F2FD] text-[#2175C7]'
                          return (
                            <div className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium mt-1 ${tone}`}>
                              {label}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                    
                    {/* Row actions: record payment (when owing) + add debt + edit details */}
                    <div className="mt-3 flex items-center gap-2">
                      {debtor.currentDebt > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowPayment(debtor)
                          }}
                          className="flex-1 bg-[#66BB6A] text-white py-2 rounded-lg font-medium hover:bg-[#5cb660] transition-colors flex items-center justify-center space-x-2"
                        >
                          <BanknotesIcon className="h-4 w-4" />
                          <span>Record Payment</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setAddingDebtTo(debtor)
                        }}
                        className={`${debtor.currentDebt > 0 ? '' : 'flex-1 '}px-4 py-2 border border-border text-muted-foreground rounded-lg font-medium hover:bg-muted transition-colors flex items-center justify-center space-x-2`}
                      >
                        <PlusIcon className="h-4 w-4" />
                        <span>Add Debt</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditDebtor(debtor)
                        }}
                        className="px-4 py-2 border border-border text-muted-foreground rounded-lg font-medium hover:bg-muted transition-colors flex items-center justify-center space-x-2"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Add Debtor Modal (simple single form) */}
          <AnimatePresence>
            {showAdd && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border flex flex-col"
                >
                  <div className="bg-gradient-to-r from-[#004AAD] to-[#0056CC] text-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">Add Debtor</h2>
                        <p className="text-blue-100 text-sm mt-1">Track who owes you, how much, and when it&apos;s due</p>
                      </div>
                      <button onClick={() => { setShowAdd(false); resetForm() }} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-2">Full Name *</label>
                        <input
                          value={debtorForm.name}
                          onChange={e => setDebtorForm({ ...debtorForm, name: e.target.value })}
                          placeholder="Customer name"
                          className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-2">Phone Number *</label>
                        <input
                          value={debtorForm.phone}
                          onChange={e => setDebtorForm({ ...debtorForm, phone: e.target.value })}
                          placeholder="Phone number"
                          className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-colors"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-card-foreground mb-2">Address</label>
                        <input
                          value={debtorForm.address}
                          onChange={e => setDebtorForm({ ...debtorForm, address: e.target.value })}
                          placeholder="Optional"
                          className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-2">Amount Owed ({currencySymbol})</label>
                        <input
                          type="number"
                          min="0"
                          value={debtorForm.amountOwed}
                          onChange={e => setDebtorForm({ ...debtorForm, amountOwed: e.target.value })}
                          placeholder="0"
                          className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-2">Date Debt Taken</label>
                        <input
                          type="date"
                          value={debtorForm.debtDate}
                          onChange={e => setDebtorForm({ ...debtorForm, debtDate: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-card-foreground mb-2">Due Date</label>
                        <input
                          type="date"
                          value={debtorForm.dueDate}
                          onChange={e => setDebtorForm({ ...debtorForm, dueDate: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-colors"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-card-foreground mb-2">Note</label>
                        <textarea
                          rows={3}
                          value={debtorForm.notes}
                          onChange={e => setDebtorForm({ ...debtorForm, notes: e.target.value })}
                          placeholder="Optional"
                          className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none transition-colors resize-none"
                        />
                      </div>
                    </div>
                    {amountOwedNum < 0 && (
                      <p className="mt-3 text-xs font-medium text-[#DC2626]">Amount owed can&apos;t be negative.</p>
                    )}
                    {dueBeforeTaken && (
                      <p className="mt-3 text-xs font-medium text-[#DC2626]">The due date can&apos;t be before the date the debt was taken.</p>
                    )}
                    <p className="mt-4 text-xs text-muted-foreground">Payments can be partial — record them anytime from the debtor&apos;s card.</p>
                  </div>

                  <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
                    <button
                      onClick={() => { setShowAdd(false); resetForm() }}
                      className="px-6 py-3 border border-border text-muted-foreground rounded-xl hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit || submitting}
                      className="px-8 py-3 bg-gradient-to-r from-[#004AAD] to-[#0056CC] text-white font-semibold rounded-xl hover:opacity-95 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Saving…' : 'Save Debtor'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Add Debt (existing debtor) Modal */}
          <AnimatePresence>
            {addingDebtTo && (
              <AddDebtModal
                debtor={addingDebtTo}
                currencySymbol={currencySymbol}
                onCancel={() => setAddingDebtTo(null)}
                onSubmit={handleAddDebt}
              />
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
                        <span className="text-xl font-bold">{currencySymbol} {Number(showPayment.currentDebt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!user || !showPayment || submitting) return
                      setSubmitting(true)
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
                        alert(isBackendApiError(error) && error.code === 'payment_exceeds_debt'
                          ? `Payment can't exceed the ${currencySymbol} ${Number(showPayment.currentDebt).toLocaleString()} owed.`
                          : 'Failed to record payment. Please try again.')
                      } finally {
                        setSubmitting(false)
                      }
                    }}
                    className="p-6 space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-2">Payment Amount ({currencySymbol})</label>
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
                            Remaining debt: <span className="font-bold">{currencySymbol} {Math.max(0, showPayment.currentDebt - paymentForm.amount).toLocaleString()}</span>
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
                        disabled={submitting || !paymentForm.amount || paymentForm.amount <= 0}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <BanknotesIcon className="h-5 w-5 inline mr-2" />
                        {submitting ? 'Recording…' : 'Record Payment'}
                      </button>
                    </div>
                  </form>
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
                    currencySymbol={currencySymbol}
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
