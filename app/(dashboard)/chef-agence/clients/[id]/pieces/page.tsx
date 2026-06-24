'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Grid ,Button, Card, CardContent, TextField,
  MenuItem, Alert, CircularProgress, Divider, List, ListItem, ListItemText, Paper
} from '@mui/material'
import { ArrowBackOutlined, AddCardOutlined, ContactPageOutlined, PhotoCamera } from '@mui/icons-material'
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
  const { id: clientId } = use(params)
  
  const [file, setFile] = useState<File | null>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ type_piece: '', numero: '' })

  useEffect(() => {
    if (!clientId) return
    clientAPI.pieces(Number(clientId))
      .then(({ data }) => setPieces(data))
      .catch(() => setError('Erreur lors de la récupération des pièces.'))
      .finally(() => setLoading(false))
  }, [clientId])

  const handleAjouterPiece = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('type_piece', form.type_piece)
    formData.append('numero', form.numero)
    if (file) formData.append('fichier', file) 

    try {
      const { data } = await clientAPI.ajouterPiece(Number(clientId), formData)
      setPieces((prev) => [...prev, data])
      setSuccess('Pièce ajoutée avec succès.')
      setForm({ type_piece: '', numero: '' })
      setFile(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'ajout.")
    } finally {
      setSubmitting(false)
    }
  }

  const typesDisponibles = TYPES_PIECES.filter(
    (t) => !pieces.some((p) => p.type_piece?.toLowerCase() === t.value)
  )

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small" onClick={() => router.push('/chef-agence/clients')}>
          Clients
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Dossier & Pièces</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={4}>
        {/* Liste des pièces */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Pièces enregistrées</Typography>
          {loading ? <CircularProgress size={24} /> : pieces.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fafafa', border: '1px dashed #ccc' }}>Aucune pièce.</Paper>
          ) : (
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <List disablePadding>
                {pieces.map((p, idx) => {
                  const pieceInfo = TYPES_PIECES.find(t => t.value === p.type_piece?.toLowerCase());
                  return (
                    <Box key={p.id}>
                      <ListItem sx={{ py: 2 }}>
                        <ContactPageOutlined sx={{ color: '#0D47A1', mr: 2 }} />
                        <ListItemText
                          primary={pieceInfo ? pieceInfo.label : p.type_piece}
                          secondary={`Numéro : ${p.numero}`}
                        />
                      </ListItem>
                      {idx < pieces.length - 1 && <Divider />}
                    </Box>
                  )
                })}
              </List>
            </Paper>
          )}
        </Grid>

        {/* Formulaire d'ajout */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Ajouter une pièce</Typography>
              {typesDisponibles.length === 0 ? <Alert severity="info">Dossier complet.</Alert> : (
                <form onSubmit={handleAjouterPiece}>
                  <TextField fullWidth select size="small" label="Type de pièce" value={form.type_piece} onChange={(e) => setForm({...form, type_piece: e.target.value})} sx={{ mb: 2 }} required>
                    {typesDisponibles.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </TextField>
                  <TextField fullWidth size="small" label="Numéro" value={form.numero} onChange={(e) => setForm({...form, numero: e.target.value.toUpperCase().trim()})} sx={{ mb: 2 }} required />
                  
                  <Button
                    variant={file ? "contained" : "outlined"}
                    color={file ? "success" : "primary"}
                    component="label" fullWidth startIcon={<PhotoCamera />}
                    sx={{ py: 1.5, borderStyle: 'dashed' }}
                  >
                    {file ? 'Image prête' : "Prendre Photo / Upload"}
                    <input type="file" hidden accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </Button>

                  <Button type="submit" fullWidth variant="contained" disabled={submitting || !file} sx={{ mt: 3, bgcolor: '#0f172a' }}>
                    {submitting ? <CircularProgress size={20} /> : "Lier la pièce"}
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