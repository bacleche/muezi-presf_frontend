'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, CircularProgress, Alert,
  TablePagination, Chip, Avatar, Tooltip
} from '@mui/material'
import {
  SearchOutlined, CheckCircleOutlined,
  CancelOutlined, VisibilityOutlined,
  HourglassEmptyOutlined, WarningAmberOutlined
} from '@mui/icons-material'
import { enregistrementAPI } from '@/lib/api'

interface Enregistrement {
  id:                 number
  nom_client:         string
  prenom_client:      string
  type_piece_display: string
  numero_piece:       string
  date_paiement:      string
  caissier_nom:       string
  agence_nom:         string | null
  documents_complets: boolean
  created_at:         string
}

export default function FileValidationPage() {
  const router = useRouter()

  const [enregistrements, setEnregistrements] = useState<Enregistrement[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(0)
  const [total, setTotal]       = useState(0)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin,   setDateFin]   = useState('')

  const charger = useCallback(async (q: string, p: number, dd: string, df: string) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = {
        statut:    'en_attente',
        search:    q,
        page:      p + 1,
        page_size: 10,
      }
      if (dd) params.date_debut = dd
      if (df) params.date_fin   = df

      const { data } = await enregistrementAPI.liste(params)
      setEnregistrements(data.results ?? data)
      setTotal(data.count ?? (data.results ?? data).length)
    } catch {
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { setPage(0); charger(search, 0, dateDebut, dateFin) }, 400)
    return () => clearTimeout(t)
  }, [search, dateDebut, dateFin])

  useEffect(() => { charger(search, page, dateDebut, dateFin) }, [page])

  return (
    <Box>

      {/* ── Header ── */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <HourglassEmptyOutlined sx={{ color: '#f59e0b', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            File de validation
          </Typography>
          {total > 0 && (
            <Chip
              label={`${total} en attente`}
              color="warning" size="small"
              sx={{ fontWeight: 700 }}
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Dossiers en attente de traitement — du plus ancien au plus récent
        </Typography>
      </Box>

      {/* ── Filtres ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{
          display: 'flex', gap: 2, alignItems: 'center',
          flexWrap: 'wrap', py: '12px !important',
        }}>
          <TextField
            placeholder="Rechercher par nom client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          <TextField
            label="Du" type="date" size="small"
            value={dateDebut}
            onChange={(e) => { setDateDebut(e.target.value); setPage(0) }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
          />
          <TextField
            label="Au" type="date" size="small"
            value={dateFin}
            onChange={(e) => { setDateFin(e.target.value); setPage(0) }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
          />
          {(dateDebut || dateFin) && (
            <Typography
              variant="body2"
              sx={{ color: '#0D47A1', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => { setDateDebut(''); setDateFin('') }}
            >
              Réinitialiser
            </Typography>
          )}
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Tableau ── */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1e293b' }}>
              {['Client', 'Pièce', 'Caissier / Agence', 'Date paiement', 'Reçu le', 'Docs', 'Actions'].map((h) => (
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
            ) : enregistrements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlined sx={{ fontSize: 48, color: '#86efac' }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      File vide — aucun dossier en attente
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : enregistrements.map((e) => (
              <TableRow
                key={e.id} hover
                sx={{ cursor: 'pointer' }}
                onClick={() => router.push(`/conformite/${e.id}`)}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 34, height: 34, fontSize: 13, bgcolor: '#0D47A1' }}>
                      {e.prenom_client[0]}{e.nom_client[0]}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                        {e.prenom_client} {e.nom_client}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        #{e.id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                    {e.type_piece_display}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {e.numero_piece}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {e.caissier_nom}
                  </Typography>
                  {e.agence_nom && (
                    <Typography variant="caption" color="text.secondary">
                      {e.agence_nom}
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {new Date(e.date_paiement).toLocaleDateString('fr-FR')}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(e.created_at).toLocaleDateString('fr-FR')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(e.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </TableCell>

                <TableCell onClick={(ev) => ev.stopPropagation()}>
                  {e.documents_complets ? (
                    <Chip
                      label="Complets"
                      color="success" size="small"
                      icon={<CheckCircleOutlined />}
                    />
                  ) : (
                    <Tooltip title="Documents manquants — validation impossible">
                      <Chip
                        label="Incomplets"
                        color="warning" size="small"
                        icon={<WarningAmberOutlined />}
                      />
                    </Tooltip>
                  )}
                </TableCell>

                <TableCell onClick={(ev) => ev.stopPropagation()}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Voir le dossier">
                      <Button
                        size="small" variant="outlined"
                        startIcon={<VisibilityOutlined />}
                        onClick={() => router.push(`/conformite/${e.id}`)}
                      >
                        Traiter
                      </Button>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={10}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPageOptions={[10]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </TableContainer>
    </Box>
  )
}