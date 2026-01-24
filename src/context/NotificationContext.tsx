'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'

export interface Notification {
  id: string
  type: 'trade_success' | 'trade_error' | 'info'
  title: string
  message: string
  tx_hash?: string
  is_read: boolean
  created_at: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  addNotification: (notification: Omit<Notification, 'id' | 'is_read' | 'created_at'>) => Promise<void>
  markAsRead: (id: string) => void
  markAllAsRead: () => Promise<void>
  clearAll: () => Promise<void>
  refetch: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!address) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    try {
      setIsLoading(true)
      const res = await fetch(`/api/notifications?wallet=${address}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [address])

  // Fetch on wallet change
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'is_read' | 'created_at'>) => {
    if (!address) return

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          tx_hash: notification.tx_hash,
        }),
      })

      if (res.ok) {
        const newNotification = await res.json()
        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Failed to add notification:', error)
    }
  }, [address])

  const markAsRead = useCallback((id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!address) return

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          mark_all: true,
        }),
      })
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      // Refetch on error
      fetchNotifications()
    }
  }, [address, fetchNotifications])

  const clearAll = useCallback(async () => {
    if (!address) return

    // Optimistic update
    setNotifications([])
    setUnreadCount(0)

    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
        }),
      })
    } catch (error) {
      console.error('Failed to clear notifications:', error)
      // Refetch on error
      fetchNotifications()
    }
  }, [address, fetchNotifications])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      refetch: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
