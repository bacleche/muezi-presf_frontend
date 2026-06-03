'use client'
import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Card, CardContent, Grid, TextField,
  MenuItem, Alert, CircularProgress, Divider, List, ListItem, ListItemText, Paper
} from '@mui/material'
import { ArrowBackOutlined, AddCardOutlined, ContactPageOutlined } from '@mui/icons-material'
import { clientAPI } from '@/lib/api'

interface Piece {
  id: number
  type_piece: string
  numero: string
  created_at: string
}

const TYPES_PIECES = [
  { value: 'cni', label: "Carte Nationale d'Identité" },
  { value: 'passport', label: 'Passeport' },
  { value: 'permis', label: 'Permis de conduire' },
  { value: 'niu', label: 'NIU (Numéro d\'Identification Unique)' },
]

export default function PiecesClientPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: clientId } = use(params) // Déballage des params Next.js
  // Ajoutez cet état
  const [file, setFile] = useState<File | null>(null)

  const [pieces, setPieces] = useState<Piece[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({ type_piece: '', numero: '' })
  // 1. On liste tous les types de pièces potentiels
    const TYPES_PIECES = [
      { value: 'cni', label: "Carte Nationale d'Identité" },
      { value: 'passport', label: 'Passeport' },
      { value: 'permis', label: 'Permis de conduire' },
      { value: 'niu', label: 'NIU (Numéro d\'Identification Unique)' },
    ];

    // 2. Le calcul du filtrage (se met à jour quand 'pieces' change)
    

  const chargerPieces = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await clientAPI.pieces(Number(clientId))
      setPieces(data)
    } catch (err) {
      console.error(err)
      setError('Erreur lors de la récupération des pièces d’identité.')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    chargerPieces()
  }, [chargerPieces])

  useEffect(() => {
  console.log("Pièces chargées depuis l'API :", pieces);
}, [pieces]);

  const handleAjouterPiece = async (e: React.FormEvent) => {
  e.preventDefault()
  setSubmitting(true)
  setError('')
  setSuccess('')

  const formData = new FormData()
  formData.append('type_piece', form.type_piece)
  formData.append('numero', form.numero)
  
  // N'ajoutez le fichier que s'il est présent
  if (file) {
    formData.append('fichier', file) 
  }

  try {
    const { data } = await clientAPI.ajouterPiece(Number(clientId), formData)
    setPieces((prev) => [...prev, data])
    setSuccess('Nouvelle pièce ajoutée avec succès.')
    setForm({ type_piece: '', numero: '' })
    setFile(null) // Reset du fichier
  } catch (err: any) {
    console.log("Erreur serveur :", err.response?.data);
      
      // On affiche le message d'erreur spécifique du backend s'il existe
      const errorMessage = err.response?.data?.detail || 
                           err.response?.data?.type_piece?.[0] || 
                           "Erreur lors de l'ajout. Vérifiez les informations.";
      setError(errorMessage);
  } finally {
    setSubmitting(false)
  }
}

  // Filtrer les types de pièces déjà possédés par le client pour éviter les erreurs Front
  const typesDisponibles = TYPES_PIECES.filter(
    (t) => !pieces.some((p) => p.type_piece === t.value)
  )

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small" onClick={() => router.push('/chef-agence/clients')}>
          Clients
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Dossier Nationalité & Pièces</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={4}>
        {/* Liste des pièces existantes */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Pièces d'identité enregistrées</Typography>
          {loading ? (
            <CircularProgress size={24} />
          ) : pieces.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary', bgcolor: '#fafafa', border: '1px dashed #ccc' }}>
              Aucune pièce d'identité associée à ce client pour le moment.
            </Paper>
          ) : (
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <List disablePadding>
                {pieces.map((p, idx) => (
                  <Box key={p.id}>
                    {/* Correction : On réintègre la balise ouvrante ListItem avec l'icône */}
                    <ListItem sx={{ py: 2 }}>
                      <ContactPageOutlined sx={{ color: '#0D47A1', mr: 2 }} />
                      <ListItemText
                        primary={TYPES_PIECES.find((t) => t.value === p.type_piece)?.label || p.type_piece}
                        secondary={`Numéro : ${p.numero}`}
                        slotProps={{
                          primary: {
                            sx: { fontWeight: 600 }
                          },
                          secondary: {
                            sx: { 
                              fontFamily: 'monospace', 
                              color: 'primary.main', 
                              fontWeight: 700 
                            }
                          }
                        }}
                      />
                    </ListItem>
                    {idx < pieces.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </Paper>
          )}
        </Grid>

        {/* Formulaire d'ajout rapide */}
      {/* Formulaire d'ajout rapide (Version nettoyée) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Ajouter une nouvelle pièce
              </Typography>
              
              {typesDisponibles.length === 0 ? (
                <Alert severity="info">
                  Le dossier de conformité de ce client dispose déjà de toutes les pièces d'identité principales requises.
                </Alert>
              ) : (
                <form onSubmit={handleAjouterPiece}>
                  <Grid container spacing={2}>
                    {/* 1. Sélection du type de pièce */}
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        select
                        size="small"
                        label="Type de pièce"
                        value={form.type_piece}
                        onChange={(e) => setForm({ ...form, type_piece: e.target.value })}
                        required
                      >
                        {typesDisponibles.map((t) => (
                          <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {/* 2. Saisie du numéro */}
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Numéro de la pièce"
                        placeholder="Ex: CNI-99281-B"
                        value={form.numero}
                        onChange={(e) => setForm({ ...form, numero: e.target.value.toUpperCase().trim() })}
                        required
                      />
                    </Grid>

                    {/* 3. Bouton d'upload du fichier */}
                    <Grid size={{ xs: 12 }}>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{ mt: 1, py: 1.5, borderStyle: 'dashed' }}
                      >
                        {file ? file.name : "Sélectionner le fichier (Scan)"}
                        <input 
                          type="file" 
                          hidden 
                          onChange={(e) => setFile(e.target.files?.[0] || null)} 
                        />
                      </Button>
                    </Grid>
                  </Grid>

                  {/* Bouton de soumission */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={submitting || !form.type_piece || !form.numero}
                    startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <AddCardOutlined />}
                    sx={{ mt: 3, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none' }}
                  >
                    Lier la pièce au client
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}