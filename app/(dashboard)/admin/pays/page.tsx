// 'use client'
// import { useEffect, useState, useCallback } from 'react'
// import { useRouter } from 'next/navigation'
// import {
//   Box, Typography, Button, Card, CardContent,
//   Table, TableBody, TableCell, TableContainer,
//   TableHead, TableRow, Paper, TextField,
//   InputAdornment, CircularProgress, Alert, TablePagination, IconButton, Tooltip, Chip
// } from '@mui/material'
// import { AddCircleOutlined, SearchOutlined,BlockOutlined, PublicOutlined, DeleteOutlined, CheckCircleOutlined, HighlightOff } from '@mui/icons-material'
// import { paysAPI } from '@/lib/api'

// interface Pays {
//   id: number
//   nom: string
//   code: string // Modifié de code_iso à code pour s'aligner sur Django
//   is_active: boolean // Ajouté pour correspondre au modèle
// }

// export default function ListePaysPage() {
//   const router = useRouter()
//   const [pays, setPays]           = useState<Pays[]>([])
//   const [loading, setLoading]     = useState(true)
//   const [error, setError]         = useState('')
//   const [search, setSearch]       = useState('')

//   // Pagination Synchrone avec Django
//   const [totalCount, setTotalCount]   = useState(0)
//   const [page, setPage]               = useState(0)
//   const [rowsPerPage, setRowsPerPage] = useState(10)

//   const charger = useCallback(async (q: string, p: number, limit: number) => {
//     setLoading(true)
//     try {
//       const params = {
//         search: q || undefined,
//         page: p + 1,
//         limit: limit
//       }
//       const { data } = await paysAPI.liste(params)
      
//       if (data.results) {
//         setPays(data.results)
//         setTotalCount(data.count)
//       } else {
//         setPays(data)
//         setTotalCount(data.length)
//       }
//     } catch (err) {
//       console.error(err)
//       setError('Erreur lors du chargement des pays.')
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   // Applique le debounce pour éviter de surcharger PostgreSQL à chaque touche frappée
//   useEffect(() => {
//     const t = setTimeout(() => {
//       charger(search, page, rowsPerPage)
//     }, 350)
//     return () => clearTimeout(t)
//   }, [search, page, rowsPerPage, charger])

//   const handleToggleActive = async (id: number, actuelStatut: boolean) => {
//   const action = actuelStatut ? 'désactiver' : 'réactiver'
//   if (!window.confirm(`Voulez-vous vraiment ${action} ce pays ?`)) return

//   try {
//     // On envoie la modification partielle à Django
//     await paysAPI.modifier(id, { is_active: !actuelStatut })
    
//     // On rafraîchit le tableau
//     charger(search, page, rowsPerPage)
//   } catch (err) {
//     console.error(err)
//     setError(`Impossible de changer le statut du pays.`)
//   }
// }

//   return (
//     <Box sx={{ p: 1 }}>
//       {/* En-tête */}
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 700 }}>Gestion des Pays</Typography>
//           <Typography variant="body2" color="text.secondary">
//             Configuration du découpage territorial de la plateforme
//           </Typography>
//         </Box>
//         <Button
//           variant="contained"
//           startIcon={<AddCircleOutlined />}
//           onClick={() => router.push('/admin/pays/nouveau')}
//           sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' } }}
//         >
//           Ajouter un pays
//         </Button>
//       </Box>

//       {/* Barre de recherche */}
//       <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
//         <CardContent sx={{ py: '12px !important' }}>
//           <TextField
//             placeholder="Rechercher par nom ou code..."
//             value={search}
//             onChange={(e) => { setSearch(e.target.value); setPage(0); }}
//             size="small" 
//             sx={{ width: 300 }}
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
//         </CardContent>
//       </Card>

//       {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

//       {/* Table */}
//       <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ bgcolor: '#0f172a' }}>
//               {['ID', 'Nom du Pays', 'Code Unique', 'Statut', 'Actions'].map((h) => (
//                 <TableCell key={h} sx={{ color: 'white', fontWeight: 600, py: 2 }}>{h}</TableCell>
//               ))}
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
//                   <CircularProgress size={36} />
//                 </TableCell>
//               </TableRow>
//             ) : pays.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
//                   Aucun pays trouvé dans le système.
//                 </TableCell>
//               </TableRow>
//             ) : pays.map((p) => (
//               <TableRow key={p.id} hover>
//                 <TableCell sx={{ color: 'text.secondary', width: '80px' }}>#{p.id}</TableCell>
//                 <TableCell sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
//                   <PublicOutlined sx={{ color: '#0D47A1', fontSize: 20 }} />
//                   {p.nom}
//                 </TableCell>
//                 <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>
//                   {p.code}
//                 </TableCell>
//                 <TableCell>
//                   <Chip
//                     icon={p.is_active ? <CheckCircleOutlined /> : <HighlightOff />}
//                     label={p.is_active ? "Actif" : "Inactif"}
//                     color={p.is_active ? "success" : "default"}
//                     variant="outlined"
//                     size="small"
//                   />
//                 </TableCell>
//                 <TableCell sx={{ width: '100px' }}>
//                 <Tooltip title={p.is_active ? "Désactiver le pays" : "Activer le pays"}>
//                     <IconButton 
//                     size="small" 
//                     color={p.is_active ? "warning" : "success"} 
//                     onClick={() => handleToggleActive(p.id, p.is_active)}
//                     >
//                     {p.is_active ? <BlockOutlined fontSize="small" /> : <CheckCircleOutlined fontSize="small" />}
//                     </IconButton>
//                 </Tooltip>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>

//         <TablePagination
//           rowsPerPageOptions={[5, 10, 25]}
//           component="div"
//           count={totalCount}
//           rowsPerPage={rowsPerPage}
//           page={page}
//           onPageChange={(_, newPage) => setPage(newPage)}
//           onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
//           labelRowsPerPage="Lignes par page:"
//           labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
//         />
//       </TableContainer>
//     </Box>
//   )
// }


'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, CircularProgress, Alert, TablePagination,
  IconButton, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Skeleton
} from '@mui/material'
import {
  AddCircleOutlined, SearchOutlined, BlockOutlined, PublicOutlined,
  CheckCircleOutlined, HighlightOff, EditOutlined, CloseOutlined, SaveOutlined
} from '@mui/icons-material'
import { paysAPI } from '@/lib/api'

interface Pays {
  id: number
  nom: string
  code: string
  is_active: boolean
}

export default function ListePaysPage() {
  const router = useRouter()
  const [pays, setPays]         = useState<Pays[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')

  // Pagination
  const [totalCount, setTotalCount]   = useState(0)
  const [page, setPage]               = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // --- État Modal Modification ---
  const [modalOpen, setModalOpen]       = useState(false)
  const [modalFetching, setModalFetching] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError]     = useState('')
  const [editId, setEditId]             = useState<number | null>(null)
  const [form, setForm]                 = useState({ nom: '', code: '' })

  const charger = useCallback(async (q: string, p: number, limit: number) => {
    setLoading(true)
    try {
      const params = { search: q || undefined, page: p + 1, limit }
      const { data } = await paysAPI.liste(params)
      if (data.results) {
        setPays(data.results)
        setTotalCount(data.count)
      } else {
        setPays(data)
        setTotalCount(data.length)
      }
    } catch (err) {
      console.error(err)
      setError('Erreur lors du chargement des pays.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => charger(search, page, rowsPerPage), 350)
    return () => clearTimeout(t)
  }, [search, page, rowsPerPage, charger])

  // Ouvrir la modal et charger les données du pays
  const handleOpenModal = async (id: number) => {
    setEditId(id)
    setModalOpen(true)
    setModalError('')
    setModalFetching(true)
    try {
      const { data } = await paysAPI.detail(id)
      setForm({ nom: data.nom, code: data.code })
    } catch {
      setModalError('Impossible de charger les données du pays.')
    } finally {
      setModalFetching(false)
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditId(null)
    setForm({ nom: '', code: '' })
    setModalError('')
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value
    }))
  }

  const handleSubmitModal = async () => {
    if (!editId) return
    setModalLoading(true)
    setModalError('')
    try {
      await paysAPI.modifier(editId, form)
      handleCloseModal()
      charger(search, page, rowsPerPage)
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } }
      const msgs = Object.values(e.response?.data || {}).flat()
      setModalError(msgs[0] || 'Erreur lors de la modification.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleToggleActive = async (id: number, actuelStatut: boolean) => {
    const action = actuelStatut ? 'désactiver' : 'réactiver'
    if (!window.confirm(`Voulez-vous vraiment ${action} ce pays ?`)) return
    try {
      await paysAPI.modifier(id, { is_active: !actuelStatut })
      charger(search, page, rowsPerPage)
    } catch {
      setError('Impossible de changer le statut du pays.')
    }
  }

  const formValide = !!form.nom && !!form.code

  return (
    <Box sx={{ p: 1 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Gestion des Pays</Typography>
          <Typography variant="body2" color="text.secondary">
            Configuration du découpage territorial de la plateforme
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlined />}
          onClick={() => router.push('/admin/pays/nouveau')}
          sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' } }}
        >
          Ajouter un pays
        </Button>
      </Box>

      {/* Barre de recherche */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ py: '12px !important' }}>
          <TextField
            placeholder="Rechercher par nom ou code..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            size="small"
            sx={{ width: 300 }}
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
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0f172a' }}>
              {['ID', 'Nom du Pays', 'Code Unique', 'Statut', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600, py: 2 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={36} />
                </TableCell>
              </TableRow>
            ) : pays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucun pays trouvé dans le système.
                </TableCell>
              </TableRow>
            ) : pays.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ color: 'text.secondary', width: '80px' }}>#{p.id}</TableCell>
                <TableCell sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                  <PublicOutlined sx={{ color: '#0D47A1', fontSize: 20 }} />
                  {p.nom}
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>{p.code}</TableCell>
                <TableCell>
                  <Chip
                    icon={p.is_active ? <CheckCircleOutlined /> : <HighlightOff />}
                    label={p.is_active ? 'Actif' : 'Inactif'}
                    color={p.is_active ? 'success' : 'default'}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ width: '120px' }}>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title="Modifier le pays">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditOutlined sx={{ fontSize: 14 }} />}
                      onClick={() => handleOpenModal(p.id)}
                      sx={{ textTransform: 'none', fontSize: 12 }}
                    >
                      Modifier
                    </Button>
                  </Tooltip>

                  <Tooltip title={p.is_active ? 'Désactiver le pays' : 'Activer le pays'}>
                    <IconButton
                      size="small"
                      color={p.is_active ? 'warning' : 'success'}
                      onClick={() => handleToggleActive(p.id, p.is_active)}
                    >
                      {p.is_active ? <BlockOutlined fontSize="small" /> : <CheckCircleOutlined fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </TableContainer>

      {/* ── Modal Modification ── */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, fontWeight: 700, fontSize: '1.1rem' }}>
          Modifier le Pays
          <IconButton size="small" onClick={handleCloseModal}>
            <CloseOutlined fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}

          {modalFetching ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}><Skeleton variant="rounded" height={56} /></Grid>
              <Grid size={{ xs: 12 }}><Skeleton variant="rounded" height={56} /></Grid>
            </Grid>
          ) : (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Nom du pays"
                  name="nom"
                  placeholder="Ex: République du Congo"
                  value={form.nom}
                  onChange={handleFormChange}
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
                  onChange={handleFormChange}
                  required
                  helperText="Identifiant ou trigramme unique (ex: CG, FR, RDC)"
                  slotProps={{ htmlInput: { maxLength: 10 } }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} variant="outlined" size="small">
            Annuler
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleSubmitModal}
            disabled={modalLoading || modalFetching || !formValide}
            startIcon={modalLoading ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
            sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' } }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}