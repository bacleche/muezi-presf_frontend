'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress,
  Alert, IconButton, Tooltip
} from '@mui/material'
import { 
  AddCircleOutlined, DeleteOutlined, 
  AccountBalanceWalletOutlined, RefreshOutlined 
} from '@mui/icons-material'
import { produitAPI } from '@/lib/api'

interface Produit {
  id: number
  nom: string // Contiendra la valeur brute (ex: 'western_union')
  is_active: boolean
}

// Map local pour l'affichage propre des labels
const LABELS_PRODUITS: Record<string, string> = {
  western_union: 'Western Union',
  change:        'Change',
  visa:          'VISA',
  momo:          'MOMO',
  airtel_money:  'Airtel Money',
}

export default function ProduitsPage() {
  const router = useRouter()
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const chargerProduits = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await produitAPI.liste()
      setProduits(data.results ?? data)
    } catch (err) {
      console.error(err)
      setError('Impossible de charger le catalogue des produits.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    chargerProduits()
  }, [chargerProduits])

  const handleSupprimer = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce produit du catalogue actif ?')) return
    try {
      await produitAPI.supprimer(id)
      setProduits((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error(err)
      setError('Erreur lors de la suppression du produit.')
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Catalogue des Produits</Typography>
          <Typography variant="body2" color="text.secondary">
            Suivi et activation des flux financiers de l'application
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <IconButton onClick={chargerProduits} disabled={loading} color="primary">
            <RefreshOutlined />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlined />}
            onClick={() => router.push('/admin/produits/nouveau')}
            sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' } }}
          >
            Activer un produit
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0f172a' }}>
              {['Code Système / Clé', 'Nom du Produit', 'Statut', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600, py: 2 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={36} />
                </TableCell>
              </TableRow>
            ) : produits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  Aucun produit actif pour le moment.
                </TableCell>
              </TableRow>
            ) : produits.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
                  {p.nom}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalanceWalletOutlined sx={{ fontSize: 18, color: '#0D47A1' }} />
                    {LABELS_PRODUITS[p.nom] || p.nom}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={p.is_active ? 'Actif' : 'Inactif'}
                    color={p.is_active ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Désactiver / Supprimer">
                    <IconButton size="small" color="error" onClick={() => handleSupprimer(p.id)}>
                      <DeleteOutlined sx={{ fontSize: 18 }} />
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