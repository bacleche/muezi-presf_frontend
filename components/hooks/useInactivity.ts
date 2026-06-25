'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import { useSnackbar } from 'notistack'

const TIMEOUT_MS = 45 * 60 * 1000   // 45 minutes
const WARNING_MS = 40 * 60 * 1000   // avertir à 40 minutes (5 min avant)

export default function useInactivity() {
  const router                              = useRouter()
  const { enqueueSnackbar, closeSnackbar }  = useSnackbar()
  const logout                              = useAuthStore((s) => s.logout)
  const hydrated                            = useAuthStore((s) => s.hydrated)
  const accessToken                         = useAuthStore((s) => s.accessToken)
  const timerRef                            = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef                          = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current)   clearTimeout(timerRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)

    // Avertissement à 4 minutes
    warningRef.current = setTimeout(() => {
      enqueueSnackbar(
        'Vous serez déconnecté dans 1 minute pour inactivité.',
        { variant: 'warning', persist: true, key: 'inactivite-warning' }
      )
    }, WARNING_MS)

    // Déconnexion à 5 minutes
    timerRef.current = setTimeout(() => {
      closeSnackbar('inactivite-warning')
      logout()
      router.replace('/login?raison=inactivite')
    }, TIMEOUT_MS)
  }, [logout, router, enqueueSnackbar, closeSnackbar])

  useEffect(() => {
    if (!hydrated || !accessToken) return

    const evenements = [
      'mousemove', 'mousedown', 'keydown',
      'scroll', 'touchstart', 'click',
    ]

    evenements.forEach((e) => window.addEventListener(e, resetTimer))
    resetTimer()

    return () => {
      evenements.forEach((e) => window.removeEventListener(e, resetTimer))
      if (timerRef.current)   clearTimeout(timerRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      closeSnackbar('inactivite-warning')
    }
  }, [hydrated, accessToken, resetTimer])
}