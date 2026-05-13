'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Grid, Card, CardContent,
  Button, CircularProgress, Divider, Chip, Avatar
} from '@mui/material'
import {
  AddCircleOutlined, ReceiptOutlined, HourglassEmptyOutlined,
  CheckCircleOutlined, CancelOutlined, ArrowForwardOutlined,
  TrendingUpOutlined, VisibilityOutlined
} from '@mui/icons-material'
import { enregistrementAPI } from '@/lib/api'
import useAuthStore from '@/store/authStore'
import StatutBadge from '@/components/enregistrements/StatutBadge'

interface Enregistrement {
  id:            number
  nom_client:    string
  prenom_client: string
  montant:       string
  numero_piece:  string
  date_paiement: string
  statut:        'en_attente' | 'valide' | 'rejete'
  documents_complets: boolean
}

interface Stats {
  total:      number
  en_attente: number
  valides:    number
  rejetes:    number
  montant_total_valide: number | string
}

type MuiColor = 'primary' | 'warning' | 'success' | 'error'

interface StatCardProps {
  icon:    React.ReactNode
  label:   string
  value:   number | string
  color:   MuiColor
  sub?:    string
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

export default function CaissierDashboardPage() {
  const router = useRouter()
  const user   = useAuthStore((s) => s.user)

  const [stats, setStats]               = useState<Stats | null>(null)
  const [recents, setRecents]           = useState<Enregistrement[]>([])
  const [loading, setLoading]           = useState(true)

useEffect(() => {
  const charger = async () => {
    try {
      const { data } = await enregistrementAPI.liste({ page_size: 100 })
      const tous: Enregistrement[] = data.results || data

      // Calcul des stats localement
      const computed: Stats = {
        total:      tous.length,
        en_attente: tous.filter((e) => e.statut === 'en_attente').length,
        valides:    tous.filter((e) => e.statut === 'valide').length,
        rejetes:    tous.filter((e) => e.statut === 'rejete').length,
        montant_total_valide: tous
          .filter((e) => e.statut === 'valide')
          .reduce((sum, e) => sum + Number(e.montant), 0),
      }

      setStats(computed)
      setRecents(tous.slice(0, 5)) // les 5 plus récents
    } finally {
      setLoading(false)
    }
  }
  charger()
}, [])

  const heure = new Date().getHours()
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* ── Salutation ── */}
      <Box sx={{
        mb: 4, p: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #1e293b 0%, #0D47A1 100%)',
        color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 52, height: 52, fontSize: 20 }}>
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {salutation}, {user?.prenom} 👋
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlined />}
          onClick={() => router.push('/caissier/nouveau')}
          sx={{ bgcolor: 'white', color: '#0D47A1', fontWeight: 700, '&:hover': { bgcolor: '#f1f5f9' } }}
        >
          Nouvel enregistrement
        </Button>
      </Box>

      {/* ── Cartes stats ── */}
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
            sub="En cours de validation"
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
            sub="À corriger"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ── Montant total validé ── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUpOutlined color="success" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Monitoring
                </Typography>
              </Box>
         

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Taux de validation</Typography>
                  <Chip
                    label={
                      stats?.total
                        ? `${Math.round((stats.valides / stats.total) * 100)} %`
                        : '0 %'
                    }
                    color="success" size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Taux de rejet</Typography>
                  <Chip
                    label={
                      stats?.total
                        ? `${Math.round((stats.rejetes / stats.total) * 100)} %`
                        : '0 %'
                    }
                    color="error" size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Enregistrements récents ── */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Enregistrements récents
                </Typography>
                <Button
                  size="small" endIcon={<ArrowForwardOutlined />}
                  onClick={() => router.push('/caissier/enregistrements')}
                >
                  Voir tout
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {recents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">Aucun enregistrement pour le moment.</Typography>
                  <Button
                    variant="contained" startIcon={<AddCircleOutlined />}
                    sx={{ mt: 2 }} onClick={() => router.push('/caissier/nouveau')}
                  >
                    Créer le premier
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {recents.map((enreg) => (
                    <Box key={enreg.id} sx={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5, borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36, fontSize: 14 }}>
                          {enreg.prenom_client[0]}{enreg.nom_client[0]}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                            {enreg.prenom_client} {enreg.nom_client} •{' '}
                            {enreg.numero_piece}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(enreg.date_paiement).toLocaleDateString('fr-FR')} 
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StatutBadge statut={enreg.statut} />
                        <Button
                          size="small" variant="outlined"
                          startIcon={<VisibilityOutlined />}
                          onClick={() => router.push(`/caissier/${enreg.id}`)}
                          sx={{ minWidth: 'auto', px: 1.5 }}
                        >
                          Voir
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}