// 'use client'
// import { useState } from 'react'
// import { useRouter } from 'next/navigation'

// import {
//   Box, Typography, Card, CardContent, Button,
//   Grid, TextField, Alert, CircularProgress,
//   Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
// } from '@mui/material'
// import { SaveOutlined, ArrowBackOutlined, PhotoCamera, WarningAmberOutlined, BlockOutlined } from '@mui/icons-material'
// import { clientAPI } from '@/lib/api'

// export default function NouveauClientPage() {
//   const router = useRouter()
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [files, setFiles] = useState<Record<string, File | null>>({})

//   // NOUVEAU : modal de blocage (aucune pièce)
//   const [modalBloqueOuvert, setModalBloqueOuvert] = useState(false)

//   // NOUVEAU : modal de doublon détecté
//   const [modalDoublonOuvert, setModalDoublonOuvert] = useState(false)
//   const [clientExistant, setClientExistant] = useState<{
//     id: number; nom: string; prenom: string; telephone: string; agence_nom: string
//   } | null>(null)

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

//   const numerosRenseignes = () => {
//     return DOCUMENTS
//       .map((doc) => form[`${doc.name}_numero` as keyof typeof form])
//       .filter((n) => n && n.trim())
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('')

//     // NOUVEAU : blocage strict — aucune pièce = pas de soumission possible
//     if (aucunePieceAssignee()) {
//       setModalBloqueOuvert(true)
//       return
//     }

//     // NOUVEAU : vérification de doublon (téléphone + numéros de pièces)
//     setLoading(true)
//     try {
//       const { data } = await clientAPI.verifierExistant({
//         telephone: form.telephone.trim() || undefined,
//         numeros: numerosRenseignes(),
//       })
//       if (data.existe) {
//         setClientExistant(data.client)
//         setModalDoublonOuvert(true)
//         setLoading(false)
//         return
//       }
//     } catch {
//       // Si la vérification échoue techniquement, on ne bloque pas
//       // l'enregistrement pour autant — on continue normalement.
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
//                   Documents d'identité (Recto/Verso conseillé) *
//                 </Typography>
//                 <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
//                   Au moins un numéro de pièce d'identité est obligatoire pour enregistrer le client.
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

//       {/* NOUVEAU : modal de blocage — aucune pièce fournie */}
//       <Dialog open={modalBloqueOuvert} onClose={() => setModalBloqueOuvert(false)}>
//         <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <BlockOutlined color="error" />
//           Opération interrompue
//         </DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             Vous ne pouvez pas enregistrer le client sans pièce d'identité. Ajoutez au moins un numéro de pièce avant de continuer.
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2 }}>
//           <Button onClick={() => setModalBloqueOuvert(false)} variant="contained" sx={{ bgcolor: '#0D47A1' }}>
//             Annuler
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* NOUVEAU : modal doublon détecté */}
//       <Dialog open={modalDoublonOuvert} onClose={() => setModalDoublonOuvert(false)}>
//         <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <WarningAmberOutlined color="warning" />
//           Client déjà existant
//         </DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             {clientExistant && (
//               <>
//                 Un client correspondant existe déjà : <strong>{clientExistant.prenom} {clientExistant.nom}</strong> (agence {clientExistant.agence_nom}).
//                 {' '}Vérifiez qu'il ne s'agit pas d'un doublon avant de poursuivre.
//               </>
//             )}
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2 }}>
//           <Button onClick={() => setModalDoublonOuvert(false)} color="inherit">
//             Annuler
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   )
// }


// 'use client'
// import { useState } from 'react'
// import { useRouter } from 'next/navigation'

// import {
//   Box, Typography, Card, CardContent, Button,
//   Grid, TextField, Alert, CircularProgress,
//   Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
// } from '@mui/material'
// import { SaveOutlined, ArrowBackOutlined, PhotoCamera, WarningAmberOutlined, BlockOutlined, RestartAltOutlined } from '@mui/icons-material'
// import { clientAPI } from '@/lib/api'

// export default function NouveauClientPage() {
//   const router = useRouter()
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [files, setFiles] = useState<Record<string, File | null>>({})

//   // NOUVEAU : parts recto/verso capturées avant fusion (par document)
//   const [capturedParts, setCapturedParts] = useState<
//     Record<string, { recto?: File; verso?: File }>
//   >({})
//   const [fusionEnCours, setFusionEnCours] = useState<Record<string, boolean>>({})

//   // modal de blocage (aucune pièce)
//   const [modalBloqueOuvert, setModalBloqueOuvert] = useState(false)

//   // modal de doublon détecté
//   const [modalDoublonOuvert, setModalDoublonOuvert] = useState(false)
//   const [clientExistant, setClientExistant] = useState<{
//     id: number; nom: string; prenom: string; telephone: string; agence_nom: string
//   } | null>(null)

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

//   // NOUVEAU : fusionne recto + verso en une seule image (recto en haut, verso en bas)
//   // -> le backend continue de recevoir un seul fichier par pièce, sous la même clé qu'avant (`${doc.name}_file`)
//   const fusionnerRectoVerso = (recto: File, verso: File): Promise<File> => {
//     return new Promise((resolve, reject) => {
//       const imgRecto = new Image()
//       const imgVerso = new Image()
//       let loaded = 0

//       const onBothLoaded = () => {
//         const largeur = Math.max(imgRecto.width, imgVerso.width)
//         const gap = 20
//         const hauteurRecto = (imgRecto.height * largeur) / imgRecto.width
//         const hauteurVerso = (imgVerso.height * largeur) / imgVerso.width
//         const hauteurTotale = hauteurRecto + hauteurVerso + gap

//         const canvas = document.createElement('canvas')
//         canvas.width = largeur
//         canvas.height = hauteurTotale
//         const ctx = canvas.getContext('2d')
//         if (!ctx) return reject(new Error('Canvas non supporté'))

//         ctx.fillStyle = '#ffffff'
//         ctx.fillRect(0, 0, largeur, hauteurTotale)

//         ctx.drawImage(imgRecto, 0, 0, largeur, hauteurRecto)
//         ctx.drawImage(imgVerso, 0, hauteurRecto + gap, largeur, hauteurVerso)

//         ctx.strokeStyle = '#cccccc'
//         ctx.lineWidth = 2
//         ctx.beginPath()
//         ctx.moveTo(0, hauteurRecto + gap / 2)
//         ctx.lineTo(largeur, hauteurRecto + gap / 2)
//         ctx.stroke()

//         canvas.toBlob((blob) => {
//           if (!blob) return reject(new Error('Échec de la fusion'))
//           const fichierFusionne = new File(
//             [blob],
//             `${recto.name.split('.')[0]}_recto_verso.jpg`,
//             { type: 'image/jpeg' }
//           )
//           resolve(fichierFusionne)
//         }, 'image/jpeg', 0.9)

//         URL.revokeObjectURL(imgRecto.src)
//         URL.revokeObjectURL(imgVerso.src)
//       }

//       imgRecto.onload = () => { loaded++; if (loaded === 2) onBothLoaded() }
//       imgVerso.onload = () => { loaded++; if (loaded === 2) onBothLoaded() }
//       imgRecto.onerror = () => reject(new Error('Erreur chargement recto'))
//       imgVerso.onerror = () => reject(new Error('Erreur chargement verso'))

//       imgRecto.src = URL.createObjectURL(recto)
//       imgVerso.src = URL.createObjectURL(verso)
//     })
//   }

//   // NOUVEAU : capture une face (recto ou verso), fusionne dès que les deux sont prêtes
//   const handleCaptureRectoVerso = async (
//     docName: string,
//     face: 'recto' | 'verso',
//     e: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const file = e.target.files?.[0]
//     if (!file) return

//     const nouvellesParts = {
//       ...capturedParts,
//       [docName]: { ...capturedParts[docName], [face]: file },
//     }
//     setCapturedParts(nouvellesParts)

//     const { recto, verso } = nouvellesParts[docName]
//     if (recto && verso) {
//       setFusionEnCours({ ...fusionEnCours, [docName]: true })
//       try {
//         const fusionne = await fusionnerRectoVerso(recto, verso)
//         setFiles((prev) => ({ ...prev, [`${docName}_file`]: fusionne }))
//       } catch {
//         setError(`Erreur lors de la fusion des photos pour "${docName}". Réessayez.`)
//       } finally {
//         setFusionEnCours((prev) => ({ ...prev, [docName]: false }))
//       }
//     }

//     // permet de reprendre la même face une seconde fois si besoin
//     e.target.value = ''
//   }

//   // NOUVEAU : réinitialise recto/verso/fusion pour une pièce donnée
//   const handleReinitialiserDocument = (docName: string) => {
//     const { [docName]: _omit, ...restParts } = capturedParts
//     setCapturedParts(restParts)
//     setFiles((prev) => {
//       const { [`${docName}_file`]: _omitFile, ...rest } = prev
//       return rest
//     })
//   }

//   // Vrai si aucun numéro de pièce n'a été renseigné
//   const aucunePieceAssignee = () => {
//     return DOCUMENTS.every((doc) => {
//       const numero = form[`${doc.name}_numero` as keyof typeof form]
//       return !numero || !numero.trim()
//     })
//   }

//   const numerosRenseignes = () => {
//     return DOCUMENTS
//       .map((doc) => form[`${doc.name}_numero` as keyof typeof form])
//       .filter((n) => n && n.trim())
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('')

//     // blocage strict — aucune pièce = pas de soumission possible
//     if (aucunePieceAssignee()) {
//       setModalBloqueOuvert(true)
//       return
//     }

//     // vérification de doublon (téléphone + numéros de pièces)
//     setLoading(true)
//     try {
//       const { data } = await clientAPI.verifierExistant({
//         telephone: form.telephone.trim() || undefined,
//         numeros: numerosRenseignes(),
//       })
//       if (data.existe) {
//         setClientExistant(data.client)
//         setModalDoublonOuvert(true)
//         setLoading(false)
//         return
//       }
//     } catch {
//       // Si la vérification échoue techniquement, on ne bloque pas
//       // l'enregistrement pour autant — on continue normalement.
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

//     // NOTE : `files` ne contient que des images déjà fusionnées (`${doc.name}_file`)
//     // -> le backend reçoit exactement le même format qu'avant, un seul fichier par pièce.
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
//                   Documents d'identité (Recto/Verso conseillé) *
//                 </Typography>
//                 <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
//                   Au moins un numéro de pièce d'identité est obligatoire pour enregistrer le client.
//                   Le recto et le verso sont automatiquement fusionnés en une seule image.
//                 </Typography>

//                 {DOCUMENTS.map((doc) => {
//                   const parts = capturedParts[doc.name] || {}
//                   const estFusionne = !!files[`${doc.name}_file`]
//                   const enCoursDeFusion = !!fusionEnCours[doc.name]

//                   return (
//                     <Grid container spacing={2} key={doc.name} sx={{ mb: 2 }}>
//                       <Grid size={{ xs: 12, sm: 4 }}>
//                         <TextField
//                           fullWidth size="small" label={`N° ${doc.label}`}
//                           name={`${doc.name}_numero`}
//                           value={form[`${doc.name}_numero` as keyof typeof form]}
//                           onChange={handleChange}
//                         />
//                       </Grid>

//                       <Grid size={{ xs: 12, sm: 4 }}>
//                         <TextField
//                           fullWidth size="small" type="date"
//                           label={`Expiration ${doc.label}`}
//                           name={`${doc.name}_expiration`}
//                           value={form[`${doc.name}_expiration` as keyof typeof form]}
//                           onChange={handleChange}
//                           slotProps={{
//                             inputLabel: { shrink: true },
//                             htmlInput: { min: new Date().toISOString().split('T')[0] }
//                           }}
//                         />
//                       </Grid>

//                       <Grid size={{ xs: 12, sm: 4 }}>
//                         <Box sx={{ display: 'flex', gap: 1 }}>
//                           <Button
//                             variant="outlined" component="label" size="small" fullWidth
//                             startIcon={<PhotoCamera />}
//                             disabled={enCoursDeFusion}
//                             sx={{ height: '40px' }}
//                           >
//                             {parts.recto ? 'Recto ✓' : 'Recto'}
//                             <input
//                               type="file" hidden accept="image/*" capture="environment"
//                               onChange={(e) => handleCaptureRectoVerso(doc.name, 'recto', e)}
//                             />
//                           </Button>
//                           <Button
//                             variant="outlined" component="label" size="small" fullWidth
//                             startIcon={<PhotoCamera />}
//                             disabled={enCoursDeFusion}
//                             sx={{ height: '40px' }}
//                           >
//                             {parts.verso ? 'Verso ✓' : 'Verso'}
//                             <input
//                               type="file" hidden accept="image/*" capture="environment"
//                               onChange={(e) => handleCaptureRectoVerso(doc.name, 'verso', e)}
//                             />
//                           </Button>
//                         </Box>

//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
//                           {enCoursDeFusion && (
//                             <>
//                               <CircularProgress size={12} />
//                               <Typography variant="caption" color="text.secondary">Fusion en cours...</Typography>
//                             </>
//                           )}
//                           {!enCoursDeFusion && estFusionne && (
//                             <>
//                               <Typography variant="caption" color="success.main">Image prête ✓</Typography>
//                               <Button
//                                 size="small" color="inherit"
//                                 startIcon={<RestartAltOutlined fontSize="small" />}
//                                 onClick={() => handleReinitialiserDocument(doc.name)}
//                                 sx={{ minWidth: 0, textTransform: 'none', fontSize: '0.75rem' }}
//                               >
//                                 Refaire
//                               </Button>
//                             </>
//                           )}
//                         </Box>
//                       </Grid>
//                     </Grid>
//                   )
//                 })}
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

//       {/* modal de blocage — aucune pièce fournie */}
//       <Dialog open={modalBloqueOuvert} onClose={() => setModalBloqueOuvert(false)}>
//         <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <BlockOutlined color="error" />
//           Opération interrompue
//         </DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             Vous ne pouvez pas enregistrer le client sans pièce d'identité. Ajoutez au moins un numéro de pièce avant de continuer.
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2 }}>
//           <Button onClick={() => setModalBloqueOuvert(false)} variant="contained" sx={{ bgcolor: '#0D47A1' }}>
//             Annuler
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* modal doublon détecté */}
//       <Dialog open={modalDoublonOuvert} onClose={() => setModalDoublonOuvert(false)}>
//         <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <WarningAmberOutlined color="warning" />
//           Client déjà existant
//         </DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             {clientExistant && (
//               <>
//                 Un client correspondant existe déjà : <strong>{clientExistant.prenom} {clientExistant.nom}</strong> (agence {clientExistant.agence_nom}).
//                 {' '}Vérifiez qu'il ne s'agit pas d'un doublon avant de poursuivre.
//               </>
//             )}
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2 }}>
//           <Button onClick={() => setModalDoublonOuvert(false)} color="inherit">
//             Annuler
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
import { SaveOutlined, ArrowBackOutlined, PhotoCamera, WarningAmberOutlined, BlockOutlined, RestartAltOutlined } from '@mui/icons-material'
import { clientAPI } from '@/lib/api'

export default function NouveauClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<Record<string, File | null>>({})

  // NOUVEAU : parts recto/verso capturées avant fusion (par document)
  const [capturedParts, setCapturedParts] = useState<
    Record<string, { recto?: File; verso?: File }>
  >({})
  const [fusionEnCours, setFusionEnCours] = useState<Record<string, boolean>>({})

  // modal de blocage (aucune pièce)
  const [modalBloqueOuvert, setModalBloqueOuvert] = useState(false)

  // modal de doublon détecté
  const [modalDoublonOuvert, setModalDoublonOuvert] = useState(false)
  const [clientExistant, setClientExistant] = useState<{
    id: number; nom: string; prenom: string; telephone: string; agence_nom: string
  } | null>(null)
  const [raisonDoublon, setRaisonDoublon] = useState<'telephone' | 'piece' | null>(null)

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

  // NOUVEAU : fusionne recto + verso en une seule image (recto en haut, verso en bas)
  // -> le backend continue de recevoir un seul fichier par pièce, sous la même clé qu'avant (`${doc.name}_file`)
  const fusionnerRectoVerso = (recto: File, verso: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const imgRecto = new Image()
      const imgVerso = new Image()
      let loaded = 0

      const onBothLoaded = () => {
        const largeur = Math.max(imgRecto.width, imgVerso.width)
        const gap = 20
        const hauteurRecto = (imgRecto.height * largeur) / imgRecto.width
        const hauteurVerso = (imgVerso.height * largeur) / imgVerso.width
        const hauteurTotale = hauteurRecto + hauteurVerso + gap

        const canvas = document.createElement('canvas')
        canvas.width = largeur
        canvas.height = hauteurTotale
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas non supporté'))

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, largeur, hauteurTotale)

        ctx.drawImage(imgRecto, 0, 0, largeur, hauteurRecto)
        ctx.drawImage(imgVerso, 0, hauteurRecto + gap, largeur, hauteurVerso)

        ctx.strokeStyle = '#cccccc'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, hauteurRecto + gap / 2)
        ctx.lineTo(largeur, hauteurRecto + gap / 2)
        ctx.stroke()

        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Échec de la fusion'))
          const fichierFusionne = new File(
            [blob],
            `${recto.name.split('.')[0]}_recto_verso.jpg`,
            { type: 'image/jpeg' }
          )
          resolve(fichierFusionne)
        }, 'image/jpeg', 0.9)

        URL.revokeObjectURL(imgRecto.src)
        URL.revokeObjectURL(imgVerso.src)
      }

      imgRecto.onload = () => { loaded++; if (loaded === 2) onBothLoaded() }
      imgVerso.onload = () => { loaded++; if (loaded === 2) onBothLoaded() }
      imgRecto.onerror = () => reject(new Error('Erreur chargement recto'))
      imgVerso.onerror = () => reject(new Error('Erreur chargement verso'))

      imgRecto.src = URL.createObjectURL(recto)
      imgVerso.src = URL.createObjectURL(verso)
    })
  }

  // NOUVEAU : capture une face (recto ou verso), fusionne dès que les deux sont prêtes
  const handleCaptureRectoVerso = async (
    docName: string,
    face: 'recto' | 'verso',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const nouvellesParts = {
      ...capturedParts,
      [docName]: { ...capturedParts[docName], [face]: file },
    }
    setCapturedParts(nouvellesParts)

    const { recto, verso } = nouvellesParts[docName]
    if (recto && verso) {
      setFusionEnCours({ ...fusionEnCours, [docName]: true })
      try {
        const fusionne = await fusionnerRectoVerso(recto, verso)
        setFiles((prev) => ({ ...prev, [`${docName}_file`]: fusionne }))
      } catch {
        setError(`Erreur lors de la fusion des photos pour "${docName}". Réessayez.`)
      } finally {
        setFusionEnCours((prev) => ({ ...prev, [docName]: false }))
      }
    }

    // permet de reprendre la même face une seconde fois si besoin
    e.target.value = ''
  }

  // NOUVEAU : réinitialise recto/verso/fusion pour une pièce donnée
  const handleReinitialiserDocument = (docName: string) => {
    const { [docName]: _omit, ...restParts } = capturedParts
    setCapturedParts(restParts)
    setFiles((prev) => {
      const { [`${docName}_file`]: _omitFile, ...rest } = prev
      return rest
    })
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

    // blocage strict — aucune pièce = pas de soumission possible
    if (aucunePieceAssignee()) {
      setModalBloqueOuvert(true)
      return
    }

    // vérification de doublon (téléphone + numéros de pièces)
    setLoading(true)
    try {
      const { data } = await clientAPI.verifierExistant({
        telephone: form.telephone.trim() || undefined,
        numeros: numerosRenseignes(),
      })
      if (data.existe) {
        setClientExistant(data.client)
        setRaisonDoublon(data.raison || null)
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

    // NOTE : `files` ne contient que des images déjà fusionnées (`${doc.name}_file`)
    // -> le backend reçoit exactement le même format qu'avant, un seul fichier par pièce.
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
                  Le recto et le verso sont automatiquement fusionnés en une seule image.
                </Typography>

                {DOCUMENTS.map((doc) => {
                  const parts = capturedParts[doc.name] || {}
                  const estFusionne = !!files[`${doc.name}_file`]
                  const enCoursDeFusion = !!fusionEnCours[doc.name]

                  return (
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
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined" component="label" size="small" fullWidth
                            startIcon={<PhotoCamera />}
                            disabled={enCoursDeFusion}
                            sx={{ height: '40px' }}
                          >
                            {parts.recto ? 'Recto ✓' : 'Recto'}
                            <input
                              type="file" hidden accept="image/*" capture="environment"
                              onChange={(e) => handleCaptureRectoVerso(doc.name, 'recto', e)}
                            />
                          </Button>
                          <Button
                            variant="outlined" component="label" size="small" fullWidth
                            startIcon={<PhotoCamera />}
                            disabled={enCoursDeFusion}
                            sx={{ height: '40px' }}
                          >
                            {parts.verso ? 'Verso ✓' : 'Verso'}
                            <input
                              type="file" hidden accept="image/*" capture="environment"
                              onChange={(e) => handleCaptureRectoVerso(doc.name, 'verso', e)}
                            />
                          </Button>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          {enCoursDeFusion && (
                            <>
                              <CircularProgress size={12} />
                              <Typography variant="caption" color="text.secondary">Fusion en cours...</Typography>
                            </>
                          )}
                          {!enCoursDeFusion && estFusionne && (
                            <>
                              <Typography variant="caption" color="success.main">Image prête ✓</Typography>
                              <Button
                                size="small" color="inherit"
                                startIcon={<RestartAltOutlined fontSize="small" />}
                                onClick={() => handleReinitialiserDocument(doc.name)}
                                sx={{ minWidth: 0, textTransform: 'none', fontSize: '0.75rem' }}
                              >
                                Refaire
                              </Button>
                            </>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  )
                })}
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

      {/* modal de blocage — aucune pièce fournie */}
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

      {/* modal doublon détecté */}
      <Dialog open={modalDoublonOuvert} onClose={() => setModalDoublonOuvert(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberOutlined color="warning" />
          Client déjà existant
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            {clientExistant && (
              <>
                {raisonDoublon === 'piece' && (
                  <>
                    Un client existe déjà avec <strong>ce numéro de pièce d'identité</strong> :{' '}
                    <strong>{clientExistant.prenom} {clientExistant.nom}</strong> (agence {clientExistant.agence_nom}).
                  </>
                )}
                {raisonDoublon === 'telephone' && (
                  <>
                    Un client existe déjà avec <strong>ce numéro de téléphone</strong> :{' '}
                    <strong>{clientExistant.prenom} {clientExistant.nom}</strong> (agence {clientExistant.agence_nom}).
                  </>
                )}
                {!raisonDoublon && (
                  <>
                    Un client correspondant existe déjà : <strong>{clientExistant.prenom} {clientExistant.nom}</strong> (agence {clientExistant.agence_nom}).
                  </>
                )}
                <Box sx={{ mt: 1.5 }}>
                  Ce client ne peut pas être enregistré à nouveau. Vérifiez ses informations avant de poursuivre.
                </Box>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setModalDoublonOuvert(false); setRaisonDoublon(null) }} color="inherit">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}