'use client'

import React, { useEffect, useState } from 'react'
import AdminRoute from '@/components/auth/AdminRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  Radio, 
  Send, 
  Users,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Eye,
  Plus,
  Bell,
  Mail,
  MessageSquare,
  Globe,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { SuperAdminService, BroadcastAnnouncement } from '@/lib/super-admin-service'
import { SchedulerService } from '@/lib/scheduler-service'
import { useAuth } from '@/contexts/AuthContext'

// Using BroadcastAnnouncement interface from our service

// Mock data removed - using real Firebase data

const getTypeColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-100 text-green-800'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800'
    case 'critical':
      return 'bg-red-100 text-red-800'
    case 'info':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'sent':
      return 'bg-green-100 text-green-800'
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'app':
      return <Bell className="h-4 w-4" />
    case 'email':
      return <Mail className="h-4 w-4" />
    case 'all':
      return <Globe className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

export default function BroadcastPage() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<BroadcastAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [userMetrics, setUserMetrics] = useState({ total: 0, activeThisMonth: 0 })
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    channel: 'email' as const,
    targetAudience: 'all_users' as const
  })
  const [isSending, setIsSending] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<BroadcastAnnouncement | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  useEffect(() => {
    fetchAnnouncements()
    fetchUserData()
    
    // Start the scheduler for processing scheduled announcements
    SchedulerService.startScheduler()
    
    return () => {
      // Cleanup scheduler on component unmount
      SchedulerService.stopScheduler()
    }
  }, [])

  const fetchUserData = async () => {
    try {
      const UserMetricsService = (await import('@/lib/user-metrics-service')).default
      const metrics = await UserMetricsService.getUserMetrics(true) // Force refresh
      setUserMetrics({
        total: metrics.total,
        activeThisMonth: metrics.activeThisMonth
      })
    } catch (error) {
      console.error('Error fetching user metrics:', error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const data = await SuperAdminService.getAnnouncements()
      setAnnouncements(data)
    } catch (error) {
      console.error('Error fetching announcements:', error)
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = async (sendNow = false) => {
    if (!user?.email) return
    
    try {
      const announcementData = {
        ...newAnnouncement,
        status: sendNow ? 'sent' as const : 'draft' as const,
        createdBy: user.email,
        actionRequired: false
      }
      
      const id = await SuperAdminService.createAnnouncement(announcementData)
      
      if (sendNow) {
        // Send immediately after creating
        setIsSending(true)
        await handleSendAnnouncement(id)
      }
      
      await fetchAnnouncements() // Refresh the list
      
      setNewAnnouncement({
        title: '',
        message: '',
        type: 'info',
        channel: 'email',
        targetAudience: 'all_users'
      })
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating announcement:', error)
    } finally {
      if (sendNow) {
        setIsSending(false)
      }
    }
  }

  const handleSaveAsDraft = () => {
    handleCreateAnnouncement(false)
  }

  const handleSendNow = () => {
    handleCreateAnnouncement(true)
  }

  const handleSendAnnouncement = async (id: string) => {
    if (!user?.email) return
    
    setIsSending(true)
    try {
      // Find the announcement to send
      const announcement = announcements.find(ann => ann.id === id)
      if (!announcement) {
        console.error('Announcement not found')
        return
      }
      
      // Send the announcement using SuperAdminService
      const result = await SuperAdminService.sendAnnouncement(id, announcement)
      
      if (result.success) {
        console.log(`Announcement sent successfully to ${result.recipientCount} recipients`)
      } else {
        console.error('Failed to send announcement:', result.error)
      }
      
      // Refresh the announcements list
      await fetchAnnouncements()
    } catch (error) {
      console.error('Error sending announcement:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleEditAnnouncement = (announcement: BroadcastAnnouncement) => {
    setEditingAnnouncement(announcement)
    setNewAnnouncement({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      channel: announcement.channel,
      targetAudience: announcement.targetAudience
    })
    
    // If it's a scheduled announcement, populate the date/time fields
    if (announcement.status === 'scheduled' && announcement.scheduledAt) {
      const scheduledDate = new Date(announcement.scheduledAt)
      setScheduledDate(scheduledDate.toISOString().split('T')[0])
      setScheduledTime(scheduledDate.toTimeString().slice(0, 5))
      setIsScheduling(true)
    }
    
    setIsCreating(true)
  }

  const handleUpdateAnnouncement = async () => {
    if (!user?.email || !editingAnnouncement) return
    
    try {
      await SuperAdminService.updateAnnouncement(editingAnnouncement.id, {
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        type: newAnnouncement.type,
        channel: newAnnouncement.channel,
        targetAudience: newAnnouncement.targetAudience
      })
      
      await fetchAnnouncements()
      setEditingAnnouncement(null)
      setNewAnnouncement({
        title: '',
        message: '',
        type: 'info',
        channel: 'email',
        targetAudience: 'all_users'
      })
      setIsCreating(false)
    } catch (error) {
      console.error('Error updating announcement:', error)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    
    try {
      await SuperAdminService.deleteAnnouncement(id)
      await fetchAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
    }
  }

  const handleResendAnnouncement = async (announcement: BroadcastAnnouncement) => {
    if (!confirm('Are you sure you want to resend this announcement?')) return
    
    setIsSending(true)
    try {
      const result = await SuperAdminService.sendAnnouncement(announcement.id, announcement)
      
      if (result.success) {
        console.log(`Announcement resent successfully to ${result.recipientCount} recipients`)
      } else {
        console.error('Failed to resend announcement:', result.error)
      }
      
      await fetchAnnouncements()
    } catch (error) {
      console.error('Error resending announcement:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleScheduleAnnouncement = async () => {
    if (!user?.email || !scheduledDate || !scheduledTime) return
    
    try {
      // Combine date and time
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
      
      // Check if scheduled time is in the future
      if (scheduledDateTime <= new Date()) {
        alert('Scheduled time must be in the future')
        return
      }
      
      const announcementData = {
        ...newAnnouncement,
        status: 'scheduled' as const,
        createdBy: user.email,
        scheduledAt: scheduledDateTime,
        actionRequired: false
      }
      
      if (editingAnnouncement) {
        await SuperAdminService.updateAnnouncement(editingAnnouncement.id, {
          ...announcementData,
          scheduledAt: scheduledDateTime
        })
      } else {
        await SuperAdminService.createAnnouncement(announcementData)
      }
      
      await fetchAnnouncements()
      
      // Reset form
      setNewAnnouncement({
        title: '',
        message: '',
        type: 'info',
        channel: 'email',
        targetAudience: 'all_users'
      })
      setEditingAnnouncement(null)
      setIsCreating(false)
      setIsScheduling(false)
      setScheduledDate('')
      setScheduledTime('')
    } catch (error) {
      console.error('Error scheduling announcement:', error)
    }
  }

  return (
    <AdminRoute requiredPermission="broadcast_announcements">
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Broadcast Announcements</h2>
            <p className="text-muted-foreground">
              Send announcements and notifications to users
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>

        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Announcement</CardTitle>
              <CardDescription>
                Compose and send announcements to your users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="Enter announcement title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <Textarea
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                  placeholder="Enter your announcement message"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={newAnnouncement.type}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Target Audience</label>
                  <select
                    value={newAnnouncement.targetAudience}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetAudience: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all_users">All Users</option>
                    <option value="active_users">Active Users</option>
                    <option value="staff">Staff Only</option>
                    <option value="admins">Admins Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {editingAnnouncement ? (
                  <Button 
                    onClick={handleUpdateAnnouncement}
                    disabled={!newAnnouncement.title || !newAnnouncement.message || isSending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      onClick={handleSaveAsDraft}
                      disabled={!newAnnouncement.title || !newAnnouncement.message || isSending}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Save as Draft
                    </Button>
                    <Button 
                      onClick={handleSendNow}
                      disabled={!newAnnouncement.title || !newAnnouncement.message || isSending}
                    >
                      {isSending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Now
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <Button 
                  variant="outline"
                  onClick={() => setIsScheduling(!isScheduling)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button variant="ghost" onClick={() => {
                  setIsCreating(false)
                  setEditingAnnouncement(null)
                  setIsScheduling(false)
                  setScheduledDate('')
                  setScheduledTime('')
                  setNewAnnouncement({
                    title: '',
                    message: '',
                    type: 'info',
                    channel: 'email',
                    targetAudience: 'all_users'
                  })
                }}>
                  Cancel
                </Button>
              </div>

              {/* Scheduling Section */}
              {isScheduling && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-3">Schedule Announcement</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Date</label>
                      <Input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Time</label>
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <Button 
                      onClick={handleScheduleAnnouncement}
                      disabled={!scheduledDate || !scheduledTime || !newAnnouncement.title || !newAnnouncement.message}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {editingAnnouncement ? 'Update Schedule' : 'Schedule Announcement'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setIsScheduling(false)
                        setScheduledDate('')
                        setScheduledTime('')
                      }}
                    >
                      Cancel Schedule
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recent">Recent Broadcasts</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="sent">Sent Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="bg-blue-100 p-4 rounded-full">
                        <Radio className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">Ready to broadcast?</h3>
                        <p className="text-gray-600 max-w-md">
                          Send announcements and notifications to your users. Create your first broadcast to get started.
                        </p>
                      </div>
                      <Button 
                        onClick={() => setIsCreating(true)}
                        className="mt-4"
                        size="lg"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Your First Announcement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                announcements
                  .slice(0, 10) // Show recent 10 announcements of any status
                  .map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{announcement.title}</h3>
                            <Badge className={getTypeColor(announcement.type)}>
                              {announcement.type}
                            </Badge>
                            <Badge className={getStatusColor(announcement.status)}>
                              {announcement.status}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 text-sm">{announcement.message}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              {getChannelIcon(announcement.channel)}
                              <span className="ml-1 capitalize">{announcement.channel}</span>
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {announcement.recipientCount} recipients
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {announcement.sentAt?.toLocaleDateString()}
                            </span>
                          </div>

                          {announcement.openRate && (
                            <div className="flex items-center space-x-4 text-sm">
                              <span>Open Rate: {announcement.openRate}%</span>
                              <span>Click Rate: {announcement.clickRate}%</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleResendAnnouncement(announcement)}
                            disabled={isSending}
                            title="Resend announcement"
                          >
                            {isSending ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            title="Delete announcement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                  ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            <div className="space-y-4">
              {announcements
                .filter(ann => ann.status === 'scheduled')
                .map((announcement) => (
                <Card key={announcement.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{announcement.title}</h3>
                          <Badge className={getTypeColor(announcement.type)}>
                            {announcement.type}
                          </Badge>
                          <Badge className={getStatusColor(announcement.status)}>
                            {announcement.status}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 text-sm">{announcement.message}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Scheduled for: {announcement.scheduledAt?.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSendAnnouncement(announcement.id)}
                          disabled={isSending}
                        >
                          {isSending ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-1" />
                          )}
                          Send Now
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditAnnouncement(announcement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4">
            <div className="space-y-4">
              {announcements
                .filter(ann => ann.status === 'draft')
                .map((announcement) => (
                <Card key={announcement.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{announcement.title}</h3>
                          <Badge className={getStatusColor(announcement.status)}>
                            {announcement.status}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 text-sm">{announcement.message}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSendAnnouncement(announcement.id)}
                          disabled={isSending}
                        >
                          {isSending ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-1" />
                          )}
                          Send
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditAnnouncement(announcement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sent Messages</CardTitle>
                <CardDescription>
                  All sent announcements with delivery details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Title</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-left p-2 font-medium">Channel</th>
                        <th className="text-left p-2 font-medium">Audience</th>
                        <th className="text-left p-2 font-medium">Recipients</th>
                        <th className="text-left p-2 font-medium">Sent Date</th>
                        <th className="text-left p-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcements
                        .filter(ann => ann.status === 'sent')
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((announcement) => (
                        <tr key={announcement.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{announcement.title}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {announcement.message}
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge className={getTypeColor(announcement.type)}>
                              {announcement.type}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center">
                              {getChannelIcon(announcement.channel)}
                              <span className="ml-1 capitalize">{announcement.channel}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <span className="capitalize">{announcement.targetAudience.replace('_', ' ')}</span>
                          </td>
                          <td className="p-2">
                            <span className="font-medium">{announcement.recipientCount || 0}</span>
                          </td>
                          <td className="p-2">
                            <span className="text-sm">
                              {announcement.sentAt?.toLocaleDateString()} {announcement.sentAt?.toLocaleTimeString()}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center space-x-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleResendAnnouncement(announcement)}
                                disabled={isSending}
                                title="Resend announcement"
                              >
                                {isSending ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                title="Delete announcement"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {announcements.filter(ann => ann.status === 'sent').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No sent messages yet</p>
                      <p className="text-sm">Sent announcements will appear here</p>
                    </div>
                  )}
                </div>
                
                {/* Pagination */}
                {announcements.filter(ann => ann.status === 'sent').length > itemsPerPage && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, announcements.filter(ann => ann.status === 'sent').length)} of {announcements.filter(ann => ann.status === 'sent').length} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {Math.ceil(announcements.filter(ann => ann.status === 'sent').length / itemsPerPage)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage >= Math.ceil(announcements.filter(ann => ann.status === 'sent').length / itemsPerPage)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AdminRoute>
  )
}
