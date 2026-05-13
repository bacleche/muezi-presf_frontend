'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Grid, Divider, Alert, CircularProgress,
  TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Avatar, Chip
} from '@mui/material'
import {
  ArrowBackOutlined, CheckCircleOutlined, CancelOutlined,
  BadgeOutlined, PersonOutlined, DescriptionOutlined,
  VerifiedOutlined, DownloadOutlined, WarningAmberOutlined
} from '@mui/icons-material'
import { enregistrementAPI } from '@/lib/api'
import StatutBadge from '@/components/enregistrements/StatutBadge'

// ── Types ──────────────────────────────────────────
interface Document {
  id:              number
  type_doc:        string
  type_doc_display: string
  fichier:         string
  uploaded_at:     string
}

interface Enregistrement {
  id:                  number
  nom_client:          string
  prenom_client:       string
  type_piece:          string
  type_piece_display:  string
  numero_piece:        string
  date_paiement:       string
  statut:              'en_attente' | 'valide' | 'rejete'
  motif_rejet:         string | null
  caissier_nom:        string
  verifie_par_nom:     string | null
  verifie_le:          string | null
  est_modifiable:      boolean
  documents_complets:  boolean
  documents:           Document[]
  created_at:          string
  updated_at:          string
}

// ── Composant info row ─────────────────────────────
// const InfoRow = ({
//   icon, label, value
// }: {
//   icon: React.ReactNode
//   label: string
//   value: React.ReactNode
// }) => (
//   <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.5 }}>
//     <Box sx={{ color: 'primary.main', mt: 0.3, flexShrink: 0 }}>{icon}</Box>
//     <Box sx={{ flexGrow: 1 }}>
//       <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
//         {label}
//       </Typography>
//       <Typography variant="body2" sx={{ fontWeight: 600 }}>
//         {value}
//       </Typography>
//     </Box>
//   </Box>
// )

const InfoRow = ({ icon, label, value, valueColor }: {
  icon:        React.ReactNode
  label:       string
  value:       React.ReactNode
  valueColor?: string
}) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.2 }}>
    <Box sx={{ color: 'text.secondary', mt: 0.2, flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography
        component="div"     
        variant="body2"
        sx={{ fontWeight: 600, color: valueColor || 'text.primary' }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
)

export default function ConformiteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id     = Number(params.id)

  const [enreg, setEnreg]       = useState<Enregistrement | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Dialog rejet
  const [dialogRejet, setDialogRejet]   = useState(false)
  const [motifRejet, setMotifRejet]     = useState('')

  // Dialog validation
  const [dialogValider, setDialogValider] = useState(false)

  const charger = async () => {
    setLoading(true)
    try {
      const { data } = await enregistrementAPI.detail(id)
      setEnreg(data)
    } catch {
      setError('Enregistrement introuvable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { charger() }, [id])

  // ── Valider ───────────────────────────────────────
  const handleValider = async () => {
    setSubmitting(true)
    try {
      await enregistrementAPI.valider(id, { statut: 'valide' })
      setDialogValider(false)
      await charger()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || 'Erreur lors de la validation.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Rejeter ───────────────────────────────────────
  const handleRejeter = async () => {
    if (!motifRejet.trim()) {
      setError('Le motif de rejet est obligatoire.')
      return
    }
    setSubmitting(true)
    try {
      await enregistrementAPI.valider(id, { statut: 'rejete', motif_rejet: motifRejet })
      setDialogRejet(false)
      setMotifRejet('')
      await charger()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || 'Erreur lors du rejet.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!enreg) {
    return (
      <Box>
        <Alert severity="error">Enregistrement introuvable.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => router.back()}>Retour</Button>
      </Box>
    )
  }

  return (
    <Box>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackOutlined />}
            onClick={() => router.back()}
            variant="outlined" size="small"
          >
            Retour
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Dossier #{enreg.id}
          </Typography>
          <StatutBadge statut={enreg.statut} />
        </Box>

        {/* Boutons action — seulement si en_attente */}
        {enreg.statut === 'en_attente' && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined" color="error"
              startIcon={<CancelOutlined />}
              onClick={() => setDialogRejet(true)}
            >
              Rejeter
            </Button>
            <Button
              variant="contained" color="success"
              startIcon={<CheckCircleOutlined />}
              onClick={() => setDialogValider(true)}
              disabled={!enreg.documents_complets}
            >
              Valider
            </Button>
          </Box>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Alerte docs incomplets */}
      {!enreg.documents_complets && enreg.statut === 'en_attente' && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningAmberOutlined />}>
          Documents incomplets — la validation est impossible tant que les 3 documents ne sont pas uploadés.
        </Alert>
      )}

      {/* Alerte motif rejet */}
      {enreg.statut === 'rejete' && enreg.motif_rejet && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>Motif de rejet :</Typography>
          {enreg.motif_rejet}
        </Alert>
      )}

      <Grid container spacing={3}>

        {/* ── Colonne gauche : Infos client ── */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              {/* Avatar client */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{
                  width: 56, height: 56, fontSize: 22,
                  bgcolor: 'primary.main',
                }}>
                  {enreg.prenom_client[0]}{enreg.nom_client[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {enreg.prenom_client} {enreg.nom_client}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Enregistrement #{enreg.id}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <InfoRow
                icon={<BadgeOutlined fontSize="small" />}
                label="Type de pièce"
                value={enreg.type_piece_display}
              />
              <Divider />
              <InfoRow
                icon={<BadgeOutlined fontSize="small" />}
                label="Numéro de pièce"
                value={enreg.numero_piece}
              />
              <Divider />
              <InfoRow
                icon={<PersonOutlined fontSize="small" />}
                label="Caissier"
                value={enreg.caissier_nom}
              />
              <Divider />
              <InfoRow
                icon={<PersonOutlined fontSize="small" />}
                label="Date de paiement"
                value={new Date(enreg.date_paiement).toLocaleDateString('fr-FR')}
              />
              <Divider />
              <InfoRow
                icon={<PersonOutlined fontSize="small" />}
                label="Créé le"
                value={new Date(enreg.created_at).toLocaleString('fr-FR')}
              />

              {/* Vérifié par */}
              {enreg.verifie_par_nom && (
                <>
                  <Divider />
                  <InfoRow
                    icon={<VerifiedOutlined fontSize="small" />}
                    label="Vérifié par"
                    value={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {enreg.verifie_par_nom}

                        {enreg.verifie_le && (
                          <Typography variant="caption" color="text.secondary">
                            {enreg.verifie_le}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Colonne droite : Documents ── */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Documents
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
                  <DescriptionOutlined sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                  <Typography color="text.secondary">Aucun document uploadé</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {enreg.documents.map((doc) => (
                    <Card key={doc.id} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                              width: 40, height: 40, borderRadius: 2,
                              bgcolor: 'primary.light',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <DescriptionOutlined color="primary" fontSize="small" />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {doc.type_doc_display}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Uploadé le {new Date(doc.uploaded_at).toLocaleString('fr-FR')}
                              </Typography>
                            </Box>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadOutlined />}
                            href={doc.fichier}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Voir
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {/* Docs manquants */}
              {!enreg.documents_complets && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Documents manquants :
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    {['recu_paiement', 'bordereau', enreg.type_piece]
                      .filter((type) => !enreg.documents.find((d) => d.type_doc === type))
                      .map((type) => (
                        <Chip key={type} label={type} size="small" color="warning" variant="outlined" />
                      ))
                    }
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Dialog Validation ── */}
      <Dialog open={dialogValider} onClose={() => setDialogValider(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Confirmer la validation
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
            <CheckCircleOutlined color="success" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {enreg.prenom_client} {enreg.nom_client}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Valider ce dossier est une action définitive.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDialogValider(false)}>
            Annuler
          </Button>
          <Button
            variant="contained" color="success"
            onClick={handleValider}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlined />}
          >
            Confirmer la validation
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog Rejet ── */}
      <Dialog open={dialogRejet} onClose={() => setDialogRejet(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Rejeter le dossier
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Veuillez indiquer le motif du rejet. Le caissier pourra corriger et resoumettre le dossier.
          </Typography>
          <TextField
            fullWidth multiline rows={4}
            label="Motif du rejet"
            placeholder="Ex: Document illisible, informations incorrectes..."
            value={motifRejet}
            onChange={(e) => setMotifRejet(e.target.value)}
            required
            error={!!error && !motifRejet.trim()}
            helperText={!motifRejet.trim() && error ? error : ''}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => { setDialogRejet(false); setMotifRejet('') }}>
            Annuler
          </Button>
          <Button
            variant="contained" color="error"
            onClick={handleRejeter}
            disabled={submitting || !motifRejet.trim()}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CancelOutlined />}
          >
            Confirmer le rejet
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  )
}