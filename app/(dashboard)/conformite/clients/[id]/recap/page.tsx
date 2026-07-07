// 'use client'
// import { useEffect, useState, useCallback } from 'react'
// import { useRouter, useParams } from 'next/navigation'
// import {
//   Box, Typography, Card, CardContent, Button,
//   Grid, TextField, CircularProgress, Alert,
//   Table, TableBody, TableCell, TableContainer,
//   TableHead, TableRow, Paper, Chip, Divider,
//   LinearProgress
// } from '@mui/material'
// import {
//   ArrowBackOutlined, SummarizeOutlined,
//   ReceiptLongOutlined, CalendarMonthOutlined,
//   InventoryOutlined
// } from '@mui/icons-material'
// import { clientAPI, transactionAPI } from '@/lib/api'

// interface RecapProduit {
//   produit__nom: string
//   total: number
// }

// interface RecapMois {
//   mois: string // format ISO, ex: "2026-06-01"
//   total: number
// }

// interface TransactionLigne {
//   id: number
//   produit_nom: string
//   agence_code: string
//   date_transaction: string
//   documents_complets: boolean
// }

// interface RecapData {
//   client_id: number
//   total_transactions: number
//   par_produit: RecapProduit[]
//   par_mois: RecapMois[]
//   transactions: TransactionLigne[]
// }

// interface Client {
//   id: number
//   nom: string
//   prenom: string
// }

// export default function RecapClientPage() {
//   const router   = useRouter()
//   const params   = useParams()
//   const clientId = Number(params.id)

//   const [client, setClient] = useState<Client | null>(null)
//   const [recap, setRecap]   = useState<RecapData | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError]     = useState('')

//   const [dateDebut, setDateDebut] = useState('')
//   const [dateFin, setDateFin]     = useState('')

//   const charger = useCallback(async (dd: string, df: string) => {
//     setLoading(true)
//     setError('')
//     try {
//       const params: { client_id: number; date_debut?: string; date_fin?: string } = { client_id: clientId }
//       if (dd) params.date_debut = dd
//       if (df) params.date_fin   = df

//       const { data } = await transactionAPI.recapClient(params)
//       setRecap(data)
//     } catch (err) {
//       console.error(err)
//       setError('Erreur lors du chargement du récapitulatif.')
//     } finally {
//       setLoading(false)
//     }
//   }, [clientId])

//   useEffect(() => {
//     if (!clientId) return
//     clientAPI.detail(clientId)
//       .then(({ data }) => setClient(data))
//       .catch(() => setError('Impossible de charger les informations du client.'))
//   }, [clientId])

//   useEffect(() => {
//     const t = setTimeout(() => charger(dateDebut, dateFin), 300)
//     return () => clearTimeout(t)
//   }, [dateDebut, dateFin, charger])

//   const formatMois = (isoDate: string) => {
//     const d = new Date(isoDate)
//     return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
//   }

//   const maxMoisTotal = recap ? Math.max(...recap.par_mois.map((m) => m.total), 1) : 1
//   const maxProduitTotal = recap ? Math.max(...recap.par_produit.map((p) => p.total), 1) : 1

//   return (
//     <Box sx={{ p: 1 }}>
//       {/* En-tête */}
//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
//         <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small" onClick={() => router.back()}>
//           Retour
//         </Button>
//         <Box>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             <SummarizeOutlined sx={{ color: '#0D47A1' }} />
//             <Typography variant="h5" sx={{ fontWeight: 700 }}>
//               Récapitulatif des transactions
//             </Typography>
//           </Box>
//           <Typography variant="body2" color="text.secondary">
//             {client ? `${client.prenom} ${client.nom}` : 'Chargement du client...'}
//           </Typography>
//         </Box>
//       </Box>

//       {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

//       {/* Filtres de dates */}
//       <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
//         <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', py: '12px !important' }}>
//           <TextField
//             label="Du" type="date" size="small"
//             value={dateDebut}
//             onChange={(e) => setDateDebut(e.target.value)}
//             slotProps={{ inputLabel: { shrink: true } }}
//             sx={{ width: 170 }}
//           />
//           <TextField
//             label="Au" type="date" size="small"
//             value={dateFin}
//             onChange={(e) => setDateFin(e.target.value)}
//             slotProps={{ inputLabel: { shrink: true } }}
//             sx={{ width: 170 }}
//           />
//           {(dateDebut || dateFin) && (
//             <Typography
//               variant="body2"
//               sx={{ color: '#0D47A1', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
//               onClick={() => { setDateDebut(''); setDateFin('') }}
//             >
//               Réinitialiser (voir tout l'historique)
//             </Typography>
//           )}
//           {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
//         </CardContent>
//       </Card>

//       {!recap ? (
//         <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
//           <CircularProgress />
//         </Box>
//       ) : (
//         <>
//           {/* Total global */}
//           <Card sx={{ mb: 3, bgcolor: '#0f172a', color: 'white' }}>
//             <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
//               <ReceiptLongOutlined sx={{ fontSize: 40 }} />
//               <Box>
//                 <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1 }}>
//                   {recap.total_transactions}
//                 </Typography>
//                 <Typography variant="body2" sx={{ opacity: 0.8 }}>
//                   transaction{recap.total_transactions > 1 ? 's' : ''} sur la période sélectionnée
//                   {recap.par_produit.length > 0 && ` — ${recap.par_produit.length} produit${recap.par_produit.length > 1 ? 's' : ''} différent${recap.par_produit.length > 1 ? 's' : ''}`}
//                 </Typography>
//               </Box>
//             </CardContent>
//           </Card>

//           <Grid container spacing={3}>
//             {/* Répartition par produit */}
//             <Grid size={{ xs: 12, md: 6 }}>
//               <Card sx={{ height: '100%' }}>
//                 <CardContent>
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
//                     <InventoryOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
//                     <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
//                       Répartition par produit
//                     </Typography>
//                   </Box>
//                   {recap.par_produit.length === 0 ? (
//                     <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>
//                   ) : (
//                     recap.par_produit.map((p) => (
//                       <Box key={p.produit__nom} sx={{ mb: 1.5 }}>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//                           <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.produit__nom}</Typography>
//                           <Chip label={p.total} size="small" sx={{ fontWeight: 700 }} />
//                         </Box>
//                         <LinearProgress
//                           variant="determinate"
//                           value={(p.total / maxProduitTotal) * 100}
//                           sx={{ height: 8, borderRadius: 4 }}
//                         />
//                       </Box>
//                     ))
//                   )}
//                 </CardContent>
//               </Card>
//             </Grid>

//             {/* Répartition par mois */}
//             <Grid size={{ xs: 12, md: 6 }}>
//               <Card sx={{ height: '100%' }}>
//                 <CardContent>
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
//                     <CalendarMonthOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
//                     <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
//                       Volume par mois
//                     </Typography>
//                   </Box>
//                   {recap.par_mois.length === 0 ? (
//                     <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>
//                   ) : (
//                     recap.par_mois.map((m) => (
//                       <Box key={m.mois} sx={{ mb: 1.5 }}>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//                           <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
//                             {formatMois(m.mois)}
//                           </Typography>
//                           <Chip label={m.total} size="small" color="primary" sx={{ fontWeight: 700 }} />
//                         </Box>
//                         <LinearProgress
//                           variant="determinate"
//                           value={(m.total / maxMoisTotal) * 100}
//                           sx={{ height: 8, borderRadius: 4 }}
//                           color="primary"
//                         />
//                       </Box>
//                     ))
//                   )}
//                 </CardContent>
//               </Card>
//             </Grid>
//           </Grid>

//           <Divider sx={{ my: 3 }} />

//           {/* Détail de toutes les transactions */}
//           <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
//             Détail des transactions ({recap.transactions.length})
//           </Typography>

//           <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
//             <Table>
//               <TableHead>
//                 <TableRow sx={{ bgcolor: '#0f172a' }}>
//                   {['Produit', 'Agence', 'Date', 'Documents'].map((h) => (
//                     <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
//                   ))}
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {recap.transactions.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
//                       Aucune transaction sur cette période
//                     </TableCell>
//                   </TableRow>
//                 ) : recap.transactions.map((tx) => (
//                   <TableRow key={tx.id} hover>
//                     <TableCell>
//                       <Chip label={tx.produit_nom} size="small" variant="outlined" />
//                     </TableCell>
//                     <TableCell>{tx.agence_code}</TableCell>
//                     <TableCell>{new Date(tx.date_transaction).toLocaleDateString('fr-FR')}</TableCell>
//                     <TableCell>
//                       <Chip
//                         label={tx.documents_complets ? 'Complets' : 'Incomplets'}
//                         size="small"
//                         color={tx.documents_complets ? 'success' : 'warning'}
//                       />
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         </>
//       )}
//     </Box>
//   )
// }


'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Grid, TextField, MenuItem, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Divider,
  LinearProgress, Tooltip, IconButton
} from '@mui/material'
import {
  ArrowBackOutlined, SummarizeOutlined,
  ReceiptLongOutlined, CalendarMonthOutlined,
  InventoryOutlined, VisibilityOutlined,
  DownloadOutlined, FolderZipOutlined
} from '@mui/icons-material'
import { clientAPI, transactionAPI, produitAPI } from '@/lib/api'

interface RecapProduit {
  produit__nom: string
  total: number
}

interface RecapMois {
  mois: string // format ISO, ex: "2026-06-01"
  total: number
}

interface DocumentLigne {
  id: number
  type_doc: string
  type_doc_display: string
}

interface TransactionLigne {
  id: number
  produit_nom: string
  agence_code: string
  date_transaction: string
  documents_complets: boolean
  documents: DocumentLigne[]
}

interface RecapData {
  client_id: number
  total_transactions: number
  par_produit: RecapProduit[]
  par_mois: RecapMois[]
  transactions: TransactionLigne[]
}

interface Client {
  id: number
  nom: string
  prenom: string
}

interface Produit {
  id: number
  nom: string
  nom_display: string
}

export default function RecapClientPage() {
  const router   = useRouter()
  const params   = useParams()
  const clientId = Number(params.id)

  const [client, setClient] = useState<Client | null>(null)
  const [recap, setRecap]   = useState<RecapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const [dateDebut, setDateDebut]   = useState('')
  const [dateFin, setDateFin]       = useState('')
  const [produitId, setProduitId]   = useState('')
  const [produits, setProduits]     = useState<Produit[]>([])

  const [downloading, setDownloading] = useState<Record<number, boolean>>({})
  const [viewingDoc, setViewingDoc]   = useState<Record<number, boolean>>({})

  const charger = useCallback(async (dd: string, df: string, pid: string) => {
    setLoading(true)
    setError('')
    try {
      const params: {
        client_id: number
        date_debut?: string
        date_fin?: string
        produit_id?: number
      } = { client_id: clientId }
      if (dd)  params.date_debut = dd
      if (df)  params.date_fin   = df
      if (pid) params.produit_id = Number(pid)

      const { data } = await transactionAPI.recapClient(params)
      setRecap(data)
    } catch (err) {
      console.error(err)
      setError('Erreur lors du chargement du récapitulatif.')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (!clientId) return
    clientAPI.detail(clientId)
      .then(({ data }) => setClient(data))
      .catch(() => setError('Impossible de charger les informations du client.'))
  }, [clientId])

  useEffect(() => {
    produitAPI.liste()
      .then(({ data }) => setProduits(data.results ?? data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => charger(dateDebut, dateFin, produitId), 300)
    return () => clearTimeout(t)
  }, [dateDebut, dateFin, produitId, charger])

  const formatMois = (isoDate: string) => {
    const d = new Date(isoDate)
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  const maxMoisTotal = recap ? Math.max(...recap.par_mois.map((m) => m.total), 1) : 1
  const maxProduitTotal = recap ? Math.max(...recap.par_produit.map((p) => p.total), 1) : 1

  // ── Voir un document (ouvre dans un nouvel onglet) ────────────
  const handleViewDoc = async (txId: number, docId: number) => {
    setViewingDoc((prev) => ({ ...prev, [docId]: true }))
    try {
      const response = await transactionAPI.afficherDoc(txId, docId)
      const contentType = (response.headers['content-type'] as string) || 'application/pdf'
      const file = new Blob([response.data], { type: contentType })
      const fileURL = URL.createObjectURL(file)
      window.open(fileURL, '_blank')
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000)
    } catch (err) {
      console.error("Erreur lors de l'ouverture du document", err)
      setError("Impossible d'ouvrir ce document.")
    } finally {
      setViewingDoc((prev) => ({ ...prev, [docId]: false }))
    }
  }

  // ── Télécharger le ZIP complet d'une transaction ──────────────
  const telechargerZip = async (txId: number) => {
    setDownloading((prev) => ({ ...prev, [txId]: true }))
    try {
      const { data } = await transactionAPI.telechargerZip(txId)
      const url  = URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `transaction_${txId}.zip`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Erreur lors du téléchargement.')
    } finally {
      setDownloading((prev) => ({ ...prev, [txId]: false }))
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small" onClick={() => router.back()}>
          Retour
        </Button>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SummarizeOutlined sx={{ color: '#0D47A1' }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Récapitulatif des transactions
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {client ? `${client.prenom} ${client.nom}` : 'Chargement du client...'}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filtres */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', py: '12px !important' }}>
          <TextField
            label="Du" type="date" size="small"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 170 }}
          />
          <TextField
            label="Au" type="date" size="small"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 170 }}
          />
          <TextField
            select label="Produit" size="small"
            value={produitId}
            onChange={(e) => setProduitId(e.target.value)}
            sx={{ width: 200 }}
          >
            <MenuItem value="">Tous les produits</MenuItem>
            {produits.map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>{p.nom_display}</MenuItem>
            ))}
          </TextField>
          {(dateDebut || dateFin || produitId) && (
            <Typography
              variant="body2"
              sx={{ color: '#0D47A1', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => { setDateDebut(''); setDateFin(''); setProduitId('') }}
            >
              Réinitialiser
            </Typography>
          )}
          {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
        </CardContent>
      </Card>

      {!recap ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Total global */}
          <Card sx={{ mb: 3, bgcolor: '#0f172a', color: 'white' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
              <ReceiptLongOutlined sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {recap.total_transactions}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  transaction{recap.total_transactions > 1 ? 's' : ''} sur la sélection actuelle
                  {recap.par_produit.length > 0 && ` — ${recap.par_produit.length} produit${recap.par_produit.length > 1 ? 's' : ''} différent${recap.par_produit.length > 1 ? 's' : ''}`}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {/* Répartition par produit */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <InventoryOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Répartition par produit
                    </Typography>
                  </Box>
                  {recap.par_produit.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>
                  ) : (
                    recap.par_produit.map((p) => (
                      <Box key={p.produit__nom} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.produit__nom}</Typography>
                          <Chip label={p.total} size="small" sx={{ fontWeight: 700 }} />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(p.total / maxProduitTotal) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Répartition par mois */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CalendarMonthOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Volume par mois
                    </Typography>
                  </Box>
                  {recap.par_mois.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>
                  ) : (
                    recap.par_mois.map((m) => (
                      <Box key={m.mois} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                            {formatMois(m.mois)}
                          </Typography>
                          <Chip label={m.total} size="small" color="primary" sx={{ fontWeight: 700 }} />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(m.total / maxMoisTotal) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                          color="primary"
                        />
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Détail de toutes les transactions */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Détail des transactions ({recap.transactions.length})
          </Typography>

          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#0f172a' }}>
                  {['Produit', 'Agence', 'Date', 'Documents', 'Actions'].map((h) => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {recap.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      Aucune transaction sur cette sélection
                    </TableCell>
                  </TableRow>
                ) : recap.transactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>
                      <Chip label={tx.produit_nom} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{tx.agence_code}</TableCell>
                    <TableCell>{new Date(tx.date_transaction).toLocaleDateString('fr-FR')}</TableCell>

                    {/* Liste des documents visualisables */}
                    <TableCell>
                      {tx.documents.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">
                          Aucun document
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {tx.documents.map((doc) => (
                            <Button
                              key={doc.id}
                              size="small" variant="text"
                              startIcon={
                                viewingDoc[doc.id]
                                  ? <CircularProgress size={13} />
                                  : <VisibilityOutlined sx={{ fontSize: 13 }} />
                              }
                              onClick={() => handleViewDoc(tx.id, doc.id)}
                              disabled={viewingDoc[doc.id]}
                              sx={{ fontSize: 11, px: 0.5, justifyContent: 'flex-start' }}
                            >
                              {doc.type_doc_display}
                            </Button>
                          ))}
                        </Box>
                      )}
                    </TableCell>

                    {/* Actions : statut + téléchargement groupé */}
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Chip
                          label={tx.documents_complets ? 'Complets' : 'Incomplets'}
                          size="small"
                          color={tx.documents_complets ? 'success' : 'warning'}
                        />
                        <Tooltip title={tx.documents.length === 0 ? 'Aucun document' : 'Télécharger tout en ZIP'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => telechargerZip(tx.id)}
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
          </TableContainer>
        </>
      )}
    </Box>
  )
}