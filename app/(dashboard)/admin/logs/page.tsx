'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  InputAdornment, Chip, CircularProgress,
  Alert, TablePagination
} from '@mui/material'
import { SearchOutlined } from '@mui/icons-material'
import { auditAPI } from '@/lib/api'

interface AuditLog {
  id:            number
  user:          string
  action:        string
  enregistrement: number | null
  detail:        string
  ip_address:    string
  timestamp:    string
}

const ACTION_COLORS: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
  creation:   'success',
  modif:      'warning',
  validation: 'info',
  rejet:      'error',
  export_csv: 'default',
}

const ACTION_LABELS: Record<string, string> = {
  creation:   'Création',
  modif:      'Modification',
  validation: 'Validation',
  rejet:      'Rejet',
  export_csv: 'Export CSV',
}

export default function LogsPage() {
  const [logs, setLogs]       = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(0)
  const [total, setTotal]     = useState(0)

  const charger = useCallback(async (q: string, p: number) => {
    setLoading(true)
    try {
      const { data } = await auditAPI.liste({ search: q, page: p + 1, page_size: 20 })
      setLogs(data.results ?? data)
      setTotal(data.count ?? (data.results ?? data).length)
    } catch {
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { setPage(0); charger(search, 0) }, 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { charger(search, page) }, [page])

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Journal d'audit</Typography>
        <Typography variant="body2" color="text.secondary">
          Historique de toutes les actions effectuées
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <TextField
            placeholder="Rechercher par utilisateur, action..."
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
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#1e293b' }}>
              {['Date', 'Utilisateur', 'Action', 'Dossier', 'Détail', 'IP'].map((h) => (
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
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucun log trouvé
                </TableCell>
              </TableRow>
            ) : logs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {log.user} 
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={ACTION_LABELS[log.action] ?? log.action}
                    color={ACTION_COLORS[log.action] ?? 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {log.enregistrement ? `#${log.enregistrement}` : '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary"
                    sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.detail || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {log.ip_address}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={20}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPageOptions={[20]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </TableContainer>
    </Box>
  )
}