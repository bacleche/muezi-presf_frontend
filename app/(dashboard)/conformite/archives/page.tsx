// 'use client'
// import { useEffect, useState, useCallback } from 'react'
// import {
//   Box, Typography, Card, CardContent, Button,
//   Table, TableBody, TableCell, TableContainer,
//   TableHead, TableRow, Paper, TextField,
//   InputAdornment, CircularProgress, Alert,
//   TablePagination, Chip, Tooltip, ToggleButtonGroup,
//   ToggleButton, MenuItem
// } from '@mui/material'
// import {
//   SearchOutlined, DownloadOutlined,
//   FolderZipOutlined, CheckCircleOutlined,
//   CancelOutlined, HourglassEmptyOutlined
// } from '@mui/icons-material'
// import { transactionAPI, agenceAPI } from '@/lib/api'

// interface Document {
//   id:               number
//   type_doc:         string
//   type_doc_display: string
//   fichier:          string
// }

// interface Enregistrement {
//   id:                 number
//   nom_client:         string
//   prenom_client:      string
//   type_piece_display: string
//   numero_piece:       string
//   date_paiement:      string
//   caissier_nom:       string
//   agence_nom:         string | null
//   documents_complets: boolean
//   documents:          Document[]
//   created_at:         string
// }

// type FiltreStatut = 'tous' | 'valide' | 'rejete' | 'en_attente'

// const STATUT_CONFIG = {
//   valide:     { label: 'Validé',     color: 'success' as const, icon: <CheckCircleOutlined sx={{ fontSize: 14 }} /> },
//   rejete:     { label: 'Rejeté',     color: 'error'   as const, icon: <CancelOutlined      sx={{ fontSize: 14 }} /> },
//   en_attente: { label: 'En attente', color: 'warning' as const, icon: <HourglassEmptyOutlined sx={{ fontSize: 14 }} /> },
// }

// export default function ArchivesPage() {
//   const [enregistrements, setEnregistrements] = useState<Enregistrement[]>([])
//   const [loading, setLoading]     = useState(true)
//   const [error, setError]         = useState('')
//   const [search, setSearch]       = useState('')
//   const [page, setPage]           = useState(0)
//   const [total, setTotal]         = useState(0)
//   const [statut, setStatut]       = useState<FiltreStatut>('tous')
//   const [dateDebut, setDateDebut] = useState('')
//   const [dateFin,   setDateFin]   = useState('')
//   const [agences, setAgences]     = useState<{ id: number; nom: string }[]>([])
//   const [agenceId, setAgenceId]   = useState('')
//   const [downloading, setDownloading] = useState<Record<number, boolean>>({})

//   const charger = useCallback(async (
//     q: string, p: number, s: FiltreStatut,
//     dd: string, df: string, ag: string
//   ) => {
//     setLoading(true)
//     setError('')
//     try {
//       const params: Record<string, string | number> = {
//         search: q, page: p + 1, page_size: 15,
//       }
//       if (s !== 'tous') params.statut     = s
//       if (dd)           params.date_debut = dd
//       if (df)           params.date_fin   = df
//       if (ag)           params.agence_id  = ag

//       const { data } = await transactionAPI.liste(params)
//       setEnregistrements(data.results ?? data)
//       setTotal(data.count ?? (data.results ?? data).length)
//     } catch {
//       setError('Erreur lors du chargement.')
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     agenceAPI.liste({ is_active: true }).then(({ data }) =>
//       setAgences(data.results ?? data)
//     )
//   }, [])

//   useEffect(() => {
//     const t = setTimeout(() => {
//       setPage(0)
//       charger(search, 0, statut, dateDebut, dateFin, agenceId)
//     }, 400)
//     return () => clearTimeout(t)
//   }, [search, dateDebut, dateFin, agenceId, statut])

//   useEffect(() => {
//     charger(search, page, statut, dateDebut, dateFin, agenceId)
//   }, [page])

//   const handleStatut = (_: React.MouseEvent<HTMLElement>, val: FiltreStatut | null) => {
//     if (!val) return
//     setStatut(val)
//     setPage(0)
//   }

//   const telechargerZip = async (enreg: Enregistrement) => {
//     setDownloading((prev) => ({ ...prev, [enreg.id]: true }))
//     try {
//       const { data } = await transactionAPI.telechargerZip(enreg.id)
//       const url  = URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
//       const link = document.createElement('a')
//       link.href     = url
//       link.download = `dossier_${enreg.prenom_client}_${enreg.nom_client}_${enreg.id}.zip`
//       link.click()
//       URL.revokeObjectURL(url)
//     } catch {
//       setError('Erreur lors du téléchargement.')
//     } finally {
//       setDownloading((prev) => ({ ...prev, [enreg.id]: false }))
//     }
//   }

//   return (
//     <Box>
//       <Box sx={{ mb: 4 }}>
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
//           <FolderZipOutlined sx={{ color: '#0D47A1', fontSize: 28 }} />
//           <Typography variant="h5" sx={{ fontWeight: 700 }}>Archives</Typography>
//         </Box>
//         <Typography variant="body2" color="text.secondary">
//           Consultez et téléchargez les dossiers et leurs documents
//         </Typography>
//       </Box>

//       {/* ── Filtres ── */}
//       <Card sx={{ mb: 3 }}>
//         <CardContent sx={{
//           display: 'flex', gap: 2, alignItems: 'center',
//           flexWrap: 'wrap', py: '12px !important',
//         }}>
//           <TextField
//             placeholder="Rechercher par nom client..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             size="small" sx={{ width: 250 }}
//             slotProps={{
//               input: {
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <SearchOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
//                   </InputAdornment>
//                 ),
//               },
//             }}
//           />

//           <ToggleButtonGroup value={statut} exclusive onChange={handleStatut} size="small">
//             <ToggleButton value="tous">Tous</ToggleButton>
//             <ToggleButton value="valide"     sx={{ color: 'success.main' }}>Validés</ToggleButton>
//             <ToggleButton value="rejete"     sx={{ color: 'error.main'   }}>Rejetés</ToggleButton>
//             <ToggleButton value="en_attente" sx={{ color: 'warning.main' }}>En attente</ToggleButton>
//           </ToggleButtonGroup>

//           <TextField
//             select label="Agence" value={agenceId}
//             onChange={(e) => { setAgenceId(e.target.value); setPage(0) }}
//             size="small" sx={{ width: 180 }}
//           >
//             <MenuItem value="">Toutes</MenuItem>
//             {agences.map((a) => (
//               <MenuItem key={a.id} value={String(a.id)}>{a.nom}</MenuItem>
//             ))}
//           </TextField>

//           <TextField
//             label="Du" type="date" size="small"
//             value={dateDebut}
//             onChange={(e) => { setDateDebut(e.target.value); setPage(0) }}
//             slotProps={{ inputLabel: { shrink: true } }}
//             sx={{ width: 155 }}
//           />
//           <TextField
//             label="Au" type="date" size="small"
//             value={dateFin}
//             onChange={(e) => { setDateFin(e.target.value); setPage(0) }}
//             slotProps={{ inputLabel: { shrink: true } }}
//             sx={{ width: 155 }}
//           />

//           {(dateDebut || dateFin || agenceId) && (
//             <Typography
//               variant="body2"
//               sx={{ color: '#0D47A1', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
//               onClick={() => { setDateDebut(''); setDateFin(''); setAgenceId('') }}
//             >
//               Réinitialiser
//             </Typography>
//           )}
//         </CardContent>
//       </Card>

//       {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

//       <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ bgcolor: '#1e293b' }}>
//               {['Client', 'Pièce', 'Caissier / Agence', 'Date paiement', 'Documents', 'ZIP'].map((h) => (
//                 <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
//               ))}
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
//                   <CircularProgress />
//                 </TableCell>
//               </TableRow>
//             ) : enregistrements.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
//                   Aucun dossier trouvé
//                 </TableCell>
//               </TableRow>
//             ) : enregistrements.map((e) => (
//               <TableRow key={e.id} hover>

//                 <TableCell>
//                   <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
//                     {e.prenom_client} {e.nom_client}
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary">#{e.id}</Typography>
//                 </TableCell>

//                 <TableCell>
//                   <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{e.type_piece_display}</Typography>
//                   <Typography variant="caption" color="text.secondary">{e.numero_piece}</Typography>
//                 </TableCell>

//                 <TableCell>
//                   <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.caissier_nom}</Typography>
//                   {e.agence_nom && (
//                     <Typography variant="caption" color="text.secondary">{e.agence_nom}</Typography>
//                   )}
//                 </TableCell>

//                 <TableCell>
//                   <Typography variant="body2">
//                     {new Date(e.date_paiement).toLocaleDateString('fr-FR')}
//                   </Typography>
//                 </TableCell>

               

//                 <TableCell>
//                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
//                     {e.documents.length === 0 ? (
//                       <Typography variant="caption" color="text.secondary">—</Typography>
//                     ) : e.documents.map((doc) => (
//                       <Button
//                         key={doc.id}
//                         size="small" variant="text"
//                         startIcon={<DownloadOutlined sx={{ fontSize: 14 }} />}
//                         href={doc.fichier}
//                         target="_blank" rel="noopener noreferrer"
//                         sx={{ fontSize: 11, px: 0.5, justifyContent: 'flex-start' }}
//                       >
//                         {doc.type_doc_display}
//                       </Button>
//                     ))}
//                   </Box>
//                 </TableCell>

//                 <TableCell>
//                   <Tooltip title={
//                     e.documents.length === 0
//                       ? 'Aucun document disponible'
//                       : `Télécharger ${e.documents.length} document(s) en ZIP`
//                   }>
//                     <span>
//                       <Button
//                         size="small" variant="contained" color="primary"
//                         startIcon={
//                           downloading[e.id]
//                             ? <CircularProgress size={14} color="inherit" />
//                             : <FolderZipOutlined />
//                         }
//                         onClick={() => telechargerZip(e)}
//                         disabled={e.documents.length === 0 || downloading[e.id]}
//                       >
//                         ZIP
//                       </Button>
//                     </span>
//                   </Tooltip>
//                 </TableCell>

//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//         <TablePagination
//           component="div"
//           count={total}
//           page={page}
//           rowsPerPage={15}
//           onPageChange={(_, p) => setPage(p)}
//           rowsPerPageOptions={[15]}
//           labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
//         />
//       </TableContainer>
//     </Box>
//   )
// }


'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, CircularProgress, Alert,
  TablePagination, Chip, Tooltip, ToggleButtonGroup,
  ToggleButton, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Tabs, Tab, Autocomplete, IconButton
} from '@mui/material'
import {
  SearchOutlined, DownloadOutlined,
  FolderZipOutlined, CheckCircleOutlined,
  CancelOutlined, HourglassEmptyOutlined,
  CloseOutlined
} from '@mui/icons-material'
import { transactionAPI, agenceAPI, clientAPI, produitAPI } from '@/lib/api'

interface Document {
  id:               number
  type_doc:         string
  type_doc_display: string
  fichier:          string
}

interface Enregistrement {
  id:                 number
  nom_client:         string
  prenom_client:      string
  type_piece_display: string
  numero_piece:       string
  date_paiement:      string
  caissier_nom:       string
  agence_nom:         string | null
  documents_complets: boolean
  documents:          Document[]
  created_at:         string
}

interface Agence  { id: number; nom: string }
interface Client  { id: number; nom: string; prenom: string }
interface Produit { id: number; nom: string; nom_display: string }

type FiltreStatut = 'tous' | 'valide' | 'rejete' | 'en_attente'
type OngletExport  = 'agence' | 'client' | 'produit'

const STATUT_CONFIG = {
  valide:     { label: 'Validé',     color: 'success' as const, icon: <CheckCircleOutlined sx={{ fontSize: 14 }} /> },
  rejete:     { label: 'Rejeté',     color: 'error'   as const, icon: <CancelOutlined      sx={{ fontSize: 14 }} /> },
  en_attente: { label: 'En attente', color: 'warning' as const, icon: <HourglassEmptyOutlined sx={{ fontSize: 14 }} /> },
}

export default function ArchivesPage() {
  const [enregistrements, setEnregistrements] = useState<Enregistrement[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(0)
  const [total, setTotal]         = useState(0)
  const [statut, setStatut]       = useState<FiltreStatut>('tous')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin,   setDateFin]   = useState('')
  const [agences, setAgences]     = useState<Agence[]>([])
  const [agenceId, setAgenceId]   = useState('')
  const [downloading, setDownloading] = useState<Record<number, boolean>>({})

  // ── Modal Export groupé ────────────────────────────────────
  const [dialogExport, setDialogExport] = useState(false)
  const [ongletExport, setOngletExport] = useState<OngletExport>('agence')
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError]     = useState('')

  const [clients, setClients]   = useState<Client[]>([])
  const [produits, setProduits] = useState<Produit[]>([])

  // Filtres onglet Agence
  const [expAgence, setExpAgence]         = useState<Agence | null>(null)
  const [expAgenceDebut, setExpAgenceDebut] = useState('')
  const [expAgenceFin, setExpAgenceFin]     = useState('')

  // Filtres onglet Client
  const [expClient, setExpClient]           = useState<Client | null>(null)
  const [expClientProduit, setExpClientProduit] = useState<Produit | null>(null) // null = tous
  const [expClientDebut, setExpClientDebut] = useState('')
  const [expClientFin, setExpClientFin]     = useState('')

  // Filtres onglet Produit
  const [expProduit, setExpProduit]         = useState<Produit | null>(null)
  const [expProduitAgence, setExpProduitAgence] = useState<Agence | null>(null) // null = toutes
  const [expProduitDebut, setExpProduitDebut] = useState('')
  const [expProduitFin, setExpProduitFin]     = useState('')

  const charger = useCallback(async (
    q: string, p: number, s: FiltreStatut,
    dd: string, df: string, ag: string
  ) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = {
        search: q, page: p + 1, page_size: 15,
      }
      if (s !== 'tous') params.statut     = s
      if (dd)           params.date_debut = dd
      if (df)           params.date_fin   = df
      if (ag)           params.agence_id  = ag

      const { data } = await transactionAPI.liste(params)
      setEnregistrements(data.results ?? data)
      setTotal(data.count ?? (data.results ?? data).length)
    } catch {
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    agenceAPI.liste({ is_active: true }).then(({ data }) =>
      setAgences(data.results ?? data)
    )
  }, [])

  // Charger clients + produits seulement à l'ouverture de la modale (évite un appel inutile au montage)
  useEffect(() => {
    if (!dialogExport) return
    if (clients.length === 0) {
      clientAPI.liste().then(({ data }) => setClients(data.results ?? data))
    }
    if (produits.length === 0) {
      produitAPI.liste().then(({ data }) => setProduits(data.results ?? data))
    }
  }, [dialogExport])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0)
      charger(search, 0, statut, dateDebut, dateFin, agenceId)
    }, 400)
    return () => clearTimeout(t)
  }, [search, dateDebut, dateFin, agenceId, statut])

  useEffect(() => {
    charger(search, page, statut, dateDebut, dateFin, agenceId)
  }, [page])

  const handleStatut = (_: React.MouseEvent<HTMLElement>, val: FiltreStatut | null) => {
    if (!val) return
    setStatut(val)
    setPage(0)
  }

  const telechargerZip = async (enreg: Enregistrement) => {
    setDownloading((prev) => ({ ...prev, [enreg.id]: true }))
    try {
      const { data } = await transactionAPI.telechargerZip(enreg.id)
      const url  = URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
      const link = document.createElement('a')
      link.href     = url
      link.download = `dossier_${enreg.prenom_client}_${enreg.nom_client}_${enreg.id}.zip`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Erreur lors du téléchargement.')
    } finally {
      setDownloading((prev) => ({ ...prev, [enreg.id]: false }))
    }
  }

  const resetExportForm = () => {
    setExpAgence(null); setExpAgenceDebut(''); setExpAgenceFin('')
    setExpClient(null); setExpClientProduit(null); setExpClientDebut(''); setExpClientFin('')
    setExpProduit(null); setExpProduitAgence(null); setExpProduitDebut(''); setExpProduitFin('')
    setExportError('')
  }

  const fermerDialogExport = () => {
    setDialogExport(false)
    resetExportForm()
  }

  // ── Téléchargement groupé selon l'onglet actif ──────────────
  const handleExportGroupe = async () => {
    setExportError('')

    // let params: Record<string, string | number> = {}
    
     let params: {
    date_debut: string
    date_fin: string
    agence_id?: number
    client_id?: number
    produit_id?: number
  } = { date_debut: '', date_fin: '' }
    

    let nomFichier = 'export'

    if (ongletExport === 'agence') {
      if (!expAgence || !expAgenceDebut || !expAgenceFin) {
        setExportError('Agence et intervalle de dates sont obligatoires.')
        return
      }
      params = { agence_id: expAgence.id, date_debut: expAgenceDebut, date_fin: expAgenceFin }
      nomFichier = `transactions_agence_${expAgence.nom}_${expAgenceDebut}_${expAgenceFin}.zip`
    }

    if (ongletExport === 'client') {
      if (!expClient || !expClientDebut || !expClientFin) {
        setExportError('Client et intervalle de dates sont obligatoires.')
        return
      }
      params = { client_id: expClient.id, date_debut: expClientDebut, date_fin: expClientFin }
      if (expClientProduit) params.produit_id = expClientProduit.id
      nomFichier = `transactions_client_${expClient.nom}_${expClientDebut}_${expClientFin}.zip`
    }

    if (ongletExport === 'produit') {
      if (!expProduit || !expProduitDebut || !expProduitFin) {
        setExportError('Produit et intervalle de dates sont obligatoires.')
        return
      }
      params = { produit_id: expProduit.id, date_debut: expProduitDebut, date_fin: expProduitFin }
      if (expProduitAgence) params.agence_id = expProduitAgence.id
      nomFichier = `transactions_produit_${expProduit.nom}_${expProduitDebut}_${expProduitFin}.zip`
    }

    setExportLoading(true)
    try {
      const { data } = await transactionAPI.exportZip(params)
      const url  = URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
      const link = document.createElement('a')
      link.href     = url
      link.download = nomFichier
      link.click()
      URL.revokeObjectURL(url)
      fermerDialogExport()
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setExportError('Aucune transaction trouvée pour ces critères.')
      } else {
        setExportError("Erreur lors de la génération de l'export.")
      }
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <FolderZipOutlined sx={{ color: '#0D47A1', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Archives</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Consultez et téléchargez les dossiers et leurs documents
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<FolderZipOutlined />}
          onClick={() => setDialogExport(true)}
          sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
        >
          Export groupé
        </Button>
      </Box>

      {/* ── Filtres ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{
          display: 'flex', gap: 2, alignItems: 'center',
          flexWrap: 'wrap', py: '12px !important',
        }}>
          <TextField
            placeholder="Rechercher par nom client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small" sx={{ width: 250 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <ToggleButtonGroup value={statut} exclusive onChange={handleStatut} size="small">
            <ToggleButton value="tous">Tous</ToggleButton>
            <ToggleButton value="valide"     sx={{ color: 'success.main' }}>Validés</ToggleButton>
            <ToggleButton value="rejete"     sx={{ color: 'error.main'   }}>Rejetés</ToggleButton>
            <ToggleButton value="en_attente" sx={{ color: 'warning.main' }}>En attente</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            select label="Agence" value={agenceId}
            onChange={(e) => { setAgenceId(e.target.value); setPage(0) }}
            size="small" sx={{ width: 180 }}
          >
            <MenuItem value="">Toutes</MenuItem>
            {agences.map((a) => (
              <MenuItem key={a.id} value={String(a.id)}>{a.nom}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Du" type="date" size="small"
            value={dateDebut}
            onChange={(e) => { setDateDebut(e.target.value); setPage(0) }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 155 }}
          />
          <TextField
            label="Au" type="date" size="small"
            value={dateFin}
            onChange={(e) => { setDateFin(e.target.value); setPage(0) }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 155 }}
          />

          {(dateDebut || dateFin || agenceId) && (
            <Typography
              variant="body2"
              sx={{ color: '#0D47A1', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => { setDateDebut(''); setDateFin(''); setAgenceId('') }}
            >
              Réinitialiser
            </Typography>
          )}
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1e293b' }}>
              {['Client', 'Pièce', 'Caissier / Agence', 'Date paiement', 'Documents', 'ZIP'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : enregistrements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucun dossier trouvé
                </TableCell>
              </TableRow>
            ) : enregistrements.map((e) => (
              <TableRow key={e.id} hover>

                <TableCell>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                    {e.prenom_client} {e.nom_client}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">#{e.id}</Typography>
                </TableCell>

                <TableCell>
                  <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{e.type_piece_display}</Typography>
                  <Typography variant="caption" color="text.secondary">{e.numero_piece}</Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.caissier_nom}</Typography>
                  {e.agence_nom && (
                    <Typography variant="caption" color="text.secondary">{e.agence_nom}</Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {new Date(e.date_paiement).toLocaleDateString('fr-FR')}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {e.documents.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    ) : e.documents.map((doc) => (
                      <Button
                        key={doc.id}
                        size="small" variant="text"
                        startIcon={<DownloadOutlined sx={{ fontSize: 14 }} />}
                        href={doc.fichier}
                        target="_blank" rel="noopener noreferrer"
                        sx={{ fontSize: 11, px: 0.5, justifyContent: 'flex-start' }}
                      >
                        {doc.type_doc_display}
                      </Button>
                    ))}
                  </Box>
                </TableCell>

                <TableCell>
                  <Tooltip title={
                    e.documents.length === 0
                      ? 'Aucun document disponible'
                      : `Télécharger ${e.documents.length} document(s) en ZIP`
                  }>
                    <span>
                      <Button
                        size="small" variant="contained" color="primary"
                        startIcon={
                          downloading[e.id]
                            ? <CircularProgress size={14} color="inherit" />
                            : <FolderZipOutlined />
                        }
                        onClick={() => telechargerZip(e)}
                        disabled={e.documents.length === 0 || downloading[e.id]}
                      >
                        ZIP
                      </Button>
                    </span>
                  </Tooltip>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={15}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPageOptions={[15]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </TableContainer>

      {/* ── Modal Export groupé ── */}
      <Dialog open={dialogExport} onClose={fermerDialogExport} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Export groupé de transactions
          <IconButton size="small" onClick={fermerDialogExport}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>

        <Tabs
          value={ongletExport}
          onChange={(_, v) => { setOngletExport(v); setExportError('') }}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Agence"  value="agence" />
          <Tab label="Client"  value="client" />
          <Tab label="Produit" value="produit" />
        </Tabs>

        <DialogContent dividers>
          {exportError && <Alert severity="error" sx={{ mb: 2 }}>{exportError}</Alert>}

          {/* ── Onglet Agence ── */}
          {ongletExport === 'agence' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Télécharger toutes les transactions d'une agence sur un intervalle de temps.
              </Typography>
              <Autocomplete
                options={agences}
                getOptionLabel={(a) => a.nom}
                value={expAgence}
                onChange={(_, v) => setExpAgence(v)}
                renderInput={(params) => <TextField {...params} label="Agence *" size="small" />}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Du *" type="date" size="small" fullWidth
                  value={expAgenceDebut}
                  onChange={(e) => setExpAgenceDebut(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Au *" type="date" size="small" fullWidth
                  value={expAgenceFin}
                  onChange={(e) => setExpAgenceFin(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
            </Box>
          )}

          {/* ── Onglet Client ── */}
          {ongletExport === 'client' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Télécharger toutes les transactions d'un client, tous produits confondus ou pour un produit précis.
              </Typography>
              <Autocomplete
                options={clients}
                getOptionLabel={(c) => `${c.prenom} ${c.nom}`}
                value={expClient}
                onChange={(_, v) => setExpClient(v)}
                renderInput={(params) => <TextField {...params} label="Client *" size="small" />}
              />
              <Autocomplete
                options={produits}
                getOptionLabel={(p) => p.nom_display}
                value={expClientProduit}
                onChange={(_, v) => setExpClientProduit(v)}
                renderInput={(params) => <TextField {...params} label="Produit (optionnel — tous par défaut)" size="small" />}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Du *" type="date" size="small" fullWidth
                  value={expClientDebut}
                  onChange={(e) => setExpClientDebut(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Au *" type="date" size="small" fullWidth
                  value={expClientFin}
                  onChange={(e) => setExpClientFin(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
            </Box>
          )}

          {/* ── Onglet Produit ── */}
          {ongletExport === 'produit' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Télécharger toutes les transactions d'un produit, pour une agence précise ou toutes les agences.
              </Typography>
              <Autocomplete
                options={produits}
                getOptionLabel={(p) => p.nom_display}
                value={expProduit}
                onChange={(_, v) => setExpProduit(v)}
                renderInput={(params) => <TextField {...params} label="Produit *" size="small" />}
              />
              <Autocomplete
                options={agences}
                getOptionLabel={(a) => a.nom}
                value={expProduitAgence}
                onChange={(_, v) => setExpProduitAgence(v)}
                renderInput={(params) => <TextField {...params} label="Agence (optionnel — toutes par défaut)" size="small" />}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Du *" type="date" size="small" fullWidth
                  value={expProduitDebut}
                  onChange={(e) => setExpProduitDebut(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Au *" type="date" size="small" fullWidth
                  value={expProduitFin}
                  onChange={(e) => setExpProduitFin(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={fermerDialogExport}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleExportGroupe}
            disabled={exportLoading}
            startIcon={exportLoading ? <CircularProgress size={16} color="inherit" /> : <FolderZipOutlined />}
            sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
          >
            Télécharger le ZIP
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  )
}