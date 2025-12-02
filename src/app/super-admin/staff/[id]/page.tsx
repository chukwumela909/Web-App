'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminRoute from '@/components/auth/AdminRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import { 
  UserCog, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Shield, 
  Eye, 
  Settings,
  Users,
  FileText,
  Bell,
  Radio,
  Monitor,
  ScrollText,
  LayoutDashboard,
  Loader2,
  Check,
  X,
  Key,
  Save,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Mail,
  User
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// Define staff roles and their permissions (same as in main staff page)
const STAFF_ROLES = {
  'Super Admin': {
    name: 'Super Admin',
    color: 'bg-red-100 text-red-800',
    permissions: [
      'dashboard',
      'user_management', 
      'reports_exports',
      'audit_logs',
      'system_health',
      'alerts_notifications',
      'broadcast_announcements',
      'staff_management',
      'settings'
    ]
  },
  'System Admin': {
    name: 'System Admin', 
    color: 'bg-purple-100 text-purple-800',
    permissions: [
      'dashboard',
      'user_management',
      'audit_logs', 
      'system_health',
      'broadcast_announcements',
      'settings'
    ]
  },
  'Customer Support': {
    name: 'Customer Support',
    color: 'bg-blue-100 text-blue-800', 
    permissions: [
      'user_management_view',
      'alerts_notifications',
      'broadcast_announcements'
    ]
  },
  'Finance / Accounting': {
    name: 'Finance / Accounting',
    color: 'bg-green-100 text-green-800',
    permissions: [
      'reports_exports'
    ]
  },
  'Sales / Onboarding Agent': {
    name: 'Sales / Onboarding Agent',
    color: 'bg-orange-100 text-orange-800',
    permissions: [
      'user_management',
      'reports_exports', 
      'broadcast_announcements'
    ]
  }
}

const PERMISSIONS = {
  dashboard: { name: 'Dashboard', icon: LayoutDashboard, description: 'Access to main dashboard' },
  user_management: { name: 'User & Staff Management', icon: Users, description: 'Full user and staff management access' },
  user_management_view: { name: 'User Management (View Only)', icon: Eye, description: 'View-only access to user management' },
  reports_exports: { name: 'Reports & Exports', icon: FileText, description: 'Access to reports and data exports' },
  audit_logs: { name: 'Audit Logs', icon: ScrollText, description: 'View system audit logs' },
  system_health: { name: 'System Health Monitor', icon: Monitor, description: 'Monitor system health and performance' },
  alerts_notifications: { name: 'Alerts & Notifications', icon: Bell, description: 'Manage alerts and notifications' },
  broadcast_announcements: { name: 'Broadcast Announcements', icon: Radio, description: 'Send broadcast messages' },
  staff_management: { name: 'Staff Management', icon: UserCog, description: 'Manage staff members and roles' },
  settings: { name: 'Settings', icon: Settings, description: 'Access system settings' }
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: keyof typeof STAFF_ROLES
  permissions: string[]
  status: 'active' | 'inactive'
  createdAt: string
  lastLogin?: string
}

export default function StaffDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  // State management
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  // Form state for editing
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: '' as keyof typeof STAFF_ROLES,
    customPermissions: [] as string[]
  })

  // Load staff member details
  useEffect(() => {
    if (params.id) {
      loadStaffDetails(params.id as string)
    }
  }, [params.id])

  const loadStaffDetails = async (staffId: string) => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/staff/${staffId}`)
      const data = await response.json()
      
      if (data.success) {
        setStaff(data.staff)
        setEditFormData({
          name: data.staff.name,
          email: data.staff.email,
          role: data.staff.role,
          customPermissions: data.staff.permissions
        })
      } else {
        // Staff member not found
        setStaff(null)
      }
      
    } catch (error) {
      console.error('Error loading staff details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff details',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const generatePassword = (fullName: string) => {
    const firstName = fullName.trim().split(' ')[0]
    const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
    return `${capitalizedFirstName}2025`
  }

  const handleResetPassword = async () => {
    if (!staff) return

    try {
      setSaving(true)
      
      const newPassword = generatePassword(staff.name)
      
      const response = await fetch(`/api/admin/staff/${staff.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword })
      })

      const data = await response.json()

      if (data.success) {
        setNewPassword(newPassword)
        toast({
          title: 'Success',
          description: `Password reset successfully. New password: ${newPassword}`,
          duration: 10000
        })
      } else {
        throw new Error(data.error || 'Failed to reset password')
      }
      
    } catch (error) {
      console.error('Error resetting password:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset password',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
      setIsResetPasswordDialogOpen(false)
    }
  }

  const handleUpdateStaff = async () => {
    if (!staff || !editFormData.name || !editFormData.email || !editFormData.role) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      setSaving(true)
      
      const response = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: staff.id,
          name: editFormData.name,
          email: editFormData.email,
          role: editFormData.role,
          permissions: editFormData.customPermissions
        })
      })

      const data = await response.json()

      if (data.success) {
        setStaff(data.staff)
        toast({
          title: 'Success',
          description: 'Staff member updated successfully'
        })
        setIsEditDialogOpen(false)
      } else {
        throw new Error(data.error || 'Failed to update staff member')
      }
      
    } catch (error) {
      console.error('Error updating staff:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update staff member',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStaff = async () => {
    if (!staff) return

    try {
      setSaving(true)
      
      const response = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Staff member deleted successfully'
        })
        router.push('/super-admin/staff')
      } else {
        throw new Error(data.error || 'Failed to delete staff member')
      }
      
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete staff member',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = (role: keyof typeof STAFF_ROLES) => {
    setEditFormData(prev => ({
      ...prev,
      role,
      customPermissions: STAFF_ROLES[role].permissions
    }))
  }

  const togglePermission = (permission: string) => {
    setEditFormData(prev => ({
      ...prev,
      customPermissions: prev.customPermissions.includes(permission)
        ? prev.customPermissions.filter(p => p !== permission)
        : [...prev.customPermissions, permission]
    }))
  }

  if (loading) {
    return (
      <AdminRoute requiredPermission="staff_management">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading staff details...</p>
          </div>
        </div>
      </AdminRoute>
    )
  }

  if (!staff) {
    return (
      <SuperAdminLayout currentPage="/super-admin/staff">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Staff Member Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested staff member could not be found.</p>
            <Button onClick={() => router.push('/super-admin/staff')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff List
            </Button>
          </div>
        </div>
      </SuperAdminLayout>
    )
  }

  return (
    <SuperAdminLayout currentPage="/super-admin/staff">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/super-admin/staff')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Staff Details</h1>
              <p className="text-muted-foreground mt-2">
                Manage {staff.name}'s account and permissions
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordDialogOpen(true)}
            >
              <Key className="h-4 w-4 mr-2" />
              Reset Password
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Staff
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete {staff.name}'s account
                    and remove their access to the system.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteStaff} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Staff'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Staff Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Staff Information
                </CardTitle>
                <CardDescription>
                  Basic information about this staff member
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="text-lg font-semibold">{staff.name}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-lg">{staff.email}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Role</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={STAFF_ROLES[staff.role].color}>
                          {staff.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                          {staff.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-lg">{staff.createdAt}</p>
                      </div>
                    </div>
                    
                    {staff.lastLogin && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                        <p className="text-lg">{staff.lastLogin}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsResetPasswordDialogOpen(true)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => {
                    const dialog = document.querySelector('[data-radix-collection-item]') as HTMLElement
                    dialog?.click()
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Staff
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Permissions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Assigned Permissions
              </CardTitle>
              <CardDescription>
                Current permissions assigned to this staff member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.permissions.map((permission) => {
                  const permissionData = PERMISSIONS[permission as keyof typeof PERMISSIONS]
                  if (!permissionData) return null
                  
                  const Icon = permissionData.icon
                  
                  return (
                    <div
                      key={permission}
                      className="flex items-start space-x-3 p-3 border rounded-lg bg-accent/50"
                    >
                      <Icon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{permissionData.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {permissionData.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update staff member details and permissions
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address *</label>
                  <Input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role *</label>
                <Select value={editFormData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(STAFF_ROLES).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editFormData.role && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Permissions</label>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {Object.entries(PERMISSIONS).map(([key, permission]) => {
                      const isChecked = editFormData.customPermissions.includes(key)
                      const Icon = permission.icon
                      
                      return (
                        <div key={key} className="flex items-start space-x-3">
                          <Checkbox
                            id={`edit-${key}`}
                            checked={isChecked}
                            onCheckedChange={() => togglePermission(key)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`edit-${key}`}
                              className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                            >
                              <Icon className="h-4 w-4" />
                              {permission.name}
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStaff} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Staff Member'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                This will generate a new password for {staff.name} based on their first name.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">New password will be:</p>
                <p className="font-mono text-lg font-semibold">{generatePassword(staff.name)}</p>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• Password format: FirstName2025</p>
                <p>• The staff member will need to use this password to log in</p>
                <p>• Make sure to share this password securely with the staff member</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  )
}
