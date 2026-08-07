'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useBranch } from '@/contexts/BranchContext'
import { useStaff } from '@/contexts/StaffContext'
import { useEffect, useMemo, useState } from 'react'
import {
  TruckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  UserGroupIcon,
  ArrowPathIcon,
  CubeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { PlanGate } from '@/components/PlanGate'
import { UpgradeModal } from '@/components/UpgradeModal'
import {
  createSupplier as createSupplierRecord,
  updateSupplier as updateSupplierRecord,
  deleteSupplier as deleteSupplierRecord,
  getSuppliers
} from '@/lib/suppliers-service'

// Trimmed supplier shape: only the fields this simplified screen cares about.
interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  categories: string[]
  productsSupplied: string[]
  branchId?: string | null
}

const CATEGORY_OPTIONS = [
  'General Hardware',
  'Plumbing',
  'Electrical',
  'Tools & Equipment',
  'Building Materials',
  'Paints & Finishes',
  'Safety & Security',
  'Garden & Outdoor',
  'Fasteners & Fixings',
  'Electronics',
  'Food & Beverages',
  'Clothing',
  'Office Supplies',
  'Raw Materials',
  'Packaging',
  'Equipment',
  'Services',
  'Other'
]

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

function normalizeSupplier(supplier: any): Supplier {
  return {
    id: supplier.id,
    name: supplier.name || 'Unnamed supplier',
    contactPerson: supplier.contactPerson || '',
    email: supplier.email || '',
    phone: supplier.phone || '',
    address: supplier.address || '',
    categories: Array.isArray(supplier.categories) ? supplier.categories : [],
    productsSupplied: Array.isArray(supplier.productsSupplied) ? supplier.productsSupplied : [],
    branchId: supplier.branchId ?? null
  }
}

function SuppliersContent() {
  const { user } = useAuth()
  const { staff } = useStaff()
  const { selectedBranchId } = useBranch()
  const { canAddSupplier } = usePlanLimits()

  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [formModal, setFormModal] = useState<{ mode: 'create' } | { mode: 'edit'; supplier: Supplier } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalData, setUpgradeModalData] = useState<{
    feature: 'suppliers'
    currentCount: number
    limit: number
    message: string
  } | null>(null)

  const effectiveUserId = staff ? staff.userId : user?.uid
  const activeBranchId = selectedBranchId || undefined

  const loadSuppliers = async () => {
    if (!effectiveUserId) return
    try {
      const data = await getSuppliers(effectiveUserId, undefined, 'name', 'asc', undefined, activeBranchId)
      setSuppliers(data.map(normalizeSupplier))
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  useEffect(() => {
    if (!effectiveUserId) return
    setLoading(true)
    setSuppliers([])
    loadSuppliers().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId, activeBranchId])

  const filteredSuppliers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return suppliers
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(term) ||
      s.contactPerson.toLowerCase().includes(term) ||
      s.phone.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.categories.some((c) => c.toLowerCase().includes(term)) ||
      s.productsSupplied.some((p) => p.toLowerCase().includes(term))
    )
  }, [suppliers, searchTerm])

  const handleAddClick = async () => {
    const limitCheck = await canAddSupplier()
    if (!limitCheck.allowed) {
      setUpgradeModalData({
        feature: 'suppliers',
        currentCount: limitCheck.currentCount,
        limit: typeof limitCheck.limit === 'number' ? limitCheck.limit : 0,
        message: limitCheck.message || 'Supplier limit reached'
      })
      setShowUpgradeModal(true)
      return
    }
    setFormModal({ mode: 'create' })
  }

  const handleSave = async (data: {
    name: string
    contactPerson: string
    email: string
    phone: string
    address: string
    categories: string[]
    productsSupplied: string[]
  }): Promise<boolean> => {
    if (!effectiveUserId || !formModal) return false
    try {
      if (formModal.mode === 'create') {
        await createSupplierRecord(effectiveUserId, data as any, activeBranchId)
      } else {
        await updateSupplierRecord(formModal.supplier.id, { id: formModal.supplier.id, ...data } as any)
      }
      await loadSuppliers()
      setFormModal(null)
      return true
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Failed to save supplier. Please try again.')
      return false
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!window.confirm(`Delete "${supplier.name}"? This removes the supplier from your list.`)) return
    setDeletingId(supplier.id)
    try {
      await deleteSupplierRecord(supplier.id)
      await loadSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert('Failed to delete supplier. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature={upgradeModalData?.feature}
        currentCount={upgradeModalData?.currentCount}
        limit={upgradeModalData?.limit}
        message={upgradeModalData?.message}
      />

      {/* Header */}
      <div className="dashboard-panel p-8">
        <motion.div {...fadeInUp} className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 rounded-lg p-3">
              <TruckIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="dashboard-page-title">Suppliers</h1>
              <p className="dashboard-page-subtitle mt-1">
                {suppliers.length} {suppliers.length === 1 ? 'supplier' : 'suppliers'} on file
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => { setLoading(true); loadSuppliers().finally(() => setLoading(false)) }}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleAddClick} className="dashboard-action-primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg">
        <div className="p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, contact, category, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard-field w-full py-3 pl-10 pr-4"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="border-0 shadow-lg">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-green-100"></div>
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-green-600 border-t-transparent absolute top-0"></div>
            </div>
            <p className="text-gray-600">Loading suppliers...</p>
          </div>
        </Card>
      ) : filteredSuppliers.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <TruckIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm ? 'No Suppliers Match Your Search' : 'No Suppliers Yet'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm
                ? 'Try a different search term, or add a new supplier.'
                : 'Add your suppliers to keep their contact details, categories, and the products they supply in one place.'}
            </p>
            {searchTerm ? (
              <Button variant="outline" onClick={() => setSearchTerm('')}>Clear Search</Button>
            ) : (
              <Button onClick={handleAddClick} className="dashboard-action-primary px-8 py-3">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Your First Supplier
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                <div className="p-6 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-xl">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-bold">
                          {supplier.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{supplier.name}</h3>
                      {supplier.contactPerson && (
                        <p className="text-sm text-gray-600 font-medium truncate">{supplier.contactPerson}</p>
                      )}
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium">{supplier.phone || 'No phone'}</span>
                    </div>
                    {supplier.email && (
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-start gap-2">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{supplier.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Categories */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <UserGroupIcon className="h-4 w-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">Categories</p>
                    </div>
                    {supplier.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {supplier.categories.map((category) => (
                          <span key={category} className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-green-50 text-green-700 font-medium">
                            {category}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">None listed</p>
                    )}
                  </div>

                  {/* Products supplied */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CubeIcon className="h-4 w-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">Products Supplied</p>
                    </div>
                    {supplier.productsSupplied.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {supplier.productsSupplied.map((product) => (
                          <span key={product} className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 font-medium">
                            {product}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">None listed</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setFormModal({ mode: 'edit', supplier })}
                      className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={deletingId === supplier.id}
                      onClick={() => handleDelete(supplier)}
                      className="flex-1 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                    >
                      {deletingId === supplier.id ? (
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TrashIcon className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {formModal && (
        <SupplierFormModal
          mode={formModal.mode}
          initial={formModal.mode === 'edit' ? formModal.supplier : undefined}
          onSave={handleSave}
          onCancel={() => setFormModal(null)}
        />
      )}
    </div>
  )
}

interface SupplierFormData {
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  categories: string[]
  productsSupplied: string[]
}

interface SupplierFormModalProps {
  mode: 'create' | 'edit'
  initial?: Supplier
  onSave: (data: SupplierFormData) => Promise<boolean>
  onCancel: () => void
}

function SupplierFormModal({ mode, initial, onSave, onCancel }: SupplierFormModalProps) {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: initial?.name || '',
    contactPerson: initial?.contactPerson || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    address: initial?.address || '',
    categories: initial?.categories ? [...initial.categories] : [],
    productsSupplied: initial?.productsSupplied ? [...initial.productsSupplied] : []
  })
  const [productInput, setProductInput] = useState('')
  const [saving, setSaving] = useState(false)

  const addCategory = (category: string) => {
    const value = category.trim()
    if (value && !formData.categories.includes(value)) {
      setFormData((prev) => ({ ...prev, categories: [...prev.categories, value] }))
    }
  }

  const removeCategory = (category: string) => {
    setFormData((prev) => ({ ...prev, categories: prev.categories.filter((c) => c !== category) }))
  }

  const addProduct = () => {
    const value = productInput.trim()
    if (value && !formData.productsSupplied.includes(value)) {
      setFormData((prev) => ({ ...prev, productsSupplied: [...prev.productsSupplied, value] }))
    }
    setProductInput('')
  }

  const removeProduct = (product: string) => {
    setFormData((prev) => ({ ...prev, productsSupplied: prev.productsSupplied.filter((p) => p !== product) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || saving) return
    setSaving(true)
    const success = await onSave({
      ...formData,
      name: formData.name.trim(),
      contactPerson: formData.contactPerson.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim()
    })
    if (!success) setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-2xl font-semibold mb-6">
          {mode === 'create' ? 'Add New Supplier' : 'Edit Supplier'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Supplier Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium mb-2">Categories</label>
            {formData.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.categories.map((category) => (
                  <span key={category} className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                    {category}
                    <button type="button" onClick={() => removeCategory(category)} className="text-green-600 hover:text-green-900">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) addCategory(e.target.value)
              }}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select a category to add</option>
              {CATEGORY_OPTIONS.filter((c) => !formData.categories.includes(c)).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Products supplied */}
          <div>
            <label className="block text-sm font-medium mb-2">Products Supplied</label>
            {formData.productsSupplied.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.productsSupplied.map((product) => (
                  <span key={product} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                    {product}
                    <button type="button" onClick={() => removeProduct(product)} className="text-blue-600 hover:text-blue-900">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={productInput}
                onChange={(e) => setProductInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addProduct()
                  }
                }}
                placeholder="e.g. Cement, 12mm Steel Rods"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <Button type="button" variant="outline" onClick={addProduct} disabled={!productInput.trim()}>
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Type a product name and press Enter or Add.</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={saving || !formData.name.trim()}>
              {saving ? 'Saving...' : mode === 'create' ? 'Create Supplier' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function SuppliersPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PlanGate feature="suppliers">
          <SuppliersContent />
        </PlanGate>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
