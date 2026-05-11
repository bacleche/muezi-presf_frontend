'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import useAuthStore from '@/store/authStore'

export interface Notification {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  enregistrement?: number
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

export default function useNotifications() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_BASE}/notifications/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) return
      const data: Notification[] = await res.json()
      setNotifications(data)
    } catch { /* silencieux */ }
  }, [accessToken])

  useEffect(() => {
    if (!accessToken) return
    fetchNotifications()                                          // immédiat
    pollRef.current = setInterval(fetchNotifications, 15_000)    // toutes les 15s

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [accessToken])

  const markRead = useCallback(async (id: number) => {
    if (!accessToken) return
    try {
      await fetch(`${API_BASE}/notifications/${id}/mark_read/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch { /* silencieux */ }
  }, [accessToken])

  return { notifications, markRead }
}