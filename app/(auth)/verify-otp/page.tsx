'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Card, Typography, Button,
  CircularProgress, Fade
} from '@mui/material'
import { ShieldOutlined, MarkEmailReadOutlined } from '@mui/icons-material'
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
  const [countdown, setCountdown] = useState(300) // 5 minutes
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!pendingEmail) {
      router.push('/login')
    }
  }, [pendingEmail, router])

  useEffect(() => {
    if (pendingEmail) {
      inputsRef.current[0]?.focus()
    }
  }, [pendingEmail])

  useEffect(() => {
    if (countdown <= 0) {
      enqueueSnackbar('Le code OTP a expiré. Veuillez en demander un nouveau.', { variant: 'warning' })
      return
    }
    const timer = setInterval(() => {
      setCountdown((c) => c - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown, enqueueSnackbar])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return

    const newOtp = [...otp]
    newOtp[index] = value.substring(value.length - 1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp]
      newOtp[index - 1] = ''
      setOtp(newOtp)
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').trim()
    if (!/^\d{6}$/.test(text)) return

    const digits = text.split('')
    setOtp(digits)
    digits.forEach((digit, i) => {
      if (inputsRef.current[i]) {
        inputsRef.current[i]!.value = digit
      }
    })
    inputsRef.current[5]?.focus()
  }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!pendingEmail) return

  setLoading(true)
  const code = otp.join('')
  
  try {
    // ✅ UN SEUL APPEL : On envoie les données et on récupère la réponse de manière unique
    const response = await authAPI.verifyOtp({ 
      email: pendingEmail, 
      otp: code 
    })
    
    // On extrait proprement les variables fournies par ton interface de réponse
    const { user, access, refresh } = response.data
    
    // Mise à jour du store centralisé avec l'utilisateur et les jetons d'accès
    setAuth(user, access, refresh) 
    enqueueSnackbar('Authentification réussie !', { variant: 'success' })
    
    // Redirection dynamique et chirurgicale selon le rôle
    if (user.role === 'superadmin') {
      router.push('/admin')
    } else if (user.role === 'conformite') {
      router.push('/conformite')
    } else if (user.role === 'chef_produit') {
      router.push('/chef-produit')
    } else if (user.role === 'chef_agence') {
      router.push('/chef-agence') 
    } else {
      router.push('/') // Redirection par défaut si aucun rôle ne correspond
    }
  } catch (err: unknown) {
    const e = err as { response?: { data?: { detail?: string } } }
    const msg = e.response?.data?.detail || 'Code OTP invalide ou expiré.'
    enqueueSnackbar(msg, { variant: 'error' })
  } finally {
    setLoading(false)
  }
}

  const handleResend = async () => {
    if (!pendingEmail) return
    setLoading(true)
    try {
      await authAPI.login({ email: pendingEmail, password: '' }) // Adapté selon ta logique de renvoi pass-less ou reconnexion
      setCountdown(300)
      setOtp(['', '', '', '', '', ''])
      inputsRef.current[0]?.focus()
      enqueueSnackbar('Un nouveau code OTP a été envoyé.', { variant: 'info' })
    } catch {
      enqueueSnackbar('Erreur lors du renvoi du code.', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#090d16',
      backgroundImage: `
        radial-gradient(circle at 90% 10%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 10% 90%, rgba(29, 78, 216, 0.1) 0%, transparent 50%)
      `,
      p: 2,
    }}>
      <Fade in timeout={800}>
        <Card sx={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 4,
          boxShadow: '0 30px 60px -15px rgba(0,0,0,0.8)',
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(20px)',
          p: { xs: 4, md: 6 },
        }}>
          
          {/* Logo / Entête */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 5 }}>
            <Box sx={{
              p: 1, borderRadius: 2, bgcolor: '#2563eb',
              display: 'flex', boxShadow: '0 0 20px rgba(37,99,233,0.4)',
            }}>
              <ShieldOutlined sx={{ fontSize: 22, color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', letterSpacing: '0.5px' }}>
              PRESF <span style={{ color: '#3b82f6', fontWeight: 500 }}>ARCHIVIS</span>
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <MarkEmailReadOutlined sx={{ fontSize: 50, color: '#3b82f6', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1.5, letterSpacing: '-0.5px' }}>
              Vérification de sécurité
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 360, mx: 'auto', lineHeight: 1.5 }}>
              Nous avons envoyé un code de validation temporaire à l&apos;adresse : <br />
              <strong style={{ color: '#f1f5f9' }}>{pendingEmail}</strong>
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Grille des cases OTP */}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mb: 4 }} onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  ref={(el) => { inputsRef.current[index] = el }}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  style={{
                    width: '54px',
                    height: '58px',
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    color: '#f8fafc',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.3)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              ))}
            </Box>

            {/* Indicateur de Compte à rebours */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 4 }}>
              <Typography variant="body2" sx={{ color: countdown === 0 ? '#ef4444' : '#64748b', fontWeight: 600 }}>
                {countdown > 0 ? `Le code expire dans : ${formatTime(countdown)}` : 'Le code a expiré'}
              </Typography>
            </Box>

            <Button
              type="submit" fullWidth variant="contained"
              disabled={loading || otp.join('').length < 6 || countdown === 0}
              sx={{
                py: 1.8, 
                borderRadius: 2.5,
                bgcolor: '#3b82f6',
                color: '#ffffff',
                textTransform: 'none',
                fontSize: '0.95rem', 
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
                mb: 3,
                '&:hover': { 
                  bgcolor: '#2563eb',
                  boxShadow: '0 6px 25px rgba(59, 130, 246, 0.4)',
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(59, 130, 246, 0.2)',
                  color: 'rgba(255,255,255,0.3)'
                }
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Valider l\'accès'}
            </Button>

            <Typography variant="body2" align="center" sx={{ color: '#64748b' }}>
              Vous n&apos;avez pas reçu de mail ?{' '}
              <span
                onClick={countdown === 0 && !loading ? handleResend : undefined}
                style={{
                  color: countdown === 0 ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                  cursor: countdown === 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  textDecoration: countdown === 0 ? 'underline' : 'none',
                }}
              >
                Renvoyer un code
              </span>
            </Typography>
          </form>
        </Card>
      </Fade>
    </Box>
  )
}