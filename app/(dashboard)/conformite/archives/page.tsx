'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, CircularProgress, Alert,
  TablePagination, Chip, Tooltip, ToggleButtonGroup,
  ToggleButton, MenuItem
} from '@mui/material'
import {
  SearchOutlined, DownloadOutlined,
  FolderZipOutlined, CheckCircleOutlined,
  CancelOutlined, HourglassEmptyOutlined
} from '@mui/icons-material'
import { transactionAPI, agenceAPI } from '@/lib/api'

interface Document {
  id:               number
  type_doc:         string
  type_doc_display: string
  fichier:          string
}

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
  documents:          Document[]
  created_at:         string
}

type FiltreStatut = 'tous' | 'valide' | 'rejete' | 'en_attente'

const STATUT_CONFIG = {
  valide:     { label: 'Validé',     color: 'success' as const, icon: <CheckCircleOutlined sx={{ fontSize: 14 }} /> },
  rejete:     { label: 'Rejeté',     color: 'error'   as const, icon: <CancelOutlined      sx={{ fontSize: 14 }} /> },
  en_attente: { label: 'En attente', color: 'warning' as const, icon: <HourglassEmptyOutlined sx={{ fontSize: 14 }} /> },
}

export default function ArchivesPage() {
  const [enregistrements, setEnregistrements] = useState<Enregistrement[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(0)
  const [total, setTotal]         = useState(0)
  const [statut, setStatut]       = useState<FiltreStatut>('tous')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin,   setDateFin]   = useState('')
  const [agences, setAgences]     = useState<{ id: number; nom: string }[]>([])
  const [agenceId, setAgenceId]   = useState('')
  const [downloading, setDownloading] = useState<Record<number, boolean>>({})

  const charger = useCallback(async (
    q: string, p: number, s: FiltreStatut,
    dd: string, df: string, ag: string
  ) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = {
        search: q, page: p + 1, page_size: 15,
      }
      if (s !== 'tous') params.statut     = s
      if (dd)           params.date_debut = dd
      if (df)           params.date_fin   = df
      if (ag)           params.agence_id  = ag

      const { data } = await transactionAPI.liste(params)
      setEnregistrements(data.results ?? data)
      setTotal(data.count ?? (data.results ?? data).length)
    } catch {
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    agenceAPI.liste({ is_active: true }).then(({ data }) =>
      setAgences(data.results ?? data)
    )
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0)
      charger(search, 0, statut, dateDebut, dateFin, agenceId)
    }, 400)
    return () => clearTimeout(t)
  }, [search, dateDebut, dateFin, agenceId, statut])

  useEffect(() => {
    charger(search, page, statut, dateDebut, dateFin, agenceId)
  }, [page])

  const handleStatut = (_: React.MouseEvent<HTMLElement>, val: FiltreStatut | null) => {
    if (!val) return
    setStatut(val)
    setPage(0)
  }

  const telechargerZip = async (enreg: Enregistrement) => {
    setDownloading((prev) => ({ ...prev, [enreg.id]: true }))
    try {
      const { data } = await transactionAPI.telechargerZip(enreg.id)
      const url  = URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
      const link = document.createElement('a')
      link.href     = url
      link.download = `dossier_${enreg.prenom_client}_${enreg.nom_client}_${enreg.id}.zip`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Erreur lors du téléchargement.')
    } finally {
      setDownloading((prev) => ({ ...prev, [enreg.id]: false }))
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <FolderZipOutlined sx={{ color: '#0D47A1', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Archives</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Consultez et téléchargez les dossiers et leurs documents
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
            size="small" sx={{ width: 250 }}
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

          <ToggleButtonGroup value={statut} exclusive onChange={handleStatut} size="small">
            <ToggleButton value="tous">Tous</ToggleButton>
            <ToggleButton value="valide"     sx={{ color: 'success.main' }}>Validés</ToggleButton>
            <ToggleButton value="rejete"     sx={{ color: 'error.main'   }}>Rejetés</ToggleButton>
            <ToggleButton value="en_attente" sx={{ color: 'warning.main' }}>En attente</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            select label="Agence" value={agenceId}
            onChange={(e) => { setAgenceId(e.target.value); setPage(0) }}
            size="small" sx={{ width: 180 }}
          >
            <MenuItem value="">Toutes</MenuItem>
            {agences.map((a) => (
              <MenuItem key={a.id} value={String(a.id)}>{a.nom}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Du" type="date" size="small"
            value={dateDebut}
            onChange={(e) => { setDateDebut(e.target.value); setPage(0) }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 155 }}
          />
          <TextField
            label="Au" type="date" size="small"
            value={dateFin}
            onChange={(e) => { setDateFin(e.target.value); setPage(0) }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 155 }}
          />

          {(dateDebut || dateFin || agenceId) && (
            <Typography
              variant="body2"
              sx={{ color: '#0D47A1', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => { setDateDebut(''); setDateFin(''); setAgenceId('') }}
            >
              Réinitialiser
            </Typography>
          )}
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1e293b' }}>
              {['Client', 'Pièce', 'Caissier / Agence', 'Date paiement', 'Documents', 'ZIP'].map((h) => (
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
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucun dossier trouvé
                </TableCell>
              </TableRow>
            ) : enregistrements.map((e) => (
              <TableRow key={e.id} hover>

                <TableCell>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                    {e.prenom_client} {e.nom_client}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">#{e.id}</Typography>
                </TableCell>

                <TableCell>
                  <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{e.type_piece_display}</Typography>
                  <Typography variant="caption" color="text.secondary">{e.numero_piece}</Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.caissier_nom}</Typography>
                  {e.agence_nom && (
                    <Typography variant="caption" color="text.secondary">{e.agence_nom}</Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {new Date(e.date_paiement).toLocaleDateString('fr-FR')}
                  </Typography>
                </TableCell>

               

                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {e.documents.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    ) : e.documents.map((doc) => (
                      <Button
                        key={doc.id}
                        size="small" variant="text"
                        startIcon={<DownloadOutlined sx={{ fontSize: 14 }} />}
                        href={doc.fichier}
                        target="_blank" rel="noopener noreferrer"
                        sx={{ fontSize: 11, px: 0.5, justifyContent: 'flex-start' }}
                      >
                        {doc.type_doc_display}
                      </Button>
                    ))}
                  </Box>
                </TableCell>

                <TableCell>
                  <Tooltip title={
                    e.documents.length === 0
                      ? 'Aucun document disponible'
                      : `Télécharger ${e.documents.length} document(s) en ZIP`
                  }>
                    <span>
                      <Button
                        size="small" variant="contained" color="primary"
                        startIcon={
                          downloading[e.id]
                            ? <CircularProgress size={14} color="inherit" />
                            : <FolderZipOutlined />
                        }
                        onClick={() => telechargerZip(e)}
                        disabled={e.documents.length === 0 || downloading[e.id]}
                      >
                        ZIP
                      </Button>
                    </span>
                  </Tooltip>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={15}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPageOptions={[15]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </TableContainer>
    </Box>
  )
}