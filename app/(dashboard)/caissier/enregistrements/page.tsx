'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, Chip, CircularProgress, Alert,
  TablePagination, ToggleButtonGroup, ToggleButton,
  Dialog, DialogContent, DialogTitle, IconButton,
  Divider, Avatar, Stack
} from '@mui/material'
import {
  AddCircleOutlined, SearchOutlined, VisibilityOutlined,
  CloseOutlined, ReceiptOutlined, PersonOutlined,
  CalendarTodayOutlined, AttachMoneyOutlined,BadgeOutlined,
  DescriptionOutlined, CancelOutlined, CheckCircleOutlined,
  HourglassEmptyOutlined, DownloadOutlined ,   EditOutlined
} from '@mui/icons-material'
import { enregistrementAPI } from '@/lib/api'
import StatutBadge from '@/components/enregistrements/StatutBadge'

interface Document {
  id:               number
  type_doc:         string
  type_doc_display: string
  fichier:          string
  uploaded_at:      string
}

// ── Interface mise à jour ──────────────────────────
interface Enregistrement {
  id:                  number
  nom_client:          string
  prenom_client:       string
  type_piece:          string          // ✅ remplace montant
  type_piece_display:  string          // ✅ nouveau
  numero_piece:        string          // ✅ nouveau
  date_paiement:       string
  statut:              'en_attente' | 'valide' | 'rejete'
  documents_complets:  boolean
  motif_rejet?:        string
  caissier_nom?:       string
  verifie_par_nom?:    string
  verifie_le?:         string
  est_modifiable?:     boolean
  created_at?:         string
  documents?:          Document[]
}
type FiltreStatut = 'tous' | 'en_attente' | 'valide' | 'rejete'

// ── Icône selon statut ──────────────────────────────────────
const StatutIcon = ({ statut }: { statut: Enregistrement['statut'] }) => {
  if (statut === 'valide')    return <CheckCircleOutlined sx={{ color: 'success.main', fontSize: 28 }} />
  if (statut === 'rejete')    return <CancelOutlined      sx={{ color: 'error.main',   fontSize: 28 }} />
  return <HourglassEmptyOutlined sx={{ color: 'warning.main', fontSize: 28 }} />
}



// ── Ligne info dans la modal ────────────────────────────────
const InfoRow = ({ icon, label, value, valueColor }: {
  icon:        React.ReactNode
  label:       string
  value:       React.ReactNode
  valueColor?: string
}) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.2 }}>
    <Box sx={{ color: 'text.secondary', mt: 0.2, flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600, color: valueColor || 'text.primary' }}>
        {value}
      </Typography>
    </Box>
  </Box>
)

// ── Modal détail ────────────────────────────────────────────
function ModalDetail({
  enreg,
  onClose,
}: {
  enreg:   Enregistrement | null
  onClose: () => void
}) {
  if (!enreg) return null

  const statutColors = {
    en_attente: { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c' },
    valide:     { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
    rejete:     { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  }
  const couleur = statutColors[enreg.statut]

  return (
    <Dialog
      open={!!enreg}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
      paper: {
        sx: {
          borderRadius: 2,
          overflow: "hidden",
        },
      },
}}
    >
      {/* ── Header modal ── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0D47A1 100%)',
        p: 3, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 48, height: 48 }}>
            <ReceiptOutlined />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Enregistrement #{enreg.id}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {enreg.created_at
                ? new Date(enreg.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
                : '—'
              }
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseOutlined />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0 }}>

        {/* ── Bandeau statut ── */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 2,
          px: 3, py: 2,
          bgcolor: couleur.bg,
          border: '1px solid', borderColor: couleur.border,
        }}>
          <StatutIcon statut={enreg.statut} />
          <Box>
            <Typography sx={{ fontWeight: 700, color: couleur.text }}>
              {enreg.statut === 'en_attente' && 'En attente de validation'}
              {enreg.statut === 'valide'     && 'Dossier validé'}
              {enreg.statut === 'rejete'     && 'Dossier rejeté'}
            </Typography>
            {enreg.verifie_par_nom && (
              <Typography variant="caption" sx={{ color: couleur.text }}>
                Par {enreg.verifie_par_nom}
                {enreg.verifie_le && ` · ${new Date(enreg.verifie_le).toLocaleDateString('fr-FR')}`}
              </Typography>
            )}
          </Box>
        </Box>

        {/* ── Motif rejet ── */}
        {enreg.statut === 'rejete' && enreg.motif_rejet && (
          <Box sx={{
            mx: 3, mt: 2, p: 2, borderRadius: 2,
            bgcolor: '#fef2f2', border: '1px solid #fecaca',
          }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626', display: 'block', mb: 0.5 }}>
              ⚠️ MOTIF DU REJET
            </Typography>
            <Typography variant="body2" sx={{ color: '#7f1d1d' }}>
              {enreg.motif_rejet}
            </Typography>
          </Box>
        )}

        <Box sx={{ px: 3, pt: 2, pb: 1 }}>

          {/* ── Infos client ── */}
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
            Informations client
          </Typography>
          <Card variant="outlined" sx={{ mt: 1, mb: 2 }}>
            <CardContent sx={{ py: '12px !important' }}>
              <InfoRow
                icon={<PersonOutlined fontSize="small" />}
                label="Nom complet"
                value={`${enreg.prenom_client} ${enreg.nom_client}`}
              />
              <Divider />
              <InfoRow
                icon={<BadgeOutlined fontSize="small" />}
                label="Type de pièce"
                value={enreg.type_piece_display}
              />
              <Divider />
              <InfoRow
                icon={<BadgeOutlined fontSize="small" />}
                label="Numéro de pièce"
                value={enreg.numero_piece}
              />
            </CardContent>
          </Card>

          {/* ── Documents ── */}
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
            Documents ({enreg.documents?.length ?? 0}/3)
          </Typography>
          <Stack spacing={1} sx={{ mt: 1, mb: 2 }}>
            {enreg.documents && enreg.documents.length > 0 ? (
              enreg.documents.map((doc) => (
                <Box key={doc.id} sx={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5, borderRadius: 2,
                  border: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <DescriptionOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {doc.type_doc_display}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small" color="primary"
                    href={doc.fichier} target="_blank" rel="noopener noreferrer"
                    title="Télécharger"
                  >
                    <DownloadOutlined fontSize="small" />
                  </IconButton>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                Aucun document uploadé.
              </Typography>
            )}

            {/* Docs manquants */}
            {enreg.documents && enreg.documents.length < 3 && (
              <Box sx={{
                p: 1.5, borderRadius: 2,
                border: '1px dashed', borderColor: 'warning.main',
                bgcolor: '#fff7ed',
              }}>
                <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                  ⚠️ {3 - (enreg.documents?.length ?? 0)} document(s) manquant(s)
                </Typography>
              </Box>
            )}
          </Stack>

          {/* ── Caissier ── */}
          {enreg.caissier_nom && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" color="text.secondary">
                Créé par <strong>{enreg.caissier_nom}</strong>
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

// ── Page principale ─────────────────────────────────────────
export default function MesEnregistrementsPage() {
  const router = useRouter()

  const [enregistrements, setEnregistrements] = useState<Enregistrement[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [statut, setStatut]     = useState<FiltreStatut>('tous')
  const [page, setPage]         = useState(0)
  const [total, setTotal]       = useState(0)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin,   setDateFin]   = useState('')

  // Modal
  const [selected, setSelected]       = useState<Enregistrement | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // const charger = useCallback(async (q: string, s: FiltreStatut, p: number) => {
  //   setLoading(true)
  //   setError('')
  //   try {
  //     const params: Record<string, string | number> = {
  //       search: q, page: p + 1, page_size: 10,
  //     }
  //     if (s !== 'tous') params.statut = s
  //     const { data } = await enregistrementAPI.liste(params)
  //     setEnregistrements(data.results || data)
  //     setTotal(data.count ?? (data.results || data).length)
  //   } catch {
  //     setError('Erreur lors du chargement.')
  //   } finally {
  //     setLoading(false)
  //   }
  // }, [])

  const charger = useCallback(async (q: string, s: FiltreStatut, p: number, dd: string, df: string) => {
  setLoading(true)
  setError('')
  try {
    const params: Record<string, string | number> = {
      search: q, page: p + 1, page_size: 10,
    }
    if (s !== 'tous') params.statut    = s
    if (dd)           params.date_debut = dd
    if (df)           params.date_fin   = df

    const { data } = await enregistrementAPI.liste(params)
    setEnregistrements(data.results || data)
    setTotal(data.count ?? (data.results || data).length)
  } catch {
    setError('Erreur lors du chargement.')
  } finally {
    setLoading(false)
  }
}, [])
  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); charger(search, statut, 0, dateDebut, dateFin) }, 400)
    return () => clearTimeout(timer)
  }, [search, dateDebut, dateFin])

  useEffect(() => { charger(search, statut, page, dateDebut, dateFin) }, [statut, page, dateDebut, dateFin])

  const handleStatut = (_: React.MouseEvent<HTMLElement>, val: FiltreStatut | null) => {
    if (!val) return
    setStatut(val)
    setPage(0)
  }

  // Ouvrir modal avec détail complet (pour avoir documents + motif_rejet)
  const ouvrirDetail = async (id: number) => {
    setLoadingDetail(true)
    try {
      const { data } = await enregistrementAPI.detail(id)
      setSelected(data)
    } finally {
      setLoadingDetail(false)
    }
  }

  // ── Ajout dans les states ──

  return (
    <Box>
      <ModalDetail enreg={selected} onClose={() => setSelected(null)} />

      {/* ── En-tête ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Mes enregistrements</Typography>
        <Button
          variant="contained" startIcon={<AddCircleOutlined />}
          onClick={() => router.push('/caissier/nouveau')}
        >
          Nouvel enregistrement
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
            size="small"
            sx={{ width: { xs: '100%', sm: 300 } }}
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
            <ToggleButton value="en_attente" sx={{ color: 'warning.main' }}>En attente</ToggleButton>
            <ToggleButton value="valide"     sx={{ color: 'success.main' }}>Validés</ToggleButton>
            <ToggleButton value="rejete"     sx={{ color: 'error.main'   }}>Rejetés</ToggleButton>
          </ToggleButtonGroup>

          {/* ── Filtres date ── */}
<TextField
  label="Du"
  type="date"
  size="small"
  value={dateDebut}
  onChange={(e) => { setDateDebut(e.target.value); setPage(0) }}
  slotProps={{ inputLabel: { shrink: true } }}
  sx={{ width: 160 }}
/>
<TextField
  label="Au"
  type="date"
  size="small"
  value={dateFin}
  onChange={(e) => { setDateFin(e.target.value); setPage(0) }}
  slotProps={{ inputLabel: { shrink: true } }}
  sx={{ width: 160 }}
/>

{/* Bouton reset si des dates sont sélectionnées */}
{(dateDebut || dateFin) && (
  <Button
    size="small"
    variant="outlined"
    color="inherit"
    onClick={() => { setDateDebut(''); setDateFin('') }}
  >
    Effacer dates
  </Button>
)}
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Tableau ── */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              {['Client', 'Pièce d\'identité', 'Date paiement', 'Docs', 'Statut', 'Actions'].map((h) => (
              <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
            ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : enregistrements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucun enregistrement trouvé
                </TableCell>
              </TableRow>
            ) : enregistrements.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }}>
                    {e.prenom_client} {e.nom_client}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                      {e.type_piece_display}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {e.numero_piece}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(e.date_paiement).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={e.documents_complets ? '✅ Complets' : '⚠️ Incomplets'}
                    color={e.documents_complets ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <StatutBadge statut={e.statut} />
                    {e.statut === 'rejete' && (
                      <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                        Voir motif →
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>

                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={
                        loadingDetail
                          ? <CircularProgress size={14} />
                          : <VisibilityOutlined />
                      }
                      onClick={() => ouvrirDetail(e.id)}
                      disabled={loadingDetail}
                    >
                      Voir
                    </Button>

                    {e.statut === 'rejete' && e.est_modifiable && (
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        startIcon={<EditOutlined />}
                        onClick={() => router.push(`/caissier/modification/${e.id}`)}
                      >
                        Modifier
                      </Button>
                    )}

                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={10}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPageOptions={[10]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </TableContainer>
    </Box>
  )
}