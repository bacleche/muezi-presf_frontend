'use client'
import { useEffect, useState } from 'react'
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  CircularProgress, Chip, LinearProgress,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material'
import {
  GroupsOutlined, VerifiedUserOutlined, StorefrontOutlined,
  TrendingUpOutlined, InventoryOutlined, LocationOnOutlined
} from '@mui/icons-material'
import { userAPI, archiveAgenceAPI } from '@/lib/api'

// ─── Composants Utilitaires ───────────────────────────────────
function KPICard({ label, value, icon, color = '#3b82f6', sublabel }: any) {
  return (
    <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>{label}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{value}</Typography>
            {sublabel && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{sublabel}</Typography>}
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}15`, color: color }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  )
}

function ProgressBar({ label, value, max, color }: any) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{pct}%</Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: color } }} />
    </Box>
  )
}

// ─── Dashboard Principal ─────────────────────────────────────
export default function ChefProduitDashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filtrePeriode, setFiltrePeriode] = useState('30')

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, statsRes] = await Promise.all([
        userAPI.liste(),
        archiveAgenceAPI.stats()
      ])
      
      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.results || [])
      setUsers(allUsers.filter((u: any) => ['chef_agence', 'conformite'].includes(u.role)))
      setStats(statsRes.data)
    } catch (err) {
      console.error("Erreur chargement dashboard", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [filtrePeriode])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Tableau de Bord Produit</Typography>
          <Typography color="text.secondary">Pilotage du réseau et conformité documentaire</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Période</InputLabel>
          <Select value={filtrePeriode} label="Période" onChange={(e) => setFiltrePeriode(e.target.value)}>
            <MenuItem value="30">30 derniers jours</MenuItem>
            <MenuItem value="90">90 derniers jours</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* KPIs Grid avec syntaxe MUI v6 (size au lieu de item) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}><KPICard label="Total Archives" value={stats?.total || 0} icon={<InventoryOutlined />} color="#6366f1" /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><KPICard label="Chefs d'Agence" value={users.filter(u => u.role === 'chef_agence').length} icon={<StorefrontOutlined />} color="#10b981" /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><KPICard label="Agents Conformité" value={users.filter(u => u.role === 'conformite').length} icon={<VerifiedUserOutlined />} color="#8b5cf6" /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><KPICard label="Taux Complétion" value={`${stats?.taux || 0}%`} icon={<TrendingUpOutlined />} color="#f59e0b" /></Grid>
      </Grid>

      {/* Analytics */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Répartition par Produit</Typography>
            {stats?.par_produit?.map((p: any) => (
              <ProgressBar key={p.nom} label={p.nom} value={p.valeur} max={stats.total} color="#3b82f6" />
            ))}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Top Agences</Typography>
            {stats?.par_agence?.slice(0, 5).map((a: any) => (
              <Box key={a.code} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <LocationOnOutlined sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography sx={{ flexGrow: 1 }}>{a.nom}</Typography>
                <Chip label={`${a.total} docs`} size="small" sx={{ fontWeight: 600 }} />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}