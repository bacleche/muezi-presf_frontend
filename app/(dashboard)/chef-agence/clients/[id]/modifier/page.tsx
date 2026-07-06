'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

import {
  Box, Typography, Card, CardContent, Button,
  Grid, TextField, Alert, CircularProgress
} from '@mui/material'
import { SaveOutlined, ArrowBackOutlined } from '@mui/icons-material'
import { clientAPI } from '@/lib/api'

export default function ModifierClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = Number(params.id)

  const [loadingData, setLoadingData] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    // adresse: '',
  })

  // ── Charger les données actuelles du client ──────────────────
  useEffect(() => {
    if (!clientId) return
    clientAPI.detail(clientId)
      .then(({ data }) => {
        setForm({
          nom:       data.nom || '',
          prenom:    data.prenom || '',
          telephone: data.telephone || '',
          email:     data.email || '',
        //   adresse:   data.adresse || '',
        })
      })
      .catch(() => setError('Impossible de charger les informations du client.'))
      .finally(() => setLoadingData(false))
  }, [clientId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await clientAPI.modifier(clientId, {
        nom:       form.nom.trim(),
        prenom:    form.prenom.trim(),
        telephone: form.telephone.trim(),
        email:     form.email.trim(),
        // adresse:   form.adresse.trim(),
      })
      router.push('/chef-agence/clients')
    } catch (err: any) {
      console.error("Erreur API:", err)
      const msgs = err.response?.data ? Object.values(err.response.data).flat() : ["Erreur lors de la modification."]
      setError(typeof msgs[0] === 'string' ? msgs[0] : "Une erreur est survenue.")
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small" onClick={() => router.back()}>
          Retour
        </Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Modifier le Client</Typography>
          <Typography variant="body2" color="text.secondary">
            Corriger les informations enregistrées
          </Typography>
        </Box>
      </Box>

      <Card sx={{ maxWidth: 650, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Nom" name="nom" value={form.nom} onChange={handleChange} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth type="email" label="Email" name="email" value={form.email} onChange={handleChange} />
              </Grid>
              {/* <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Adresse" name="adresse" value={form.adresse} onChange={handleChange} />
              </Grid> */}
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit" variant="contained" size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} /> : <SaveOutlined />}
                sx={{ bgcolor: '#0D47A1', px: 4 }}
              >
                Enregistrer les modifications
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}