'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button,
  Grid, Divider, Alert, CircularProgress,
  Avatar, Chip
} from '@mui/material'
import {
  ArrowBackOutlined, BadgeOutlined, PersonOutlined,
  DescriptionOutlined, DownloadOutlined,
  WarningAmberOutlined, EditOutlined
} from '@mui/icons-material'
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
  type_piece:         string
  type_piece_display: string
  numero_piece:       string
  date_paiement:      string
  statut:             'en_attente' | 'valide' | 'rejete'
  motif_rejet:        string | null
  caissier_nom:       string
  verifie_par_nom:    string | null
  verifie_le:         string | null
  est_modifiable:     boolean
  documents_complets: boolean
  documents:          Document[]
  created_at:         string
}

const InfoRow = ({ icon, label, value }: {
  icon:  React.ReactNode
  label: string
  value: React.ReactNode
}) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.2 }}>
    <Box sx={{ color: 'text.secondary', mt: 0.2, flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography component="div" variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  </Box>
)

export default function CaissierDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id     = Number(params.id)

  const [enreg, setEnreg]     = useState<Enregistrement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
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
    charger()
  }, [id])

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

        {/* Bouton modifier — seulement si rejeté et modifiable */}
        {enreg.statut === 'rejete' && enreg.est_modifiable && (
          <Button
            variant="contained" color="warning"
            startIcon={<EditOutlined />}
            onClick={() => router.push(`/caissier/modification/${enreg.id}`)}
          >
            Corriger le dossier
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Alerte motif rejet */}
      {enreg.statut === 'rejete' && enreg.motif_rejet && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<WarningAmberOutlined />}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
            Motif du rejet :
          </Typography>
          {enreg.motif_rejet}
        </Alert>
      )}

      <Grid container spacing={3}>

        {/* ── Infos client ── */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 56, height: 56, fontSize: 22, bgcolor: 'primary.main' }}>
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
                label="Date de paiement"
                value={new Date(enreg.date_paiement).toLocaleDateString('fr-FR')}
              />
              <Divider />
              <InfoRow
                icon={<PersonOutlined fontSize="small" />}
                label="Créé le"
                value={new Date(enreg.created_at).toLocaleString('fr-FR')}
              />
              <Divider />
              <InfoRow
                icon={<PersonOutlined fontSize="small" />}
                label="Documents"
                value={
                  <Chip
                    label={enreg.documents_complets ? '✅ Complets' : '⚠️ Incomplets'}
                    color={enreg.documents_complets ? 'success' : 'warning'}
                    size="small"
                  />
                }
              />

              {enreg.verifie_par_nom && (
                <>
                  <Divider />
                  <InfoRow
                    icon={<PersonOutlined fontSize="small" />}
                    label="Vérifié par"
                    value={`${enreg.verifie_par_nom}${enreg.verifie_le
                      ? ' · ' + new Date(enreg.verifie_le).toLocaleDateString('fr-FR')
                      : ''}`}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Documents ── */}
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
                            size="small" variant="outlined"
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
    </Box>
  )
}