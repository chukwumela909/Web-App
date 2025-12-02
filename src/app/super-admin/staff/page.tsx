'use client'

import React, { useState, useEffect } from 'react'
import AdminRoute from '@/components/auth/AdminRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import { 
  UserCog, 
  Plus, 
  Search, 
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
  ExternalLink,
  CreditCard
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

// Define staff roles and their permissions
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
      'settings',
      'payments_subscriptions'
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
      'settings',
      'payments_subscriptions'
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
      'reports_exports',
      'payments_subscriptions'
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
  user_management: { name: 'Users', icon: Users, description: 'Full user and staff management access' },
  user_management_view: { name: 'Users (View Only)', icon: Eye, description: 'View-only access to user management' },
  reports_exports: { name: 'Reports', icon: FileText, description: 'Access to reports and data exports' },
  audit_logs: { name: 'Audit Logs', icon: ScrollText, description: 'View system audit logs' },
  system_health: { name: 'System Health', icon: Monitor, description: 'Monitor system health and performance' },
  alerts_notifications: { name: 'Alerts', icon: Bell, description: 'Manage alerts and notifications' },
  broadcast_announcements: { name: 'Broadcast', icon: Radio, description: 'Send broadcast messages' },
  staff_management: { name: 'Staff', icon: UserCog, description: 'Manage staff members and roles' },
  settings: { name: 'Settings', icon: Settings, description: 'Access system settings' },
  payments_subscriptions: { name: 'Payments & Subscriptions', icon: CreditCard, description: 'Manage billing, payments, and subscription status' }
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

export default function StaffManagementPage() {
  const { toast } = useToast()
  
  // State management
  const [loading, setLoading] = useState(true)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '' as keyof typeof STAFF_ROLES,
    customPermissions: [] as string[]
  })

  // Load staff members on component mount
  useEffect(() => {
    loadStaffMembers()
  }, [])

  const loadStaffMembers = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/staff')
      const data = await response.json()
      
      if (data.success) {
        // Validate and clean the staff data
        const validStaff = (data.staff || []).filter((staff: any) => {
          return staff && 
                 typeof staff.name === 'string' && 
                 typeof staff.email === 'string' && 
                 typeof staff.role === 'string' &&
                 staff.name.trim() !== '' &&
                 staff.email.trim() !== '' &&
                 staff.role.trim() !== ''
        }).map((staff: any) => ({
          ...staff,
          name: staff.name || 'Unknown',
          email: staff.email || 'unknown@example.com',
          role: staff.role || 'Unknown Role',
          permissions: Array.isArray(staff.permissions) ? staff.permissions : [],
          status: staff.status || 'active',
          createdAt: staff.createdAt || 'Unknown',
          lastLogin: staff.lastLogin || null
        }))
        
        setStaffMembers(validStaff)
      } else {
        // Start with empty staff list
        setStaffMembers([])
      }
      
    } catch (error) {
      console.error('Error loading staff:', error)
      setStaffMembers([]) // Ensure we have a valid array even on error
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
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

  const handleCreateStaff = async () => {
    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      setSaving(true)
      
      const password = generatePassword(formData.name)
      
      const staffData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        permissions: formData.customPermissions.length > 0 
          ? formData.customPermissions 
          : STAFF_ROLES[formData.role].permissions,
        password: password
      }

      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffData)
      })

      const data = await response.json()

      if (data.success) {
        setStaffMembers(prev => [...prev, data.staff])
        
        // Check if this is development mode
        const isDevelopmentMode = data.message?.includes('Development Mode')
        
        toast({
          title: 'Success',
          description: isDevelopmentMode 
            ? `Staff member created in development mode. Password: ${password}. Note: Firebase Auth not configured.`
            : `Staff member created successfully. Password: ${password}`
        })
        
        setIsCreateDialogOpen(false)
        resetForm()
      } else {
        throw new Error(data.error || 'Failed to create staff member')
      }
      
    } catch (error) {
      console.error('Error creating staff:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create staff member',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditStaff = async () => {
    if (!selectedStaff || !formData.name || !formData.email || !formData.role) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      setSaving(true)
      
      const updatedStaff: StaffMember = {
        ...selectedStaff,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        permissions: formData.customPermissions.length > 0 
          ? formData.customPermissions 
          : STAFF_ROLES[formData.role].permissions
      }

      setStaffMembers(prev => 
        prev.map(staff => staff.id === selectedStaff.id ? updatedStaff : staff)
      )
      
      toast({
        title: 'Success',
        description: 'Staff member updated successfully'
      })
      
      setIsEditDialogOpen(false)
      setSelectedStaff(null)
      resetForm()
      
    } catch (error) {
      console.error('Error updating staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to update staff member',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      setStaffMembers(prev => prev.filter(staff => staff.id !== staffId))
      
      toast({
        title: 'Success',
        description: 'Staff member deleted successfully'
      })
      
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete staff member',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: '' as keyof typeof STAFF_ROLES,
      customPermissions: []
    })
  }

  const openEditDialog = (staff: StaffMember) => {
    setSelectedStaff(staff)
    setFormData({
      name: staff.name,
      email: staff.email,
      role: staff.role,
      customPermissions: staff.permissions
    })
    setIsEditDialogOpen(true)
  }

  const handleRoleChange = (role: keyof typeof STAFF_ROLES) => {
    setFormData(prev => ({
      ...prev,
      role,
      customPermissions: STAFF_ROLES[role].permissions
    }))
  }

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      customPermissions: prev.customPermissions.includes(permission)
        ? prev.customPermissions.filter(p => p !== permission)
        : [...prev.customPermissions, permission]
    }))
  }

  const filteredStaff = staffMembers.filter(staff => {
    // Ensure all required properties exist before filtering
    if (!staff || !staff.name || !staff.email || !staff.role) {
      return false
    }
    
    const searchLower = searchTerm.toLowerCase()
    return (
      staff.name.toLowerCase().includes(searchLower) ||
      staff.email.toLowerCase().includes(searchLower) ||
      staff.role.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <AdminRoute requiredPermission="staff_management">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading staff members...</p>
          </div>
        </div>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute requiredPermission="staff_management">
      <div className="space-y-6 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage staff members, roles, and permissions
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Staff Member</DialogTitle>
                <DialogDescription>
                  Add a new staff member and configure their role and permissions
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Role *</label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
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

                {formData.role && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Permissions</label>
                    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                      {Object.entries(PERMISSIONS).map(([key, permission]) => {
                        const isChecked = formData.customPermissions.includes(key)
                        const Icon = permission.icon
                        
                        return (
                          <div key={key} className="flex items-start space-x-3">
                            <Checkbox
                              id={key}
                              checked={isChecked}
                              onCheckedChange={() => togglePermission(key)}
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={key}
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
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateStaff} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Staff Member'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-4"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Staff Members List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Staff Members ({filteredStaff.length})
              </CardTitle>
              <CardDescription>
                Manage staff members and their access permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStaff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Staff Members Found</p>
                  <p className="text-sm">
                    {searchTerm ? 'Try adjusting your search criteria' : 'Add your first staff member to get started'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStaff.map((staff) => {
                    // Additional safety check for rendering
                    if (!staff || !staff.id) return null
                    
                    return (
                      <motion.div
                        key={staff.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{staff.name || 'Unknown'}</h3>
                            <Badge className={STAFF_ROLES[staff.role as keyof typeof STAFF_ROLES]?.color || 'bg-gray-100 text-gray-800'}>
                              {staff.role || 'Unknown Role'}
                            </Badge>
                            <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                              {staff.status || 'unknown'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">{staff.email || 'No email'}</p>
                        
                          <div className="flex flex-wrap gap-1">
                            {(staff.permissions || []).slice(0, 3).map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {PERMISSIONS[permission as keyof typeof PERMISSIONS]?.name || permission}
                              </Badge>
                            ))}
                            {(staff.permissions || []).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{(staff.permissions || []).length - 3} more
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Created: {staff.createdAt || 'Unknown'}</span>
                            {staff.lastLogin && <span>Last login: {staff.lastLogin}</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/super-admin/staff/${staff.id}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(staff)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStaff(staff.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
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
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role *</label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
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

              {formData.role && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Permissions</label>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {Object.entries(PERMISSIONS).map(([key, permission]) => {
                      const isChecked = formData.customPermissions.includes(key)
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
              <Button onClick={handleEditStaff} disabled={saving}>
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
      </div>
    </AdminRoute>
  )
}
