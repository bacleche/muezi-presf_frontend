'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Grid, TextField, MenuItem, Alert, CircularProgress
} from '@mui/material'
import { SaveOutlined, ArrowBackOutlined } from '@mui/icons-material'
import { agenceAPI, paysAPI, villeAPI } from '@/lib/api'

// Interfaces calquées sur tes modèles Django
interface PaysBackend {
  id: number
  nom: string
}

interface VilleBackend {
  id: number
  nom: string
}

export default function NouvelleAgencePage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // États pour les données dynamiques de la BD
  const [listePays, setListePays]     = useState<PaysBackend[]>([])
  const [listeVilles, setListeVilles] = useState<VilleBackend[]>([])
  const [loadingPays, setLoadingPays] = useState(true)
  const [loadingVilles, setLoadingVilles] = useState(false)

  // Le formulaire stocke désormais des IDs numériques pour les clés étrangères
  const [form, setForm] = useState({ 
    nom: '', 
    code: '', 
    pays: '' as number | '', 
    ville: '' as number | '' 
  })

  // 1. Charger uniquement les pays actifs au montage du composant
  useEffect(() => {
    paysAPI.liste()
      .then(({ data }) => {
        // Gère la pagination si Django renvoie { results: [...] } ou un tableau brut
        setListePays(data.results ?? data)
      })
      .catch(() => setError('Impossible de charger la liste des pays.'))
      .finally(() => setLoadingPays(false))
  }, [])

  // 2. Charger les villes actives dès que le pays sélectionné change
  useEffect(() => {
    if (form.pays === '') {
      setListeVilles([])
      return
    }
    
    setLoadingVilles(true)
    setError('')
    
    // Filtrage côté serveur : Django ne renverra que les villes de ce pays
    villeAPI.liste({ pays: form.pays })
      .then(({ data }) => {
        setListeVilles(data.results ?? data)
      })
      .catch(() => setError('Erreur lors du chargement des villes associées.'))
      .finally(() => setLoadingVilles(false))
  }, [form.pays])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      
      // Si l'utilisateur change de pays, on remet obligatoirement la ville à zéro
      if (name === 'pays') {
        updated.ville = ''
      }
      return updated
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      // payload envoyé à Django : { nom, code, ville: ID }
      // Le code est automatiquement passé en majuscules pour rester propre
      await agenceAPI.creer({
        nom: form.nom,
        code: form.code.toUpperCase(),
        ville: form.ville
      })
      router.push('/admin/agences')
    } catch (err: unknown) {
      console.error(err)
      const e = err as { response?: { data?: Record<string, string[]> } }
      const msgs = Object.values(e.response?.data || {}).flat()
      setError(msgs[0] || "Erreur lors de la création de l'agence.")
    } finally {
      setLoading(false)
    }
  }

  // Sécurité de validation : tous les champs requis doivent être remplis
  const valide = !!form.nom && !!form.code && form.ville !== ''

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small"
          onClick={() => router.back()}>
          Retour
        </Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Nouvelle Agence</Typography>
          <Typography variant="body2" color="text.secondary">
            Créer un établissement et l'associer à une zone géographique active
          </Typography>
        </Box>
      </Box>

      <Card sx={{ maxWidth: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Nom de l'agence" name="nom"
                value={form.nom} onChange={handleChange} required
                placeholder="Ex: Agence Centrale Brazzaville" />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Code Unique" name="code"
                value={form.code} onChange={handleChange} required
                placeholder="Ex: BZV01"
                slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
                helperText="Identifiant unique de la succursale" />
            </Grid>

            {/* Sélecteur de Pays Dynamique */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Zone Pays" name="pays"
                value={form.pays} onChange={handleChange} required
                disabled={loadingPays}
                helperText={loadingPays ? "Chargement..." : "Sélectionner le territoire"}
              >
                {listePays.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Sélecteur de Ville en Cascade */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth select label="Ville" name="ville"
                value={form.ville} onChange={handleChange} required
                disabled={form.pays === '' || loadingVilles}
                helperText={
                  form.pays === '' 
                    ? "Choisissez d'abord un pays" 
                    : loadingVilles ? "Mise à jour..." : "Villes disponibles"
                }
              >
                {listeVilles.map((v) => (
                  <MenuItem key={v.id} value={v.id}>{v.nom}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained" size="large"
              onClick={handleSubmit}
              disabled={loading || !valide}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
              sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' }, px: 4 }}
            >
              Créer l'agence
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}