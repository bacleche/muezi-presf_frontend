'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Button, CircularProgress,
  Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip,
  Alert, LinearProgress, Divider, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  DownloadOutlined, RefreshOutlined,
  AccountBalanceOutlined, FolderOffOutlined,
  InventoryOutlined, PeopleOutlined,
  ReceiptLongOutlined, StorefrontOutlined,
  CheckCircleOutlined, WarningAmberOutlined,
  VisibilityOutlined, CloseOutlined,
  FolderZipOutlined,
} from '@mui/icons-material'
import { archiveAgenceAPI, transactionAPI, agenceAPI, produitAPI, clientAPI } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────

interface Archive {
  id: number
  agence_nom: string
  produit_nom: string
  date: string
  documents_complets: boolean
  documents: { id: number }[]
  types_requis: { value: string; label: string }[]
}

interface Client {
  id: number
}

// ── Modal Export ZIP (générique) ───────────────────────────────

function ExportZipModal({
  open,
  onClose,
  titre,
  nomFichierPrefix,
  onExport,
}: {
  open: boolean
  onClose: () => void
  titre: string
  nomFichierPrefix: string
  onExport: (dateDebut: string, dateFin: string) => Promise<void>
}) {
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin,   setDateFin]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  const handleClose = () => {
    setDateDebut(''); setDateFin('')
    setError(''); setSuccess(false)
    onClose()
  }

  const handleDownload = async () => {
    if (!dateDebut || !dateFin) { setError('Veuillez sélectionner une période.'); return }
    if (dateDebut > dateFin)    { setError('La date de début doit être antérieure à la date de fin.'); return }
    setLoading(true); setError(''); setSuccess(false)
    try {
      await onExport(dateDebut, dateFin)
      setSuccess(true)
    } catch (err: any) {
      // Tente d'extraire le message d'erreur Django si disponible
      let msg = 'Erreur lors du téléchargement. Vérifiez les dates et réessayez.'
      if (err?.response) {
        const status = err.response.status
        if (status === 404) msg = 'Aucune donnée trouvée pour cette période.'
        else if (status === 403) msg = 'Accès refusé. Vérifiez vos permissions.'
        else if (status === 500) msg = 'Erreur serveur. Contactez un administrateur.'
        else msg = `Erreur ${status}. Vérifiez les dates et réessayez.`
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderZipOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 15, fontWeight: 500 }}>{titre}</Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}>
          <CloseOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {error   && <Alert severity="error"   sx={{ py: 0.5 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ py: 0.5 }}>ZIP téléchargé avec succès !</Alert>}

        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Sélectionnez la période pour télécharger un lot de documents au format ZIP.
        </Typography>

        <TextField
          label="Date de début" type="date" size="small" fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          value={dateDebut}
          onChange={e => { setDateDebut(e.target.value); setError(''); setSuccess(false) }}
        />
        <TextField
          label="Date de fin" type="date" size="small" fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          value={dateFin}
          onChange={e => { setDateFin(e.target.value); setError(''); setSuccess(false) }}
        />

        {dateDebut && dateFin && dateDebut <= dateFin && (
          <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 1.25 }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Fichier généré :</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 500, fontFamily: 'monospace', mt: 0.25 }}>
              {nomFichierPrefix}_{dateDebut}_au_{dateFin}.zip
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button size="small" onClick={handleClose} disabled={loading}>Annuler</Button>
        <Button
          size="small" variant="contained"
          onClick={handleDownload}
          disabled={loading || !dateDebut || !dateFin}
          startIcon={loading ? <CircularProgress size={13} color="inherit" /> : <DownloadOutlined />}
        >
          {loading ? 'Téléchargement...' : 'Télécharger ZIP'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── KPI Card ───────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'teal'
}) {
  const palette: Record<string, { bg: string; fg: string }> = {
    blue:   { bg: '#E6F1FB', fg: '#185FA5' },
    green:  { bg: '#EAF3DE', fg: '#3B6D11' },
    amber:  { bg: '#FAEEDA', fg: '#854F0B' },
    red:    { bg: '#FCEBEB', fg: '#A32D2D' },
    purple: { bg: '#EEEDFE', fg: '#534AB7' },
    teal:   { bg: '#E1F5EE', fg: '#0F6E56' },
  }
  const c = palette[color]
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 1.5, bgcolor: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ color: c.fg, display: 'flex', fontSize: 20 }}>{icon}</Box>
          </Box>
        </Box>
        <Typography sx={{ fontSize: 26, fontWeight: 600, lineHeight: 1.1, mb: 0.25 }}>{value}</Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary' }}>{label}</Typography>
        {sub && <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.4 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  )
}

// ── Barre progress ─────────────────────────────────────────────

function BarRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
          {value} <Box component="span" sx={{ color: 'text.disabled', fontWeight: 400 }}>({pct}%)</Box>
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ height: 5, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: color }, bgcolor: `${color}22` }}
      />
    </Box>
  )
}

// ── Page principale ────────────────────────────────────────────

export default function StatsChefProduitDashboardPage() {
  const [archives,        setArchives]        = useState<Archive[]>([])
  const [agences,         setAgences]         = useState<{ id: number; nom: string; code: string }[]>([])
  const [produits,        setProduits]        = useState<{ id: number; nom: string; nom_display: string }[]>([])
  const [clients,         setClients]         = useState<Client[]>([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState('')
  const [zipArchiveOpen,  setZipArchiveOpen]  = useState(false)   // modal mouvements agence
  const [zipTxOpen,       setZipTxOpen]       = useState(false)   // modal trans

    // 2. Calculez les données à afficher pour la page courante

  const charger = async () => {
    setLoading(true)
    setError('')
    try {
      const [archRes, agRes, prRes, clRes] = await Promise.all([
        archiveAgenceAPI.liste(),
        agenceAPI.liste(),
        produitAPI.liste(),
        clientAPI.liste().catch(() => ({ data: [] })),
      ])
      setArchives(archRes.data.results ?? archRes.data)
      setAgences(agRes.data.results    ?? agRes.data)
      setProduits(prRes.data.results   ?? prRes.data)
      setClients(clRes.data.results    ?? clRes.data)
    } catch {
      setError('Erreur lors du chargement des données.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { charger() }, [])

  // ── Helpers téléchargement ZIP ─────────────────────────────

  const telechargerBlob = (data: Blob, nomFichier: string) => {
    const url  = window.URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
    const link = document.createElement('a')
    link.href  = url
    link.setAttribute('download', nomFichier)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleExportZipArchives = async (dateDebut: string, dateFin: string) => {
    const { data } = await archiveAgenceAPI.exportZip({ date_debut: dateDebut, date_fin: dateFin })
    telechargerBlob(data, `mouvements_agence_${dateDebut}_au_${dateFin}.zip`)
  }

  const handleExportZipTransactions = async (dateDebut: string, dateFin: string) => {
    const { data } = await transactionAPI.exportZip({ date_debut: dateDebut, date_fin: dateFin })
    telechargerBlob(data, `transactions_${dateDebut}_au_${dateFin}.zip`)
  }

  // ── Calculs ────────────────────────────────────────────────

  const totalArchives      = archives.length
  const archivesCompletes  = archives.filter(a => a.documents_complets).length
  const archivesVides      = archives.filter(a => a.documents.length === 0).length
  const archivesPartielles = totalArchives - archivesCompletes - archivesVides

  const parProduit = produits.map(p => ({
    nom: p.nom_display || p.nom,
    total: archives.filter(a => a.produit_nom === p.nom).length,
  })).filter(p => p.total > 0).sort((a, b) => b.total - a.total)

  const parAgence = agences.map(ag => ({
    nom: ag.nom,
    code: ag.code,
    total: archives.filter(a => a.agence_nom === ag.nom).length,
    completes: archives.filter(a => a.agence_nom === ag.nom && a.documents_complets).length,
  })).filter(a => a.total > 0).sort((a, b) => b.total - a.total).slice(0, 6)

  const archivesRecentes = [...archives]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  const heure      = new Date().getHours()
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* ── En-tête ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 600 }}>{salutation}, Conformité 👋</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Rafraîchir">
            <IconButton size="small" onClick={charger} disabled={loading}>
              <RefreshOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          {/* Bouton 1 — Transactions */}
          <Button
            size="small"
            variant="outlined"
            startIcon={<ReceiptLongOutlined sx={{ fontSize: 16 }} />}
            onClick={() => setZipTxOpen(true)}
          >
            Récupérer transactions
          </Button>
          {/* Bouton 2 — Mouvements agence */}
          <Button
            size="small"
            variant="outlined"
            startIcon={<AccountBalanceOutlined sx={{ fontSize: 16 }} />}
            onClick={() => setZipArchiveOpen(true)}
          >
            Récupérer mouvements agence
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* ── KPIs ── */}
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard icon={<InventoryOutlined />}    label="Total archives"      value={totalArchives}      color="blue"   />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard icon={<CheckCircleOutlined />}  label="Archives complètes"  value={archivesCompletes}
                sub={`${totalArchives > 0 ? Math.round(archivesCompletes / totalArchives * 100) : 0}% du total`}
                color="green" />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard icon={<WarningAmberOutlined />} label="Incomplètes"         value={archivesPartielles} color="amber"  />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard icon={<FolderOffOutlined />}    label="Vides"               value={archivesVides}      color="red"    />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard icon={<StorefrontOutlined />}   label="Agences actives"     value={agences.length}     color="teal"   />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <KpiCard icon={<PeopleOutlined />}       label="Clients"             value={clients.length}     color="purple" />
            </Grid>
          </Grid>

          {/* ── Ligne 2 ── */}
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>

            <Grid size={{ xs: 12, md: 3 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <InventoryOutlined sx={{ fontSize: 17, color: 'text.secondary' }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Statut des archives</Typography>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <BarRow label="Complètes"  value={archivesCompletes}  total={totalArchives} color="#3B6D11" />
                  <BarRow label="Partielles" value={archivesPartielles} total={totalArchives} color="#854F0B" />
                  <BarRow label="Vides"      value={archivesVides}      total={totalArchives} color="#A32D2D" />
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Taux de complétion</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#3B6D11' }}>
                      {totalArchives > 0 ? Math.round(archivesCompletes / totalArchives * 100) : 0}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <ReceiptLongOutlined sx={{ fontSize: 17, color: 'text.secondary' }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Archives par produit</Typography>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  {parProduit.length === 0 ? (
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center', py: 2 }}>Aucune donnée</Typography>
                  ) : parProduit.map((p, i) => (
                    <BarRow key={i} label={p.nom} value={p.total} total={totalArchives} color="#185FA5" />
                  ))}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <AccountBalanceOutlined sx={{ fontSize: 17, color: 'text.secondary' }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Couverture par agence</Typography>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  {parAgence.length === 0 ? (
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center', py: 2 }}>Aucune donnée</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {parAgence.map((ag, i) => {
                        const pct = ag.total > 0 ? Math.round(ag.completes / ag.total * 100) : 0
                        return (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 10, bgcolor: '#E6F1FB', color: '#185FA5', fontWeight: 600, flexShrink: 0 }}>
                              {ag.code?.slice(0, 2)}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {ag.nom}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.75, ml: 1, flexShrink: 0 }}>
                                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{ag.completes}/{ag.total}</Typography>
                                  <Chip
                                    label={`${pct}%`}
                                    size="small"
                                    color={pct === 100 ? 'success' : pct > 50 ? 'warning' : 'error'}
                                    sx={{ fontSize: 10, height: 18, '& .MuiChip-label': { px: 0.75 } }}
                                  />
                                </Box>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                color={pct === 100 ? 'success' : pct > 50 ? 'warning' : 'error'}
                                sx={{ height: 4, borderRadius: 2 }}
                              />
                            </Box>
                          </Box>
                        )
                      })}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ── Tableau archives récentes ── */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                  Archives récentes
                  <Box component="span" sx={{ ml: 1, fontSize: 12, color: 'text.secondary', fontWeight: 400 }}>
                    ({archivesRecentes.length} sur {totalArchives})
                  </Box>
                </Typography>
                
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      {['Agence', 'Produit', 'Date', 'Documents', 'Statut', ''].map(h => (
                        <TableCell key={h} sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', py: 1 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {archivesRecentes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5 }}>
                          <FolderOffOutlined sx={{ fontSize: 30, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Aucune archive</Typography>
                        </TableCell>
                      </TableRow>
                    ) : archivesRecentes.map(a => {
                      const done   = a.documents.length
                      const total  = a.types_requis.length
                      const pct    = total > 0 ? Math.round(done / total * 100) : 0
                      const statut = a.documents_complets ? 'Complet' : done === 0 ? 'Vide' : `${done}/${total}`
                      const color  = a.documents_complets ? 'success' : done === 0 ? 'error' : 'warning'
                      return (
                        <TableRow key={a.id} hover sx={{ '& td': { py: 0.75 } }}>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{a.agence_nom}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={a.produit_nom} size="small" sx={{ fontSize: 11, height: 20, bgcolor: '#E6F1FB', color: '#185FA5' }} />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                              {new Date(a.date).toLocaleDateString('fr-FR')}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 100 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress variant="determinate" value={pct} color={color} sx={{ flex: 1, height: 4, borderRadius: 2 }} />
                              <Typography sx={{ fontSize: 11, color: 'text.secondary', flexShrink: 0 }}>{pct}%</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={statut} color={color} size="small" sx={{ fontSize: 11, height: 20 }} />
                          </TableCell>
                          <TableCell>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Modal ZIP transactions ── */}
      <ExportZipModal
        open={zipTxOpen}
        onClose={() => setZipTxOpen(false)}
        titre="Récupérer les transactions (ZIP)"
        nomFichierPrefix="transactions"
        onExport={handleExportZipTransactions}
      />

      {/* ── Modal ZIP mouvements agence ── */}
      <ExportZipModal
        open={zipArchiveOpen}
        onClose={() => setZipArchiveOpen(false)}
        titre="Récupérer les mouvements agence (ZIP)"
        nomFichierPrefix="mouvements_agence"
        onExport={handleExportZipArchives}
      />
    </Box>
  )
}