'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, Chip, CircularProgress,
  Alert, Switch, Tooltip,
} from '@mui/material'
import {
  AddCircleOutlined, SearchOutlined, BusinessOutlined,
} from '@mui/icons-material'
import { agenceAPI } from '@/lib/api'

interface Agence {
  id: number
  nom: string
  code: string
  ville_nom?: string   // Nom en clair de la ville
  pays_nom?: string    // Nom en clair du pays
  is_active: boolean
}

// Normalise une chaîne : minuscules + suppression des accents
const normaliser = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function AgencesPage() {
  const router = useRouter()
  const [agences, setAgences] = useState<Agence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await agenceAPI.liste({})
      setAgences(data.results ?? data)
    } catch (err) {
      console.error(err)
      setError('Erreur lors du chargement des agences.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  // Recherche dynamique côté client (code + nom)
  const agencesFiltrees = useMemo(() => {
    const q = normaliser(search.trim())
    if (!q) return agences
    return agences.filter((a) =>
      normaliser(a.code).includes(q) || normaliser(a.nom).includes(q)
    )
  }, [agences, search])

  const toggleActif = async (agence: Agence) => {
    try {
      await agenceAPI.modifier(agence.id, { is_active: !agence.is_active })
      setAgences((prev) => prev.map((a) =>
        a.id === agence.id ? { ...a, is_active: !a.is_active } : a
      ))
    } catch (err) {
      console.error(err)
      setError('Erreur lors du changement de statut.')
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Gestion des Agences</Typography>
          <Typography variant="body2" color="text.secondary">
            Suivi des succursales financières
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlined />}
          onClick={() => router.push('/admin/agences/nouvelle')}
          sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' } }}
        >
          Nouvelle agence
        </Button>
      </Box>

      {/* Recherche */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ py: '12px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            placeholder="Rechercher par nom, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small" sx={{ width: 320 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          {!loading && (
            <Typography variant="body2" color="text.secondary">
              {agencesFiltrees.length} / {agences.length} agence(s)
            </Typography>
          )}
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Table de Données */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0f172a' }}>
              {['Code', 'Nom de l\'Agence', 'Actif'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600, py: 2 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={36} />
                </TableCell>
              </TableRow>
            ) : agencesFiltrees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  {search ? `Aucune agence ne correspond à « ${search} »` : 'Aucune agence trouvée'}
                </TableCell>
              </TableRow>
            ) : agencesFiltrees.map((a) => (
              <TableRow key={a.id} hover sx={{ opacity: a.is_active ? 1 : 0.65 }}>
                {/* Code */}
                <TableCell sx={{ width: '100px' }}>
                  <Chip label={a.code} size="small" variant="outlined" color="primary" sx={{ fontWeight: 700 }} />
                </TableCell>
                
                {/* Nom */}
                <TableCell sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                  <BusinessOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
                  {a.nom}
                </TableCell>
                
                {/* Statut Switch */}
                <TableCell sx={{ width: '100px' }}>
                  <Tooltip title={a.is_active ? 'Désactiver l\'agence' : 'Activer l\'agence'}>
                    <Switch
                      checked={a.is_active}
                      onChange={() => toggleActif(a)}
                      color="success" 
                      size="small"
                    />
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}