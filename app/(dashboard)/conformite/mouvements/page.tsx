// 'use client'

// import { useState, useEffect } from 'react'
// import {
//     Box, Typography, Card, CardContent, Button,
//     Grid, TextField, Alert, CircularProgress,
//     Chip, Dialog, DialogTitle, DialogContent, DialogActions,
//     FormControl, InputLabel, Select, MenuItem,
//     LinearProgress, Collapse, Tooltip, IconButton

// } from '@mui/material'


// import {
//   AccountBalanceOutlined,
//   AddOutlined,
//   ExpandMoreOutlined,
//   ExpandLessOutlined,
//   DownloadOutlined,
//   UploadFileOutlined,
//   CheckCircleOutlined,
//   RadioButtonUncheckedOutlined,
//   CloseOutlined,
//   FolderOffOutlined,
// } from '@mui/icons-material'
// import { archiveAgenceAPI, agenceAPI, produitAPI } from '@/lib/api'

// // ─── Types ────────────────────────────────────────────────────

// interface Agence {
//   id: number
//   nom: string
//   code: string
// }

// interface Produit {
//   id: number
//   nom: string
//   nom_display: string
//   is_active: boolean
// }

// interface DocumentArchive {
//   id: number
//   type_doc: string
//   type_doc_display: string
//   fichier: string
//   uploade_par: number
//   uploaded_at: string
// }

// interface Archive {
//   id: number
//   agence: number
//   agence_nom: string
//   agence_code: string
//   produit: number
//   produit_nom: string
//   date: string
//   archive_par: number
//   archive_par_nom: string
//   documents: DocumentArchive[]
//   documents_complets: boolean
//   types_requis: { value: string; label: string }[]
//   created_at: string
//   updated_at: string
// }

// // ─── Couleurs par produit ──────────────────────────────────────

// const PRODUIT_COLORS: Record<string, { bg: string; color: string }> = {
//   western_union: { bg: '#E6F1FB', color: '#0C447C' },
//   change:        { bg: '#EAF3DE', color: '#27500A' },
//   visa:          { bg: '#EEEDFE', color: '#3C3489' },
//   momo:          { bg: '#FAEEDA', color: '#633806' },
//   airtel_money:  { bg: '#FAECE7', color: '#712B13' },
// }

// function getProduitStyle(nom: string) {
//   return PRODUIT_COLORS[nom] ?? { bg: '#F1EFE8', color: '#444441' }
// }

// // ─── Statut archive ────────────────────────────────────────────

// function getStatut(archive: Archive): { label: string; color: 'success' | 'warning' | 'error' } {
//   const total  = archive.types_requis.length
//   const done   = archive.documents.length
//   if (done === 0)     return { label: 'Vide',    color: 'error'   }
//   if (done >= total)  return { label: 'Complet', color: 'success' }
//   return { label: `${done}/${total}`, color: 'warning' }
// }

// // ─── Carte d'un document ───────────────────────────────────────

// function DocSlot({
//   typeDoc,
//   label,
//   document,
//   onUpload,
//   uploading,
// }: {
//   typeDoc:   string
//   label:     string
//   document?: DocumentArchive
//   onUpload:  (typeDoc: string, file: File) => void
//   uploading: boolean
// }) {
//   const done = !!document

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) onUpload(typeDoc, file)
//     e.target.value = ''
//   }

//   return (
//     <Box
//       sx={{
//         border: done
//           ? '1px solid'
//           : '1px dashed',
//         borderColor: done ? 'success.light' : 'divider',
//         borderRadius: 2,
//         p: 1.5,
//         bgcolor: done ? 'success.50' : 'background.default',
//         display: 'flex',
//         flexDirection: 'column',
//         gap: 1,
//       }}
//     >
//       <Typography
//         sx={{ fontSize: 13, fontWeight: 500 }}
//         color={done ? 'success.dark' : 'text.primary'}
//       >
//         {label}
//       </Typography>

//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//         {done ? (
//           <CheckCircleOutlined sx={{ fontSize: 14, color: 'success.main' }} />
//         ) : (
//           <RadioButtonUncheckedOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
//         )}
//         <Typography  sx={{ fontSize: 11}} color={done ? 'success.main' : 'text.secondary'}>
//           {done ? 'Uploadé' : 'Manquant'}
//         </Typography>
//       </Box>

//       {done && document ? (
//         <Tooltip title="Télécharger ce document">
//           <Typography
//             component="a"
//             href={document.fichier}
//             target="_blank"
//             color="primary"
//             sx={{ fontSize: 11 ,textDecoration: 'underline', cursor: 'pointer' }}
//           >
//             Voir le fichier
//           </Typography>
//         </Tooltip>
//       ) : (
//         <label>
//           <input
//             type="file"
//             hidden
//             accept=".pdf,.jpg,.jpeg,.png"
//             onChange={handleChange}
//             disabled={uploading}
//           />
//           <Button
//             component="span"
//             size="small"
//             variant="outlined"
//             disabled={uploading}
//             startIcon={
//               uploading
//                 ? <CircularProgress size={10} />
//                 : <UploadFileOutlined sx={{ fontSize: 14 }} />
//             }
//             sx={{ fontSize: 11, py: 0.25, px: 1 }}
//           >
//             Uploader
//           </Button>
//         </label>
//       )}
//     </Box>
//   )
// }

// // ─── Carte archive ─────────────────────────────────────────────

// function ArchiveCard({
//   archive,
//   onUpload,
//   onDownloadZip,
// }: {
//   archive:        Archive
//   onUpload:       (archiveId: number, typeDoc: string, file: File) => void
//   onDownloadZip:  (archive: Archive) => void
// }) {
//   const [open, setOpen]           = useState(false)
//   const [uploading, setUploading] = useState<string | null>(null)

//   const statut = getStatut(archive)
//   const style  = getProduitStyle(archive.produit_nom)

//   const handleUpload = async (typeDoc: string, file: File) => {
//     setUploading(typeDoc)
//     await onUpload(archive.id, typeDoc, file)
//     setUploading(null)
//   }

//   const total    = archive.types_requis.length
//   const done     = archive.documents.length
//   const progress = total > 0 ? Math.round((done / total) * 100) : 0

//   return (
//     <Card variant="outlined" sx={{ borderRadius: 2, mb: 1 }}>
//       {/* En-tête cliquable */}
//       <Box
//         onClick={() => setOpen(!open)}
//         sx={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           p: '10px 16px',
//           cursor: 'pointer',
//           '&:hover': { bgcolor: 'action.hover' },
//           gap: 1,
//           flexWrap: 'wrap',
//         }}
//       >
//         <Box  sx={{ display: 'flex', alignItems: 'center', gap: 1.5  , flex: 1, minWidth: 0 }}>
//           {/* Badge produit */}
//           <Chip
//             label={archive.produit_nom}
//             size="small"
//             sx={{
//               bgcolor: style.bg,
//               color:   style.color,
//               fontWeight: 500,
//               fontSize: 12,
//               height: 24,
//             }}
//           />
//           <Box>
//             <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
//               {archive.agence_nom}
//             </Typography>
//             <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
//               {new Date(archive.date).toLocaleDateString('fr-FR')}
//             </Typography>
//           </Box>
//         </Box>

//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <Chip
//             label={statut.label}
//             color={statut.color}
//             size="small"
//             sx={{ fontSize: 11, height: 22 }}
//           />
//           <Tooltip title="Télécharger ZIP">
//             <IconButton
//               size="small"
//               onClick={(e) => { e.stopPropagation(); onDownloadZip(archive) }}
//             >
//               <DownloadOutlined sx={{ fontSize: 18 }} />
//             </IconButton>
//           </Tooltip>
//           {open ? (
//             <ExpandLessOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
//           ) : (
//             <ExpandMoreOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
//           )}
//         </Box>
//       </Box>

//       {/* Barre de progression */}
//       {!archive.documents_complets && (
//         <LinearProgress
//           variant="determinate"
//           value={progress}
//           color={statut.color === 'error' ? 'error' : 'warning'}
//           sx={{ height: 2 }}
//         />
//       )}

//       {/* Détail des documents */}
//       <Collapse in={open} unmountOnExit>
//         <CardContent sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
//           <Typography
//           sx={{ fontSize: 11, color: 'text.secondary', mb: 1, fontWeight: 500 , letterSpacing: '0.05em' }}
          
//           >
//             Documents requis
//           </Typography>
//           <Grid container spacing={1}>
//             {archive.types_requis.map(({ value, label }) => {
//               const doc = archive.documents.find(d => d.type_doc === value)
//               return (
//                 <Grid  size={{ xs: 12, sm: 6, md: 4 }} key={value}>
//                   <DocSlot
//                     typeDoc={value}
//                     label={label}
//                     document={doc}
//                     onUpload={handleUpload}
//                     uploading={uploading === value}
//                   />
//                 </Grid>
//               )
//             })}
//           </Grid>
//           <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
//             <Button
//               size="small"
//               startIcon={<DownloadOutlined />}
//               onClick={() => onDownloadZip(archive)}
//             >
//               Télécharger ZIP
//             </Button>
//           </Box>
//         </CardContent>
//       </Collapse>
//     </Card>
//   )
// }

// // ─── Modal nouvelle archive ────────────────────────────────────

// function NouvelleArchiveModal({
//   open,
//   agences,
//   produits,
//   onClose,
//   onCreate,
// }: {
//   open:     boolean
//   agences:  Agence[]
//   produits: Produit[]
//   onClose:  () => void
//   onCreate: (data: { agence: number; produit: number; date: string }) => Promise<void>
// }) {
//   const [agenceId,  setAgenceId]  = useState<number | ''>('')
//   const [produitId, setProduitId] = useState<number | ''>('')
//   const [date,      setDate]      = useState('')
//   const [loading,   setLoading]   = useState(false)
//   const [error,     setError]     = useState('')

//   const produitNom = produits.find(p => p.id === produitId)?.nom ?? ''

//   const TYPES_PREVIEW: Record<string, string[]> = {
//     western_union: ['Réconciliation','API','Arrêté de caisse (matin)','Arrêté de caisse (soir)','Journal de transaction'],
//     change:        ['Mouvement de caisse','Arrêté de caisse (matin)','Arrêté de caisse (soir)','Journal de transaction'],
//     visa:          ['Arrêté (matin)','Arrêté (soir)','Fiche de souscription','Fiche de réclamation'],
//     momo:          ['Arrêté de caisse (matin)','Arrêté de caisse (soir)'],
//     airtel_money:  ['Arrêté (matin)','Arrêté (soir)'],
//   }

//   const handleSubmit = async () => {
//     console.log({ agenceId, produitId, date }) // ← ajouter
//   if (!agenceId || !produitId || !date) {
//     setError('Veuillez remplir tous les champs.')
//     return
//   }
//     setLoading(true)
//     setError('')
//     try {
//       await onCreate({ agence: agenceId as number, produit: produitId as number, date })
//       setAgenceId(''); setProduitId(''); setDate('')
//       onClose()
//     } catch {
//       setError('Erreur lors de la création. Veuillez réessayer.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
//       <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//         <Typography sx={{ fontSize: 16, fontWeight: 500 }}>Nouvelle archive</Typography>
//         <IconButton size="small" onClick={onClose}><CloseOutlined /></IconButton>
//       </DialogTitle>

//       <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
//         {error && <Alert severity="error">{error}</Alert>}

//         <FormControl fullWidth size="small">
//           <InputLabel>Agence</InputLabel>
//           <Select
//             value={agenceId}
//             label="Agence"
//             onChange={e => setAgenceId(e.target.value as number)}
//           >
//             {agences.map(a => (
//               <MenuItem key={a.id} value={a.id}>{a.nom} ({a.code})</MenuItem>
//             ))}
//           </Select>
//         </FormControl>

//         <FormControl fullWidth size="small">
//           <InputLabel>Produit</InputLabel>
//           <Select
//             value={produitId}
//             label="Produit"
//             onChange={e => setProduitId(e.target.value as number)}
//           >
//             {produits.filter(p => p.is_active).map(p => (
//               <MenuItem key={p.id} value={p.id}>{p.nom_display}</MenuItem>
//             ))}
//           </Select>
//         </FormControl>

//         <TextField
//           label="Date"
//           type="date"
//           size="small"
//           fullWidth
//           slotProps={{ inputLabel: { shrink: true } }}
//           value={date}
//           onChange={e => setDate(e.target.value)}
//         />

//         {/* Aperçu des documents requis */}
//         {produitNom && TYPES_PREVIEW[produitNom] && (
//           <Box>
//             <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.75 }}>
//               Documents requis pour ce produit
//             </Typography>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
//               {TYPES_PREVIEW[produitNom].map(label => (
//                 <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                   <RadioButtonUncheckedOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
//                   <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
//                 </Box>
//               ))}
//             </Box>
//           </Box>
//         )}
//       </DialogContent>

//       <DialogActions>
//         <Button onClick={onClose} disabled={loading}>Annuler</Button>
//         <Button
//           variant="contained"
//           onClick={handleSubmit}
//           disabled={loading}
//           startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
//         >
//           Créer l'archive
//         </Button>
//       </DialogActions>
//     </Dialog>
//   )
// }

// // ─── Page principale ───────────────────────────────────────────

// export default function MouvementsAgencesPage() {
//   const [archives,     setArchives]     = useState<Archive[]>([])
//   const [agences,      setAgences]      = useState<Agence[]>([])
//   const [produits,     setProduits]     = useState<Produit[]>([])
//   const [loading,      setLoading]      = useState(true)
//   const [error,        setError]        = useState('')
//   const [modalOpen,    setModalOpen]    = useState(false)

//   // Filtres
//   const [filtreAgence,  setFiltreAgence]  = useState('')
//   const [filtreProduit, setFiltreProduit] = useState('')
//   const [filtreStatut,  setFiltreStatut]  = useState('')
//   const [filtreDebut,   setFiltreDebut]   = useState('')
//   const [filtreFin,     setFiltreFin]     = useState('')

//   // ── Chargement initial ─────────────────────────────────────
//   useEffect(() => {
//     const load = async () => {
//       try {
//         const [archRes, agRes, prRes] = await Promise.all([
//           archiveAgenceAPI.liste(),
//           agenceAPI.liste(),
//           produitAPI.liste(),
//         ])
//         setArchives(archRes.data.results ?? archRes.data)
//         setAgences(agRes.data.results   ?? agRes.data)
//         setProduits(prRes.data.results  ?? prRes.data)
//       } catch {
//         setError('Impossible de charger les données.')
//       } finally {
//         setLoading(false)
//       }
//     }
//     load()
//   }, [])

//   // ── Filtrage local ─────────────────────────────────────────
//   const archivesFiltrees = archives.filter(a => {
//     if (filtreAgence  && String(a.agence)  !== filtreAgence)  return false
//     if (filtreProduit && String(a.produit) !== filtreProduit) return false
//     if (filtreDebut   && a.date < filtreDebut)                return false
//     if (filtreFin     && a.date > filtreFin)                  return false
//     if (filtreStatut) {
//       const st = getStatut(a)
//       if (filtreStatut === 'complet' && st.color !== 'success') return false
//       if (filtreStatut === 'partiel' && st.color !== 'warning') return false
//       if (filtreStatut === 'vide'    && st.color !== 'error')   return false
//     }
//     return true
//   })

//   // ── Créer une archive ──────────────────────────────────────
//   const handleCreate = async (data: { agence: number; produit: number; date: string }) => {
//     const res = await archiveAgenceAPI.creer(data)
//     setArchives(prev => [res.data, ...prev])
//   }

//   // ── Uploader un document ───────────────────────────────────
// // const handleUpload = async (archiveId: number, typeDoc: string, file: File) => {
// //   const formData = new FormData()
// //   formData.append('type_doc', typeDoc)
// //   formData.append('fichier',  file)

// //   const userRaw = localStorage.getItem('user')
// //   const userId  = userRaw ? JSON.parse(userRaw).id : null
// //   if (userId) formData.append('uploade_par', String(userId))

// //   try {
// //     const res = await archiveAgenceAPI.uploadDoc(archiveId, formData)
// //     setArchives(prev =>
// //       prev.map(a =>
// //         a.id === archiveId
// //           ? {
// //               ...a,
// //               documents: [...a.documents, res.data],
// //               documents_complets:
// //                 a.documents.length + 1 >= a.types_requis.length,
// //             }
// //           : a
// //       )
// //     )
// //   } catch (err: any) {
// //     console.error('Upload échoué', err.response?.data)
// //     console.log('user raw:', localStorage.getItem('user'))
// //     console.log('access_token raw:', localStorage.getItem('access_token'))
// //   }
// // }

// const handleUpload = async (archiveId: number, typeDoc: string, file: File) => {
//   const formData = new FormData()
//   formData.append('type_doc', typeDoc)
//   formData.append('fichier',  file)

//   // Décoder le JWT pour extraire user_id
//   const token = localStorage.getItem('access_token')
//   if (token) {
//     const payload = JSON.parse(atob(token.split('.')[1]))
//     formData.append('uploade_par', String(payload.user_id))
//   }

//   try {
//     const res = await archiveAgenceAPI.uploadDoc(archiveId, formData)
//     setArchives(prev =>
//       prev.map(a =>
//         a.id === archiveId
//           ? {
//               ...a,
//               documents: [...a.documents, res.data],
//               documents_complets:
//                 a.documents.length + 1 >= a.types_requis.length,
//             }
//           : a
//       )
//     )
//   } catch (err: any) {
//     console.error('Upload échoué', err.response?.data)
//   }
// }
//   // ── Télécharger ZIP ────────────────────────────────────────
//   const handleDownloadZip = async (archive: Archive) => {
//   try {
//     const res  = await archiveAgenceAPI.telechargerZip(archive.id)
//     const url  = window.URL.createObjectURL(new Blob([res.data]))
//     const link = document.createElement('a')
//     link.href  = url
//     const fileName = `${archive.produit_nom}_${archive.date}.zip`
//     link.setAttribute('download', fileName)
//     document.body.appendChild(link)
//     link.click()
//     link.remove()
//     window.URL.revokeObjectURL(url)
//   } catch {
//     console.error('Échec du téléchargement ZIP')
//   }
// }

//   // ── Créer l'endpoint uploadDoc si absent (à ajouter dans api.ts) ──
//   // archiveAgenceAPI.uploadDoc = (id, data) =>
//   //   api.post(`/archives/${id}/documents/`, data, {
//   //     headers: { 'Content-Type': 'multipart/form-data' }
//   //   })

//   // ── Render ─────────────────────────────────────────────────
//   return (
//     <Box sx={{ p: { xs: 2, md: 3 } }}>

//       {/* En-tête */}
//       <Box
//         sx={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           mb: 2.5,
//           flexWrap: 'wrap',
//           gap: 1.5
//         }}
//       >
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <AccountBalanceOutlined sx={{ color: '#185FA5', fontSize: 26 }} />
//           <Typography  sx={{ fontSize: 20, fontWeight: 500 }}>
//             Mouvements agences
//           </Typography>
//         </Box>
//         <Button
//           variant="contained"
//           startIcon={<AddOutlined />}
//           onClick={() => setModalOpen(true)}
//         >
//           Nouvelle archive
//         </Button>
//       </Box>

//       {/* Filtres */}
//       <Card variant="outlined" sx={{ borderRadius: 2, mb: 2.5 }}>
//         <CardContent sx={{ pb: '12px !important' }}>
//           <Grid container spacing={1.5}>
//             <Grid size={{ xs: 12, sm: 6, md: 2 }} >
//               <FormControl fullWidth size="small">
//                 <InputLabel>Agence</InputLabel>
//                 <Select
//                   value={filtreAgence}
//                   label="Agence"
//                   onChange={e => setFiltreAgence(e.target.value)}
//                 >
//                   <MenuItem value="">Toutes</MenuItem>
//                   {agences.map(a => (
//                     <MenuItem key={a.id} value={String(a.id)}>{a.nom}</MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid size={{ xs: 12, sm: 6, md: 2 }}>
//               <FormControl fullWidth size="small">
//                 <InputLabel>Produit</InputLabel>
//                 <Select
//                   value={filtreProduit}
//                   label="Produit"
//                   onChange={e => setFiltreProduit(e.target.value)}
//                 >
//                   <MenuItem value="">Tous</MenuItem>
//                   {produits.map(p => (
//                     <MenuItem key={p.id} value={String(p.id)}>{p.nom_display}</MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid size={{ xs: 6, sm: 4, md: 2 }}>
//               <TextField
//                 label="Du"
//                 type="date"
//                 size="small"
//                 fullWidth
//                 slotProps={{ inputLabel: { shrink: true } }}
//                 value={filtreDebut}
//                 onChange={e => setFiltreDebut(e.target.value)}
//               />
//             </Grid>

//             <Grid size={{ xs: 6, sm: 4, md: 2 }}>
//               <TextField
//                 label="Au"
//                 type="date"
//                 size="small"
//                 fullWidth
//                 slotProps={{ inputLabel: { shrink: true } }}
//                 value={filtreFin}
//                 onChange={e => setFiltreFin(e.target.value)}
//               />
//             </Grid>

//             <Grid size={{ xs: 12, sm: 4, md: 2 }}>
//               <FormControl fullWidth size="small">
//                 <InputLabel>Statut</InputLabel>
//                 <Select
//                   value={filtreStatut}
//                   label="Statut"
//                   onChange={e => setFiltreStatut(e.target.value)}
//                 >
//                   <MenuItem value="">Tous</MenuItem>
//                   <MenuItem value="complet">Complet</MenuItem>
//                   <MenuItem value="partiel">Partiel</MenuItem>
//                   <MenuItem value="vide">Vide</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid size={{ xs: 12, sm: 4, md: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
//               <Button
//                 size="small"
//                 onClick={() => {
//                   setFiltreAgence('')
//                   setFiltreProduit('')
//                   setFiltreStatut('')
//                   setFiltreDebut('')
//                   setFiltreFin('')
//                 }}
//               >
//                 Réinitialiser
//               </Button>
//             </Grid>
//           </Grid>
//         </CardContent>
//       </Card>

//       {/* Compteur */}
//       <Typography sx={{ fontSize: 14, mb: 2, color: 'text.secondary' }}>
//         {archivesFiltrees.length} archive{archivesFiltrees.length !== 1 ? 's' : ''}
//       </Typography>

//       {/* Contenu */}
//       {loading && <LinearProgress />}

//       {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

//       {!loading && archivesFiltrees.length === 0 && (
//         <Box sx={{textAlign: 'center', py: 6, color: 'text.secondary'}}>
//           <FolderOffOutlined sx={{ fontSize: 40, mb: 1.5, opacity: 0.4 }} />
//           <Typography sx={{ fontSize: 14 }}>Aucune archive trouvée</Typography>
//         </Box>
//       )}

//       {archivesFiltrees.map(archive => (
//         <ArchiveCard
//         key={archive.id}
//         archive={archive}
//         onUpload={handleUpload}
//         onDownloadZip={handleDownloadZip}  // ← TypeScript va maintenant attendre Archive
//       />
//       ))}

//       {/* Modal création */}
//       <NouvelleArchiveModal
//         open={modalOpen}
//         agences={agences}
//         produits={produits}
//         onClose={() => setModalOpen(false)}
//         onCreate={handleCreate}
//       />
//     </Box>
//   )
// }



//-----------------------------------------MOUVEMENT 11 JUILLET 2026-------------------------------



// 'use client'

// import { useState, useEffect, useMemo } from 'react'
// import {
//     Box, Typography, Card, CardContent, Button,
//     Grid, TextField, Alert, CircularProgress,
//     Chip, Dialog, DialogTitle, DialogContent, DialogActions,
//     FormControl, InputLabel, Select, MenuItem,
//     LinearProgress, Collapse, Tooltip, IconButton,
//     Accordion, AccordionSummary, AccordionDetails,
// } from '@mui/material'


// import {
//   AccountBalanceOutlined,
//   AddOutlined,
//   ExpandMoreOutlined,
//   ExpandLessOutlined,
//   DownloadOutlined,
//   UploadFileOutlined,
//   CheckCircleOutlined,
//   RadioButtonUncheckedOutlined,
//   CloseOutlined,
//   FolderOffOutlined,
//   ApartmentOutlined,
// } from '@mui/icons-material'
// import { archiveAgenceAPI, agenceAPI, produitAPI } from '@/lib/api'

// // ─── Types ────────────────────────────────────────────────────

// interface Agence {
//   id: number
//   nom: string
//   code: string
// }

// interface Produit {
//   id: number
//   nom: string
//   nom_display: string
//   is_active: boolean
// }

// interface DocumentArchive {
//   id: number
//   type_doc: string
//   type_doc_display: string
//   fichier: string
//   uploade_par: number
//   uploaded_at: string
// }

// interface Archive {
//   id: number
//   agence: number
//   agence_nom: string
//   agence_code: string
//   produit: number
//   produit_nom: string
//   date: string
//   archive_par: number
//   archive_par_nom: string
//   documents: DocumentArchive[]
//   documents_complets: boolean
//   types_requis: { value: string; label: string }[]
//   created_at: string
//   updated_at: string
// }

// // ─── Couleurs par produit ──────────────────────────────────────

// const PRODUIT_COLORS: Record<string, { bg: string; color: string }> = {
//   western_union: { bg: '#E6F1FB', color: '#0C447C' },
//   change:        { bg: '#EAF3DE', color: '#27500A' },
//   visa:          { bg: '#EEEDFE', color: '#3C3489' },
//   momo:          { bg: '#FAEEDA', color: '#633806' },
//   airtel_money:  { bg: '#FAECE7', color: '#712B13' },
// }

// function getProduitStyle(nom: string) {
//   return PRODUIT_COLORS[nom] ?? { bg: '#F1EFE8', color: '#444441' }
// }

// // ─── Statut archive ────────────────────────────────────────────

// function getStatut(archive: Archive): { label: string; color: 'success' | 'warning' | 'error' } {
//   const total  = archive.types_requis.length
//   const done   = archive.documents.length
//   if (done === 0)     return { label: 'Vide',    color: 'error'   }
//   if (done >= total)  return { label: 'Complet', color: 'success' }
//   return { label: `${done}/${total}`, color: 'warning' }
// }

// // ─── Regroupement Produit → Agence → Archives ──────────────────
// // Structure : pour chaque produit, pour chaque agence, la liste
// // de TOUTES ses archives (triées par date desc), peu importe leur nombre.

// interface AgenceGroupe {
//   agenceId:   number
//   agenceNom:  string
//   agenceCode: string
//   archives:   Archive[]
// }

// interface ProduitGroupe {
//   produitId:   number
//   produitNom:  string
//   agences:     AgenceGroupe[]
//   totalArchives: number
// }

// function regrouperParProduitEtAgence(archives: Archive[]): ProduitGroupe[] {
//   const parProduit = new Map<number, Map<number, AgenceGroupe>>()

//   for (const archive of archives) {
//     if (!parProduit.has(archive.produit)) {
//       parProduit.set(archive.produit, new Map())
//     }
//     const parAgence = parProduit.get(archive.produit)!

//     if (!parAgence.has(archive.agence)) {
//       parAgence.set(archive.agence, {
//         agenceId:   archive.agence,
//         agenceNom:  archive.agence_nom,
//         agenceCode: archive.agence_code,
//         archives:   [],
//       })
//     }
//     parAgence.get(archive.agence)!.archives.push(archive)
//   }

//   const groupes: ProduitGroupe[] = []
//   for (const [produitId, parAgence] of parProduit) {
//     const agences = Array.from(parAgence.values())
//       // Plus d'archives en premier, puis ordre alphabétique
//       .sort((a, b) => a.agenceNom.localeCompare(b.agenceNom))

//     // Tri des archives de chaque agence par date décroissante
//     agences.forEach(a => {
//       a.archives.sort((x, y) => y.date.localeCompare(x.date))
//     })

//     const produitNom = agences[0]?.archives[0]?.produit_nom ?? ''
//     const totalArchives = agences.reduce((sum, a) => sum + a.archives.length, 0)

//     groupes.push({ produitId, produitNom, agences, totalArchives })
//   }

//   // Ordre des produits stable (alphabétique sur le nom affiché)
//   return groupes.sort((a, b) => a.produitNom.localeCompare(b.produitNom))
// }

// // ─── Carte d'un document ───────────────────────────────────────

// function DocSlot({
//   typeDoc,
//   label,
//   document,
//   onUpload,
//   uploading,
// }: {
//   typeDoc:   string
//   label:     string
//   document?: DocumentArchive
//   onUpload:  (typeDoc: string, file: File) => void
//   uploading: boolean
// }) {
//   const done = !!document

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) onUpload(typeDoc, file)
//     e.target.value = ''
//   }

//   return (
//     <Box
//       sx={{
//         border: done
//           ? '1px solid'
//           : '1px dashed',
//         borderColor: done ? 'success.light' : 'divider',
//         borderRadius: 2,
//         p: 1.5,
//         bgcolor: done ? 'success.50' : 'background.default',
//         display: 'flex',
//         flexDirection: 'column',
//         gap: 1,
//       }}
//     >
//       <Typography
//         sx={{ fontSize: 13, fontWeight: 500 }}
//         color={done ? 'success.dark' : 'text.primary'}
//       >
//         {label}
//       </Typography>

//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//         {done ? (
//           <CheckCircleOutlined sx={{ fontSize: 14, color: 'success.main' }} />
//         ) : (
//           <RadioButtonUncheckedOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
//         )}
//         <Typography  sx={{ fontSize: 11}} color={done ? 'success.main' : 'text.secondary'}>
//           {done ? 'Uploadé' : 'Manquant'}
//         </Typography>
//       </Box>

//       {done && document ? (
//         <Tooltip title="Télécharger ce document">
//           <Typography
//             component="a"
//             href={document.fichier}
//             target="_blank"
//             color="primary"
//             sx={{ fontSize: 11 ,textDecoration: 'underline', cursor: 'pointer' }}
//           >
//             Voir le fichier
//           </Typography>
//         </Tooltip>
//       ) : (
//         <label>
//           <input
//             type="file"
//             hidden
//             accept=".pdf,.jpg,.jpeg,.png"
//             onChange={handleChange}
//             disabled={uploading}
//           />
//           <Button
//             component="span"
//             size="small"
//             variant="outlined"
//             disabled={uploading}
//             startIcon={
//               uploading
//                 ? <CircularProgress size={10} />
//                 : <UploadFileOutlined sx={{ fontSize: 14 }} />
//             }
//             sx={{ fontSize: 11, py: 0.25, px: 1 }}
//           >
//             Uploader
//           </Button>
//         </label>
//       )}
//     </Box>
//   )
// }

// // ─── Ligne d'une archive (sans badge produit, déjà donné par l'accordéon) ──

// function ArchiveRow({
//   archive,
//   onUpload,
//   onDownloadZip,
// }: {
//   archive:        Archive
//   onUpload:       (archiveId: number, typeDoc: string, file: File) => void
//   onDownloadZip:  (archive: Archive) => void
// }) {
//   const [open, setOpen]           = useState(false)
//   const [uploading, setUploading] = useState<string | null>(null)

//   const statut = getStatut(archive)

//   const handleUpload = async (typeDoc: string, file: File) => {
//     setUploading(typeDoc)
//     await onUpload(archive.id, typeDoc, file)
//     setUploading(null)
//   }

//   const total    = archive.types_requis.length
//   const done     = archive.documents.length
//   const progress = total > 0 ? Math.round((done / total) * 100) : 0

//   return (
//     <Card variant="outlined" sx={{ borderRadius: 2, mb: 1 }}>
//       {/* En-tête cliquable : uniquement la date + statut, plus de badge produit/agence répété */}
//       <Box
//         onClick={() => setOpen(!open)}
//         sx={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           p: '10px 16px',
//           cursor: 'pointer',
//           '&:hover': { bgcolor: 'action.hover' },
//           gap: 1,
//           flexWrap: 'wrap',
//         }}
//       >
//         <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
//           {new Date(archive.date).toLocaleDateString('fr-FR', {
//             weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
//           })}
//         </Typography>

//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <Chip
//             label={statut.label}
//             color={statut.color}
//             size="small"
//             sx={{ fontSize: 11, height: 22 }}
//           />
//           <Tooltip title="Télécharger ZIP">
//             <IconButton
//               size="small"
//               onClick={(e) => { e.stopPropagation(); onDownloadZip(archive) }}
//             >
//               <DownloadOutlined sx={{ fontSize: 18 }} />
//             </IconButton>
//           </Tooltip>
//           {open ? (
//             <ExpandLessOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
//           ) : (
//             <ExpandMoreOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
//           )}
//         </Box>
//       </Box>

//       {/* Barre de progression */}
//       {!archive.documents_complets && (
//         <LinearProgress
//           variant="determinate"
//           value={progress}
//           color={statut.color === 'error' ? 'error' : 'warning'}
//           sx={{ height: 2 }}
//         />
//       )}

//       {/* Détail des documents */}
//       <Collapse in={open} unmountOnExit>
//         <CardContent sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
//           <Typography
//             sx={{ fontSize: 11, color: 'text.secondary', mb: 1, fontWeight: 500, letterSpacing: '0.05em' }}
//           >
//             Documents requis
//           </Typography>
//           <Grid container spacing={1}>
//             {archive.types_requis.map(({ value, label }) => {
//               const doc = archive.documents.find(d => d.type_doc === value)
//               return (
//                 <Grid size={{ xs: 12, sm: 6, md: 4 }} key={value}>
//                   <DocSlot
//                     typeDoc={value}
//                     label={label}
//                     document={doc}
//                     onUpload={handleUpload}
//                     uploading={uploading === value}
//                   />
//                 </Grid>
//               )
//             })}
//           </Grid>
//           <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
//             <Button
//               size="small"
//               startIcon={<DownloadOutlined />}
//               onClick={() => onDownloadZip(archive)}
//             >
//               Télécharger ZIP
//             </Button>
//           </Box>
//         </CardContent>
//       </Collapse>
//     </Card>
//   )
// }

// // ─── Bloc agence : son nom + toutes ses archives pour le produit ──

// function AgenceBloc({
//   agence,
//   onUpload,
//   onDownloadZip,
// }: {
//   agence:        AgenceGroupe
//   onUpload:      (archiveId: number, typeDoc: string, file: File) => void
//   onDownloadZip: (archive: Archive) => void
// }) {
//   return (
//     <Box sx={{ mb: 2.5 }}>
//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
//         <ApartmentOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
//         <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
//           {agence.agenceNom}
//         </Typography>
//         <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
//           ({agence.agenceCode})
//         </Typography>
//         <Chip
//           label={`${agence.archives.length} archive${agence.archives.length !== 1 ? 's' : ''}`}
//           size="small"
//           variant="outlined"
//           sx={{ fontSize: 10, height: 20, ml: 0.5 }}
//         />
//       </Box>

//       <Box sx={{ pl: { xs: 0, sm: 3 } }}>
//         {agence.archives.map(archive => (
//           <ArchiveRow
//             key={archive.id}
//             archive={archive}
//             onUpload={onUpload}
//             onDownloadZip={onDownloadZip}
//           />
//         ))}
//       </Box>
//     </Box>
//   )
// }

// // ─── Section accordéon par produit ──────────────────────────────

// function ProduitAccordeon({
//   groupe,
//   onUpload,
//   onDownloadZip,
// }: {
//   groupe:        ProduitGroupe
//   onUpload:      (archiveId: number, typeDoc: string, file: File) => void
//   onDownloadZip: (archive: Archive) => void
// }) {
//   const style = getProduitStyle(groupe.produitNom)

//   return (
//     <Accordion
//       variant="outlined"
//       defaultExpanded
//       sx={{ borderRadius: 2, mb: 1.5, '&:before': { display: 'none' } }}
//     >
//       <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', flexWrap: 'wrap' }}>
//           <Chip
//             label={groupe.produitNom}
//             size="small"
//             sx={{
//               bgcolor: style.bg,
//               color:   style.color,
//               fontWeight: 600,
//               fontSize: 12,
//               height: 26,
//             }}
//           />
//           <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
//             {groupe.agences.length} agence{groupe.agences.length !== 1 ? 's' : ''}
//             {' · '}
//             {groupe.totalArchives} archive{groupe.totalArchives !== 1 ? 's' : ''}
//           </Typography>
//         </Box>
//       </AccordionSummary>
//       <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
//         {groupe.agences.map(agence => (
//           <AgenceBloc
//             key={agence.agenceId}
//             agence={agence}
//             onUpload={onUpload}
//             onDownloadZip={onDownloadZip}
//           />
//         ))}
//       </AccordionDetails>
//     </Accordion>
//   )
// }

// // ─── Modal nouvelle archive ────────────────────────────────────

// function NouvelleArchiveModal({
//   open,
//   agences,
//   produits,
//   onClose,
//   onCreate,
// }: {
//   open:     boolean
//   agences:  Agence[]
//   produits: Produit[]
//   onClose:  () => void
//   onCreate: (data: { agence: number; produit: number; date: string }) => Promise<void>
// }) {
//   const [agenceId,  setAgenceId]  = useState<number | ''>('')
//   const [produitId, setProduitId] = useState<number | ''>('')
//   const [date,      setDate]      = useState('')
//   const [loading,   setLoading]   = useState(false)
//   const [error,     setError]     = useState('')

//   const produitNom = produits.find(p => p.id === produitId)?.nom ?? ''

//   const TYPES_PREVIEW: Record<string, string[]> = {
//     western_union: ['Réconciliation','API','Arrêté de caisse (matin)','Arrêté de caisse (soir)','Journal de transaction'],
//     change:        ['Mouvement de caisse','Arrêté de caisse (matin)','Arrêté de caisse (soir)','Journal de transaction'],
//     visa:          ['Arrêté (matin)','Arrêté (soir)','Fiche de souscription','Fiche de réclamation'],
//     momo:          ['Arrêté de caisse (matin)','Arrêté de caisse (soir)'],
//     airtel_money:  ['Arrêté (matin)','Arrêté (soir)'],
//   }

//   const handleSubmit = async () => {
//     if (!agenceId || !produitId || !date) {
//       setError('Veuillez remplir tous les champs.')
//       return
//     }
//     setLoading(true)
//     setError('')
//     try {
//       await onCreate({ agence: agenceId as number, produit: produitId as number, date })
//       setAgenceId(''); setProduitId(''); setDate('')
//       onClose()
//     } catch {
//       setError('Erreur lors de la création. Veuillez réessayer.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
//       <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//         <Typography sx={{ fontSize: 16, fontWeight: 500 }}>Nouvelle archive</Typography>
//         <IconButton size="small" onClick={onClose}><CloseOutlined /></IconButton>
//       </DialogTitle>

//       <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
//         {error && <Alert severity="error">{error}</Alert>}

//         <FormControl fullWidth size="small">
//           <InputLabel>Agence</InputLabel>
//           <Select
//             value={agenceId}
//             label="Agence"
//             onChange={e => setAgenceId(e.target.value as number)}
//           >
//             {agences.map(a => (
//               <MenuItem key={a.id} value={a.id}>{a.nom} ({a.code})</MenuItem>
//             ))}
//           </Select>
//         </FormControl>

//         <FormControl fullWidth size="small">
//           <InputLabel>Produit</InputLabel>
//           <Select
//             value={produitId}
//             label="Produit"
//             onChange={e => setProduitId(e.target.value as number)}
//           >
//             {produits.filter(p => p.is_active).map(p => (
//               <MenuItem key={p.id} value={p.id}>{p.nom_display}</MenuItem>
//             ))}
//           </Select>
//         </FormControl>

//         <TextField
//           label="Date"
//           type="date"
//           size="small"
//           fullWidth
//           slotProps={{ inputLabel: { shrink: true } }}
//           value={date}
//           onChange={e => setDate(e.target.value)}
//         />

//         {/* Aperçu des documents requis */}
//         {produitNom && TYPES_PREVIEW[produitNom] && (
//           <Box>
//             <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.75 }}>
//               Documents requis pour ce produit
//             </Typography>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
//               {TYPES_PREVIEW[produitNom].map(label => (
//                 <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                   <RadioButtonUncheckedOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
//                   <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
//                 </Box>
//               ))}
//             </Box>
//           </Box>
//         )}
//       </DialogContent>

//       <DialogActions>
//         <Button onClick={onClose} disabled={loading}>Annuler</Button>
//         <Button
//           variant="contained"
//           onClick={handleSubmit}
//           disabled={loading}
//           startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
//         >
//           Créer l'archive
//         </Button>
//       </DialogActions>
//     </Dialog>
//   )
// }

// // ─── Page principale ───────────────────────────────────────────

// export default function MouvementsAgencesPage() {
//   const [archives,     setArchives]     = useState<Archive[]>([])
//   const [agences,      setAgences]      = useState<Agence[]>([])
//   const [produits,     setProduits]     = useState<Produit[]>([])
//   const [loading,      setLoading]      = useState(true)
//   const [error,        setError]        = useState('')
//   const [modalOpen,    setModalOpen]    = useState(false)

//   // Filtres
//   const [filtreAgence,  setFiltreAgence]  = useState('')
//   const [filtreProduit, setFiltreProduit] = useState('')
//   const [filtreStatut,  setFiltreStatut]  = useState('')
//   const [filtreDebut,   setFiltreDebut]   = useState('')
//   const [filtreFin,     setFiltreFin]     = useState('')

//   // ── Chargement initial ─────────────────────────────────────
//   useEffect(() => {
//     const load = async () => {
//       try {
//         const [archRes, agRes, prRes] = await Promise.all([
//           archiveAgenceAPI.liste(),
//           agenceAPI.liste(),
//           produitAPI.liste(),
//         ])
//         setArchives(archRes.data.results ?? archRes.data)
//         setAgences(agRes.data.results   ?? agRes.data)
//         setProduits(prRes.data.results  ?? prRes.data)
//       } catch {
//         setError('Impossible de charger les données.')
//       } finally {
//         setLoading(false)
//       }
//     }
//     load()
//   }, [])

//   // ── Filtrage local ─────────────────────────────────────────
//   const archivesFiltrees = archives.filter(a => {
//     if (filtreAgence  && String(a.agence)  !== filtreAgence)  return false
//     if (filtreProduit && String(a.produit) !== filtreProduit) return false
//     if (filtreDebut   && a.date < filtreDebut)                return false
//     if (filtreFin     && a.date > filtreFin)                  return false
//     if (filtreStatut) {
//       const st = getStatut(a)
//       if (filtreStatut === 'complet' && st.color !== 'success') return false
//       if (filtreStatut === 'partiel' && st.color !== 'warning') return false
//       if (filtreStatut === 'vide'    && st.color !== 'error')   return false
//     }
//     return true
//   })

//   // ── Regroupement Produit → Agence → Archives (toutes dates) ──
//   const groupes = useMemo(
//     () => regrouperParProduitEtAgence(archivesFiltrees),
//     [archivesFiltrees]
//   )

//   // ── Créer une archive ──────────────────────────────────────
//   const handleCreate = async (data: { agence: number; produit: number; date: string }) => {
//     const res = await archiveAgenceAPI.creer(data)
//     setArchives(prev => [res.data, ...prev])
//   }

//   // ── Uploader un document ───────────────────────────────────
//   const handleUpload = async (archiveId: number, typeDoc: string, file: File) => {
//     const formData = new FormData()
//     formData.append('type_doc', typeDoc)
//     formData.append('fichier',  file)

//     // Décoder le JWT pour extraire user_id
//     const token = localStorage.getItem('access_token')
//     if (token) {
//       const payload = JSON.parse(atob(token.split('.')[1]))
//       formData.append('uploade_par', String(payload.user_id))
//     }

//     try {
//       const res = await archiveAgenceAPI.uploadDoc(archiveId, formData)
//       setArchives(prev =>
//         prev.map(a =>
//           a.id === archiveId
//             ? {
//                 ...a,
//                 documents: [...a.documents, res.data],
//                 documents_complets:
//                   a.documents.length + 1 >= a.types_requis.length,
//               }
//             : a
//         )
//       )
//     } catch (err: any) {
//       console.error('Upload échoué', err.response?.data)
//     }
//   }

//   // ── Télécharger ZIP ────────────────────────────────────────
//   const handleDownloadZip = async (archive: Archive) => {
//     try {
//       const res  = await archiveAgenceAPI.telechargerZip(archive.id)
//       const url  = window.URL.createObjectURL(new Blob([res.data]))
//       const link = document.createElement('a')
//       link.href  = url
//       const fileName = `${archive.produit_nom}_${archive.date}.zip`
//       link.setAttribute('download', fileName)
//       document.body.appendChild(link)
//       link.click()
//       link.remove()
//       window.URL.revokeObjectURL(url)
//     } catch {
//       console.error('Échec du téléchargement ZIP')
//     }
//   }

//   // ── Render ─────────────────────────────────────────────────
//   return (
//     <Box sx={{ p: { xs: 2, md: 3 } }}>

//       {/* En-tête */}
//       <Box
//         sx={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           mb: 2.5,
//           flexWrap: 'wrap',
//           gap: 1.5
//         }}
//       >
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <AccountBalanceOutlined sx={{ color: '#185FA5', fontSize: 26 }} />
//           <Typography  sx={{ fontSize: 20, fontWeight: 500 }}>
//             Mouvements agences
//           </Typography>
//         </Box>
//         <Button
//           variant="contained"
//           startIcon={<AddOutlined />}
//           onClick={() => setModalOpen(true)}
//         >
//           Nouvelle archive
//         </Button>
//       </Box>

//       {/* Filtres */}
//       <Card variant="outlined" sx={{ borderRadius: 2, mb: 2.5 }}>
//         <CardContent sx={{ pb: '12px !important' }}>
//           <Grid container spacing={1.5}>
//             <Grid size={{ xs: 12, sm: 6, md: 2 }} >
//               <FormControl fullWidth size="small">
//                 <InputLabel>Agence</InputLabel>
//                 <Select
//                   value={filtreAgence}
//                   label="Agence"
//                   onChange={e => setFiltreAgence(e.target.value)}
//                 >
//                   <MenuItem value="">Toutes</MenuItem>
//                   {agences.map(a => (
//                     <MenuItem key={a.id} value={String(a.id)}>{a.nom}</MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid size={{ xs: 12, sm: 6, md: 2 }}>
//               <FormControl fullWidth size="small">
//                 <InputLabel>Produit</InputLabel>
//                 <Select
//                   value={filtreProduit}
//                   label="Produit"
//                   onChange={e => setFiltreProduit(e.target.value)}
//                 >
//                   <MenuItem value="">Tous</MenuItem>
//                   {produits.map(p => (
//                     <MenuItem key={p.id} value={String(p.id)}>{p.nom_display}</MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid size={{ xs: 6, sm: 4, md: 2 }}>
//               <TextField
//                 label="Du"
//                 type="date"
//                 size="small"
//                 fullWidth
//                 slotProps={{ inputLabel: { shrink: true } }}
//                 value={filtreDebut}
//                 onChange={e => setFiltreDebut(e.target.value)}
//               />
//             </Grid>

//             <Grid size={{ xs: 6, sm: 4, md: 2 }}>
//               <TextField
//                 label="Au"
//                 type="date"
//                 size="small"
//                 fullWidth
//                 slotProps={{ inputLabel: { shrink: true } }}
//                 value={filtreFin}
//                 onChange={e => setFiltreFin(e.target.value)}
//               />
//             </Grid>

//             <Grid size={{ xs: 12, sm: 4, md: 2 }}>
//               <FormControl fullWidth size="small">
//                 <InputLabel>Statut</InputLabel>
//                 <Select
//                   value={filtreStatut}
//                   label="Statut"
//                   onChange={e => setFiltreStatut(e.target.value)}
//                 >
//                   <MenuItem value="">Tous</MenuItem>
//                   <MenuItem value="complet">Complet</MenuItem>
//                   <MenuItem value="partiel">Partiel</MenuItem>
//                   <MenuItem value="vide">Vide</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid size={{ xs: 12, sm: 4, md: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
//               <Button
//                 size="small"
//                 onClick={() => {
//                   setFiltreAgence('')
//                   setFiltreProduit('')
//                   setFiltreStatut('')
//                   setFiltreDebut('')
//                   setFiltreFin('')
//                 }}
//               >
//                 Réinitialiser
//               </Button>
//             </Grid>
//           </Grid>
//         </CardContent>
//       </Card>

//       {/* Compteur */}
//       <Typography sx={{ fontSize: 14, mb: 2, color: 'text.secondary' }}>
//         {archivesFiltrees.length} archive{archivesFiltrees.length !== 1 ? 's' : ''}
//         {' · '}
//         {groupes.length} produit{groupes.length !== 1 ? 's' : ''}
//       </Typography>

//       {/* Contenu */}
//       {loading && <LinearProgress />}

//       {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

//       {!loading && archivesFiltrees.length === 0 && (
//         <Box sx={{textAlign: 'center', py: 6, color: 'text.secondary'}}>
//           <FolderOffOutlined sx={{ fontSize: 40, mb: 1.5, opacity: 0.4 }} />
//           <Typography sx={{ fontSize: 14 }}>Aucune archive trouvée</Typography>
//         </Box>
//       )}

//       {groupes.map(groupe => (
//         <ProduitAccordeon
//           key={groupe.produitId}
//           groupe={groupe}
//           onUpload={handleUpload}
//           onDownloadZip={handleDownloadZip}
//         />
//       ))}

//       {/* Modal création */}
//       <NouvelleArchiveModal
//         open={modalOpen}
//         agences={agences}
//         produits={produits}
//         onClose={() => setModalOpen(false)}
//         onCreate={handleCreate}
//       />
//     </Box>
//   )
// }


//-------------------------------FIN DU UPDATE -----------------------------



'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    Box, Typography, Card, CardContent, Button,
    Grid, TextField, Alert, CircularProgress,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem,
    LinearProgress, Collapse, Tooltip, IconButton,
    Accordion, AccordionSummary, AccordionDetails,
    useMediaQuery,
} from '@mui/material'


import {
  AccountBalanceOutlined,
  AddOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  DownloadOutlined,
  UploadFileOutlined,
  CheckCircleOutlined,
  RadioButtonUncheckedOutlined,
  CloseOutlined,
  FolderOffOutlined,
  ApartmentOutlined,
  AddAPhotoOutlined,
} from '@mui/icons-material'
import { archiveAgenceAPI, agenceAPI, produitAPI } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────

interface Agence {
  id: number
  nom: string
  code: string
}

interface Produit {
  id: number
  nom: string
  nom_display: string
  is_active: boolean
}

interface DocumentArchive {
  id: number
  type_doc: string
  type_doc_display: string
  fichier: string
  uploade_par: number
  uploaded_at: string
}

interface Archive {
  id: number
  agence: number
  agence_nom: string
  agence_code: string
  produit: number
  produit_nom: string
  date: string
  archive_par: number
  archive_par_nom: string
  documents: DocumentArchive[]
  documents_complets: boolean
  types_requis: { value: string; label: string }[]
  created_at: string
  updated_at: string
}

// ─── Couleurs par produit ──────────────────────────────────────

const PRODUIT_COLORS: Record<string, { bg: string; color: string }> = {
  western_union: { bg: '#E6F1FB', color: '#0C447C' },
  change:        { bg: '#EAF3DE', color: '#27500A' },
  visa:          { bg: '#EEEDFE', color: '#3C3489' },
  momo:          { bg: '#FAEEDA', color: '#633806' },
  airtel_money:  { bg: '#FAECE7', color: '#712B13' },
}

function getProduitStyle(nom: string) {
  return PRODUIT_COLORS[nom] ?? { bg: '#F1EFE8', color: '#444441' }
}

// ─── Statut archive ────────────────────────────────────────────
// NB : un type de document peut maintenant contenir plusieurs fichiers
// (recto/verso, plusieurs pages). La complétude se base donc sur le
// nombre de TYPES distincts couverts, pas sur le nombre brut de fichiers.

function typesDistinctsCouverts(archive: Archive): number {
  return new Set(archive.documents.map(d => d.type_doc)).size
}

function getStatut(archive: Archive): { label: string; color: 'success' | 'warning' | 'error' } {
  const total = archive.types_requis.length
  const done  = typesDistinctsCouverts(archive)
  if (done === 0)     return { label: 'Vide',    color: 'error'   }
  if (done >= total)  return { label: 'Complet', color: 'success' }
  return { label: `${done}/${total}`, color: 'warning' }
}

// ─── Regroupement Produit → Agence → Archives ──────────────────

interface AgenceGroupe {
  agenceId:   number
  agenceNom:  string
  agenceCode: string
  archives:   Archive[]
}

interface ProduitGroupe {
  produitId:   number
  produitNom:  string
  agences:     AgenceGroupe[]
  totalArchives: number
}

function regrouperParProduitEtAgence(archives: Archive[]): ProduitGroupe[] {
  const parProduit = new Map<number, Map<number, AgenceGroupe>>()

  for (const archive of archives) {
    if (!parProduit.has(archive.produit)) {
      parProduit.set(archive.produit, new Map())
    }
    const parAgence = parProduit.get(archive.produit)!

    if (!parAgence.has(archive.agence)) {
      parAgence.set(archive.agence, {
        agenceId:   archive.agence,
        agenceNom:  archive.agence_nom,
        agenceCode: archive.agence_code,
        archives:   [],
      })
    }
    parAgence.get(archive.agence)!.archives.push(archive)
  }

  const groupes: ProduitGroupe[] = []
  for (const [produitId, parAgence] of parProduit) {
    const agences = Array.from(parAgence.values())
      .sort((a, b) => a.agenceNom.localeCompare(b.agenceNom))

    agences.forEach(a => {
      a.archives.sort((x, y) => y.date.localeCompare(x.date))
    })

    const produitNom = agences[0]?.archives[0]?.produit_nom ?? ''
    const totalArchives = agences.reduce((sum, a) => sum + a.archives.length, 0)

    groupes.push({ produitId, produitNom, agences, totalArchives })
  }

  return groupes.sort((a, b) => a.produitNom.localeCompare(b.produitNom))
}

// ─── Carte d'un document (supporte plusieurs fichiers / pages) ─

function DocSlot({
  typeDoc,
  label,
  documents,
  onUpload,
  uploading,
  isMobile,
}: {
  typeDoc:   string
  label:     string
  documents: DocumentArchive[]   // tous les fichiers déjà uploadés pour ce type (0, 1 ou plusieurs pages)
  onUpload:  (typeDoc: string, files: File[]) => void
  uploading: boolean
  isMobile:  boolean
}) {
  const done = documents.length > 0

  // Sur mobile : accès direct à l'appareil photo (une prise à la fois en général).
  // Sur PC : sélecteur de fichier classique, PDF/JPG/PNG.
  // Dans les deux cas, `multiple` est actif pour permettre de sélectionner
  // plusieurs images d'un coup (ex: recto + verso depuis la galerie, ou
  // plusieurs pages sélectionnées ensemble sur PC).
  const inputProps = isMobile
    ? { accept: 'image/*', capture: 'environment' as const, multiple: true }
    : { accept: '.pdf,.jpg,.jpeg,.png', multiple: true }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) onUpload(typeDoc, files)
    e.target.value = ''
  }

  return (
    <Box
      sx={{
        border: done ? '1px solid' : '1px dashed',
        borderColor: done ? 'success.light' : 'divider',
        borderRadius: 2,
        p: 1.5,
        bgcolor: done ? 'success.50' : 'background.default',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Typography
        sx={{ fontSize: 13, fontWeight: 500 }}
        color={done ? 'success.dark' : 'text.primary'}
      >
        {label}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {done ? (
          <CheckCircleOutlined sx={{ fontSize: 14, color: 'success.main' }} />
        ) : (
          <RadioButtonUncheckedOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
        )}
        <Typography sx={{ fontSize: 11 }} color={done ? 'success.main' : 'text.secondary'}>
          {done
            ? `${documents.length} fichier${documents.length > 1 ? 's' : ''} uploadé${documents.length > 1 ? 's' : ''}`
            : 'Manquant'}
        </Typography>
      </Box>

      {/* Liste des fichiers déjà uploadés pour ce type (pages / recto-verso) */}
      {done && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {documents.map((doc, idx) => (
            <Tooltip key={doc.id} title="Télécharger ce document">
              <Typography
                component="a"
                href={doc.fichier}
                target="_blank"
                color="primary"
                sx={{ fontSize: 11, textDecoration: 'underline', cursor: 'pointer' }}
              >
                Voir le fichier{documents.length > 1 ? ` (page ${idx + 1})` : ''}
              </Typography>
            </Tooltip>
          ))}
        </Box>
      )}

      {/* Bouton d'ajout : toujours visible, même si des fichiers existent déjà,
          pour permettre d'ajouter une page manquante (verso, page 2, etc.) */}
      <label>
        <input
          type="file"
          hidden
          {...inputProps}
          onChange={handleChange}
          disabled={uploading}
        />
        <Button
          component="span"
          size="small"
          variant="outlined"
          disabled={uploading}
          startIcon={
            uploading
              ? <CircularProgress size={10} />
              : isMobile
                ? <AddAPhotoOutlined sx={{ fontSize: 14 }} />
                : <UploadFileOutlined sx={{ fontSize: 14 }} />
          }
          sx={{ fontSize: 11, py: 0.25, px: 1 }}
        >
          {done
            ? (isMobile ? 'Ajouter une page' : 'Ajouter un fichier')
            : (isMobile ? 'Prendre en photo' : 'Uploader')}
        </Button>
      </label>
    </Box>
  )
}

// ─── Ligne d'une archive ─────────────────────────────────────

function ArchiveRow({
  archive,
  onUpload,
  onDownloadZip,
  isMobile,
}: {
  archive:        Archive
  onUpload:       (archiveId: number, typeDoc: string, files: File[]) => void
  onDownloadZip:  (archive: Archive) => void
  isMobile:       boolean
}) {
  const [open, setOpen]           = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  const statut = getStatut(archive)

  const handleUpload = async (typeDoc: string, files: File[]) => {
    setUploading(typeDoc)
    await onUpload(archive.id, typeDoc, files)
    setUploading(null)
  }

  const total    = archive.types_requis.length
  const done     = typesDistinctsCouverts(archive)
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mb: 1 }}>
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: '10px 16px',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
          {new Date(archive.date).toLocaleDateString('fr-FR', {
            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
          })}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={statut.label}
            color={statut.color}
            size="small"
            sx={{ fontSize: 11, height: 22 }}
          />
          <Tooltip title="Télécharger ZIP">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onDownloadZip(archive) }}
            >
              <DownloadOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {open ? (
            <ExpandLessOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
          ) : (
            <ExpandMoreOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
          )}
        </Box>
      </Box>

      {!archive.documents_complets && (
        <LinearProgress
          variant="determinate"
          value={progress}
          color={statut.color === 'error' ? 'error' : 'warning'}
          sx={{ height: 2 }}
        />
      )}

      <Collapse in={open} unmountOnExit>
        <CardContent sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
          <Typography
            sx={{ fontSize: 11, color: 'text.secondary', mb: 1, fontWeight: 500, letterSpacing: '0.05em' }}
          >
            Documents requis
          </Typography>
          <Grid container spacing={1}>
            {archive.types_requis.map(({ value, label }) => {
              const docsDuType = archive.documents.filter(d => d.type_doc === value)
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={value}>
                  <DocSlot
                    typeDoc={value}
                    label={label}
                    documents={docsDuType}
                    onUpload={handleUpload}
                    uploading={uploading === value}
                    isMobile={isMobile}
                  />
                </Grid>
              )
            })}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
            <Button
              size="small"
              startIcon={<DownloadOutlined />}
              onClick={() => onDownloadZip(archive)}
            >
              Télécharger ZIP
            </Button>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  )
}

// ─── Bloc agence ────────────────────────────────────────────

function AgenceBloc({
  agence,
  onUpload,
  onDownloadZip,
  isMobile,
}: {
  agence:        AgenceGroupe
  onUpload:      (archiveId: number, typeDoc: string, files: File[]) => void
  onDownloadZip: (archive: Archive) => void
  isMobile:      boolean
}) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <ApartmentOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
          {agence.agenceNom}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          ({agence.agenceCode})
        </Typography>
        <Chip
          label={`${agence.archives.length} archive${agence.archives.length !== 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 10, height: 20, ml: 0.5 }}
        />
      </Box>

      <Box sx={{ pl: { xs: 0, sm: 3 } }}>
        {agence.archives.map(archive => (
          <ArchiveRow
            key={archive.id}
            archive={archive}
            onUpload={onUpload}
            onDownloadZip={onDownloadZip}
            isMobile={isMobile}
          />
        ))}
      </Box>
    </Box>
  )
}

// ─── Section accordéon par produit ──────────────────────────

function ProduitAccordeon({
  groupe,
  onUpload,
  onDownloadZip,
  isMobile,
}: {
  groupe:        ProduitGroupe
  onUpload:      (archiveId: number, typeDoc: string, files: File[]) => void
  onDownloadZip: (archive: Archive) => void
  isMobile:      boolean
}) {
  const style = getProduitStyle(groupe.produitNom)

  return (
    <Accordion
      variant="outlined"
      defaultExpanded
      sx={{ borderRadius: 2, mb: 1.5, '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', flexWrap: 'wrap' }}>
          <Chip
            label={groupe.produitNom}
            size="small"
            sx={{
              bgcolor: style.bg,
              color:   style.color,
              fontWeight: 600,
              fontSize: 12,
              height: 26,
            }}
          />
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {groupe.agences.length} agence{groupe.agences.length !== 1 ? 's' : ''}
            {' · '}
            {groupe.totalArchives} archive{groupe.totalArchives !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
        {groupe.agences.map(agence => (
          <AgenceBloc
            key={agence.agenceId}
            agence={agence}
            onUpload={onUpload}
            onDownloadZip={onDownloadZip}
            isMobile={isMobile}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  )
}

// ─── Modal nouvelle archive ──────────────────────────────────

function NouvelleArchiveModal({
  open,
  agences,
  produits,
  onClose,
  onCreate,
}: {
  open:     boolean
  agences:  Agence[]
  produits: Produit[]
  onClose:  () => void
  onCreate: (data: { agence: number; produit: number; date: string }) => Promise<void>
}) {
  const [agenceId,  setAgenceId]  = useState<number | ''>('')
  const [produitId, setProduitId] = useState<number | ''>('')
  const [date,      setDate]      = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const produitNom = produits.find(p => p.id === produitId)?.nom ?? ''

  const TYPES_PREVIEW: Record<string, string[]> = {
    western_union: ['Réconciliation','API','Arrêté de caisse (matin)','Arrêté de caisse (soir)','Journal de transaction'],
    change:        ['Mouvement de caisse','Arrêté de caisse (matin)','Arrêté de caisse (soir)','Journal de transaction'],
    visa:          ['Arrêté (matin)','Arrêté (soir)','Fiche de souscription','Fiche de réclamation'],
    momo:          ['Arrêté de caisse (matin)','Arrêté de caisse (soir)'],
    airtel_money:  ['Arrêté (matin)','Arrêté (soir)'],
  }

  const handleSubmit = async () => {
    if (!agenceId || !produitId || !date) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onCreate({ agence: agenceId as number, produit: produitId as number, date })
      setAgenceId(''); setProduitId(''); setDate('')
      onClose()
    } catch {
      setError('Erreur lors de la création. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 16, fontWeight: 500 }}>Nouvelle archive</Typography>
        <IconButton size="small" onClick={onClose}><CloseOutlined /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <FormControl fullWidth size="small">
          <InputLabel>Agence</InputLabel>
          <Select
            value={agenceId}
            label="Agence"
            onChange={e => setAgenceId(e.target.value as number)}
          >
            {agences.map(a => (
              <MenuItem key={a.id} value={a.id}>{a.nom} ({a.code})</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Produit</InputLabel>
          <Select
            value={produitId}
            label="Produit"
            onChange={e => setProduitId(e.target.value as number)}
          >
            {produits.filter(p => p.is_active).map(p => (
              <MenuItem key={p.id} value={p.id}>{p.nom_display}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Date"
          type="date"
          size="small"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          value={date}
          onChange={e => setDate(e.target.value)}
        />

        {produitNom && TYPES_PREVIEW[produitNom] && (
          <Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.75 }}>
              Documents requis pour ce produit
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {TYPES_PREVIEW[produitNom].map(label => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <RadioButtonUncheckedOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Créer l'archive
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Page principale ─────────────────────────────────────────

export default function MouvementsAgencesPage() {
  // ── Détection mobile : bascule upload classique <-> capture photo ──
  const isMobile = useMediaQuery('(max-width:600px)')

  const [archives,     setArchives]     = useState<Archive[]>([])
  const [agences,      setAgences]      = useState<Agence[]>([])
  const [produits,     setProduits]     = useState<Produit[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [modalOpen,    setModalOpen]    = useState(false)

  // Filtres
  const [filtreAgence,  setFiltreAgence]  = useState('')
  const [filtreProduit, setFiltreProduit] = useState('')
  const [filtreStatut,  setFiltreStatut]  = useState('')
  const [filtreDebut,   setFiltreDebut]   = useState('')
  const [filtreFin,     setFiltreFin]     = useState('')

  // ── Chargement initial ─────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [archRes, agRes, prRes] = await Promise.all([
          archiveAgenceAPI.liste(),
          agenceAPI.liste(),
          produitAPI.liste(),
        ])
        setArchives(archRes.data.results ?? archRes.data)
        setAgences(agRes.data.results   ?? agRes.data)
        setProduits(prRes.data.results  ?? prRes.data)
      } catch {
        setError('Impossible de charger les données.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Filtrage local ─────────────────────────────────────────
  const archivesFiltrees = archives.filter(a => {
    if (filtreAgence  && String(a.agence)  !== filtreAgence)  return false
    if (filtreProduit && String(a.produit) !== filtreProduit) return false
    if (filtreDebut   && a.date < filtreDebut)                return false
    if (filtreFin     && a.date > filtreFin)                  return false
    if (filtreStatut) {
      const st = getStatut(a)
      if (filtreStatut === 'complet' && st.color !== 'success') return false
      if (filtreStatut === 'partiel' && st.color !== 'warning') return false
      if (filtreStatut === 'vide'    && st.color !== 'error')   return false
    }
    return true
  })

  // ── Regroupement Produit → Agence → Archives ────────────────
  const groupes = useMemo(
    () => regrouperParProduitEtAgence(archivesFiltrees),
    [archivesFiltrees]
  )

  // ── Créer une archive ──────────────────────────────────────
  const handleCreate = async (data: { agence: number; produit: number; date: string }) => {
    const res = await archiveAgenceAPI.creer(data)
    setArchives(prev => [res.data, ...prev])
  }

  // ── Uploader un ou plusieurs documents pour un type donné ───
  // (recto/verso, plusieurs pages) : les fichiers sont envoyés
  // séquentiellement pour éviter les conflits, puis accumulés en état.
  const handleUpload = async (archiveId: number, typeDoc: string, files: File[]) => {
    const token = localStorage.getItem('access_token')
    let userId: string | null = null
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userId = String(payload.user_id)
    }

    const nouveauxDocs: DocumentArchive[] = []

    for (const file of files) {
      const formData = new FormData()
      formData.append('type_doc', typeDoc)
      formData.append('fichier',  file)
      if (userId) formData.append('uploade_par', userId)

      try {
        const res = await archiveAgenceAPI.uploadDoc(archiveId, formData)
        nouveauxDocs.push(res.data)
      } catch (err: any) {
        console.error('Upload échoué pour', file.name, err.response?.data)
      }
    }

    if (nouveauxDocs.length === 0) return

    setArchives(prev =>
      prev.map(a => {
        if (a.id !== archiveId) return a
        const documents = [...a.documents, ...nouveauxDocs]
        const typesCouverts = new Set(documents.map(d => d.type_doc)).size
        return {
          ...a,
          documents,
          documents_complets: typesCouverts >= a.types_requis.length,
        }
      })
    )
  }

  // ── Télécharger ZIP ────────────────────────────────────────
  const handleDownloadZip = async (archive: Archive) => {
    try {
      const res  = await archiveAgenceAPI.telechargerZip(archive.id)
      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href  = url
      const fileName = `${archive.produit_nom}_${archive.date}.zip`
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      console.error('Échec du téléchargement ZIP')
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* En-tête */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2.5,
          flexWrap: 'wrap',
          gap: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceOutlined sx={{ color: '#185FA5', fontSize: 26 }} />
          <Typography  sx={{ fontSize: 20, fontWeight: 500 }}>
            Mouvements agences
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Nouvelle archive
        </Button>
      </Box>

      {/* Filtres */}
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 2.5 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, md: 2 }} >
              <FormControl fullWidth size="small">
                <InputLabel>Agence</InputLabel>
                <Select
                  value={filtreAgence}
                  label="Agence"
                  onChange={e => setFiltreAgence(e.target.value)}
                >
                  <MenuItem value="">Toutes</MenuItem>
                  {agences.map(a => (
                    <MenuItem key={a.id} value={String(a.id)}>{a.nom}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Produit</InputLabel>
                <Select
                  value={filtreProduit}
                  label="Produit"
                  onChange={e => setFiltreProduit(e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  {produits.map(p => (
                    <MenuItem key={p.id} value={String(p.id)}>{p.nom_display}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <TextField
                label="Du"
                type="date"
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={filtreDebut}
                onChange={e => setFiltreDebut(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <TextField
                label="Au"
                type="date"
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={filtreFin}
                onChange={e => setFiltreFin(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filtreStatut}
                  label="Statut"
                  onChange={e => setFiltreStatut(e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="complet">Complet</MenuItem>
                  <MenuItem value="partiel">Partiel</MenuItem>
                  <MenuItem value="vide">Vide</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                size="small"
                onClick={() => {
                  setFiltreAgence('')
                  setFiltreProduit('')
                  setFiltreStatut('')
                  setFiltreDebut('')
                  setFiltreFin('')
                }}
              >
                Réinitialiser
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Compteur */}
      <Typography sx={{ fontSize: 14, mb: 2, color: 'text.secondary' }}>
        {archivesFiltrees.length} archive{archivesFiltrees.length !== 1 ? 's' : ''}
        {' · '}
        {groupes.length} produit{groupes.length !== 1 ? 's' : ''}
      </Typography>

      {/* Contenu */}
      {loading && <LinearProgress />}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && archivesFiltrees.length === 0 && (
        <Box sx={{textAlign: 'center', py: 6, color: 'text.secondary'}}>
          <FolderOffOutlined sx={{ fontSize: 40, mb: 1.5, opacity: 0.4 }} />
          <Typography sx={{ fontSize: 14 }}>Aucune archive trouvée</Typography>
        </Box>
      )}

      {groupes.map(groupe => (
        <ProduitAccordeon
          key={groupe.produitId}
          groupe={groupe}
          onUpload={handleUpload}
          onDownloadZip={handleDownloadZip}
          isMobile={isMobile}
        />
      ))}

      {/* Modal création */}
      <NouvelleArchiveModal
        open={modalOpen}
        agences={agences}
        produits={produits}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </Box>
  )
}