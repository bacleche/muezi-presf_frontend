'use client'
import { useEffect, useState } from 'react'
import {
  Box, Typography, Grid, Card, CardContent,
  CircularProgress, Alert, Divider, TextField,
  MenuItem, Chip
} from '@mui/material'
import {
  HourglassEmptyOutlined, CheckCircleOutlined,
  CancelOutlined, ReceiptOutlined, BusinessOutlined,
  PersonOutlined
} from '@mui/icons-material'
import { enregistrementAPI } from '@/lib/api'

interface Stats {
  total:           number
  en_attente:      number
  valides:         number
  rejetes:         number
  par_caissier: {
    caissier__nom:    string
    caissier__prenom: string
    total:            number
  }[]
  par_type_piece: {
    type_piece: string
    total:      number
  }[]
  docs_incomplets: number
}

const TYPE_PIECE_LABELS: Record<string, string> = {
  cni:      "Carte Nationale d'Identité",
  passport: 'Passport',
  niu:      "Numéro d'Identification Unique",
}

const StatCard = ({ icon, label, value, color, sub }: {
  icon:   React.ReactNode
  label:  string
  value:  number
  color:  string
  sub?:   string
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" color="text.secondary"
            sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary">{sub}</Typography>
          )}
        </Box>
        <Box sx={{
          width: 48, height: 48, borderRadius: 2,
          bgcolor: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

export default function AdminStatsPage() {
  const [stats, setStats]       = useState<Stats | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin,   setDateFin]   = useState('')

  const charger = async (dd: string, df: string) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = {}
      if (dd) params.date_debut = dd
      if (df) params.date_fin   = df
      const { data } = await enregistrementAPI.stats(params)
      setStats(data)
    } catch {
      setError('Erreur lors du chargement des statistiques.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { charger(dateDebut, dateFin) }, [dateDebut, dateFin])

  const tauxValidation = stats?.total
    ? Math.round((stats.valides / stats.total) * 100)
    : 0

  const tauxRejet = stats?.total
    ? Math.round((stats.rejetes / stats.total) * 100)
    : 0

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Statistiques</Typography>
        <Typography variant="body2" color="text.secondary">
          Vue globale de l'activité sur tous les dossiers
        </Typography>
      </Box>

      {/* ── Filtres date ── */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', py: '12px !important' }}>
          <TextField
            label="Du" type="date" size="small"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 180 }}
          />
          <TextField
            label="Au" type="date" size="small"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 180 }}
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

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress />
        </Box>
      ) : stats && (
        <>
          {/* ── Cartes chiffres clés ── */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<ReceiptOutlined />}
                label="Total dossiers"
                value={stats.total}
                color="#0D47A1"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<HourglassEmptyOutlined />}
                label="En attente"
                value={stats.en_attente}
                color="#f59e0b"
                sub={`${stats.total ? Math.round((stats.en_attente / stats.total) * 100) : 0}% du total`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<CheckCircleOutlined />}
                label="Validés"
                value={stats.valides}
                color="#16a34a"
                sub={`${tauxValidation}% du total`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<CancelOutlined />}
                label="Rejetés"
                value={stats.rejetes}
                color="#dc2626"
                sub={`${tauxRejet}% du total`}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>

            {/* ── Par type de pièce ── */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Par type de pièce
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {stats.par_type_piece.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>
                  ) : stats.par_type_piece.map((t, i) => (
                    <Box key={i} sx={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.2,
                      borderBottom: i < stats.par_type_piece.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {TYPE_PIECE_LABELS[t.type_piece] ?? t.type_piece}
                        </Typography>
                      </Box>
                      <Chip label={t.total} size="small" color="primary" variant="outlined" />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* ── Par caissier ── */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Activité par caissier
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stats.par_caissier.length} caissier{stats.par_caissier.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  {stats.par_caissier.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>
                  ) : stats.par_caissier.map((c, i) => {
                    const pct = stats.total ? Math.round((c.total / stats.total) * 100) : 0
                    return (
                      <Box key={i} sx={{
                        py: 1.5,
                        borderBottom: i < stats.par_caissier.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {c.caissier__prenom} {c.caissier__nom}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {pct}%
                            </Typography>
                            <Chip label={c.total} size="small" color="primary" variant="outlined" />
                          </Box>
                        </Box>
                        {/* Barre de progression */}
                        <Box sx={{
                          height: 4, borderRadius: 2,
                          bgcolor: '#e2e8f0', overflow: 'hidden',
                        }}>
                          <Box sx={{
                            height: '100%', borderRadius: 2,
                            width: `${pct}%`,
                            bgcolor: '#0D47A1',
                            transition: 'width 0.6s ease',
                          }} />
                        </Box>
                      </Box>
                    )
                  })}
                </CardContent>
              </Card>
            </Grid>

            {/* ── Docs incomplets ── */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{
                border: stats.docs_incomplets > 0 ? '1px solid #fbbf24' : undefined,
                bgcolor: stats.docs_incomplets > 0 ? '#fffbeb' : undefined,
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: 2,
                      bgcolor: '#fbbf2420',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <HourglassEmptyOutlined sx={{ color: '#f59e0b' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Docs incomplets
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                        {stats.docs_incomplets}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Dossiers en attente sans tous leurs documents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </>
      )}
    </Box>
  )
}