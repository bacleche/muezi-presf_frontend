'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Grid, TextField, MenuItem, Alert, CircularProgress,
  Divider
} from '@mui/material'
import { SaveOutlined, ArrowBackOutlined } from '@mui/icons-material'
import { userAPI, agenceAPI } from '@/lib/api'

interface Agence { id: number; nom: string; code: string; ville: string }

const ROLES = [
  { value: 'caissier',   label: 'Caissier'    },
  { value: 'conformite', label: 'Conformité'  },
  { value: 'superadmin', label: 'Super Admin' },
]

export default function NouvelUtilisateurPage() {
  const router = useRouter()
  const [agences, setAgences]   = useState<Agence[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const [form, setForm] = useState({
    email: '', nom: '', prenom: '',
    role: '', password: '', agence: '',
  })

//   useEffect(() => {
//     agenceAPI.liste().then(({ data }) => setAgences(data.results ?? data))
//   }, [])

useEffect(() => {
  agenceAPI.liste().then(({ data }: { data: { results?: Agence[]; length?: number } & Agence[] }) =>
    setAgences(data.results ?? data)
  )
}, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const payload: Record<string, string> = { ...form }
      if (form.role !== 'caissier') delete payload.agence
      await userAPI.creer(payload)
      router.push('/admin/utilisateurs')
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } }
      const msgs = Object.values(e.response?.data || {}).flat()
      setError(msgs[0] || 'Erreur lors de la création.')
    } finally {
      setLoading(false)
    }
  }

  const valide = form.email && form.nom && form.prenom && form.role && form.password &&
    (form.role !== 'caissier' || form.agence)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small"
          onClick={() => router.back()}>
          Retour
        </Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Nouvel utilisateur</Typography>
          <Typography variant="body2" color="text.secondary">
            Créer un compte et définir les accès
          </Typography>
        </Box>
      </Box>

      <Card sx={{ maxWidth: 640 }}>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Identité
          </Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Prénom" name="prenom"
                value={form.prenom} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Nom" name="nom"
                value={form.nom} onChange={handleChange} required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Email" name="email" type="email"
                value={form.email} onChange={handleChange} required />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Accès
          </Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth select label="Rôle" name="role"
                value={form.role} onChange={handleChange} required>
                {ROLES.map((r) => (
                  <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {form.role === 'caissier' && (
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth select label="Agence" name="agence"
                  value={form.agence} onChange={handleChange} required>
                  {agences.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.nom} — {a.ville}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Mot de passe" name="password"
                type="password" value={form.password} onChange={handleChange}
                required helperText="Minimum 8 caractères" />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained" size="large"
              onClick={handleSubmit}
              disabled={loading || !valide}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
            >
              Créer l'utilisateur
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}