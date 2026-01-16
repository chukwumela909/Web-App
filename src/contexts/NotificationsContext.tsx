'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type NotificationType = 'warning' | 'info' | 'alert'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  highlightedText?: string
  createdAt: number
  seen: boolean
}

type AddNotificationInput = Omit<NotificationItem, 'createdAt' | 'seen'> & { createdAt?: number; seen?: boolean }

interface NotificationsContextValue {
  notifications: NotificationItem[]
  addNotification: (notification: AddNotificationInput) => void
  addNotifications: (notifications: AddNotificationInput[]) => void
  dismissNotification: (id: string) => void
  markAllAsSeen: () => void
  updateNotifications: (updater: (prev: NotificationItem[]) => NotificationItem[]) => void
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const addNotification = useCallback((notification: AddNotificationInput) => {
    setNotifications(prev => {
      if (prev.some(item => item.id === notification.id)) return prev
      const createdAt = notification.createdAt ?? Date.now()
      const seen = notification.seen ?? false
      return [{ ...notification, createdAt, seen }, ...prev]
    })
  }, [])

  const addNotifications = useCallback((items: AddNotificationInput[]) => {
    if (items.length === 0) return
    setNotifications(prev => {
      const existingIds = new Set(prev.map(item => item.id))
      const additions = items
        .filter(item => !existingIds.has(item.id))
        .map(item => ({ ...item, createdAt: item.createdAt ?? Date.now(), seen: item.seen ?? false }))

      if (additions.length === 0) return prev
      return [...additions, ...prev]
    })
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(item => item.id !== id))
  }, [])

  const markAllAsSeen = useCallback(() => {
    setNotifications(prev => prev.map(item => (item.seen ? item : { ...item, seen: true })))
  }, [])

  const updateNotifications = useCallback((updater: (prev: NotificationItem[]) => NotificationItem[]) => {
    setNotifications(prev => updater(prev))
  }, [])

  const value = useMemo(
    () => ({ notifications, addNotification, addNotifications, dismissNotification, markAllAsSeen, updateNotifications }),
    [notifications, addNotification, addNotifications, dismissNotification, markAllAsSeen, updateNotifications]
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return context
}