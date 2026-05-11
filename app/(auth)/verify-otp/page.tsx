'use client'


import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Card, Typography, Button,
  CircularProgress, Fade, IconButton
} from '@mui/material'
import { ArrowBackOutlined, MarkEmailReadOutlined, ShieldOutlined } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { authAPI } from '@/lib/api'
import useAuthStore from '@/store/authStore'

export default function VerifyOtpPage() {
  const router              = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const setAuth             = useAuthStore((s) => s.setAuth)
  const pendingEmail        = useAuthStore((s) => s.pendingEmail)

  const [otp, setOtp]             = useState(['', '', '', '', '', ''])
  const [loading, setLoading]     = useState(false)
  const [countdown, setCountdown] = useState(300)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!pendingEmail) router.push('/login')
  }, [pendingEmail])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          enqueueSnackbar('Le code OTP a expiré. Veuillez en demander un nouveau.', { variant: 'warning' })
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) inputsRef.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      inputsRef.current[5]?.focus()
    }
  }

  const handleSubmit = async () => {
  const code = otp.join('')

  if (code.length < 6) {
    enqueueSnackbar('Veuillez entrer le code complet à 6 chiffres.', { variant: 'warning' })
    return
  }

  setLoading(true)

  try {
    const { data } = await authAPI.verifyOtp({
      email: pendingEmail!,
      otp: code,
    })

    // 🔥 1 seule fois
    setAuth(data.user, data.access, data.refresh)

    enqueueSnackbar('Authentification réussie ! Bienvenue.', { variant: 'success' })

    const routes: Record<string, string> = {
      caissier: '/caissier',
      conformite: '/conformite',
      superadmin: '/admin/utilisateurs',
    }

    // 🔥 important : laisser React/Zustand respirer
    setTimeout(() => {
      router.replace(routes[data.user.role] || '/')
    }, 100)

  } catch (err: unknown) {
    const e = err as { response?: { data?: { detail?: string } } }

    enqueueSnackbar(
      e.response?.data?.detail || 'Code invalide ou expiré.',
      { variant: 'error' }
    )

    setOtp(['', '', '', '', '', ''])
    inputsRef.current[0]?.focus()

  } finally {
    setLoading(false)
  }
}

  const handleResend = async () => {
    if (!pendingEmail) return
    setCountdown(300)
    setOtp(['', '', '', '', '', ''])
    inputsRef.current[0]?.focus()
    enqueueSnackbar('Un nouveau code a été envoyé à votre adresse email.', { variant: 'info' })
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      backgroundImage: `
        radial-gradient(circle at 2% 10%, rgba(30,64,175,0.2) 0%, transparent 40%),
        radial-gradient(circle at 98% 90%, rgba(30,64,175,0.15) 0%, transparent 40%)
      `,
      p: 2,
    }}>
      <Fade in timeout={1000}>
        <Card sx={{
          display: 'flex',
          width: '100%',
          maxWidth: 1000,
          minHeight: 600,
          borderRadius: 3,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>

          {/* ── PANNEAU GAUCHE ── */}
          <Box sx={{
            width: { xs: 0, md: '45%' },
            background: '#1e293b',
            color: 'white',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            p: 6,
            justifyContent: 'space-between',
            borderRight: '1px solid rgba(255,255,255,0.05)',
          }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                <Box sx={{
                  p: 1, borderRadius: 1.5, bgcolor: '#3b82f6',
                  display: 'flex', boxShadow: '0 0 20px rgba(59,130,246,0.5)',
                }}>
                  <ShieldOutlined />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                  PRESF <span style={{ color: '#3b82f6' }}>ARCHIVIS</span>
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 2 }}>
                Double vérification pour votre sécurité.
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '1.05rem' }}>
                Un code unique a été envoyé à votre adresse email. Il est valable 5 minutes.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { num: '1', label: 'Identifiants vérifiés', done: true },
                { num: '2', label: 'Code OTP reçu par email', done: true },
                { num: '3', label: 'Accès au dashboard', done: false },
              ].map((step) => (
                <Box key={step.num} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '50%',
                    bgcolor: step.done ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                    border: step.done ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                    color: step.done ? 'white' : '#64748b',
                    flexShrink: 0,
                  }}>
                    {step.done ? '✓' : step.num}
                  </Box>
                  <Typography variant="body2" sx={{
                    color: step.done ? 'white' : '#64748b',
                    fontWeight: step.done ? 600 : 400,
                  }}>
                    {step.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* ── PANNEAU DROIT : OTP ── */}
          <Box sx={{
            width: { xs: '100%', md: '55%' },
            bgcolor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 4, md: 8 },
          }}>
            <Box sx={{ width: '100%', maxWidth: 360 }}>
              <IconButton
                onClick={() => router.push('/login')}
                sx={{ mb: 2, ml: -1, color: '#94a3b8', '&:hover': { color: '#1e293b' } }}
              >
                <ArrowBackOutlined />
              </IconButton>

              <Box sx={{ mb: 4 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: 2,
                  background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', mb: 2,
                  boxShadow: '0 8px 16px rgba(59,130,246,0.25)',
                }}>
                  <MarkEmailReadOutlined sx={{ fontSize: 28, color: 'white' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }} gutterBottom>
                  Vérification
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Code envoyé à
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e40af' }}>
                  {pendingEmail}
                </Typography>
              </Box>

              {/* Cases OTP */}
              <Box
                sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mb: 3 }}
                onPaste={handlePaste}
              >
                {otp.map((digit, i) => (
                  <Box
                    key={i}
                    component="input"
                    ref={(el: HTMLInputElement | null) => { inputsRef.current[i] = el }}
                    value={digit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(i, e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(i, e)}
                    maxLength={1}
                    inputMode="numeric"
                    sx={{
                      width: 52, height: 60,
                      textAlign: 'center',
                      fontSize: '1.6rem', fontWeight: 700,
                      border: '2px solid',
                      borderColor: digit ? '#1e40af' : '#e2e8f0',
                      borderRadius: 2, outline: 'none',
                      bgcolor: digit ? '#eff6ff' : '#f8fafc',
                      color: '#1e293b',
                      transition: 'all 0.15s',
                      fontFamily: 'monospace',
                      '&:focus': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 3px rgba(59,130,246,0.15)',
                        bgcolor: '#eff6ff',
                      },
                    }}
                  />
                ))}
              </Box>

              {/* Compte à rebours */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                {countdown > 0 ? (
                  <Box sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 1,
                    bgcolor: countdown < 60 ? '#fef2f2' : '#f0f9ff',
                    border: '1px solid',
                    borderColor: countdown < 60 ? '#fecaca' : '#bae6fd',
                    borderRadius: 2, px: 2, py: 0.8,
                  }}>
                    <Typography variant="body2" sx={{
                      color: countdown < 60 ? '#dc2626' : '#0369a1',
                      fontWeight: 600,
                    }}>
                      ⏱ Expire dans {formatTime(countdown)}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{
                    display: 'inline-flex',
                    bgcolor: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 2, px: 2, py: 0.8,
                  }}>
                    <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 600 }}>
                      ⚠️ Code expiré
                    </Typography>
                  </Box>
                )}
              </Box>

              <Button
                fullWidth variant="contained"
                onClick={handleSubmit}
                disabled={loading || otp.join('').length < 6 || countdown === 0}
                sx={{
                  py: 1.8, borderRadius: 2,
                  bgcolor: '#1e293b', textTransform: 'none',
                  fontSize: '1rem', fontWeight: 700,
                  '&:hover': { bgcolor: '#0f172a' },
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  mb: 3,
                }}
              >
                {loading
                  ? <CircularProgress size={24} color="inherit" />
                  : 'Confirmer le code'
                }
              </Button>

              <Typography variant="body2" align="center" sx={{ color: '#94a3b8' }}>
                Vous n&apos;avez pas reçu le code ?{' '}
                <span
                  onClick={countdown === 0 ? handleResend : undefined}
                  style={{
                    color: countdown === 0 ? '#3b82f6' : '#cbd5e1',
                    cursor: countdown === 0 ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                    textDecoration: countdown === 0 ? 'underline' : 'none',
                  }}
                >
                  Renvoyer le code
                </span>
              </Typography>
            </Box>
          </Box>
        </Card>
      </Fade>
    </Box>
  )
}