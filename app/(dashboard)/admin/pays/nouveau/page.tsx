'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Grid, TextField, Alert, CircularProgress
} from '@mui/material'
import { SaveOutlined, ArrowBackOutlined } from '@mui/icons-material'
import { paysAPI } from '@/lib/api'

export default function NouveauPaysPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [form, setForm] = useState({
    nom: '',
    code: '', // Aligné sur le modèle Django
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await paysAPI.creer(form)
      router.push('/admin/pays')
    } catch (err: unknown) {
      console.error(err)
      const e = err as { response?: { data?: Record<string, string[]> } }
      const msgs = Object.values(e.response?.data || {}).flat()
      setError(msgs[0] || 'Erreur lors de la création du pays.')
    } finally {
      setLoading(false)
    }
  }

  const valide = !!form.nom && !!form.code

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button 
          startIcon={<ArrowBackOutlined />} 
          variant="outlined" 
          size="small"
          onClick={() => router.push('/admin/pays')}
        >
          Retour
        </Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Nouveau Pays</Typography>
          <Typography variant="body2" color="text.secondary">
            Ajouter une zone géographique territoriale
          </Typography>
        </Box>
      </Box>

      <Card sx={{ maxWidth: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField 
                fullWidth 
                label="Nom du pays" 
                name="nom"
                placeholder="Ex: République du Congo"
                value={form.nom} 
                onChange={handleChange} 
                required 
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField 
                fullWidth 
                label="Code Pays" 
                name="code"
                placeholder="Ex: CG"
                value={form.code} 
                onChange={handleChange} 
                required 
                helperText="Identifiant ou trigramme unique (ex: CG, FR, RDC)"
                slotProps={{
                  htmlInput: { maxLength: 10 } // Aligné sur max_length=10 de Django
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained" 
              size="large"
              onClick={handleSubmit}
              disabled={loading || !valide}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
              sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' }, px: 4 }}
            >
              Enregistrer le pays
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}