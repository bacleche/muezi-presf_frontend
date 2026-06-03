'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Grid, TextField, MenuItem, Alert, CircularProgress
} from '@mui/material'
import { SaveOutlined, ArrowBackOutlined } from '@mui/icons-material'
import { produitAPI } from '@/lib/api'

// Alignement strict avec les NOMS de ton modèle Django
const OPTIONS_PRODUITS = [
  { value: 'western_union', label: 'Western Union' },
  { value: 'change',        label: 'Change' },
  { value: 'visa',          label: 'VISA' },
  { value: 'momo',          label: 'MOMO' },
  { value: 'airtel_money',  label: 'Airtel Money' },
]

export default function NouveauProduitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [nom, setNom]         = useState('')

  const handleSubmit = async () => {
    if (!nom) return
    setLoading(true)
    setError('')
    
    try {
      // Ton modèle n'attend que le champ 'nom' (la clé technique, ex: 'western_union')
      await produitAPI.creer({ nom })
      router.push('/admin/produits')
    } catch (err: unknown) {
      console.error(err)
      const e = err as { response?: { data?: Record<string, string[]> } }
      const msgs = Object.values(e.response?.data || {}).flat()
      setError(msgs[0] || "Ce produit existe déjà ou ne peut pas être créé.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button 
          startIcon={<ArrowBackOutlined />} 
          variant="outlined" 
          size="small"
          onClick={() => router.back()}
        >
          Retour
        </Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Activer un Produit</Typography>
          <Typography variant="body2" color="text.secondary">
            Sélectionner un produit financier à ajouter au catalogue opérationnel
          </Typography>
        </Box>
      </Box>

      <Card sx={{ maxWidth: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                label="Choisir le produit"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                helperText="Sélectionnez l'un des services supportés par le système"
              >
                {OPTIONS_PRODUITS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
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
              disabled={loading || !nom}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
              sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' }, px: 4, textTransform: 'none', borderRadius: 2 }}
            >
              Enregistrer le produit
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}