'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, Chip, CircularProgress,
  Alert, Switch, Tooltip
} from '@mui/material'
import { AddCircleOutlined, SearchOutlined } from '@mui/icons-material'
import { agenceAPI } from '@/lib/api'

interface Agence {
  id:                number
  nom:               string
  code:              string
  ville:             string
  is_active:         boolean
  nb_caissiers:      number
  nb_enregistrements: number
}

const VILLE_LABELS: Record<string, string> = {
  brazzaville:  'Brazzaville',
  pointe_noire: 'Pointe-Noire',
  ouesso:       'Ouesso',
}

export default function AgencesPage() {
  const router = useRouter()
  const [agences, setAgences] = useState<Agence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')

  const charger = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const { data } = await agenceAPI.liste({ search: q })
      setAgences(data.results ?? data)
    } catch {
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => charger(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const toggleActif = async (agence: Agence) => {
    try {
      await agenceAPI.modifier(agence.id, { is_active: !agence.is_active })
      setAgences((prev) => prev.map((a) =>
        a.id === agence.id ? { ...a, is_active: !a.is_active } : a
      ))
    } catch {
      setError('Erreur lors de la mise à jour.')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Agences</Typography>
          <Typography variant="body2" color="text.secondary">
            Gérez les agences et leurs caissiers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlined />}
          onClick={() => router.push('/admin/agences/nouvelle')}
        >
          Nouvelle agence
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <TextField
            placeholder="Rechercher par nom, code, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small" sx={{ width: 300 }}
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
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1e293b' }}>
              {['Code', 'Nom', 'Ville', 'Caissiers', 'Dossiers', 'Actif'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : agences.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucune agence trouvée
                </TableCell>
              </TableRow>
            ) : agences.map((a) => (
              <TableRow key={a.id} hover sx={{ opacity: a.is_active ? 1 : 0.5 }}>
                <TableCell>
                  <Chip label={a.code} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }}>{a.nom}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {VILLE_LABELS[a.ville] ?? a.ville}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{a.nb_caissiers}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{a.nb_enregistrements}</Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={a.is_active ? 'Désactiver' : 'Activer'}>
                    <Switch
                      checked={a.is_active}
                      onChange={() => toggleActif(a)}
                      color="success" size="small"
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