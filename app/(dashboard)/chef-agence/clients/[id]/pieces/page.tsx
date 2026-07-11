// 'use client'
// import { useEffect, useState, use } from 'react'
// import { useRouter } from 'next/navigation'
// import {
//   Box, Typography, Grid ,Button, Card, CardContent, TextField,
//   MenuItem, Alert, CircularProgress, Divider, List, ListItem, ListItemText, Paper
// } from '@mui/material'
// import { ArrowBackOutlined, AddCardOutlined, ContactPageOutlined, PhotoCamera } from '@mui/icons-material'
// import { clientAPI } from '@/lib/api'

// interface Piece {
//   id: number
//   type_piece: string
//   numero: string
//   created_at: string
// }

// const TYPES_PIECES = [
//   { value: 'cni', label: "Carte Nationale d'Identité" },
//   { value: 'passport', label: 'Passeport' },
//   { value: 'permis', label: 'Permis de conduire' },
//   { value: 'niu', label: 'NIU (Numéro d\'Identification Unique)' },
// ]

// export default function PiecesClientPage({ params }: { params: Promise<{ id: string }> }) {
//   const router = useRouter()
//   const { id: clientId } = use(params)
  
//   const [file, setFile] = useState<File | null>(null)
//   const [pieces, setPieces] = useState<Piece[]>([])
//   const [loading, setLoading] = useState(true)
//   const [submitting, setSubmitting] = useState(false)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')
//   const [form, setForm] = useState({ type_piece: '', numero: '' })

//   useEffect(() => {
//     if (!clientId) return
//     clientAPI.pieces(Number(clientId))
//       .then(({ data }) => setPieces(data))
//       .catch(() => setError('Erreur lors de la récupération des pièces.'))
//       .finally(() => setLoading(false))
//   }, [clientId])

//   const handleAjouterPiece = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setSubmitting(true)
//     setError('')
//     setSuccess('')

//     const formData = new FormData()
//     formData.append('type_piece', form.type_piece)
//     formData.append('numero', form.numero)
//     if (file) formData.append('fichier', file) 

//     try {
//       const { data } = await clientAPI.ajouterPiece(Number(clientId), formData)
//       setPieces((prev) => [...prev, data])
//       setSuccess('Pièce ajoutée avec succès.')
//       setForm({ type_piece: '', numero: '' })
//       setFile(null)
//     } catch (err: any) {
//       setError(err.response?.data?.detail || "Erreur lors de l'ajout.")
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const typesDisponibles = TYPES_PIECES.filter(
//     (t) => !pieces.some((p) => p.type_piece?.toLowerCase() === t.value)
//   )

//   return (
//     <Box sx={{ p: 1 }}>
//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
//         <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small" onClick={() => router.push('/chef-agence/clients')}>
//           Clients
//         </Button>
//         <Typography variant="h5" sx={{ fontWeight: 700 }}>Dossier & Pièces</Typography>
//       </Box>

//       {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
//       {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

//       <Grid container spacing={4}>
//         {/* Liste des pièces */}
//         <Grid size={{ xs: 12, md: 6 }}>
//           <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Pièces enregistrées</Typography>
//           {loading ? <CircularProgress size={24} /> : pieces.length === 0 ? (
//             <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fafafa', border: '1px dashed #ccc' }}>Aucune pièce.</Paper>
//           ) : (
//             <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
//               <List disablePadding>
//                 {pieces.map((p, idx) => {
//                   const pieceInfo = TYPES_PIECES.find(t => t.value === p.type_piece?.toLowerCase());
//                   return (
//                     <Box key={p.id}>
//                       <ListItem sx={{ py: 2 }}>
//                         <ContactPageOutlined sx={{ color: '#0D47A1', mr: 2 }} />
//                         <ListItemText
//                           primary={pieceInfo ? pieceInfo.label : p.type_piece}
//                           secondary={`Numéro : ${p.numero}`}
//                         />
//                       </ListItem>
//                       {idx < pieces.length - 1 && <Divider />}
//                     </Box>
//                   )
//                 })}
//               </List>
//             </Paper>
//           )}
//         </Grid>

//         {/* Formulaire d'ajout */}
//         <Grid size={{ xs: 12, md: 6 }}>
//           <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderRadius: 3 }}>
//             <CardContent sx={{ p: 3 }}>
//               <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Ajouter une pièce</Typography>
//               {typesDisponibles.length === 0 ? <Alert severity="info">Dossier complet.</Alert> : (
//                 <form onSubmit={handleAjouterPiece}>
//                   <TextField fullWidth select size="small" label="Type de pièce" value={form.type_piece} onChange={(e) => setForm({...form, type_piece: e.target.value})} sx={{ mb: 2 }} required>
//                     {typesDisponibles.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
//                   </TextField>
//                   <TextField fullWidth size="small" label="Numéro" value={form.numero} onChange={(e) => setForm({...form, numero: e.target.value.toUpperCase().trim()})} sx={{ mb: 2 }} required />
                  
//                   <Button
//                     variant={file ? "contained" : "outlined"}
//                     color={file ? "success" : "primary"}
//                     component="label" fullWidth startIcon={<PhotoCamera />}
//                     sx={{ py: 1.5, borderStyle: 'dashed' }}
//                   >
//                     {file ? 'Image prête' : "Prendre Photo / Upload"}
//                     <input type="file" hidden accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] || null)} />
//                   </Button>

//                   <Button type="submit" fullWidth variant="contained" disabled={submitting || !file} sx={{ mt: 3, bgcolor: '#0f172a' }}>
//                     {submitting ? <CircularProgress size={20} /> : "Lier la pièce"}
//                   </Button>
//                 </form>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>
//     </Box>
//   )
// }

'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Grid ,Button, Card, CardContent, TextField,
  MenuItem, Alert, CircularProgress, Divider, List, ListItem, ListItemText, Paper, Chip
} from '@mui/material'
import { ArrowBackOutlined, AddCardOutlined, ContactPageOutlined, PhotoCamera, WarningAmberOutlined, CheckCircleOutlined, ErrorOutlineOutlined } from '@mui/icons-material'
import { clientAPI } from '@/lib/api'

interface Piece {
  id: number
  type_piece: string
  numero: string
  date_expiration?: string | null
  created_at: string
}

const TYPES_PIECES = [
  { value: 'cni', label: "Carte Nationale d'Identité" },
  { value: 'passport', label: 'Passeport' },
  { value: 'permis', label: 'Permis de conduire' },
  { value: 'niu', label: 'NIU (Numéro d\'Identification Unique)' },
]

// ── Statut d'expiration d'une pièce ──────────────────────────────
// - Pas de date renseignée -> on ne peut pas se prononcer
// - Date dépassée          -> expirée
// - Expire dans <= 30 jours -> bientôt expirée
// - Sinon                  -> valide
function getStatutExpiration(dateExpiration?: string | null): {
  label: string
  color: 'success' | 'warning' | 'error' | 'default'
  icon: typeof CheckCircleOutlined
} | null {
  if (!dateExpiration) return null

  const aujourdHui = new Date()
  aujourdHui.setHours(0, 0, 0, 0)
  const expiration = new Date(dateExpiration)
  expiration.setHours(0, 0, 0, 0)

  const joursRestants = Math.round((expiration.getTime() - aujourdHui.getTime()) / (1000 * 60 * 60 * 24))

  if (joursRestants < 0) {
    return { label: 'Expirée', color: 'error', icon: ErrorOutlineOutlined }
  }
  if (joursRestants <= 30) {
    return { label: `Expire dans ${joursRestants} j`, color: 'warning', icon: WarningAmberOutlined }
  }
  return { label: 'Valide', color: 'success', icon: CheckCircleOutlined }
}

export default function PiecesClientPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: clientId } = use(params)
  
  const [file, setFile] = useState<File | null>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ type_piece: '', numero: '', date_expiration: '' })

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
    // La date d'expiration n'est envoyée que si elle est renseignée,
    // pour ne pas écraser côté backend avec une chaîne vide.
    if (form.date_expiration) formData.append('date_expiration', form.date_expiration)
    if (file) formData.append('fichier', file) 

    try {
      const { data } = await clientAPI.ajouterPiece(Number(clientId), formData)
      setPieces((prev) => [...prev, data])
      setSuccess('Pièce ajoutée avec succès.')
      setForm({ type_piece: '', numero: '', date_expiration: '' })
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
                  const statutExpiration = getStatutExpiration(p.date_expiration)
                  return (
                    <Box key={p.id}>
                      <ListItem sx={{ py: 2 }}>
                        <ContactPageOutlined sx={{ color: '#0D47A1', mr: 2 }} />
                        <ListItemText
                          primary={pieceInfo ? pieceInfo.label : p.type_piece}
                          secondary={
                            <>
                              {`Numéro : ${p.numero}`}
                              {p.date_expiration && (
                                <> {' — '}Expire le {new Date(p.date_expiration).toLocaleDateString('fr-FR')}</>
                              )}
                            </>
                          }
                        />
                        {statutExpiration && (
                          <Chip
                            size="small"
                            icon={<statutExpiration.icon sx={{ fontSize: 14 }} />}
                            label={statutExpiration.label}
                            color={statutExpiration.color === 'default' ? undefined : statutExpiration.color}
                            sx={{ fontSize: 11, fontWeight: 600 }}
                          />
                        )}
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

                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Date d'expiration"
                    value={form.date_expiration}
                    onChange={(e) => setForm({ ...form, date_expiration: e.target.value })}
                    sx={{ mb: 2 }}
                    slotProps={{
                      inputLabel: { shrink: true },
                      htmlInput: { min: new Date().toISOString().split('T')[0] } // empêche de choisir une date déjà passée
                    }}
                  />
                  
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