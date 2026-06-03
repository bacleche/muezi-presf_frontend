'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, TextField,
  InputAdornment, CircularProgress, Alert, IconButton, Tooltip
} from '@mui/material'
import { 
  SearchOutlined, PersonAddOutlined, 
  BadgeOutlined, RefreshOutlined 
} from '@mui/icons-material'
import { clientAPI } from '@/lib/api'

interface Client {
  id: number
  nom: string
  prenom: string
  telephone?: string
  email?: string
  cni?: string // URL du fichier
  adresse?: string
  created_at: string
}

export default function ClientsAgencePage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const chargerClients = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Le backend Django filtre automatiquement selon l'agence du Chef connecté
      const { data } = await clientAPI.liste({ search: search || undefined })
      setClients(data.results ?? data)
    } catch (err) {
      console.error(err)
      setError('Impossible de récupérer la liste des clients.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      chargerClients()
    }, 400) // Anti-rebond pour éviter de surcharger l'API à chaque lettre tapée
    return () => clearTimeout(delayDebounce)
  }, [search, chargerClients])

  return (
    <Box sx={{ p: 1 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Portefeuille Clients</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestion des clients rattachés à votre agence et suivi des pièces de conformité
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddOutlined />}
          onClick={() => router.push('/chef-agence/clients/nouveau')}
          sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' }, textTransform: 'none', borderRadius: 2 }}
        >
          Enregistrer un Client
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Barre de Recherche */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder="Rechercher par nom, prénom ou numéro de pièce d'identité..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                    input: {
                    startAdornment: (
                        <InputAdornment position="start">
                        <SearchOutlined color="action" />
                        </InputAdornment>
                    ),
                    endAdornment: loading ? <CircularProgress size={20} /> : null
                        }
                    }}
            />
      </Paper>

      {/* Tableau des clients */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0f172a' }}>
              {['Nom & Prénom', 'Téléphone', 'Email', 'Date d\'inscription', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600, py: 2 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucun client trouvé pour cette recherche ou pour cette agence.
                </TableCell>
              </TableRow>
            ) : clients.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{`${c.nom.toUpperCase()} ${c.prenom}`}</TableCell>
                <TableCell>{c.adresse || '—'}</TableCell>
                <TableCell>{c.email || '—'}</TableCell>
                <TableCell>{new Date(c.created_at).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>
                  <Tooltip title="Gérer les pièces d'identité">
                    <IconButton 
                      color="primary" 
                      onClick={() => router.push(`/chef-agence/clients/${c.id}/pieces`)}
                    >
                      <BadgeOutlined />
                    </IconButton>
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