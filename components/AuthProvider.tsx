'use client'

import { useEffect } from 'react'
import useAuthStore from '@/store/authStore'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')

    if (accessToken && !useAuthStore.getState().accessToken) {
      useAuthStore.setState({
        accessToken,
        refreshToken,
      })
    }
  }, [])

  return <>{children}</>
}