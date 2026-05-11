'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, TextField,
  Button, Grid, Alert, CircularProgress, Stepper,
  Step, StepLabel, Divider, MenuItem, Select,
  FormControl, InputLabel, Chip
} from '@mui/material'
import {
  SaveOutlined, UploadFileOutlined,
  CheckCircleOutlined, BadgeOutlined
} from '@mui/icons-material'
import { enregistrementAPI, documentAPI } from '@/lib/api'

// ── Types ──────────────────────────────────────────
type TypePiece = 'cni' | 'passport' | 'niu'

interface FormData {
  nom_client:    string
  prenom_client: string
  type_piece:    TypePiece | ''
  numero_piece:  string
  date_paiement: string
}

interface FichiersState {
  recu_paiement: File | null
  bordereau:     File | null
  piece:         File | null  // dynamique selon type_piece
}

// ── Constantes ─────────────────────────────────────
const STEPS = ['Informations client', 'Upload des documents', 'Confirmation']

const TYPES_PIECE: { value: TypePiece; label: string }[] = [
  { value: 'cni',      label: "Carte Nationale d'Identité" },
  { value: 'passport', label: 'Passport' },
  { value: 'niu',      label: "Numéro d'Identification Unique" },
]

// Retourne les 3 docs requis selon la pièce choisie
const getTypesDocs = (type_piece: TypePiece) => [
  { key: 'recu_paiement', label: 'Reçu de paiement' },
  { key: 'bordereau',     label: 'Bordereau' },
  {
    key:   type_piece,
    label: TYPES_PIECE.find((t) => t.value === type_piece)?.label || `Pièce d'identité`,
  },
]

export default function NouvelEnregistrementPage() {
  const router = useRouter()

  const [etape, setEtape]       = useState(0)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [enregId, setEnregId]   = useState<number | null>(null)

  const [form, setForm] = useState<FormData>({
    nom_client:    '',
    prenom_client: '',
    type_piece:    '',
    numero_piece:  '',
    date_paiement: '',
  })

  const [fichiers, setFichiers] = useState<FichiersState>({
    recu_paiement: null,
    bordereau:     null,
    piece:         null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  // ── ÉTAPE 1 : Créer l'enregistrement ──────────────
  const creerEnregistrement = async () => {
    if (!form.type_piece) {
      setError('Veuillez choisir un type de pièce.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await enregistrementAPI.creer({
        nom_client:    form.nom_client,
        prenom_client: form.prenom_client,
        type_piece:    form.type_piece,
        numero_piece:  form.numero_piece,
        date_paiement: form.date_paiement,
      })
      setEnregId(data.id)
      setEtape(1)
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } }
      const msgs = Object.values(e.response?.data || {}).flat()
      setError(msgs[0] || 'Erreur lors de la création.')
    } finally {
      setLoading(false)
    }
  }

  // ── ÉTAPE 2 : Uploader les 3 docs ─────────────────
  const uploaderDocuments = async () => {
    if (!fichiers.recu_paiement || !fichiers.bordereau || !fichiers.piece) {
      setError('Veuillez uploader les 3 documents obligatoires.')
      return
    }
    setLoading(true)
    setError('')

    const typesDocs = getTypesDocs(form.type_piece as TypePiece)

    // Mapping key → fichier
    const fichiersMap: Record<string, File> = {
      recu_paiement:           fichiers.recu_paiement,
      bordereau:               fichiers.bordereau,
      [form.type_piece as string]: fichiers.piece,
    }

    try {
      for (const { key } of typesDocs) {
        const formData = new FormData()
        formData.append('enregistrement', String(enregId))
        formData.append('type_doc', key)
        formData.append('fichier', fichiersMap[key])
        await documentAPI.uploader(formData)
      }
      setEtape(2)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || `Erreur lors de l'upload.`)
    } finally {
      setLoading(false)
    }
  }

  const labelPiece = TYPES_PIECE.find((t) => t.value === form.type_piece)?.label

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Nouvel enregistrement
      </Typography>

      <Stepper activeStep={etape} sx={{ mb: 4 }}>
        {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
      </Stepper>

      <Card>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          {/* ── ÉTAPE 0 : Infos client ── */}
          {etape === 0 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#475569', mb: 1 }}>
                  Informations du client
                </Typography>
                <Divider />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth label="Nom du client" name="nom_client"
                  value={form.nom_client} onChange={handleChange} required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth label="Prénom du client" name="prenom_client"
                  value={form.prenom_client} onChange={handleChange} required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#475569', mb: 1, mt: 1 }}>
                  Pièce d&apos;identité
                </Typography>
                <Divider />
              </Grid>

              {/* Type de pièce */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Type de pièce</InputLabel>
                  <Select
                    value={form.type_piece}
                    label="Type de pièce"
                    onChange={(e) => setForm({ ...form, type_piece: e.target.value as TypePiece })}
                  >
                    {TYPES_PIECE.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BadgeOutlined fontSize="small" color="action" />
                          {t.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Numéro de pièce */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={form.type_piece ? `Numéro — ${labelPiece}` : 'Numéro de pièce'}
                  name="numero_piece"
                  value={form.numero_piece}
                  onChange={handleChange}
                  required
                  disabled={!form.type_piece}
                  placeholder={
                    form.type_piece === 'cni'      ? 'Ex: 1234567890123' :
                    form.type_piece === 'passport' ? 'Ex: AB1234567' :
                    form.type_piece === 'niu'      ? 'Ex: NIU123456789' : ''
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth label="Date de paiement" name="date_paiement"
                  type="date" value={form.date_paiement} onChange={handleChange}
                  required slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              {/* Récap pièce choisie */}
              {form.type_piece && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{
                    p: 2, borderRadius: 2, bgcolor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    display: 'flex', alignItems: 'center', gap: 1,
                  }}>
                    <BadgeOutlined color="primary" />
                    <Typography variant="body2" color="primary">
                      Document requis à l&apos;upload :{' '}
                      <strong>{labelPiece}</strong>
                      {' + '}Reçu de paiement
                      {' + '}Bordereau
                    </Typography>
                  </Box>
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained" size="large"
                  onClick={creerEnregistrement}
                  disabled={loading || !form.nom_client || !form.prenom_client || !form.type_piece || !form.numero_piece || !form.date_paiement}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
                >
                  Enregistrer et continuer
                </Button>
              </Grid>
            </Grid>
          )}

          {/* ── ÉTAPE 1 : Upload docs ── */}
          {etape === 1 && form.type_piece && (
            <Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Uploadez les <strong>3 documents obligatoires</strong> pour cet enregistrement.
              </Typography>

              <Grid container spacing={2}>
                {/* Reçu de paiement */}
                {[
                  { stateKey: 'recu_paiement' as keyof FichiersState, label: 'Reçu de paiement' },
                  { stateKey: 'bordereau'     as keyof FichiersState, label: 'Bordereau' },
                  {
                    stateKey: 'piece' as keyof FichiersState,
                    label: labelPiece || `Pièce d'identité`,
                  },
                ].map(({ stateKey, label }) => (
                  <Grid size={{ xs: 12 }} key={stateKey}>
                    <Card variant="outlined" sx={{
                      p: 2, borderRadius: 2,
                      borderColor: fichiers[stateKey] ? 'success.main' : 'divider',
                      bgcolor: fichiers[stateKey] ? '#f0fdf4' : 'white',
                      transition: 'all 0.2s',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {fichiers[stateKey]
                            ? <CheckCircleOutlined color="success" />
                            : <UploadFileOutlined color="action" />
                          }
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                              {label}
                            </Typography>
                            {fichiers[stateKey] && (
                              <Typography variant="caption" color="success.main">
                                {fichiers[stateKey]!.name}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Button
                          variant={fichiers[stateKey] ? 'outlined' : 'contained'}
                          component="label"
                          size="small"
                          color={fichiers[stateKey] ? 'success' : 'primary'}
                          startIcon={<UploadFileOutlined />}
                        >
                          {fichiers[stateKey] ? 'Changer' : 'Choisir'}
                          <input
                            type="file" hidden
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              setFichiers({ ...fichiers, [stateKey]: file })
                            }}
                          />
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Indicateur progression */}
              <Box sx={{ display: 'flex', gap: 1, mt: 3, mb: 3 }}>
                {(['recu_paiement', 'bordereau', 'piece'] as (keyof FichiersState)[]).map((k) => (
                  <Chip
                    key={k} size="small"
                    label={fichiers[k] ? '✅' : '⏳'}
                    color={fichiers[k] ? 'success' : 'default'}
                  />
                ))}
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {Object.values(fichiers).filter(Boolean).length} / 3 documents
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => {
                    if (window.confirm("L'enregistrement a déjà été créé. Retourner à l'étape 1 ne le supprimera pas. Continuer ?")) {
                      setEtape(0)
                    }
                  }}
                >
                  Retour
                </Button>
                <Button
                  variant="contained" size="large"
                  onClick={uploaderDocuments}
                  disabled={loading || !fichiers.recu_paiement || !fichiers.bordereau || !fichiers.piece}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <UploadFileOutlined />}
                >
                  Envoyer les documents
                </Button>
              </Box>
            </Box>
          )}

          {/* ── ÉTAPE 2 : Confirmation ── */}
          {etape === 2 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '50%',
                bgcolor: '#f0fdf4', border: '2px solid #86efac',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', mx: 'auto', mb: 3,
              }}>
                <CheckCircleOutlined sx={{ fontSize: 44, color: 'success.main' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Enregistrement créé !
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                Les 3 documents ont été uploadés avec succès.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Le dossier est en attente de validation par la conformité.
              </Typography>

              {/* Récap */}
              <Card variant="outlined" sx={{ maxWidth: 360, mx: 'auto', mb: 4, textAlign: 'left' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                    Récapitulatif
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Client : <strong>{form.prenom_client} {form.nom_client}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pièce : <strong>{labelPiece}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Numéro : <strong>{form.numero_piece}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date : <strong>{new Date(form.date_paiement).toLocaleDateString('fr-FR')}</strong>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="outlined" onClick={() => router.push('/caissier')}>
                  Retour à la liste
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setEtape(0)
                    setForm({ nom_client: '', prenom_client: '', type_piece: '', numero_piece: '', date_paiement: '' })
                    setFichiers({ recu_paiement: null, bordereau: null, piece: null })
                    setEnregId(null)
                    setError('')
                  }}
                >
                  Nouvel enregistrement
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}