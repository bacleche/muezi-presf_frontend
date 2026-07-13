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


//------------------------------------|| ----------------------------------------

// 'use client'
// import { useEffect, useState, use } from 'react'
// import { useRouter } from 'next/navigation'
// import {
//   Box, Typography, Grid, Button, Card, CardContent, TextField,
//   MenuItem, Alert, CircularProgress, Divider, List, ListItem, ListItemText, Paper,
//   Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
// } from '@mui/material'
// import {
//   ArrowBackOutlined, AddCardOutlined, ContactPageOutlined, PhotoCamera,
//   WarningAmberOutlined, ErrorOutlineOutlined, CheckCircleOutlined,
//   AutorenewOutlined, CloseOutlined
// } from '@mui/icons-material'
// import { clientAPI } from '@/lib/api'

// interface Piece {
//   id: number
//   type_piece: string
//   numero: string
//   date_expiration: string | null
//   est_expiree: boolean
//   expire_bientot: boolean
//   created_at: string
//   updated_at: string
// }

// const TYPES_PIECES = [
//   { value: 'cni', label: "Carte Nationale d'Identité" },
//   { value: 'passport', label: 'Passeport' },
//   { value: 'permis', label: 'Permis de conduire' },
//   { value: 'niu', label: 'NIU (Numéro d\'Identification Unique)' },
// ]

// // ── Badge de statut d'expiration ────────────────────────────────
// const BadgeExpiration = ({ piece }: { piece: Piece }) => {
//   if (!piece.date_expiration) {
//     return <Chip size="small" label="Sans expiration" variant="outlined" />
//   }
//   if (piece.est_expiree) {
//     return (
//       <Chip
//         size="small" color="error"
//         icon={<ErrorOutlineOutlined sx={{ fontSize: 14 }} />}
//         label={`Expirée le ${new Date(piece.date_expiration).toLocaleDateString('fr-FR')}`}
//       />
//     )
//   }
//   if (piece.expire_bientot) {
//     return (
//       <Chip
//         size="small" color="warning"
//         icon={<WarningAmberOutlined sx={{ fontSize: 14 }} />}
//         label={`Expire le ${new Date(piece.date_expiration).toLocaleDateString('fr-FR')}`}
//       />
//     )
//   }
//   return (
//     <Chip
//       size="small" color="success"
//       icon={<CheckCircleOutlined sx={{ fontSize: 14 }} />}
//       label={`Valide jusqu'au ${new Date(piece.date_expiration).toLocaleDateString('fr-FR')}`}
//     />
//   )
// }

// export default function PiecesClientPage({ params }: { params: Promise<{ id: string }> }) {
//   const router = useRouter()
//   const { id: clientId } = use(params)

//   const [file, setFile] = useState<File | null>(null)
//   const [pieces, setPieces] = useState<Piece[]>([])
//   const [loading, setLoading] = useState(true)
//   const [submitting, setSubmitting] = useState(false)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')
//   const [form, setForm] = useState({ type_piece: '', numero: '', date_expiration: '' })

//   // ── Renouvellement ────────────────────────────────────────────
//   const [dialogRenouv, setDialogRenouv] = useState(false)
//   const [pieceARenouveler, setPieceARenouveler] = useState<Piece | null>(null)
//   const [renouvNumero, setRenouvNumero] = useState('')
//   const [renouvDate, setRenouvDate]     = useState('')
//   const [renouvFile, setRenouvFile]     = useState<File | null>(null)
//   const [renouvLoading, setRenouvLoading] = useState(false)

//   const charger = () => {
//     setLoading(true)
//     clientAPI.pieces(Number(clientId))
//       .then(({ data }) => setPieces(data))
//       .catch(() => setError('Erreur lors de la récupération des pièces.'))
//       .finally(() => setLoading(false))
//   }

//   useEffect(() => {
//     if (!clientId) return
//     charger()
//   }, [clientId])

//   const handleAjouterPiece = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setSubmitting(true)
//     setError('')
//     setSuccess('')

//     const formData = new FormData()
//     formData.append('type_piece', form.type_piece)
//     formData.append('numero', form.numero)
//     if (form.date_expiration) formData.append('date_expiration', form.date_expiration)
//     if (file) formData.append('fichier', file)

//     try {
//       const { data } = await clientAPI.ajouterPiece(Number(clientId), formData)
//       setPieces((prev) => [...prev, data])
//       setSuccess('Pièce ajoutée avec succès.')
//       setForm({ type_piece: '', numero: '', date_expiration: '' })
//       setFile(null)
//     } catch (err: any) {
//       setError(err.response?.data?.detail || "Erreur lors de l'ajout.")
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   // ── Ouvrir la modale de renouvellement, pré-remplie ───────────
//   const ouvrirRenouvellement = (piece: Piece) => {
//     setPieceARenouveler(piece)
//     setRenouvNumero(piece.numero)
//     setRenouvDate(piece.date_expiration || '')
//     setRenouvFile(null)
//     setDialogRenouv(true)
//   }

//   const fermerRenouvellement = () => {
//     setDialogRenouv(false)
//     setPieceARenouveler(null)
//   }

//   const handleRenouveler = async () => {
//     if (!pieceARenouveler) return
//     setRenouvLoading(true)
//     setError('')

//     const formData = new FormData()
//     if (renouvNumero) formData.append('numero', renouvNumero)
//     if (renouvDate)   formData.append('date_expiration', renouvDate)
//     if (renouvFile)   formData.append('fichier', renouvFile)

//     try {
//       const { data } = await clientAPI.renouvelerPiece(Number(clientId), pieceARenouveler.id, formData)
//       setPieces((prev) => prev.map((p) => (p.id === data.id ? data : p)))
//       setSuccess('Pièce renouvelée avec succès.')
//       fermerRenouvellement()
//     } catch (err: any) {
//       setError(err.response?.data?.detail || 'Erreur lors du renouvellement.')
//     } finally {
//       setRenouvLoading(false)
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
//                       <ListItem
//                         sx={{ py: 2 }}
//                         secondaryAction={
//                           <IconButton
//                             edge="end"
//                             color={p.est_expiree ? 'error' : 'default'}
//                             onClick={() => ouvrirRenouvellement(p)}
//                             title="Renouveler cette pièce"
//                           >
//                             <AutorenewOutlined />
//                           </IconButton>
//                         }
//                       >
//                         <ContactPageOutlined sx={{ color: '#0D47A1', mr: 2 }} />
//                         <ListItemText
//                           primary={pieceInfo ? pieceInfo.label : p.type_piece}
//                           secondary={
//                             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
//                               <Typography variant="body2" component="span">Numéro : {p.numero}</Typography>
//                               <BadgeExpiration piece={p} />
//                             </Box>
//                           }
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
//                   <TextField
//                     fullWidth size="small" type="date" label="Date d'expiration (si applicable)"
//                     value={form.date_expiration}
//                     onChange={(e) => setForm({...form, date_expiration: e.target.value})}
//                     slotProps={{ inputLabel: { shrink: true } }}
//                     sx={{ mb: 2 }}
//                   />

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

//       {/* ── Modale de renouvellement ── */}
//       <Dialog open={dialogRenouv} onClose={fermerRenouvellement} maxWidth="xs" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           Renouveler la pièce
//           <IconButton size="small" onClick={fermerRenouvellement}>
//             <CloseOutlined />
//           </IconButton>
//         </DialogTitle>
//         <DialogContent dividers>
//           {pieceARenouveler && (
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
//               <Alert severity="info" sx={{ fontSize: 13 }}>
//                 {TYPES_PIECES.find(t => t.value === pieceARenouveler.type_piece)?.label || pieceARenouveler.type_piece}
//                 — laissez les champs inchangés si seul le fichier doit être remplacé.
//               </Alert>

//               <TextField
//                 fullWidth size="small" label="Numéro"
//                 value={renouvNumero}
//                 onChange={(e) => setRenouvNumero(e.target.value.toUpperCase().trim())}
//               />
//               <TextField
//                 fullWidth size="small" type="date" label="Nouvelle date d'expiration"
//                 value={renouvDate}
//                 onChange={(e) => setRenouvDate(e.target.value)}
//                 slotProps={{ inputLabel: { shrink: true } }}
//               />
//               <Button
//                 variant={renouvFile ? "contained" : "outlined"}
//                 color={renouvFile ? "success" : "primary"}
//                 component="label" fullWidth startIcon={<PhotoCamera />}
//                 sx={{ py: 1.5, borderStyle: 'dashed' }}
//               >
//                 {renouvFile ? 'Nouvelle image prête' : 'Nouvelle photo / upload'}
//                 <input type="file" hidden accept="image/*" capture="environment"
//                   onChange={(e) => setRenouvFile(e.target.files?.[0] || null)} />
//               </Button>
//             </Box>
//           )}
//         </DialogContent>
//         <DialogActions sx={{ p: 2, gap: 1 }}>
//           <Button variant="outlined" onClick={fermerRenouvellement}>Annuler</Button>
//           <Button
//             variant="contained"
//             onClick={handleRenouveler}
//             disabled={renouvLoading}
//             startIcon={renouvLoading ? <CircularProgress size={16} color="inherit" /> : <AutorenewOutlined />}
//             sx={{ bgcolor: '#0f172a' }}
//           >
//             Renouveler
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   )
// }


'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Grid, Button, Card, CardContent, TextField,
  MenuItem, Alert, CircularProgress, Divider, List, ListItem, ListItemText, Paper,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import {
  ArrowBackOutlined, AddCardOutlined, ContactPageOutlined, PhotoCamera,
  WarningAmberOutlined, ErrorOutlineOutlined, CheckCircleOutlined,
  AutorenewOutlined, CloseOutlined, VisibilityOutlined, DownloadOutlined,
  InsertDriveFileOutlined
} from '@mui/icons-material'
import { clientAPI } from '@/lib/api'

interface Piece {
  id: number
  type_piece: string
  numero: string
  date_expiration: string | null
  est_expiree: boolean
  expire_bientot: boolean
  url_fichier: string | null
  created_at: string
  updated_at: string
}

// const TYPES_PIECES = [
//   { value: 'cni', label: "Carte Nationale d'Identité" },
//   { value: 'passport', label: 'Passeport' },
//   { value: 'permis', label: 'Permis de conduire' },
//   { value: 'niu', label: 'NIU (Numéro d\'Identification Unique)' },
// ]

const TYPES_PIECES = [
  { value: 'cni', label: "Carte Nationale d'Identité" },
  { value: 'passport', label: 'Passeport' },
  { value: 'permis', label: 'Permis de conduire' },
  { value: 'permis_etranger', label: 'Permis de conduire étranger' },
  { value: 'niu', label: 'NIU (Numéro d\'Identification Unique)' },
  { value: 'resident', label: 'Carte de résident' },
  { value: 'refugie', label: 'Carte de réfugié' },
  { value: 'consulaire', label: 'Carte consulaire' },
]

const EXTENSIONS_IMAGE = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

const estImage = (url: string | null) => {
  if (!url) return false
  const lower = url.toLowerCase()
  return EXTENSIONS_IMAGE.some((ext) => lower.includes(ext))
}

// ── Badge de statut d'expiration ────────────────────────────────
const BadgeExpiration = ({ piece }: { piece: Piece }) => {
  if (!piece.date_expiration) {
    return <Chip size="small" label="Sans expiration" variant="outlined" />
  }
  if (piece.est_expiree) {
    return (
      <Chip
        size="small" color="error"
        icon={<ErrorOutlineOutlined sx={{ fontSize: 14 }} />}
        label={`Expirée le ${new Date(piece.date_expiration).toLocaleDateString('fr-FR')}`}
      />
    )
  }
  if (piece.expire_bientot) {
    return (
      <Chip
        size="small" color="warning"
        icon={<WarningAmberOutlined sx={{ fontSize: 14 }} />}
        label={`Expire le ${new Date(piece.date_expiration).toLocaleDateString('fr-FR')}`}
      />
    )
  }
  return (
    <Chip
      size="small" color="success"
      icon={<CheckCircleOutlined sx={{ fontSize: 14 }} />}
      label={`Valide jusqu'au ${new Date(piece.date_expiration).toLocaleDateString('fr-FR')}`}
    />
  )
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

  // ── Renouvellement ────────────────────────────────────────────
  const [dialogRenouv, setDialogRenouv] = useState(false)
  const [pieceARenouveler, setPieceARenouveler] = useState<Piece | null>(null)
  const [renouvNumero, setRenouvNumero] = useState('')
  const [renouvDate, setRenouvDate]     = useState('')
  const [renouvFile, setRenouvFile]     = useState<File | null>(null)
  const [renouvLoading, setRenouvLoading] = useState(false)

  // ── NOUVEAU : Prévisualisation ─────────────────────────────────
  const [dialogPreview, setDialogPreview] = useState(false)
  const [pieceAVoir, setPieceAVoir]       = useState<Piece | null>(null)

  const charger = () => {
    setLoading(true)
    clientAPI.pieces(Number(clientId))
      .then(({ data }) => setPieces(data))
      .catch(() => setError('Erreur lors de la récupération des pièces.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!clientId) return
    charger()
  }, [clientId])

  const handleAjouterPiece = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('type_piece', form.type_piece)
    formData.append('numero', form.numero)
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

  // ── Ouvrir la modale de renouvellement, pré-remplie ───────────
  const ouvrirRenouvellement = (piece: Piece) => {
    setPieceARenouveler(piece)
    setRenouvNumero(piece.numero)
    setRenouvDate(piece.date_expiration || '')
    setRenouvFile(null)
    setDialogRenouv(true)
  }

  const fermerRenouvellement = () => {
    setDialogRenouv(false)
    setPieceARenouveler(null)
  }

  const handleRenouveler = async () => {
    if (!pieceARenouveler) return
    setRenouvLoading(true)
    setError('')

    const formData = new FormData()
    if (renouvNumero) formData.append('numero', renouvNumero)
    if (renouvDate)   formData.append('date_expiration', renouvDate)
    if (renouvFile)   formData.append('fichier', renouvFile)

    try {
      const { data } = await clientAPI.renouvelerPiece(Number(clientId), pieceARenouveler.id, formData)
      setPieces((prev) => prev.map((p) => (p.id === data.id ? data : p)))
      setSuccess('Pièce renouvelée avec succès.')
      fermerRenouvellement()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du renouvellement.')
    } finally {
      setRenouvLoading(false)
    }
  }

  // ── NOUVEAU : Ouvrir/fermer la prévisualisation ────────────────
  const ouvrirPreview = (piece: Piece) => {
    setPieceAVoir(piece)
    setDialogPreview(true)
  }

  const fermerPreview = () => {
    setDialogPreview(false)
    setPieceAVoir(null)
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
                      <ListItem
                        sx={{ py: 2 }}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              edge="end"
                              color="primary"
                              onClick={() => ouvrirPreview(p)}
                              disabled={!p.url_fichier}
                              title={p.url_fichier ? 'Voir le document' : 'Aucun fichier'}
                            >
                              <VisibilityOutlined />
                            </IconButton>
                            <IconButton
                              edge="end"
                              color={p.est_expiree ? 'error' : 'default'}
                              onClick={() => ouvrirRenouvellement(p)}
                              title="Renouveler cette pièce"
                            >
                              <AutorenewOutlined />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ContactPageOutlined sx={{ color: '#0D47A1', mr: 2 }} />
                        <ListItemText
                          primary={pieceInfo ? pieceInfo.label : p.type_piece}
                          secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                              <Typography variant="body2" component="span">Numéro : {p.numero}</Typography>
                              <BadgeExpiration piece={p} />
                            </Box>
                          }
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
                  <TextField
                    fullWidth size="small" type="date" label="Date d'expiration (si applicable)"
                    value={form.date_expiration}
                    onChange={(e) => setForm({...form, date_expiration: e.target.value})}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ mb: 2 }}
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

      {/* ── Modale de renouvellement ── */}
      <Dialog open={dialogRenouv} onClose={fermerRenouvellement} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Renouveler la pièce
          <IconButton size="small" onClick={fermerRenouvellement}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {pieceARenouveler && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Alert severity="info" sx={{ fontSize: 13 }}>
                {TYPES_PIECES.find(t => t.value === pieceARenouveler.type_piece)?.label || pieceARenouveler.type_piece}
                — laissez les champs inchangés si seul le fichier doit être remplacé.
              </Alert>

              <TextField
                fullWidth size="small" label="Numéro"
                value={renouvNumero}
                onChange={(e) => setRenouvNumero(e.target.value.toUpperCase().trim())}
              />
              <TextField
                fullWidth size="small" type="date" label="Nouvelle date d'expiration"
                value={renouvDate}
                onChange={(e) => setRenouvDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Button
                variant={renouvFile ? "contained" : "outlined"}
                color={renouvFile ? "success" : "primary"}
                component="label" fullWidth startIcon={<PhotoCamera />}
                sx={{ py: 1.5, borderStyle: 'dashed' }}
              >
                {renouvFile ? 'Nouvelle image prête' : 'Nouvelle photo / upload'}
                <input type="file" hidden accept="image/*" capture="environment"
                  onChange={(e) => setRenouvFile(e.target.files?.[0] || null)} />
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={fermerRenouvellement}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleRenouveler}
            disabled={renouvLoading}
            startIcon={renouvLoading ? <CircularProgress size={16} color="inherit" /> : <AutorenewOutlined />}
            sx={{ bgcolor: '#0f172a' }}
          >
            Renouveler
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── NOUVEAU : Modale de prévisualisation ── */}
      <Dialog open={dialogPreview} onClose={fermerPreview} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {pieceAVoir
            ? TYPES_PIECES.find(t => t.value === pieceAVoir.type_piece)?.label || pieceAVoir.type_piece
            : 'Document'}
          <IconButton size="small" onClick={fermerPreview}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center', bgcolor: '#fafafa' }}>
          {pieceAVoir && (
            <>
              {!pieceAVoir.url_fichier ? (
                <Box sx={{ py: 6 }}>
                  <InsertDriveFileOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Aucun fichier associé à cette pièce.
                  </Typography>
                </Box>
              ) : estImage(pieceAVoir.url_fichier) ? (
                <Box
                  component="img"
                  src={pieceAVoir.url_fichier}
                  alt="Aperçu du document"
                  sx={{ maxWidth: '100%', maxHeight: 480, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
              ) : (
                <Box sx={{ py: 6 }}>
                  <InsertDriveFileOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Ce fichier n'est pas une image (PDF ou autre format) — ouvrez-le dans un nouvel onglet.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={fermerPreview}>Fermer</Button>
          {pieceAVoir?.url_fichier && (
            <Button
              variant="contained"
              startIcon={<DownloadOutlined />}
              component="a"
              href={pieceAVoir.url_fichier}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ bgcolor: '#0f172a' }}
            >
              Ouvrir / Télécharger
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}