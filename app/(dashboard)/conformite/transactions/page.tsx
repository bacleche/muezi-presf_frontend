'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, CircularProgress, Alert,
  TablePagination, Chip, Tooltip, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, Divider, IconButton
} from '@mui/material'
import {
  SearchOutlined, DownloadOutlined, FolderZipOutlined,
  AddOutlined, UploadFileOutlined, CheckCircleOutlined,
  WarningAmberOutlined, CloseOutlined, VisibilityOutlined
} from '@mui/icons-material'
import { transactionAPI, clientAPI, produitAPI, agenceAPI } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────
interface Document {
  id:               number
  type_doc:         string
  type_doc_display: string
  fichier:          string
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

// ── Composant badge documents ───────────────────────────────────
const DocsBadge = ({ complets }: { complets: boolean }) => (
  <Chip
    size="small"
    icon={complets ? <CheckCircleOutlined sx={{ fontSize: 14 }} /> : <WarningAmberOutlined sx={{ fontSize: 14 }} />}
    label={complets ? 'Complets' : 'Incomplets'}
    color={complets ? 'success' : 'warning'}
  />
)

export default function ArchivageTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(0)
  const [total, setTotal]               = useState(0)
  const [dateDebut, setDateDebut]       = useState('')
  const [dateFin, setDateFin]           = useState('')
  const [downloading, setDownloading]   = useState<Record<number, boolean>>({})

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

      // Upload bordereau
      if (formBordereau) {
        const fd = new FormData()
        fd.append('type_doc', 'bordereau')
        fd.append('fichier', formBordereau)
        await transactionAPI.uploadDoc(tx.id, fd)
      }
      // Upload reçu
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

  // ── ZIP ──────────────────────────────────────────────────────
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
        <Button
          variant="contained" startIcon={<AddOutlined />}
          onClick={() => setDialogNouv(true)}
          sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' } }}
        >
          Nouvelle transaction
        </Button>
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

      {/* ── Tableau ── */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1e293b' }}>
              {['Client', 'Produit', 'Agence', 'Pièce utilisée', 'Date', 'Documents', 'Actions'].map((h) => (
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
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucune transaction trouvée
                </TableCell>
              </TableRow>
            ) : transactions.map((tx) => (
              <TableRow key={tx.id} hover>

                <TableCell>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{tx.client_nom}</Typography>
                  <Typography variant="caption" color="text.secondary">#{tx.id}</Typography>
                </TableCell>

                <TableCell>
                  <Chip label={tx.produit_nom} size="small" variant="outlined" />
                </TableCell>

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
                          startIcon={<DownloadOutlined sx={{ fontSize: 13 }} />}
                          href={doc.fichier} target="_blank" rel="noopener noreferrer"
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
        <TablePagination
          component="div"
          count={total} page={page} rowsPerPage={15}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPageOptions={[15]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
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
                    setFormPiece(''); // Reset la pièce si on change de client
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
                disabled={!formClient} // Grisé si aucun client n'est sélectionné
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

            <Box>
              <Typography variant="caption" color="text.secondary">Bordereau</Typography>
              <Button
                component="label" variant="outlined" size="small" fullWidth
                startIcon={<UploadFileOutlined />}
                sx={{ mt: 0.5, justifyContent: 'flex-start' }}
              >
                {formBordereau ? formBordereau.name : 'Choisir un fichier'}
                <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFormBordereau(e.target.files?.[0] ?? null)} />
              </Button>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">Reçu de paiement</Typography>
              <Button
                component="label" variant="outlined" size="small" fullWidth
                startIcon={<UploadFileOutlined />}
                sx={{ mt: 0.5, justifyContent: 'flex-start' }}
              >
                {formRecu ? formRecu.name : 'Choisir un fichier'}
                <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFormRecu(e.target.files?.[0] ?? null)} />
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

            <Button
              component="label" variant="outlined" size="small"
              startIcon={<UploadFileOutlined />}
              sx={{ justifyContent: 'flex-start' }}
            >
              {uploadFile ? uploadFile.name : 'Choisir un fichier'}
              <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
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
                      startIcon={<DownloadOutlined />}
                      href={doc.fichier} target="_blank" rel="noopener noreferrer"
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

    </Box>
  )
}