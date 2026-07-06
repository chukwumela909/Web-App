'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { isBackendApiError } from '@/lib/backend-api'
import {
  getBackendPlatformAdminUsers,
  manageBackendPlatformAdminUser
} from '@/lib/backend-business-api'
import {
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus
} from 'lucide-react'

type AdminRole = 'super_admin' | 'admin' | 'viewer'
type AdminStatus = 'active' | 'inactive'

interface PlatformAdmin {
  id: string
  name: string
  email: string
  role: AdminRole
  status: AdminStatus
  lastLogin?: string | null
  createdAt?: string | null
}

const ROLE_OPTIONS: { value: AdminRole; label: string; description: string }[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full platform access' },
  { value: 'admin', label: 'Admin', description: 'Full platform access' },
  { value: 'viewer', label: 'Viewer', description: 'Directory entry only — no platform access' }
]

const ROLE_BADGES: Record<AdminRole, string> = {
  super_admin: 'bg-red-100 text-red-800',
  admin: 'bg-purple-100 text-purple-800',
  viewer: 'bg-gray-100 text-gray-800'
}

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  viewer: 'Viewer'
}

function normalizeAdmin(row: Record<string, unknown>): PlatformAdmin {
  return {
    id: String(row.id || row._id || ''),
    name: String(row.name || ''),
    email: String(row.email || ''),
    role: (row.role as AdminRole) || 'viewer',
    status: (row.status as AdminStatus) || 'active',
    lastLogin: (row.lastLogin as string | null) ?? null,
    createdAt: (row.createdAt as string | null) ?? null
  }
}

function errorMessage(error: unknown): string {
  if (isBackendApiError(error)) {
    if (error.code === 'user_not_found') {
      return 'No Fahampesa account exists for that email. Ask them to sign up first, then add them here.'
    }
    if (error.code === 'admin_exists') return 'That email is already an admin user.'
    if (error.code === 'cannot_revoke_own_access') return 'You cannot remove or downgrade your own admin access.'
    return error.message
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function PlatformAdminsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [admins, setAdmins] = useState<PlatformAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AdminRole>('admin')
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadAdmins = useCallback(async () => {
    try {
      setLoadError(null)
      const response = await getBackendPlatformAdminUsers()
      const rows = Array.isArray(response?.adminUsers) ? response.adminUsers : []
      setAdmins(rows.map((row: Record<string, unknown>) => normalizeAdmin(row)))
    } catch (error) {
      setLoadError(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    loadAdmins()
  }, [user, loadAdmins])

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName || !trimmedEmail) return

    try {
      setSubmitting(true)
      const result = await manageBackendPlatformAdminUser({
        action: 'create',
        name: trimmedName,
        email: trimmedEmail,
        role
      })
      toast({
        title: 'Admin added',
        description: result?.accessGranted
          ? `${trimmedEmail} now has platform access. It takes effect the next time they sign in.`
          : `${trimmedEmail} was added as a viewer (directory only, no platform access).`
      })
      setName('')
      setEmail('')
      setRole('admin')
      await loadAdmins()
    } catch (error) {
      toast({ title: 'Could not add admin', description: errorMessage(error), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRoleChange = async (admin: PlatformAdmin, nextRole: AdminRole) => {
    if (nextRole === admin.role) return
    try {
      setBusyId(admin.id)
      await manageBackendPlatformAdminUser({ action: 'update', id: admin.id, role: nextRole })
      toast({
        title: 'Role updated',
        description:
          nextRole === 'viewer'
            ? `${admin.email} is now a viewer and no longer has platform access.`
            : `${admin.email} is now ${ROLE_LABELS[nextRole]}.`
      })
      await loadAdmins()
    } catch (error) {
      toast({ title: 'Could not update role', description: errorMessage(error), variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  const handleToggleStatus = async (admin: PlatformAdmin) => {
    const nextStatus: AdminStatus = admin.status === 'active' ? 'inactive' : 'active'
    try {
      setBusyId(admin.id)
      await manageBackendPlatformAdminUser({ action: 'update', id: admin.id, status: nextStatus })
      toast({
        title: nextStatus === 'active' ? 'Admin activated' : 'Admin deactivated',
        description:
          nextStatus === 'active'
            ? `${admin.email} has platform access again from their next sign-in.`
            : `${admin.email} no longer has platform access.`
      })
      await loadAdmins()
    } catch (error) {
      toast({ title: 'Could not update status', description: errorMessage(error), variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (admin: PlatformAdmin) => {
    if (!confirm(`Remove ${admin.email} as a platform admin? They will lose access to this panel.`)) return
    try {
      setBusyId(admin.id)
      await manageBackendPlatformAdminUser({ action: 'delete', id: admin.id })
      toast({ title: 'Admin removed', description: `${admin.email} no longer has platform access.` })
      await loadAdmins()
    } catch (error) {
      toast({ title: 'Could not remove admin', description: errorMessage(error), variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  const activeCount = admins.filter((admin) => admin.status === 'active').length

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Platform Admins
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Grant teammates access to this admin panel by email. {admins.length} admin{admins.length === 1 ? '' : 's'}, {activeCount} active.
          </p>
        </div>
        <Button variant="outline" onClick={() => { setLoading(true); loadAdmins() }} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <form onSubmit={handleAdd} className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Add an admin</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          The person must already have a Fahampesa account with this email. Access takes effect the next
          time they sign in.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="admin-name" className="block text-sm font-medium mb-1">Full name</label>
            <input
              id="admin-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Jane Wanjiku"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
                className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label htmlFor="admin-role" className="block text-sm font-medium mb-1">Role</label>
            <select
              id="admin-role"
              value={role}
              onChange={(event) => setRole(event.target.value as AdminRole)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.description}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" disabled={submitting || !name.trim() || !email.trim()}>
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
          {submitting ? 'Adding…' : 'Add admin'}
        </Button>
      </form>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading admins…
          </div>
        ) : loadError ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-red-600">{loadError}</p>
            <Button variant="outline" onClick={() => { setLoading(true); loadAdmins() }}>Try again</Button>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No platform admins yet. Add the first one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last login</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const busy = busyId === admin.id
                  return (
                    <tr key={admin.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{admin.name || '—'}</p>
                        <p className="text-muted-foreground">{admin.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${ROLE_BADGES[admin.role]}`}>
                            {ROLE_LABELS[admin.role]}
                          </span>
                          <select
                            value={admin.role}
                            disabled={busy}
                            onChange={(event) => handleRoleChange(admin, event.target.value as AdminRole)}
                            className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            aria-label={`Change role for ${admin.email}`}
                          >
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            admin.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {admin.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(admin.lastLogin)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(admin.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" disabled={busy} onClick={() => handleToggleStatus(admin)}>
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : admin.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleDelete(admin)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            aria-label={`Remove ${admin.email}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
