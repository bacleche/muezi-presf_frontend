'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Grid, TextField, MenuItem, Alert, CircularProgress
} from '@mui/material'
import { SaveOutlined, ArrowBackOutlined } from '@mui/icons-material'
import { villeAPI, paysAPI } from '@/lib/api'

interface Pays {
  id: number
  nom: string
  code_iso: string
}

export default function NouvelleVillePage() {
  const router = useRouter()
  const [listePays, setListePays] = useState<Pays[]>([])
  const [loading, setLoading]     = useState(false)
  const [loadingPays, setLoadingPays] = useState(true)
  const [error, setError]         = useState('')

  const [form, setForm] = useState({
    nom: '',
    pays: '' as number | ''
  })

  // Charger les pays pour le sélecteur déroulant
  useEffect(() => {
    paysAPI.liste()
      .then(({ data }) => {
        setListePays(data.results ?? data)
      })
      .catch((err) => {
        console.error(err)
        setError('Impossible de charger la liste des pays.')
      })
      .finally(() => {
        setLoadingPays(false)
      })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'pays' ? Number(value) : value
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await villeAPI.creer(form)
      router.push('/admin/villes')
    } catch (err: unknown) {
      console.error(err)
      const e = err as { response?: { data?: Record<string, string[]> } }
      const msgs = Object.values(e.response?.data || {}).flat()
      setError(msgs[0] || 'Erreur lors de la création de la ville.')
    } finally {
      setLoading(false)
    }
  }

  const valide = !!form.nom && form.pays !== ''

  return (
    <Box sx={{ p: 1 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button 
          startIcon={<ArrowBackOutlined />} 
          variant="outlined" 
          size="small"
          onClick={() => router.push('/admin/villes')}
        >
          Retour
        </Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Nouvelle Ville</Typography>
          <Typography variant="body2" color="text.secondary">
            Enregistrer une ville et la rattacher à son pays d'appartenance
          </Typography>
        </Box>
      </Box>

      {/* Formulaire */}
      <Card sx={{ maxWidth: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField 
                fullWidth 
                label="Nom de la ville" 
                name="nom"
                placeholder="Ex: Brazzaville"
                value={form.nom} 
                onChange={handleChange} 
                required 
                disabled={loadingPays}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField 
                fullWidth 
                select 
                label="Pays d'affiliation" 
                name="pays"
                value={form.pays} 
                onChange={handleChange} 
                required
                disabled={loadingPays}
                helperText={loadingPays ? "Chargement des pays..." : "Sélectionnez le pays associé"}
              >
                {listePays.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.nom} ({p.code_iso})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained" 
              size="large"
              onClick={handleSubmit}
              disabled={loading || !valide || loadingPays}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
              sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' }, px: 4 }}
            >
              Enregistrer la ville
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}