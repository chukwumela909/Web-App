'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CurrencyDollarIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  CheckIcon, 
  TagIcon, 
  DocumentTextIcon, 
  BuildingStorefrontIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Expense, ExpenseCategory, PaymentMethod, createExpense, getExpenses, deleteExpense } from '@/lib/firestore'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

function ExpensesPageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [expenseForm, setExpenseForm] = useState({
    amount: 0,
    category: 'OTHER' as ExpenseCategory,
    description: '',
    paymentMethod: 'CASH' as PaymentMethod,
    date: new Date().toISOString().slice(0,10),
    vendor: '',
    receiptNumber: '',
    isRecurring: false,
    recurringPeriod: null as null | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    isTaxDeductible: false,
    notes: '',
    tags: ''
  })

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const list = await getExpenses(user.uid, 200)
      setExpenses(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [user])

  useEffect(() => {
    if (searchParams?.get('new')) {
      setShowAdd(true)
      router.replace('/dashboard/expenses')
    }
  }, [searchParams, router])

  const filtered = useMemo(() => {
    return expenses.filter(e =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
    )
  }, [expenses, search])

  const totalThisMonth = useMemo(() => {
    const month = new Date().toISOString().slice(0,7)
    return expenses.filter(e => e.date.startsWith(month)).reduce((s, e) => s + Number(e.amount || 0), 0)
  }, [expenses])

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    try {
      await createExpense(user.uid, {
        amount: Number(expenseForm.amount || 0),
        category: expenseForm.category,
        description: expenseForm.description,
        paymentMethod: expenseForm.paymentMethod,
        date: expenseForm.date,
        timestamp: new Date(`${expenseForm.date}T00:00:00`).getTime(),
        vendor: expenseForm.vendor || undefined,
        receiptNumber: expenseForm.receiptNumber || undefined,
        isRecurring: expenseForm.isRecurring,
        recurringPeriod: expenseForm.recurringPeriod,
        isTaxDeductible: expenseForm.isTaxDeductible,
        notes: expenseForm.notes || undefined,
        tags: expenseForm.tags || undefined
      })
      
      setShowAdd(false)
      setExpenseForm({ 
        amount: 0, 
        category: 'OTHER', 
        description: '', 
        paymentMethod: 'CASH', 
        date: new Date().toISOString().slice(0,10), 
        vendor: '', 
        receiptNumber: '', 
        isRecurring: false, 
        recurringPeriod: null, 
        isTaxDeductible: false, 
        notes: '', 
        tags: '' 
      })
      
      setSuccessMessage('Expense recorded successfully!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
      
      fetchData()
    } catch (error) {
      console.error('Failed to create expense:', error)
      alert('Failed to record expense. Please try again.')
    }
  }

  const handleDeleteExpense = async (expense: Expense) => {
    if (confirm(`Are you sure you want to delete the expense "${expense.description}"? This action cannot be undone.`)) {
      try {
        await deleteExpense(expense.id)
        setSuccessMessage('Expense deleted successfully!')
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
        fetchData()
      } catch (error) {
        console.error('Failed to delete expense:', error)
        alert('Failed to delete expense. Please try again.')
      }
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <motion.div initial="initial" animate="animate" variants={fadeInUp} className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Expenses</h1>
              <p className="text-muted-foreground mt-1">Record and track your business spending</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Search expenses..." 
                  className="pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-card-foreground focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none" 
                />
              </div>
              <button 
                onClick={() => setShowAdd(!showAdd)} 
                className="inline-flex items-center px-4 py-2 bg-[#004AAD] text-white text-sm font-medium rounded-lg hover:bg-[#003a8c] transition-colors shadow-md"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Record Expense
              </button>
            </div>
          </div>

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
                  <span className="text-green-800 font-medium">{successMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold text-card-foreground">KSh {totalThisMonth.toLocaleString()}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Add Expense Form */}
          <AnimatePresence>
            {showAdd && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-card rounded-xl shadow-sm border border-border overflow-hidden"
              >
                <div className="bg-gradient-to-r from-[#004AAD] to-[#0056CC] text-white p-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Record New Expense</h2>
                  <button 
                    onClick={() => setShowAdd(false)} 
                    className="p-2 hover:bg-white/20 dark:hover:bg-black/20 rounded-lg"
                  >
                    <ChevronUpIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleAddExpense} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KSh)</label>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        required 
                        value={expenseForm.amount} 
                        onChange={e => setExpenseForm({ ...expenseForm, amount: Number(e.target.value || 0) })} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input 
                        type="date" 
                        required 
                        value={expenseForm.date} 
                        onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select 
                        value={expenseForm.category} 
                        onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none"
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
                        value={expenseForm.paymentMethod} 
                        onChange={e => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as PaymentMethod })} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none"
                      >
                        <option value="CASH">Cash</option>
                        <option value="MPESA">M-Pesa</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CARD">Card</option>
                        <option value="CREDIT">Credit</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vendor / Store</label>
                      <input 
                        value={expenseForm.vendor} 
                        onChange={e => setExpenseForm({ ...expenseForm, vendor: e.target.value })} 
                        placeholder="e.g., ABC Supermarket" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Number</label>
                      <input 
                        value={expenseForm.receiptNumber} 
                        onChange={e => setExpenseForm({ ...expenseForm, receiptNumber: e.target.value })} 
                        placeholder="e.g., RCP-123456" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input 
                      required
                      value={expenseForm.description} 
                      onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} 
                      placeholder="e.g., Electricity bill" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <input 
                        id="recurring" 
                        type="checkbox" 
                        checked={expenseForm.isRecurring} 
                        onChange={e => setExpenseForm({ ...expenseForm, isRecurring: e.target.checked })} 
                        className="h-4 w-4 text-[#004AAD] border-gray-300 rounded focus:ring-[#004AAD]" 
                      />
                      <label htmlFor="recurring" className="text-sm text-gray-700">Recurring Expense</label>
                    </div>
                    {expenseForm.isRecurring && (
                      <select 
                        value={expenseForm.recurringPeriod || 'MONTHLY'} 
                        onChange={e => setExpenseForm({ ...expenseForm, recurringPeriod: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null })} 
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none"
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="YEARLY">Yearly</option>
                      </select>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      id="taxDeductible" 
                      type="checkbox" 
                      checked={expenseForm.isTaxDeductible} 
                      onChange={e => setExpenseForm({ ...expenseForm, isTaxDeductible: e.target.checked })} 
                      className="h-4 w-4 text-[#004AAD] border-gray-300 rounded focus:ring-[#004AAD]" 
                    />
                    <label htmlFor="taxDeductible" className="text-sm text-gray-700">Tax Deductible</label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea 
                      rows={3} 
                      value={expenseForm.notes} 
                      onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                    <input 
                      value={expenseForm.tags} 
                      onChange={e => setExpenseForm({ ...expenseForm, tags: e.target.value })} 
                      placeholder="e.g., utilities, monthly" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button 
                      type="button" 
                      onClick={() => setShowAdd(false)} 
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#003a8c] font-medium shadow-md transition-colors"
                    >
                      <CheckIcon className="h-4 w-4 inline mr-2" />
                      Save Expense
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expenses List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Recent Expenses</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center text-gray-500 py-8">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No expenses found</div>
              ) : (
                <div className="space-y-4">
                  {filtered.map(exp => (
                    <div key={exp.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            <span>{exp.description || 'Expense'}</span>
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {exp.category.replace('_',' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            <BuildingStorefrontIcon className="h-4 w-4 text-gray-400" /> 
                            {exp.vendor || '—'}
                            <span>•</span>
                            <DocumentTextIcon className="h-4 w-4 text-gray-400" /> 
                            {exp.receiptNumber || '—'}
                            <span>•</span>
                            {new Date(exp.timestamp).toLocaleDateString()}
                          </p>
                          {exp.tags && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <TagIcon className="h-3 w-3" /> {exp.tags}
                            </p>
                          )}
                          {exp.notes && (
                            <div className="mt-2 text-sm text-gray-600">{exp.notes}</div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">KSh {Number(exp.amount).toLocaleString()}</p>
                            <p className="text-sm text-gray-500">
                              {exp.paymentMethod === 'MPESA' ? 'M-Pesa' : exp.paymentMethod.replace('_',' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/dashboard/expenses/${exp.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard/expenses/${exp.id}`)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(exp)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    }>
      <ExpensesPageContent />
    </Suspense>
  )
}