'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  TagIcon,
  CalendarIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { Expense, ExpenseCategory, PaymentMethod, getExpense, updateExpense, deleteExpense } from '@/lib/firestore'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
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

export default function ExpenseDetailsPage() {
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const expenseId = params.id as string

  const [editForm, setEditForm] = useState({
    amount: 0,
    category: 'OTHER' as ExpenseCategory,
    description: '',
    paymentMethod: 'CASH' as PaymentMethod,
    date: '',
    vendor: '',
    receiptNumber: '',
    isRecurring: false,
    recurringPeriod: null as null | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    isTaxDeductible: false,
    notes: '',
    tags: ''
  })

  useEffect(() => {
    const fetchExpense = async () => {
      if (!user || !expenseId) return
      
      setLoading(true)
      try {
        const expenseData = await getExpense(expenseId)
        if (expenseData && expenseData.userId === user.uid) {
          setExpense(expenseData)
          // Set edit form with current data
          setEditForm({
            amount: expenseData.amount,
            category: expenseData.category,
            description: expenseData.description,
            paymentMethod: expenseData.paymentMethod,
            date: expenseData.date,
            vendor: expenseData.vendor || '',
            receiptNumber: expenseData.receiptNumber || '',
            isRecurring: expenseData.isRecurring || false,
            recurringPeriod: expenseData.recurringPeriod || null,
            isTaxDeductible: expenseData.isTaxDeductible || false,
            notes: expenseData.notes || '',
            tags: expenseData.tags || ''
          })
        } else {
          setNotFound(true)
        }
      } catch (error) {
        console.error('Failed to fetch expense:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchExpense()
  }, [user, expenseId])

  const handleEdit = () => {
    setShowEdit(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expense || !user) return

    try {
      await updateExpense(expense.id, {
        amount: Number(editForm.amount),
        category: editForm.category,
        description: editForm.description,
        paymentMethod: editForm.paymentMethod,
        date: editForm.date,
        timestamp: new Date(`${editForm.date}T00:00:00`).getTime(),
        vendor: editForm.vendor || undefined,
        receiptNumber: editForm.receiptNumber || undefined,
        isRecurring: editForm.isRecurring,
        recurringPeriod: editForm.recurringPeriod,
        isTaxDeductible: editForm.isTaxDeductible,
        notes: editForm.notes || undefined,
        tags: editForm.tags || undefined
      })
      
      // Refresh expense data
      const updatedExpense = await getExpense(expenseId)
      if (updatedExpense) {
        setExpense(updatedExpense)
      }
      
      setShowEdit(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update expense:', error)
      alert('Failed to update expense. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!expense) return
    
    if (confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      try {
        await deleteExpense(expense.id)
        router.push('/dashboard/expenses')
      } catch (error) {
        console.error('Failed to delete expense:', error)
        alert('Failed to delete expense. Please try again.')
      }
    }
  }

  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case 'MARKETING': return <TagIcon className="h-5 w-5" />
      case 'UTILITIES': return <BuildingStorefrontIcon className="h-5 w-5" />
      case 'RENT': return <BuildingStorefrontIcon className="h-5 w-5" />
      case 'SUPPLIES': return <DocumentTextIcon className="h-5 w-5" />
      case 'INVENTORY': return <TagIcon className="h-5 w-5" />
      case 'EQUIPMENT': return <TagIcon className="h-5 w-5" />
      case 'COMMUNICATIONS': return <PhoneIcon className="h-5 w-5" />
      case 'PROFESSIONAL_SERVICES': return <DocumentTextIcon className="h-5 w-5" />
      case 'TRAVEL': return <TagIcon className="h-5 w-5" />
      case 'ENTERTAINMENT': return <TagIcon className="h-5 w-5" />
      case 'TRAINING': return <DocumentTextIcon className="h-5 w-5" />
      default: return <TagIcon className="h-5 w-5" />
    }
  }

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH': return <BanknotesIcon className="h-5 w-5" />
      case 'MPESA': return <PhoneIcon className="h-5 w-5" />
      case 'BANK_TRANSFER': return <CreditCardIcon className="h-5 w-5" />
      case 'CARD': return <CreditCardIcon className="h-5 w-5" />
      case 'CHEQUE': return <DocumentTextIcon className="h-5 w-5" />
      default: return <CreditCardIcon className="h-5 w-5" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const formatCategory = (category: ExpenseCategory) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatPaymentMethod = (method: PaymentMethod) => {
    return method.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004AAD]"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (notFound || !expense) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
            <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Expense Not Found</h1>
            <p className="text-gray-600 mb-6">The expense you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
            <button
              onClick={() => router.push('/dashboard/expenses')}
              className="inline-flex items-center px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#003d91] transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Expenses
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div {...fadeInUp} className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                  </button>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Expense Details</h1>
                    <p className="text-gray-600 mt-1">View and manage expense information</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#003d91] transition-colors"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </button>
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
                  className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4"
                >
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-800 font-medium">Expense updated successfully!</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <motion.div {...staggerChildren} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Primary Info */}
              <motion.div {...fadeInUp} className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Expense Information</h2>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Amount</label>
                        <div className="mt-1 flex items-center">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-2xl font-bold text-[#004AAD]">{formatCurrency(expense.amount)}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Category</label>
                        <div className="mt-1 flex items-center">
                          {getCategoryIcon(expense.category)}
                          <span className="ml-2 text-gray-900">{formatCategory(expense.category)}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment Method</label>
                        <div className="mt-1 flex items-center">
                          {getPaymentMethodIcon(expense.paymentMethod)}
                          <span className="ml-2 text-gray-900">{formatPaymentMethod(expense.paymentMethod)}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date</label>
                        <div className="mt-1 flex items-center">
                          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-gray-900">{new Date(expense.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <div className="mt-1">
                        <span className="text-gray-900">{expense.description || 'No description provided'}</span>
                      </div>
                    </div>

                    {expense.vendor && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Vendor</label>
                        <div className="mt-1 flex items-center">
                          <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-gray-900">{expense.vendor}</span>
                        </div>
                      </div>
                    )}

                    {expense.receiptNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Receipt Number</label>
                        <div className="mt-1 flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-gray-900">{expense.receiptNumber}</span>
                        </div>
                      </div>
                    )}

                    {expense.notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Notes</label>
                        <div className="mt-1">
                          <span className="text-gray-900">{expense.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Sidebar */}
              <motion.div {...fadeInUp} className="space-y-6">
                {/* Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Status</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center">
                      {expense.isTaxDeductible ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-green-700 font-medium">Tax Deductible</span>
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-gray-600">Not Tax Deductible</span>
                        </>
                      )}
                    </div>
                    
                    {expense.isRecurring && (
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-blue-700 font-medium">
                          Recurring ({expense.recurringPeriod?.toLowerCase()})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {expense.tags && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2">
                        {expense.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Edit Modal */}
            <AnimatePresence>
              {showEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  >
                    <div className="bg-gradient-to-r from-[#004AAD] to-[#0056CC] text-white p-6 flex items-center justify-between">
                      <h2 className="text-xl font-bold">Edit Expense</h2>
                      <button
                        onClick={() => setShowEdit(false)}
                        className="p-2 hover:bg-white/20 rounded-lg"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleSaveEdit} className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KES)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.amount}
                            onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                            required
                          >
                            <option value="MARKETING">Marketing</option>
                            <option value="UTILITIES">Utilities</option>
                            <option value="RENT">Rent</option>
                            <option value="OFFICE_SUPPLIES">Office Supplies</option>
                            <option value="INVENTORY">Inventory</option>
                            <option value="EQUIPMENT">Equipment</option>
                            <option value="COMMUNICATIONS">Communications</option>
                            <option value="PROFESSIONAL_SERVICES">Professional Services</option>
                            <option value="TRAVEL">Travel</option>
                            <option value="ENTERTAINMENT">Entertainment</option>
                            <option value="TRAINING">Training</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                          <select
                            value={editForm.paymentMethod}
                            onChange={(e) => setEditForm(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                            required
                          >
                            <option value="CASH">Cash</option>
                            <option value="MPESA">M-Pesa</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="CARD">Card</option>
                            <option value="CHEQUE">Cheque</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                          rows={3}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Vendor (Optional)</label>
                          <input
                            type="text"
                            value={editForm.vendor}
                            onChange={(e) => setEditForm(prev => ({ ...prev, vendor: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Number (Optional)</label>
                          <input
                            type="text"
                            value={editForm.receiptNumber}
                            onChange={(e) => setEditForm(prev => ({ ...prev, receiptNumber: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags (Optional)</label>
                        <input
                          type="text"
                          value={editForm.tags}
                          onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                          placeholder="Separate tags with commas"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editForm.isTaxDeductible}
                            onChange={(e) => setEditForm(prev => ({ ...prev, isTaxDeductible: e.target.checked }))}
                            className="rounded border-gray-300 text-[#004AAD] focus:ring-[#004AAD]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Tax Deductible</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editForm.isRecurring}
                            onChange={(e) => setEditForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                            className="rounded border-gray-300 text-[#004AAD] focus:ring-[#004AAD]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Recurring</span>
                        </label>
                      </div>
                      
                      {editForm.isRecurring && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Recurring Period</label>
                          <select
                            value={editForm.recurringPeriod || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, recurringPeriod: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                          >
                            <option value="">Select period</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="QUARTERLY">Quarterly</option>
                            <option value="YEARLY">Yearly</option>
                          </select>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setShowEdit(false)}
                          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#003d91] transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
