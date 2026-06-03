'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, CircularProgress, Alert, TablePagination, IconButton, Tooltip, Chip
} from '@mui/material'
import { 
  AddCircleOutlined, SearchOutlined, LocationCityOutlined, 
  PublicOutlined, BlockOutlined, CheckCircleOutlined
} from '@mui/icons-material'
import { villeAPI } from '@/lib/api'

interface Ville {
  id: number
  nom: string
  pays: number
  pays_nom?: string 
  is_active: boolean // Aligné sur ton champ models.BooleanField Django
}

export default function ListeVillesPage() {
  const router = useRouter()
  const [villes, setVilles]       = useState<Ville[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')

  // Pagination Synchrone avec Django
  const [totalCount, setTotalCount]   = useState(0)
  const [page, setPage]               = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const charger = useCallback(async (q: string, p: number, limit: number) => {
    setLoading(true)
    try {
      const params = {
        search: q || undefined,
        page: p + 1,
        limit: limit
      }
      const { data } = await villeAPI.liste(params)
      
      if (data.results) {
        setVilles(data.results)
        setTotalCount(data.count)
      } else {
        setVilles(data)
        setTotalCount(data.length)
      }
    } catch (err) {
      console.error(err)
      setError('Erreur lors du chargement des villes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      charger(search, page, rowsPerPage)
    }, 350)
    return () => clearTimeout(t)
  }, [search, page, rowsPerPage, charger])

  // Remplacement du DELETE par une modification partielle (PATCH) du statut
  const handleToggleActive = async (id: number, actuelStatut: boolean) => {
    const action = actuelStatut ? 'désactiver' : 'réactiver'
    if (!window.confirm(`Voulez-vous vraiment ${action} cette ville ?`)) return
    
    try {
      // Modifie partiellement le champ sur le serveur
      await villeAPI.modifier(id, { is_active: !actuelStatut })
      charger(search, page, rowsPerPage)
    } catch (err) {
      console.error(err)
      setError('Impossible de modifier le statut de cette ville.')
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Gestion des Villes</Typography>
          <Typography variant="body2" color="text.secondary">
            Administration des agglomérations accueillant des agences Financières
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlined />}
          onClick={() => router.push('/admin/villes/nouveau')}
          sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' } }}
        >
          Ajouter une ville
        </Button>
      </Box>

      {/* Barre de recherche */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ py: '12px !important' }}>
          <TextField
            placeholder="Rechercher une ville..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small" 
            sx={{ width: 300 }}
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

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0f172a' }}>
              {['ID', 'Nom de la Ville', 'Pays Affilié', 'Statut', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600, py: 2 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={36} />
                </TableCell>
              </TableRow>
            ) : villes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucune ville répertoriée dans le système.
                </TableCell>
              </TableRow>
            ) : villes.map((v) => (
              <TableRow key={v.id} hover sx={{ opacity: v.is_active ? 1 : 0.65 }}>
                <TableCell sx={{ color: 'text.secondary', width: '80px' }}>#{v.id}</TableCell>
                <TableCell sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                  <LocationCityOutlined sx={{ color: v.is_active ? '#7c3aed' : 'text.disabled', fontSize: 20 }} />
                  <span style={{ textDecoration: v.is_active ? 'none' : 'line-through' }}>{v.nom}</span>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<PublicOutlined style={{ fontSize: 16 }} />}
                    label={v.pays_nom ?? `ID Pays: ${v.pays}`}
                    variant="outlined"
                    size="small"
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={v.is_active ? <CheckCircleOutlined /> : <BlockOutlined />}
                    label={v.is_active ? "Actif" : "Inactif"}
                    color={v.is_active ? "success" : "default"}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ width: '100px' }}>
                  <Tooltip title={v.is_active ? "Désactiver la ville" : "Activer la ville"}>
                    <IconButton 
                      size="small" 
                      color={v.is_active ? "warning" : "success"} 
                      onClick={() => handleToggleActive(v.id, v.is_active)}
                    >
                      {v.is_active ? <BlockOutlined fontSize="small" /> : <CheckCircleOutlined fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </TableContainer>
    </Box>
  )
}