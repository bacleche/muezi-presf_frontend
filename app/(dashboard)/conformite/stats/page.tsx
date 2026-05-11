'use client'
import { useEffect, useState } from 'react'
import {
  Box, Typography, Grid, Card, CardContent,
  Button, TextField, CircularProgress, Divider, Chip, Avatar
} from '@mui/material'
import {
  DownloadOutlined, CheckCircleOutlined,
  CancelOutlined, HourglassEmptyOutlined,
  ReceiptOutlined, BadgeOutlined, FilterListOutlined
} from '@mui/icons-material'
import { enregistrementAPI } from '@/lib/api'

// ── Types ──────────────────────────────────────────────
type MuiColor = 'primary' | 'warning' | 'success' | 'error'

interface StatCardProps {
  icon:  React.ReactNode
  label: string
  value: number
  color: MuiColor
  sub?:  string
}

interface CaissierStat {
  caissier__prenom: string
  caissier__nom:    string
  total:            number
}

interface TypePieceStat {
  type_piece: string
  total:      number
}

interface StatsResponse {
  total:           number
  en_attente:      number
  valides:         number
  rejetes:         number
  par_caissier:    CaissierStat[]
  par_type_piece:  TypePieceStat[]
  docs_incomplets: number
}

// ── Helpers ────────────────────────────────────────────
const LABELS_PIECE: Record<string, string> = {
  cni:      "Carte Nationale d'Identité",
  passport: 'Passport',
  niu:      "Numéro d'Identification Unique",
}

// ── StatCard ───────────────────────────────────────────
const StatCard = ({ icon, label, value, color, sub }: StatCardProps) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }} color={`${color}.main`}>
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

// ── Page ───────────────────────────────────────────────
export default function StatsPage() {
  const [stats, setStats]         = useState<StatsResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [exporting, setExporting] = useState(false)
  const [filtres, setFiltres]     = useState({ date_debut: '', date_fin: '' })

  const chargerStats = async () => {
    setLoading(true)
    try {
      const { data } = await enregistrementAPI.stats(filtres)
      setStats(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { chargerStats() }, [])

  const exporterCsv = async () => {
    setExporting(true)
    try {
      const { data } = await enregistrementAPI.exportCsv(filtres)
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

  return (
    <Box>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Statistiques & Rapports
        </Typography>
        <Button
          variant="contained" color="success"
          startIcon={exporting
            ? <CircularProgress size={18} color="inherit" />
            : <DownloadOutlined />
          }
          onClick={exporterCsv}
          disabled={exporting}
        >
          Exporter CSV
        </Button>
      </Box>

      {/* ── Filtres ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small" label="Date début" type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={filtres.date_debut}
            onChange={(e) => setFiltres({ ...filtres, date_debut: e.target.value })}
          />
          <TextField
            size="small" label="Date fin" type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={filtres.date_fin}
            onChange={(e) => setFiltres({ ...filtres, date_fin: e.target.value })}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListOutlined />}
            onClick={chargerStats}
          >
            Filtrer
          </Button>
          {(filtres.date_debut || filtres.date_fin) && (
            <Button
              variant="text" color="error" size="small"
              onClick={() => {
                setFiltres({ date_debut: '', date_fin: '' })
                setTimeout(chargerStats, 100)
              }}
            >
              Réinitialiser
            </Button>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : stats && (
        <>
          {/* ── Cartes stats ── */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<ReceiptOutlined color="primary" />}
                label="Total enregistrements"
                value={stats.total}
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<HourglassEmptyOutlined color="warning" />}
                label="En attente"
                value={stats.en_attente}
                color="warning"
                sub="À traiter"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<CheckCircleOutlined color="success" />}
                label="Validés"
                value={stats.valides}
                color="success"
                sub="Dossiers acceptés"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<CancelOutlined color="error" />}
                label="Rejetés"
                value={stats.rejetes}
                color="error"
                sub="Dossiers refusés"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>

            {/* ── Taux ── */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Taux de traitement
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Taux de validation
                      </Typography>
                      <Chip
                        label={stats.total
                          ? `${Math.round((stats.valides / stats.total) * 100)} %`
                          : '0 %'
                        }
                        color="success" size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Taux de rejet
                      </Typography>
                      <Chip
                        label={stats.total
                          ? `${Math.round((stats.rejetes / stats.total) * 100)} %`
                          : '0 %'
                        }
                        color="error" size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        En attente
                      </Typography>
                      <Chip
                        label={stats.total
                          ? `${Math.round((stats.en_attente / stats.total) * 100)} %`
                          : '0 %'
                        }
                        color="warning" size="small"
                      />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Docs incomplets
                      </Typography>
                      <Chip
                        label={stats.docs_incomplets}
                        color={stats.docs_incomplets > 0 ? 'warning' : 'success'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* ── Par type de pièce ── */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <BadgeOutlined color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Par type de pièce
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  {stats.par_type_piece?.length === 0 ? (
                    <Typography color="text.secondary" variant="body2" sx={{ textAlign: 'center', py: 2 }}>
                      Aucune donnée
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {stats.par_type_piece?.map((p) => (
                        <Box key={p.type_piece} sx={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', p: 1.5,
                          borderRadius: 2, border: '1px solid',
                          borderColor: 'divider',
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {LABELS_PIECE[p.type_piece] || p.type_piece}
                          </Typography>
                          <Chip label={`${p.total} dossiers`} color="primary" size="small" />
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* ── Par caissier ── */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Activité par caissier
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {stats.par_caissier?.length === 0 ? (
                    <Typography color="text.secondary" variant="body2" sx={{ textAlign: 'center', py: 2 }}>
                      Aucune donnée
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {stats.par_caissier?.map((c, i) => (
                        <Box key={i} sx={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5, borderRadius: 2,
                          border: '1px solid', borderColor: 'divider',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{
                              width: 32, height: 32,
                              fontSize: 12, bgcolor: 'primary.light',
                            }}>
                              {c.caissier__prenom?.[0]}{c.caissier__nom?.[0]}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {c.caissier__prenom} {c.caissier__nom}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${c.total} dossiers`}
                            color="primary" size="small"
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </>
      )}
    </Box>
  )
}