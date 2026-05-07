'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Card, TextField, Button, Typography,
  CircularProgress, InputAdornment, IconButton, Fade
} from '@mui/material'
import {
  Visibility, VisibilityOff, LockOutlined,
  EmailOutlined, ShieldOutlined, AutoGraphOutlined
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { authAPI } from '@/lib/api'
import useAuthStore from '@/store/authStore'

export default function LoginPage() {
  const router          = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const setAuth         = useAuthStore((s) => s.setAuth)
  const setPendingEmail = useAuthStore((s) => s.setPendingEmail)

  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      setPendingEmail(data.email)
      enqueueSnackbar('Code OTP envoyé à votre adresse email.', { variant: 'info' })
      router.push('/verify-otp')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      const msg = e.response?.data?.detail || 'Identifiants incorrects.'
      enqueueSnackbar(msg, { variant: 'error' })
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
      backgroundColor: '#0f172a',
      backgroundImage: `
        radial-gradient(circle at 2% 10%, rgba(30, 64, 175, 0.2) 0%, transparent 40%),
        radial-gradient(circle at 98% 90%, rgba(30, 64, 175, 0.15) 0%, transparent 40%)
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

          {/* ── PANNEAU GAUCHE Branding ── */}
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
                L&apos;intelligence au service de vos archives.
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '1.05rem' }}>
                Plateforme centralisée de gestion et de conformité documentaire.
              </Typography>
            </Box>

            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.03)', p: 3, borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <AutoGraphOutlined sx={{ color: '#3b82f6' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Statistiques en temps réel
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Suivez chaque modification et validation avec une précision chirurgicale.
              </Typography>
            </Box>
          </Box>

          {/* ── PANNEAU DROIT Formulaire ── */}
          <Box sx={{
            width: { xs: '100%', md: '55%' },
            bgcolor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 4, md: 8 },
          }}>
            <Box sx={{ width: '100%', maxWidth: 360 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }} gutterBottom>
                  Connexion
                </Typography>
                <Typography variant="body2" color="#64748b">
                  Veuillez entrer vos accès pour continuer.
                </Typography>
              </Box>

              <form onSubmit={handleSubmit}>
                <Typography variant="caption" sx={{ fontWeight: 700, ml: 1, mb: 1, display: 'block', color: '#475569' }}>
                  ADRESSE EMAIL
                </Typography>
                <TextField
                  fullWidth name="email"
                  placeholder="nom@entreprise.com"
                  variant="outlined"
                  value={form.email}
                  onChange={handleChange}
                  required
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#f8fafc', borderRadius: 2,
                      '&:hover fieldset': { borderColor: '#3b82f6' },
                    },
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined sx={{ fontSize: 20, color: '#94a3b8' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Typography variant="caption" sx={{ fontWeight: 700, ml: 1, mb: 1, display: 'block', color: '#475569' }}>
                  MOT DE PASSE
                </Typography>
                <TextField
                  fullWidth name="password"
                  type={showPass ? 'text' : 'password'}
                  variant="outlined"
                  value={form.password}
                  onChange={handleChange}
                  required
                  sx={{
                    mb: 4,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#f8fafc', borderRadius: 2,
                      '&:hover fieldset': { borderColor: '#3b82f6' },
                    },
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined sx={{ fontSize: 20, color: '#94a3b8' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPass(!showPass)} edge="end">
                            {showPass ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Button
                  type="submit" fullWidth variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.8, borderRadius: 2,
                    bgcolor: '#1e293b',
                    textTransform: 'none',
                    fontSize: '1rem', fontWeight: 700,
                    '&:hover': { bgcolor: '#0f172a' },
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  }}
                >
                  {loading
                    ? <CircularProgress size={24} color="inherit" />
                    : 'Accéder au Dashboard'
                  }
                </Button>
              </form>

              <Typography variant="body2" align="center" sx={{ mt: 4, color: '#94a3b8' }}>
                Besoin d&apos;aide ?{' '}
                <span style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}>
                  Contacter le support
                </span>
              </Typography>
            </Box>
          </Box>
        </Card>
      </Fade>
    </Box>
  )
}