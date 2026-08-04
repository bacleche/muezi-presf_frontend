'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert,
  Button, IconButton, Tooltip,
} from '@mui/material'
import {
  ArrowBackOutlined, VisibilityOutlined, CheckCircleOutlined,
  WarningAmberOutlined, LocationCityOutlined,
} from '@mui/icons-material'
import { transactionAPI } from '@/lib/api'

interface Document {
  id:               number
  type_doc:         string
  type_doc_display: string
  uploaded_at:      string
}

interface Transaction {
  id:                   number
  client_nom:           string
  produit_nom:          string
  agence_code:          string
  piece_utilisee_detail: { type_piece_display: string; numero: string } | null
  date_transaction:     string
  archive_par_nom:      string
  documents:            Document[]
  documents_complets:   boolean
}

const DocsBadge = ({ complets }: { complets: boolean }) => (
  <Chip
    size="small"
    icon={complets ? <CheckCircleOutlined sx={{ fontSize: 14 }} /> : <WarningAmberOutlined sx={{ fontSize: 14 }} />}
    label={complets ? 'Complets' : 'Incomplets'}
    color={complets ? 'success' : 'warning'}
  />
)

function AnalyseNationaleTransactionsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const villeId  = searchParams.get('ville_id')
  const villeNom = searchParams.get('ville_nom') ?? ''

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!villeId) return
    const charger = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await transactionAPI.nationalParVille({ ville_id: Number(villeId) })
        setTransactions(data)
      } catch {
        setError('Impossible de charger les transactions de cette ville.')
      } finally {
        setLoading(false)
      }
    }
    charger()
  }, [villeId])

  const handleViewDoc = async (txId: number, docId: number) => {
    try {
      const response = await transactionAPI.afficherDoc(txId, docId)
      const contentType = (response.headers['content-type'] as string) || 'application/pdf'
      const file = new Blob([response.data], { type: contentType })
      const fileURL = URL.createObjectURL(file)
      window.open(fileURL, '_blank')
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000)
    } catch (error) {
      console.error("Erreur lors de l'ouverture du document", error)
    }
  }

  if (!villeId) {
    return <Alert severity="error">Aucune ville sélectionnée.</Alert>
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackOutlined />}
        onClick={() => router.push('/conformite/analyse-nationale')}
        sx={{ mb: 2 }}
      >
        Retour à Analyse Nationale
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <LocationCityOutlined sx={{ color: '#0D47A1', fontSize: 24 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Transactions — {villeNom}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vue de supervision (lecture seule) des transactions saisies par la conformité de cette ville.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1e293b' }}>
              {['Client', 'Produit', 'Agence', 'Pièce utilisée', 'Date', 'Documents'].map((h) => (
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
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Aucune transaction pour cette ville
                </TableCell>
              </TableRow>
            ) : transactions.map((tx) => (
              <TableRow key={tx.id} hover>
                <TableCell>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{tx.client_nom}</Typography>
                  <Typography variant="caption" color="text.secondary">#{tx.id}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={tx.produit_nom} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{tx.agence_code}</Typography>
                </TableCell>
                <TableCell>
                  {tx.piece_utilisee_detail ? (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {tx.piece_utilisee_detail.type_piece_display}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tx.piece_utilisee_detail.numero}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(tx.date_transaction).toLocaleDateString('fr-FR')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <DocsBadge complets={tx.documents_complets} />
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                      {tx.documents.map((doc) => (
                        <Button
                          key={doc.id} size="small" variant="text"
                          startIcon={<VisibilityOutlined sx={{ fontSize: 13 }} />}
                          onClick={() => handleViewDoc(tx.id, doc.id)}
                          sx={{ fontSize: 11, px: 0.5 }}
                        >
                          {doc.type_doc_display}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default function AnalyseNationaleTransactionsPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>}>
      <AnalyseNationaleTransactionsContent />
    </Suspense>
  )
}