'use client'
import { useEffect, useState } from 'react'
import {
  Box, Typography, Grid, Card, CardContent,
  Button, TextField, CircularProgress, Divider
} from '@mui/material'
import {
  DownloadOutlined, CheckCircleOutlined,
  CancelOutlined, HourglassEmptyOutlined, ReceiptOutlined
} from '@mui/icons-material'
import { enregistrementAPI } from '@/lib/api'

// ── Types ──────────────────────────────────────────────
type MuiColor = 'primary' | 'warning' | 'success' | 'error'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: MuiColor
}

interface CaissierStat {
  caissier__prenom: string
  caissier__nom: string
  total: number
  montant?: number | string
}

interface StatsResponse {
  total: number
  en_attente: number
  valides: number
  rejetes: number
  montant_total_valide: number | string
  par_caissier?: CaissierStat[]
}

// ── StatCard ───────────────────────────────────────────
const StatCard = ({ icon, label, value, color }: StatCardProps) => (
  <Card>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{
        width: 52, height: 52, borderRadius: 3,
        bgcolor: `${color}.light`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }} color={`${color}.main`}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
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
    } finally {
      setExporting(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Statistiques & Rapports</Typography>
        <Button
          variant="contained" color="success"
          startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <DownloadOutlined />}
          onClick={exporterCsv} disabled={exporting}
        >
          Exporter CSV
        </Button>
      </Box>

      {/* Filtres date */}
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
          <Button variant="outlined" onClick={chargerStats}>Filtrer</Button>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : stats && (
        <>
          {/* Cartes stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard icon={<ReceiptOutlined color="primary" />}
                label="Total enregistrements" value={stats.total} color="primary" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard icon={<HourglassEmptyOutlined color="warning" />}
                label="En attente" value={stats.en_attente} color="warning" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard icon={<CheckCircleOutlined color="success" />}
                label="Validés" value={stats.valides} color="success" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard icon={<CancelOutlined color="error" />}
                label="Rejetés" value={stats.rejetes} color="error" />
            </Grid>
          </Grid>

          {/* Montant total */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Montant total validé</Typography>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                {Number(stats.montant_total_valide).toLocaleString('fr-FR')} FCFA
              </Typography>
            </CardContent>
          </Card>

          {/* Par caissier */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Activité par caissier</Typography>
              <Divider sx={{ mb: 2 }} />
              {stats.par_caissier?.map((c: CaissierStat, i: number) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography>{c.caissier__prenom} {c.caissier__nom}</Typography>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Typography color="primary" sx={{ fontWeight: 600 }}>{c.total} enreg.</Typography>
                    <Typography color="success.main" sx={{ fontWeight: 600 }}>
                      {Number(c.montant || 0).toLocaleString('fr-FR')} FCFA
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}