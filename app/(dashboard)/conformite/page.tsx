'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Grid, Card, CardContent,
  Button, CircularProgress, Divider, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, MenuItem, Select, FormControl,
  InputLabel, IconButton, Tooltip, Alert
} from '@mui/material'
import {
  ReceiptOutlined, HourglassEmptyOutlined,
  CheckCircleOutlined, CancelOutlined,
  DownloadOutlined, SearchOutlined,
  VisibilityOutlined, TrendingUpOutlined,
  FilterListOutlined, RefreshOutlined
} from '@mui/icons-material'
import { enregistrementAPI } from '@/lib/api'
import StatutBadge from '@/components/enregistrements/StatutBadge'

// ── Types ──────────────────────────────────────────
interface Enregistrement {
  id:                  number
  nom_client:          string
  prenom_client:       string
  type_piece:          string         // ✅
  type_piece_display:  string         // ✅
  numero_piece:        string         // ✅
  date_paiement:       string
  statut:              'en_attente' | 'valide' | 'rejete'
  documents_complets:  boolean
  caissier_nom:        string
  created_at:          string
}

interface Stats {
  total:      number
  en_attente: number
  valides:    number
  rejetes:    number
  par_caissier: {
    caissier__nom:    string
    caissier__prenom: string
    total:            number
    type_piece_display?: number
    numero_piece?: number

  }[]
  par_type_piece: {
    type_piece: string
    total:      number
  }[]
  docs_incomplets: number
}


type MuiColor = 'primary' | 'warning' | 'success' | 'error'

interface StatCardProps {
  icon:  React.ReactNode
  label: string
  value: number | string
  color: MuiColor
  sub?:  string
}

const StatCard = ({ icon, label, value, color, sub }: StatCardProps) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: `${color}.main` }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {sub}
            </Typography>
          )}
        </Box>
        <Box sx={{
          width: 48, height: 48, borderRadius: 2,
          bgcolor: `${color}.light`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

export default function ConformiteDashboardPage() {
  const router = useRouter()

  const [stats, setStats]               = useState<Stats | null>(null)
  const [enregistrements, setEnregistrements] = useState<Enregistrement[]>([])
  const [loading, setLoading]           = useState(true)
  const [exporting, setExporting]       = useState(false)
  const [error, setError]               = useState('')

  // Filtres
  const [search, setSearch]         = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [dateDebut, setDateDebut]   = useState('')
  const [dateFin, setDateFin]       = useState('')

  const charger = async () => {
    setLoading(true)
    setError('')
    try {
      const [statsRes, listeRes] = await Promise.all([
        enregistrementAPI.stats({ date_debut: dateDebut, date_fin: dateFin }),
        enregistrementAPI.liste({
          search:     search,
          statut:     filtreStatut,
          date_debut: dateDebut,
          date_fin:   dateFin,
        }),
      ])
      setStats(statsRes.data)
      setEnregistrements(listeRes.data.results || listeRes.data)
    } catch {
      setError('Erreur lors du chargement des données.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { charger() }, [])

  const exporterCsv = async () => {
    setExporting(true)
    try {
      const { data } = await enregistrementAPI.exportCsv({
        statut:     filtreStatut,
        date_debut: dateDebut,
        date_fin:   dateFin,
      })
      const url  = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `export_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const heure      = new Date().getHours()
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <Box>

      {/* ── Bannière ── */}
      <Box sx={{
        mb: 4, p: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #1e293b 0%, #2E7D32 100%)',
        color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 2,
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {salutation}, Conformité 👋
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <DownloadOutlined />}
          onClick={exporterCsv}
          disabled={exporting}
          sx={{ bgcolor: 'white', color: '#2E7D32', fontWeight: 700, '&:hover': { bgcolor: '#f1f5f9' } }}
        >
          Exporter CSV
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ── Cartes stats ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<ReceiptOutlined color="primary" />}
                label="Total enregistrements"
                value={stats?.total ?? 0}
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<HourglassEmptyOutlined color="warning" />}
                label="En attente"
                value={stats?.en_attente ?? 0}
                color="warning"
                sub="À traiter"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<CheckCircleOutlined color="success" />}
                label="Validés"
                value={stats?.valides ?? 0}
                color="success"
                sub="Dossiers acceptés"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<CancelOutlined color="error" />}
                label="Rejetés"
                value={stats?.rejetes ?? 0}
                color="error"
                sub="Dossiers refusés"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Montant total + taux */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TrendingUpOutlined color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Taux de traitement
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Taux de validation
                      </Typography>
                      <Chip
                        label={stats?.total ? `${Math.round((stats.valides / stats.total) * 100)} %` : '0 %'}
                        color="success" size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Taux de rejet
                      </Typography>
                      <Chip
                        label={stats?.total ? `${Math.round((stats.rejetes / stats.total) * 100)} %` : '0 %'}
                        color="error" size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        En attente
                      </Typography>
                      <Chip
                        label={stats?.total ? `${Math.round((stats.en_attente / stats.total) * 100)} %` : '0 %'}
                        color="warning" size="small"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Activité par caissier */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Activité par caissier
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {stats?.par_caissier?.length === 0 ? (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                      Aucune donnée disponible
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {stats?.par_caissier?.map((c, i) => (
                        <Box key={i} sx={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5, borderRadius: 2,
                          border: '1px solid', borderColor: 'divider',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36, fontSize: 13 }}>
                              {c.caissier__prenom?.[0]}{c.caissier__nom?.[0]}
                            </Avatar>
                            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                              {c.caissier__prenom} {c.caissier__nom}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Chip label={`${c.total} dossiers`} color="primary" size="small" />
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                              {c.type_piece_display}
                            </Typography>
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                              {c.numero_piece}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ── Tableau enregistrements avec filtres ── */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Tous les enregistrements
                </Typography>
                <Tooltip title="Rafraîchir">
                  <IconButton onClick={charger}>
                    <RefreshOutlined />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Filtres */}
              <Box sx={{
                display: 'flex', gap: 2, mb: 3,
                flexWrap: 'wrap', alignItems: 'center',
              }}>
                <TextField
                  placeholder="Rechercher client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="small"
                  sx={{ minWidth: 220 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={filtreStatut}
                    label="Statut"
                    onChange={(e) => setFiltreStatut(e.target.value)}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="en_attente">En attente</MenuItem>
                    <MenuItem value="valide">Validés</MenuItem>
                    <MenuItem value="rejete">Rejetés</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Date début" type="date" size="small"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Date fin" type="date" size="small"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <Button
                  variant="contained" size="small"
                  startIcon={<FilterListOutlined />}
                  onClick={charger}
                >
                  Filtrer
                </Button>
              </Box>

              {/* Tableau */}
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      {['Client', 'Caissier', 'Pièce d\'identité', 'Date', 'Docs', 'Statut', 'Action'].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, color: '#475569' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {enregistrements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Aucun enregistrement trouvé
                        </TableCell>
                      </TableRow>
                    ) : enregistrements.map((e) => (
                      <TableRow key={e.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: 'primary.light' }}>
                              {e.prenom_client[0]}{e.nom_client[0]}
                            </Avatar>
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                              {e.prenom_client} {e.nom_client}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14 }}>{e.caissier_nom}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'primary.main' }}>
                            {e.type_piece_display}
                          </Typography>

                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'primary.main' }}>
                            {e.numero_piece}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>
                            {new Date(e.date_paiement).toLocaleDateString('fr-FR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={e.documents_complets ? '✅ Complets' : '⚠️ Incomplets'}
                            color={e.documents_complets ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <StatutBadge statut={e.statut} />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Voir et traiter">
                            <IconButton
                              size="small" color="primary"
                              onClick={() => router.push(`/conformite/${e.id}`)}
                            >
                              <VisibilityOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}