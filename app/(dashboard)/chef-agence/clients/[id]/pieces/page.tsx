// 'use client'
// import { useEffect, useState, use } from 'react'
// import { useRouter } from 'next/navigation'
// import {
//   Box, Typography, Grid ,Button, Card, CardContent, TextField,
//   MenuItem, Alert, CircularProgress, Divider, List, ListItem, ListItemText, Paper, Chip
// } from '@mui/material'
// import { ArrowBackOutlined, AddCardOutlined, ContactPageOutlined, PhotoCamera, WarningAmberOutlined, CheckCircleOutlined, ErrorOutlineOutlined } from '@mui/icons-material'
// import { clientAPI } from '@/lib/api'

// interface Piece {
//   id: number
//   type_piece: string
//   numero: string
//   date_expiration?: string | null
//   created_at: string
// }


// const TYPES_PIECES = [
//   { value: 'cni', label: "Carte Nationale d'Identité" },
//   { value: 'passport', label: 'Passeport' },
//   { value: 'permis', label: 'Permis de conduire' },
//   { value: 'permis_etranger', label: 'Permis de conduire étranger' },
//   { value: 'niu', label: 'NIU (Numéro d\'Identification Unique)' },
//   { value: 'resident', label: 'Carte de résident' },
//   { value: 'refugie', label: 'Carte de réfugié' },
//   { value: 'consulaire', label: 'Carte consulaire' },
// ]

// // ── Statut d'expiration d'une pièce ──────────────────────────────
// // - Pas de date renseignée -> on ne peut pas se prononcer
// // - Date dépassée          -> expirée
// // - Expire dans <= 30 jours -> bientôt expirée
// // - Sinon                  -> valide
// function getStatutExpiration(dateExpiration?: string | null): {
//   label: string
//   color: 'success' | 'warning' | 'error' | 'default'
//   icon: typeof CheckCircleOutlined
// } | null {
//   if (!dateExpiration) return null

//   const aujourdHui = new Date()
//   aujourdHui.setHours(0, 0, 0, 0)
//   const expiration = new Date(dateExpiration)
//   expiration.setHours(0, 0, 0, 0)

//   const joursRestants = Math.round((expiration.getTime() - aujourdHui.getTime()) / (1000 * 60 * 60 * 24))

//   if (joursRestants < 0) {
//     return { label: 'Expirée', color: 'error', icon: ErrorOutlineOutlined }
//   }
//   if (joursRestants <= 30) {
//     return { label: `Expire dans ${joursRestants} j`, color: 'warning', icon: WarningAmberOutlined }
//   }
//   return { label: 'Valide', color: 'success', icon: CheckCircleOutlined }
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
//     // La date d'expiration n'est envoyée que si elle est renseignée,
//     // pour ne pas écraser côté backend avec une chaîne vide.
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
//                   const statutExpiration = getStatutExpiration(p.date_expiration)
//                   return (
//                     <Box key={p.id}>
//                       <ListItem sx={{ py: 2 }}>
//                         <ContactPageOutlined sx={{ color: '#0D47A1', mr: 2 }} />
//                         <ListItemText
//                           primary={pieceInfo ? pieceInfo.label : p.type_piece}
//                           secondary={
//                             <>
//                               {`Numéro : ${p.numero}`}
//                               {p.date_expiration && (
//                                 <> {' — '}Expire le {new Date(p.date_expiration).toLocaleDateString('fr-FR')}</>
//                               )}
//                             </>
//                           }
//                         />
//                         {statutExpiration && (
//                           <Chip
//                             size="small"
//                             icon={<statutExpiration.icon sx={{ fontSize: 14 }} />}
//                             label={statutExpiration.label}
//                             color={statutExpiration.color === 'default' ? undefined : statutExpiration.color}
//                             sx={{ fontSize: 11, fontWeight: 600 }}
//                           />
//                         )}
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
//                     fullWidth
//                     size="small"
//                     type="date"
//                     label="Date d'expiration"
//                     value={form.date_expiration}
//                     onChange={(e) => setForm({ ...form, date_expiration: e.target.value })}
//                     sx={{ mb: 2 }}
//                     slotProps={{
//                       inputLabel: { shrink: true },
//                       htmlInput: { min: new Date().toISOString().split('T')[0] } // empêche de choisir une date déjà passée
//                     }}
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
//     </Box>
//   )
// }

'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/fr'
import {
  Box, Typography, Grid, Button, Card, CardContent, TextField,
  MenuItem, Alert, CircularProgress, Divider, List, ListItem, ListItemText, Paper,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import {
  ArrowBackOutlined, AddCardOutlined, ContactPageOutlined, PhotoCamera,
  WarningAmberOutlined, ErrorOutlineOutlined, CheckCircleOutlined,
  AutorenewOutlined, CloseOutlined, VisibilityOutlined, DownloadOutlined,
  InsertDriveFileOutlined, RestartAltOutlined
} from '@mui/icons-material'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { clientAPI } from '@/lib/api'

dayjs.locale('fr')

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

// fusionne recto + verso en une seule image (recto en haut, verso en bas)
const fusionnerRectoVerso = (recto: File, verso: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const imgRecto = new Image()
    const imgVerso = new Image()
    let loaded = 0

    const onBothLoaded = () => {
      const largeur = Math.max(imgRecto.width, imgVerso.width)
      const gap = 20
      const hauteurRecto = (imgRecto.height * largeur) / imgRecto.width
      const hauteurVerso = (imgVerso.height * largeur) / imgVerso.width
      const hauteurTotale = hauteurRecto + hauteurVerso + gap

      const canvas = document.createElement('canvas')
      canvas.width = largeur
      canvas.height = hauteurTotale
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas non supporté'))

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, largeur, hauteurTotale)

      ctx.drawImage(imgRecto, 0, 0, largeur, hauteurRecto)
      ctx.drawImage(imgVerso, 0, hauteurRecto + gap, largeur, hauteurVerso)

      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, hauteurRecto + gap / 2)
      ctx.lineTo(largeur, hauteurRecto + gap / 2)
      ctx.stroke()

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Échec de la fusion'))
        const fichierFusionne = new File(
          [blob],
          `${recto.name.split('.')[0]}_recto_verso.jpg`,
          { type: 'image/jpeg' }
        )
        resolve(fichierFusionne)
      }, 'image/jpeg', 0.9)

      URL.revokeObjectURL(imgRecto.src)
      URL.revokeObjectURL(imgVerso.src)
    }

    imgRecto.onload = () => { loaded++; if (loaded === 2) onBothLoaded() }
    imgVerso.onload = () => { loaded++; if (loaded === 2) onBothLoaded() }
    imgRecto.onerror = () => reject(new Error('Erreur chargement recto'))
    imgVerso.onerror = () => reject(new Error('Erreur chargement verso'))

    imgRecto.src = URL.createObjectURL(recto)
    imgVerso.src = URL.createObjectURL(verso)
  })
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

  // ── Formulaire d'ajout ────────────────────────────────────────
  const [ajoutParts, setAjoutParts] = useState<{ recto?: File; verso?: File }>({})
  const [file, setFile] = useState<File | null>(null)
  const [ajoutFusionEnCours, setAjoutFusionEnCours] = useState(false)

  const [pieces, setPieces] = useState<Piece[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ type_piece: '', numero: '' })
  // NOUVEAU : date d'expiration gérée séparément en objet Dayjs (pour le DatePicker)
  const [dateExpirationAjout, setDateExpirationAjout] = useState<Dayjs | null>(null)

  // ── Renouvellement ────────────────────────────────────────────
  const [dialogRenouv, setDialogRenouv] = useState(false)
  const [pieceARenouveler, setPieceARenouveler] = useState<Piece | null>(null)
  const [renouvNumero, setRenouvNumero] = useState('')
  // NOUVEAU : date de renouvellement en objet Dayjs (pour le DatePicker)
  const [renouvDate, setRenouvDate] = useState<Dayjs | null>(null)
  const [renouvParts, setRenouvParts]   = useState<{ recto?: File; verso?: File }>({})
  const [renouvFile, setRenouvFile]     = useState<File | null>(null)
  const [renouvFusionEnCours, setRenouvFusionEnCours] = useState(false)
  const [renouvLoading, setRenouvLoading] = useState(false)

  // ── Prévisualisation ─────────────────────────────────
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

  // capture recto/verso pour le formulaire d'ajout, fusion dès que les deux sont prêtes
  const handleCaptureAjout = async (face: 'recto' | 'verso', e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    const nouvellesParts = { ...ajoutParts, [face]: f }
    setAjoutParts(nouvellesParts)

    if (nouvellesParts.recto && nouvellesParts.verso) {
      setAjoutFusionEnCours(true)
      try {
        const fusionne = await fusionnerRectoVerso(nouvellesParts.recto, nouvellesParts.verso)
        setFile(fusionne)
      } catch {
        setError('Erreur lors de la fusion des photos. Réessayez.')
      } finally {
        setAjoutFusionEnCours(false)
      }
    }
    e.target.value = ''
  }

  const handleReinitialiserAjout = () => {
    setAjoutParts({})
    setFile(null)
  }

  const handleAjouterPiece = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('type_piece', form.type_piece)
    formData.append('numero', form.numero)
    // NOUVEAU : conversion Dayjs -> ISO (YYYY-MM-DD) pour le backend
    if (dateExpirationAjout) formData.append('date_expiration', dateExpirationAjout.format('YYYY-MM-DD'))
    if (file) formData.append('fichier', file)

    try {
      const { data } = await clientAPI.ajouterPiece(Number(clientId), formData)
      setPieces((prev) => [...prev, data])
      setSuccess('Pièce ajoutée avec succès.')
      setForm({ type_piece: '', numero: '' })
      setDateExpirationAjout(null)
      setFile(null)
      setAjoutParts({})
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
    // NOUVEAU : conversion de la date existante (string ISO) en objet Dayjs
    setRenouvDate(piece.date_expiration ? dayjs(piece.date_expiration) : null)
    setRenouvFile(null)
    setRenouvParts({})
    setDialogRenouv(true)
  }

  const fermerRenouvellement = () => {
    setDialogRenouv(false)
    setPieceARenouveler(null)
    setRenouvParts({})
    setRenouvFile(null)
  }

  // capture recto/verso pour le renouvellement, fusion dès que les deux sont prêtes
  const handleCaptureRenouv = async (face: 'recto' | 'verso', e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    const nouvellesParts = { ...renouvParts, [face]: f }
    setRenouvParts(nouvellesParts)

    if (nouvellesParts.recto && nouvellesParts.verso) {
      setRenouvFusionEnCours(true)
      try {
        const fusionne = await fusionnerRectoVerso(nouvellesParts.recto, nouvellesParts.verso)
        setRenouvFile(fusionne)
      } catch {
        setError('Erreur lors de la fusion des photos. Réessayez.')
      } finally {
        setRenouvFusionEnCours(false)
      }
    }
    e.target.value = ''
  }

  const handleReinitialiserRenouv = () => {
    setRenouvParts({})
    setRenouvFile(null)
  }

  const handleRenouveler = async () => {
    if (!pieceARenouveler) return
    setRenouvLoading(true)
    setError('')

    const formData = new FormData()
    if (renouvNumero) formData.append('numero', renouvNumero)
    // NOUVEAU : conversion Dayjs -> ISO (YYYY-MM-DD) pour le backend
    if (renouvDate) formData.append('date_expiration', renouvDate.format('YYYY-MM-DD'))
    if (renouvFile) formData.append('fichier', renouvFile)

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

  // ── Ouvrir/fermer la prévisualisation ────────────────
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
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
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
                            slotProps={{ secondary: { component: 'div' } }}
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

                    {/* NOUVEAU : DatePicker MUI en locale fr, format JJ/MM/AAAA */}
                    <DatePicker
                      label="Date d'expiration (si applicable)"
                      value={dateExpirationAjout}
                      onChange={(value) => setDateExpirationAjout(value)}
                      format="DD/MM/YYYY"
                      slotProps={{ textField: { fullWidth: true, size: 'small', sx: { mb: 2 } } }}
                    />

                    {/* capture recto/verso avec fusion automatique */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined" component="label" size="small" fullWidth
                        startIcon={<PhotoCamera />}
                        disabled={ajoutFusionEnCours}
                        sx={{ height: '40px' }}
                      >
                        {ajoutParts.recto ? 'Recto ✓' : 'Recto'}
                        <input type="file" hidden accept="image/*" capture="environment"
                          onChange={(e) => handleCaptureAjout('recto', e)} />
                      </Button>
                      <Button
                        variant="outlined" component="label" size="small" fullWidth
                        startIcon={<PhotoCamera />}
                        disabled={ajoutFusionEnCours}
                        sx={{ height: '40px' }}
                      >
                        {ajoutParts.verso ? 'Verso ✓' : 'Verso'}
                        <input type="file" hidden accept="image/*" capture="environment"
                          onChange={(e) => handleCaptureAjout('verso', e)} />
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      {ajoutFusionEnCours && (
                        <>
                          <CircularProgress size={12} />
                          <Typography variant="caption" color="text.secondary">Fusion en cours...</Typography>
                        </>
                      )}
                      {!ajoutFusionEnCours && file && (
                        <>
                          <Typography variant="caption" color="success.main">Image prête ✓</Typography>
                          <Button
                            size="small" color="inherit"
                            startIcon={<RestartAltOutlined fontSize="small" />}
                            onClick={handleReinitialiserAjout}
                            sx={{ minWidth: 0, textTransform: 'none', fontSize: '0.75rem' }}
                          >
                            Refaire
                          </Button>
                        </>
                      )}
                    </Box>

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

                {/* NOUVEAU : DatePicker MUI en locale fr, format JJ/MM/AAAA */}
                <DatePicker
                  label="Nouvelle date d'expiration"
                  value={renouvDate}
                  onChange={(value) => setRenouvDate(value)}
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />

                {/* capture recto/verso avec fusion automatique */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined" component="label" size="small" fullWidth
                    startIcon={<PhotoCamera />}
                    disabled={renouvFusionEnCours}
                    sx={{ height: '40px' }}
                  >
                    {renouvParts.recto ? 'Recto ✓' : 'Recto'}
                    <input type="file" hidden accept="image/*" capture="environment"
                      onChange={(e) => handleCaptureRenouv('recto', e)} />
                  </Button>
                  <Button
                    variant="outlined" component="label" size="small" fullWidth
                    startIcon={<PhotoCamera />}
                    disabled={renouvFusionEnCours}
                    sx={{ height: '40px' }}
                  >
                    {renouvParts.verso ? 'Verso ✓' : 'Verso'}
                    <input type="file" hidden accept="image/*" capture="environment"
                      onChange={(e) => handleCaptureRenouv('verso', e)} />
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {renouvFusionEnCours && (
                    <>
                      <CircularProgress size={12} />
                      <Typography variant="caption" color="text.secondary">Fusion en cours...</Typography>
                    </>
                  )}
                  {!renouvFusionEnCours && renouvFile && (
                    <>
                      <Typography variant="caption" color="success.main">Nouvelle image prête ✓</Typography>
                      <Button
                        size="small" color="inherit"
                        startIcon={<RestartAltOutlined fontSize="small" />}
                        onClick={handleReinitialiserRenouv}
                        sx={{ minWidth: 0, textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        Refaire
                      </Button>
                    </>
                  )}
                </Box>
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

        {/* ── Modale de prévisualisation ── */}
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
    </LocalizationProvider>
  )
}