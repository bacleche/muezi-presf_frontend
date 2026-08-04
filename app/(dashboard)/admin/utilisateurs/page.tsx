'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, Chip, CircularProgress,
  Alert, Switch, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, TablePagination,
  Divider,
} from '@mui/material'
import {
  AddCircleOutlined, SearchOutlined,
  BusinessOutlined, EditOutlined,
} from '@mui/icons-material'
import { userAPI, agenceAPI, paysAPI, villeAPI } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────

interface User {
  id:         number
  email:      string
  nom:        string
  prenom:     string
  role:       'conformite' | 'chef_agence' | 'chef_produit' | 'superadmin'
  is_active:  boolean
  agence:     number | null
  agence_nom: string | null
  pays:       number | null
  ville:      number | null      // NOUVEAU
  ville_nom:  string | null      // NOUVEAU
  created_at: string
}

interface Agence {
  id:        number
  nom:       string
  code:      string
  ville_nom?: string
}

interface Pays {
  id:  number
  nom: string
}

interface Ville {              // NOUVEAU
  id:   number
  nom:  string
  pays: number
}

// ── Constantes ─────────────────────────────────────────────────

const ROLE_LABELS: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'warning' | 'info' }> = {
  conformite:   { label: 'Conformité',      color: 'primary'   },
  chef_agence:  { label: "Chef d'agence",   color: 'warning'   },
  chef_produit: { label: 'Chef de produit', color: 'info'      },
  superadmin:   { label: 'Super Admin',     color: 'secondary' },
}

const ROLES = [
  { value: 'conformite',   label: 'Conformité' },
  { value: 'chef_agence',  label: "Chef d'agence" },
  { value: 'chef_produit', label: 'Chef de produit' },
  { value: 'superadmin',   label: 'Super Admin' },
]

// Rôles pour lesquels le champ Pays doit apparaître dans le dialog de modification
const ROLES_AVEC_PAYS = ['conformite', 'chef_produit']

const FORM_VIDE = {
  email: '', nom: '', prenom: '', role: '',
  password: '', agence: '' as number | '', pays: '' as number | '',
  ville: '' as number | '',   // NOUVEAU
}

// ── Page principale ────────────────────────────────────────────

export default function UtilisateursPage() {
  const router = useRouter()

  const [users,        setUsers]        = useState<User[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  // Filtres
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState('tous')
  const [statusFilter, setStatusFilter] = useState('tous')

  // Pagination
  const [totalCount,   setTotalCount]   = useState(0)
  const [page,         setPage]         = useState(0)
  const [rowsPerPage,  setRowsPerPage]  = useState(10)

  // Catalogues
  const [agences,      setAgences]      = useState<Agence[]>([])
  const [paysList,     setPaysList]     = useState<Pays[]>([])
  const [villesList,   setVillesList]   = useState<Ville[]>([])   // NOUVEAU

  // Dialog affectation agence
  const [dialogAgence,   setDialogAgence]   = useState(false)
  const [selectedUser,   setSelectedUser]   = useState<User | null>(null)
  const [agenceChoisie,  setAgenceChoisie]  = useState<number | ''>('')
  const [saving,         setSaving]         = useState(false)

  // Dialog modification utilisateur
  const [dialogEdit,  setDialogEdit]  = useState(false)
  const [editForm,    setEditForm]    = useState<typeof FORM_VIDE>(FORM_VIDE)
  const [editUserId,  setEditUserId]  = useState<number | null>(null)
  const [editError,   setEditError]   = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // ── Chargement ──────────────────────────────────────────────

  const charger = useCallback(async (q: string, p: number, limit: number, role: string, status: string) => {
    setLoading(true)
    try {
      const params: Record<string, any> = {
        search: q || undefined,
        page: p + 1,
        limit,
      }
      if (role !== 'tous')   params.role      = role
      if (status !== 'tous') params.is_active = status === 'actif'

      const { data } = await userAPI.liste(params)
      if (data.results) {
        setUsers(data.results)
        setTotalCount(data.count)
      } else {
        setUsers(data)
        setTotalCount(data.length)
      }
    } catch {
      setError('Erreur lors du chargement des utilisateurs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      charger(search, page, rowsPerPage, roleFilter, statusFilter)
    }, 350)
    return () => clearTimeout(t)
  }, [search, page, rowsPerPage, roleFilter, statusFilter, charger])

  useEffect(() => {
    agenceAPI.liste().then(({ data }) => setAgences(data.results ?? data))
    paysAPI.liste().then(({ data }) => setPaysList(data.results ?? data))
    villeAPI.liste().then(({ data }) => setVillesList(data.results ?? data))   // NOUVEAU
  }, [])

  // NOUVEAU : villes filtrées selon le pays sélectionné dans le dialog édition
  const villesFiltreesEdit = editForm.pays
    ? villesList.filter(v => v.pays === Number(editForm.pays))
    : []

  // ── Toggle actif ────────────────────────────────────────────

  const toggleActif = async (user: User) => {
    try {
      await userAPI.modifier(user.id, { is_active: !user.is_active })
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, is_active: !u.is_active } : u
      ))
    } catch {
      setError("Impossible de modifier l'état d'activité.")
    }
  }

  // ── Affectation agence ──────────────────────────────────────

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
      const agence = agences.find(a => a.id === agenceChoisie)
      setUsers(prev => prev.map(u =>
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

  // ── Modification utilisateur ────────────────────────────────

  const ouvrirDialogEdit = (user: User) => {
    setEditUserId(user.id)
    setEditForm({
      email:    user.email,
      nom:      user.nom,
      prenom:   user.prenom,
      role:     user.role,
      password: '',                      // vide = pas de changement
      agence:   user.agence ?? '',
      pays:     user.pays   ?? '',
      ville:    user.ville  ?? '',        // NOUVEAU
    })
    setEditError('')
    setDialogEdit(true)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm(prev => {
      const updated = { ...prev, [name]: value }
      if (name === 'role') {
        if (value !== 'chef_agence') updated.agence = ''
        if (!ROLES_AVEC_PAYS.includes(value)) updated.pays = ''
        if (value !== 'conformite') updated.ville = ''   // NOUVEAU
      }
      if (name === 'pays') {
        updated.ville = ''   // NOUVEAU : reset ville si on change de pays
      }
      return updated
    })
  }

  const sauvegarderEdit = async () => {
    if (!editUserId) return
    setEditLoading(true)
    setEditError('')
    try {
      const payload: Record<string, any> = {
        email:  editForm.email,
        nom:    editForm.nom,
        prenom: editForm.prenom,
        role:   editForm.role,
      }

      // Mot de passe : seulement si renseigné
      if (editForm.password.trim()) {
        if (editForm.password.length < 8) {
          setEditError('Le mot de passe doit contenir au moins 8 caractères.')
          setEditLoading(false)
          return
        }
        payload.password = editForm.password
      }

      // Champ agence : chef_agence uniquement
      if (editForm.role === 'chef_agence') {
        if (editForm.agence === '') {
          setEditError("Veuillez sélectionner une agence affiliée.")
          setEditLoading(false)
          return
        }
        payload.agence = Number(editForm.agence)
      } else {
        payload.agence = null
      }

      // Champ pays : conformite + chef_produit
      if (ROLES_AVEC_PAYS.includes(editForm.role)) {
        if (editForm.pays === '') {
          setEditError("Veuillez sélectionner un pays.")
          setEditLoading(false)
          return
        }
        payload.pays = Number(editForm.pays)
      } else {
        payload.pays = null
      }

      // NOUVEAU : champ ville — conformité uniquement, optionnel
      if (editForm.role === 'conformite') {
        payload.ville = editForm.ville ? Number(editForm.ville) : null
      } else {
        payload.ville = null
      }

      await userAPI.modifier(editUserId, payload)

      // Mise à jour locale
      const agence = agences.find(a => a.id === Number(editForm.agence))
      const ville  = villesList.find(v => v.id === Number(editForm.ville))   // NOUVEAU
      setUsers(prev => prev.map(u =>
        u.id === editUserId
          ? {
              ...u,
              email:      payload.email,
              nom:        payload.nom,
              prenom:     payload.prenom,
              role:       payload.role,
              agence:     payload.agence ?? null,
              agence_nom: agence?.nom ?? null,
              pays:       payload.pays ?? null,
              ville:      payload.ville ?? null,          // NOUVEAU
              ville_nom:  payload.ville ? (ville?.nom ?? null) : null,   // NOUVEAU
            }
          : u
      ))
      setDialogEdit(false)
    } catch (err: any) {
      const data = err?.response?.data
      if (data) {
        const msgs = Object.entries(data).map(([k, v]) =>
          `${k} : ${Array.isArray(v) ? v.join(' ') : JSON.stringify(v)}`
        )
        setEditError(msgs[0] || "Erreur lors de la modification.")
      } else {
        setEditError("Erreur lors de la modification.")
      }
    } finally {
      setEditLoading(false)
    }
  }

  // ── Rendu ───────────────────────────────────────────────────

  return (
    <Box sx={{ p: 1 }}>

      {/* En-tête */}
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

      {/* Filtres */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, py: '16px !important' }}>
          <TextField
            placeholder="Rechercher par nom, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            size="small" sx={{ width: 280 }}
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
          <TextField select label="Rôle" value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(0) }}
            size="small" sx={{ width: 180 }}>
            <MenuItem value="tous">Tous les rôles</MenuItem>
            {ROLES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </TextField>
          <TextField select label="Statut" value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
            size="small" sx={{ width: 150 }}>
            <MenuItem value="tous">Tous les états</MenuItem>
            <MenuItem value="actif">Actifs uniquement</MenuItem>
            <MenuItem value="inactif">Inactifs uniquement</MenuItem>
          </TextField>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0f172a' }}>
              {['Nom complet', 'Adresse Email', 'Rôle Système', 'Agence / Ville', 'Créé le', 'Statut', 'Actions'].map(h => (
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
            ) : users.map(u => (
              <TableRow key={u.id} hover sx={{ opacity: u.is_active ? 1 : 0.6 }}>
                <TableCell sx={{ fontWeight: 600 }}>{u.prenom} {u.nom}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip
                    label={ROLE_LABELS[u.role]?.label ?? u.role}
                    color={ROLE_LABELS[u.role]?.color ?? 'default'}
                    size="small" sx={{ fontWeight: 500 }}
                  />
                </TableCell>
                <TableCell>
                  {/* NOUVEAU : logique d'affichage étendue à agence / ville / conformité principale */}
                  {u.agence_nom ? (
                    <Chip label={u.agence_nom} size="small" variant="outlined" color="primary"
                      icon={<BusinessOutlined style={{ fontSize: 16 }} />} />
                  ) : u.role === 'conformite' ? (
                    u.ville_nom ? (
                      <Chip label={`Ville : ${u.ville_nom}`} size="small" variant="outlined" color="secondary" />
                    ) : (
                      <Chip label="Conformité principale" size="small" variant="outlined" color="default" />
                    )
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Non localisé
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={u.is_active ? "Suspendre l'accès" : "Activer l'accès"}>
                    <Switch checked={u.is_active} onChange={() => toggleActif(u)} color="success" size="small" />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.75 }}>
                    {/* Modifier */}
                    <Tooltip title="Modifier l'utilisateur">
                      <Button
                        size="small" variant="outlined"
                        startIcon={<EditOutlined sx={{ fontSize: 14 }} />}
                        onClick={() => ouvrirDialogEdit(u)}
                        sx={{ textTransform: 'none', fontSize: 12 }}
                      >
                        Modifier
                      </Button>
                    </Tooltip>
                    {/* Affecter agence — chef_agence seulement */}
                    {u.role === 'chef_agence' && (
                      <Tooltip title="Muter vers une agence">
                        <Button
                          size="small" variant="outlined" color="warning"
                          startIcon={<BusinessOutlined sx={{ fontSize: 14 }} />}
                          onClick={() => ouvrirDialogAgence(u)}
                          sx={{ textTransform: 'none', fontSize: 12 }}
                        >
                          Affecter
                        </Button>
                      </Tooltip>
                    )}
                  </Box>
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
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
          labelRowsPerPage="Lignes par page :"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </TableContainer>

      {/* ── Dialog affectation agence ── */}
      <Dialog open={dialogAgence} onClose={() => setDialogAgence(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Mutation ou Rattachement</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Agence d'affectation pour : <strong>{selectedUser.prenom} {selectedUser.nom}</strong>
            </Typography>
          )}
          <TextField fullWidth select label="Choisir l'agence"
            value={agenceChoisie}
            onChange={e => setAgenceChoisie(Number(e.target.value))}
            size="small">
            {agences.map(a => (
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
          <Button variant="contained" onClick={affecterAgence}
            disabled={saving || agenceChoisie === ''}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <BusinessOutlined />}
            sx={{ bgcolor: '#0D47A1' }}>
            Muter l'utilisateur
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog modification utilisateur ── */}
      <Dialog open={dialogEdit} onClose={() => setDialogEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
          Modifier l'utilisateur
          {editUserId && (
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.25 }}>
              ID #{editUserId} — {editForm.prenom} {editForm.nom}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}

          {/* Identité */}
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Identité
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 2 }}>
            <TextField fullWidth label="Prénom" name="prenom" size="small"
              value={editForm.prenom} onChange={handleEditChange} />
            <TextField fullWidth label="Nom" name="nom" size="small"
              value={editForm.nom} onChange={handleEditChange} />
          </Box>
          <TextField fullWidth label="Email" name="email" type="email" size="small"
            value={editForm.email} onChange={handleEditChange} sx={{ mb: 2 }} />

          <Divider sx={{ my: 2 }} />

          {/* Rôle & affectation */}
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Rôle & Affectation
          </Typography>
          <TextField fullWidth select label="Rôle" name="role" size="small"
            value={editForm.role} onChange={handleEditChange} sx={{ mt: 1, mb: 2 }}>
            {ROLES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </TextField>

          {editForm.role === 'chef_agence' && (
            <TextField fullWidth select label="Agence affiliée" name="agence" size="small"
              value={editForm.agence} onChange={handleEditChange} sx={{ mb: 2 }}>
              {agences.map(a => (
                <MenuItem key={a.id} value={a.id}>[{a.code}] {a.nom}</MenuItem>
              ))}
            </TextField>
          )}

          {/* Champ Pays — visible pour Conformité et Chef de produit */}
          {ROLES_AVEC_PAYS.includes(editForm.role) && (
            <TextField fullWidth select label="Pays" name="pays" size="small"
              value={editForm.pays} onChange={handleEditChange} sx={{ mb: 2 }}>
              {paysList.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.nom}</MenuItem>
              ))}
            </TextField>
          )}

          {/* NOUVEAU : champ Ville — Conformité uniquement, optionnel */}
          {editForm.role === 'conformite' && (
            <TextField
              fullWidth select label="Ville (optionnel)" name="ville" size="small"
              value={editForm.ville} onChange={handleEditChange}
              disabled={!editForm.pays}
              helperText={
                !editForm.pays
                  ? 'Sélectionnez un pays au préalable'
                  : 'Laisser vide pour une conformité principale (vue nationale)'
              }
              sx={{ mb: 2 }}
            >
              <MenuItem value="">— Aucune (conformité principale) —</MenuItem>
              {villesFiltreesEdit.map((v) => (
                <MenuItem key={v.id} value={v.id}>{v.nom}</MenuItem>
              ))}
            </TextField>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Mot de passe */}
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Mot de passe
          </Typography>
          <TextField fullWidth label="Nouveau mot de passe" name="password"
            type="password" size="small"
            value={editForm.password} onChange={handleEditChange}
            helperText="Laisser vide pour ne pas modifier — minimum 8 caractères si renseigné"
            sx={{ mt: 1 }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDialogEdit(false)} disabled={editLoading}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={sauvegarderEdit}
            disabled={editLoading || !editForm.email || !editForm.nom || !editForm.prenom || !editForm.role}
            startIcon={editLoading ? <CircularProgress size={16} color="inherit" /> : <EditOutlined />}
            sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' } }}
          >
            {editLoading ? 'Enregistrement…' : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}