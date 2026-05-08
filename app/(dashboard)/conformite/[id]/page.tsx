// app/(dashboard)/conformite/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Grid, Chip, Avatar, Divider, CircularProgress,
  TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, IconButton, Tooltip, Stack
} from '@mui/material'
import {
  ArrowBackOutlined, CheckCircleOutlined, CancelOutlined,
  PersonOutlined, CalendarTodayOutlined, AttachMoneyOutlined,
  DescriptionOutlined, DownloadOutlined, ReceiptOutlined,
  HourglassEmptyOutlined, BadgeOutlined, AccessTimeOutlined
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { enregistrementAPI } from '@/lib/api'
import StatutBadge from '@/components/enregistrements/StatutBadge'

interface Document {
  id:               number
  type_doc:         string
  type_doc_display: string
  fichier:          string
  uploaded_at:      string
}

interface Enregistrement {
  id:                 number
  nom_client:         string
  prenom_client:      string
  montant:            string
  date_paiement:      string
  statut:             'en_attente' | 'valide' | 'rejete'
  motif_rejet?:       string
  caissier_nom:       string
  verifie_par_nom?:   string
  verifie_le?:        string
  est_modifiable:     boolean
  documents_complets: boolean
  documents:          Document[]
  created_at:         string
  editable_until:     string
}

// ── Ligne info ──────────────────────────────────────────────
const InfoRow = ({
  icon, label, value, valueColor
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  valueColor?: string
}) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.5 }}>
    <Box sx={{ color: 'text.secondary', mt: 0.3, flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600, color: valueColor || 'text.primary' }}>
        {value}
      </Typography>
    </Box>
  </Box>
)

export default function ConformiteDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { enqueueSnackbar } = useSnackbar()

  const [enreg, setEnreg]       = useState<Enregistrement | null>(null)
  const [loading, setLoading]   = useState(true)
  const [treating, setTreating] = useState(false)

  // Modal rejet
  const [modalRejet, setModalRejet]     = useState(false)
  const [motifRejet, setMotifRejet]     = useState('')
  const [motifError, setMotifError]     = useState('')

  // Modal confirmation validation
  const [modalValider, setModalValider] = useState(false)

  const charger = async () => {
    setLoading(true)
    try {
      const { data } = await enregistrementAPI.detail(Number(id))
      setEnreg(data)
    } catch {
      enqueueSnackbar('Enregistrement introuvable.', { variant: 'error' })
      router.push('/conformite')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { charger() }, [id])

  // ── Valider ──
  const handleValider = async () => {
    setTreating(true)
    try {
      await enregistrementAPI.valider(Number(id), { statut: 'valide' })
      enqueueSnackbar('Dossier validé avec succès.', { variant: 'success' })
      setModalValider(false)
      charger()
    } catch {
      enqueueSnackbar('Erreur lors de la validation.', { variant: 'error' })
    } finally {
      setTreating(false)
    }
  }

  // ── Rejeter ──
  const handleRejeter = async () => {
    if (!motifRejet.trim()) {
      setMotifError('Le motif de rejet est obligatoire.')
      return
    }
    setTreating(true)
    try {
      await enregistrementAPI.valider(Number(id), { statut: 'rejete', motif_rejet: motifRejet })
      enqueueSnackbar('Dossier rejeté.', { variant: 'warning' })
      setModalRejet(false)
      setMotifRejet('')
      charger()
    } catch {
      enqueueSnackbar('Erreur lors du rejet.', { variant: 'error' })
    } finally {
      setTreating(false)
    }
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  )

  if (!enreg) return null

  const dejaTraite = enreg.statut !== 'en_attente'

  const statutColors = {
    en_attente: { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c', label: 'En attente de validation' },
    valide:     { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', label: 'Dossier validé'           },
    rejete:     { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', label: 'Dossier rejeté'            },
  }
  const couleur = statutColors[enreg.statut]

  return (
    <Box>
      {/* ── Header page ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.back()} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <ArrowBackOutlined />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Dossier #{enreg.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Soumis le {new Date(enreg.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </Typography>
        </Box>
        <StatutBadge statut={enreg.statut} />
      </Box>

      {/* ── Bandeau statut ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 2,
        px: 3, py: 2, borderRadius: 2, mb: 3,
        bgcolor: couleur.bg,
        border: '1px solid', borderColor: couleur.border,
      }}>
        {enreg.statut === 'valide'     && <CheckCircleOutlined sx={{ color: couleur.text, fontSize: 28 }} />}
        {enreg.statut === 'rejete'     && <CancelOutlined      sx={{ color: couleur.text, fontSize: 28 }} />}
        {enreg.statut === 'en_attente' && <HourglassEmptyOutlined sx={{ color: couleur.text, fontSize: 28 }} />}
        <Box>
          <Typography sx={{ fontWeight: 700, color: couleur.text }}>{couleur.label}</Typography>
          {enreg.verifie_par_nom && (
            <Typography variant="caption" sx={{ color: couleur.text }}>
              Traité par {enreg.verifie_par_nom}
              {enreg.verifie_le && ` · ${new Date(enreg.verifie_le).toLocaleDateString('fr-FR')}`}
            </Typography>
          )}
        </Box>
      </Box>

      {/* ── Motif rejet ── */}
      {enreg.statut === 'rejete' && enreg.motif_rejet && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Motif du rejet</Typography>
          <Typography variant="body2">{enreg.motif_rejet}</Typography>
        </Alert>
      )}

      <Grid container spacing={3}>

        {/* ── COL GAUCHE ── */}
        <Grid size={{ xs: 12, md: 5 }}>

          {/* Infos client */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{
                  background: 'linear-gradient(135deg, #1e293b, #0D47A1)',
                  width: 48, height: 48, fontSize: 18,
                }}>
                  {enreg.prenom_client[0]}{enreg.nom_client[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {enreg.prenom_client} {enreg.nom_client}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Client</Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 1 }} />

              <InfoRow
                icon={<AttachMoneyOutlined fontSize="small" />}
                label="Montant"
                value={`${Number(enreg.montant).toLocaleString('fr-FR')} FCFA`}
                valueColor="primary.main"
              />
              <Divider />
              <InfoRow
                icon={<CalendarTodayOutlined fontSize="small" />}
                label="Date de paiement"
                value={new Date(enreg.date_paiement).toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              />
              <Divider />
              <InfoRow
                icon={<BadgeOutlined fontSize="small" />}
                label="Caissier"
                value={enreg.caissier_nom}
              />
              <Divider />
              <InfoRow
                icon={<AccessTimeOutlined fontSize="small" />}
                label="Modifiable jusqu'au"
                value={new Date(enreg.editable_until).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
                valueColor={new Date(enreg.editable_until) > new Date() ? 'success.main' : 'error.main'}
              />
            </CardContent>
          </Card>

          {/* Actions conformité */}
          {!dejaTraite && (
            <Card sx={{ border: '2px solid', borderColor: 'warning.light' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Décision de conformité
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Après examen des documents, validez ou rejetez ce dossier.
                  Un rejet nécessite un motif obligatoire.
                </Typography>
                <Stack spacing={2}>
                  <Button
                    fullWidth variant="contained" color="success" size="large"
                    startIcon={<CheckCircleOutlined />}
                    onClick={() => setModalValider(true)}
                    sx={{ py: 1.5, fontWeight: 700 }}
                  >
                    Valider le dossier
                  </Button>
                  <Button
                    fullWidth variant="outlined" color="error" size="large"
                    startIcon={<CancelOutlined />}
                    onClick={() => { setMotifRejet(''); setMotifError(''); setModalRejet(true) }}
                    sx={{ py: 1.5, fontWeight: 700 }}
                  >
                    Rejeter le dossier
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {dejaTraite && (
            <Card sx={{
              border: '1px solid',
              borderColor: enreg.statut === 'valide' ? 'success.light' : 'error.light',
              bgcolor: enreg.statut === 'valide' ? '#f0fdf4' : '#fef2f2',
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                {enreg.statut === 'valide'
                  ? <CheckCircleOutlined sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  : <CancelOutlined sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                }
                <Typography sx={{ fontWeight: 700, color: enreg.statut === 'valide' ? 'success.main' : 'error.main' }}>
                  Dossier déjà traité
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Aucune action supplémentaire possible
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* ── COL DROITE : Documents ── */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Documents ({enreg.documents.length}/3)
                </Typography>
                <Chip
                  label={enreg.documents_complets ? '✅ Complets' : '⚠️ Incomplets'}
                  color={enreg.documents_complets ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
              <Divider sx={{ mb: 2 }} />

              {enreg.documents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ReceiptOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Aucun document uploadé.</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {enreg.documents.map((doc) => (
                    <Card key={doc.id} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ py: '12px !important' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                              width: 40, height: 40, borderRadius: 1.5,
                              bgcolor: 'primary.light',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <DescriptionOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                                {doc.type_doc_display}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Uploadé le {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                              </Typography>
                            </Box>
                          </Box>
                          <Tooltip title="Télécharger / Voir">
                            <Button
                              variant="outlined" size="small"
                              startIcon={<DownloadOutlined />}
                              href={doc.fichier}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Voir
                            </Button>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Docs manquants */}
                  {enreg.documents.length < 3 && (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      {3 - enreg.documents.length} document(s) manquant(s) —
                      ce dossier est incomplet.
                    </Alert>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── MODAL VALIDATION ── */}
      <Dialog
        open={modalValider} onClose={() => setModalValider(false)}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleOutlined color="success" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Confirmer la validation</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Vous allez valider le dossier de{' '}
            <strong>{enreg.prenom_client} {enreg.nom_client}</strong> pour un montant de{' '}
            <strong>{Number(enreg.montant).toLocaleString('fr-FR')} FCFA</strong>.
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setModalValider(false)}
            disabled={treating} variant="outlined"
          >
            Annuler
          </Button>
          <Button
            onClick={handleValider}
            disabled={treating}
            variant="contained" color="success"
            startIcon={treating ? <CircularProgress size={18} color="inherit" /> : <CheckCircleOutlined />}
          >
            {treating ? 'Validation...' : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL REJET ── */}
      <Dialog
        open={modalRejet} onClose={() => setModalRejet(false)}
        maxWidth="sm" fullWidth
        slotProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CancelOutlined color="error" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Rejeter le dossier</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Indiquez le motif de rejet pour{' '}
            <strong>{enreg.prenom_client} {enreg.nom_client}</strong>.
            Ce motif sera visible par le caissier.
          </Typography>
          <TextField
            fullWidth multiline rows={4}
            label="Motif de rejet *"
            placeholder="Ex: Document illisible, montant incohérent avec le bordereau..."
            value={motifRejet}
            onChange={(e) => { setMotifRejet(e.target.value); setMotifError('') }}
            error={!!motifError}
            helperText={motifError}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setModalRejet(false)}
            disabled={treating} variant="outlined"
          >
            Annuler
          </Button>
          <Button
            onClick={handleRejeter}
            disabled={treating || !motifRejet.trim()}
            variant="contained" color="error"
            startIcon={treating ? <CircularProgress size={18} color="inherit" /> : <CancelOutlined />}
          >
            {treating ? 'Rejet...' : 'Confirmer le rejet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}