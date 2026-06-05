'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Grid, Card, CardContent,
  CircularProgress, Alert
} from '@mui/material'
import {
  Inventory2Outlined,
  CheckCircleOutlined,
  ErrorOutlined,
} from '@mui/icons-material'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { StatsAPI } from '@/lib/api'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend)

// ── Types ──────────────────────────────────────────────────────────────────

interface RepartionItem {
  produit__nom?: string
  agence__code?: string
  agence__nom?: string
  agence__ville__nom?: string
  total: number
}

interface StatsData {
  total_archives: number
  archives_completes: number
  par_produit: RepartionItem[]
  par_agence: RepartionItem[]
  par_ville: RepartionItem[]
}

const LABELS_PRODUITS: Record<string, string> = {
  western_union: 'Western Union',
  change: 'Change',
  visa: 'VISA',
  momo: 'MOMO',
  airtel_money: 'Airtel Money',
}

// ── Composants KPI ─────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
  bgColor,
  iconColor,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color?: string
  bgColor: string
  iconColor: string
}) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            p: 1.5,
            bgcolor: bgColor,
            borderRadius: 2,
            display: 'flex',
            color: iconColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.25 }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: color ?? 'text.primary', lineHeight: 1.1 }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary">
              {sub}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

// ── Wrapper carte pour les charts ──────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  )
}

// ── Page principale ────────────────────────────────────────────────────────

export default function StatsPage() {
  const [statsAdmin, setStatsAdmin] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const chargerStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await StatsAPI.statsAdmin()
      setStatsAdmin(data)
    } catch (err) {
      console.error(err)
      setError('Impossible de récupérer les statistiques du système d\'archivage.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    chargerStats()
  }, [chargerStats])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={40} />
      </Box>
    )
  }

  const total      = statsAdmin?.total_archives ?? 0
  const complets   = statsAdmin?.archives_completes ?? 0
  const incomplets = total - complets
  const tauxC      = total ? Math.round((complets / total) * 100) : 0
  const tauxI      = 100 - tauxC

  // ── Données Chart.js ──────────────────────────────────────────────────

  const donutData = {
    labels: ['Complets', 'Incomplets'],
    datasets: [
      {
        data: [complets, incomplets],
        backgroundColor: ['#639922', '#E24B4A'],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            ` ${ctx.label} : ${ctx.raw} (${total ? Math.round((ctx.raw / total) * 100) : 0}%)`,
        },
      },
    },
  }

  const produitLabels = (statsAdmin?.par_produit ?? []).map(
    (p) => LABELS_PRODUITS[p.produit__nom ?? ''] ?? p.produit__nom ?? ''
  )
  const produitData = {
    labels: produitLabels,
    datasets: [
      {
        label: 'Archives',
        data: (statsAdmin?.par_produit ?? []).map((p) => p.total),
        backgroundColor: ['#378ADD', '#1D9E75', '#BA7517', '#D4537E', '#7F77DD'],
        borderRadius: 6,
        borderSkipped: false as const,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false as const } },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { border: { display: false }, ticks: { precision: 0 } },
    },
  }

  const agenceLabels = (statsAdmin?.par_agence ?? []).map(
    (a) => `${a.agence__code} – ${a.agence__nom}`
  )
  const agenceData = {
    labels: agenceLabels,
    datasets: [
      {
        label: 'Volume',
        data: (statsAdmin?.par_agence ?? []).map((a) => a.total),
        backgroundColor: '#185FA5',
        borderRadius: 4,
        borderSkipped: false as const,
      },
    ],
  }

  const agenceHBarOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false as const } },
    scales: {
      x: { border: { display: false }, ticks: { precision: 0 } },
      y: { grid: { display: false }, border: { display: false } },
    },
  }

  const villeColors = ['#0F6E56', '#1D9E75', '#5DCAA5', '#9FE1CB']
  const villeData = {
    labels: (statsAdmin?.par_ville ?? []).map((v) => v.agence__ville__nom ?? 'Non spécifiée'),
    datasets: [
      {
        label: 'Volume',
        data: (statsAdmin?.par_ville ?? []).map((v) => v.total),
        backgroundColor: (statsAdmin?.par_ville ?? []).map((_, i) => villeColors[i % villeColors.length]),
        borderRadius: 6,
        borderSkipped: false as const,
      },
    ],
  }

  const agenceBarHeight = Math.max(260, (statsAdmin?.par_agence?.length ?? 4) * 48 + 60)

  return (
    <Box sx={{ p: 1 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Statistiques de Conformité
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Analyse de complétude des arrêtés de caisse et documents d'exploitation journaliers
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ── KPI ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            icon={<Inventory2Outlined sx={{ fontSize: 28 }} />}
            label="Total enveloppes journalières"
            value={total.toLocaleString()}
            sub="dossiers archivés"
            bgColor="#E3F2FD"
            iconColor="#0D47A1"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            icon={<CheckCircleOutlined sx={{ fontSize: 28 }} />}
            label="Dossiers 100% complets"
            value={complets.toLocaleString()}
            sub={`${tauxC}% du total`}
            color="#2E7D32"
            bgColor="#E8F5E9"
            iconColor="#2E7D32"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            icon={<ErrorOutlined sx={{ fontSize: 28 }} />}
            label="Dossiers incomplets"
            value={incomplets.toLocaleString()}
            sub={`${tauxI}% du total`}
            color="#C62828"
            bgColor="#FFEBEE"
            iconColor="#C62828"
          />
        </Grid>
      </Grid>

      {/* ── Ligne 2 : Donut + Par produit ── */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Donut complétude */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Taux de complétude global">
            {/* Légende manuelle */}
            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              {[
                { label: `Complets (${tauxC}%)`, color: '#639922' },
                { label: `Incomplets (${tauxI}%)`, color: '#E24B4A' },
              ].map((l) => (
                <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: l.color, flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary">{l.label}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ position: 'relative', height: 200 }}>
              <Doughnut data={donutData} options={donutOptions} />
            </Box>
          </ChartCard>
        </Grid>

        {/* Bar par produit */}
        <Grid size={{ xs: 12, md: 8 }}>
          <ChartCard title="Répartition par produit">
            <Box sx={{ position: 'relative', height: 240 }}>
              <Bar data={produitData} options={barOptions} />
            </Box>
          </ChartCard>
        </Grid>
      </Grid>

      {/* ── Ligne 3 : Agences (barre horizontale) ── */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12 }}>
          <ChartCard title="Volume par agence">
            <Box sx={{ position: 'relative', height: agenceBarHeight }}>
              <Bar data={agenceData} options={agenceHBarOptions} />
            </Box>
          </ChartCard>
        </Grid>
      </Grid>

      {/* ── Ligne 4 : Villes ── */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <ChartCard title="Répartition par ville / zone">
            <Box sx={{ position: 'relative', height: 220 }}>
              <Bar data={villeData} options={barOptions} />
            </Box>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  )
}