'use client'
import { useEffect, useState } from 'react'
import {
  Box, Typography, Grid, Card, CardContent,
  CircularProgress, Alert, Divider
} from '@mui/material'
import {
  PeopleOutlined, BusinessOutlined,
  HourglassEmptyOutlined, CheckCircleOutlined,
  CancelOutlined, ReceiptOutlined
} from '@mui/icons-material'
import { enregistrementAPI, userAPI } from '@/lib/api'

interface Stats {
  total:      number
  en_attente: number
  valides:    number
  rejetes:    number
  par_caissier: { caissier__nom: string; caissier__prenom: string; total: number }[]
}

const StatCard = ({ icon, label, value, color }: {
  icon:  React.ReactNode
  label: string
  value: number | string
  color: string
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color }}>
            {value}
          </Typography>
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

export default function AdminDashboard() {
  const [stats, setStats]         = useState<Stats | null>(null)
  const [nbUsers, setNbUsers]     = useState<number>(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    const charger = async () => {
      try {
        const [{ data: s }, { data: u }] = await Promise.all([
          enregistrementAPI.stats({}),
          userAPI.liste(),
        ])
        setStats(s)
        setNbUsers(u.count ?? u.length)
      } catch {
        setError('Erreur lors du chargement.')
      } finally {
        setLoading(false)
      }
    }
    charger()
  }, [])

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress />
    </Box>
  )

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Tableau de bord
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Vue d'ensemble de l'activité
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<ReceiptOutlined />}        label="Total dossiers"  value={stats?.total ?? 0}      color="#0D47A1" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<HourglassEmptyOutlined />} label="En attente"      value={stats?.en_attente ?? 0} color="#f59e0b" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<CheckCircleOutlined />}    label="Validés"         value={stats?.valides ?? 0}    color="#16a34a" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<CancelOutlined />}         label="Rejetés"         value={stats?.rejetes ?? 0}    color="#dc2626" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<PeopleOutlined />}         label="Utilisateurs"    value={nbUsers}                color="#7c3aed" />
        </Grid>
      </Grid>

      {/* Top caissiers */}
      {stats?.par_caissier && stats.par_caissier.length > 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Activité par caissier
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {stats.par_caissier.map((c, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', py: 1.2,
                borderBottom: i < stats.par_caissier.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}>
                <Typography variant="body2">
                  {c.caissier__prenom} {c.caissier__nom}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0D47A1' }}>
                  {c.total} dossier{c.total > 1 ? 's' : ''}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}