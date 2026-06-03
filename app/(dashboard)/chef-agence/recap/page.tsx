'use client'
import { useEffect, useState } from 'react'
import { Box, Typography, Grid, Paper } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { clientAPI } from '@/lib/api'

// Couleurs pour les graphiques
const COLORS = ['#0D47A1', '#1976D2', '#64B5F6', '#2196F3'];

export default function RecapConformitePage() {
  const [stats, setStats] = useState({ totalClients: 0, totalPieces: 0, repartition: [] as any[] })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Appelez ici votre endpoint optimisé (stats-conformite)
        const { data } = await clientAPI.statschefAgence() 
        setStats(data)
      } catch (err) {
        console.error("Erreur chargement stats", err)
      }
    }
    fetchData()
  }, [])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Récapitulatif Conformité</Typography>
      
      <Grid container spacing={3}>
        {/* KPI Cards */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Total Clients</Typography>
            <Typography variant="h3">{stats.totalClients}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Total Pièces</Typography>
            <Typography variant="h3" color="primary">{stats.totalPieces}</Typography>
          </Paper>
        </Grid>

        {/* Graphique 1 : Répartition par type de pièce */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Répartition des pièces</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={stats.repartition} dataKey="count" nameKey="type_piece" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {stats.repartition.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Graphique 2 : Visualisation en barres */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Volume par type</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={stats.repartition}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type_piece" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0D47A1" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}