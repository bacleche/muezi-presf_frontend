'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Grid, TextField, MenuItem, Alert, CircularProgress
} from '@mui/material'
import { SaveOutlined, ArrowBackOutlined } from '@mui/icons-material'
import { agenceAPI } from '@/lib/api'

const VILLES = [
  { value: 'brazzaville',  label: 'Brazzaville'  },
  { value: 'pointe_noire', label: 'Pointe-Noire' },
  { value: 'ouesso',       label: 'Ouesso'        },
]

export default function NouvelleAgencePage() {
  const router  = useRouter()
  const [form, setForm]     = useState({ nom: '', code: '', ville: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await agenceAPI.creer(form)
      router.push('/admin/agences')
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } }
      const msgs = Object.values(e.response?.data || {}).flat()
      setError(msgs[0] || 'Erreur lors de la création.')
    } finally {
      setLoading(false)
    }
  }

  const valide = form.nom && form.code && form.ville

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small"
          onClick={() => router.back()}>
          Retour
        </Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Nouvelle agence</Typography>
          <Typography variant="body2" color="text.secondary">
            Créer une agence et l'associer à une ville
          </Typography>
        </Box>
      </Box>

      <Card sx={{ maxWidth: 480 }}>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Nom de l'agence" name="nom"
                value={form.nom} onChange={handleChange} required
                placeholder="Ex: Agence centrale" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Code" name="code"
                value={form.code} onChange={handleChange} required
                placeholder="Ex: BZV-001"
                helperText="Identifiant unique, sera mis en majuscules" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth select label="Ville" name="ville"
                value={form.ville} onChange={handleChange} required>
                {VILLES.map((v) => (
                  <MenuItem key={v.value} value={v.value}>{v.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained" size="large"
              onClick={handleSubmit}
              disabled={loading || !valide}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
            >
              Créer l'agence
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}