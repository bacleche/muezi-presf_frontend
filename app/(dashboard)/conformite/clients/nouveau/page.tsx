// 'use client'
// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import {
//   Box, Typography, Card, CardContent, Button,
//   Grid, TextField, Alert, CircularProgress
// } from '@mui/material'
// import { SaveOutlined, ArrowBackOutlined } from '@mui/icons-material'
// import { clientAPI } from '@/lib/api'

// export default function NouveauClientPage() {
//   const router = useRouter()
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   // Ajoutez cet état à côté de [form, setForm]
//   const [file, setFile] = useState<File | null>(null)

//   const [form, setForm] = useState({
//   nom: '',
//   prenom: '',
//   telephone: '',
//   email: '',
//   adresse: '',
//   cni_numero: '',
//   permis_numero: '',
//   passport_numero: '',
//   niu_numero: '',
// })

// const DOCUMENTS = [
//   { name: 'cni', label: 'CNI' },
//   { name: 'permis', label: 'Permis' },
//   { name: 'passport', label: 'Passeport' },
//   { name: 'niu', label: 'NIU' },
// ];

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setForm({ ...form, [e.target.name]: e.target.value })
//   }
//   const [files, setFiles] = useState<Record<string, File | null>>({})

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0] || null
//     setFiles({ ...files, [e.target.name]: file })
//   }

// const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();
//   setLoading(true);
//   setError('');

//   const formData = new FormData();
  
//   // Données Client
//   formData.append('nom', form.nom.trim());
//   formData.append('prenom', form.prenom.trim());
//   formData.append('telephone', form.telephone.trim());
//   formData.append('adresse', form.adresse.trim());
//   formData.append('email', form.email.trim());

//   // Numéros de pièces
//   formData.append('cni_numero', form.cni_numero);
//   formData.append('permis_numero', form.permis_numero);
//   formData.append('passport_numero', form.passport_numero);
//   formData.append('niu_numero', form.niu_numero);
  
//   // Fichiers (si présents)
//   Object.entries(files).forEach(([key, file]) => {
//     if (file) formData.append(key, file);
//   });

//   try {
//     await clientAPI.creer(formData); 
//     router.push('/chef-agence/clients');
//   } catch (err: any) {
//     console.error("Erreur API:", err);
//     if (err.response?.data) {
//       // Affichage du premier message d'erreur retourné par Django
//       const msgs = Object.values(err.response.data).flat();
//       setError(typeof msgs[0] === 'string' ? msgs[0] : "Erreur lors de l'enregistrement.");
//     } else {
//       setError("Une erreur est survenue lors de l'enregistrement.");
//     }
//   } finally {
//     setLoading(false);
//   }
// };
//   return (
//     <Box sx={{ p: 1 }}>
//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
//         <Button startIcon={<ArrowBackOutlined />} variant="outlined" size="small" onClick={() => router.back()}>
//           Retour
//         </Button>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 700 }}>Nouvel Enregistrement</Typography>
//           <Typography variant="body2" color="text.secondary">Créer un profil client dans le système KYC</Typography>
//         </Box>
//       </Box>

//       <Card sx={{ maxWidth: 650, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 3 }}>
//         <CardContent sx={{ p: 4 }}>
//           {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

//           <form onSubmit={handleSubmit}>
//             <Grid container spacing={3}>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <TextField fullWidth label="Nom de famille" name="nom" value={form.nom} onChange={handleChange} required />
//               </Grid>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <TextField fullWidth label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} required />
//               </Grid>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <TextField fullWidth label="Téléphone" name="telephone" placeholder="+242 06 XXX XX XX" value={form.telephone} onChange={handleChange} />
//               </Grid>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <TextField fullWidth type="email" label="Adresse Email" name="email" value={form.email} onChange={handleChange} />
//               </Grid>
//               <Grid size={{ xs: 12 }}>
//                 <TextField fullWidth label="Adresse" name="adresse" value={form.adresse} onChange={handleChange} />
//                 </Grid>

//               <Grid size={12}>
//                 <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, fontWeight: 700 }}>
//                   Documents d'identité et numéros associés
//                 </Typography>

//                 {DOCUMENTS.map((doc) => (
//                   <Grid container spacing={2} key={doc.name} sx={{ mb: 2 }}>
//                     {/* Champ pour le numéro */}
//                     <Grid size={{ xs: 12, sm: 6 }}>
//                       <TextField
//                         fullWidth
//                         size="small"
//                         label={`N° ${doc.label}`}
//                         name={`${doc.name}_numero`}
//                         value={form[`${doc.name}_numero` as keyof typeof form]}
//                         onChange={handleChange}
//                         placeholder={`Saisissez le numéro ${doc.label}`}
//                       />
//                     </Grid>
                    
//                     {/* Bouton pour l'upload */}
//                     <Grid size={{ xs: 12, sm: 6 }}>
//                       <Button
//                         variant="outlined"
//                         component="label"
//                         fullWidth
//                         sx={{ 
//                           height: '40px',
//                           borderColor: files[`${doc.name}_file`] ? 'success.main' : 'primary.main',
//                           color: files[`${doc.name}_file`] ? 'success.main' : 'primary.main'
//                         }}
//                       >
//                         {files[`${doc.name}_file`] ? files[`${doc.name}_file`]?.name : `Uploader ${doc.label}`}
//                         <input 
//                           type="file" 
//                           name={`${doc.name}_file`} 
//                           hidden 
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
//                 type="submit"
//                 variant="contained"
//                 size="large"
//                 disabled={loading || !form.nom || !form.prenom}
//                 startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
//                 sx={{ bgcolor: '#0D47A1', '&:hover': { bgcolor: '#0a3578' }, px: 4, textTransform: 'none', borderRadius: 2 }}
//               >
//                 Enregistrer le client
//               </Button>
//             </Box>
//           </form>
//         </CardContent>
//       </Card>
//     </Box>
//   )
// }




'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  Box, Typography, Card, CardContent, Button,
  Grid, TextField, Alert, CircularProgress
} from '@mui/material'
import { SaveOutlined, ArrowBackOutlined, PhotoCamera } from '@mui/icons-material'
import { clientAPI } from '@/lib/api'

export default function NouveauClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<Record<string, File | null>>({})

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
    cni_numero: '',
    permis_numero: '',
    passport_numero: '',
    niu_numero: '',
  })

  const DOCUMENTS = [
    { name: 'cni', label: 'CNI' },
    { name: 'permis', label: 'Permis' },
    { name: 'passport', label: 'Passeport' },
    { name: 'niu', label: 'NIU' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFiles({ ...files, [e.target.name]: file })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    
    // Données Client
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value.trim());
    });
    
    // Fichiers
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
                  Documents d'identité (Recto/Verso conseillé)
                </Typography>

                {DOCUMENTS.map((doc) => (
                  <Grid container spacing={2} key={doc.name} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth size="small" label={`N° ${doc.label}`}
                        name={`${doc.name}_numero`}
                        value={form[`${doc.name}_numero` as keyof typeof form]}
                        onChange={handleChange}
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        variant="outlined" component="label" fullWidth
                        startIcon={<PhotoCamera />}
                        sx={{ height: '40px' }}
                      >
                        {files[`${doc.name}`] ? 'Image prête' : `Photo ${doc.label}`}
                        <input 
                          type="file" name={`${doc.name}`} hidden 
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
    </Box>
  )
}