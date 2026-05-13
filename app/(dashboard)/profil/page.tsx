'use client'
import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, Button,
  Grid, TextField, Divider, Alert, CircularProgress,
  Avatar, Chip
} from '@mui/material'
import {
  PersonOutlined, LockOutlined, SaveOutlined,
  BadgeOutlined, BusinessOutlined
} from '@mui/icons-material'
import { userAPI } from '@/lib/api'
import useAuthStore from '@/store/authStore'

const ROLE_LABELS: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'warning' }> = {
  caissier:   { label: 'Caissier',    color: 'default'   },
  conformite: { label: 'Conformité',  color: 'primary'   },
  superadmin: { label: 'Super Admin', color: 'secondary' },
}

export default function ProfilPage() {
  const user    = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)

  const [successInfo, setSuccessInfo]   = useState('')
  const [errorInfo,   setErrorInfo]     = useState('')
  const [loadingInfo, setLoadingInfo]   = useState(false)

  const [successMdp, setSuccessMdp]   = useState('')
  const [errorMdp,   setErrorMdp]     = useState('')
  const [loadingMdp, setLoadingMdp]   = useState(false)

  const [form, setForm] = useState({
    nom:    user?.nom    ?? '',
    prenom: user?.prenom ?? '',
    email:  user?.email  ?? '',
  })

  const [mdp, setMdp] = useState({
    ancien:      '',
    nouveau:     '',
    confirmation:'',
  })

  const handleChangeForm = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleChangeMdp = (e: React.ChangeEvent<HTMLInputElement>) =>
    setMdp({ ...mdp, [e.target.name]: e.target.value })

  const sauvegarderInfos = async () => {
    setLoadingInfo(true)
    setErrorInfo('')
    setSuccessInfo('')
    try {
      const { data } = await userAPI.modifier(user!.id, {
        nom:    form.nom,
        prenom: form.prenom,
      })
      // Mettre à jour le store
      setAuth(data, useAuthStore.getState().accessToken!, useAuthStore.getState().refreshToken!)
      setSuccessInfo('Informations mises à jour avec succès.')
    } catch {
      setErrorInfo('Erreur lors de la mise à jour.')
    } finally {
      setLoadingInfo(false)
    }
  }

  const changerMotDePasse = async () => {
    setErrorMdp('')
    setSuccessMdp('')

    if (mdp.nouveau !== mdp.confirmation) {
      setErrorMdp('Les mots de passe ne correspondent pas.')
      return
    }
    if (mdp.nouveau.length < 8) {
      setErrorMdp('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoadingMdp(true)
    try {
      await userAPI.changerMotDePasse(user!.id, {
        old_password: mdp.ancien,
        new_password: mdp.nouveau,
      })
      setSuccessMdp('Mot de passe modifié avec succès.')
      setMdp({ ancien: '', nouveau: '', confirmation: '' })
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } }
      const msgs = Object.values(e.response?.data || {}).flat()
      setErrorMdp(msgs[0] || 'Erreur lors du changement de mot de passe.')
    } finally {
      setLoadingMdp(false)
    }
  }

  if (!user) return null

  const initiales = `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`
  const roleConfig = ROLE_LABELS[user.role] ?? { label: user.role, color: 'default' as const }

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>

      {/* ── Header profil ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{
              width: 72, height: 72, fontSize: 26, fontWeight: 700,
              background: 'linear-gradient(135deg, #1e293b, #0D47A1)',
            }}>
              {initiales}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {user.prenom} {user.nom}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {user.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={roleConfig.label}
                  color={roleConfig.color}
                  size="small"
                  icon={<BadgeOutlined />}
                />
                {(user as { agence_nom?: string }).agence_nom && (
                  <Chip
                    label={(user as { agence_nom?: string }).agence_nom}
                    size="small"
                    variant="outlined"
                    icon={<BusinessOutlined />}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>

        {/* ── Informations personnelles ── */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <PersonOutlined sx={{ color: '#0D47A1' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Informations personnelles
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {successInfo && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessInfo('')}>
                  {successInfo}
                </Alert>
              )}
              {errorInfo && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorInfo('')}>
                  {errorInfo}
                </Alert>
              )}

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth label="Prénom" name="prenom"
                    value={form.prenom} onChange={handleChangeForm}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth label="Nom" name="nom"
                    value={form.nom} onChange={handleChangeForm}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth label="Email" name="email"
                    value={form.email}
                    disabled
                    helperText="L'email ne peut pas être modifié"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={sauvegarderInfos}
                  disabled={loadingInfo}
                  startIcon={loadingInfo ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
                >
                  Sauvegarder
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Changer mot de passe ── */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <LockOutlined sx={{ color: '#0D47A1' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Changer le mot de passe
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {successMdp && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMdp('')}>
                  {successMdp}
                </Alert>
              )}
              {errorMdp && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMdp('')}>
                  {errorMdp}
                </Alert>
              )}

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth label="Mot de passe actuel" name="ancien"
                    type="password" value={mdp.ancien}
                    onChange={handleChangeMdp}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth label="Nouveau mot de passe" name="nouveau"
                    type="password" value={mdp.nouveau}
                    onChange={handleChangeMdp}
                    helperText="Minimum 8 caractères"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth label="Confirmer le mot de passe" name="confirmation"
                    type="password" value={mdp.confirmation}
                    onChange={handleChangeMdp}
                    error={mdp.confirmation !== '' && mdp.nouveau !== mdp.confirmation}
                    helperText={
                      mdp.confirmation !== '' && mdp.nouveau !== mdp.confirmation
                        ? 'Les mots de passe ne correspondent pas'
                        : ''
                    }
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={changerMotDePasse}
                  disabled={
                    loadingMdp ||
                    !mdp.ancien ||
                    !mdp.nouveau ||
                    !mdp.confirmation
                  }
                  startIcon={loadingMdp ? <CircularProgress size={18} color="inherit" /> : <LockOutlined />}
                >
                  Changer le mot de passe
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  )
}