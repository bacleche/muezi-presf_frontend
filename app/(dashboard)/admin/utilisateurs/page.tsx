'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, Chip, CircularProgress,
  Alert, Switch, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem
} from '@mui/material'
import { AddCircleOutlined, SearchOutlined, BusinessOutlined } from '@mui/icons-material'
import { userAPI, agenceAPI } from '@/lib/api'

interface User {
  id:          number
  email:       string
  nom:         string
  prenom:      string
  role:        'caissier' | 'conformite' | 'superadmin'
  is_active:   boolean
  agence:      number | null
  agence_nom:  string | null
  created_at:  string
}

interface Agence {
  id:   number
  nom:  string
  code: string
  ville: string
}

const ROLE_LABELS: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' }> = {
  caissier:   { label: 'Caissier',    color: 'default'   },
  conformite: { label: 'Conformité',  color: 'primary'   },
  superadmin: { label: 'Super Admin', color: 'secondary' },
}

const VILLE_LABELS: Record<string, string> = {
  brazzaville:  'Brazzaville',
  pointe_noire: 'Pointe-Noire',
  ouesso:       'Ouesso',
}

export default function UtilisateursPage() {
  const router = useRouter()
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')

  // ── Dialog affectation agence ──
  const [agences, setAgences]           = useState<Agence[]>([])
  const [dialogAgence, setDialogAgence] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [agenceChoisie, setAgenceChoisie] = useState<number | ''>('')
  const [saving, setSaving]             = useState(false)

  const charger = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const { data } = await userAPI.liste({ search: q })
      setUsers(data.results ?? data)
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

  // Charger les agences une seule fois
  useEffect(() => {
    agenceAPI.liste({ is_active: true }).then(({ data }) =>
      setAgences(data.results ?? data)
    )
  }, [])

  const toggleActif = async (user: User) => {
    try {
      await userAPI.modifier(user.id, { is_active: !user.is_active })
      setUsers((prev) => prev.map((u) =>
        u.id === user.id ? { ...u, is_active: !u.is_active } : u
      ))
    } catch {
      setError('Erreur lors de la mise à jour.')
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
      setError("Erreur lors de l'affectation.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Utilisateurs</Typography>
          <Typography variant="body2" color="text.secondary">
            Gérez les comptes et les accès
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlined />}
          onClick={() => router.push('/admin/utilisateurs/nouveau')}
        >
          Nouvel utilisateur
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <TextField
            placeholder="Rechercher par nom, email..."
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

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1e293b' }}>
              {['Nom', 'Email', 'Rôle', 'Agence', 'Créé le', 'Actif', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id} hover sx={{ opacity: u.is_active ? 1 : 0.5 }}>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }}>
                    {u.prenom} {u.nom}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {u.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={ROLE_LABELS[u.role]?.label ?? u.role}
                    color={ROLE_LABELS[u.role]?.color}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {u.agence_nom ? (
                    <Chip
                      label={u.agence_nom}
                      size="small"
                      variant="outlined"
                      color="primary"
                      icon={<BusinessOutlined />}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={u.is_active ? 'Désactiver' : 'Activer'}>
                    <Switch
                      checked={u.is_active}
                      onChange={() => toggleActif(u)}
                      color="success" size="small"
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {/* Bouton affecter — visible pour tous les rôles */}
                  <Tooltip title="Affecter à une agence">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<BusinessOutlined />}
                      onClick={() => ouvrirDialogAgence(u)}
                    >
                      Agence
                    </Button>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Dialog affectation agence ── */}
      <Dialog
        open={dialogAgence}
        onClose={() => setDialogAgence(false)}
        maxWidth="xs" fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Affecter une agence
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Utilisateur : <strong>{selectedUser.prenom} {selectedUser.nom}</strong>
            </Typography>
          )}
          <TextField
            fullWidth select
            label="Agence"
            value={agenceChoisie}
            onChange={(e) => setAgenceChoisie(Number(e.target.value))}
            size="small"
          >
            {agences.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {a.nom}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {a.code} · {VILLE_LABELS[a.ville] ?? a.ville}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDialogAgence(false)}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={affecterAgence}
            disabled={saving || agenceChoisie === ''}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <BusinessOutlined />}
          >
            Affecter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}