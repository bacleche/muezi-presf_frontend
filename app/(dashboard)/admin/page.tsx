'use client'
import { useEffect, useState } from 'react'
import {
  Box, Typography, Grid, Card, CardContent,
  CircularProgress, Alert, Divider
} from '@mui/material'
import {
  PeopleOutlined, BusinessOutlined,
  FolderZipOutlined, CategoryOutlined
} from '@mui/icons-material'
import { archiveAgenceAPI, userAPI } from '@/lib/api'

interface StatsBackend {
  total_archives:     number
  archives_completes: number
  par_produit:        { produit__nom: string; total: number }[]
  par_agence:         { agence__code: string; agence__nom: string; total: number }[]
  par_ville:          { agence__ville__nom: string; total: number }[]
}

const StatCard = ({ icon, label, value, color }: {
  icon:  React.ReactNode
  label: string
  value: number | string
  color: string
}) => (
  <Card sx={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
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
  const [stats, setStats]         = useState<StatsBackend | null>(null)
  const [nbUsers, setNbUsers]     = useState<number>(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    const charger = async () => {
      try {
        const [{ data: s }, { data: u }] = await Promise.all([
          archiveAgenceAPI.stats(),
          userAPI.liste(),
        ])
        setStats(s)
        setNbUsers(u.count ?? u.length)
      } catch (err) {
        console.error(err)
        setError('Erreur lors du chargement des statistiques depuis l\'API.')
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
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Tableau de bord Superadmin
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Suivi global de l'exploitation et de l'archivage financier
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Grid Conteneur Principal des cartes */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard icon={<FolderZipOutlined />} label="Total Archives Agences" value={stats?.total_archives ?? 0} color="#0D47A1" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard icon={<PeopleOutlined />}    label="Utilisateurs Plateforme" value={nbUsers} color="#7c3aed" />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <StatCard icon={<BusinessOutlined />}  label="Agences Actives" value={stats?.par_agence?.length ?? 0} color="#16a34a" />
        </Grid>
      </Grid>

      {/* Grid Conteneur des Tableaux Analytiques */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Section Activité par Agence */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessOutlined sx={{ color: '#0D47A1' }} /> Volume d'archives par agence
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {stats?.par_agence && stats.par_agence.length > 0 ? (
                stats.par_agence.map((a, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: i < stats.par_agence.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                    <Typography variant="body2">{a.agence__nom} ({a.agence__code})</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0D47A1' }}>{a.total} archive{a.total > 1 ? 's' : ''}</Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Aucune donnée disponible</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Section Activité par Produit */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryOutlined sx={{ color: '#7c3aed' }} /> Répartition par Produit
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {stats?.par_produit && stats.par_produit.length > 0 ? (
                stats.par_produit.map((p, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: i < stats.par_produit.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {p.produit__nom.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#7c3aed' }}>{p.total} dépôt{p.total > 1 ? 's' : ''}</Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Aucune donnée disponible</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}