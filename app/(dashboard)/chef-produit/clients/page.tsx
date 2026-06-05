'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, TextField, InputAdornment,
  CircularProgress, Alert, TablePagination, Chip, Avatar, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider, Stack, Badge
} from '@mui/material'
import {
  SearchOutlined, PersonOutlined, PhoneOutlined, HomeOutlined,
  BadgeOutlined, CloseOutlined, VisibilityOutlined,
  StorefrontOutlined, CalendarTodayOutlined, FingerprintOutlined
} from '@mui/icons-material'
import { clientAPI } from '@/lib/api'

interface PieceIdentite {
  id: number
  type_piece: string
  numero: string
  fichier?: string
}

interface Client {
  id: number
  nom: string
  prenom: string
  adresse: string
  telephone: string
  agence_nom: string
  agence_code: string
  enregistre_par_nom: string
  pieces: PieceIdentite[]
  created_at: string
  updated_at: string
}

const LABELS_PIECES: Record<string, string> = {
  cni: 'CNI',
  permis: 'Permis',
  passport: 'Passeport',
  niu: 'NIU',
}

function initialesAvatar(prenom: string, nom: string) {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
}

function couleurAvatar(nom: string) {
  const couleurs = ['#0D47A1', '#1565C0', '#1976D2', '#0277BD', '#01579B', '#006064', '#00695C']
  return couleurs[nom.charCodeAt(0) % couleurs.length]
}

export default function ListeClientsPage() {
  const [clients, setClients]     = useState<Client[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage]           = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Modal détail
  const [selected, setSelected]   = useState<Client | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const charger = useCallback(async (q: string, p: number, limit: number) => {
    setLoading(true)
    try {
      const { data } = await clientAPI.liste({
        search: q || undefined,
        page: p + 1,
        limit,
      })
      if (data.results) {
        setClients(data.results)
        setTotalCount(data.count)
      } else {
        setClients(data)
        setTotalCount(data.length)
      }
    } catch {
      setError('Erreur lors du chargement des clients.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => charger(search, page, rowsPerPage), 350)
    return () => clearTimeout(t)
  }, [search, page, rowsPerPage, charger])

  const handleVoirDetail = (client: Client) => {
    setSelected(client)
    setModalOpen(true)
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Tous les Clients</Typography>
          <Typography variant="body2" color="text.secondary">
            Répertoire complet des clients enregistrés sur la plateforme
          </Typography>
        </Box>
        <Chip
          label={`${totalCount} client${totalCount > 1 ? 's' : ''}`}
          sx={{ bgcolor: '#0D47A1', color: 'white', fontWeight: 700, fontSize: '0.85rem', px: 1 }}
        />
      </Box>

      {/* Barre de recherche */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ py: '12px !important' }}>
          <TextField
            placeholder="Rechercher par nom, prénom ou numéro de pièce..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            size="small"
            sx={{ width: 380 }}
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
              {['Client', 'Téléphone', 'Agence', 'Pièces d\'identité', 'Enregistré par', 'Date', 'Actions'].map((h) => (
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
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  Aucun client trouvé.
                </TableCell>
              </TableRow>
            ) : clients.map((c) => (
              <TableRow key={c.id} hover>
                {/* Client */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: couleurAvatar(c.nom), width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700 }}>
                      {initialesAvatar(c.prenom, c.nom)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {c.prenom} {c.nom}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        #{c.id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                {/* Téléphone */}
                <TableCell>
                  <Typography variant="body2" sx={{ color: c.telephone ? 'text.primary' : 'text.disabled' }}>
                    {c.telephone || '—'}
                  </Typography>
                </TableCell>

                {/* Agence */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StorefrontOutlined sx={{ fontSize: 15, color: '#0D47A1' }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{c.agence_nom}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.agence_code}</Typography>
                    </Box>
                  </Box>
                </TableCell>

                {/* Pièces */}
                <TableCell>
                  {c.pieces?.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {c.pieces.map((p) => (
                        <Chip
                          key={p.id}
                          label={LABELS_PIECES[p.type_piece] ?? p.type_piece}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ fontSize: '0.7rem', height: 22 }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.disabled">Aucune pièce</Typography>
                  )}
                </TableCell>

                {/* Enregistré par */}
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{c.enregistre_par_nom}</Typography>
                </TableCell>

                {/* Date */}
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Typography>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <Tooltip title="Voir le détail">
                    <IconButton size="small" color="primary" onClick={() => handleVoirDetail(c)}>
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </TableContainer>

      {/* ── Modal Détail Client ── */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontWeight: 700, fontSize: '1.05rem', pb: 1
        }}>
          Fiche Client
          <IconButton size="small" onClick={() => setModalOpen(false)}>
            <CloseOutlined fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selected && (
            <Stack spacing={2.5}>
              {/* Avatar + nom */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: couleurAvatar(selected.nom), width: 56, height: 56, fontSize: '1.2rem', fontWeight: 700 }}>
                  {initialesAvatar(selected.prenom, selected.nom)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {selected.prenom} {selected.nom}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Client #{selected.id}</Typography>
                </Box>
              </Box>

              <Divider />

              {/* Infos personnelles */}
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                  Informations personnelles
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneOutlined sx={{ fontSize: 17, color: '#0D47A1' }} />
                    <Typography variant="body2">{selected.telephone || 'Non renseigné'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HomeOutlined sx={{ fontSize: 17, color: '#0D47A1' }} />
                    <Typography variant="body2">{selected.adresse || 'Non renseignée'}</Typography>
                  </Box>
                </Stack>
              </Box>

              <Divider />

              {/* Agence */}
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                  Agence
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <StorefrontOutlined sx={{ fontSize: 17, color: '#0D47A1' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.agence_nom}</Typography>
                  <Chip label={selected.agence_code} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                </Box>
              </Box>

              <Divider />

              {/* Pièces d'identité */}
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                  Pièces d'identité ({selected.pieces?.length ?? 0})
                </Typography>
                {selected.pieces?.length > 0 ? (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {selected.pieces.map((p) => (
                      <Box key={p.id} sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        px: 2, py: 1, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FingerprintOutlined sx={{ fontSize: 17, color: '#0D47A1' }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {LABELS_PIECES[p.type_piece] ?? p.type_piece}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              {p.numero}
                            </Typography>
                          </Box>
                        </Box>
                        {p.fichier && (
                          <Chip
                            label="Fichier joint"
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        )}
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                    Aucune pièce enregistrée
                  </Typography>
                )}
              </Box>

              <Divider />

              {/* Méta */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Enregistré par</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.enregistre_par_nom}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">Date d'enregistrement</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(selected.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setModalOpen(false)} variant="outlined" size="small">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}