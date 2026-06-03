'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Grid, Card, CardContent, 
  CircularProgress, Alert, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow
} from '@mui/material'
import { 
  Inventory2Outlined, 
  CheckCircleOutlined, 
  ErrorOutlined,
  BusinessOutlined,
  MapOutlined
} from '@mui/icons-material'
import { StatsAPI } from '@/lib/api'

// Correspondance exacte avec les clés d'annotations renvoyées par ton queryset Django
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

// Map pour rendre les codes de produits élégants à l'écran
const LABELS_PRODUITS: Record<string, string> = {
  western_union: 'Western Union',
  change:        'Change',
  visa:          'VISA',
  momo:          'MOMO',
  airtel_money:  'Airtel Money',
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const chargerStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await StatsAPI.stats()
      setStats(data)
    } catch (err) {
      console.error(err)
      setError('Impossible de récupérer les statistiques du système d’archivage.')
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

  // Calcul du volume incomplet basé sur tes filtres de complétude Django
  const totalArchives = stats?.total_archives ?? 0
  const completes = stats?.archives_completes ?? 0
  const incompletes = totalArchives - completes

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Statistiques de Conformité</Typography>
        <Typography variant="body2" color="text.secondary">
          Analyse de complétude des arrêtés de caisse et documents d'exploitation journaliers
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ── Cartes de KPI Majeurs ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#E3F2FD', borderRadius: 2, display: 'flex' }}>
                <Inventory2Outlined sx={{ color: '#0D47A1', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Total Enveloppes Journalières</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{totalArchives}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#E8F5E9', borderRadius: 2, display: 'flex' }}>
                <CheckCircleOutlined sx={{ color: '#2E7D32', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Dossiers 100% Complets</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>{completes}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#FFEBEE', borderRadius: 2, display: 'flex' }}>
                <ErrorOutlined sx={{ color: '#C62828', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Dossiers Incomplets (Manquants)</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#C62828' }}>{incompletes}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Répartitions Analytiques (Data issues des Annotations Django) ── */}
      <Grid container spacing={3}>
        {/* Par Produit */}
        <Grid size={{ xs: 12, md: 4 }}>
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Box sx={{ p: 2, bgcolor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Inventory2Outlined sx={{ fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Par Produit</Typography>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Volume</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.par_produit.map((item, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {LABELS_PRODUITS[item.produit__nom || ''] || item.produit__nom}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0D47A1' }}>{item.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Par Agence */}
        <Grid size={{ xs: 12, md: 4 }}>
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Box sx={{ p: 2, bgcolor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessOutlined sx={{ fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Par Agence</Typography>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Agence</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Volume</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.par_agence.map((item, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.agence__code}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.agence__nom}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0D47A1' }}>{item.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Par Ville */}
        <Grid size={{ xs: 12, md: 4 }}>
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Box sx={{ p: 2, bgcolor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
              <MapOutlined sx={{ fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Par Zone / Ville</Typography>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Ville</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Volume</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.par_ville.map((item, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{item.agence__ville__nom || 'Non spécifiée'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0D47A1' }}>{item.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  )
}