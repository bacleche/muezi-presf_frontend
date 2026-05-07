'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, TextField,
  Button, Grid, CircularProgress, Stepper,
  Step, StepLabel, Divider
} from '@mui/material'
import { SaveOutlined, UploadFileOutlined, CheckCircleOutlined } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { enregistrementAPI, documentAPI } from '@/lib/api'

const STEPS = ['Informations client', 'Upload des documents', 'Confirmation']

type DocKey = 'recu_paiement' | 'bordereau' | 'carte_identite'

const TYPE_DOCS: { key: DocKey; label: string; description: string }[] = [
  { key: 'recu_paiement',  label: 'Reçu de paiement',  description: 'PDF ou image du reçu de paiement' },
  { key: 'bordereau',      label: 'Bordereau',          description: 'Bordereau de versement' },
  { key: 'carte_identite', label: "Carte d'identité",   description: "CNI recto/verso du client" },
]

type FormState = {
  nom_client:    string
  prenom_client: string
  montant:       string
  date_paiement: string
}

type FichiersState = Record<DocKey, File | null>

export default function NouvelEnregistrementPage() {
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()

  const [etape, setEtape]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [enregId, setEnregId] = useState<number | null>(null)

  const [form, setForm] = useState<FormState>({
    nom_client: '', prenom_client: '',
    montant: '', date_paiement: '',
  })
  const [fichiers, setFichiers] = useState<FichiersState>({
    recu_paiement: null, bordereau: null, carte_identite: null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  // ── Étape 1 : créer l'enregistrement ──
  const creerEnregistrement = async () => {
    if (!form.nom_client || !form.prenom_client || !form.montant || !form.date_paiement) {
      enqueueSnackbar('Veuillez remplir tous les champs obligatoires.', { variant: 'warning' })
      return
    }
    setLoading(true)
    try {
      const { data } = await enregistrementAPI.creer(form)
      setEnregId(data.id)
      enqueueSnackbar('Informations enregistrées. Uploadez maintenant les documents.', { variant: 'info' })
      setEtape(1)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      enqueueSnackbar(e.response?.data?.detail || 'Erreur lors de la création.', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // ── Étape 2 : uploader les 3 docs ──
  const uploaderDocuments = async () => {
    // Vérifier que tous les fichiers sont présents
    const manquant = TYPE_DOCS.find(({ key }) => !fichiers[key])
    if (manquant) {
      enqueueSnackbar(`Document manquant : ${manquant.label}`, { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      for (const { key } of TYPE_DOCS) {
        const fichier = fichiers[key]!
        const formData = new FormData()
        formData.append('enregistrement', String(enregId))
        formData.append('type_doc', key)
        formData.append('fichier', fichier)
        await documentAPI.uploader(formData)
      }
      enqueueSnackbar('Enregistrement créé avec succès ! Redirection...', { variant: 'success' })
      setEtape(2)
      // Redirection vers la liste après 1.5s pour laisser le toast visible
      setTimeout(() => router.push('/caissier/enregistrements'), 1500)
    } catch {
      enqueueSnackbar("Erreur lors de l'upload des documents.", { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Nouvel enregistrement</Typography>

      <Stepper activeStep={etape} sx={{ mb: 4 }}>
        {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
      </Stepper>

      <Card>
        <CardContent sx={{ p: 4 }}>

          {/* ── ÉTAPE 0 : Infos client ── */}
          {etape === 0 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth label="Nom du client" name="nom_client"
                  value={form.nom_client} onChange={handleChange} required
                  disabled={loading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth label="Prénom du client" name="prenom_client"
                  value={form.prenom_client} onChange={handleChange} required
                  disabled={loading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth label="Montant (FCFA)" name="montant"
                  type="number" value={form.montant} onChange={handleChange}
                  required disabled={loading}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth label="Date de paiement" name="date_paiement"
                  type="date" value={form.date_paiement} onChange={handleChange}
                  required disabled={loading}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained" size="large"
                  onClick={creerEnregistrement}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer et continuer'}
                </Button>
              </Grid>
            </Grid>
          )}

          {/* ── ÉTAPE 1 : Upload docs ── */}
          {etape === 1 && (
            <Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Uploadez les 3 documents obligatoires. Formats acceptés : PDF, JPG, PNG.
              </Typography>
              <Grid container spacing={2}>
                {TYPE_DOCS.map(({ key, label, description }) => {
                  const fichier = fichiers[key]
                  return (
                    <Grid size={{ xs: 12 }} key={key}>
                      <Card variant="outlined" sx={{
                        p: 2,
                        borderColor: fichier ? 'success.main' : 'divider',
                        bgcolor: fichier ? 'success.50' : 'background.paper',
                        transition: 'all 0.2s',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {fichier ? fichier.name : description}
                            </Typography>
                            {fichier && (
                              <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                                ✅ {(fichier.size / 1024).toFixed(0)} Ko
                              </Typography>
                            )}
                          </Box>
                          <Button
                            variant={fichier ? 'outlined' : 'contained'}
                            color={fichier ? 'success' : 'primary'}
                            component="label"
                            disabled={loading}
                            startIcon={fichier ? <CheckCircleOutlined /> : <UploadFileOutlined />}
                            sx={{ flexShrink: 0 }}
                          >
                            {fichier ? 'Changer' : 'Choisir'}
                            <input
                              type="file" hidden
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFichiers({ ...fichiers, [key]: e.target.files?.[0] ?? null })
                              }
                            />
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setEtape(0)}
                  disabled={loading}
                >
                  Retour
                </Button>
                <Button
                  variant="contained" size="large"
                  onClick={uploaderDocuments}
                  disabled={loading || TYPE_DOCS.some(({ key }) => !fichiers[key])}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <UploadFileOutlined />}
                >
                  {loading ? 'Upload en cours...' : 'Envoyer les documents'}
                </Button>
              </Box>
            </Box>
          )}

          {/* ── ÉTAPE 2 : Confirmation (transition) ── */}
          {etape === 2 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress size={48} sx={{ mb: 3 }} />
              <Typography variant="h6" color="success.main" gutterBottom>
                Enregistrement créé avec succès !
              </Typography>
              <Typography color="text.secondary">
                Redirection vers la liste en cours...
              </Typography>
            </Box>
          )}

        </CardContent>
      </Card>
    </Box>
  )
}