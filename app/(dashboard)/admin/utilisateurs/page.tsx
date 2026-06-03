'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, Chip, CircularProgress,
  Alert, Switch, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, TablePagination
} from '@mui/material'
import { 
  AddCircleOutlined, SearchOutlined, 
  BusinessOutlined, FilterListOutlined 
} from '@mui/icons-material'
import { userAPI, agenceAPI } from '@/lib/api'

interface User {
  id:          number
  email:       string
  nom:         string
  prenom:      string
  role:        'conformite' | 'chef_agence' | 'chef_produit' | 'superadmin'
  is_active:   boolean
  agence:      number | null
  agence_nom:  string | null
  created_at:  string
}

interface Agence {
  id:   number
  nom:  string
  code: string
  ville_nom?: string // Aligné sur ta structure Django (jointure Ville)
}

const ROLE_LABELS: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'warning' | 'info' }> = {
  conformite:   { label: 'Conformité',      color: 'primary'   },
  chef_agence:  { label: "Chef d'agence",   color: 'warning'   },
  chef_produit: { label: 'Chef de produit',  color: 'info'      }, // ← Maintenant accepté !
  superadmin:   { label: 'Super Admin',     color: 'secondary' },
}

export default function UtilisateursPage() {
  const router = useRouter()
  const [users, setUsers]         = useState<User[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  
  // ── Filtres et Recherche ──
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('tous')
  const [statusFilter, setStatusFilter] = useState<string>('tous')

  // ── Pagination Synchrone avec Django ──
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage]             = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // ── Dialog affectation agence ──
  const [agences, setAgences]           = useState<Agence[]>([])
  const [dialogAgence, setDialogAgence] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [agenceChoisie, setAgenceChoisie] = useState<number | ''>('')
  const [saving, setSaving]             = useState(false)

  // Chargement des utilisateurs avec tous les critères
  const charger = useCallback(async (q: string, p: number, limit: number, role: string, status: string) => {
    setLoading(true)
    try {
      // Construction des paramètres pour Django REST Framework
      const params: Record<string, any> = {
        search: q || undefined,
        page: p + 1, // DRF commence à la page 1, MUI à 0
        limit: limit,
      }
      if (role !== 'tous') params.role = role
      if (status !== 'tous') params.is_active = status === 'actif'

      const { data } = await userAPI.liste(params)
      
      // DRF renvoie standard { count: X, results: [...] } ou un tableau brut si non configuré
      if (data.results) {
        setUsers(data.results)
        setTotalCount(data.count)
      } else {
        setUsers(data)
        setTotalCount(data.length)
      }
    } catch (err) {
      console.error(err)
      setError('Erreur lors du chargement des utilisateurs.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Effet de recherche avec Debounce + reset de page lors des changements de filtres
  useEffect(() => {
    const t = setTimeout(() => {
      charger(search, page, rowsPerPage, roleFilter, statusFilter)
    }, 350)
    return () => clearTimeout(t)
  }, [search, page, rowsPerPage, roleFilter, statusFilter, charger])

  // Charger le catalogue des agences au montage
  useEffect(() => {
    agenceAPI.liste()
      .then(({ data }) => setAgences(data.results ?? data))
      .catch((err) => console.error('Erreur agences catalogue', err))
  }, [])

  const handleChangePage = (_: any, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const toggleActif = async (user: User) => {
    try {
      await userAPI.modifier(user.id, { is_active: !user.is_active })
      setUsers((prev) => prev.map((u) =>
        u.id === user.id ? { ...u, is_active: !u.is_active } : u
      ))
    } catch {
      setError("Impossible de modifier l'état d'activité.")
    }
  }

  const ouvrirDialogAgence = (user: User) => {
    setSelectedUser(user)
    setAgenceChoisie(user.agence ?? '')
    setDialogAgence(true)
  }

  const affecterAgence = async () => {
    if (!selectedUser || agenceChoisie === '') return
    setSaving(true)
    try {
      await userAPI.modifier(selectedUser.id, { agence: agenceChoisie })
      const agence = agences.find((a) => a.id === agenceChoisie)
      setUsers((prev) => prev.map((u) =>
        u.id === selectedUser.id
          ? { ...u, agence: agenceChoisie as number, agence_nom: agence?.nom ?? null }
          : u
      ))
      setDialogAgence(false)
    } catch {
      setError("Erreur lors de l'enregistrement de la nouvelle agence.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* En-tête de section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Gestion des Utilisateurs</Typography>
          <Typography variant="body2" color="text.secondary">
            Suivi des permissions, activations de comptes et liaisons opérationnelles
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlined />}
          onClick={() => router.push('/admin/utilisateurs/nouveau')}
          sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' } }}
        >
          Nouvel utilisateur
        </Button>
      </Box>

      {/* Barre d'outils de filtrage intelligente */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, py: '16px !important' }}>
          <TextField
            placeholder="Rechercher par nom, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small" 
            sx={{ width: 280 }}
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

          <TextField
            select
            label="Rôle"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
            size="small"
            sx={{ width: 180 }}
          >
            <MenuItem value="tous">Tous les rôles</MenuItem>
            <MenuItem value="conformite">Conformité</MenuItem>
            <MenuItem value="chef_agence">Chef d'agence</MenuItem>
            <MenuItem value="chef_produit">Chef de produit</MenuItem>
            <MenuItem value="superadmin">Super Admin</MenuItem>
          </TextField>

          <TextField
            select
            label="Statut"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            size="small"
            sx={{ width: 150 }}
          >
            <MenuItem value="tous">Tous les états</MenuItem>
            <MenuItem value="actif">Actifs uniquement</MenuItem>
            <MenuItem value="inactif">Inactifs uniquement</MenuItem>
          </TextField>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Table de Données */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0f172a' }}>
              {['Nom complet', 'Adresse Email', 'Rôle Système', 'Agence Associée', 'Créé le', 'Statut', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600, py: 2 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={36} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  Aucun utilisateur ne correspond à vos critères de recherche.
                </TableCell>
              </TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id} hover sx={{ opacity: u.is_active ? 1 : 0.6 }}>
                <TableCell sx={{ fontWeight: 600 }}>
                  {u.prenom} {u.nom}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip
                    label={ROLE_LABELS[u.role]?.label ?? u.role}
                    color={ROLE_LABELS[u.role]?.color ?? 'default'}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                </TableCell>
                <TableCell>
                  {u.agence_nom ? (
                    <Chip
                      label={u.agence_nom}
                      size="small"
                      variant="outlined"
                      color="primary"
                      icon={<BusinessOutlined style={{ fontSize: 16 }} />}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Non localisé (Global)
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={u.is_active ? 'Suspendre l\'accès' : 'Activer l\'accès'}>
                    <Switch
                      checked={u.is_active}
                      onChange={() => toggleActif(u)}
                      color="success" 
                      size="small"
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {/* Une affectation d'agence n'a de sens que pour le chef d'agence */}
                  {u.role === 'chef_agence' ? (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<BusinessOutlined />}
                      onClick={() => ouvrirDialogAgence(u)}
                      sx={{ textTransform: 'none' }}
                    >
                      Affecter
                    </Button>
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Contrôle de la pagination connectée au State */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </TableContainer>

      {/* ── Dialog Modification affectation agence ── */}
      <Dialog open={dialogAgence} onClose={() => setDialogAgence(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Mutation ou Rattachement</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Spécifier l'établissement d'affectation pour : <strong>{selectedUser.prenom} {selectedUser.nom}</strong>
            </Typography>
          )}
          <TextField
            fullWidth select
            label="Choisir l'agence"
            value={agenceChoisie}
            onChange={(e) => setAgenceChoisie(Number(e.target.value))}
            size="small"
          >
            {agences.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.nom}</Typography>
                  <Typography variant="caption" color="text.secondary">Code : {a.code}</Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDialogAgence(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={affecterAgence}
            disabled={saving || agenceChoisie === ''}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <BusinessOutlined />}
            sx={{ bgcolor: '#0D47A1' }}
          >
            Muter l'utilisateur
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}