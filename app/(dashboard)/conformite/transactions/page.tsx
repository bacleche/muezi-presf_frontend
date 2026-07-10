// // 'use client'
// // import { useEffect, useState, useCallback } from 'react'
// // import {
// //   Box, Typography, Card, CardContent, Button,
// //   Table, TableBody, TableCell, TableContainer,
// //   TableHead, TableRow, Paper, TextField,
// //   InputAdornment, CircularProgress, Alert,
// //   TablePagination, Chip, Tooltip, MenuItem,
// //   Dialog, DialogTitle, DialogContent, DialogActions,
// //   Autocomplete, Divider, IconButton
// // } from '@mui/material'
// // import {
// //   SearchOutlined, DownloadOutlined, FolderZipOutlined,
// //   AddOutlined, UploadFileOutlined, CheckCircleOutlined,
// //   WarningAmberOutlined, CloseOutlined, VisibilityOutlined
// // } from '@mui/icons-material'
// // import { transactionAPI, clientAPI, produitAPI, agenceAPI } from '@/lib/api'

// // // ── Types ──────────────────────────────────────────────────────
// // interface Document {
// //   id:               number
// //   type_doc:         string
// //   type_doc_display: string
// //   fichier:          string
// //   fichier_url:      string 
// //   uploaded_at:      string
// // }

// // interface Transaction {
// //   id:                   number
// //   client:               number
// //   client_nom:           string
// //   produit:              number
// //   produit_nom:          string
// //   agence:               number
// //   agence_code:          string
// //   piece_utilisee:       number | null
// //   piece_utilisee_detail: { type_piece_display: string; numero: string } | null
// //   date_transaction:     string
// //   archive_par_nom:      string
// //   archive_le:           string
// //   documents:            Document[]
// //   documents_complets:   boolean
// // }

// // interface Client {
// //   id:     number
// //   nom:    string
// //   prenom: string
// //   pieces: { id: number; type_piece: string; type_piece_display: string; numero: string }[]
// // }

// // interface Produit {
// //   id:          number
// //   nom:         string
// //   nom_display: string
// // }

// // interface Agence {
// //   id:   number
// //   nom:  string
// //   code: string
// // }

// // // ── Composant badge documents ───────────────────────────────────
// // const DocsBadge = ({ complets }: { complets: boolean }) => (
// //   <Chip
// //     size="small"
// //     icon={complets ? <CheckCircleOutlined sx={{ fontSize: 14 }} /> : <WarningAmberOutlined sx={{ fontSize: 14 }} />}
// //     label={complets ? 'Complets' : 'Incomplets'}
// //     color={complets ? 'success' : 'warning'}
// //   />
// // )

// // export default function ArchivageTransactionsPage() {
// //   const [transactions, setTransactions] = useState<Transaction[]>([])
// //   const [loading, setLoading]           = useState(true)
// //   const [error, setError]               = useState('')
// //   const [search, setSearch]             = useState('')
// //   const [page, setPage]                 = useState(0)
// //   const [total, setTotal]               = useState(0)
// //   const [dateDebut, setDateDebut]       = useState('')
// //   const [dateFin, setDateFin]           = useState('')
// //   const [downloading, setDownloading]   = useState<Record<number, boolean>>({})

// //   // Référentiels
// //   const [clients, setClients]   = useState<Client[]>([])
// //   const [produits, setProduits] = useState<Produit[]>([])
// //   const [agences, setAgences]   = useState<Agence[]>([])

// //   // Dialog nouvelle transaction
// //   const [dialogNouv, setDialogNouv]       = useState(false)
// //   const [submitting, setSubmitting]       = useState(false)
// //   const [formClient, setFormClient]       = useState<Client | null>(null)
// //   const [formProduit, setFormProduit]     = useState<Produit | null>(null)
// //   const [formAgence, setFormAgence]       = useState<Agence | null>(null)
// //   const [formPiece, setFormPiece]         = useState<number | ''>('')
// //   const [formDate, setFormDate]           = useState('')
// //   const [formBordereau, setFormBordereau] = useState<File | null>(null)
// //   const [formRecu, setFormRecu]           = useState<File | null>(null)

// //   // Dialog upload doc sur transaction existante
// //   const [dialogUpload, setDialogUpload]     = useState(false)
// //   const [uploadTarget, setUploadTarget]     = useState<Transaction | null>(null)
// //   const [uploadType, setUploadType]         = useState<'bordereau' | 'recu_paiement'>('bordereau')
// //   const [uploadFile, setUploadFile]         = useState<File | null>(null)
// //   const [uploadLoading, setUploadLoading]   = useState(false)

// //   // Dialog détail
// //   const [dialogDetail, setDialogDetail] = useState(false)
// //   const [detailTx, setDetailTx]         = useState<Transaction | null>(null)

// //   // ── Chargement ──────────────────────────────────────────────
// //   const charger = useCallback(async (q: string, p: number, dd: string, df: string) => {
// //     setLoading(true)
// //     setError('')
// //     try {
// //       const params: Record<string, string | number> = {
// //         search: q, page: p + 1, page_size: 15,
// //       }
// //       if (dd) params.date_debut = dd
// //       if (df) params.date_fin   = df

// //       const { data } = await transactionAPI.liste(params)
// //       setTransactions(data.results ?? data)
// //       setTotal(data.count ?? (data.results ?? data).length)
// //     } catch {
// //       setError('Erreur lors du chargement.')
// //     } finally {
// //       setLoading(false)
// //     }
// //   }, [])

// //   useEffect(() => {
// //     Promise.all([
// //       clientAPI.liste(),
// //       produitAPI.liste(),
// //       agenceAPI.liste(),
// //     ]).then(([c, p, a]) => {
// //       setClients(c.data.results ?? c.data)
// //       setProduits(p.data.results ?? p.data)
// //       setAgences(a.data.results ?? a.data)
// //     })
// //   }, [])

// //   useEffect(() => {
// //     const t = setTimeout(() => { setPage(0); charger(search, 0, dateDebut, dateFin) }, 400)
// //     return () => clearTimeout(t)
// //   }, [search, dateDebut, dateFin])

// //   useEffect(() => { charger(search, page, dateDebut, dateFin) }, [page])

// //   // ── Créer transaction ────────────────────────────────────────
// //   const handleCreer = async () => {
// //     if (!formClient || !formProduit || !formAgence || !formDate) {
// //       setError('Client, produit, agence et date sont obligatoires.')
// //       return
// //     }
// //     setSubmitting(true)
// //     try {
// //       const { data: tx } = await transactionAPI.creer({
// //         client:           formClient.id,
// //         produit:          formProduit.id,
// //         agence:           formAgence.id,
// //         piece_utilisee:   formPiece || null,
// //         date_transaction: formDate,
// //       })

// //       // Upload bordereau
// //       if (formBordereau) {
// //         const fd = new FormData()
// //         fd.append('type_doc', 'bordereau')
// //         fd.append('fichier', formBordereau)
// //         await transactionAPI.uploadDoc(tx.id, fd)
// //       }
// //       // Upload reçu
// //       if (formRecu) {
// //         const fd = new FormData()
// //         fd.append('type_doc', 'recu_paiement')
// //         fd.append('fichier', formRecu)
// //         await transactionAPI.uploadDoc(tx.id, fd)
// //       }

// //       setDialogNouv(false)
// //       resetForm()
// //       charger(search, page, dateDebut, dateFin)
// //     } catch(err: any) {
// //     console.log("Erreur documents:", err.response?.data)
// //       setError('Erreur lors de la création.')
// //     } finally {
// //       setSubmitting(false)
// //     }
// //   }
  
// // const handleViewDoc = async (txId: number, docId: number) => {
// //   try {
// //     // 1. Appel via votre API (qui inclut automatiquement le token via l'intercepteur)
// //     const response = await transactionAPI.afficherDoc(txId, docId);

// //     // 2. Récupération du type MIME depuis les en-têtes de réponse
// //     const contentType = (response.headers['content-type'] as string) || 'application/pdf';

// //     // 3. Création du Blob
// //     const file = new Blob([response.data], { type: contentType });
    
// //     // 4. Création de l'URL objet et ouverture
// //     const fileURL = URL.createObjectURL(file);
// //     window.open(fileURL, '_blank');
    
// //     // 5. Nettoyage mémoire (Optionnel, après un court délai)
// //     setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
    
// //   } catch (error) {
// //     console.error("Erreur lors de l'ouverture du document", error);
// //     // Ajoutez ici une notification utilisateur (ex: toast.error)
// //   }
// // };

// //   const resetForm = () => {
// //     setFormClient(null); setFormProduit(null); setFormAgence(null)
// //     setFormPiece(''); setFormDate('')
// //     setFormBordereau(null); setFormRecu(null)
// //   }

// //   // ── Upload doc sur transaction existante ─────────────────────
// //   const handleUpload = async () => {
// //     if (!uploadTarget || !uploadFile) return
// //     setUploadLoading(true)
// //     try {
// //       const fd = new FormData()
// //       fd.append('type_doc', uploadType)
// //       fd.append('fichier', uploadFile)
// //       await transactionAPI.uploadDoc(uploadTarget.id, fd)
// //       setDialogUpload(false)
// //       setUploadFile(null)
// //       charger(search, page, dateDebut, dateFin)
// //     } catch {
// //       setError('Erreur lors de l\'upload.')
// //     } finally {
// //       setUploadLoading(false)
// //     }
// //   }

// //   // ── ZIP ──────────────────────────────────────────────────────
// //   const telechargerZip = async (tx: Transaction) => {
// //     setDownloading((prev) => ({ ...prev, [tx.id]: true }))
// //     try {
// //       const { data } = await transactionAPI.telechargerZip(tx.id)
// //       const url  = URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
// //       const link = document.createElement('a')
// //       link.href = url
// //       link.download = `transaction_${tx.client_nom}_${tx.id}.zip`
// //       link.click()
// //       URL.revokeObjectURL(url)
// //     } catch {
// //       setError('Erreur lors du téléchargement.')
// //     } finally {
// //       setDownloading((prev) => ({ ...prev, [tx.id]: false }))
// //     }
// //   }

// //   return (
// //     <Box>
// //       {/* ── Header ── */}
// //       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
// //         <Box>
// //           <Typography variant="h5" sx={{ fontWeight: 700 }}>Archivage des transactions</Typography>
// //           <Typography variant="body2" color="text.secondary">
// //             Enregistrez et gérez les transactions clients avec leurs documents
// //           </Typography>
// //         </Box>
// //         <Button
// //           variant="contained" startIcon={<AddOutlined />}
// //           onClick={() => setDialogNouv(true)}
// //           sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
// //         >
// //           Nouvelle transaction
// //         </Button>
// //       </Box>

// //       {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

// //       {/* ── Filtres ── */}
// //       <Card sx={{ mb: 3 }}>
// //         <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', py: '12px !important' }}>
// //           <TextField
// //             placeholder="Rechercher par client..."
// //             value={search}
// //             onChange={(e) => setSearch(e.target.value)}
// //             size="small" sx={{ width: 250 }}
// //             slotProps={{
// //               input: {
// //                 startAdornment: (
// //                   <InputAdornment position="start">
// //                     <SearchOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
// //                   </InputAdornment>
// //                 ),
// //               },
// //             }}
// //           />
// //           <TextField
// //             label="Du" type="date" size="small"
// //             value={dateDebut}
// //             onChange={(e) => { setDateDebut(e.target.value); setPage(0) }}
// //             slotProps={{ inputLabel: { shrink: true } }}
// //             sx={{ width: 155 }}
// //           />
// //           <TextField
// //             label="Au" type="date" size="small"
// //             value={dateFin}
// //             onChange={(e) => { setDateFin(e.target.value); setPage(0) }}
// //             slotProps={{ inputLabel: { shrink: true } }}
// //             sx={{ width: 155 }}
// //           />
// //           {(dateDebut || dateFin) && (
// //             <Typography
// //               variant="body2"
// //               sx={{ color: '#0D47A1', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
// //               onClick={() => { setDateDebut(''); setDateFin('') }}
// //             >
// //               Réinitialiser
// //             </Typography>
// //           )}
// //         </CardContent>
// //       </Card>

// //       {/* ── Tableau ── */}
// //       <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
// //         <Table>
// //           <TableHead>
// //             <TableRow sx={{ bgcolor: '#1e293b' }}>
// //               {['Client', 'Produit', 'Agence', 'Pièce utilisée', 'Date', 'Documents', 'Actions'].map((h) => (
// //                 <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
// //               ))}
// //             </TableRow>
// //           </TableHead>
// //           <TableBody>
// //             {loading ? (
// //               <TableRow>
// //                 <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
// //                   <CircularProgress />
// //                 </TableCell>
// //               </TableRow>
// //             ) : transactions.length === 0 ? (
// //               <TableRow>
// //                 <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
// //                   Aucune transaction trouvée
// //                 </TableCell>
// //               </TableRow>
// //             ) : transactions.map((tx) => (
// //               <TableRow key={tx.id} hover>

// //                 <TableCell>
// //                   <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{tx.client_nom}</Typography>
// //                   <Typography variant="caption" color="text.secondary">#{tx.id}</Typography>
// //                 </TableCell>

// //                 <TableCell>
// //                   <Chip label={tx.produit_nom} size="small" variant="outlined" />
// //                 </TableCell>

// //                 <TableCell>
// //                   <Typography variant="body2" sx={{ fontWeight: 600 }}>{tx.agence_code}</Typography>
// //                 </TableCell>

// //                 <TableCell>
// //                   {tx.piece_utilisee_detail ? (
// //                     <Box>
// //                       <Typography variant="body2" sx={{ fontWeight: 600 }}>
// //                         {tx.piece_utilisee_detail.type_piece_display}
// //                       </Typography>
// //                       <Typography variant="caption" color="text.secondary">
// //                         {tx.piece_utilisee_detail.numero}
// //                       </Typography>
// //                     </Box>
// //                   ) : (
// //                     <Typography variant="caption" color="text.secondary">—</Typography>
// //                   )}
// //                 </TableCell>

// //                 <TableCell>
// //                   <Typography variant="body2">
// //                     {new Date(tx.date_transaction).toLocaleDateString('fr-FR')}
// //                   </Typography>
// //                 </TableCell>

// //                 <TableCell>
// //                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
// //                     <DocsBadge complets={tx.documents_complets} />
// //                     <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
// //                       {tx.documents.map((doc) => (
// //                         <Button
// //                           key={doc.id} size="small" variant="text"
// //                           startIcon={<VisibilityOutlined sx={{ fontSize: 13 }} />}
// //                           // href={doc.fichier_url} target="_blank" rel="noopener noreferrer"
// //                           onClick={() => handleViewDoc(tx.id, doc.id)}
// //                           sx={{ fontSize: 11, px: 0.5 }}
// //                         >
// //                           {doc.type_doc_display}
// //                         </Button>
// //                       ))}
// //                     </Box>
// //                   </Box>
// //                 </TableCell>

// //                 <TableCell>
// //                   <Box sx={{ display: 'flex', gap: 1 }}>
// //                     <Tooltip title="Voir détail">
// //                       <IconButton size="small" color="primary"
// //                         onClick={() => { setDetailTx(tx); setDialogDetail(true) }}>
// //                         <VisibilityOutlined fontSize="small" />
// //                       </IconButton>
// //                     </Tooltip>
// //                     {!tx.documents_complets && (
// //                       <Tooltip title="Uploader document manquant">
// //                         <IconButton size="small" color="warning"
// //                           onClick={() => { setUploadTarget(tx); setDialogUpload(true) }}>
// //                           <UploadFileOutlined fontSize="small" />
// //                         </IconButton>
// //                       </Tooltip>
// //                     )}
// //                     <Tooltip title={tx.documents.length === 0 ? 'Aucun document' : 'Télécharger ZIP'}>
// //                       <span>
// //                         <IconButton
// //                           size="small" color="default"
// //                           onClick={() => telechargerZip(tx)}
// //                           disabled={tx.documents.length === 0 || downloading[tx.id]}
// //                         >
// //                           {downloading[tx.id]
// //                             ? <CircularProgress size={16} />
// //                             : <FolderZipOutlined fontSize="small" />
// //                           }
// //                         </IconButton>
// //                       </span>
// //                     </Tooltip>
// //                   </Box>
// //                 </TableCell>

// //               </TableRow>
// //             ))}
// //           </TableBody>
// //         </Table>
// //         <TablePagination
// //           component="div"
// //           count={total} page={page} rowsPerPage={15}
// //           onPageChange={(_, p) => setPage(p)}
// //           rowsPerPageOptions={[15]}
// //           labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
// //         />
// //       </TableContainer>

// //       {/* ── Dialog Nouvelle transaction ── */}
// //       <Dialog open={dialogNouv} onClose={() => { setDialogNouv(false); resetForm() }} maxWidth="sm" fullWidth>
// //         <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //           Nouvelle transaction
// //           <IconButton size="small" onClick={() => { setDialogNouv(false); resetForm() }}>
// //             <CloseOutlined />
// //           </IconButton>
// //         </DialogTitle>
// //         <DialogContent dividers>
// //           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>

// //             <Autocomplete
// //                 options={clients}
// //                 getOptionLabel={(c) => `${c.prenom} ${c.nom}`}
// //                 value={formClient}
// //                 onChange={(_, v) => {
// //                     setFormClient(v);
// //                     setFormPiece(''); // Reset la pièce si on change de client
// //                 }}
// //                 renderInput={(params) => <TextField {...params} label="Client *" size="small" />}
// //                 />

// //             {formClient && formClient.pieces.length > 0 && (
// //               <TextField
// //                 select
// //                 label="Pièce d'identité utilisée"
// //                 size="small"
// //                 value={formPiece}
// //                 onChange={(e) => setFormPiece(Number(e.target.value))}
// //                 disabled={!formClient} // Grisé si aucun client n'est sélectionné
// //                 helperText={!formClient ? "Veuillez d'abord sélectionner un client" : ""}
// //                 >
// //                 <MenuItem value="">— Aucune —</MenuItem>
// //                 {formClient?.pieces.map((p) => (
// //                     <MenuItem key={p.id} value={p.id}>
// //                     {p.type_piece_display} — {p.numero}
// //                     </MenuItem>
// //                 ))}
// //                 </TextField>
// //             )}

// //             <Autocomplete
// //               options={produits}
// //               getOptionLabel={(p) => p.nom_display}
// //               value={formProduit}
// //               onChange={(_, v) => setFormProduit(v)}
// //               renderInput={(params) => <TextField {...params} label="Produit *" size="small" />}
// //             />

// //             <Autocomplete
// //               options={agences}
// //               getOptionLabel={(a) => `${a.code} — ${a.nom}`}
// //               value={formAgence}
// //               onChange={(_, v) => setFormAgence(v)}
// //               renderInput={(params) => <TextField {...params} label="Agence *" size="small" />}
// //             />

// //             <TextField
// //               label="Date de transaction *" type="date" size="small"
// //               value={formDate}
// //               onChange={(e) => setFormDate(e.target.value)}
// //               slotProps={{ inputLabel: { shrink: true } }}
// //             />

// //             <Divider />

// //             <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
// //               Documents (optionnels à la création)
// //             </Typography>

// //             <Box>
// //               <Typography variant="caption" color="text.secondary">Bordereau</Typography>
// //               <Button
// //                 component="label" variant="outlined" size="small" fullWidth
// //                 startIcon={<UploadFileOutlined />}
// //                 sx={{ mt: 0.5, justifyContent: 'flex-start' }}
// //               >
// //                 {formBordereau ? formBordereau.name : 'Choisir un fichier'}
// //                 <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
// //                   onChange={(e) => setFormBordereau(e.target.files?.[0] ?? null)} />
// //               </Button>
// //             </Box>

// //             <Box>
// //               <Typography variant="caption" color="text.secondary">Reçu de paiement</Typography>
// //               <Button
// //                 component="label" variant="outlined" size="small" fullWidth
// //                 startIcon={<UploadFileOutlined />}
// //                 sx={{ mt: 0.5, justifyContent: 'flex-start' }}
// //               >
// //                 {formRecu ? formRecu.name : 'Choisir un fichier'}
// //                 <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
// //                   onChange={(e) => setFormRecu(e.target.files?.[0] ?? null)} />
// //               </Button>
// //             </Box>

// //           </Box>
// //         </DialogContent>
// //         <DialogActions sx={{ p: 2, gap: 1 }}>
// //           <Button variant="outlined" onClick={() => { setDialogNouv(false); resetForm() }}>
// //             Annuler
// //           </Button>
// //           <Button
// //             variant="contained" onClick={handleCreer} disabled={submitting}
// //             startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddOutlined />}
// //             sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
// //           >
// //             Enregistrer
// //           </Button>
// //         </DialogActions>
// //       </Dialog>

// //       {/* ── Dialog Upload document manquant ── */}
// //       <Dialog open={dialogUpload} onClose={() => { setDialogUpload(false); setUploadFile(null) }} maxWidth="xs" fullWidth>
// //         <DialogTitle sx={{ fontWeight: 700 }}>Uploader un document</DialogTitle>
// //         <DialogContent dividers>
// //           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
// //             <TextField
// //               select label="Type de document" size="small"
// //               value={uploadType}
// //               onChange={(e) => setUploadType(e.target.value as 'bordereau' | 'recu_paiement')}
// //             >
// //               {uploadTarget && [
// //                 { value: 'bordereau',     label: 'Bordereau' },
// //                 { value: 'recu_paiement', label: 'Reçu de paiement' },
// //               ]
// //                 .filter((t) => !uploadTarget.documents.find((d) => d.type_doc === t.value))
// //                 .map((t) => (
// //                   <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
// //                 ))
// //               }
// //             </TextField>

// //             <Button
// //               component="label" variant="outlined" size="small"
// //               startIcon={<UploadFileOutlined />}
// //               sx={{ justifyContent: 'flex-start' }}
// //             >
// //               {uploadFile ? uploadFile.name : 'Choisir un fichier'}
// //               <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
// //                 onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
// //             </Button>
// //           </Box>
// //         </DialogContent>
// //         <DialogActions sx={{ p: 2, gap: 1 }}>
// //           <Button variant="outlined" onClick={() => { setDialogUpload(false); setUploadFile(null) }}>
// //             Annuler
// //           </Button>
// //           <Button
// //             variant="contained" onClick={handleUpload}
// //             disabled={!uploadFile || uploadLoading}
// //             startIcon={uploadLoading ? <CircularProgress size={16} color="inherit" /> : <UploadFileOutlined />}
// //           >
// //             Uploader
// //           </Button>
// //         </DialogActions>
// //       </Dialog>

// //       {/* ── Dialog Détail ── */}
// //       <Dialog open={dialogDetail} onClose={() => setDialogDetail(false)} maxWidth="sm" fullWidth>
// //         <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //           Transaction #{detailTx?.id}
// //           <IconButton size="small" onClick={() => setDialogDetail(false)}>
// //             <CloseOutlined />
// //           </IconButton>
// //         </DialogTitle>
// //         {detailTx && (
// //           <DialogContent dividers>
// //             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
// //               {[
// //                 { label: 'Client',    value: detailTx.client_nom },
// //                 { label: 'Produit',   value: detailTx.produit_nom },
// //                 { label: 'Agence',    value: detailTx.agence_code },
// //                 { label: 'Date',      value: new Date(detailTx.date_transaction).toLocaleDateString('fr-FR') },
// //                 { label: 'Archivé par', value: detailTx.archive_par_nom },
// //                 { label: 'Archivé le',  value: new Date(detailTx.archive_le).toLocaleString('fr-FR') },
// //               ].map(({ label, value }) => (
// //                 <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
// //                   <Typography variant="body2" color="text.secondary">{label}</Typography>
// //                   <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
// //                 </Box>
// //               ))}

// //               {detailTx.piece_utilisee_detail && (
// //                 <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
// //                   <Typography variant="body2" color="text.secondary">Pièce utilisée</Typography>
// //                   <Typography variant="body2" sx={{ fontWeight: 600 }}>
// //                     {detailTx.piece_utilisee_detail.type_piece_display} — {detailTx.piece_utilisee_detail.numero}
// //                   </Typography>
// //                 </Box>
// //               )}

// //               <Divider sx={{ my: 1 }} />

// //               <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
// //                 <Typography variant="body2" sx={{ fontWeight: 700 }}>Documents</Typography>
// //                 <DocsBadge complets={detailTx.documents_complets} />
// //               </Box>

// //               {detailTx.documents.length === 0 ? (
// //                 <Typography variant="body2" color="text.secondary">Aucun document uploadé</Typography>
// //               ) : (
// //                 detailTx.documents.map((doc) => (
// //                   <Box key={doc.id} sx={{
// //                     display: 'flex', justifyContent: 'space-between', alignItems: 'center',
// //                     p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2,
// //                   }}>
// //                     <Box>
// //                       <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.type_doc_display}</Typography>
// //                       <Typography variant="caption" color="text.secondary">
// //                         {new Date(doc.uploaded_at).toLocaleString('fr-FR')}
// //                       </Typography>
// //                     </Box>
// //                     <Button
// //                       size="small" variant="outlined"
// //                       startIcon={<VisibilityOutlined />}
// //                       // href={doc.fichier_url} target="_blank" rel="noopener noreferrer"
// //                       onClick={() => handleViewDoc(detailTx.id, doc.id)}
// //                     >
// //                       Voir
// //                     </Button>
// //                   </Box>
// //                 ))
// //               )}
// //             </Box>
// //           </DialogContent>
// //         )}
// //         <DialogActions sx={{ p: 2 }}>
// //           <Button variant="outlined" onClick={() => setDialogDetail(false)}>Fermer</Button>
// //         </DialogActions>
// //       </Dialog>

// //     </Box>
// //   )
// // }





// 'use client'
// import { useEffect, useState, useCallback, useMemo, Fragment } from 'react'
// import {
//   Box, Typography, Card, CardContent, Button,
//   Table, TableBody, TableCell, TableContainer,
//   TableHead, TableRow, Paper, TextField,
//   InputAdornment, CircularProgress, Alert,
//   TablePagination, Chip, Tooltip, MenuItem,
//   Dialog, DialogTitle, DialogContent, DialogActions,
//   Autocomplete, Divider, IconButton, Collapse
// } from '@mui/material'
// import {
//   SearchOutlined, DownloadOutlined, FolderZipOutlined,
//   AddOutlined, UploadFileOutlined, CheckCircleOutlined,
//   WarningAmberOutlined, CloseOutlined, VisibilityOutlined,
//   KeyboardArrowDownOutlined, KeyboardArrowRightOutlined
// } from '@mui/icons-material'
// import { transactionAPI, clientAPI, produitAPI, agenceAPI } from '@/lib/api'

// // ── Types ──────────────────────────────────────────────────────
// interface Document {
//   id:               number
//   type_doc:         string
//   type_doc_display: string
//   fichier:          string
//   fichier_url:      string 
//   uploaded_at:      string
// }

// interface Transaction {
//   id:                   number
//   client:               number
//   client_nom:           string
//   produit:              number
//   produit_nom:          string
//   agence:               number
//   agence_code:          string
//   piece_utilisee:       number | null
//   piece_utilisee_detail: { type_piece_display: string; numero: string } | null
//   date_transaction:     string
//   archive_par_nom:      string
//   archive_le:           string
//   documents:            Document[]
//   documents_complets:   boolean
// }

// interface Client {
//   id:     number
//   nom:    string
//   prenom: string
//   pieces: { id: number; type_piece: string; type_piece_display: string; numero: string }[]
// }

// interface Produit {
//   id:          number
//   nom:         string
//   nom_display: string
// }

// interface Agence {
//   id:   number
//   nom:  string
//   code: string
// }

// // ── Hiérarchie d'affichage : Produit → Client → Transactions ────
// interface ClientGroup {
//   client_id:    number
//   client_nom:   string
//   transactions: Transaction[]
// }

// interface ProduitGroup {
//   produit_id:   number
//   produit_nom:  string
//   clients:      ClientGroup[]
// }

// // ── Composant badge documents ───────────────────────────────────
// const DocsChip = ({ completes, total }: { completes: number; total: number }) => (
//   <Chip
//     size="small"
//     icon={completes === total ? <CheckCircleOutlined sx={{ fontSize: 14 }} /> : <WarningAmberOutlined sx={{ fontSize: 14 }} />}
//     label={`${completes}/${total} complets`}
//     color={completes === total ? 'success' : 'warning'}
//   />
// )

// const DocsBadge = ({ complets }: { complets: boolean }) => (
//   <Chip
//     size="small"
//     icon={complets ? <CheckCircleOutlined sx={{ fontSize: 14 }} /> : <WarningAmberOutlined sx={{ fontSize: 14 }} />}
//     label={complets ? 'Complets' : 'Incomplets'}
//     color={complets ? 'success' : 'warning'}
//   />
// )

// export default function ArchivageTransactionsPage() {
//   const [transactions, setTransactions] = useState<Transaction[]>([])
//   const [loading, setLoading]           = useState(true)
//   const [error, setError]               = useState('')
//   const [search, setSearch]             = useState('')
//   const [page, setPage]                 = useState(0)
//   const [total, setTotal]               = useState(0)
//   const [dateDebut, setDateDebut]       = useState('')
//   const [dateFin, setDateFin]           = useState('')
//   const [downloading, setDownloading]   = useState<Record<number, boolean>>({})

//   // Déploiement : niveau Produit, puis niveau Client (clé = "produitId-clientId")
//   const [expandedProduits, setExpandedProduits] = useState<Record<number, boolean>>({})
//   const [expandedClients, setExpandedClients]   = useState<Record<string, boolean>>({})

//   const toggleProduit = (id: number) =>
//     setExpandedProduits((prev) => ({ ...prev, [id]: !prev[id] }))

//   const toggleClient = (key: string) =>
//     setExpandedClients((prev) => ({ ...prev, [key]: !prev[key] }))

//   // Référentiels
//   const [clients, setClients]   = useState<Client[]>([])
//   const [produits, setProduits] = useState<Produit[]>([])
//   const [agences, setAgences]   = useState<Agence[]>([])

//   // Dialog nouvelle transaction
//   const [dialogNouv, setDialogNouv]       = useState(false)
//   const [submitting, setSubmitting]       = useState(false)
//   const [formClient, setFormClient]       = useState<Client | null>(null)
//   const [formProduit, setFormProduit]     = useState<Produit | null>(null)
//   const [formAgence, setFormAgence]       = useState<Agence | null>(null)
//   const [formPiece, setFormPiece]         = useState<number | ''>('')
//   const [formDate, setFormDate]           = useState('')
//   const [formBordereau, setFormBordereau] = useState<File | null>(null)
//   const [formRecu, setFormRecu]           = useState<File | null>(null)

//   // Dialog upload doc sur transaction existante
//   const [dialogUpload, setDialogUpload]     = useState(false)
//   const [uploadTarget, setUploadTarget]     = useState<Transaction | null>(null)
//   const [uploadType, setUploadType]         = useState<'bordereau' | 'recu_paiement'>('bordereau')
//   const [uploadFile, setUploadFile]         = useState<File | null>(null)
//   const [uploadLoading, setUploadLoading]   = useState(false)

//   // Dialog détail
//   const [dialogDetail, setDialogDetail] = useState(false)
//   const [detailTx, setDetailTx]         = useState<Transaction | null>(null)

//   // ── Chargement ──────────────────────────────────────────────
//   const charger = useCallback(async (q: string, p: number, dd: string, df: string) => {
//     setLoading(true)
//     setError('')
//     try {
//       const params: Record<string, string | number> = {
//         search: q, page: p + 1, page_size: 15,
//       }
//       if (dd) params.date_debut = dd
//       if (df) params.date_fin   = df

//       const { data } = await transactionAPI.liste(params)
//       setTransactions(data.results ?? data)
//       setTotal(data.count ?? (data.results ?? data).length)
//     } catch {
//       setError('Erreur lors du chargement.')
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     Promise.all([
//       clientAPI.liste(),
//       produitAPI.liste(),
//       agenceAPI.liste(),
//     ]).then(([c, p, a]) => {
//       setClients(c.data.results ?? c.data)
//       setProduits(p.data.results ?? p.data)
//       setAgences(a.data.results ?? a.data)
//     })
//   }, [])

//   useEffect(() => {
//     const t = setTimeout(() => { setPage(0); charger(search, 0, dateDebut, dateFin) }, 400)
//     return () => clearTimeout(t)
//   }, [search, dateDebut, dateFin])

//   useEffect(() => { charger(search, page, dateDebut, dateFin) }, [page])

//   // ── Regroupement Produit → Client → Transactions ─────────────
//   // NB : le regroupement se fait sur les transactions de la page en cours
//   // (la pagination reste gérée côté backend par transaction individuelle).
//   const produitGroups = useMemo<ProduitGroup[]>(() => {
//     const prodMap = new Map<number, { produit_nom: string; clientMap: Map<number, ClientGroup> }>()

//     transactions.forEach((tx) => {
//       if (!prodMap.has(tx.produit)) {
//         prodMap.set(tx.produit, { produit_nom: tx.produit_nom, clientMap: new Map() })
//       }
//       const p = prodMap.get(tx.produit)!
//       if (!p.clientMap.has(tx.client)) {
//         p.clientMap.set(tx.client, { client_id: tx.client, client_nom: tx.client_nom, transactions: [] })
//       }
//       p.clientMap.get(tx.client)!.transactions.push(tx)
//     })

//     const groups: ProduitGroup[] = Array.from(prodMap.entries()).map(([produit_id, p]) => {
//       const clients = Array.from(p.clientMap.values())
//       clients.forEach((c) =>
//         c.transactions.sort(
//           (a, b) => new Date(b.date_transaction).getTime() - new Date(a.date_transaction).getTime()
//         )
//       )
//       clients.sort(
//         (a, b) =>
//           new Date(b.transactions[0].date_transaction).getTime() -
//           new Date(a.transactions[0].date_transaction).getTime()
//       )
//       return { produit_id, produit_nom: p.produit_nom, clients }
//     })

//     groups.sort(
//       (a, b) =>
//         new Date(b.clients[0].transactions[0].date_transaction).getTime() -
//         new Date(a.clients[0].transactions[0].date_transaction).getTime()
//     )

//     return groups
//   }, [transactions])

//   // ── Créer transaction ────────────────────────────────────────
//   const handleCreer = async () => {
//     if (!formClient || !formProduit || !formAgence || !formDate) {
//       setError('Client, produit, agence et date sont obligatoires.')
//       return
//     }
//     setSubmitting(true)
//     try {
//       const { data: tx } = await transactionAPI.creer({
//         client:           formClient.id,
//         produit:          formProduit.id,
//         agence:           formAgence.id,
//         piece_utilisee:   formPiece || null,
//         date_transaction: formDate,
//       })

//       // Upload bordereau
//       if (formBordereau) {
//         const fd = new FormData()
//         fd.append('type_doc', 'bordereau')
//         fd.append('fichier', formBordereau)
//         await transactionAPI.uploadDoc(tx.id, fd)
//       }
//       // Upload reçu
//       if (formRecu) {
//         const fd = new FormData()
//         fd.append('type_doc', 'recu_paiement')
//         fd.append('fichier', formRecu)
//         await transactionAPI.uploadDoc(tx.id, fd)
//       }

//       setDialogNouv(false)
//       resetForm()
//       charger(search, page, dateDebut, dateFin)
//     } catch(err: any) {
//     console.log("Erreur documents:", err.response?.data)
//       setError('Erreur lors de la création.')
//     } finally {
//       setSubmitting(false)
//     }
//   }
  
// const handleViewDoc = async (txId: number, docId: number) => {
//   try {
//     // 1. Appel via votre API (qui inclut automatiquement le token via l'intercepteur)
//     const response = await transactionAPI.afficherDoc(txId, docId);

//     // 2. Récupération du type MIME depuis les en-têtes de réponse
//     const contentType = (response.headers['content-type'] as string) || 'application/pdf';

//     // 3. Création du Blob
//     const file = new Blob([response.data], { type: contentType });
    
//     // 4. Création de l'URL objet et ouverture
//     const fileURL = URL.createObjectURL(file);
//     window.open(fileURL, '_blank');
    
//     // 5. Nettoyage mémoire (Optionnel, après un court délai)
//     setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
    
//   } catch (error) {
//     console.error("Erreur lors de l'ouverture du document", error);
//     // Ajoutez ici une notification utilisateur (ex: toast.error)
//   }
// };

//   const resetForm = () => {
//     setFormClient(null); setFormProduit(null); setFormAgence(null)
//     setFormPiece(''); setFormDate('')
//     setFormBordereau(null); setFormRecu(null)
//   }

//   // ── Upload doc sur transaction existante ─────────────────────
//   const handleUpload = async () => {
//     if (!uploadTarget || !uploadFile) return
//     setUploadLoading(true)
//     try {
//       const fd = new FormData()
//       fd.append('type_doc', uploadType)
//       fd.append('fichier', uploadFile)
//       await transactionAPI.uploadDoc(uploadTarget.id, fd)
//       setDialogUpload(false)
//       setUploadFile(null)
//       charger(search, page, dateDebut, dateFin)
//     } catch {
//       setError('Erreur lors de l\'upload.')
//     } finally {
//       setUploadLoading(false)
//     }
//   }

//   // ── ZIP ──────────────────────────────────────────────────────
//   const telechargerZip = async (tx: Transaction) => {
//     setDownloading((prev) => ({ ...prev, [tx.id]: true }))
//     try {
//       const { data } = await transactionAPI.telechargerZip(tx.id)
//       const url  = URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
//       const link = document.createElement('a')
//       link.href = url
//       link.download = `transaction_${tx.client_nom}_${tx.id}.zip`
//       link.click()
//       URL.revokeObjectURL(url)
//     } catch {
//       setError('Erreur lors du téléchargement.')
//     } finally {
//       setDownloading((prev) => ({ ...prev, [tx.id]: false }))
//     }
//   }

//   return (
//     <Box>
//       {/* ── Header ── */}
//       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 700 }}>Archivage des transactions</Typography>
//           <Typography variant="body2" color="text.secondary">
//             Enregistrez et gérez les transactions clients avec leurs documents
//           </Typography>
//         </Box>
//         <Button
//           variant="contained" startIcon={<AddOutlined />}
//           onClick={() => setDialogNouv(true)}
//           sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
//         >
//           Nouvelle transaction
//         </Button>
//       </Box>

//       {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

//       {/* ── Filtres ── */}
//       <Card sx={{ mb: 3 }}>
//         <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', py: '12px !important' }}>
//           <TextField
//             placeholder="Rechercher par client..."
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
//           {(dateDebut || dateFin) && (
//             <Typography
//               variant="body2"
//               sx={{ color: '#0D47A1', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
//               onClick={() => { setDateDebut(''); setDateFin('') }}
//             >
//               Réinitialiser
//             </Typography>
//           )}
//         </CardContent>
//       </Card>

//       {/* ── Tableau : Produit → Clients → Transactions ── */}
//       <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ bgcolor: '#1e293b' }}>
//               <TableCell sx={{ width: 48 }} />
//               {['Produit', 'Clients', 'Transactions', 'Dernière date', 'Documents', 'Actions'].map((h) => (
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
//             ) : produitGroups.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
//                   Aucune transaction trouvée
//                 </TableCell>
//               </TableRow>
//             ) : produitGroups.map((pg) => {
//               const allTx         = pg.clients.flatMap((c) => c.transactions)
//               const totalClients  = pg.clients.length
//               const totalTx       = allTx.length
//               const completes     = allTx.filter((t) => t.documents_complets).length
//               const derniereTx    = pg.clients[0].transactions[0]
//               const isOpenP       = !!expandedProduits[pg.produit_id]

//               return (
//                 <Fragment key={pg.produit_id}>
//                   {/* Niveau 1 : une seule ligne par produit */}
//                   <TableRow hover sx={{ '& > *': { borderBottom: isOpenP ? 'unset' : undefined } }}>
//                     <TableCell sx={{ width: 48 }}>
//                       <IconButton size="small" onClick={() => toggleProduit(pg.produit_id)}>
//                         {isOpenP ? <KeyboardArrowDownOutlined /> : <KeyboardArrowRightOutlined />}
//                       </IconButton>
//                     </TableCell>

//                     <TableCell>
//                       <Chip label={pg.produit_nom} size="small" sx={{ fontWeight: 600 }} />
//                     </TableCell>

//                     <TableCell>
//                       <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                         {totalClients} client{totalClients > 1 ? 's' : ''}
//                       </Typography>
//                     </TableCell>

//                     <TableCell>
//                       <Chip
//                         label={`${totalTx} transaction${totalTx > 1 ? 's' : ''}`}
//                         size="small"
//                         sx={{ bgcolor: '#1e293b', color: 'white', fontWeight: 600 }}
//                       />
//                     </TableCell>

//                     <TableCell>
//                       <Typography variant="body2">
//                         {new Date(derniereTx.date_transaction).toLocaleDateString('fr-FR')}
//                       </Typography>
//                     </TableCell>

//                     <TableCell>
//                       <DocsChip completes={completes} total={totalTx} />
//                     </TableCell>

//                     <TableCell>
//                       <Button size="small" onClick={() => toggleProduit(pg.produit_id)} sx={{ textTransform: 'none' }}>
//                         {isOpenP ? 'Réduire' : 'Voir les clients'}
//                       </Button>
//                     </TableCell>
//                   </TableRow>

//                   {/* Niveau 2 : liste des clients pour ce produit */}
//                   <TableRow>
//                     <TableCell colSpan={7} sx={{ p: 0, borderBottom: isOpenP ? undefined : 'none' }}>
//                       <Collapse in={isOpenP} timeout="auto" unmountOnExit>
//                         <Box sx={{ m: 2, ml: 6 }}>
//                           <Table size="small">
//                             <TableHead>
//                               <TableRow sx={{ bgcolor: '#f1f5f9' }}>
//                                 <TableCell sx={{ width: 40 }} />
//                                 {['Client', 'Transactions', 'Dernière date', 'Documents', 'Actions'].map((h) => (
//                                   <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
//                                 ))}
//                               </TableRow>
//                             </TableHead>
//                             <TableBody>
//                               {pg.clients.map((cg) => {
//                                 const clientKey  = `${pg.produit_id}-${cg.client_id}`
//                                 const isOpenC    = !!expandedClients[clientKey]
//                                 const ctotal     = cg.transactions.length
//                                 const ccompletes = cg.transactions.filter((t) => t.documents_complets).length
//                                 const cderniere  = cg.transactions[0]

//                                 return (
//                                   <Fragment key={clientKey}>
//                                     <TableRow hover>
//                                       <TableCell sx={{ width: 40 }}>
//                                         <IconButton size="small" onClick={() => toggleClient(clientKey)}>
//                                           {isOpenC
//                                             ? <KeyboardArrowDownOutlined fontSize="small" />
//                                             : <KeyboardArrowRightOutlined fontSize="small" />}
//                                         </IconButton>
//                                       </TableCell>

//                                       <TableCell>
//                                         <Typography variant="body2" sx={{ fontWeight: 600 }}>{cg.client_nom}</Typography>
//                                       </TableCell>

//                                       <TableCell>
//                                         <Typography variant="body2">
//                                           {ctotal} transaction{ctotal > 1 ? 's' : ''}
//                                         </Typography>
//                                       </TableCell>

//                                       <TableCell>
//                                         <Typography variant="body2">
//                                           {new Date(cderniere.date_transaction).toLocaleDateString('fr-FR')}
//                                         </Typography>
//                                       </TableCell>

//                                       <TableCell>
//                                         <DocsChip completes={ccompletes} total={ctotal} />
//                                       </TableCell>

//                                       <TableCell>
//                                         <Button
//                                           size="small" onClick={() => toggleClient(clientKey)}
//                                           sx={{ textTransform: 'none', fontSize: 12 }}
//                                         >
//                                           {isOpenC ? 'Réduire' : 'Détails'}
//                                         </Button>
//                                       </TableCell>
//                                     </TableRow>

//                                     {/* Niveau 3 : transactions du client pour ce produit (avec agence) */}
//                                     <TableRow>
//                                       <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
//                                         <Collapse in={isOpenC} timeout="auto" unmountOnExit>
//                                           <Box sx={{ m: 1.5, ml: 5 }}>
//                                             <Table size="small">
//                                               <TableHead>
//                                                 <TableRow sx={{ bgcolor: '#e2e8f0' }}>
//                                                   {['Agence', 'Pièce utilisée', 'Date', 'Documents', 'Actions'].map((h) => (
//                                                     <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
//                                                   ))}
//                                                 </TableRow>
//                                               </TableHead>
//                                               <TableBody>
//                                                 {cg.transactions.map((tx) => (
//                                                   <TableRow key={tx.id} hover>
//                                                     <TableCell>
//                                                       <Typography variant="body2" sx={{ fontWeight: 600 }}>{tx.agence_code}</Typography>
//                                                     </TableCell>

//                                                     <TableCell>
//                                                       {tx.piece_utilisee_detail ? (
//                                                         <Box>
//                                                           <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                                                             {tx.piece_utilisee_detail.type_piece_display}
//                                                           </Typography>
//                                                           <Typography variant="caption" color="text.secondary">
//                                                             {tx.piece_utilisee_detail.numero}
//                                                           </Typography>
//                                                         </Box>
//                                                       ) : (
//                                                         <Typography variant="caption" color="text.secondary">—</Typography>
//                                                       )}
//                                                     </TableCell>

//                                                     <TableCell>
//                                                       <Typography variant="body2">
//                                                         {new Date(tx.date_transaction).toLocaleDateString('fr-FR')}
//                                                       </Typography>
//                                                     </TableCell>

//                                                     <TableCell>
//                                                       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
//                                                         <DocsBadge complets={tx.documents_complets} />
//                                                         <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
//                                                           {tx.documents.map((doc) => (
//                                                             <Button
//                                                               key={doc.id} size="small" variant="text"
//                                                               startIcon={<VisibilityOutlined sx={{ fontSize: 13 }} />}
//                                                               onClick={() => handleViewDoc(tx.id, doc.id)}
//                                                               sx={{ fontSize: 11, px: 0.5 }}
//                                                             >
//                                                               {doc.type_doc_display}
//                                                             </Button>
//                                                           ))}
//                                                         </Box>
//                                                       </Box>
//                                                     </TableCell>

//                                                     <TableCell>
//                                                       <Box sx={{ display: 'flex', gap: 1 }}>
//                                                         <Tooltip title="Voir détail">
//                                                           <IconButton size="small" color="primary"
//                                                             onClick={() => { setDetailTx(tx); setDialogDetail(true) }}>
//                                                             <VisibilityOutlined fontSize="small" />
//                                                           </IconButton>
//                                                         </Tooltip>
//                                                         {!tx.documents_complets && (
//                                                           <Tooltip title="Uploader document manquant">
//                                                             <IconButton size="small" color="warning"
//                                                               onClick={() => { setUploadTarget(tx); setDialogUpload(true) }}>
//                                                               <UploadFileOutlined fontSize="small" />
//                                                             </IconButton>
//                                                           </Tooltip>
//                                                         )}
//                                                         <Tooltip title={tx.documents.length === 0 ? 'Aucun document' : 'Télécharger ZIP'}>
//                                                           <span>
//                                                             <IconButton
//                                                               size="small" color="default"
//                                                               onClick={() => telechargerZip(tx)}
//                                                               disabled={tx.documents.length === 0 || downloading[tx.id]}
//                                                             >
//                                                               {downloading[tx.id]
//                                                                 ? <CircularProgress size={16} />
//                                                                 : <FolderZipOutlined fontSize="small" />
//                                                               }
//                                                             </IconButton>
//                                                           </span>
//                                                         </Tooltip>
//                                                       </Box>
//                                                     </TableCell>
//                                                   </TableRow>
//                                                 ))}
//                                               </TableBody>
//                                             </Table>
//                                           </Box>
//                                         </Collapse>
//                                       </TableCell>
//                                     </TableRow>
//                                   </Fragment>
//                                 )
//                               })}
//                             </TableBody>
//                           </Table>
//                         </Box>
//                       </Collapse>
//                     </TableCell>
//                   </TableRow>
//                 </Fragment>
//               )
//             })}
//           </TableBody>
//         </Table>
//         <TablePagination
//           component="div"
//           count={total} page={page} rowsPerPage={15}
//           onPageChange={(_, p) => setPage(p)}
//           rowsPerPageOptions={[15]}
//           labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count} transactions`}
//         />
//       </TableContainer>

//       {/* ── Dialog Nouvelle transaction ── */}
//       <Dialog open={dialogNouv} onClose={() => { setDialogNouv(false); resetForm() }} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           Nouvelle transaction
//           <IconButton size="small" onClick={() => { setDialogNouv(false); resetForm() }}>
//             <CloseOutlined />
//           </IconButton>
//         </DialogTitle>
//         <DialogContent dividers>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>

//             <Autocomplete
//                 options={clients}
//                 getOptionLabel={(c) => `${c.prenom} ${c.nom}`}
//                 value={formClient}
//                 onChange={(_, v) => {
//                     setFormClient(v);
//                     setFormPiece(''); // Reset la pièce si on change de client
//                 }}
//                 renderInput={(params) => <TextField {...params} label="Client *" size="small" />}
//                 />

//             {formClient && formClient.pieces.length > 0 && (
//               <TextField
//                 select
//                 label="Pièce d'identité utilisée"
//                 size="small"
//                 value={formPiece}
//                 onChange={(e) => setFormPiece(Number(e.target.value))}
//                 disabled={!formClient} // Grisé si aucun client n'est sélectionné
//                 helperText={!formClient ? "Veuillez d'abord sélectionner un client" : ""}
//                 >
//                 <MenuItem value="">— Aucune —</MenuItem>
//                 {formClient?.pieces.map((p) => (
//                     <MenuItem key={p.id} value={p.id}>
//                     {p.type_piece_display} — {p.numero}
//                     </MenuItem>
//                 ))}
//                 </TextField>
//             )}

//             <Autocomplete
//               options={produits}
//               getOptionLabel={(p) => p.nom_display}
//               value={formProduit}
//               onChange={(_, v) => setFormProduit(v)}
//               renderInput={(params) => <TextField {...params} label="Produit *" size="small" />}
//             />

//             <Autocomplete
//               options={agences}
//               getOptionLabel={(a) => `${a.code} — ${a.nom}`}
//               value={formAgence}
//               onChange={(_, v) => setFormAgence(v)}
//               renderInput={(params) => <TextField {...params} label="Agence *" size="small" />}
//             />

//             <TextField
//               label="Date de transaction *" type="date" size="small"
//               value={formDate}
//               onChange={(e) => setFormDate(e.target.value)}
//               slotProps={{ inputLabel: { shrink: true } }}
//             />

//             <Divider />

//             <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
//               Documents (optionnels à la création)
//             </Typography>

//             <Box>
//               <Typography variant="caption" color="text.secondary">Bordereau</Typography>
//               <Button
//                 component="label" variant="outlined" size="small" fullWidth
//                 startIcon={<UploadFileOutlined />}
//                 sx={{ mt: 0.5, justifyContent: 'flex-start' }}
//               >
//                 {formBordereau ? formBordereau.name : 'Choisir un fichier'}
//                 <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
//                   onChange={(e) => setFormBordereau(e.target.files?.[0] ?? null)} />
//               </Button>
//             </Box>

//             <Box>
//               <Typography variant="caption" color="text.secondary">Reçu de paiement</Typography>
//               <Button
//                 component="label" variant="outlined" size="small" fullWidth
//                 startIcon={<UploadFileOutlined />}
//                 sx={{ mt: 0.5, justifyContent: 'flex-start' }}
//               >
//                 {formRecu ? formRecu.name : 'Choisir un fichier'}
//                 <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
//                   onChange={(e) => setFormRecu(e.target.files?.[0] ?? null)} />
//               </Button>
//             </Box>

//           </Box>
//         </DialogContent>
//         <DialogActions sx={{ p: 2, gap: 1 }}>
//           <Button variant="outlined" onClick={() => { setDialogNouv(false); resetForm() }}>
//             Annuler
//           </Button>
//           <Button
//             variant="contained" onClick={handleCreer} disabled={submitting}
//             startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddOutlined />}
//             sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
//           >
//             Enregistrer
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* ── Dialog Upload document manquant ── */}
//       <Dialog open={dialogUpload} onClose={() => { setDialogUpload(false); setUploadFile(null) }} maxWidth="xs" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700 }}>Uploader un document</DialogTitle>
//         <DialogContent dividers>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
//             <TextField
//               select label="Type de document" size="small"
//               value={uploadType}
//               onChange={(e) => setUploadType(e.target.value as 'bordereau' | 'recu_paiement')}
//             >
//               {uploadTarget && [
//                 { value: 'bordereau',     label: 'Bordereau' },
//                 { value: 'recu_paiement', label: 'Reçu de paiement' },
//               ]
//                 .filter((t) => !uploadTarget.documents.find((d) => d.type_doc === t.value))
//                 .map((t) => (
//                   <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
//                 ))
//               }
//             </TextField>

//             <Button
//               component="label" variant="outlined" size="small"
//               startIcon={<UploadFileOutlined />}
//               sx={{ justifyContent: 'flex-start' }}
//             >
//               {uploadFile ? uploadFile.name : 'Choisir un fichier'}
//               <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
//                 onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
//             </Button>
//           </Box>
//         </DialogContent>
//         <DialogActions sx={{ p: 2, gap: 1 }}>
//           <Button variant="outlined" onClick={() => { setDialogUpload(false); setUploadFile(null) }}>
//             Annuler
//           </Button>
//           <Button
//             variant="contained" onClick={handleUpload}
//             disabled={!uploadFile || uploadLoading}
//             startIcon={uploadLoading ? <CircularProgress size={16} color="inherit" /> : <UploadFileOutlined />}
//           >
//             Uploader
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* ── Dialog Détail ── */}
//       <Dialog open={dialogDetail} onClose={() => setDialogDetail(false)} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           Transaction #{detailTx?.id}
//           <IconButton size="small" onClick={() => setDialogDetail(false)}>
//             <CloseOutlined />
//           </IconButton>
//         </DialogTitle>
//         {detailTx && (
//           <DialogContent dividers>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
//               {[
//                 { label: 'Client',    value: detailTx.client_nom },
//                 { label: 'Produit',   value: detailTx.produit_nom },
//                 { label: 'Agence',    value: detailTx.agence_code },
//                 { label: 'Date',      value: new Date(detailTx.date_transaction).toLocaleDateString('fr-FR') },
//                 { label: 'Archivé par', value: detailTx.archive_par_nom },
//                 { label: 'Archivé le',  value: new Date(detailTx.archive_le).toLocaleString('fr-FR') },
//               ].map(({ label, value }) => (
//                 <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
//                   <Typography variant="body2" color="text.secondary">{label}</Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
//                 </Box>
//               ))}

//               {detailTx.piece_utilisee_detail && (
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
//                   <Typography variant="body2" color="text.secondary">Pièce utilisée</Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                     {detailTx.piece_utilisee_detail.type_piece_display} — {detailTx.piece_utilisee_detail.numero}
//                   </Typography>
//                 </Box>
//               )}

//               <Divider sx={{ my: 1 }} />

//               <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
//                 <Typography variant="body2" sx={{ fontWeight: 700 }}>Documents</Typography>
//                 <DocsBadge complets={detailTx.documents_complets} />
//               </Box>

//               {detailTx.documents.length === 0 ? (
//                 <Typography variant="body2" color="text.secondary">Aucun document uploadé</Typography>
//               ) : (
//                 detailTx.documents.map((doc) => (
//                   <Box key={doc.id} sx={{
//                     display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                     p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2,
//                   }}>
//                     <Box>
//                       <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.type_doc_display}</Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         {new Date(doc.uploaded_at).toLocaleString('fr-FR')}
//                       </Typography>
//                     </Box>
//                     <Button
//                       size="small" variant="outlined"
//                       startIcon={<VisibilityOutlined />}
//                       onClick={() => handleViewDoc(detailTx.id, doc.id)}
//                     >
//                       Voir
//                     </Button>
//                   </Box>
//                 ))
//               )}
//             </Box>
//           </DialogContent>
//         )}
//         <DialogActions sx={{ p: 2 }}>
//           <Button variant="outlined" onClick={() => setDialogDetail(false)}>Fermer</Button>
//         </DialogActions>
//       </Dialog>

//     </Box>
//   )
// }


//------------------------------MODIF DU 10/07/2026

// 'use client'
// import { useEffect, useState, useCallback, useMemo, Fragment } from 'react'
// import {
//   Box, Typography, Card, CardContent, Button,
//   Table, TableBody, TableCell, TableContainer,
//   TableHead, TableRow, Paper, TextField,
//   InputAdornment, CircularProgress, Alert,
//   TablePagination, Chip, Tooltip, MenuItem,
//   Dialog, DialogTitle, DialogContent, DialogActions,
//   Autocomplete, Divider, IconButton, Collapse,
//   Tabs, Tab
// } from '@mui/material'
// import {
//   SearchOutlined, DownloadOutlined, FolderZipOutlined,
//   AddOutlined, UploadFileOutlined, CheckCircleOutlined,
//   WarningAmberOutlined, CloseOutlined, VisibilityOutlined,
//   KeyboardArrowDownOutlined, KeyboardArrowRightOutlined
// } from '@mui/icons-material'
// import { transactionAPI, clientAPI, produitAPI, agenceAPI } from '@/lib/api'

// // ── Types ──────────────────────────────────────────────────────
// interface Document {
//   id:               number
//   type_doc:         string
//   type_doc_display: string
//   fichier:          string
//   fichier_url:      string 
//   uploaded_at:      string
// }

// interface Transaction {
//   id:                   number
//   client:               number
//   client_nom:           string
//   produit:              number
//   produit_nom:          string
//   agence:               number
//   agence_code:          string
//   piece_utilisee:       number | null
//   piece_utilisee_detail: { type_piece_display: string; numero: string } | null
//   date_transaction:     string
//   archive_par_nom:      string
//   archive_le:           string
//   documents:            Document[]
//   documents_complets:   boolean
// }

// interface Client {
//   id:     number
//   nom:    string
//   prenom: string
//   pieces: { id: number; type_piece: string; type_piece_display: string; numero: string }[]
// }

// interface Produit {
//   id:          number
//   nom:         string
//   nom_display: string
// }

// interface Agence {
//   id:   number
//   nom:  string
//   code: string
// }

// // ── Hiérarchie d'affichage : Produit → Client → Transactions ────
// interface ClientGroup {
//   client_id:    number
//   client_nom:   string
//   transactions: Transaction[]
// }

// interface ProduitGroup {
//   produit_id:   number
//   produit_nom:  string
//   clients:      ClientGroup[]
// }

// type OngletExport = 'agence' | 'client' | 'produit'

// // ── Composant badge documents ───────────────────────────────────
// const DocsChip = ({ completes, total }: { completes: number; total: number }) => (
//   <Chip
//     size="small"
//     icon={completes === total ? <CheckCircleOutlined sx={{ fontSize: 14 }} /> : <WarningAmberOutlined sx={{ fontSize: 14 }} />}
//     label={`${completes}/${total} complets`}
//     color={completes === total ? 'success' : 'warning'}
//   />
// )

// const DocsBadge = ({ complets }: { complets: boolean }) => (
//   <Chip
//     size="small"
//     icon={complets ? <CheckCircleOutlined sx={{ fontSize: 14 }} /> : <WarningAmberOutlined sx={{ fontSize: 14 }} />}
//     label={complets ? 'Complets' : 'Incomplets'}
//     color={complets ? 'success' : 'warning'}
//   />
// )

// export default function ArchivageTransactionsPage() {
//   const [transactions, setTransactions] = useState<Transaction[]>([])
//   const [loading, setLoading]           = useState(true)
//   const [error, setError]               = useState('')
//   const [search, setSearch]             = useState('')
//   const [page, setPage]                 = useState(0)
//   const [total, setTotal]               = useState(0)
//   const [dateDebut, setDateDebut]       = useState('')
//   const [dateFin, setDateFin]           = useState('')
//   const [downloading, setDownloading]   = useState<Record<number, boolean>>({})

//   // Déploiement : niveau Produit, puis niveau Client (clé = "produitId-clientId")
//   const [expandedProduits, setExpandedProduits] = useState<Record<number, boolean>>({})
//   const [expandedClients, setExpandedClients]   = useState<Record<string, boolean>>({})

//   const toggleProduit = (id: number) =>
//     setExpandedProduits((prev) => ({ ...prev, [id]: !prev[id] }))

//   const toggleClient = (key: string) =>
//     setExpandedClients((prev) => ({ ...prev, [key]: !prev[key] }))

//   // Référentiels
//   const [clients, setClients]   = useState<Client[]>([])
//   const [produits, setProduits] = useState<Produit[]>([])
//   const [agences, setAgences]   = useState<Agence[]>([])

//   // Dialog nouvelle transaction
//   const [dialogNouv, setDialogNouv]       = useState(false)
//   const [submitting, setSubmitting]       = useState(false)
//   const [formClient, setFormClient]       = useState<Client | null>(null)
//   const [formProduit, setFormProduit]     = useState<Produit | null>(null)
//   const [formAgence, setFormAgence]       = useState<Agence | null>(null)
//   const [formPiece, setFormPiece]         = useState<number | ''>('')
//   const [formDate, setFormDate]           = useState('')
//   const [formBordereau, setFormBordereau] = useState<File | null>(null)
//   const [formRecu, setFormRecu]           = useState<File | null>(null)

//   // Dialog upload doc sur transaction existante
//   const [dialogUpload, setDialogUpload]     = useState(false)
//   const [uploadTarget, setUploadTarget]     = useState<Transaction | null>(null)
//   const [uploadType, setUploadType]         = useState<'bordereau' | 'recu_paiement'>('bordereau')
//   const [uploadFile, setUploadFile]         = useState<File | null>(null)
//   const [uploadLoading, setUploadLoading]   = useState(false)

//   // Dialog détail
//   const [dialogDetail, setDialogDetail] = useState(false)
//   const [detailTx, setDetailTx]         = useState<Transaction | null>(null)

//   // ── NOUVEAU : Dialog Export groupé ────────────────────────────
//   const [dialogExport, setDialogExport]   = useState(false)
//   const [ongletExport, setOngletExport]   = useState<OngletExport>('agence')
//   const [exportLoading, setExportLoading] = useState(false)
//   const [exportError, setExportError]     = useState('')

//   // Filtres onglet Agence
//   const [expAgence, setExpAgence]           = useState<Agence | null>(null)
//   const [expAgenceDebut, setExpAgenceDebut] = useState('')
//   const [expAgenceFin, setExpAgenceFin]     = useState('')

//   // Filtres onglet Client
//   const [expClient, setExpClient]               = useState<Client | null>(null)
//   const [expClientProduit, setExpClientProduit] = useState<Produit | null>(null) // null = tous
//   const [expClientDebut, setExpClientDebut]     = useState('')
//   const [expClientFin, setExpClientFin]         = useState('')

//   // Filtres onglet Produit
//   const [expProduit, setExpProduit]             = useState<Produit | null>(null)
//   const [expProduitAgence, setExpProduitAgence] = useState<Agence | null>(null) // null = toutes
//   const [expProduitDebut, setExpProduitDebut]   = useState('')
//   const [expProduitFin, setExpProduitFin]       = useState('')

//   // ── Chargement ──────────────────────────────────────────────
//   const charger = useCallback(async (q: string, p: number, dd: string, df: string) => {
//     setLoading(true)
//     setError('')
//     try {
//       const params: Record<string, string | number> = {
//         search: q, page: p + 1, page_size: 15,
//       }
//       if (dd) params.date_debut = dd
//       if (df) params.date_fin   = df

//       const { data } = await transactionAPI.liste(params)
//       setTransactions(data.results ?? data)
//       setTotal(data.count ?? (data.results ?? data).length)
//     } catch {
//       setError('Erreur lors du chargement.')
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     Promise.all([
//       clientAPI.liste(),
//       produitAPI.liste(),
//       agenceAPI.liste(),
//     ]).then(([c, p, a]) => {
//       setClients(c.data.results ?? c.data)
//       setProduits(p.data.results ?? p.data)
//       setAgences(a.data.results ?? a.data)
//     })
//   }, [])

//   useEffect(() => {
//     const t = setTimeout(() => { setPage(0); charger(search, 0, dateDebut, dateFin) }, 400)
//     return () => clearTimeout(t)
//   }, [search, dateDebut, dateFin])

//   useEffect(() => { charger(search, page, dateDebut, dateFin) }, [page])

//   // ── Regroupement Produit → Client → Transactions ─────────────
//   const produitGroups = useMemo<ProduitGroup[]>(() => {
//     const prodMap = new Map<number, { produit_nom: string; clientMap: Map<number, ClientGroup> }>()

//     transactions.forEach((tx) => {
//       if (!prodMap.has(tx.produit)) {
//         prodMap.set(tx.produit, { produit_nom: tx.produit_nom, clientMap: new Map() })
//       }
//       const p = prodMap.get(tx.produit)!
//       if (!p.clientMap.has(tx.client)) {
//         p.clientMap.set(tx.client, { client_id: tx.client, client_nom: tx.client_nom, transactions: [] })
//       }
//       p.clientMap.get(tx.client)!.transactions.push(tx)
//     })

//     const groups: ProduitGroup[] = Array.from(prodMap.entries()).map(([produit_id, p]) => {
//       const clients = Array.from(p.clientMap.values())
//       clients.forEach((c) =>
//         c.transactions.sort(
//           (a, b) => new Date(b.date_transaction).getTime() - new Date(a.date_transaction).getTime()
//         )
//       )
//       clients.sort(
//         (a, b) =>
//           new Date(b.transactions[0].date_transaction).getTime() -
//           new Date(a.transactions[0].date_transaction).getTime()
//       )
//       return { produit_id, produit_nom: p.produit_nom, clients }
//     })

//     groups.sort(
//       (a, b) =>
//         new Date(b.clients[0].transactions[0].date_transaction).getTime() -
//         new Date(a.clients[0].transactions[0].date_transaction).getTime()
//     )

//     return groups
//   }, [transactions])

//   // ── Créer transaction ────────────────────────────────────────
//   const handleCreer = async () => {
//     if (!formClient || !formProduit || !formAgence || !formDate) {
//       setError('Client, produit, agence et date sont obligatoires.')
//       return
//     }
//     setSubmitting(true)
//     try {
//       const { data: tx } = await transactionAPI.creer({
//         client:           formClient.id,
//         produit:          formProduit.id,
//         agence:           formAgence.id,
//         piece_utilisee:   formPiece || null,
//         date_transaction: formDate,
//       })

//       if (formBordereau) {
//         const fd = new FormData()
//         fd.append('type_doc', 'bordereau')
//         fd.append('fichier', formBordereau)
//         await transactionAPI.uploadDoc(tx.id, fd)
//       }
//       if (formRecu) {
//         const fd = new FormData()
//         fd.append('type_doc', 'recu_paiement')
//         fd.append('fichier', formRecu)
//         await transactionAPI.uploadDoc(tx.id, fd)
//       }

//       setDialogNouv(false)
//       resetForm()
//       charger(search, page, dateDebut, dateFin)
//     } catch(err: any) {
//     console.log("Erreur documents:", err.response?.data)
//       setError('Erreur lors de la création.')
//     } finally {
//       setSubmitting(false)
//     }
//   }
  
// const handleViewDoc = async (txId: number, docId: number) => {
//   try {
//     const response = await transactionAPI.afficherDoc(txId, docId);
//     const contentType = (response.headers['content-type'] as string) || 'application/pdf';
//     const file = new Blob([response.data], { type: contentType });
//     const fileURL = URL.createObjectURL(file);
//     window.open(fileURL, '_blank');
//     setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
//   } catch (error) {
//     console.error("Erreur lors de l'ouverture du document", error);
//   }
// };

//   const resetForm = () => {
//     setFormClient(null); setFormProduit(null); setFormAgence(null)
//     setFormPiece(''); setFormDate('')
//     setFormBordereau(null); setFormRecu(null)
//   }

//   // ── Upload doc sur transaction existante ─────────────────────
//   const handleUpload = async () => {
//     if (!uploadTarget || !uploadFile) return
//     setUploadLoading(true)
//     try {
//       const fd = new FormData()
//       fd.append('type_doc', uploadType)
//       fd.append('fichier', uploadFile)
//       await transactionAPI.uploadDoc(uploadTarget.id, fd)
//       setDialogUpload(false)
//       setUploadFile(null)
//       charger(search, page, dateDebut, dateFin)
//     } catch {
//       setError('Erreur lors de l\'upload.')
//     } finally {
//       setUploadLoading(false)
//     }
//   }

//   // ── ZIP individuel ───────────────────────────────────────────
//   const telechargerZip = async (tx: Transaction) => {
//     setDownloading((prev) => ({ ...prev, [tx.id]: true }))
//     try {
//       const { data } = await transactionAPI.telechargerZip(tx.id)
//       const url  = URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
//       const link = document.createElement('a')
//       link.href = url
//       link.download = `transaction_${tx.client_nom}_${tx.id}.zip`
//       link.click()
//       URL.revokeObjectURL(url)
//     } catch {
//       setError('Erreur lors du téléchargement.')
//     } finally {
//       setDownloading((prev) => ({ ...prev, [tx.id]: false }))
//     }
//   }

//   // ── NOUVEAU : Export groupé ───────────────────────────────────
//   const resetExportForm = () => {
//     setExpAgence(null); setExpAgenceDebut(''); setExpAgenceFin('')
//     setExpClient(null); setExpClientProduit(null); setExpClientDebut(''); setExpClientFin('')
//     setExpProduit(null); setExpProduitAgence(null); setExpProduitDebut(''); setExpProduitFin('')
//     setExportError('')
//   }

//   const fermerDialogExport = () => {
//     setDialogExport(false)
//     resetExportForm()
//   }

//   const handleExportGroupe = async () => {
//     setExportError('')

//     let params: {
//       date_debut: string
//       date_fin: string
//       agence_id?: number
//       client_id?: number
//       produit_id?: number
//     } = { date_debut: '', date_fin: '' }
//     let nomFichier = 'export.zip'

//     if (ongletExport === 'agence') {
//       if (!expAgence || !expAgenceDebut || !expAgenceFin) {
//         setExportError('Agence et intervalle de dates sont obligatoires.')
//         return
//       }
//       params = { agence_id: expAgence.id, date_debut: expAgenceDebut, date_fin: expAgenceFin }
//       nomFichier = `transactions_agence_${expAgence.nom}_${expAgenceDebut}_${expAgenceFin}.zip`
//     }

//     if (ongletExport === 'client') {
//       if (!expClient || !expClientDebut || !expClientFin) {
//         setExportError('Client et intervalle de dates sont obligatoires.')
//         return
//       }
//       params = { client_id: expClient.id, date_debut: expClientDebut, date_fin: expClientFin }
//       if (expClientProduit) params.produit_id = expClientProduit.id
//       nomFichier = `transactions_client_${expClient.nom}_${expClientDebut}_${expClientFin}.zip`
//     }

//     if (ongletExport === 'produit') {
//       if (!expProduit || !expProduitDebut || !expProduitFin) {
//         setExportError('Produit et intervalle de dates sont obligatoires.')
//         return
//       }
//       params = { produit_id: expProduit.id, date_debut: expProduitDebut, date_fin: expProduitFin }
//       if (expProduitAgence) params.agence_id = expProduitAgence.id
//       nomFichier = `transactions_produit_${expProduit.nom}_${expProduitDebut}_${expProduitFin}.zip`
//     }

//     setExportLoading(true)
//     try {
//       const { data } = await transactionAPI.exportZip(params)
//       const url  = URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
//       const link = document.createElement('a')
//       link.href     = url
//       link.download = nomFichier
//       link.click()
//       URL.revokeObjectURL(url)
//       fermerDialogExport()
//     } catch (err: any) {
//       if (err?.response?.status === 404) {
//         setExportError('Aucune transaction trouvée pour ces critères.')
//       } else {
//         setExportError("Erreur lors de la génération de l'export.")
//       }
//     } finally {
//       setExportLoading(false)
//     }
//   }

//   return (
//     <Box>
//       {/* ── Header ── */}
//       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 700 }}>Archivage des transactions</Typography>
//           <Typography variant="body2" color="text.secondary">
//             Enregistrez et gérez les transactions clients avec leurs documents
//           </Typography>
//         </Box>
//         <Box sx={{ display: 'flex', gap: 1.5 }}>
//           {/* ── NOUVEAU : bouton Export groupé ── */}
//           <Button
//             variant="outlined" startIcon={<FolderZipOutlined />}
//             onClick={() => setDialogExport(true)}
//           >
//             Export groupé
//           </Button>
//           <Button
//             variant="contained" startIcon={<AddOutlined />}
//             onClick={() => setDialogNouv(true)}
//             sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
//           >
//             Nouvelle transaction
//           </Button>
//         </Box>
//       </Box>

//       {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

//       {/* ── Filtres ── */}
//       <Card sx={{ mb: 3 }}>
//         <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', py: '12px !important' }}>
//           <TextField
//             placeholder="Rechercher par client..."
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
//           {(dateDebut || dateFin) && (
//             <Typography
//               variant="body2"
//               sx={{ color: '#0D47A1', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
//               onClick={() => { setDateDebut(''); setDateFin('') }}
//             >
//               Réinitialiser
//             </Typography>
//           )}
//         </CardContent>
//       </Card>

//       {/* ── Tableau : Produit → Clients → Transactions ── */}
//       <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ bgcolor: '#1e293b' }}>
//               <TableCell sx={{ width: 48 }} />
//               {['Produit', 'Clients', 'Transactions', 'Dernière date', 'Documents', 'Actions'].map((h) => (
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
//             ) : produitGroups.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
//                   Aucune transaction trouvée
//                 </TableCell>
//               </TableRow>
//             ) : produitGroups.map((pg) => {
//               const allTx         = pg.clients.flatMap((c) => c.transactions)
//               const totalClients  = pg.clients.length
//               const totalTx       = allTx.length
//               const completes     = allTx.filter((t) => t.documents_complets).length
//               const derniereTx    = pg.clients[0].transactions[0]
//               const isOpenP       = !!expandedProduits[pg.produit_id]

//               return (
//                 <Fragment key={pg.produit_id}>
//                   <TableRow hover sx={{ '& > *': { borderBottom: isOpenP ? 'unset' : undefined } }}>
//                     <TableCell sx={{ width: 48 }}>
//                       <IconButton size="small" onClick={() => toggleProduit(pg.produit_id)}>
//                         {isOpenP ? <KeyboardArrowDownOutlined /> : <KeyboardArrowRightOutlined />}
//                       </IconButton>
//                     </TableCell>

//                     <TableCell>
//                       <Chip label={pg.produit_nom} size="small" sx={{ fontWeight: 600 }} />
//                     </TableCell>

//                     <TableCell>
//                       <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                         {totalClients} client{totalClients > 1 ? 's' : ''}
//                       </Typography>
//                     </TableCell>

//                     <TableCell>
//                       <Chip
//                         label={`${totalTx} transaction${totalTx > 1 ? 's' : ''}`}
//                         size="small"
//                         sx={{ bgcolor: '#1e293b', color: 'white', fontWeight: 600 }}
//                       />
//                     </TableCell>

//                     <TableCell>
//                       <Typography variant="body2">
//                         {new Date(derniereTx.date_transaction).toLocaleDateString('fr-FR')}
//                       </Typography>
//                     </TableCell>

//                     <TableCell>
//                       <DocsChip completes={completes} total={totalTx} />
//                     </TableCell>

//                     <TableCell>
//                       <Button size="small" onClick={() => toggleProduit(pg.produit_id)} sx={{ textTransform: 'none' }}>
//                         {isOpenP ? 'Réduire' : 'Voir les clients'}
//                       </Button>
//                     </TableCell>
//                   </TableRow>

//                   <TableRow>
//                     <TableCell colSpan={7} sx={{ p: 0, borderBottom: isOpenP ? undefined : 'none' }}>
//                       <Collapse in={isOpenP} timeout="auto" unmountOnExit>
//                         <Box sx={{ m: 2, ml: 6 }}>
//                           <Table size="small">
//                             <TableHead>
//                               <TableRow sx={{ bgcolor: '#f1f5f9' }}>
//                                 <TableCell sx={{ width: 40 }} />
//                                 {['Client', 'Transactions', 'Dernière date', 'Documents', 'Actions'].map((h) => (
//                                   <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
//                                 ))}
//                               </TableRow>
//                             </TableHead>
//                             <TableBody>
//                               {pg.clients.map((cg) => {
//                                 const clientKey  = `${pg.produit_id}-${cg.client_id}`
//                                 const isOpenC    = !!expandedClients[clientKey]
//                                 const ctotal     = cg.transactions.length
//                                 const ccompletes = cg.transactions.filter((t) => t.documents_complets).length
//                                 const cderniere  = cg.transactions[0]

//                                 return (
//                                   <Fragment key={clientKey}>
//                                     <TableRow hover>
//                                       <TableCell sx={{ width: 40 }}>
//                                         <IconButton size="small" onClick={() => toggleClient(clientKey)}>
//                                           {isOpenC
//                                             ? <KeyboardArrowDownOutlined fontSize="small" />
//                                             : <KeyboardArrowRightOutlined fontSize="small" />}
//                                         </IconButton>
//                                       </TableCell>

//                                       <TableCell>
//                                         <Typography variant="body2" sx={{ fontWeight: 600 }}>{cg.client_nom}</Typography>
//                                       </TableCell>

//                                       <TableCell>
//                                         <Typography variant="body2">
//                                           {ctotal} transaction{ctotal > 1 ? 's' : ''}
//                                         </Typography>
//                                       </TableCell>

//                                       <TableCell>
//                                         <Typography variant="body2">
//                                           {new Date(cderniere.date_transaction).toLocaleDateString('fr-FR')}
//                                         </Typography>
//                                       </TableCell>

//                                       <TableCell>
//                                         <DocsChip completes={ccompletes} total={ctotal} />
//                                       </TableCell>

//                                       <TableCell>
//                                         <Button
//                                           size="small" onClick={() => toggleClient(clientKey)}
//                                           sx={{ textTransform: 'none', fontSize: 12 }}
//                                         >
//                                           {isOpenC ? 'Réduire' : 'Détails'}
//                                         </Button>
//                                       </TableCell>
//                                     </TableRow>

//                                     <TableRow>
//                                       <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
//                                         <Collapse in={isOpenC} timeout="auto" unmountOnExit>
//                                           <Box sx={{ m: 1.5, ml: 5 }}>
//                                             <Table size="small">
//                                               <TableHead>
//                                                 <TableRow sx={{ bgcolor: '#e2e8f0' }}>
//                                                   {['Agence', 'Pièce utilisée', 'Date', 'Documents', 'Actions'].map((h) => (
//                                                     <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
//                                                   ))}
//                                                 </TableRow>
//                                               </TableHead>
//                                               <TableBody>
//                                                 {cg.transactions.map((tx) => (
//                                                   <TableRow key={tx.id} hover>
//                                                     <TableCell>
//                                                       <Typography variant="body2" sx={{ fontWeight: 600 }}>{tx.agence_code}</Typography>
//                                                     </TableCell>

//                                                     <TableCell>
//                                                       {tx.piece_utilisee_detail ? (
//                                                         <Box>
//                                                           <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                                                             {tx.piece_utilisee_detail.type_piece_display}
//                                                           </Typography>
//                                                           <Typography variant="caption" color="text.secondary">
//                                                             {tx.piece_utilisee_detail.numero}
//                                                           </Typography>
//                                                         </Box>
//                                                       ) : (
//                                                         <Typography variant="caption" color="text.secondary">—</Typography>
//                                                       )}
//                                                     </TableCell>

//                                                     <TableCell>
//                                                       <Typography variant="body2">
//                                                         {new Date(tx.date_transaction).toLocaleDateString('fr-FR')}
//                                                       </Typography>
//                                                     </TableCell>

//                                                     <TableCell>
//                                                       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
//                                                         <DocsBadge complets={tx.documents_complets} />
//                                                         <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
//                                                           {tx.documents.map((doc) => (
//                                                             <Button
//                                                               key={doc.id} size="small" variant="text"
//                                                               startIcon={<VisibilityOutlined sx={{ fontSize: 13 }} />}
//                                                               onClick={() => handleViewDoc(tx.id, doc.id)}
//                                                               sx={{ fontSize: 11, px: 0.5 }}
//                                                             >
//                                                               {doc.type_doc_display}
//                                                             </Button>
//                                                           ))}
//                                                         </Box>
//                                                       </Box>
//                                                     </TableCell>

//                                                     <TableCell>
//                                                       <Box sx={{ display: 'flex', gap: 1 }}>
//                                                         <Tooltip title="Voir détail">
//                                                           <IconButton size="small" color="primary"
//                                                             onClick={() => { setDetailTx(tx); setDialogDetail(true) }}>
//                                                             <VisibilityOutlined fontSize="small" />
//                                                           </IconButton>
//                                                         </Tooltip>
//                                                         {!tx.documents_complets && (
//                                                           <Tooltip title="Uploader document manquant">
//                                                             <IconButton size="small" color="warning"
//                                                               onClick={() => { setUploadTarget(tx); setDialogUpload(true) }}>
//                                                               <UploadFileOutlined fontSize="small" />
//                                                             </IconButton>
//                                                           </Tooltip>
//                                                         )}
//                                                         <Tooltip title={tx.documents.length === 0 ? 'Aucun document' : 'Télécharger ZIP'}>
//                                                           <span>
//                                                             <IconButton
//                                                               size="small" color="default"
//                                                               onClick={() => telechargerZip(tx)}
//                                                               disabled={tx.documents.length === 0 || downloading[tx.id]}
//                                                             >
//                                                               {downloading[tx.id]
//                                                                 ? <CircularProgress size={16} />
//                                                                 : <FolderZipOutlined fontSize="small" />
//                                                               }
//                                                             </IconButton>
//                                                           </span>
//                                                         </Tooltip>
//                                                       </Box>
//                                                     </TableCell>
//                                                   </TableRow>
//                                                 ))}
//                                               </TableBody>
//                                             </Table>
//                                           </Box>
//                                         </Collapse>
//                                       </TableCell>
//                                     </TableRow>
//                                   </Fragment>
//                                 )
//                               })}
//                             </TableBody>
//                           </Table>
//                         </Box>
//                       </Collapse>
//                     </TableCell>
//                   </TableRow>
//                 </Fragment>
//               )
//             })}
//           </TableBody>
//         </Table>
//         <TablePagination
//           component="div"
//           count={total} page={page} rowsPerPage={15}
//           onPageChange={(_, p) => setPage(p)}
//           rowsPerPageOptions={[15]}
//           labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count} transactions`}
//         />
//       </TableContainer>

//       {/* ── Dialog Nouvelle transaction ── */}
//       <Dialog open={dialogNouv} onClose={() => { setDialogNouv(false); resetForm() }} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           Nouvelle transaction
//           <IconButton size="small" onClick={() => { setDialogNouv(false); resetForm() }}>
//             <CloseOutlined />
//           </IconButton>
//         </DialogTitle>
//         <DialogContent dividers>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>

//             <Autocomplete
//                 options={clients}
//                 getOptionLabel={(c) => `${c.prenom} ${c.nom}`}
//                 value={formClient}
//                 onChange={(_, v) => {
//                     setFormClient(v);
//                     setFormPiece('');
//                 }}
//                 renderInput={(params) => <TextField {...params} label="Client *" size="small" />}
//                 />

//             {formClient && formClient.pieces.length > 0 && (
//               <TextField
//                 select
//                 label="Pièce d'identité utilisée"
//                 size="small"
//                 value={formPiece}
//                 onChange={(e) => setFormPiece(Number(e.target.value))}
//                 disabled={!formClient}
//                 helperText={!formClient ? "Veuillez d'abord sélectionner un client" : ""}
//                 >
//                 <MenuItem value="">— Aucune —</MenuItem>
//                 {formClient?.pieces.map((p) => (
//                     <MenuItem key={p.id} value={p.id}>
//                     {p.type_piece_display} — {p.numero}
//                     </MenuItem>
//                 ))}
//                 </TextField>
//             )}

//             <Autocomplete
//               options={produits}
//               getOptionLabel={(p) => p.nom_display}
//               value={formProduit}
//               onChange={(_, v) => setFormProduit(v)}
//               renderInput={(params) => <TextField {...params} label="Produit *" size="small" />}
//             />

//             <Autocomplete
//               options={agences}
//               getOptionLabel={(a) => `${a.code} — ${a.nom}`}
//               value={formAgence}
//               onChange={(_, v) => setFormAgence(v)}
//               renderInput={(params) => <TextField {...params} label="Agence *" size="small" />}
//             />

//             <TextField
//               label="Date de transaction *" type="date" size="small"
//               value={formDate}
//               onChange={(e) => setFormDate(e.target.value)}
//               slotProps={{ inputLabel: { shrink: true } }}
//             />

//             <Divider />

//             <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
//               Documents (optionnels à la création)
//             </Typography>

//             <Box>
//               <Typography variant="caption" color="text.secondary">Bordereau</Typography>
//               <Button
//                 component="label" variant="outlined" size="small" fullWidth
//                 startIcon={<UploadFileOutlined />}
//                 sx={{ mt: 0.5, justifyContent: 'flex-start' }}
//               >
//                 {formBordereau ? formBordereau.name : 'Choisir un fichier'}
//                 <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
//                   onChange={(e) => setFormBordereau(e.target.files?.[0] ?? null)} />
//               </Button>
//             </Box>

//             <Box>
//               <Typography variant="caption" color="text.secondary">Reçu de paiement</Typography>
//               <Button
//                 component="label" variant="outlined" size="small" fullWidth
//                 startIcon={<UploadFileOutlined />}
//                 sx={{ mt: 0.5, justifyContent: 'flex-start' }}
//               >
//                 {formRecu ? formRecu.name : 'Choisir un fichier'}
//                 <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
//                   onChange={(e) => setFormRecu(e.target.files?.[0] ?? null)} />
//               </Button>
//             </Box>

//           </Box>
//         </DialogContent>
//         <DialogActions sx={{ p: 2, gap: 1 }}>
//           <Button variant="outlined" onClick={() => { setDialogNouv(false); resetForm() }}>
//             Annuler
//           </Button>
//           <Button
//             variant="contained" onClick={handleCreer} disabled={submitting}
//             startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddOutlined />}
//             sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
//           >
//             Enregistrer
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* ── Dialog Upload document manquant ── */}
//       <Dialog open={dialogUpload} onClose={() => { setDialogUpload(false); setUploadFile(null) }} maxWidth="xs" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700 }}>Uploader un document</DialogTitle>
//         <DialogContent dividers>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
//             <TextField
//               select label="Type de document" size="small"
//               value={uploadType}
//               onChange={(e) => setUploadType(e.target.value as 'bordereau' | 'recu_paiement')}
//             >
//               {uploadTarget && [
//                 { value: 'bordereau',     label: 'Bordereau' },
//                 { value: 'recu_paiement', label: 'Reçu de paiement' },
//               ]
//                 .filter((t) => !uploadTarget.documents.find((d) => d.type_doc === t.value))
//                 .map((t) => (
//                   <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
//                 ))
//               }
//             </TextField>

//             <Button
//               component="label" variant="outlined" size="small"
//               startIcon={<UploadFileOutlined />}
//               sx={{ justifyContent: 'flex-start' }}
//             >
//               {uploadFile ? uploadFile.name : 'Choisir un fichier'}
//               <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
//                 onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
//             </Button>
//           </Box>
//         </DialogContent>
//         <DialogActions sx={{ p: 2, gap: 1 }}>
//           <Button variant="outlined" onClick={() => { setDialogUpload(false); setUploadFile(null) }}>
//             Annuler
//           </Button>
//           <Button
//             variant="contained" onClick={handleUpload}
//             disabled={!uploadFile || uploadLoading}
//             startIcon={uploadLoading ? <CircularProgress size={16} color="inherit" /> : <UploadFileOutlined />}
//           >
//             Uploader
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* ── Dialog Détail ── */}
//       <Dialog open={dialogDetail} onClose={() => setDialogDetail(false)} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           Transaction #{detailTx?.id}
//           <IconButton size="small" onClick={() => setDialogDetail(false)}>
//             <CloseOutlined />
//           </IconButton>
//         </DialogTitle>
//         {detailTx && (
//           <DialogContent dividers>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
//               {[
//                 { label: 'Client',    value: detailTx.client_nom },
//                 { label: 'Produit',   value: detailTx.produit_nom },
//                 { label: 'Agence',    value: detailTx.agence_code },
//                 { label: 'Date',      value: new Date(detailTx.date_transaction).toLocaleDateString('fr-FR') },
//                 { label: 'Archivé par', value: detailTx.archive_par_nom },
//                 { label: 'Archivé le',  value: new Date(detailTx.archive_le).toLocaleString('fr-FR') },
//               ].map(({ label, value }) => (
//                 <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
//                   <Typography variant="body2" color="text.secondary">{label}</Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
//                 </Box>
//               ))}

//               {detailTx.piece_utilisee_detail && (
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
//                   <Typography variant="body2" color="text.secondary">Pièce utilisée</Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                     {detailTx.piece_utilisee_detail.type_piece_display} — {detailTx.piece_utilisee_detail.numero}
//                   </Typography>
//                 </Box>
//               )}

//               <Divider sx={{ my: 1 }} />

//               <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
//                 <Typography variant="body2" sx={{ fontWeight: 700 }}>Documents</Typography>
//                 <DocsBadge complets={detailTx.documents_complets} />
//               </Box>

//               {detailTx.documents.length === 0 ? (
//                 <Typography variant="body2" color="text.secondary">Aucun document uploadé</Typography>
//               ) : (
//                 detailTx.documents.map((doc) => (
//                   <Box key={doc.id} sx={{
//                     display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                     p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2,
//                   }}>
//                     <Box>
//                       <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.type_doc_display}</Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         {new Date(doc.uploaded_at).toLocaleString('fr-FR')}
//                       </Typography>
//                     </Box>
//                     <Button
//                       size="small" variant="outlined"
//                       startIcon={<VisibilityOutlined />}
//                       onClick={() => handleViewDoc(detailTx.id, doc.id)}
//                     >
//                       Voir
//                     </Button>
//                   </Box>
//                 ))
//               )}
//             </Box>
//           </DialogContent>
//         )}
//         <DialogActions sx={{ p: 2 }}>
//           <Button variant="outlined" onClick={() => setDialogDetail(false)}>Fermer</Button>
//         </DialogActions>
//       </Dialog>

//       {/* ── NOUVEAU : Dialog Export groupé ── */}
//       <Dialog open={dialogExport} onClose={fermerDialogExport} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           Export groupé de transactions
//           <IconButton size="small" onClick={fermerDialogExport}>
//             <CloseOutlined />
//           </IconButton>
//         </DialogTitle>

//         <Tabs
//           value={ongletExport}
//           onChange={(_, v) => { setOngletExport(v); setExportError('') }}
//           variant="fullWidth"
//           sx={{ borderBottom: 1, borderColor: 'divider' }}
//         >
//           <Tab label="Agence"  value="agence" />
//           <Tab label="Client"  value="client" />
//           <Tab label="Produit" value="produit" />
//         </Tabs>

//         <DialogContent dividers>
//           {exportError && <Alert severity="error" sx={{ mb: 2 }}>{exportError}</Alert>}

//           {ongletExport === 'agence' && (
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
//               <Typography variant="body2" color="text.secondary">
//                 Télécharger toutes les transactions d'une agence sur un intervalle de temps.
//               </Typography>
//               <Autocomplete
//                 options={agences}
//                 getOptionLabel={(a) => a.nom}
//                 value={expAgence}
//                 onChange={(_, v) => setExpAgence(v)}
//                 renderInput={(params) => <TextField {...params} label="Agence *" size="small" />}
//               />
//               <Box sx={{ display: 'flex', gap: 2 }}>
//                 <TextField
//                   label="Du *" type="date" size="small" fullWidth
//                   value={expAgenceDebut}
//                   onChange={(e) => setExpAgenceDebut(e.target.value)}
//                   slotProps={{ inputLabel: { shrink: true } }}
//                 />
//                 <TextField
//                   label="Au *" type="date" size="small" fullWidth
//                   value={expAgenceFin}
//                   onChange={(e) => setExpAgenceFin(e.target.value)}
//                   slotProps={{ inputLabel: { shrink: true } }}
//                 />
//               </Box>
//             </Box>
//           )}

//           {ongletExport === 'client' && (
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
//               <Typography variant="body2" color="text.secondary">
//                 Télécharger toutes les transactions d'un client, tous produits confondus ou pour un produit précis.
//               </Typography>
//               <Autocomplete
//                 options={clients}
//                 getOptionLabel={(c) => `${c.prenom} ${c.nom}`}
//                 value={expClient}
//                 onChange={(_, v) => setExpClient(v)}
//                 renderInput={(params) => <TextField {...params} label="Client *" size="small" />}
//               />
//               <Autocomplete
//                 options={produits}
//                 getOptionLabel={(p) => p.nom_display}
//                 value={expClientProduit}
//                 onChange={(_, v) => setExpClientProduit(v)}
//                 renderInput={(params) => <TextField {...params} label="Produit (optionnel — tous par défaut)" size="small" />}
//               />
//               <Box sx={{ display: 'flex', gap: 2 }}>
//                 <TextField
//                   label="Du *" type="date" size="small" fullWidth
//                   value={expClientDebut}
//                   onChange={(e) => setExpClientDebut(e.target.value)}
//                   slotProps={{ inputLabel: { shrink: true } }}
//                 />
//                 <TextField
//                   label="Au *" type="date" size="small" fullWidth
//                   value={expClientFin}
//                   onChange={(e) => setExpClientFin(e.target.value)}
//                   slotProps={{ inputLabel: { shrink: true } }}
//                 />
//               </Box>
//             </Box>
//           )}

//           {ongletExport === 'produit' && (
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
//               <Typography variant="body2" color="text.secondary">
//                 Télécharger toutes les transactions d'un produit, pour une agence précise ou toutes les agences.
//               </Typography>
//               <Autocomplete
//                 options={produits}
//                 getOptionLabel={(p) => p.nom_display}
//                 value={expProduit}
//                 onChange={(_, v) => setExpProduit(v)}
//                 renderInput={(params) => <TextField {...params} label="Produit *" size="small" />}
//               />
//               <Autocomplete
//                 options={agences}
//                 getOptionLabel={(a) => a.nom}
//                 value={expProduitAgence}
//                 onChange={(_, v) => setExpProduitAgence(v)}
//                 renderInput={(params) => <TextField {...params} label="Agence (optionnel — toutes par défaut)" size="small" />}
//               />
//               <Box sx={{ display: 'flex', gap: 2 }}>
//                 <TextField
//                   label="Du *" type="date" size="small" fullWidth
//                   value={expProduitDebut}
//                   onChange={(e) => setExpProduitDebut(e.target.value)}
//                   slotProps={{ inputLabel: { shrink: true } }}
//                 />
//                 <TextField
//                   label="Au *" type="date" size="small" fullWidth
//                   value={expProduitFin}
//                   onChange={(e) => setExpProduitFin(e.target.value)}
//                   slotProps={{ inputLabel: { shrink: true } }}
//                 />
//               </Box>
//             </Box>
//           )}
//         </DialogContent>

//         <DialogActions sx={{ p: 2, gap: 1 }}>
//           <Button variant="outlined" onClick={fermerDialogExport}>
//             Annuler
//           </Button>
//           <Button
//             variant="contained"
//             onClick={handleExportGroupe}
//             disabled={exportLoading}
//             startIcon={exportLoading ? <CircularProgress size={16} color="inherit" /> : <FolderZipOutlined />}
//             sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
//           >
//             Télécharger le ZIP
//           </Button>
//         </DialogActions>
//       </Dialog>

//     </Box>
//   )
// }

//--------------------------FIN DU 10/07/2026---------------------------------------------


'use client'
import { useEffect, useState, useCallback, useMemo, Fragment } from 'react'
import {
  Box, Typography, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, CircularProgress, Alert,
  TablePagination, Chip, Tooltip, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, Divider, IconButton, Collapse,
  Tabs, Tab, useMediaQuery
} from '@mui/material'
import {
  SearchOutlined, DownloadOutlined, FolderZipOutlined,
  AddOutlined, UploadFileOutlined, CheckCircleOutlined,
  WarningAmberOutlined, CloseOutlined, VisibilityOutlined,
  KeyboardArrowDownOutlined, KeyboardArrowRightOutlined
} from '@mui/icons-material'
import { transactionAPI, clientAPI, produitAPI, agenceAPI } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────
interface Document {
  id:               number
  type_doc:         string
  type_doc_display: string
  fichier:          string
  fichier_url:      string 
  uploaded_at:      string
}

interface Transaction {
  id:                   number
  client:               number
  client_nom:           string
  produit:              number
  produit_nom:          string
  agence:               number
  agence_code:          string
  piece_utilisee:       number | null
  piece_utilisee_detail: { type_piece_display: string; numero: string } | null
  date_transaction:     string
  archive_par_nom:      string
  archive_le:           string
  documents:            Document[]
  documents_complets:   boolean
}

interface Client {
  id:     number
  nom:    string
  prenom: string
  pieces: { id: number; type_piece: string; type_piece_display: string; numero: string }[]
}

interface Produit {
  id:          number
  nom:         string
  nom_display: string
}

interface Agence {
  id:   number
  nom:  string
  code: string
}

// ── Hiérarchie d'affichage : Produit → Client → Transactions ────
interface ClientGroup {
  client_id:    number
  client_nom:   string
  transactions: Transaction[]
}

interface ProduitGroup {
  produit_id:   number
  produit_nom:  string
  clients:      ClientGroup[]
}

type OngletExport = 'agence' | 'client' | 'produit'

// ── Composant badge documents ───────────────────────────────────
const DocsChip = ({ completes, total }: { completes: number; total: number }) => (
  <Chip
    size="small"
    icon={completes === total ? <CheckCircleOutlined sx={{ fontSize: 14 }} /> : <WarningAmberOutlined sx={{ fontSize: 14 }} />}
    label={`${completes}/${total} complets`}
    color={completes === total ? 'success' : 'warning'}
  />
)

const DocsBadge = ({ complets }: { complets: boolean }) => (
  <Chip
    size="small"
    icon={complets ? <CheckCircleOutlined sx={{ fontSize: 14 }} /> : <WarningAmberOutlined sx={{ fontSize: 14 }} />}
    label={complets ? 'Complets' : 'Incomplets'}
    color={complets ? 'success' : 'warning'}
  />
)

export default function ArchivageTransactionsPage() {
  // ── NOUVEAU : détection mobile pour basculer upload <-> capture photo ──
  const isMobile = useMediaQuery('(max-width:600px)')
  // Attributs à injecter dans les <input type="file">.
  // Sur mobile : accept restreint aux images + ouverture directe de l'appareil photo.
  // Sur PC     : accept large (pdf/jpg/png) + pas d'attribut capture (comportement inchangé).
  const fileInputProps = isMobile
    ? { accept: 'image/*', capture: 'environment' as const }
    : { accept: '.pdf,.jpg,.jpeg,.png' }

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(0)
  const [total, setTotal]               = useState(0)
  const [dateDebut, setDateDebut]       = useState('')
  const [dateFin, setDateFin]           = useState('')
  const [downloading, setDownloading]   = useState<Record<number, boolean>>({})

  // Déploiement : niveau Produit, puis niveau Client (clé = "produitId-clientId")
  const [expandedProduits, setExpandedProduits] = useState<Record<number, boolean>>({})
  const [expandedClients, setExpandedClients]   = useState<Record<string, boolean>>({})

  const toggleProduit = (id: number) =>
    setExpandedProduits((prev) => ({ ...prev, [id]: !prev[id] }))

  const toggleClient = (key: string) =>
    setExpandedClients((prev) => ({ ...prev, [key]: !prev[key] }))

  // Référentiels
  const [clients, setClients]   = useState<Client[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [agences, setAgences]   = useState<Agence[]>([])

  // Dialog nouvelle transaction
  const [dialogNouv, setDialogNouv]       = useState(false)
  const [submitting, setSubmitting]       = useState(false)
  const [formClient, setFormClient]       = useState<Client | null>(null)
  const [formProduit, setFormProduit]     = useState<Produit | null>(null)
  const [formAgence, setFormAgence]       = useState<Agence | null>(null)
  const [formPiece, setFormPiece]         = useState<number | ''>('')
  const [formDate, setFormDate]           = useState('')
  const [formBordereau, setFormBordereau] = useState<File | null>(null)
  const [formRecu, setFormRecu]           = useState<File | null>(null)

  // Dialog upload doc sur transaction existante
  const [dialogUpload, setDialogUpload]     = useState(false)
  const [uploadTarget, setUploadTarget]     = useState<Transaction | null>(null)
  const [uploadType, setUploadType]         = useState<'bordereau' | 'recu_paiement'>('bordereau')
  const [uploadFile, setUploadFile]         = useState<File | null>(null)
  const [uploadLoading, setUploadLoading]   = useState(false)

  // Dialog détail
  const [dialogDetail, setDialogDetail] = useState(false)
  const [detailTx, setDetailTx]         = useState<Transaction | null>(null)

  // ── Dialog Export groupé ────────────────────────────
  const [dialogExport, setDialogExport]   = useState(false)
  const [ongletExport, setOngletExport]   = useState<OngletExport>('agence')
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError]     = useState('')

  // Filtres onglet Agence
  const [expAgence, setExpAgence]           = useState<Agence | null>(null)
  const [expAgenceDebut, setExpAgenceDebut] = useState('')
  const [expAgenceFin, setExpAgenceFin]     = useState('')

  // Filtres onglet Client
  const [expClient, setExpClient]               = useState<Client | null>(null)
  const [expClientProduit, setExpClientProduit] = useState<Produit | null>(null) // null = tous
  const [expClientDebut, setExpClientDebut]     = useState('')
  const [expClientFin, setExpClientFin]         = useState('')

  // Filtres onglet Produit
  const [expProduit, setExpProduit]             = useState<Produit | null>(null)
  const [expProduitAgence, setExpProduitAgence] = useState<Agence | null>(null) // null = toutes
  const [expProduitDebut, setExpProduitDebut]   = useState('')
  const [expProduitFin, setExpProduitFin]       = useState('')

  // ── Chargement ──────────────────────────────────────────────
  const charger = useCallback(async (q: string, p: number, dd: string, df: string) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = {
        search: q, page: p + 1, page_size: 15,
      }
      if (dd) params.date_debut = dd
      if (df) params.date_fin   = df

      const { data } = await transactionAPI.liste(params)
      setTransactions(data.results ?? data)
      setTotal(data.count ?? (data.results ?? data).length)
    } catch {
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.all([
      clientAPI.liste(),
      produitAPI.liste(),
      agenceAPI.liste(),
    ]).then(([c, p, a]) => {
      setClients(c.data.results ?? c.data)
      setProduits(p.data.results ?? p.data)
      setAgences(a.data.results ?? a.data)
    })
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { setPage(0); charger(search, 0, dateDebut, dateFin) }, 400)
    return () => clearTimeout(t)
  }, [search, dateDebut, dateFin])

  useEffect(() => { charger(search, page, dateDebut, dateFin) }, [page])

  // ── Regroupement Produit → Client → Transactions ─────────────
  const produitGroups = useMemo<ProduitGroup[]>(() => {
    const prodMap = new Map<number, { produit_nom: string; clientMap: Map<number, ClientGroup> }>()

    transactions.forEach((tx) => {
      if (!prodMap.has(tx.produit)) {
        prodMap.set(tx.produit, { produit_nom: tx.produit_nom, clientMap: new Map() })
      }
      const p = prodMap.get(tx.produit)!
      if (!p.clientMap.has(tx.client)) {
        p.clientMap.set(tx.client, { client_id: tx.client, client_nom: tx.client_nom, transactions: [] })
      }
      p.clientMap.get(tx.client)!.transactions.push(tx)
    })

    const groups: ProduitGroup[] = Array.from(prodMap.entries()).map(([produit_id, p]) => {
      const clients = Array.from(p.clientMap.values())
      clients.forEach((c) =>
        c.transactions.sort(
          (a, b) => new Date(b.date_transaction).getTime() - new Date(a.date_transaction).getTime()
        )
      )
      clients.sort(
        (a, b) =>
          new Date(b.transactions[0].date_transaction).getTime() -
          new Date(a.transactions[0].date_transaction).getTime()
      )
      return { produit_id, produit_nom: p.produit_nom, clients }
    })

    groups.sort(
      (a, b) =>
        new Date(b.clients[0].transactions[0].date_transaction).getTime() -
        new Date(a.clients[0].transactions[0].date_transaction).getTime()
    )

    return groups
  }, [transactions])

  // ── Créer transaction ────────────────────────────────────────
  const handleCreer = async () => {
    if (!formClient || !formProduit || !formAgence || !formDate) {
      setError('Client, produit, agence et date sont obligatoires.')
      return
    }
    setSubmitting(true)
    try {
      const { data: tx } = await transactionAPI.creer({
        client:           formClient.id,
        produit:          formProduit.id,
        agence:           formAgence.id,
        piece_utilisee:   formPiece || null,
        date_transaction: formDate,
      })

      if (formBordereau) {
        const fd = new FormData()
        fd.append('type_doc', 'bordereau')
        fd.append('fichier', formBordereau)
        await transactionAPI.uploadDoc(tx.id, fd)
      }
      if (formRecu) {
        const fd = new FormData()
        fd.append('type_doc', 'recu_paiement')
        fd.append('fichier', formRecu)
        await transactionAPI.uploadDoc(tx.id, fd)
      }

      setDialogNouv(false)
      resetForm()
      charger(search, page, dateDebut, dateFin)
    } catch(err: any) {
    console.log("Erreur documents:", err.response?.data)
      setError('Erreur lors de la création.')
    } finally {
      setSubmitting(false)
    }
  }
  
const handleViewDoc = async (txId: number, docId: number) => {
  try {
    const response = await transactionAPI.afficherDoc(txId, docId);
    const contentType = (response.headers['content-type'] as string) || 'application/pdf';
    const file = new Blob([response.data], { type: contentType });
    const fileURL = URL.createObjectURL(file);
    window.open(fileURL, '_blank');
    setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
  } catch (error) {
    console.error("Erreur lors de l'ouverture du document", error);
  }
};

  const resetForm = () => {
    setFormClient(null); setFormProduit(null); setFormAgence(null)
    setFormPiece(''); setFormDate('')
    setFormBordereau(null); setFormRecu(null)
  }

  // ── Upload doc sur transaction existante ─────────────────────
  const handleUpload = async () => {
    if (!uploadTarget || !uploadFile) return
    setUploadLoading(true)
    try {
      const fd = new FormData()
      fd.append('type_doc', uploadType)
      fd.append('fichier', uploadFile)
      await transactionAPI.uploadDoc(uploadTarget.id, fd)
      setDialogUpload(false)
      setUploadFile(null)
      charger(search, page, dateDebut, dateFin)
    } catch {
      setError('Erreur lors de l\'upload.')
    } finally {
      setUploadLoading(false)
    }
  }

  // ── ZIP individuel ───────────────────────────────────────────
  const telechargerZip = async (tx: Transaction) => {
    setDownloading((prev) => ({ ...prev, [tx.id]: true }))
    try {
      const { data } = await transactionAPI.telechargerZip(tx.id)
      const url  = URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `transaction_${tx.client_nom}_${tx.id}.zip`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Erreur lors du téléchargement.')
    } finally {
      setDownloading((prev) => ({ ...prev, [tx.id]: false }))
    }
  }

  // ── Export groupé ───────────────────────────────────
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

  const handleExportGroupe = async () => {
    setExportError('')

    let params: {
      date_debut: string
      date_fin: string
      agence_id?: number
      client_id?: number
      produit_id?: number
    } = { date_debut: '', date_fin: '' }
    let nomFichier = 'export.zip'

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
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Archivage des transactions</Typography>
          <Typography variant="body2" color="text.secondary">
            Enregistrez et gérez les transactions clients avec leurs documents
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined" startIcon={<FolderZipOutlined />}
            onClick={() => setDialogExport(true)}
          >
            Export groupé
          </Button>
          <Button
            variant="contained" startIcon={<AddOutlined />}
            onClick={() => setDialogNouv(true)}
            sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
          >
            Nouvelle transaction
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* ── Filtres ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', py: '12px !important' }}>
          <TextField
            placeholder="Rechercher par client..."
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
          {(dateDebut || dateFin) && (
            <Typography
              variant="body2"
              sx={{ color: '#0D47A1', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => { setDateDebut(''); setDateFin('') }}
            >
              Réinitialiser
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* ── Tableau : Produit → Clients → Transactions ── */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1e293b' }}>
              <TableCell sx={{ width: 48 }} />
              {['Produit', 'Clients', 'Transactions', 'Dernière date', 'Documents', 'Actions'].map((h) => (
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
            ) : produitGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucune transaction trouvée
                </TableCell>
              </TableRow>
            ) : produitGroups.map((pg) => {
              const allTx         = pg.clients.flatMap((c) => c.transactions)
              const totalClients  = pg.clients.length
              const totalTx       = allTx.length
              const completes     = allTx.filter((t) => t.documents_complets).length
              const derniereTx    = pg.clients[0].transactions[0]
              const isOpenP       = !!expandedProduits[pg.produit_id]

              return (
                <Fragment key={pg.produit_id}>
                  <TableRow hover sx={{ '& > *': { borderBottom: isOpenP ? 'unset' : undefined } }}>
                    <TableCell sx={{ width: 48 }}>
                      <IconButton size="small" onClick={() => toggleProduit(pg.produit_id)}>
                        {isOpenP ? <KeyboardArrowDownOutlined /> : <KeyboardArrowRightOutlined />}
                      </IconButton>
                    </TableCell>

                    <TableCell>
                      <Chip label={pg.produit_nom} size="small" sx={{ fontWeight: 600 }} />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {totalClients} client{totalClients > 1 ? 's' : ''}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={`${totalTx} transaction${totalTx > 1 ? 's' : ''}`}
                        size="small"
                        sx={{ bgcolor: '#1e293b', color: 'white', fontWeight: 600 }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {new Date(derniereTx.date_transaction).toLocaleDateString('fr-FR')}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <DocsChip completes={completes} total={totalTx} />
                    </TableCell>

                    <TableCell>
                      <Button size="small" onClick={() => toggleProduit(pg.produit_id)} sx={{ textTransform: 'none' }}>
                        {isOpenP ? 'Réduire' : 'Voir les clients'}
                      </Button>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0, borderBottom: isOpenP ? undefined : 'none' }}>
                      <Collapse in={isOpenP} timeout="auto" unmountOnExit>
                        <Box sx={{ m: 2, ml: 6 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                <TableCell sx={{ width: 40 }} />
                                {['Client', 'Transactions', 'Dernière date', 'Documents', 'Actions'].map((h) => (
                                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {pg.clients.map((cg) => {
                                const clientKey  = `${pg.produit_id}-${cg.client_id}`
                                const isOpenC    = !!expandedClients[clientKey]
                                const ctotal     = cg.transactions.length
                                const ccompletes = cg.transactions.filter((t) => t.documents_complets).length
                                const cderniere  = cg.transactions[0]

                                return (
                                  <Fragment key={clientKey}>
                                    <TableRow hover>
                                      <TableCell sx={{ width: 40 }}>
                                        <IconButton size="small" onClick={() => toggleClient(clientKey)}>
                                          {isOpenC
                                            ? <KeyboardArrowDownOutlined fontSize="small" />
                                            : <KeyboardArrowRightOutlined fontSize="small" />}
                                        </IconButton>
                                      </TableCell>

                                      <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{cg.client_nom}</Typography>
                                      </TableCell>

                                      <TableCell>
                                        <Typography variant="body2">
                                          {ctotal} transaction{ctotal > 1 ? 's' : ''}
                                        </Typography>
                                      </TableCell>

                                      <TableCell>
                                        <Typography variant="body2">
                                          {new Date(cderniere.date_transaction).toLocaleDateString('fr-FR')}
                                        </Typography>
                                      </TableCell>

                                      <TableCell>
                                        <DocsChip completes={ccompletes} total={ctotal} />
                                      </TableCell>

                                      <TableCell>
                                        <Button
                                          size="small" onClick={() => toggleClient(clientKey)}
                                          sx={{ textTransform: 'none', fontSize: 12 }}
                                        >
                                          {isOpenC ? 'Réduire' : 'Détails'}
                                        </Button>
                                      </TableCell>
                                    </TableRow>

                                    <TableRow>
                                      <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                                        <Collapse in={isOpenC} timeout="auto" unmountOnExit>
                                          <Box sx={{ m: 1.5, ml: 5 }}>
                                            <Table size="small">
                                              <TableHead>
                                                <TableRow sx={{ bgcolor: '#e2e8f0' }}>
                                                  {['Agence', 'Pièce utilisée', 'Date', 'Documents', 'Actions'].map((h) => (
                                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                                                  ))}
                                                </TableRow>
                                              </TableHead>
                                              <TableBody>
                                                {cg.transactions.map((tx) => (
                                                  <TableRow key={tx.id} hover>
                                                    <TableCell>
                                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{tx.agence_code}</Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                      {tx.piece_utilisee_detail ? (
                                                        <Box>
                                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {tx.piece_utilisee_detail.type_piece_display}
                                                          </Typography>
                                                          <Typography variant="caption" color="text.secondary">
                                                            {tx.piece_utilisee_detail.numero}
                                                          </Typography>
                                                        </Box>
                                                      ) : (
                                                        <Typography variant="caption" color="text.secondary">—</Typography>
                                                      )}
                                                    </TableCell>

                                                    <TableCell>
                                                      <Typography variant="body2">
                                                        {new Date(tx.date_transaction).toLocaleDateString('fr-FR')}
                                                      </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                        <DocsBadge complets={tx.documents_complets} />
                                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                                          {tx.documents.map((doc) => (
                                                            <Button
                                                              key={doc.id} size="small" variant="text"
                                                              startIcon={<VisibilityOutlined sx={{ fontSize: 13 }} />}
                                                              onClick={() => handleViewDoc(tx.id, doc.id)}
                                                              sx={{ fontSize: 11, px: 0.5 }}
                                                            >
                                                              {doc.type_doc_display}
                                                            </Button>
                                                          ))}
                                                        </Box>
                                                      </Box>
                                                    </TableCell>

                                                    <TableCell>
                                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Tooltip title="Voir détail">
                                                          <IconButton size="small" color="primary"
                                                            onClick={() => { setDetailTx(tx); setDialogDetail(true) }}>
                                                            <VisibilityOutlined fontSize="small" />
                                                          </IconButton>
                                                        </Tooltip>
                                                        {!tx.documents_complets && (
                                                          <Tooltip title="Uploader document manquant">
                                                            <IconButton size="small" color="warning"
                                                              onClick={() => { setUploadTarget(tx); setDialogUpload(true) }}>
                                                              <UploadFileOutlined fontSize="small" />
                                                            </IconButton>
                                                          </Tooltip>
                                                        )}
                                                        <Tooltip title={tx.documents.length === 0 ? 'Aucun document' : 'Télécharger ZIP'}>
                                                          <span>
                                                            <IconButton
                                                              size="small" color="default"
                                                              onClick={() => telechargerZip(tx)}
                                                              disabled={tx.documents.length === 0 || downloading[tx.id]}
                                                            >
                                                              {downloading[tx.id]
                                                                ? <CircularProgress size={16} />
                                                                : <FolderZipOutlined fontSize="small" />
                                                              }
                                                            </IconButton>
                                                          </span>
                                                        </Tooltip>
                                                      </Box>
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </Box>
                                        </Collapse>
                                      </TableCell>
                                    </TableRow>
                                  </Fragment>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total} page={page} rowsPerPage={15}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPageOptions={[15]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count} transactions`}
        />
      </TableContainer>

      {/* ── Dialog Nouvelle transaction ── */}
      <Dialog open={dialogNouv} onClose={() => { setDialogNouv(false); resetForm() }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Nouvelle transaction
          <IconButton size="small" onClick={() => { setDialogNouv(false); resetForm() }}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>

            <Autocomplete
                options={clients}
                getOptionLabel={(c) => `${c.prenom} ${c.nom}`}
                value={formClient}
                onChange={(_, v) => {
                    setFormClient(v);
                    setFormPiece('');
                }}
                renderInput={(params) => <TextField {...params} label="Client *" size="small" />}
                />

            {formClient && formClient.pieces.length > 0 && (
              <TextField
                select
                label="Pièce d'identité utilisée"
                size="small"
                value={formPiece}
                onChange={(e) => setFormPiece(Number(e.target.value))}
                disabled={!formClient}
                helperText={!formClient ? "Veuillez d'abord sélectionner un client" : ""}
                >
                <MenuItem value="">— Aucune —</MenuItem>
                {formClient?.pieces.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                    {p.type_piece_display} — {p.numero}
                    </MenuItem>
                ))}
                </TextField>
            )}

            <Autocomplete
              options={produits}
              getOptionLabel={(p) => p.nom_display}
              value={formProduit}
              onChange={(_, v) => setFormProduit(v)}
              renderInput={(params) => <TextField {...params} label="Produit *" size="small" />}
            />

            <Autocomplete
              options={agences}
              getOptionLabel={(a) => `${a.code} — ${a.nom}`}
              value={formAgence}
              onChange={(_, v) => setFormAgence(v)}
              renderInput={(params) => <TextField {...params} label="Agence *" size="small" />}
            />

            <TextField
              label="Date de transaction *" type="date" size="small"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Divider />

            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Documents (optionnels à la création)
            </Typography>

            {/* ── Bordereau : upload classique sur PC, photo directe sur mobile ── */}
            <Box>
              <Typography variant="caption" color="text.secondary">Bordereau</Typography>
              <Button
                component="label" variant="outlined" size="small" fullWidth
                startIcon={<UploadFileOutlined />}
                sx={{ mt: 0.5, justifyContent: 'flex-start' }}
              >
                {formBordereau
                  ? formBordereau.name
                  : isMobile ? 'Prendre en photo' : 'Choisir un fichier'}
                <input
                  type="file"
                  hidden
                  {...fileInputProps}
                  onChange={(e) => setFormBordereau(e.target.files?.[0] ?? null)}
                />
              </Button>
            </Box>

            {/* ── Reçu de paiement : upload classique sur PC, photo directe sur mobile ── */}
            <Box>
              <Typography variant="caption" color="text.secondary">Reçu de paiement</Typography>
              <Button
                component="label" variant="outlined" size="small" fullWidth
                startIcon={<UploadFileOutlined />}
                sx={{ mt: 0.5, justifyContent: 'flex-start' }}
              >
                {formRecu
                  ? formRecu.name
                  : isMobile ? 'Prendre en photo' : 'Choisir un fichier'}
                <input
                  type="file"
                  hidden
                  {...fileInputProps}
                  onChange={(e) => setFormRecu(e.target.files?.[0] ?? null)}
                />
              </Button>
            </Box>

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => { setDialogNouv(false); resetForm() }}>
            Annuler
          </Button>
          <Button
            variant="contained" onClick={handleCreer} disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddOutlined />}
            sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog Upload document manquant ── */}
      <Dialog open={dialogUpload} onClose={() => { setDialogUpload(false); setUploadFile(null) }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Uploader un document</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              select label="Type de document" size="small"
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value as 'bordereau' | 'recu_paiement')}
            >
              {uploadTarget && [
                { value: 'bordereau',     label: 'Bordereau' },
                { value: 'recu_paiement', label: 'Reçu de paiement' },
              ]
                .filter((t) => !uploadTarget.documents.find((d) => d.type_doc === t.value))
                .map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))
              }
            </TextField>

            {/* ── Upload document manquant : upload classique sur PC, photo directe sur mobile ── */}
            <Button
              component="label" variant="outlined" size="small"
              startIcon={<UploadFileOutlined />}
              sx={{ justifyContent: 'flex-start' }}
            >
              {uploadFile
                ? uploadFile.name
                : isMobile ? 'Prendre en photo' : 'Choisir un fichier'}
              <input
                type="file"
                hidden
                {...fileInputProps}
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => { setDialogUpload(false); setUploadFile(null) }}>
            Annuler
          </Button>
          <Button
            variant="contained" onClick={handleUpload}
            disabled={!uploadFile || uploadLoading}
            startIcon={uploadLoading ? <CircularProgress size={16} color="inherit" /> : <UploadFileOutlined />}
          >
            Uploader
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog Détail ── */}
      <Dialog open={dialogDetail} onClose={() => setDialogDetail(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Transaction #{detailTx?.id}
          <IconButton size="small" onClick={() => setDialogDetail(false)}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        {detailTx && (
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { label: 'Client',    value: detailTx.client_nom },
                { label: 'Produit',   value: detailTx.produit_nom },
                { label: 'Agence',    value: detailTx.agence_code },
                { label: 'Date',      value: new Date(detailTx.date_transaction).toLocaleDateString('fr-FR') },
                { label: 'Archivé par', value: detailTx.archive_par_nom },
                { label: 'Archivé le',  value: new Date(detailTx.archive_le).toLocaleString('fr-FR') },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
                </Box>
              ))}

              {detailTx.piece_utilisee_detail && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Pièce utilisée</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {detailTx.piece_utilisee_detail.type_piece_display} — {detailTx.piece_utilisee_detail.numero}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Documents</Typography>
                <DocsBadge complets={detailTx.documents_complets} />
              </Box>

              {detailTx.documents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Aucun document uploadé</Typography>
              ) : (
                detailTx.documents.map((doc) => (
                  <Box key={doc.id} sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2,
                  }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.type_doc_display}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(doc.uploaded_at).toLocaleString('fr-FR')}
                      </Typography>
                    </Box>
                    <Button
                      size="small" variant="outlined"
                      startIcon={<VisibilityOutlined />}
                      onClick={() => handleViewDoc(detailTx.id, doc.id)}
                    >
                      Voir
                    </Button>
                  </Box>
                ))
              )}
            </Box>
          </DialogContent>
        )}
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setDialogDetail(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog Export groupé ── */}
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