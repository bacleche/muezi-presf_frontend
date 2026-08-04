// 'use client'
// import { useState } from 'react'
// import { useRouter } from 'next/navigation'

// import {
//   Box, Typography, Card, CardContent, Button,
//   Grid, TextField, Alert, CircularProgress,
//   Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
// } from '@mui/material'
// import { SaveOutlined, ArrowBackOutlined, PhotoCamera, WarningAmberOutlined } from '@mui/icons-material'
// import { clientAPI } from '@/lib/api'

// export default function NouveauClientPage() {
//   const router = useRouter()
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [files, setFiles] = useState<Record<string, File | null>>({})
//   const [confirmOuvert, setConfirmOuvert] = useState(false)

//   const [form, setForm] = useState({
//     nom: '', prenom: '', telephone: '', email: '', adresse: '',
//     cni_numero: '', cni_expiration: '',
//     permis_numero: '', permis_expiration: '',
//     passport_numero: '', passport_expiration: '',
//     niu_numero: '', niu_expiration: '',
//     permis_etranger_numero: '', permis_etranger_expiration: '',
//     resident_numero: '', resident_expiration: '',
//     refugie_numero: '', refugie_expiration: '',
//     consulaire_numero: '', consulaire_expiration: '',
//   })

//   const DOCUMENTS = [
//     { name: 'cni', label: 'CNI' },
//     { name: 'permis', label: 'Permis' },
//     { name: 'permis_etranger', label: 'Permis étranger' },
//     { name: 'passport', label: 'Passeport' },
//     { name: 'niu', label: 'NIU' },
//     { name: 'resident', label: 'Carte de résident' },
//     { name: 'refugie', label: 'Carte de réfugié' },
//     { name: 'consulaire', label: 'Carte consulaire' },
//   ];

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setForm({ ...form, [e.target.name]: e.target.value })
//   }

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0] || null
//     setFiles({ ...files, [e.target.name]: file })
//   }

//   // Vrai si aucun numéro de pièce n'a été renseigné
//   const aucunePieceAssignee = () => {
//     return DOCUMENTS.every((doc) => {
//       const numero = form[`${doc.name}_numero` as keyof typeof form]
//       return !numero || !numero.trim()
//     })
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Si aucune pièce n'est assignée, on demande confirmation avant de continuer
//     if (aucunePieceAssignee()) {
//       setConfirmOuvert(true)
//       return
//     }

//     await enregistrerClient()
//   };

//   const enregistrerClient = async () => {
//     setLoading(true);
//     setError('');

//     const formData = new FormData();

//     Object.entries(form).forEach(([key, value]) => {
//       if (key.endsWith('_expiration') && !value) return
//       formData.append(key, value.trim());
//     });

//     Object.entries(files).forEach(([key, file]) => {
//       if (file) formData.append(key, file);
//     });

//     try {
//       await clientAPI.creer(formData);
//       router.push('/chef-agence/clients');
//     } catch (err: any) {
//       console.error("Erreur API:", err);
//       const msgs = err.response?.data ? Object.values(err.response.data).flat() : ["Erreur lors de l'enregistrement."];
//       setError(typeof msgs[0] === 'string' ? msgs[0] : "Une erreur est survenue.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleConfirmerSansPiece = () => {
//     setConfirmOuvert(false)
//     enregistrerClient()
//   }

//   return (
//     <Box sx={{ p: 1 }}>
//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
//         <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small" onClick={() => router.back()}>
//           Retour
//         </Button>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 700 }}>Nouvel Enregistrement</Typography>
//           <Typography variant="body2" color="text.secondary">Capture directe ou upload document</Typography>
//         </Box>
//       </Box>

//       <Card sx={{ maxWidth: 650, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 3 }}>
//         <CardContent sx={{ p: 4 }}>
//           {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

//           <form onSubmit={handleSubmit}>
//             <Grid container spacing={3}>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <TextField fullWidth label="Nom" name="nom" value={form.nom} onChange={handleChange} required />
//               </Grid>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <TextField fullWidth label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} required />
//               </Grid>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <TextField fullWidth label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} />
//               </Grid>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <TextField fullWidth type="email" label="Email" name="email" value={form.email} onChange={handleChange} />
//               </Grid>

//               <Grid size={{ xs: 12 }}>
//                 <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, fontWeight: 700 }}>
//                   Documents d'identité (Recto/Verso conseillé)
//                 </Typography>

//                 {DOCUMENTS.map((doc) => (
//                   <Grid container spacing={2} key={doc.name} sx={{ mb: 2 }}>
//                     <Grid size={{ xs: 12, sm: 4 }}>
//                       <TextField
//                         fullWidth size="small" label={`N° ${doc.label}`}
//                         name={`${doc.name}_numero`}
//                         value={form[`${doc.name}_numero` as keyof typeof form]}
//                         onChange={handleChange}
//                       />
//                     </Grid>

//                     <Grid size={{ xs: 12, sm: 4 }}>
//                       <TextField
//                         fullWidth size="small" type="date"
//                         label={`Expiration ${doc.label}`}
//                         name={`${doc.name}_expiration`}
//                         value={form[`${doc.name}_expiration` as keyof typeof form]}
//                         onChange={handleChange}
//                         slotProps={{
//                           inputLabel: { shrink: true },
//                           htmlInput: { min: new Date().toISOString().split('T')[0] }
//                         }}
//                       />
//                     </Grid>

//                     <Grid size={{ xs: 12, sm: 4 }}>
//                       <Button
//                         variant="outlined" component="label" fullWidth
//                         startIcon={<PhotoCamera />}
//                         sx={{ height: '40px' }}
//                       >
//                         {files[`${doc.name}_file`] ? 'Image prête' : `Photo ${doc.label}`}
//                         <input
//                           type="file" name={`${doc.name}_file`} hidden
//                           accept="image/*" capture="environment"
//                           onChange={handleFileChange}
//                         />
//                       </Button>
//                     </Grid>
//                   </Grid>
//                 ))}
//               </Grid>

//             </Grid>

//             <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
//               <Button
//                 type="submit" variant="contained" size="large"
//                 disabled={loading}
//                 startIcon={loading ? <CircularProgress size={18} /> : <SaveOutlined />}
//                 sx={{ bgcolor: '#0D47A1', px: 4 }}
//               >
//                 Enregistrer
//               </Button>
//             </Box>
//           </form>
//         </CardContent>
//       </Card>

//       {/* Confirmation si aucune pièce d'identité n'est assignée */}
//       <Dialog open={confirmOuvert} onClose={() => setConfirmOuvert(false)}>
//         <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <WarningAmberOutlined color="warning" />
//           Aucune pièce d'identité renseignée
//         </DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             Vous vous apprêtez à enregistrer ce client sans lui associer de pièce d'identité (CNI, passeport, permis...).
//             Voulez-vous continuer quand même ?
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2 }}>
//           <Button onClick={() => setConfirmOuvert(false)} color="inherit">
//             Annuler
//           </Button>
//           <Button onClick={handleConfirmerSansPiece} variant="contained" sx={{ bgcolor: '#0D47A1' }}>
//             Enregistrer quand même
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   )
// }

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  Box, Typography, Card, CardContent, Button,
  Grid, TextField, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material'
import { SaveOutlined, ArrowBackOutlined, PhotoCamera, WarningAmberOutlined, BlockOutlined } from '@mui/icons-material'
import { clientAPI } from '@/lib/api'

export default function NouveauClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<Record<string, File | null>>({})

  // NOUVEAU : modal de blocage (aucune pièce)
  const [modalBloqueOuvert, setModalBloqueOuvert] = useState(false)

  // NOUVEAU : modal de doublon détecté
  const [modalDoublonOuvert, setModalDoublonOuvert] = useState(false)
  const [clientExistant, setClientExistant] = useState<{
    id: number; nom: string; prenom: string; telephone: string; agence_nom: string
  } | null>(null)

  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '', email: '', adresse: '',
    cni_numero: '', cni_expiration: '',
    permis_numero: '', permis_expiration: '',
    passport_numero: '', passport_expiration: '',
    niu_numero: '', niu_expiration: '',
    permis_etranger_numero: '', permis_etranger_expiration: '',
    resident_numero: '', resident_expiration: '',
    refugie_numero: '', refugie_expiration: '',
    consulaire_numero: '', consulaire_expiration: '',
  })

  const DOCUMENTS = [
    { name: 'cni', label: 'CNI' },
    { name: 'permis', label: 'Permis' },
    { name: 'permis_etranger', label: 'Permis étranger' },
    { name: 'passport', label: 'Passeport' },
    { name: 'niu', label: 'NIU' },
    { name: 'resident', label: 'Carte de résident' },
    { name: 'refugie', label: 'Carte de réfugié' },
    { name: 'consulaire', label: 'Carte consulaire' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFiles({ ...files, [e.target.name]: file })
  }

  // Vrai si aucun numéro de pièce n'a été renseigné
  const aucunePieceAssignee = () => {
    return DOCUMENTS.every((doc) => {
      const numero = form[`${doc.name}_numero` as keyof typeof form]
      return !numero || !numero.trim()
    })
  }

  const numerosRenseignes = () => {
    return DOCUMENTS
      .map((doc) => form[`${doc.name}_numero` as keyof typeof form])
      .filter((n) => n && n.trim())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('')

    // NOUVEAU : blocage strict — aucune pièce = pas de soumission possible
    if (aucunePieceAssignee()) {
      setModalBloqueOuvert(true)
      return
    }

    // NOUVEAU : vérification de doublon (téléphone + numéros de pièces)
    setLoading(true)
    try {
      const { data } = await clientAPI.verifierExistant({
        telephone: form.telephone.trim() || undefined,
        numeros: numerosRenseignes(),
      })
      if (data.existe) {
        setClientExistant(data.client)
        setModalDoublonOuvert(true)
        setLoading(false)
        return
      }
    } catch {
      // Si la vérification échoue techniquement, on ne bloque pas
      // l'enregistrement pour autant — on continue normalement.
    }

    await enregistrerClient()
  };

  const enregistrerClient = async () => {
    setLoading(true);
    setError('');

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (key.endsWith('_expiration') && !value) return
      formData.append(key, value.trim());
    });

    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });

    try {
      await clientAPI.creer(formData);
      router.push('/chef-agence/clients');
    } catch (err: any) {
      console.error("Erreur API:", err);
      const msgs = err.response?.data ? Object.values(err.response.data).flat() : ["Erreur lors de l'enregistrement."];
      setError(typeof msgs[0] === 'string' ? msgs[0] : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small" onClick={() => router.back()}>
          Retour
        </Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Nouvel Enregistrement</Typography>
          <Typography variant="body2" color="text.secondary">Capture directe ou upload document</Typography>
        </Box>
      </Box>

      <Card sx={{ maxWidth: 650, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Nom" name="nom" value={form.nom} onChange={handleChange} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth type="email" label="Email" name="email" value={form.email} onChange={handleChange} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, fontWeight: 700 }}>
                  Documents d'identité (Recto/Verso conseillé) *
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Au moins un numéro de pièce d'identité est obligatoire pour enregistrer le client.
                </Typography>

                {DOCUMENTS.map((doc) => (
                  <Grid container spacing={2} key={doc.name} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth size="small" label={`N° ${doc.label}`}
                        name={`${doc.name}_numero`}
                        value={form[`${doc.name}_numero` as keyof typeof form]}
                        onChange={handleChange}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth size="small" type="date"
                        label={`Expiration ${doc.label}`}
                        name={`${doc.name}_expiration`}
                        value={form[`${doc.name}_expiration` as keyof typeof form]}
                        onChange={handleChange}
                        slotProps={{
                          inputLabel: { shrink: true },
                          htmlInput: { min: new Date().toISOString().split('T')[0] }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Button
                        variant="outlined" component="label" fullWidth
                        startIcon={<PhotoCamera />}
                        sx={{ height: '40px' }}
                      >
                        {files[`${doc.name}_file`] ? 'Image prête' : `Photo ${doc.label}`}
                        <input
                          type="file" name={`${doc.name}_file`} hidden
                          accept="image/*" capture="environment"
                          onChange={handleFileChange}
                        />
                      </Button>
                    </Grid>
                  </Grid>
                ))}
              </Grid>

            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit" variant="contained" size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} /> : <SaveOutlined />}
                sx={{ bgcolor: '#0D47A1', px: 4 }}
              >
                Enregistrer
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* NOUVEAU : modal de blocage — aucune pièce fournie */}
      <Dialog open={modalBloqueOuvert} onClose={() => setModalBloqueOuvert(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BlockOutlined color="error" />
          Opération interrompue
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vous ne pouvez pas enregistrer le client sans pièce d'identité. Ajoutez au moins un numéro de pièce avant de continuer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalBloqueOuvert(false)} variant="contained" sx={{ bgcolor: '#0D47A1' }}>
            Annuler
          </Button>
        </DialogActions>
      </Dialog>

      {/* NOUVEAU : modal doublon détecté */}
      <Dialog open={modalDoublonOuvert} onClose={() => setModalDoublonOuvert(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberOutlined color="warning" />
          Client déjà existant
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {clientExistant && (
              <>
                Un client correspondant existe déjà : <strong>{clientExistant.prenom} {clientExistant.nom}</strong> (agence {clientExistant.agence_nom}).
                {' '}Vérifiez qu'il ne s'agit pas d'un doublon avant de poursuivre.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalDoublonOuvert(false)} color="inherit">
            Annuler
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}