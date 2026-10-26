// 'use client'

// import { useState, useEffect, useMemo, Suspense, Fragment, type ReactNode } from 'react'
// import { useSearchParams } from 'next/navigation'
// import {
//     Box, Typography, Card, CardContent, Button,
//     Grid, TextField, Alert, CircularProgress,
//     Chip, Dialog, DialogTitle, DialogContent, DialogActions,
//     FormControl, InputLabel, Select, MenuItem,
//     LinearProgress, Collapse, Tooltip, IconButton,
//     Accordion, AccordionSummary, AccordionDetails,
//     Divider,
// } from '@mui/material'

// import {
//   AccountBalanceOutlined,
//   AddOutlined,
//   ExpandMoreOutlined,
//   ExpandLessOutlined,
//   DownloadOutlined,
//   UploadFileOutlined,
//   CheckCircleOutlined,
//   RadioButtonUncheckedOutlined,
//   CloseOutlined,
//   FolderOffOutlined,
//   ApartmentOutlined,
//   ScienceOutlined,
//   FolderOpenOutlined,
//   PersonOutlined,
//   PhotoLibraryOutlined,
//   MergeTypeOutlined,
//   SwapHorizOutlined,
//   SwapVertOutlined,
//   TableRowsOutlined,
// } from '@mui/icons-material'
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
// import { DatePicker } from '@mui/x-date-pickers/DatePicker'
// import dayjs, { Dayjs } from 'dayjs'
// import 'dayjs/locale/fr'
// import { PDFDocument } from 'pdf-lib'
// import { archiveAgenceAPI, agenceAPI, produitAPI, userAPI, villeAPI } from '@/lib/api'

// // ── Helper : conversion string ISO ('YYYY-MM-DD') <-> Dayjs pour les DatePicker ──
// const strToDayjs = (value: string): Dayjs | null => (value ? dayjs(value, 'YYYY-MM-DD') : null)
// const dayjsToStr = (value: Dayjs | null): string => (value && value.isValid() ? value.format('YYYY-MM-DD') : '')

// // ── Helper : message lisible à partir d'une erreur axios ──
// // Évite le « Upload échoué {} » : on remonte statut + corps (JSON ou texte).
// function detailErreurApi(err: any): string {
//   const status = err?.response?.status
//   const data   = err?.response?.data
//   let detail = ''
//   if (typeof data === 'string') detail = data.slice(0, 200)
//   else if (data && Object.keys(data).length > 0) detail = JSON.stringify(data)
//   else detail = err?.message ?? 'Erreur inconnue'
//   return `${status ?? 'réseau'} — ${detail}`
// }

// // ─── Types ────────────────────────────────────────────────────

// interface Agence {
//   id: number
//   nom: string
//   code: string
// }

// interface Ville {
//   id: number
//   nom: string
//   pays_nom?: string
// }

// interface CurrentUser {
//   id: number
//   role: 'superadmin' | 'conformite' | 'chef_produit' | 'chef_agence'
//   pays: number | null
//   ville: number | null
// }

// interface Produit {
//   id: number
//   nom: string
//   nom_display: string
//   is_active: boolean
// }

// interface DocumentArchive {
//   id: number
//   type_doc: string
//   type_doc_display: string
//   fichier_url: string
//   uploade_par: number
//   uploaded_at: string
//   // Distingue plusieurs documents du même type_doc dans une même archive
//   // (ex. 15 "recu" pour 15 clients dans la journée). Nécessite un champ
//   // `ligne` (int, nullable, défaut 1) côté modèle/serializer Django, avec
//   // unicité (archive, type_doc, ligne). Si absent côté API, tout document
//   // est traité comme ligne 1.
//   ligne?: number | null
// }

// interface Archive {
//   id: number
//   agence: number
//   agence_nom: string
//   agence_code: string
//   agence_ville: number | null
//   agence_ville_nom?: string
//   produit: number
//   produit_nom: string
//   date: string
//   archive_par: number
//   archive_par_nom: string
//   documents: DocumentArchive[]
//   documents_complets: boolean
//   types_requis: { value: string; label: string }[]
//   created_at: string
//   updated_at: string
// }

// // ─── Normalisation du nom de produit ────────────────────────────
// // Selon la version du serializer Django, `produit_nom` peut être le slug
// // stocké ("western_union") OU le libellé humain ("Western Union", "VISA").
// // Pour ne pas dépendre de ce détail backend, on normalise avant de
// // chercher dans les tables ci-dessous : minuscules, accents retirés,
// // espaces remplacés par des underscores. "Western Union" et
// // "western_union" donnent tous les deux "western_union".
// function normaliserProduit(nom: string): string {
//   return (nom ?? '')
//     .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
//     .trim()
//     .toLowerCase()
//     .replace(/\s+/g, '_')
// }

// // ─── Couleurs par produit ──────────────────────────────────────

// const PRODUIT_COLORS: Record<string, { bg: string; color: string }> = {
//   western_union: { bg: '#E6F1FB', color: '#0C447C' },
//   change:        { bg: '#EAF3DE', color: '#27500A' },
//   visa:          { bg: '#EEEDFE', color: '#3C3489' },
//   momo:          { bg: '#FAEEDA', color: '#633806' },
//   airtel_money:  { bg: '#FAECE7', color: '#712B13' },
// }

// function getProduitStyle(nom: string) {
//   return PRODUIT_COLORS[normaliserProduit(nom)] ?? { bg: '#F1EFE8', color: '#444441' }
// }

// // ─── Configuration des "couples" de documents par produit ──────
// // Un couple est un ensemble de types de documents "agrafés" ensemble : ils
// // appartiennent à la même opération/client et se répètent autant de fois
// // qu'il y a eu d'opérations dans la journée (15 clients => 15 exemplaires
// // du couple). Un produit peut avoir PLUSIEURS couples indépendants — par
// // exemple pour Visa, une fiche de souscription est agrafée à SA pièce
// // d'identité, et une fiche de réclamation est agrafée à SA PROPRE pièce
// // d'identité : ce sont deux couples distincts, avec leur propre numérotation,
// // même s'ils partagent le type de document "piece_identite".
// // Tout type_doc qui n'apparaît dans aucun couple reste un document unique
// // pour la journée (un seul exemplaire, ex : arrêtés matin/soir).

// interface LigneConfig {
//   types: string[]      // type_doc, dans l'ordre d'affichage du couple
//   label: string        // nom du couple affiché à l'utilisateur
// }

// const PRODUIT_LIGNES_CONFIG: Record<string, LigneConfig[]> = {
//   western_union: [
//     { types: ['recu', 'bordereau', 'piece_identite'], label: 'Opération client' },
//   ],
//   change: [
//     { types: ['recu', 'piece_identite', 'justificatif'], label: 'Opération client' },
//   ],
//   visa: [
//     { types: ['fiche_souscription', 'piece_identite'], label: 'Souscription' },
//     { types: ['fiche_reclamation', 'piece_identite'], label: 'Réclamation' },
//   ],
// }

// function getLigneConfigs(produitNom: string): LigneConfig[] {
//   return PRODUIT_LIGNES_CONFIG[normaliserProduit(produitNom)] ?? []
// }

// // Écart entre les plages de numérotation de deux couples d'un même produit.
// // Un même type_doc (ex. "piece_identite") peut appartenir à deux couples
// // différents ; pour ne jamais mélanger les pièces de l'un avec celles de
// // l'autre, chaque couple reçoit sa propre tranche de numéros de ligne
// // (couple n°0 : 1 à 99 999, couple n°1 : 100 001 à 199 999, etc.). Le
// // numéro affiché à l'utilisateur est toujours le numéro relatif au sein de
// // son couple ; seul le numéro stocké côté API (« ligne ») inclut le décalage.
// const ECART_ENTRE_COUPLES = 100000

// // Types "uniques" requis pour une archive = tous les types_requis SAUF ceux
// // qui appartiennent à un couple du produit.
// function getTypesUniques(archive: Archive): { value: string; label: string }[] {
//   const configs = getLigneConfigs(archive.produit_nom)
//   if (configs.length === 0) return archive.types_requis
//   const typesDeCouples = new Set(configs.flatMap(c => c.types))
//   return archive.types_requis.filter(t => !typesDeCouples.has(t.value))
// }

// // Regroupe les documents d'UN couple donné par numéro d'opération affiché
// // (1, 2, 3…), en ne retenant que les documents dont le numéro de ligne
// // stocké tombe dans la tranche réservée à ce couple.
// function regrouperParCouple(archive: Archive, indexCouple: number, config: LigneConfig): Map<number, DocumentArchive[]> {
//   const base = indexCouple * ECART_ENTRE_COUPLES
//   const parNumero = new Map<number, DocumentArchive[]>()

//   for (const doc of archive.documents) {
//     if (!config.types.includes(doc.type_doc)) continue
//     const ligneStockee = doc.ligne ?? 1
//     if (ligneStockee <= base || ligneStockee > base + ECART_ENTRE_COUPLES) continue
//     const numeroAffiche = ligneStockee - base
//     if (!parNumero.has(numeroAffiche)) parNumero.set(numeroAffiche, [])
//     parNumero.get(numeroAffiche)!.push(doc)
//   }
//   return parNumero
// }

// function ligneEstComplete(docs: DocumentArchive[], config: LigneConfig): boolean {
//   return config.types.every(t => docs.some(d => d.type_doc === t))
// }

// function libelleType(typeDoc: string): string {
//   const s = typeDoc.replace(/_/g, ' ')
//   return s.charAt(0).toUpperCase() + s.slice(1)
// }

// // ─── Statut archive (sert aux filtres et à la barre de progression) ──
// // Compte les documents uniques présents + un point par couple (validé
// // seulement si TOUTES ses opérations sont complètes et qu'il y en a au
// // moins une). Ne dépend donc plus du nombre de clients de la journée.

// function getStatut(archive: Archive): {
//   label: string
//   color: 'success' | 'warning' | 'error'
//   done: number
//   total: number
// } {
//   const uniques = getTypesUniques(archive)
//   const configs = getLigneConfigs(archive.produit_nom)

//   const uniquesFaits = uniques.filter(t =>
//     archive.documents.some(d => d.type_doc === t.value)
//   ).length

//   let couplesValides = 0
//   configs.forEach((config, index) => {
//     const parNumero = regrouperParCouple(archive, index, config)
//     const numeros = Array.from(parNumero.keys())
//     if (numeros.length > 0 && numeros.every(n => ligneEstComplete(parNumero.get(n) ?? [], config))) {
//       couplesValides++
//     }
//   })

//   const total = uniques.length + configs.length
//   const done  = uniquesFaits + couplesValides

//   if (archive.documents.length === 0) return { label: 'Vide',    color: 'error',   done, total }
//   if (done >= total)                  return { label: 'Complet', color: 'success', done, total }
//   return { label: `${done}/${total}`, color: 'warning', done, total }
// }

// // ─── Regroupement Produit → Agence → Archives ───────────────────

// interface AgenceGroupe {
//   agenceId:   number
//   agenceNom:  string
//   agenceCode: string
//   archives:   Archive[]
// }

// interface ProduitGroupe {
//   produitId:   number
//   produitNom:  string
//   agences:     AgenceGroupe[]
//   totalArchives: number
// }

// function regrouperParProduitEtAgence(archives: Archive[]): ProduitGroupe[] {
//   const parProduit = new Map<number, Map<number, AgenceGroupe>>()

//   for (const archive of archives) {
//     if (!parProduit.has(archive.produit)) {
//       parProduit.set(archive.produit, new Map())
//     }
//     const parAgence = parProduit.get(archive.produit)!

//     if (!parAgence.has(archive.agence)) {
//       parAgence.set(archive.agence, {
//         agenceId:   archive.agence,
//         agenceNom:  archive.agence_nom,
//         agenceCode: archive.agence_code,
//         archives:   [],
//       })
//     }
//     parAgence.get(archive.agence)!.archives.push(archive)
//   }

//   const groupes: ProduitGroupe[] = []
//   for (const [produitId, parAgence] of parProduit) {
//     const agences = Array.from(parAgence.values())
//       .sort((a, b) => a.agenceNom.localeCompare(b.agenceNom))

//     agences.forEach(a => {
//       a.archives.sort((x, y) => y.date.localeCompare(x.date))
//     })

//     const produitNom = agences[0]?.archives[0]?.produit_nom ?? ''
//     const totalArchives = agences.reduce((sum, a) => sum + a.archives.length, 0)

//     groupes.push({ produitId, produitNom, agences, totalArchives })
//   }

//   return groupes.sort((a, b) => a.produitNom.localeCompare(b.produitNom))
// }

// // ─── Aperçu inline d'un fichier ────────────────────────────────

// function getExtension(url?: string | null): string {
//   if (!url) return ''
//   const clean = url.split('?')[0]
//   const parts = clean.split('.')
//   return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
// }

// function FilePreview({ url, height = 260 }: { url?: string | null; height?: number }) {
//   if (!url) {
//     return (
//       <Box
//         sx={{
//           height, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//         }}
//       >
//         <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Aucun fichier</Typography>
//       </Box>
//     )
//   }

//   const ext = getExtension(url)
//   const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
//   const isPdf   = ext === 'pdf'

//   if (isImage) {
//     return (
//       <Box
//         sx={{
//           height, borderRadius: 1.5, overflow: 'hidden',
//           bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
//         }}
//       >
//         <img
//           src={url}
//           alt="Aperçu du document"
//           style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
//         />
//       </Box>
//     )
//   }

//   if (isPdf) {
//     return (
//       <Box sx={{ height, borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
//         <iframe
//           src={`${url}#toolbar=0`}
//           title="Aperçu PDF"
//           style={{ width: '100%', height: '100%', border: 'none' }}
//         />
//       </Box>
//     )
//   }

//   return (
//     <Box
//       sx={{
//         height, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider',
//         display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1,
//       }}
//     >
//       <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Aperçu indisponible</Typography>
//       <Typography component="a" href={url} target="_blank" color="primary" sx={{ fontSize: 12, textDecoration: 'underline' }}>
//         Ouvrir dans un nouvel onglet
//       </Typography>
//     </Box>
//   )
// }

// // ─── Fusion de plusieurs images en un seul PDF ──────────────────
// // Chaque image est repassée par un canvas pour être ré-encodée en PNG
// // (accepte donc jpg/png/webp/gif en entrée de façon uniforme), puis
// // intégrée comme une page du PDF final, dans l'ordre choisi.

// async function imageVersPng(file: File): Promise<Uint8Array> {
//   const bitmap = await createImageBitmap(file)
//   const canvas = document.createElement('canvas')
//   canvas.width = bitmap.width
//   canvas.height = bitmap.height
//   const ctx = canvas.getContext('2d')
//   if (!ctx) throw new Error('Canvas non supporté')
//   ctx.drawImage(bitmap, 0, 0)
//   const blob: Blob = await new Promise((resolve, reject) => {
//     canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Échec de conversion'))), 'image/png')
//   })
//   return new Uint8Array(await blob.arrayBuffer())
// }

// async function fusionnerImagesEnPDF(files: File[], nomFichier: string): Promise<File> {
//   const pdfDoc = await PDFDocument.create()
//   for (const file of files) {
//     const pngBytes = await imageVersPng(file)
//     const image = await pdfDoc.embedPng(pngBytes)
//     const page = pdfDoc.addPage([image.width, image.height])
//     page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
//   }
//   const pdfBytes = await pdfDoc.save()
//   // .slice() force un ArrayBuffer "classique" (et non ArrayBufferLike),
//   // seul type accepté par le constructeur Blob/File en TS strict.
//   const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer
//   return new File([arrayBuffer], nomFichier, { type: 'application/pdf' })
// }

// function estImage(file: File): boolean {
//   return file.type.startsWith('image/')
// }

// // ─── Décomposition d'un document en pages (pour "Afficher les couples") ──
// // Un document de couple peut être un PDF fusionné à partir de plusieurs
// // photos (recto/verso, plusieurs pages). Pour l'affichage en palette
// // horizontale, chaque page est rendue en image miniature via pdfjs-dist.
// // Une image simple (jpg/png/webp) est traitée comme un document d'une
// // seule page.
// //
// // Dépendance à installer : `npm install pdfjs-dist`
// // Le worker est chargé depuis un CDN pour éviter les soucis de bundling ;
// // remplacez cette URL par un worker self-hosted si votre CSP l'exige.

// let pdfjsLibPromise: Promise<typeof import('pdfjs-dist')> | null = null

// async function chargerPdfjs() {
//   if (!pdfjsLibPromise) {
//     pdfjsLibPromise = import('pdfjs-dist').then(mod => {
//       mod.GlobalWorkerOptions.workerSrc =
//         `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.mjs`
//       return mod
//     })
//   }
//   return pdfjsLibPromise
// }

// // Cache mémoire : évite de re-décomposer le même document si l'utilisateur
// // ferme puis rouvre la modale, ou déplie/replie l'accordéon plusieurs fois.
// const cachePagesDocument = new Map<string, string[]>()

// async function extrairePagesDocument(url: string): Promise<string[]> {
//   const dejaEnCache = cachePagesDocument.get(url)
//   if (dejaEnCache) return dejaEnCache

//   const ext = getExtension(url)
//   if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
//     cachePagesDocument.set(url, [url])
//     return [url]
//   }
//   if (ext !== 'pdf') return []

//   const pdfjsLib = await chargerPdfjs()
//   const pdf = await pdfjsLib.getDocument({ url }).promise
//   const pages: string[] = []

//   for (let i = 1; i <= pdf.numPages; i++) {
//     const page = await pdf.getPage(i)
//     const viewport = page.getViewport({ scale: 0.6 })
//     const canvas = document.createElement('canvas')
//     canvas.width = viewport.width
//     canvas.height = viewport.height
//     const ctx = canvas.getContext('2d')
//     if (!ctx) continue
//     await page.render({ canvasContext: ctx, viewport, canvas }).promise
//     pages.push(canvas.toDataURL('image/png'))
//   }

//   cachePagesDocument.set(url, pages)
//   return pages
// }

// // ─── Emplacement de document avec capture/upload multi-images et
// // fusion automatique. Utilisé pour les documents uniques ET pour les
// // emplacements des couples. ────────────────────────────────────

// function DocSlotFusion({
//   typeDoc,
//   label,
//   document,
//   onUpload,
//   uploading,
//   compact = false,
// }: {
//   typeDoc:   string
//   label:     string
//   document?: DocumentArchive
//   onUpload:  (typeDoc: string, file: File) => void
//   uploading: boolean
//   compact?:  boolean
// }) {
//   const done = !!document
//   const [pageEnAttente, setPageEnAttente] = useState<File[]>([])
//   const [fusion, setFusion] = useState(false)
//   const [erreur, setErreur] = useState('')

//   const handleAjoutFichiers = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(e.target.files ?? [])
//     if (files.length === 0) return
//     setErreur('')
//     setPageEnAttente(prev => [...prev, ...files])
//     e.target.value = ''
//   }

//   const retirerPage = (index: number) => {
//     setPageEnAttente(prev => prev.filter((_, i) => i !== index))
//   }

//   const handleEnregistrer = async () => {
//     if (pageEnAttente.length === 0) return
//     setErreur('')

//     // Un seul fichier : on l'envoie tel quel (pas besoin de fusion).
//     if (pageEnAttente.length === 1) {
//       onUpload(typeDoc, pageEnAttente[0])
//       setPageEnAttente([])
//       return
//     }

//     // Plusieurs fichiers : fusion possible seulement si ce sont toutes des
//     // images (un PDF a déjà potentiellement plusieurs pages en lui-même).
//     if (!pageEnAttente.every(estImage)) {
//       setErreur("La fusion n'est possible qu'entre plusieurs images. Retirez le PDF ou envoyez-le seul.")
//       return
//     }

//     setFusion(true)
//     try {
//       const fichierFusionne = await fusionnerImagesEnPDF(pageEnAttente, `${typeDoc}_${Date.now()}.pdf`)
//       onUpload(typeDoc, fichierFusionne)
//       setPageEnAttente([])
//     } catch {
//       setErreur('Échec de la fusion des images. Réessayez.')
//     } finally {
//       setFusion(false)
//     }
//   }

//   const enCours = uploading || fusion

//   return (
//     <Box
//       sx={{
//         border: done ? '1px solid' : '1px dashed',
//         borderColor: done ? 'success.light' : 'divider',
//         borderRadius: 2,
//         p: 1.5,
//         bgcolor: done ? 'success.50' : 'background.default',
//         display: 'flex',
//         flexDirection: 'column',
//         gap: 1,
//         height: '100%',
//       }}
//     >
//       <Typography sx={{ fontSize: 13, fontWeight: 500 }} color={done ? 'success.dark' : 'text.primary'}>
//         {label}
//       </Typography>

//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//         {done ? (
//           <CheckCircleOutlined sx={{ fontSize: 14, color: 'success.main' }} />
//         ) : (
//           <RadioButtonUncheckedOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
//         )}
//         <Typography sx={{ fontSize: 11 }} color={done ? 'success.main' : 'text.secondary'}>
//           {done ? 'Téléversé' : 'Manquant'}
//         </Typography>
//       </Box>

//       {done && document && (
//         <Tooltip title="Voir ce document">
//           <Typography
//             component="a"
//             href={document.fichier_url}
//             target="_blank"
//             color="primary"
//             sx={{ fontSize: 11, textDecoration: 'underline', cursor: 'pointer' }}
//           >
//             Voir le fichier
//           </Typography>
//         </Tooltip>
//       )}

//       {/* Zone de capture/upload (premier envoi) */}
//       {!done && (
//         <>
//           {pageEnAttente.length > 0 && (
//             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 0.5 }}>
//               {pageEnAttente.map((f, i) => (
//                 <Chip
//                   key={`${f.name}-${i}`}
//                   label={`Page ${i + 1}`}
//                   size="small"
//                   onDelete={() => retirerPage(i)}
//                   sx={{ fontSize: 10, height: 22 }}
//                 />
//               ))}
//             </Box>
//           )}

//           {erreur && <Alert severity="error" sx={{ fontSize: 11, py: 0 }}>{erreur}</Alert>}

//           <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
//             <label>
//               <input
//                 type="file"
//                 hidden
//                 multiple
//                 accept=".pdf,.jpg,.jpeg,.png,.webp"
//                 onChange={handleAjoutFichiers}
//                 disabled={enCours}
//               />
//               <Button
//                 component="span"
//                 size="small"
//                 variant="outlined"
//                 disabled={enCours}
//                 startIcon={<PhotoLibraryOutlined sx={{ fontSize: 14 }} />}
//                 sx={{ fontSize: 11, py: 0.25, px: 1 }}
//               >
//                 {pageEnAttente.length > 0 ? 'Ajouter une page' : 'Téléverser / capturer'}
//               </Button>
//             </label>

//             {pageEnAttente.length > 0 && (
//               <Button
//                 size="small"
//                 variant="contained"
//                 disabled={enCours}
//                 onClick={handleEnregistrer}
//                 startIcon={
//                   enCours
//                     ? <CircularProgress size={10} color="inherit" />
//                     : pageEnAttente.length > 1
//                       ? <MergeTypeOutlined sx={{ fontSize: 14 }} />
//                       : <UploadFileOutlined sx={{ fontSize: 14 }} />
//                 }
//                 sx={{ fontSize: 11, py: 0.25, px: 1 }}
//               >
//                 {pageEnAttente.length > 1 ? `Fusionner ${pageEnAttente.length} pages et enregistrer` : 'Enregistrer'}
//               </Button>
//             )}
//           </Box>

//           {!compact && pageEnAttente.length === 0 && (
//             <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>
//               Astuce : sélectionnez plusieurs photos (recto/verso, plusieurs pages) pour les fusionner en un seul document.
//             </Typography>
//           )}
//         </>
//       )}

//       {/* Remplacer un document déjà présent */}
//       {done && (
//         <label>
//           <input
//             type="file"
//             hidden
//             accept=".pdf,.jpg,.jpeg,.png,.webp"
//             onChange={(e) => {
//               const file = e.target.files?.[0]
//               if (file) onUpload(typeDoc, file)
//               e.target.value = ''
//             }}
//             disabled={enCours}
//           />
//           <Button
//             component="span"
//             size="small"
//             variant="text"
//             disabled={enCours}
//             startIcon={enCours ? <CircularProgress size={10} /> : <UploadFileOutlined sx={{ fontSize: 13 }} />}
//             sx={{ fontSize: 10, py: 0, px: 0.5 }}
//           >
//             Remplacer
//           </Button>
//         </label>
//       )}
//     </Box>
//   )
// }

// // ─── Rangée de documents reliés par des flèches ⇄ ───────────────
// // Horizontale sur grand écran, verticale sur mobile. Réutilisée par le
// // bloc de saisie ET par la vue dossier.

// function CoupleRow({ items }: { items: ReactNode[] }) {
//   return (
//     <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch', gap: 1 }}>
//       {items.map((item, i) => (
//         <Fragment key={i}>
//           {i > 0 && (
//             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled', flexShrink: 0 }}>
//               <SwapHorizOutlined sx={{ display: { xs: 'none', md: 'block' } }} />
//               <SwapVertOutlined  sx={{ display: { xs: 'block', md: 'none' } }} />
//             </Box>
//           )}
//           <Box sx={{ flex: 1, minWidth: 0 }}>{item}</Box>
//         </Fragment>
//       ))}
//     </Box>
//   )
// }

// // ─── UN couple = UN bloc. Chaque emplacement téléverse directement
// // dans CE bloc (numéro de ligne fixé par le bloc). ─────────────────

// function CoupleBlock({
//   config,
//   numero,
//   base,
//   docs,
//   nouveau,
//   onUpload,
//   uploadingKey,
// }: {
//   config:       LigneConfig
//   numero:       number                 // numéro affiché (1, 2, 3…)
//   base:         number                 // décalage réservé à ce couple
//   docs:         DocumentArchive[]
//   nouveau:      boolean                // bloc vide en attente d'un premier document
//   onUpload:     (typeDoc: string, ligne: number, file: File) => void
//   uploadingKey: string | null
// }) {
//   const ligneStockee = base + numero
//   const complete = ligneEstComplete(docs, config)
//   const nbFaits  = config.types.filter(t => docs.some(d => d.type_doc === t)).length

//   return (
//     <Card
//       variant="outlined"
//       sx={{
//         borderRadius: 2,
//         p: 1.5,
//         mb: 1,
//         bgcolor: nouveau ? 'background.paper' : 'grey.50',
//         borderStyle: nouveau ? 'dashed' : 'solid',
//         borderColor: complete ? 'success.light' : nouveau ? 'primary.light' : 'divider',
//       }}
//     >
//       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
//         <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
//           {config.label} #{numero}
//         </Typography>
//         <Chip
//           label={nouveau ? 'Nouveau' : complete ? 'Complet' : `${nbFaits}/${config.types.length}`}
//           color={nouveau ? 'default' : complete ? 'success' : 'warning'}
//           variant={nouveau ? 'outlined' : 'filled'}
//           size="small"
//           sx={{ fontSize: 10, height: 20 }}
//         />
//       </Box>

//       <CoupleRow
//         items={config.types.map(typeDoc => {
//           const doc = docs.find(d => d.type_doc === typeDoc)
//           return (
//             <DocSlotFusion
//               typeDoc={typeDoc}
//               label={doc?.type_doc_display ?? libelleType(typeDoc)}
//               document={doc}
//               onUpload={(td, file) => onUpload(td, ligneStockee, file)}
//               uploading={uploadingKey === `${ligneStockee}-${typeDoc}`}
//               compact
//             />
//           )
//         })}
//       />
//     </Card>
//   )
// }

// // ─── Liste de tous les blocs d'un couple pour une journée ────────
// // Un bloc vide « Nouveau » est toujours en tête. Dès qu'on y téléverse un
// // premier document, il devient l'opération #N et un nouveau bloc vide
// // apparaît. Les opérations existantes suivent, du plus récent au plus ancien.

// function LigneClientBlock({
//   config,
//   base,
//   parNumero,
//   onUpload,
//   uploadingKey,
// }: {
//   config:       LigneConfig
//   base:         number
//   parNumero:    Map<number, DocumentArchive[]>
//   onUpload:     (typeDoc: string, ligne: number, file: File) => void
//   uploadingKey: string | null
// }) {
//   const [seulementIncompletes, setSeulementIncompletes] = useState(false)
//   const [recherche, setRecherche] = useState('')

//   const numeros        = Array.from(parNumero.keys()).sort((a, b) => a - b)
//   const prochainNumero = (numeros.length > 0 ? numeros[numeros.length - 1] : 0) + 1
//   const nbCompletes    = numeros.filter(n => ligneEstComplete(parNumero.get(n) ?? [], config)).length
//   const nbIncompletes  = numeros.length - nbCompletes
//   const filtreActif    = seulementIncompletes || recherche !== ''

//   const numerosExistants = numeros.filter(n => {
//     if (recherche && String(n) !== recherche) return false
//     if (seulementIncompletes && ligneEstComplete(parNumero.get(n) ?? [], config)) return false
//     return true
//   })

//   // Un seul tableau (bloc vide en tête + opérations) avec le numéro comme clé :
//   // un bloc garde son état (pages en attente de fusion) quand il passe de
//   // « Nouveau » à « opération enregistrée ».
//   const numerosAffiches = [
//     ...(filtreActif ? [] : [prochainNumero]),
//     ...numerosExistants.slice().reverse(),
//   ]

//   return (
//     <Box sx={{ mt: 2 }}>
//       <Divider sx={{ mb: 1.5 }} />

//       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
//           <PersonOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
//           <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{config.label}</Typography>
//           <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
//             {numeros.length} opération{numeros.length !== 1 ? 's' : ''}
//             {numeros.length > 0 && ` : ${nbCompletes} complète${nbCompletes !== 1 ? 's' : ''}, ${nbIncompletes} incomplète${nbIncompletes !== 1 ? 's' : ''}`}
//           </Typography>
//         </Box>

//         {numeros.length >= 4 && (
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             <TextField
//               size="small"
//               placeholder="N°"
//               value={recherche}
//               onChange={e => setRecherche(e.target.value.replace(/[^0-9]/g, ''))}
//               sx={{ width: 80 }}
//             />
//             <Chip
//               label="Incomplètes seulement"
//               size="small"
//               color={seulementIncompletes ? 'warning' : 'default'}
//               variant={seulementIncompletes ? 'filled' : 'outlined'}
//               onClick={() => setSeulementIncompletes(v => !v)}
//             />
//           </Box>
//         )}
//       </Box>

//       {numerosAffiches.map(numero => (
//         <CoupleBlock
//           key={numero}
//           config={config}
//           numero={numero}
//           base={base}
//           docs={parNumero.get(numero) ?? []}
//           nouveau={!parNumero.has(numero)}
//           onUpload={onUpload}
//           uploadingKey={uploadingKey}
//         />
//       ))}

//       {filtreActif && numerosAffiches.length === 0 && (
//         <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
//           Aucune opération ne correspond à ce filtre.
//         </Typography>
//       )}
//     </Box>
//   )
// }

// // ─── Section "couples" d'une archive ────────────────────────────

// function LignesClientsSection({
//   archive,
//   onUpload,
//   uploadingKey,
// }: {
//   archive: Archive
//   onUpload: (typeDoc: string, ligne: number, file: File) => void
//   uploadingKey: string | null
// }) {
//   const configs = getLigneConfigs(archive.produit_nom)
//   if (configs.length === 0) return null

//   return (
//     <>
//       {configs.map((config, index) => (
//         <LigneClientBlock
//           key={`${config.label}-${index}`}
//           config={config}
//           base={index * ECART_ENTRE_COUPLES}
//           parNumero={regrouperParCouple(archive, index, config)}
//           onUpload={onUpload}
//           uploadingKey={uploadingKey}
//         />
//       ))}
//     </>
//   )
// }

// // ─── Vue "dossier" en lecture — consultation d'une archive ──────

// // Accordéon explorable (recherche + filtre) pour UN couple de documents.
// // Isolé en composant à part car chaque couple gère son propre état de
// // recherche/filtre/ouverture, indépendamment des autres couples du produit.
// function DossierCoupleSection({
//   config,
//   parNumero,
// }: {
//   config:    LigneConfig
//   parNumero: Map<number, DocumentArchive[]>
// }) {
//   const [filtre, setFiltre] = useState<'toutes' | 'incompletes'>('toutes')
//   const [recherche, setRecherche] = useState('')
//   const [numeroOuvert, setNumeroOuvert] = useState<number | null>(null)

//   const tousLesNumeros = Array.from(parNumero.keys()).sort((a, b) => a - b)
//   const numerosAffiches = tousLesNumeros.filter(numero => {
//     if (recherche && String(numero) !== recherche.trim()) return false
//     if (filtre === 'incompletes' && ligneEstComplete(parNumero.get(numero) ?? [], config)) return false
//     return true
//   })
//   const nbCompletes = tousLesNumeros.filter(n => ligneEstComplete(parNumero.get(n) ?? [], config)).length

//   if (tousLesNumeros.length === 0) {
//     return (
//       <Box sx={{ mb: 3 }}>
//         <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, letterSpacing: '0.05em', mb: 1 }}>
//           {config.label.toUpperCase()}S
//         </Typography>
//         <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
//           Aucune opération « {config.label.toLowerCase()} » saisie pour cette journée.
//         </Typography>
//       </Box>
//     )
//   }

//   return (
//     <Box sx={{ mb: 3 }}>
//       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
//         <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, letterSpacing: '0.05em' }}>
//           {config.label.toUpperCase()}S — {nbCompletes}/{tousLesNumeros.length} complètes
//         </Typography>
//         <Box sx={{ display: 'flex', gap: 1 }}>
//           <TextField
//             size="small"
//             placeholder="N°"
//             value={recherche}
//             onChange={e => setRecherche(e.target.value.replace(/[^0-9]/g, ''))}
//             sx={{ width: 90 }}
//           />
//           <FormControl size="small" sx={{ minWidth: 150 }}>
//             <Select value={filtre} onChange={e => setFiltre(e.target.value as 'toutes' | 'incompletes')}>
//               <MenuItem value="toutes">Toutes les lignes</MenuItem>
//               <MenuItem value="incompletes">Incomplètes seulement</MenuItem>
//             </Select>
//           </FormControl>
//         </Box>
//       </Box>

//       {numerosAffiches.length === 0 && (
//         <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
//           Aucune ligne ne correspond à ce filtre.
//         </Typography>
//       )}

//       {numerosAffiches.map(numero => {
//         const docs = parNumero.get(numero) ?? []
//         const complete = ligneEstComplete(docs, config)
//         return (
//           <Accordion
//             key={numero}
//             variant="outlined"
//             expanded={numeroOuvert === numero}
//             onChange={() => setNumeroOuvert(prev => (prev === numero ? null : numero))}
//             sx={{ borderRadius: 1.5, mb: 0.75, '&:before': { display: 'none' } }}
//           >
//             <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
//                 <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
//                   {config.label} #{numero}
//                 </Typography>
//                 <Chip
//                   label={complete ? 'Complet' : `${docs.length}/${config.types.length}`}
//                   size="small"
//                   color={complete ? 'success' : 'warning'}
//                   sx={{ fontSize: 10, height: 20, ml: 'auto' }}
//                 />
//               </Box>
//             </AccordionSummary>
//             <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
//               <CoupleRow
//                 items={config.types.map(typeDoc => {
//                   const doc = docs.find(d => d.type_doc === typeDoc)
//                   return (
//                     <Box>
//                       <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.5 }}>
//                         {doc?.type_doc_display ?? libelleType(typeDoc)}
//                       </Typography>
//                       <FilePreview url={doc?.fichier_url} height={150} />
//                     </Box>
//                   )
//                 })}
//               />
//             </AccordionDetails>
//           </Accordion>
//         )
//       })}
//     </Box>
//   )
// }

// function DossierViewModal({
//   open,
//   archive,
//   onClose,
// }: {
//   open:    boolean
//   archive: Archive | null
//   onClose: () => void
// }) {
//   if (!archive) return null

//   const configs = getLigneConfigs(archive.produit_nom)
//   const typesUniques = getTypesUniques(archive)

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
//       <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//         <Box>
//           <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
//             Dossier — {archive.agence_nom} ({archive.agence_code})
//           </Typography>
//           <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
//             {archive.produit_nom} · {new Date(archive.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
//           </Typography>
//         </Box>
//         <IconButton size="small" onClick={onClose}><CloseOutlined /></IconButton>
//       </DialogTitle>

//       <DialogContent dividers>
//         {/* Documents généraux du jour */}
//         <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, letterSpacing: '0.05em', mb: 1 }}>
//           DOCUMENTS DU JOUR
//         </Typography>
//         <Grid container spacing={1.5} sx={{ mb: 3 }}>
//           {typesUniques.map(({ value, label }) => {
//             const doc = archive.documents.find(d => d.type_doc === value)
//             return (
//               <Grid size={{ xs: 12, sm: 6, md: 4 }} key={value}>
//                 <Typography sx={{ fontSize: 12, fontWeight: 500, mb: 0.5 }}>{label}</Typography>
//                 <FilePreview url={doc?.fichier_url} height={180} />
//               </Grid>
//             )
//           })}
//         </Grid>

//         {/* Un accordéon indépendant par couple de documents (ex : Souscription, puis Réclamation) */}
//         {configs.map((config, index) => (
//           <DossierCoupleSection
//             key={`${config.label}-${index}`}
//             config={config}
//             parNumero={regrouperParCouple(archive, index, config)}
//           />
//         ))}
//       </DialogContent>

//       <DialogActions>
//         <Button onClick={onClose}>Fermer</Button>
//       </DialogActions>
//     </Dialog>
//   )
// }

// // ─── "Afficher les couples" — décomposition page par page ──────
// // Contrairement à DossierViewModal (un aperçu par document), cette vue
// // décompose chaque document en ses pages. Pour une opération donnée, les
// // documents du couple (reçu, bordereau, pièce…) sont affichés CÔTE À CÔTE
// // en colonnes horizontales reliées par ⇄ ; chaque colonne fait défiler ses
// // pages horizontalement. Un document d'une seule page (photo simple)
// // affiche une seule vignette ; un document fusionné à partir de plusieurs
// // photos affiche autant de vignettes que de pages.

// // Une colonne = un type de document du couple, avec ses pages en
// // défilement horizontal.
// function DocumentPagesLane({
//   label,
//   document,
// }: {
//   label:     string
//   document?: DocumentArchive
// }) {
//   const [pages, setPages]           = useState<string[] | null>(null)
//   const [chargement, setChargement] = useState(false)
//   const [erreur, setErreur]         = useState('')

//   useEffect(() => {
//     let annule = false
//     setPages(null)
//     setErreur('')
//     if (!document?.fichier_url) return

//     setChargement(true)
//     extrairePagesDocument(document.fichier_url)
//       .then(p => { if (!annule) setPages(p) })
//       .catch(() => { if (!annule) setErreur('Décomposition impossible.') })
//       .finally(() => { if (!annule) setChargement(false) })

//     return () => { annule = true }
//   }, [document?.fichier_url])

//   return (
//     <Box
//       sx={{
//         flex: '1 0 240px',
//         minWidth: 240,
//         border: '1px solid',
//         borderColor: document ? 'divider' : 'warning.light',
//         borderStyle: document ? 'solid' : 'dashed',
//         borderRadius: 2,
//         p: 1.25,
//         display: 'flex',
//         flexDirection: 'column',
//         gap: 1,
//         bgcolor: 'background.paper',
//       }}
//     >
//       {/* En-tête de colonne */}
//       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
//         <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{label}</Typography>
//         {document ? (
//           <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
//             {pages
//               ? `${pages.length} page${pages.length !== 1 ? 's' : ''}`
//               : chargement ? 'Chargement…' : ''}
//           </Typography>
//         ) : (
//           <Chip label="Manquant" size="small" color="warning" variant="outlined" sx={{ fontSize: 9, height: 16 }} />
//         )}
//       </Box>

//       {/* Pages en défilement horizontal */}
//       <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, minHeight: 150 }}>
//         {!document && (
//           <Box
//             sx={{
//               width: 110, height: 150, flexShrink: 0, borderRadius: 1.5,
//               border: '1px dashed', borderColor: 'divider',
//               display: 'flex', alignItems: 'center', justifyContent: 'center',
//             }}
//           >
//             <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>—</Typography>
//           </Box>
//         )}

//         {document && chargement && (
//           <Box sx={{ width: 110, height: 150, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//             <CircularProgress size={18} />
//           </Box>
//         )}

//         {document && erreur && (
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%' }}>
//             <FilePreview url={document.fichier_url} height={150} />
//             <Typography sx={{ fontSize: 11, color: 'error.main' }}>
//               {erreur} Vérifiez la configuration CORS du stockage.
//             </Typography>
//             <Typography component="a" href={document.fichier_url} target="_blank" color="primary" sx={{ fontSize: 11, textDecoration: 'underline' }}>
//               Ouvrir le fichier
//             </Typography>
//           </Box>
//         )}

//         {pages && pages.length === 0 && !erreur && (
//           <Typography sx={{ fontSize: 11, color: 'text.secondary', fontStyle: 'italic' }}>
//             Format non pris en charge pour l'aperçu.
//           </Typography>
//         )}

//         {pages && pages.map((src, i) => (
//           <Box
//             key={i}
//             component="a"
//             href={document!.fichier_url}
//             target="_blank"
//             sx={{
//               width: 110, height: 150, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden',
//               border: '1px solid', borderColor: 'divider', bgcolor: '#f1f5f9',
//               display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
//             }}
//           >
//             <img src={src} alt={`${label} — page ${i + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
//             {pages.length > 1 && (
//               <Chip
//                 label={i + 1}
//                 size="small"
//                 sx={{
//                   position: 'absolute', bottom: 3, right: 3, fontSize: 9, height: 16,
//                   bgcolor: 'rgba(0,0,0,0.65)', color: 'white',
//                 }}
//               />
//             )}
//           </Box>
//         ))}
//       </Box>
//     </Box>
//   )
// }

// // Une opération = les documents du couple côte à côte (Reçu ⇄ Bordereau ⇄ Pièce),
// // avec défilement horizontal si l'écran est trop étroit.
// function CoupleOperationLignes({
//   config,
//   docs,
// }: {
//   config: LigneConfig
//   docs:   DocumentArchive[]
// }) {
//   return (
//     <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 1, overflowX: 'auto', pb: 1 }}>
//       {config.types.map((typeDoc, i) => {
//         const doc = docs.find(d => d.type_doc === typeDoc)
//         return (
//           <Fragment key={typeDoc}>
//             {i > 0 && (
//               <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.disabled', flexShrink: 0 }}>
//                 <SwapHorizOutlined />
//               </Box>
//             )}
//             <DocumentPagesLane label={doc?.type_doc_display ?? libelleType(typeDoc)} document={doc} />
//           </Fragment>
//         )
//       })}
//     </Box>
//   )
// }

// // Un couple = un accordéon par opération (#1, #2, … #15, quel que soit le
// // nombre). La décomposition en pages n'est lancée que pour l'opération
// // dépliée, pour ne pas décomposer 15 × 3 documents d'un coup.
// function CouplesCoupleSection({
//   config,
//   parNumero,
// }: {
//   config:    LigneConfig
//   parNumero: Map<number, DocumentArchive[]>
// }) {
//   const [filtre, setFiltre] = useState<'toutes' | 'incompletes'>('toutes')
//   const [recherche, setRecherche] = useState('')
//   const [numeroOuvert, setNumeroOuvert] = useState<number | null>(null)

//   const tousLesNumeros = Array.from(parNumero.keys()).sort((a, b) => a - b)
//   const numerosAffiches = tousLesNumeros.filter(numero => {
//     if (recherche && String(numero) !== recherche.trim()) return false
//     if (filtre === 'incompletes' && ligneEstComplete(parNumero.get(numero) ?? [], config)) return false
//     return true
//   })
//   const nbCompletes = tousLesNumeros.filter(n => ligneEstComplete(parNumero.get(n) ?? [], config)).length

//   if (tousLesNumeros.length === 0) {
//     return (
//       <Box sx={{ mb: 3 }}>
//         <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, letterSpacing: '0.05em', mb: 1 }}>
//           {config.label.toUpperCase()}S
//         </Typography>
//         <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
//           Aucune opération « {config.label.toLowerCase()} » saisie pour cette journée.
//         </Typography>
//       </Box>
//     )
//   }

//   return (
//     <Box sx={{ mb: 3 }}>
//       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
//         <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, letterSpacing: '0.05em' }}>
//           {config.label.toUpperCase()}S — {nbCompletes}/{tousLesNumeros.length} complètes
//         </Typography>
//         <Box sx={{ display: 'flex', gap: 1 }}>
//           <TextField
//             size="small"
//             placeholder="N°"
//             value={recherche}
//             onChange={e => setRecherche(e.target.value.replace(/[^0-9]/g, ''))}
//             sx={{ width: 90 }}
//           />
//           <FormControl size="small" sx={{ minWidth: 150 }}>
//             <Select value={filtre} onChange={e => setFiltre(e.target.value as 'toutes' | 'incompletes')}>
//               <MenuItem value="toutes">Toutes les lignes</MenuItem>
//               <MenuItem value="incompletes">Incomplètes seulement</MenuItem>
//             </Select>
//           </FormControl>
//         </Box>
//       </Box>

//       {numerosAffiches.length === 0 && (
//         <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
//           Aucune ligne ne correspond à ce filtre.
//         </Typography>
//       )}

//       {numerosAffiches.map(numero => {
//         const docs = parNumero.get(numero) ?? []
//         const complete = ligneEstComplete(docs, config)
//         const estOuvert = numeroOuvert === numero
//         return (
//           <Accordion
//             key={numero}
//             variant="outlined"
//             expanded={estOuvert}
//             onChange={() => setNumeroOuvert(prev => (prev === numero ? null : numero))}
//             sx={{ borderRadius: 1.5, mb: 0.75, '&:before': { display: 'none' } }}
//           >
//             <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
//                 <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
//                   {config.label} #{numero}
//                 </Typography>
//                 <Chip
//                   label={complete ? 'Complet' : `${docs.length}/${config.types.length}`}
//                   size="small"
//                   color={complete ? 'success' : 'warning'}
//                   sx={{ fontSize: 10, height: 20, ml: 'auto' }}
//                 />
//               </Box>
//             </AccordionSummary>
//             <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
//               {/* Rendu seulement quand ouvert : on ne décompose pas 15 opérations d'un coup */}
//               {estOuvert && <CoupleOperationLignes config={config} docs={docs} />}
//             </AccordionDetails>
//           </Accordion>
//         )
//       })}
//     </Box>
//   )
// }

// function CouplesViewModal({
//   open,
//   archive,
//   onClose,
// }: {
//   open:    boolean
//   archive: Archive | null
//   onClose: () => void
// }) {
//   if (!archive) return null

//   const configs = getLigneConfigs(archive.produit_nom)

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
//       <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//         <Box>
//           <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
//             Couples — {archive.agence_nom} ({archive.agence_code})
//           </Typography>
//           <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
//             {archive.produit_nom} · {new Date(archive.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
//           </Typography>
//         </Box>
//         <IconButton size="small" onClick={onClose}><CloseOutlined /></IconButton>
//       </DialogTitle>

//       <DialogContent dividers>
//         {configs.length === 0 ? (
//           <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
//             Ce produit n'a pas de couples de documents à décomposer.
//           </Typography>
//         ) : (
//           configs.map((config, index) => (
//             <CouplesCoupleSection
//               key={`${config.label}-${index}`}
//               config={config}
//               parNumero={regrouperParCouple(archive, index, config)}
//             />
//           ))
//         )}
//       </DialogContent>

//       <DialogActions>
//         <Button onClick={onClose}>Fermer</Button>
//       </DialogActions>
//     </Dialog>
//   )
// }

// // ─── Modal Laboratoire — comparaison matin/soir du même jour ────

// function LaboratoireJourModal({
//   open,
//   archive,
//   onClose,
//   onRemplace,
// }: {
//   open:      boolean
//   archive:   Archive | null
//   onClose:   () => void
//   onRemplace: (archiveId: number, docId: number, file: File) => Promise<void>
// }) {
//   const [remplacant, setRemplacant] = useState<string | null>(null)

//   if (!archive) return null

//   const docMatin = archive.documents.find(d => d.type_doc === 'arrete_matin')
//   const docSoir  = archive.documents.find(d => d.type_doc === 'arrete_soir')

//   const handleChange = async (docId: number | undefined, typeDoc: string, file: File) => {
//     if (!docId) return
//     setRemplacant(typeDoc)
//     await onRemplace(archive.id, docId, file)
//     setRemplacant(null)
//   }

//   const renderSlot = (label: string, doc: DocumentArchive | undefined, typeDoc: string) => (
//     <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
//       <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5 }}>{label}</Typography>
//       {doc ? (
//         <>
//           <FilePreview url={doc.fichier_url} />
//           <Typography
//             component="a"
//             href={doc.fichier_url}
//             target="_blank"
//             color="primary"
//             sx={{ fontSize: 11, textDecoration: 'underline', display: 'block', mt: 1, mb: 1.5 }}
//           >
//             Ouvrir en plein écran
//           </Typography>
//           <label>
//             <input
//               type="file"
//               hidden
//               accept=".pdf,.jpg,.jpeg,.png"
//               onChange={(e) => {
//                 const file = e.target.files?.[0]
//                 if (file) handleChange(doc.id, typeDoc, file)
//                 e.target.value = ''
//               }}
//               disabled={remplacant === typeDoc}
//             />
//             <Button
//               component="span"
//               size="small"
//               variant="outlined"
//               fullWidth
//               disabled={remplacant === typeDoc}
//               startIcon={
//                 remplacant === typeDoc
//                   ? <CircularProgress size={12} />
//                   : <UploadFileOutlined sx={{ fontSize: 14 }} />
//               }
//             >
//               Remplacer
//             </Button>
//           </label>
//         </>
//       ) : (
//         <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
//           Aucun document téléversé pour ce créneau
//         </Typography>
//       )}
//     </Box>
//   )

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
//       <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//         <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
//           Laboratoire — {new Date(archive.date).toLocaleDateString('fr-FR')}
//         </Typography>
//         <IconButton size="small" onClick={onClose}><CloseOutlined /></IconButton>
//       </DialogTitle>
//       <DialogContent dividers>
//         <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 2 }}>
//           Comparez les arrêtés matin et soir de cette journée. En cas d'incohérence, remplacez le fichier concerné.
//         </Typography>
//         <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
//           {renderSlot('Arrêté matin', docMatin, 'arrete_matin')}
//           {renderSlot('Arrêté soir',  docSoir,  'arrete_soir')}
//         </Box>
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={onClose}>Fermer</Button>
//       </DialogActions>
//     </Dialog>
//   )
// }

// // ─── Ligne d'une archive ──────────────────────────────────────

// function ArchiveRow({
//   archive,
//   onUpload,
//   onUploadLigne,
//   onDownloadZip,
//   onOuvrirLaboratoire,
//   onOuvrirDossier,
//   onOuvrirCouples,
// }: {
//   archive:        Archive
//   onUpload:       (archiveId: number, typeDoc: string, file: File) => void
//   onUploadLigne:  (archiveId: number, typeDoc: string, ligne: number, file: File) => void
//   onDownloadZip:  (archive: Archive) => void
//   onOuvrirLaboratoire:  (archive: Archive) => void
//   onOuvrirDossier: (archive: Archive) => void
//   onOuvrirCouples: (archive: Archive) => void
// }) {
//   const [open, setOpen]           = useState(false)
//   const [uploading, setUploading] = useState<string | null>(null)

//   const statut = getStatut(archive)
//   const typesUniques = getTypesUniques(archive)

//   const handleUpload = async (typeDoc: string, file: File) => {
//     setUploading(typeDoc)
//     await onUpload(archive.id, typeDoc, file)
//     setUploading(null)
//   }

//   const handleUploadLigne = async (typeDoc: string, ligne: number, file: File) => {
//     const key = `${ligne}-${typeDoc}`
//     setUploading(key)
//     await onUploadLigne(archive.id, typeDoc, ligne, file)
//     setUploading(null)
//   }

//   return (
//     <Card variant="outlined" sx={{ borderRadius: 2, mb: 1 }}>
//       <Box
//         onClick={() => setOpen(!open)}
//         sx={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           p: '10px 16px',
//           cursor: 'pointer',
//           '&:hover': { bgcolor: 'action.hover' },
//           gap: 1,
//           flexWrap: 'wrap',
//         }}
//       >
//         <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
//           {new Date(archive.date).toLocaleDateString('fr-FR', {
//             weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
//           })}
//         </Typography>

//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <Chip
//             label={statut.label}
//             color={statut.color}
//             size="small"
//             sx={{ fontSize: 11, height: 22 }}
//           />
//           <Tooltip title="Consulter le dossier">
//             <IconButton
//               size="small"
//               onClick={(e) => { e.stopPropagation(); onOuvrirDossier(archive) }}
//             >
//               <FolderOpenOutlined sx={{ fontSize: 18 }} />
//             </IconButton>
//           </Tooltip>

//           {getLigneConfigs(archive.produit_nom).length > 0 && (
//             <Tooltip title="Afficher les couples">
//               <IconButton
//                 size="small"
//                 onClick={(e) => { e.stopPropagation(); onOuvrirCouples(archive) }}
//               >
//                 <TableRowsOutlined sx={{ fontSize: 18 }} />
//               </IconButton>
//             </Tooltip>
//           )}

//           <Tooltip title="Ouvrir laboratoire (comparer matin/soir)">
//             <IconButton
//               size="small"
//               onClick={(e) => { e.stopPropagation(); onOuvrirLaboratoire(archive) }}
//             >
//               <ScienceOutlined sx={{ fontSize: 18 }} />
//             </IconButton>
//           </Tooltip>

//           <Tooltip title="Télécharger ZIP">
//             <IconButton
//               size="small"
//               onClick={(e) => { e.stopPropagation(); onDownloadZip(archive) }}
//             >
//               <DownloadOutlined sx={{ fontSize: 18 }} />
//             </IconButton>
//           </Tooltip>
//           {open ? (
//             <ExpandLessOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
//           ) : (
//             <ExpandMoreOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
//           )}
//         </Box>
//       </Box>

//       {statut.color !== 'success' && (
//         <LinearProgress
//           variant="determinate"
//           value={statut.total > 0 ? Math.round((statut.done / statut.total) * 100) : 0}
//           color={statut.color === 'error' ? 'error' : 'warning'}
//           sx={{ height: 2 }}
//         />
//       )}

//       <Collapse in={open} unmountOnExit>
//         <CardContent sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
//           <Typography
//             sx={{ fontSize: 11, color: 'text.secondary', mb: 1, fontWeight: 500, letterSpacing: '0.05em' }}
//           >
//             Documents du jour
//           </Typography>
//           <Grid container spacing={1}>
//             {typesUniques.map(({ value, label }) => {
//               const doc = archive.documents.find(d => d.type_doc === value)
//               return (
//                 <Grid size={{ xs: 12, sm: 6, md: 4 }} key={value}>
//                   <DocSlotFusion
//                     typeDoc={value}
//                     label={label}
//                     document={doc}
//                     onUpload={handleUpload}
//                     uploading={uploading === value}
//                   />
//                 </Grid>
//               )
//             })}
//           </Grid>

//           <LignesClientsSection
//             archive={archive}
//             onUpload={handleUploadLigne}
//             uploadingKey={uploading}
//           />

//           <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
//             <Button
//               size="small"
//               startIcon={<DownloadOutlined />}
//               onClick={() => onDownloadZip(archive)}
//             >
//               Télécharger ZIP
//             </Button>
//           </Box>
//         </CardContent>
//       </Collapse>
//     </Card>
//   )
// }

// // ─── Bloc agence ──────────────────────────────────────────────

// function AgenceBloc({
//   agence,
//   onUpload,
//   onUploadLigne,
//   onDownloadZip,
//   onOuvrirLaboratoire,
//   onOuvrirDossier,
//   onOuvrirCouples,
// }: {
//   agence:              AgenceGroupe
//   onUpload:            (archiveId: number, typeDoc: string, file: File) => void
//   onUploadLigne:       (archiveId: number, typeDoc: string, ligne: number, file: File) => void
//   onDownloadZip:       (archive: Archive) => void
//   onOuvrirLaboratoire: (archive: Archive) => void
//   onOuvrirDossier:     (archive: Archive) => void
//   onOuvrirCouples:     (archive: Archive) => void
// }) {
//   return (
//     <Box sx={{ mb: 2.5 }}>
//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
//         <ApartmentOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
//         <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
//           {agence.agenceNom}
//         </Typography>
//         <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
//           ({agence.agenceCode})
//         </Typography>
//         <Chip
//           label={`${agence.archives.length} archive${agence.archives.length !== 1 ? 's' : ''}`}
//           size="small"
//           variant="outlined"
//           sx={{ fontSize: 10, height: 20, ml: 0.5 }}
//         />
//       </Box>

//       <Box sx={{ pl: { xs: 0, sm: 3 } }}>
//         {agence.archives.map(archive => (
//           <ArchiveRow
//             key={archive.id}
//             archive={archive}
//             onUpload={onUpload}
//             onUploadLigne={onUploadLigne}
//             onDownloadZip={onDownloadZip}
//             onOuvrirLaboratoire={onOuvrirLaboratoire}
//             onOuvrirDossier={onOuvrirDossier}
//             onOuvrirCouples={onOuvrirCouples}
//           />
//         ))}
//       </Box>
//     </Box>
//   )
// }

// // ─── Section accordéon par produit ────────────────────────────

// function ProduitAccordeon({
//   groupe,
//   onUpload,
//   onUploadLigne,
//   onDownloadZip,
//   onOuvrirLaboratoire,
//   onOuvrirDossier,
//   onOuvrirCouples,
// }: {
//   groupe:        ProduitGroupe
//   onUpload:      (archiveId: number, typeDoc: string, file: File) => void
//   onUploadLigne: (archiveId: number, typeDoc: string, ligne: number, file: File) => void
//   onDownloadZip: (archive: Archive) => void
//   onOuvrirLaboratoire: (archive: Archive) => void
//   onOuvrirDossier: (archive: Archive) => void
//   onOuvrirCouples: (archive: Archive) => void
// }) {
//   const style = getProduitStyle(groupe.produitNom)

//   return (
//     <Accordion
//       variant="outlined"
//       defaultExpanded
//       sx={{ borderRadius: 2, mb: 1.5, '&:before': { display: 'none' } }}
//     >
//       <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', flexWrap: 'wrap' }}>
//           <Chip
//             label={groupe.produitNom}
//             size="small"
//             sx={{
//               bgcolor: style.bg,
//               color:   style.color,
//               fontWeight: 600,
//               fontSize: 12,
//               height: 26,
//             }}
//           />
//           <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
//             {groupe.agences.length} agence{groupe.agences.length !== 1 ? 's' : ''}
//             {' · '}
//             {groupe.totalArchives} archive{groupe.totalArchives !== 1 ? 's' : ''}
//           </Typography>
//         </Box>
//       </AccordionSummary>
//       <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
//         {groupe.agences.map(agence => (
//           <AgenceBloc
//             key={agence.agenceId}
//             agence={agence}
//             onUpload={onUpload}
//             onUploadLigne={onUploadLigne}
//             onDownloadZip={onDownloadZip}
//             onOuvrirLaboratoire={onOuvrirLaboratoire}
//             onOuvrirDossier={onOuvrirDossier}
//             onOuvrirCouples={onOuvrirCouples}
//           />
//         ))}
//       </AccordionDetails>
//     </Accordion>
//   )
// }

// // ─── Modal nouvelle archive ────────────────────────────────────

// function NouvelleArchiveModal({
//   open,
//   agences,
//   produits,
//   onClose,
//   onCreate,
// }: {
//   open:     boolean
//   agences:  Agence[]
//   produits: Produit[]
//   onClose:  () => void
//   onCreate: (data: { agence: number; produit: number; date: string }) => Promise<void>
// }) {
//   const [agenceId,  setAgenceId]  = useState<number | ''>('')
//   const [produitId, setProduitId] = useState<number | ''>('')
//   const [date,      setDate]      = useState('')
//   const [loading,   setLoading]   = useState(false)
//   const [error,     setError]     = useState('')

//   const produitNom = produits.find(p => p.id === produitId)?.nom ?? ''

//   const TYPES_PREVIEW: Record<string, string[]> = {
//     western_union: ['Réconciliation','API','Arrêté de caisse (matin)','Arrêté de caisse (soir)','Journal de transaction','+ 1 bloc par client (reçu, bordereau, pièce)'],
//     change:        ['Mouvement de caisse','Arrêté de caisse (matin)','Arrêté de caisse (soir)','Journal de transaction','+ 1 bloc par client (reçu, pièce, justificatif)'],
//     visa:          ['Arrêté (matin)','Arrêté (soir)','Bordereau','+ 1 bloc par souscription (fiche souscription, pièce)','+ 1 bloc par réclamation (fiche réclamation, pièce)'],
//     momo:          ['Arrêté de caisse (matin)','Arrêté de caisse (soir)'],
//     airtel_money:  ['Arrêté (matin)','Arrêté (soir)'],
//   }

//   const handleSubmit = async () => {
//     if (!agenceId || !produitId || !date) {
//       setError('Veuillez remplir tous les champs.')
//       return
//     }
//     setLoading(true)
//     setError('')
//     try {
//       await onCreate({ agence: agenceId as number, produit: produitId as number, date })
//       setAgenceId(''); setProduitId(''); setDate('')
//       onClose()
//     } catch (err: any) {
//       const dataErr    = err?.response?.data
//       const messageErr = typeof dataErr === 'string' ? dataErr : JSON.stringify(dataErr ?? {})

//       if (err?.response?.status === 403 || messageErr.toLowerCase().includes('classeur') || messageErr.toLowerCase().includes('verrou')) {
//         setError('Ce mois est clôturé (classeur verrouillé). Veuillez déverrouiller le classeur mensuel correspondant.')
//       } else {
//         setError('Erreur lors de la création. Veuillez réessayer.')
//       }
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
//       <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//         <Typography sx={{ fontSize: 16, fontWeight: 500 }}>Nouvelle archive</Typography>
//         <IconButton size="small" onClick={onClose}><CloseOutlined /></IconButton>
//       </DialogTitle>

//       <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
//         {error && <Alert severity="error">{error}</Alert>}

//         <FormControl fullWidth size="small">
//           <InputLabel>Agence</InputLabel>
//           <Select
//             value={agenceId}
//             label="Agence"
//             onChange={e => setAgenceId(e.target.value as number)}
//           >
//             {agences.map(a => (
//               <MenuItem key={a.id} value={a.id}>{a.nom} ({a.code})</MenuItem>
//             ))}
//           </Select>
//         </FormControl>

//         <FormControl fullWidth size="small">
//           <InputLabel>Produit</InputLabel>
//           <Select
//             value={produitId}
//             label="Produit"
//             onChange={e => setProduitId(e.target.value as number)}
//           >
//             {produits.filter(p => p.is_active).map(p => (
//               <MenuItem key={p.id} value={p.id}>{p.nom_display}</MenuItem>
//             ))}
//           </Select>
//         </FormControl>

//         <DatePicker
//           label="Date"
//           value={strToDayjs(date)}
//           onChange={(v) => setDate(dayjsToStr(v))}
//           format="DD/MM/YYYY"
//           slotProps={{ textField: { size: 'small', fullWidth: true } }}
//         />

//         {produitNom && TYPES_PREVIEW[produitNom] && (
//           <Box>
//             <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.75 }}>
//               Documents requis pour ce produit
//             </Typography>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
//               {TYPES_PREVIEW[produitNom].map(label => (
//                 <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
//                   <RadioButtonUncheckedOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
//                   <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
//                 </Box>
//               ))}
//             </Box>
//           </Box>
//         )}
//       </DialogContent>

//       <DialogActions>
//         <Button onClick={onClose} disabled={loading}>Annuler</Button>
//         <Button
//           variant="contained"
//           onClick={handleSubmit}
//           disabled={loading}
//           startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
//         >
//           Créer l'archive
//         </Button>
//       </DialogActions>
//     </Dialog>
//   )
// }

// // ─── Modal Laboratoire — comparaison entre deux dates ───────────

// interface ComparaisonResult {
//   archive_id:   number
//   date:         string
//   arrete_matin: DocumentArchive | null
//   arrete_soir:  DocumentArchive | null
// }

// function LaboratoireComparaisonModal({
//   open,
//   agences,
//   produits,
//   onClose,
//   onComparer,
//   onRemplace,
// }: {
//   open:       boolean
//   agences:    Agence[]
//   produits:   Produit[]
//   onClose:    () => void
//   onComparer: (params: { agence_id: number; produit_id: number; date1: string; date2: string }) =>
//                 Promise<{ date1: ComparaisonResult | null; date2: ComparaisonResult | null }>
//   onRemplace: (archiveId: number, docId: number, file: File) => Promise<void>
// }) {
//   const [agenceId,  setAgenceId]  = useState<number | ''>('')
//   const [produitId, setProduitId] = useState<number | ''>('')
//   const [date1,     setDate1]     = useState('')
//   const [date2,     setDate2]     = useState('')
//   const [loading,   setLoading]   = useState(false)
//   const [error,     setError]     = useState('')
//   const [resultat,  setResultat]  = useState<{ date1: ComparaisonResult | null; date2: ComparaisonResult | null } | null>(null)
//   const [remplacant, setRemplacant] = useState<string | null>(null)

//   const reset = () => {
//     setAgenceId(''); setProduitId(''); setDate1(''); setDate2('')
//     setResultat(null); setError('')
//   }

//   const handleFermer = () => { reset(); onClose() }

//   const handleComparer = async () => {
//     if (!agenceId || !produitId || !date1 || !date2) {
//       setError('Agence, produit et les deux dates sont obligatoires.')
//       return
//     }
//     setLoading(true)
//     setError('')
//     try {
//       const res = await onComparer({
//         agence_id: agenceId as number,
//         produit_id: produitId as number,
//         date1, date2,
//       })
//       setResultat(res)
//     } catch {
//       setError('Erreur lors de la comparaison.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleRemplace = async (
//     archiveId: number | undefined,
//     docId: number | undefined,
//     slotKey: string,
//     file: File
//   ) => {
//     if (!archiveId || !docId) return
//     setRemplacant(slotKey)
//     await onRemplace(archiveId, docId, file)
//     setRemplacant(null)
//     if (agenceId && produitId && date1 && date2) {
//       const res = await onComparer({ agence_id: agenceId as number, produit_id: produitId as number, date1, date2 })
//       setResultat(res)
//     }
//   }

//   const renderColonne = (label: string, data: ComparaisonResult | null, slotPrefix: string) => (
//     <Box sx={{ flex: 1 }}>
//       <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>{label}</Typography>
//       {!data ? (
//         <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Aucune archive pour cette date</Typography>
//       ) : (
//         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
//           {(['arrete_matin', 'arrete_soir'] as const).map((champ) => {
//             const doc = data[champ]
//             const slotKey = `${slotPrefix}-${champ}`
//             return (
//               <Box key={champ} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
//                 <Typography sx={{ fontSize: 12, fontWeight: 500, mb: 1 }}>
//                   {champ === 'arrete_matin' ? 'Arrêté matin' : 'Arrêté soir'}
//                 </Typography>
//                 {doc ? (
//                   <>
//                     <FilePreview url={doc.fichier_url} height={200} />
//                     <Typography
//                       component="a" href={doc.fichier_url} target="_blank" color="primary"
//                       sx={{ fontSize: 11, textDecoration: 'underline', display: 'block', mt: 1, mb: 1 }}
//                     >
//                       Ouvrir en plein écran
//                     </Typography>
//                     <label>
//                       <input
//                         type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
//                         onChange={(e) => {
//                           const file = e.target.files?.[0]
//                           if (file) handleRemplace(data.archive_id, doc.id, slotKey, file)
//                           e.target.value = ''
//                         }}
//                         disabled={remplacant === slotKey}
//                       />
//                       <Button
//                         component="span" size="small" variant="outlined" fullWidth
//                         disabled={remplacant === slotKey}
//                         startIcon={remplacant === slotKey ? <CircularProgress size={12} /> : <UploadFileOutlined sx={{ fontSize: 13 }} />}
//                         sx={{ fontSize: 11 }}
//                       >
//                         Remplacer
//                       </Button>
//                     </label>
//                   </>
//                 ) : (
//                   <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Manquant</Typography>
//                 )}
//               </Box>
//             )
//           })}
//         </Box>
//       )}
//     </Box>
//   )

//   return (
//     <Dialog open={open} onClose={handleFermer} maxWidth="lg" fullWidth>
//       <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//         <Typography sx={{ fontSize: 16, fontWeight: 500 }}>Laboratoire — Comparaison entre deux dates</Typography>
//         <IconButton size="small" onClick={handleFermer}><CloseOutlined /></IconButton>
//       </DialogTitle>

//       <DialogContent dividers>
//         {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

//         <Grid container spacing={1.5} sx={{ mb: resultat ? 3 : 0 }}>
//           <Grid size={{ xs: 12, sm: 6 }}>
//             <FormControl fullWidth size="small">
//               <InputLabel>Agence</InputLabel>
//               <Select value={agenceId} label="Agence" onChange={e => setAgenceId(e.target.value as number)}>
//                 {agences.map(a => <MenuItem key={a.id} value={a.id}>{a.nom} ({a.code})</MenuItem>)}
//               </Select>
//             </FormControl>
//           </Grid>
//           <Grid size={{ xs: 12, sm: 6 }}>
//             <FormControl fullWidth size="small">
//               <InputLabel>Produit</InputLabel>
//               <Select value={produitId} label="Produit" onChange={e => setProduitId(e.target.value as number)}>
//                 {produits.map(p => <MenuItem key={p.id} value={p.id}>{p.nom_display}</MenuItem>)}
//               </Select>
//             </FormControl>
//           </Grid>
//           <Grid size={{ xs: 6 }}>
//             <DatePicker
//               label="Date 1"
//               value={strToDayjs(date1)}
//               onChange={(v) => setDate1(dayjsToStr(v))}
//               format="DD/MM/YYYY"
//               slotProps={{ textField: { size: 'small', fullWidth: true } }}
//             />
//           </Grid>
//           <Grid size={{ xs: 6 }}>
//             <DatePicker
//               label="Date 2"
//               value={strToDayjs(date2)}
//               onChange={(v) => setDate2(dayjsToStr(v))}
//               format="DD/MM/YYYY"
//               slotProps={{ textField: { size: 'small', fullWidth: true } }}
//             />
//           </Grid>
//         </Grid>

//         {resultat && (
//           <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
//             {renderColonne(new Date(date1).toLocaleDateString('fr-FR'), resultat.date1, 'd1')}
//             {renderColonne(new Date(date2).toLocaleDateString('fr-FR'), resultat.date2, 'd2')}
//           </Box>
//         )}
//       </DialogContent>

//       <DialogActions>
//         <Button onClick={handleFermer}>Fermer</Button>
//         <Button
//           variant="contained"
//           onClick={handleComparer}
//           disabled={loading}
//           startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <ScienceOutlined />}
//         >
//           Comparer
//         </Button>
//       </DialogActions>
//     </Dialog>
//   )
// }

// // ─── Page principale ─────────────────────────────────────────────

// function MouvementsAgencesContent() {
//   const searchParams = useSearchParams()

//   const [archives,     setArchives]     = useState<Archive[]>([])
//   const [agences,      setAgences]      = useState<Agence[]>([])
//   const [produits,     setProduits]     = useState<Produit[]>([])
//   const [loading,      setLoading]      = useState(true)
//   const [error,        setError]        = useState('')
//   const [modalOpen,    setModalOpen]    = useState(false)

//   const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
//   const [villes,      setVilles]      = useState<Ville[]>([])
//   const estConformitePrincipale =
//     currentUser?.role === 'conformite' && !currentUser?.ville

//   const [contexteClasseur, setContexteClasseur] = useState<string | null>(null)

//   // Filtres
//   const [filtreAgence,  setFiltreAgence]  = useState('')
//   const [filtreProduit, setFiltreProduit] = useState('')
//   const [filtreStatut,  setFiltreStatut]  = useState('')
//   const [filtreDebut,   setFiltreDebut]   = useState('')
//   const [filtreFin,     setFiltreFin]     = useState('')
//   const [filtreVille,   setFiltreVille]   = useState('')

//   const [labJourOpen,    setLabJourOpen]    = useState(false)
//   const [labJourArchive, setLabJourArchive] = useState<Archive | null>(null)

//   const [labComparaisonOpen, setLabComparaisonOpen] = useState(false)

//   // Modal "consulter le dossier"
//   const [dossierOpen,    setDossierOpen]    = useState(false)
//   const [dossierArchive, setDossierArchive] = useState<Archive | null>(null)

//   // Modal "Afficher les couples"
//   const [couplesOpen,    setCouplesOpen]    = useState(false)
//   const [couplesArchive, setCouplesArchive] = useState<Archive | null>(null)

//   // ── Chargement initial ──────────────────────────────────────
//   useEffect(() => {
//     const load = async () => {
//       try {
//         const [archRes, agRes, prRes, meRes] = await Promise.all([
//           archiveAgenceAPI.liste(),
//           agenceAPI.liste(),
//           produitAPI.liste(),
//           userAPI.me(),
//         ])
//         setArchives(archRes.data.results ?? archRes.data)
//         setAgences(agRes.data.results   ?? agRes.data)
//         setProduits(prRes.data.results  ?? prRes.data)
//         setCurrentUser(meRes.data)

//         if (meRes.data?.role === 'conformite' && !meRes.data?.ville) {
//           const villesRes = await villeAPI.liste()
//           setVilles(villesRes.data.results ?? villesRes.data)
//         }
//       } catch {
//         setError('Impossible de charger les données.')
//       } finally {
//         setLoading(false)
//       }
//     }
//     load()
//   }, [])

//   // ── Préremplissage filtres depuis l'URL ─────────────────────
//   useEffect(() => {
//     const agenceId = searchParams.get('agence_id')
//     const dd = searchParams.get('date_debut')
//     const df = searchParams.get('date_fin')
//     if (agenceId) setFiltreAgence(agenceId)
//     if (dd) setFiltreDebut(dd)
//     if (df) setFiltreFin(df)

//     if (agenceId && dd && agences.length > 0) {
//       const ag = agences.find(a => String(a.id) === agenceId)
//       if (ag) {
//         const moisAnnee = new Date(dd + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
//         setContexteClasseur(`${ag.code} — ${moisAnnee}`)
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [searchParams, agences])

//   // ── Filtrage local ───────────────────────────────────────────
//   const archivesFiltrees = archives.filter(a => {
//     if (filtreAgence  && String(a.agence)  !== filtreAgence)  return false
//     if (filtreProduit && String(a.produit) !== filtreProduit) return false
//     if (filtreDebut   && a.date < filtreDebut)                return false
//     if (filtreFin     && a.date > filtreFin)                  return false
//     if (estConformitePrincipale && filtreVille && String(a.agence_ville) !== filtreVille) return false
//     if (filtreStatut) {
//       const st = getStatut(a)
//       if (filtreStatut === 'complet' && st.color !== 'success') return false
//       if (filtreStatut === 'partiel' && st.color !== 'warning') return false
//       if (filtreStatut === 'vide'    && st.color !== 'error')   return false
//     }
//     return true
//   })

//   const groupes = useMemo(
//     () => regrouperParProduitEtAgence(archivesFiltrees),
//     [archivesFiltrees]
//   )

//   const handleCreate = async (data: { agence: number; produit: number; date: string }) => {
//     const res = await archiveAgenceAPI.creer(data)
//     setArchives(prev => [res.data, ...prev])
//   }

//   // ── Téléverser un document unique (jour) ─────────────────────
//   const handleUpload = async (archiveId: number, typeDoc: string, file: File) => {
//     const formData = new FormData()
//     formData.append('type_doc', typeDoc)
//     formData.append('fichier',  file)

//     const token = localStorage.getItem('access_token')
//     if (token) {
//       const payload = JSON.parse(atob(token.split('.')[1]))
//       formData.append('uploade_par', String(payload.user_id))
//     }

//     try {
//       const res = await archiveAgenceAPI.uploadDoc(archiveId, formData)
//       setArchives(prev =>
//         prev.map(a =>
//           a.id === archiveId
//             ? {
//                 ...a,
//                 documents: [...a.documents, res.data],
//                 documents_complets:
//                   a.documents.length + 1 >= a.types_requis.length,
//               }
//             : a
//         )
//       )
//     } catch (err: any) {
//       console.error('Upload échoué', {
//         status: err?.response?.status,
//         data:   err?.response?.data,
//         message: err?.message,
//         typeDoc,
//       })
//       if (err?.response?.status === 403) {
//         setError("Ce classeur mensuel est verrouillé. Déverrouillez-le pour téléverser un document.")
//       } else {
//         setError(`Erreur lors du téléversement (${detailErreurApi(err)}).`)
//       }
//     }
//   }

//   // ── Téléverser un document de couple (opération client) ─────
//   // Envoie le numéro de ligne au backend pour distinguer plusieurs
//   // documents partageant le même type_doc au sein d'une même archive.
//   // Si un document existe déjà à cette ligne pour ce type (bouton
//   // « Remplacer »), on passe par remplacerDocument plutôt que de recréer
//   // un document, pour éviter un conflit d'unicité côté Django.
//   const handleUploadLigne = async (archiveId: number, typeDoc: string, ligne: number, file: File) => {
//     const existant = archives
//       .find(a => a.id === archiveId)
//       ?.documents.find(d => d.type_doc === typeDoc && (d.ligne ?? 1) === ligne)

//     try {
//       let res
//       if (existant) {
//         const fd = new FormData()
//         fd.append('fichier', file)
//         res = await archiveAgenceAPI.remplacerDocument(archiveId, existant.id, fd)
//       } else {
//         const formData = new FormData()
//         formData.append('type_doc', typeDoc)
//         formData.append('fichier',  file)
//         formData.append('ligne',    String(ligne))

//         const token = localStorage.getItem('access_token')
//         if (token) {
//           const payload = JSON.parse(atob(token.split('.')[1]))
//           formData.append('uploade_par', String(payload.user_id))
//         }
//         res = await archiveAgenceAPI.uploadDoc(archiveId, formData)
//       }

//       const docSauvegarde: DocumentArchive = { ...res.data, ligne: res.data.ligne ?? ligne }

//       setArchives(prev =>
//         prev.map(a =>
//           a.id === archiveId
//             ? {
//                 ...a,
//                 documents: [
//                   ...a.documents.filter(d => !(d.type_doc === typeDoc && (d.ligne ?? 1) === ligne)),
//                   docSauvegarde,
//                 ],
//               }
//             : a
//         )
//       )
//     } catch (err: any) {
//       console.error('Upload échoué', {
//         status: err?.response?.status,
//         data:   err?.response?.data,
//         message: err?.message,
//         typeDoc,
//         ligne,
//       })
//       if (err?.response?.status === 403) {
//         setError("Ce classeur mensuel est verrouillé. Déverrouillez-le pour téléverser un document.")
//       } else {
//         setError(`Erreur lors de l'enregistrement de la ligne (${detailErreurApi(err)}).`)
//       }
//     }
//   }

//   const handleDownloadZip = async (archive: Archive) => {
//     try {
//       const res  = await archiveAgenceAPI.telechargerZip(archive.id)
//       const url  = window.URL.createObjectURL(new Blob([res.data]))
//       const link = document.createElement('a')
//       link.href  = url
//       const fileName = `${archive.produit_nom}_${archive.date}.zip`
//       link.setAttribute('download', fileName)
//       document.body.appendChild(link)
//       link.click()
//       link.remove()
//       window.URL.revokeObjectURL(url)
//     } catch {
//       console.error('Échec du téléchargement ZIP')
//     }
//   }

//   const handleOuvrirLaboratoire = (archive: Archive) => {
//     setLabJourArchive(archive)
//     setLabJourOpen(true)
//   }

//   const handleOuvrirDossier = (archive: Archive) => {
//     setDossierArchive(archive)
//     setDossierOpen(true)
//   }

//   const handleOuvrirCouples = (archive: Archive) => {
//     setCouplesArchive(archive)
//     setCouplesOpen(true)
//   }

//   const handleRemplacerDocument = async (archiveId: number, docId: number, file: File) => {
//     const formData = new FormData()
//     formData.append('fichier', file)
//     try {
//       const res = await archiveAgenceAPI.remplacerDocument(archiveId, docId, formData)
//       setArchives(prev =>
//         prev.map(a =>
//           a.id === archiveId
//             ? { ...a, documents: a.documents.map(d => d.id === docId ? res.data : d) }
//             : a
//         )
//       )
//       setLabJourArchive(prev =>
//         prev && prev.id === archiveId
//           ? { ...prev, documents: prev.documents.map(d => d.id === docId ? res.data : d) }
//           : prev
//       )
//     } catch (err: any) {
//       console.error('Remplacement échoué', err.response?.data)
//       setError(
//         err.response?.status === 403
//           ? "Ce classeur mensuel est verrouillé. Déverrouillez-le pour remplacer un document."
//           : 'Erreur lors du remplacement du document.'
//       )
//     }
//   }

//   const handleComparer = async (params: { agence_id: number; produit_id: number; date1: string; date2: string }) => {
//     const res = await archiveAgenceAPI.comparer(params)
//     return res.data
//   }

//   // ── Render ─────────────────────────────────────────────────
//   return (
//     <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
//     <Box sx={{ p: { xs: 2, md: 3 } }}>

//       {/* En-tête */}
//       <Box
//         sx={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           mb: 2.5,
//           flexWrap: 'wrap',
//           gap: 1.5
//         }}
//       >
//         <Box>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             <AccountBalanceOutlined sx={{ color: '#185FA5', fontSize: 26 }} />
//             <Typography  sx={{ fontSize: 20, fontWeight: 500 }}>
//               Mouvements agences
//             </Typography>
//           </Box>
//           {contexteClasseur && (
//             <Chip
//               label={`Classeur : ${contexteClasseur}`}
//               size="small"
//               sx={{ mt: 1, bgcolor: '#1e293b', color: 'white', fontWeight: 600 }}
//               onDelete={() => setContexteClasseur(null)}
//             />
//           )}
//         </Box>
//         <Box sx={{ display: 'flex', gap: 1.5 }}>
//           <Button
//             variant="outlined"
//             startIcon={<ScienceOutlined />}
//             onClick={() => setLabComparaisonOpen(true)}
//           >
//             Ouvrir laboratoire
//           </Button>
//           <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setModalOpen(true)}>
//             Nouvelle archive
//           </Button>
//         </Box>
//       </Box>

//       {/* Filtres */}
//       <Card variant="outlined" sx={{ borderRadius: 2, mb: 2.5 }}>
//         <CardContent sx={{ pb: '12px !important' }}>
//           <Grid container spacing={1.5}>
//             <Grid size={{ xs: 12, sm: 6, md: 2 }} >
//               <FormControl fullWidth size="small">
//                 <InputLabel>Agence</InputLabel>
//                 <Select
//                   value={filtreAgence}
//                   label="Agence"
//                   onChange={e => setFiltreAgence(e.target.value)}
//                 >
//                   <MenuItem value="">Toutes</MenuItem>
//                   {agences.map(a => (
//                     <MenuItem key={a.id} value={String(a.id)}>{a.nom}</MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid size={{ xs: 12, sm: 6, md: 2 }}>
//               <FormControl fullWidth size="small">
//                 <InputLabel>Produit</InputLabel>
//                 <Select
//                   value={filtreProduit}
//                   label="Produit"
//                   onChange={e => setFiltreProduit(e.target.value)}
//                 >
//                   <MenuItem value="">Tous</MenuItem>
//                   {produits.map(p => (
//                     <MenuItem key={p.id} value={String(p.id)}>{p.nom_display}</MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid size={{ xs: 6, sm: 4, md: 2 }}>
//               <DatePicker
//                 label="Du"
//                 value={strToDayjs(filtreDebut)}
//                 onChange={(v) => setFiltreDebut(dayjsToStr(v))}
//                 format="DD/MM/YYYY"
//                 slotProps={{ textField: { size: 'small', fullWidth: true } }}
//               />
//             </Grid>

//             <Grid size={{ xs: 6, sm: 4, md: 2 }}>
//               <DatePicker
//                 label="Au"
//                 value={strToDayjs(filtreFin)}
//                 onChange={(v) => setFiltreFin(dayjsToStr(v))}
//                 format="DD/MM/YYYY"
//                 slotProps={{ textField: { size: 'small', fullWidth: true } }}
//               />
//             </Grid>

//             {estConformitePrincipale && (
//               <Grid size={{ xs: 12, sm: 6, md: 2 }}>
//                 <FormControl fullWidth size="small">
//                   <InputLabel>Ville</InputLabel>
//                   <Select
//                     value={filtreVille}
//                     label="Ville"
//                     onChange={e => setFiltreVille(e.target.value)}
//                   >
//                     <MenuItem value="">Toutes</MenuItem>
//                     {villes.map(v => (
//                       <MenuItem key={v.id} value={String(v.id)}>
//                         {v.nom}{v.pays_nom ? ` (${v.pays_nom})` : ''}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>
//             )}

//             <Grid size={{ xs: 12, sm: 4, md: 2 }}>
//               <FormControl fullWidth size="small">
//                 <InputLabel>Statut</InputLabel>
//                 <Select
//                   value={filtreStatut}
//                   label="Statut"
//                   onChange={e => setFiltreStatut(e.target.value)}
//                 >
//                   <MenuItem value="">Tous</MenuItem>
//                   <MenuItem value="complet">Complet</MenuItem>
//                   <MenuItem value="partiel">Partiel</MenuItem>
//                   <MenuItem value="vide">Vide</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid size={{ xs: 12, sm: 4, md: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
//               <Button
//                 size="small"
//                 onClick={() => {
//                   setFiltreAgence('')
//                   setFiltreProduit('')
//                   setFiltreStatut('')
//                   setFiltreDebut('')
//                   setFiltreFin('')
//                   setFiltreVille('')
//                   setContexteClasseur(null)
//                 }}
//               >
//                 Réinitialiser
//               </Button>
//             </Grid>
//           </Grid>
//         </CardContent>
//       </Card>

//       {/* Compteur */}
//       <Typography sx={{ fontSize: 14, mb: 2, color: 'text.secondary' }}>
//         {archivesFiltrees.length} archive{archivesFiltrees.length !== 1 ? 's' : ''}
//         {' · '}
//         {groupes.length} produit{groupes.length !== 1 ? 's' : ''}
//       </Typography>

//       {loading && <LinearProgress />}

//       {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

//       {!loading && archivesFiltrees.length === 0 && (
//         <Box sx={{textAlign: 'center', py: 6, color: 'text.secondary'}}>
//           <FolderOffOutlined sx={{ fontSize: 40, mb: 1.5, opacity: 0.4 }} />
//           <Typography sx={{ fontSize: 14 }}>Aucune archive trouvée</Typography>
//         </Box>
//       )}

//       {groupes.map(groupe => (
//         <ProduitAccordeon
//           key={groupe.produitId}
//           groupe={groupe}
//           onUpload={handleUpload}
//           onUploadLigne={handleUploadLigne}
//           onDownloadZip={handleDownloadZip}
//           onOuvrirLaboratoire={handleOuvrirLaboratoire}
//           onOuvrirDossier={handleOuvrirDossier}
//           onOuvrirCouples={handleOuvrirCouples}
//         />
//       ))}

//       <NouvelleArchiveModal
//         open={modalOpen}
//         agences={agences}
//         produits={produits}
//         onClose={() => setModalOpen(false)}
//         onCreate={handleCreate}
//       />

//       <LaboratoireJourModal
//         open={labJourOpen}
//         archive={labJourArchive}
//         onClose={() => { setLabJourOpen(false); setLabJourArchive(null) }}
//         onRemplace={handleRemplacerDocument}
//       />

//       <LaboratoireComparaisonModal
//         open={labComparaisonOpen}
//         agences={agences}
//         produits={produits}
//         onClose={() => setLabComparaisonOpen(false)}
//         onComparer={handleComparer}
//         onRemplace={handleRemplacerDocument}
//       />

//       <DossierViewModal
//         open={dossierOpen}
//         archive={dossierArchive}
//         onClose={() => { setDossierOpen(false); setDossierArchive(null) }}
//       />

//       <CouplesViewModal
//         open={couplesOpen}
//         archive={couplesArchive}
//         onClose={() => { setCouplesOpen(false); setCouplesArchive(null) }}
//       />

//     </Box>
//     </LocalizationProvider>
//   )
// }

// export default function MouvementsAgencesPage() {
//   return (
//     <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>}>
//       <MouvementsAgencesContent />
//     </Suspense>
//   )
// }



'use client'

import { useState, useEffect, useMemo, Suspense, Fragment, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    Box, Typography, Card, CardContent, Button,
    Grid, TextField, Alert, CircularProgress,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem,
    LinearProgress, Collapse, Tooltip, IconButton,
    Accordion, AccordionSummary, AccordionDetails,
    Divider,
} from '@mui/material'

import {
  AccountBalanceOutlined,
  AddOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  DownloadOutlined,
  UploadFileOutlined,
  CheckCircleOutlined,
  RadioButtonUncheckedOutlined,
  CloseOutlined,
  FolderOffOutlined,
  ApartmentOutlined,
  ScienceOutlined,
  FolderOpenOutlined,
  PersonOutlined,
  PhotoLibraryOutlined,
  MergeTypeOutlined,
  SwapHorizOutlined,
  SwapVertOutlined,
  TableRowsOutlined,
} from '@mui/icons-material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/fr'
import { PDFDocument } from 'pdf-lib'
import { archiveAgenceAPI, agenceAPI, produitAPI, userAPI, villeAPI } from '@/lib/api'

// ── Helper : conversion string ISO ('YYYY-MM-DD') <-> Dayjs pour les DatePicker ──
const strToDayjs = (value: string): Dayjs | null => (value ? dayjs(value, 'YYYY-MM-DD') : null)
const dayjsToStr = (value: Dayjs | null): string => (value && value.isValid() ? value.format('YYYY-MM-DD') : '')

// ── Helper : message lisible à partir d'une erreur axios ──
// Évite le « Upload échoué {} » : on remonte statut + corps (JSON ou texte).
function detailErreurApi(err: any): string {
  const status = err?.response?.status
  const data   = err?.response?.data
  let detail = ''
  if (typeof data === 'string') detail = data.slice(0, 200)
  else if (data && Object.keys(data).length > 0) detail = JSON.stringify(data)
  else detail = err?.message ?? 'Erreur inconnue'
  return `${status ?? 'réseau'} — ${detail}`
}

// ─── Types ────────────────────────────────────────────────────

interface Agence {
  id: number
  nom: string
  code: string
}

interface Ville {
  id: number
  nom: string
  pays_nom?: string
}

interface CurrentUser {
  id: number
  role: 'superadmin' | 'conformite' | 'chef_produit' | 'chef_agence'
  pays: number | null
  ville: number | null
}

interface Produit {
  id: number
  nom: string
  nom_display: string
  is_active: boolean
}

interface DocumentArchive {
  id: number
  type_doc: string
  type_doc_display: string
  fichier_url: string
  uploade_par: number
  uploaded_at: string
  // Distingue plusieurs documents du même type_doc dans une même archive
  // (ex. 15 "recu" pour 15 clients dans la journée). Nécessite un champ
  // `ligne` (int, nullable, défaut 1) côté modèle/serializer Django, avec
  // unicité (archive, type_doc, ligne). Si absent côté API, tout document
  // est traité comme ligne 1.
  ligne?: number | null
}

interface Archive {
  id: number
  agence: number
  agence_nom: string
  agence_code: string
  agence_ville: number | null
  agence_ville_nom?: string
  produit: number
  produit_nom: string
  date: string
  archive_par: number
  archive_par_nom: string
  documents: DocumentArchive[]
  documents_complets: boolean
  types_requis: { value: string; label: string }[]
  created_at: string
  updated_at: string
}

// ─── Normalisation du nom de produit ────────────────────────────
// Selon la version du serializer Django, `produit_nom` peut être le slug
// stocké ("western_union") OU le libellé humain ("Western Union", "VISA").
// Pour ne pas dépendre de ce détail backend, on normalise avant de
// chercher dans les tables ci-dessous : minuscules, accents retirés,
// espaces remplacés par des underscores. "Western Union" et
// "western_union" donnent tous les deux "western_union".
function normaliserProduit(nom: string): string {
  return (nom ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

// ─── Couleurs par produit ──────────────────────────────────────

const PRODUIT_COLORS: Record<string, { bg: string; color: string }> = {
  western_union: { bg: '#E6F1FB', color: '#0C447C' },
  change:        { bg: '#EAF3DE', color: '#27500A' },
  visa:          { bg: '#EEEDFE', color: '#3C3489' },
  momo:          { bg: '#FAEEDA', color: '#633806' },
  airtel_money:  { bg: '#FAECE7', color: '#712B13' },
}

function getProduitStyle(nom: string) {
  return PRODUIT_COLORS[normaliserProduit(nom)] ?? { bg: '#F1EFE8', color: '#444441' }
}

// ─── Configuration des "couples" de documents par produit ──────
// Un couple est un ensemble de types de documents "agrafés" ensemble : ils
// appartiennent à la même opération/client et se répètent autant de fois
// qu'il y a eu d'opérations dans la journée (15 clients => 15 exemplaires
// du couple). Un produit peut avoir PLUSIEURS couples indépendants — par
// exemple pour Visa, une fiche de souscription est agrafée à SA pièce
// d'identité, et une fiche de réclamation est agrafée à SA PROPRE pièce
// d'identité : ce sont deux couples distincts, avec leur propre numérotation,
// même s'ils partagent le type de document "piece_identite".
// Tout type_doc qui n'apparaît dans aucun couple reste un document unique
// pour la journée (un seul exemplaire, ex : arrêtés matin/soir).

interface LigneConfig {
  types: string[]      // type_doc, dans l'ordre d'affichage du couple
  label: string        // nom du couple affiché à l'utilisateur
}

const PRODUIT_LIGNES_CONFIG: Record<string, LigneConfig[]> = {
  western_union: [
    { types: ['recu', 'bordereau', 'piece_identite'], label: 'Opération client' },
  ],
  change: [
    { types: ['recu', 'piece_identite', 'justificatif'], label: 'Opération client' },
  ],
  visa: [
    { types: ['fiche_souscription', 'piece_identite'], label: 'Souscription' },
    { types: ['fiche_reclamation', 'piece_identite'], label: 'Réclamation' },
  ],
}

function getLigneConfigs(produitNom: string): LigneConfig[] {
  return PRODUIT_LIGNES_CONFIG[normaliserProduit(produitNom)] ?? []
}

// Écart entre les plages de numérotation de deux couples d'un même produit.
// Un même type_doc (ex. "piece_identite") peut appartenir à deux couples
// différents ; pour ne jamais mélanger les pièces de l'un avec celles de
// l'autre, chaque couple reçoit sa propre tranche de numéros de ligne
// (couple n°0 : 1 à 99 999, couple n°1 : 100 001 à 199 999, etc.). Le
// numéro affiché à l'utilisateur est toujours le numéro relatif au sein de
// son couple ; seul le numéro stocké côté API (« ligne ») inclut le décalage.
const ECART_ENTRE_COUPLES = 100000

// Types "uniques" requis pour une archive = tous les types_requis SAUF ceux
// qui appartiennent à un couple du produit.
function getTypesUniques(archive: Archive): { value: string; label: string }[] {
  const configs = getLigneConfigs(archive.produit_nom)
  if (configs.length === 0) return archive.types_requis
  const typesDeCouples = new Set(configs.flatMap(c => c.types))
  return archive.types_requis.filter(t => !typesDeCouples.has(t.value))
}

// Regroupe les documents d'UN couple donné par numéro d'opération affiché
// (1, 2, 3…), en ne retenant que les documents dont le numéro de ligne
// stocké tombe dans la tranche réservée à ce couple.
function regrouperParCouple(archive: Archive, indexCouple: number, config: LigneConfig): Map<number, DocumentArchive[]> {
  const base = indexCouple * ECART_ENTRE_COUPLES
  const parNumero = new Map<number, DocumentArchive[]>()

  for (const doc of archive.documents) {
    if (!config.types.includes(doc.type_doc)) continue
    const ligneStockee = doc.ligne ?? 1
    if (ligneStockee <= base || ligneStockee > base + ECART_ENTRE_COUPLES) continue
    const numeroAffiche = ligneStockee - base
    if (!parNumero.has(numeroAffiche)) parNumero.set(numeroAffiche, [])
    parNumero.get(numeroAffiche)!.push(doc)
  }
  return parNumero
}

function ligneEstComplete(docs: DocumentArchive[], config: LigneConfig): boolean {
  return config.types.every(t => docs.some(d => d.type_doc === t))
}

function libelleType(typeDoc: string): string {
  const s = typeDoc.replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Statut archive (sert aux filtres et à la barre de progression) ──
// Compte les documents uniques présents + un point par couple (validé
// seulement si TOUTES ses opérations sont complètes et qu'il y en a au
// moins une). Ne dépend donc plus du nombre de clients de la journée.

function getStatut(archive: Archive): {
  label: string
  color: 'success' | 'warning' | 'error'
  done: number
  total: number
} {
  const uniques = getTypesUniques(archive)
  const configs = getLigneConfigs(archive.produit_nom)

  const uniquesFaits = uniques.filter(t =>
    archive.documents.some(d => d.type_doc === t.value)
  ).length

  let couplesValides = 0
  configs.forEach((config, index) => {
    const parNumero = regrouperParCouple(archive, index, config)
    const numeros = Array.from(parNumero.keys())
    if (numeros.length > 0 && numeros.every(n => ligneEstComplete(parNumero.get(n) ?? [], config))) {
      couplesValides++
    }
  })

  const total = uniques.length + configs.length
  const done  = uniquesFaits + couplesValides

  if (archive.documents.length === 0) return { label: 'Vide',    color: 'error',   done, total }
  if (done >= total)                  return { label: 'Complet', color: 'success', done, total }
  return { label: `${done}/${total}`, color: 'warning', done, total }
}

// ─── Regroupement Produit → Agence → Archives ───────────────────

interface AgenceGroupe {
  agenceId:   number
  agenceNom:  string
  agenceCode: string
  archives:   Archive[]
}

interface ProduitGroupe {
  produitId:   number
  produitNom:  string
  agences:     AgenceGroupe[]
  totalArchives: number
}

function regrouperParProduitEtAgence(archives: Archive[]): ProduitGroupe[] {
  const parProduit = new Map<number, Map<number, AgenceGroupe>>()

  for (const archive of archives) {
    if (!parProduit.has(archive.produit)) {
      parProduit.set(archive.produit, new Map())
    }
    const parAgence = parProduit.get(archive.produit)!

    if (!parAgence.has(archive.agence)) {
      parAgence.set(archive.agence, {
        agenceId:   archive.agence,
        agenceNom:  archive.agence_nom,
        agenceCode: archive.agence_code,
        archives:   [],
      })
    }
    parAgence.get(archive.agence)!.archives.push(archive)
  }

  const groupes: ProduitGroupe[] = []
  for (const [produitId, parAgence] of parProduit) {
    const agences = Array.from(parAgence.values())
      .sort((a, b) => a.agenceNom.localeCompare(b.agenceNom))

    agences.forEach(a => {
      a.archives.sort((x, y) => y.date.localeCompare(x.date))
    })

    const produitNom = agences[0]?.archives[0]?.produit_nom ?? ''
    const totalArchives = agences.reduce((sum, a) => sum + a.archives.length, 0)

    groupes.push({ produitId, produitNom, agences, totalArchives })
  }

  return groupes.sort((a, b) => a.produitNom.localeCompare(b.produitNom))
}

// ─── Aperçu inline d'un fichier ────────────────────────────────

function getExtension(url?: string | null): string {
  if (!url) return ''
  const clean = url.split('?')[0]
  const parts = clean.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

function FilePreview({ url, height = 260 }: { url?: string | null; height?: number }) {
  if (!url) {
    return (
      <Box
        sx={{
          height, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Aucun fichier</Typography>
      </Box>
    )
  }

  const ext = getExtension(url)
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  const isPdf   = ext === 'pdf'

  if (isImage) {
    return (
      <Box
        sx={{
          height, borderRadius: 1.5, overflow: 'hidden',
          bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <img
          src={url}
          alt="Aperçu du document"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </Box>
    )
  }

  if (isPdf) {
    return (
      <Box sx={{ height, borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <iframe
          src={`${url}#toolbar=0`}
          title="Aperçu PDF"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        height, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1,
      }}
    >
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Aperçu indisponible</Typography>
      <Typography component="a" href={url} target="_blank" color="primary" sx={{ fontSize: 12, textDecoration: 'underline' }}>
        Ouvrir dans un nouvel onglet
      </Typography>
    </Box>
  )
}

// ─── Fusion de plusieurs images en un seul PDF ──────────────────
// Chaque image est repassée par un canvas pour être ré-encodée en PNG
// (accepte donc jpg/png/webp/gif en entrée de façon uniforme), puis
// intégrée comme une page du PDF final, dans l'ordre choisi.

async function imageVersPng(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non supporté')
  ctx.drawImage(bitmap, 0, 0)
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Échec de conversion'))), 'image/png')
  })
  return new Uint8Array(await blob.arrayBuffer())
}

async function fusionnerImagesEnPDF(files: File[], nomFichier: string): Promise<File> {
  const pdfDoc = await PDFDocument.create()
  for (const file of files) {
    const pngBytes = await imageVersPng(file)
    const image = await pdfDoc.embedPng(pngBytes)
    const page = pdfDoc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
  }
  const pdfBytes = await pdfDoc.save()
  // .slice() force un ArrayBuffer "classique" (et non ArrayBufferLike),
  // seul type accepté par le constructeur Blob/File en TS strict.
  const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer
  return new File([arrayBuffer], nomFichier, { type: 'application/pdf' })
}

function estImage(file: File): boolean {
  return file.type.startsWith('image/')
}

// ─── Décomposition d'un document en pages (pour "Afficher les couples") ──
// Un document de couple peut être un PDF fusionné à partir de plusieurs
// photos (recto/verso, plusieurs pages). Pour l'affichage en palette
// horizontale, chaque page est rendue en image miniature via pdfjs-dist.
// Une image simple (jpg/png/webp) est traitée comme un document d'une
// seule page.
//
// Dépendance à installer : `npm install pdfjs-dist`
// Le worker est chargé depuis un CDN pour éviter les soucis de bundling ;
// remplacez cette URL par un worker self-hosted si votre CSP l'exige.

let pdfjsLibPromise: Promise<typeof import('pdfjs-dist')> | null = null

async function chargerPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist').then(mod => {
      mod.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.mjs`
      return mod
    })
  }
  return pdfjsLibPromise
}

// Cache mémoire : évite de re-décomposer le même document si l'utilisateur
// ferme puis rouvre la modale, ou déplie/replie l'accordéon plusieurs fois.
const cachePagesDocument = new Map<string, string[]>()

async function extrairePagesDocument(url: string): Promise<string[]> {
  const dejaEnCache = cachePagesDocument.get(url)
  if (dejaEnCache) return dejaEnCache

  const ext = getExtension(url)
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    cachePagesDocument.set(url, [url])
    return [url]
  }
  if (ext !== 'pdf') return []

  const pdfjsLib = await chargerPdfjs()
  const pdf = await pdfjsLib.getDocument({ url }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 0.6 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    await page.render({ canvasContext: ctx, viewport, canvas }).promise
    pages.push(canvas.toDataURL('image/png'))
  }

  cachePagesDocument.set(url, pages)
  return pages
}

// ─── Emplacement de document avec capture/upload multi-images et
// fusion automatique. Utilisé pour les documents uniques ET pour les
// emplacements des couples. Le remplacement d'un document existant
// passe par la même zone de capture (plusieurs pages + fusion). ────

function DocSlotFusion({
  typeDoc,
  label,
  document,
  onUpload,
  uploading,
  compact = false,
}: {
  typeDoc:   string
  label:     string
  document?: DocumentArchive
  onUpload:  (typeDoc: string, file: File) => void | Promise<void>
  uploading: boolean
  compact?:  boolean
}) {
  const done = !!document
  const [pageEnAttente, setPageEnAttente] = useState<File[]>([])
  const [fusion, setFusion] = useState(false)
  const [erreur, setErreur] = useState('')
  // NOUVEAU : mode remplacement — réutilise la zone de capture multi-pages
  const [modeRemplacement, setModeRemplacement] = useState(false)

  const zoneCaptureVisible = !done || modeRemplacement

  const handleAjoutFichiers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setErreur('')
    setPageEnAttente(prev => [...prev, ...files])
    e.target.value = ''
  }

  const retirerPage = (index: number) => {
    setPageEnAttente(prev => prev.filter((_, i) => i !== index))
  }

  const annulerRemplacement = () => {
    setPageEnAttente([])
    setErreur('')
    setModeRemplacement(false)
  }

  const handleEnregistrer = async () => {
    if (pageEnAttente.length === 0) return
    setErreur('')

    // Un seul fichier : on l'envoie tel quel (pas besoin de fusion).
    if (pageEnAttente.length === 1) {
      await onUpload(typeDoc, pageEnAttente[0])
      setPageEnAttente([])
      setModeRemplacement(false)
      return
    }

    // Plusieurs fichiers : fusion possible seulement si ce sont toutes des
    // images (un PDF a déjà potentiellement plusieurs pages en lui-même).
    if (!pageEnAttente.every(estImage)) {
      setErreur("La fusion n'est possible qu'entre plusieurs images. Retirez le PDF ou envoyez-le seul.")
      return
    }

    setFusion(true)
    try {
      const fichierFusionne = await fusionnerImagesEnPDF(pageEnAttente, `${typeDoc}_${Date.now()}.pdf`)
      await onUpload(typeDoc, fichierFusionne)
      setPageEnAttente([])
      setModeRemplacement(false)
    } catch {
      setErreur('Échec de la fusion des images. Réessayez.')
    } finally {
      setFusion(false)
    }
  }

  const enCours = uploading || fusion
  const verbe   = modeRemplacement ? 'remplacer' : 'enregistrer'

  return (
    <Box
      sx={{
        border: done ? '1px solid' : '1px dashed',
        borderColor: modeRemplacement ? 'warning.light' : done ? 'success.light' : 'divider',
        borderRadius: 2,
        p: 1.5,
        bgcolor: done ? 'success.50' : 'background.default',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        height: '100%',
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 500 }} color={done ? 'success.dark' : 'text.primary'}>
        {label}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {done ? (
          <CheckCircleOutlined sx={{ fontSize: 14, color: 'success.main' }} />
        ) : (
          <RadioButtonUncheckedOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
        )}
        <Typography sx={{ fontSize: 11 }} color={done ? 'success.main' : 'text.secondary'}>
          {modeRemplacement ? 'Remplacement en cours' : done ? 'Téléversé' : 'Manquant'}
        </Typography>
      </Box>

      {done && document && (
        <Tooltip title="Voir ce document">
          <Typography
            component="a"
            href={document.fichier_url}
            target="_blank"
            color="primary"
            sx={{ fontSize: 11, textDecoration: 'underline', cursor: 'pointer' }}
          >
            Voir le fichier
          </Typography>
        </Tooltip>
      )}

      {/* Zone de capture/upload — premier envoi OU remplacement */}
      {zoneCaptureVisible && (
        <>
          {pageEnAttente.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 0.5 }}>
              {pageEnAttente.map((f, i) => (
                <Chip
                  key={`${f.name}-${i}`}
                  label={`Page ${i + 1}`}
                  size="small"
                  onDelete={() => retirerPage(i)}
                  sx={{ fontSize: 10, height: 22 }}
                />
              ))}
            </Box>
          )}

          {erreur && <Alert severity="error" sx={{ fontSize: 11, py: 0 }}>{erreur}</Alert>}

          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            <label>
              <input
                type="file"
                hidden
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleAjoutFichiers}
                disabled={enCours}
              />
              <Button
                component="span"
                size="small"
                variant="outlined"
                disabled={enCours}
                startIcon={<PhotoLibraryOutlined sx={{ fontSize: 14 }} />}
                sx={{ fontSize: 11, py: 0.25, px: 1 }}
              >
                {pageEnAttente.length > 0
                  ? 'Ajouter une page'
                  : modeRemplacement ? 'Choisir le(s) nouvelle(s) page(s)' : 'Téléverser / capturer'}
              </Button>
            </label>

            {pageEnAttente.length > 0 && (
              <Button
                size="small"
                variant="contained"
                color={modeRemplacement ? 'warning' : 'primary'}
                disabled={enCours}
                onClick={handleEnregistrer}
                startIcon={
                  enCours
                    ? <CircularProgress size={10} color="inherit" />
                    : pageEnAttente.length > 1
                      ? <MergeTypeOutlined sx={{ fontSize: 14 }} />
                      : <UploadFileOutlined sx={{ fontSize: 14 }} />
                }
                sx={{ fontSize: 11, py: 0.25, px: 1 }}
              >
                {pageEnAttente.length > 1
                  ? `Fusionner ${pageEnAttente.length} pages et ${verbe}`
                  : verbe.charAt(0).toUpperCase() + verbe.slice(1)}
              </Button>
            )}

            {modeRemplacement && (
              <Button
                size="small"
                variant="text"
                disabled={enCours}
                onClick={annulerRemplacement}
                sx={{ fontSize: 11, py: 0.25, px: 1 }}
              >
                Annuler
              </Button>
            )}
          </Box>

          {!compact && pageEnAttente.length === 0 && (
            <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>
              Astuce : sélectionnez plusieurs photos (recto/verso, plusieurs pages) pour les fusionner en un seul document.
            </Typography>
          )}
        </>
      )}

      {/* Bouton d'entrée en mode remplacement */}
      {done && !modeRemplacement && (
        <Button
          size="small"
          variant="text"
          disabled={enCours}
          onClick={() => { setErreur(''); setModeRemplacement(true) }}
          startIcon={enCours ? <CircularProgress size={10} /> : <UploadFileOutlined sx={{ fontSize: 13 }} />}
          sx={{ fontSize: 10, py: 0, px: 0.5, alignSelf: 'flex-start' }}
        >
          Remplacer
        </Button>
      )}
    </Box>
  )
}

// ─── Rangée de documents reliés par des flèches ⇄ ───────────────
// Horizontale sur grand écran, verticale sur mobile. Réutilisée par le
// bloc de saisie ET par la vue dossier.

function CoupleRow({ items }: { items: ReactNode[] }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch', gap: 1 }}>
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled', flexShrink: 0 }}>
              <SwapHorizOutlined sx={{ display: { xs: 'none', md: 'block' } }} />
              <SwapVertOutlined  sx={{ display: { xs: 'block', md: 'none' } }} />
            </Box>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>{item}</Box>
        </Fragment>
      ))}
    </Box>
  )
}

// ─── UN couple = UN bloc. Chaque emplacement téléverse directement
// dans CE bloc (numéro de ligne fixé par le bloc). ─────────────────

function CoupleBlock({
  config,
  numero,
  base,
  docs,
  nouveau,
  onUpload,
  uploadingKey,
}: {
  config:       LigneConfig
  numero:       number                 // numéro affiché (1, 2, 3…)
  base:         number                 // décalage réservé à ce couple
  docs:         DocumentArchive[]
  nouveau:      boolean                // bloc vide en attente d'un premier document
  onUpload:     (typeDoc: string, ligne: number, file: File) => void | Promise<void>
  uploadingKey: string | null
}) {
  const ligneStockee = base + numero
  const complete = ligneEstComplete(docs, config)
  const nbFaits  = config.types.filter(t => docs.some(d => d.type_doc === t)).length

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        p: 1.5,
        mb: 1,
        bgcolor: nouveau ? 'background.paper' : 'grey.50',
        borderStyle: nouveau ? 'dashed' : 'solid',
        borderColor: complete ? 'success.light' : nouveau ? 'primary.light' : 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
          {config.label} #{numero}
        </Typography>
        <Chip
          label={nouveau ? 'Nouveau' : complete ? 'Complet' : `${nbFaits}/${config.types.length}`}
          color={nouveau ? 'default' : complete ? 'success' : 'warning'}
          variant={nouveau ? 'outlined' : 'filled'}
          size="small"
          sx={{ fontSize: 10, height: 20 }}
        />
      </Box>

      <CoupleRow
        items={config.types.map(typeDoc => {
          const doc = docs.find(d => d.type_doc === typeDoc)
          return (
            <DocSlotFusion
              typeDoc={typeDoc}
              label={doc?.type_doc_display ?? libelleType(typeDoc)}
              document={doc}
              onUpload={(td, file) => onUpload(td, ligneStockee, file)}
              uploading={uploadingKey === `${ligneStockee}-${typeDoc}`}
              compact
            />
          )
        })}
      />
    </Card>
  )
}

// ─── Liste de tous les blocs d'un couple pour une journée ────────
// Un bloc vide « Nouveau » est toujours en tête. Dès qu'on y téléverse un
// premier document, il devient l'opération #N et un nouveau bloc vide
// apparaît. Les opérations existantes suivent, du plus récent au plus ancien.

function LigneClientBlock({
  config,
  base,
  parNumero,
  onUpload,
  uploadingKey,
}: {
  config:       LigneConfig
  base:         number
  parNumero:    Map<number, DocumentArchive[]>
  onUpload:     (typeDoc: string, ligne: number, file: File) => void | Promise<void>
  uploadingKey: string | null
}) {
  const [seulementIncompletes, setSeulementIncompletes] = useState(false)
  const [recherche, setRecherche] = useState('')

  const numeros        = Array.from(parNumero.keys()).sort((a, b) => a - b)
  const prochainNumero = (numeros.length > 0 ? numeros[numeros.length - 1] : 0) + 1
  const nbCompletes    = numeros.filter(n => ligneEstComplete(parNumero.get(n) ?? [], config)).length
  const nbIncompletes  = numeros.length - nbCompletes
  const filtreActif    = seulementIncompletes || recherche !== ''

  const numerosExistants = numeros.filter(n => {
    if (recherche && String(n) !== recherche) return false
    if (seulementIncompletes && ligneEstComplete(parNumero.get(n) ?? [], config)) return false
    return true
  })

  // Un seul tableau (bloc vide en tête + opérations) avec le numéro comme clé :
  // un bloc garde son état (pages en attente de fusion) quand il passe de
  // « Nouveau » à « opération enregistrée ».
  const numerosAffiches = [
    ...(filtreActif ? [] : [prochainNumero]),
    ...numerosExistants.slice().reverse(),
  ]

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 1.5 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <PersonOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{config.label}</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
            {numeros.length} opération{numeros.length !== 1 ? 's' : ''}
            {numeros.length > 0 && ` : ${nbCompletes} complète${nbCompletes !== 1 ? 's' : ''}, ${nbIncompletes} incomplète${nbIncompletes !== 1 ? 's' : ''}`}
          </Typography>
        </Box>

        {numeros.length >= 4 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              placeholder="N°"
              value={recherche}
              onChange={e => setRecherche(e.target.value.replace(/[^0-9]/g, ''))}
              sx={{ width: 80 }}
            />
            <Chip
              label="Incomplètes seulement"
              size="small"
              color={seulementIncompletes ? 'warning' : 'default'}
              variant={seulementIncompletes ? 'filled' : 'outlined'}
              onClick={() => setSeulementIncompletes(v => !v)}
            />
          </Box>
        )}
      </Box>

      {numerosAffiches.map(numero => (
        <CoupleBlock
          key={numero}
          config={config}
          numero={numero}
          base={base}
          docs={parNumero.get(numero) ?? []}
          nouveau={!parNumero.has(numero)}
          onUpload={onUpload}
          uploadingKey={uploadingKey}
        />
      ))}

      {filtreActif && numerosAffiches.length === 0 && (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
          Aucune opération ne correspond à ce filtre.
        </Typography>
      )}
    </Box>
  )
}

// ─── Section "couples" d'une archive ────────────────────────────

function LignesClientsSection({
  archive,
  onUpload,
  uploadingKey,
}: {
  archive: Archive
  onUpload: (typeDoc: string, ligne: number, file: File) => void | Promise<void>
  uploadingKey: string | null
}) {
  const configs = getLigneConfigs(archive.produit_nom)
  if (configs.length === 0) return null

  return (
    <>
      {configs.map((config, index) => (
        <LigneClientBlock
          key={`${config.label}-${index}`}
          config={config}
          base={index * ECART_ENTRE_COUPLES}
          parNumero={regrouperParCouple(archive, index, config)}
          onUpload={onUpload}
          uploadingKey={uploadingKey}
        />
      ))}
    </>
  )
}

// ─── Vue "dossier" en lecture — consultation d'une archive ──────

// Accordéon explorable (recherche + filtre) pour UN couple de documents.
// Isolé en composant à part car chaque couple gère son propre état de
// recherche/filtre/ouverture, indépendamment des autres couples du produit.
function DossierCoupleSection({
  config,
  parNumero,
}: {
  config:    LigneConfig
  parNumero: Map<number, DocumentArchive[]>
}) {
  const [filtre, setFiltre] = useState<'toutes' | 'incompletes'>('toutes')
  const [recherche, setRecherche] = useState('')
  const [numeroOuvert, setNumeroOuvert] = useState<number | null>(null)

  const tousLesNumeros = Array.from(parNumero.keys()).sort((a, b) => a - b)
  const numerosAffiches = tousLesNumeros.filter(numero => {
    if (recherche && String(numero) !== recherche.trim()) return false
    if (filtre === 'incompletes' && ligneEstComplete(parNumero.get(numero) ?? [], config)) return false
    return true
  })
  const nbCompletes = tousLesNumeros.filter(n => ligneEstComplete(parNumero.get(n) ?? [], config)).length

  if (tousLesNumeros.length === 0) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, letterSpacing: '0.05em', mb: 1 }}>
          {config.label.toUpperCase()}S
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
          Aucune opération « {config.label.toLowerCase()} » saisie pour cette journée.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, letterSpacing: '0.05em' }}>
          {config.label.toUpperCase()}S — {nbCompletes}/{tousLesNumeros.length} complètes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="N°"
            value={recherche}
            onChange={e => setRecherche(e.target.value.replace(/[^0-9]/g, ''))}
            sx={{ width: 90 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select value={filtre} onChange={e => setFiltre(e.target.value as 'toutes' | 'incompletes')}>
              <MenuItem value="toutes">Toutes les lignes</MenuItem>
              <MenuItem value="incompletes">Incomplètes seulement</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {numerosAffiches.length === 0 && (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
          Aucune ligne ne correspond à ce filtre.
        </Typography>
      )}

      {numerosAffiches.map(numero => {
        const docs = parNumero.get(numero) ?? []
        const complete = ligneEstComplete(docs, config)
        return (
          <Accordion
            key={numero}
            variant="outlined"
            expanded={numeroOuvert === numero}
            onChange={() => setNumeroOuvert(prev => (prev === numero ? null : numero))}
            sx={{ borderRadius: 1.5, mb: 0.75, '&:before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                  {config.label} #{numero}
                </Typography>
                <Chip
                  label={complete ? 'Complet' : `${docs.length}/${config.types.length}`}
                  size="small"
                  color={complete ? 'success' : 'warning'}
                  sx={{ fontSize: 10, height: 20, ml: 'auto' }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
              <CoupleRow
                items={config.types.map(typeDoc => {
                  const doc = docs.find(d => d.type_doc === typeDoc)
                  return (
                    <Box>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.5 }}>
                        {doc?.type_doc_display ?? libelleType(typeDoc)}
                      </Typography>
                      <FilePreview url={doc?.fichier_url} height={150} />
                    </Box>
                  )
                })}
              />
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Box>
  )
}

function DossierViewModal({
  open,
  archive,
  onClose,
}: {
  open:    boolean
  archive: Archive | null
  onClose: () => void
}) {
  if (!archive) return null

  const configs = getLigneConfigs(archive.produit_nom)
  const typesUniques = getTypesUniques(archive)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
            Dossier — {archive.agence_nom} ({archive.agence_code})
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {archive.produit_nom} · {new Date(archive.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseOutlined /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Documents généraux du jour */}
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, letterSpacing: '0.05em', mb: 1 }}>
          DOCUMENTS DU JOUR
        </Typography>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {typesUniques.map(({ value, label }) => {
            const doc = archive.documents.find(d => d.type_doc === value)
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={value}>
                <Typography sx={{ fontSize: 12, fontWeight: 500, mb: 0.5 }}>{label}</Typography>
                <FilePreview url={doc?.fichier_url} height={180} />
              </Grid>
            )
          })}
        </Grid>

        {/* Un accordéon indépendant par couple de documents (ex : Souscription, puis Réclamation) */}
        {configs.map((config, index) => (
          <DossierCoupleSection
            key={`${config.label}-${index}`}
            config={config}
            parNumero={regrouperParCouple(archive, index, config)}
          />
        ))}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── "Afficher les couples" — décomposition page par page ──────
// Contrairement à DossierViewModal (un aperçu par document), cette vue
// décompose chaque document en ses pages. Pour une opération donnée, les
// documents du couple (reçu, bordereau, pièce…) sont affichés CÔTE À CÔTE
// en colonnes horizontales reliées par ⇄ ; chaque colonne fait défiler ses
// pages horizontalement. Un document d'une seule page (photo simple)
// affiche une seule vignette ; un document fusionné à partir de plusieurs
// photos affiche autant de vignettes que de pages.

// Une colonne = un type de document du couple, avec ses pages en
// défilement horizontal.
function DocumentPagesLane({
  label,
  document,
}: {
  label:     string
  document?: DocumentArchive
}) {
  const [pages, setPages]           = useState<string[] | null>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur]         = useState('')

  useEffect(() => {
    let annule = false
    setPages(null)
    setErreur('')
    if (!document?.fichier_url) return

    setChargement(true)
    extrairePagesDocument(document.fichier_url)
      .then(p => { if (!annule) setPages(p) })
      .catch(() => { if (!annule) setErreur('Décomposition impossible.') })
      .finally(() => { if (!annule) setChargement(false) })

    return () => { annule = true }
  }, [document?.fichier_url])

  return (
    <Box
      sx={{
        flex: '1 0 240px',
        minWidth: 240,
        border: '1px solid',
        borderColor: document ? 'divider' : 'warning.light',
        borderStyle: document ? 'solid' : 'dashed',
        borderRadius: 2,
        p: 1.25,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        bgcolor: 'background.paper',
      }}
    >
      {/* En-tête de colonne */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{label}</Typography>
        {document ? (
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
            {pages
              ? `${pages.length} page${pages.length !== 1 ? 's' : ''}`
              : chargement ? 'Chargement…' : ''}
          </Typography>
        ) : (
          <Chip label="Manquant" size="small" color="warning" variant="outlined" sx={{ fontSize: 9, height: 16 }} />
        )}
      </Box>

      {/* Pages en défilement horizontal */}
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, minHeight: 150 }}>
        {!document && (
          <Box
            sx={{
              width: 110, height: 150, flexShrink: 0, borderRadius: 1.5,
              border: '1px dashed', borderColor: 'divider',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>—</Typography>
          </Box>
        )}

        {document && chargement && (
          <Box sx={{ width: 110, height: 150, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={18} />
          </Box>
        )}

        {document && erreur && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%' }}>
            <FilePreview url={document.fichier_url} height={150} />
            <Typography sx={{ fontSize: 11, color: 'error.main' }}>
              {erreur} Vérifiez la configuration CORS du stockage.
            </Typography>
            <Typography component="a" href={document.fichier_url} target="_blank" color="primary" sx={{ fontSize: 11, textDecoration: 'underline' }}>
              Ouvrir le fichier
            </Typography>
          </Box>
        )}

        {pages && pages.length === 0 && !erreur && (
          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontStyle: 'italic' }}>
            Format non pris en charge pour l'aperçu.
          </Typography>
        )}

        {pages && pages.map((src, i) => (
          <Box
            key={i}
            component="a"
            href={document!.fichier_url}
            target="_blank"
            sx={{
              width: 110, height: 150, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden',
              border: '1px solid', borderColor: 'divider', bgcolor: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            }}
          >
            <img src={src} alt={`${label} — page ${i + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            {pages.length > 1 && (
              <Chip
                label={i + 1}
                size="small"
                sx={{
                  position: 'absolute', bottom: 3, right: 3, fontSize: 9, height: 16,
                  bgcolor: 'rgba(0,0,0,0.65)', color: 'white',
                }}
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// Une opération = les documents du couple côte à côte (Reçu ⇄ Bordereau ⇄ Pièce),
// avec défilement horizontal si l'écran est trop étroit.
function CoupleOperationLignes({
  config,
  docs,
}: {
  config: LigneConfig
  docs:   DocumentArchive[]
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 1, overflowX: 'auto', pb: 1 }}>
      {config.types.map((typeDoc, i) => {
        const doc = docs.find(d => d.type_doc === typeDoc)
        return (
          <Fragment key={typeDoc}>
            {i > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.disabled', flexShrink: 0 }}>
                <SwapHorizOutlined />
              </Box>
            )}
            <DocumentPagesLane label={doc?.type_doc_display ?? libelleType(typeDoc)} document={doc} />
          </Fragment>
        )
      })}
    </Box>
  )
}

// Un couple = un accordéon par opération (#1, #2, … #15, quel que soit le
// nombre). La décomposition en pages n'est lancée que pour l'opération
// dépliée, pour ne pas décomposer 15 × 3 documents d'un coup.
function CouplesCoupleSection({
  config,
  parNumero,
}: {
  config:    LigneConfig
  parNumero: Map<number, DocumentArchive[]>
}) {
  const [filtre, setFiltre] = useState<'toutes' | 'incompletes'>('toutes')
  const [recherche, setRecherche] = useState('')
  const [numeroOuvert, setNumeroOuvert] = useState<number | null>(null)

  const tousLesNumeros = Array.from(parNumero.keys()).sort((a, b) => a - b)
  const numerosAffiches = tousLesNumeros.filter(numero => {
    if (recherche && String(numero) !== recherche.trim()) return false
    if (filtre === 'incompletes' && ligneEstComplete(parNumero.get(numero) ?? [], config)) return false
    return true
  })
  const nbCompletes = tousLesNumeros.filter(n => ligneEstComplete(parNumero.get(n) ?? [], config)).length

  if (tousLesNumeros.length === 0) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, letterSpacing: '0.05em', mb: 1 }}>
          {config.label.toUpperCase()}S
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
          Aucune opération « {config.label.toLowerCase()} » saisie pour cette journée.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, letterSpacing: '0.05em' }}>
          {config.label.toUpperCase()}S — {nbCompletes}/{tousLesNumeros.length} complètes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="N°"
            value={recherche}
            onChange={e => setRecherche(e.target.value.replace(/[^0-9]/g, ''))}
            sx={{ width: 90 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select value={filtre} onChange={e => setFiltre(e.target.value as 'toutes' | 'incompletes')}>
              <MenuItem value="toutes">Toutes les lignes</MenuItem>
              <MenuItem value="incompletes">Incomplètes seulement</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {numerosAffiches.length === 0 && (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
          Aucune ligne ne correspond à ce filtre.
        </Typography>
      )}

      {numerosAffiches.map(numero => {
        const docs = parNumero.get(numero) ?? []
        const complete = ligneEstComplete(docs, config)
        const estOuvert = numeroOuvert === numero
        return (
          <Accordion
            key={numero}
            variant="outlined"
            expanded={estOuvert}
            onChange={() => setNumeroOuvert(prev => (prev === numero ? null : numero))}
            sx={{ borderRadius: 1.5, mb: 0.75, '&:before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                  {config.label} #{numero}
                </Typography>
                <Chip
                  label={complete ? 'Complet' : `${docs.length}/${config.types.length}`}
                  size="small"
                  color={complete ? 'success' : 'warning'}
                  sx={{ fontSize: 10, height: 20, ml: 'auto' }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
              {/* Rendu seulement quand ouvert : on ne décompose pas 15 opérations d'un coup */}
              {estOuvert && <CoupleOperationLignes config={config} docs={docs} />}
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Box>
  )
}

function CouplesViewModal({
  open,
  archive,
  onClose,
}: {
  open:    boolean
  archive: Archive | null
  onClose: () => void
}) {
  if (!archive) return null

  const configs = getLigneConfigs(archive.produit_nom)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
            Couples — {archive.agence_nom} ({archive.agence_code})
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {archive.produit_nom} · {new Date(archive.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseOutlined /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {configs.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
            Ce produit n'a pas de couples de documents à décomposer.
          </Typography>
        ) : (
          configs.map((config, index) => (
            <CouplesCoupleSection
              key={`${config.label}-${index}`}
              config={config}
              parNumero={regrouperParCouple(archive, index, config)}
            />
          ))
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Modal Laboratoire — comparaison matin/soir du même jour ────

function LaboratoireJourModal({
  open,
  archive,
  onClose,
  onRemplace,
}: {
  open:      boolean
  archive:   Archive | null
  onClose:   () => void
  onRemplace: (archiveId: number, docId: number, file: File) => Promise<void>
}) {
  const [remplacant, setRemplacant] = useState<string | null>(null)

  if (!archive) return null

  const docMatin = archive.documents.find(d => d.type_doc === 'arrete_matin')
  const docSoir  = archive.documents.find(d => d.type_doc === 'arrete_soir')

  const handleChange = async (docId: number | undefined, typeDoc: string, file: File) => {
    if (!docId) return
    setRemplacant(typeDoc)
    await onRemplace(archive.id, docId, file)
    setRemplacant(null)
  }

  const renderSlot = (label: string, doc: DocumentArchive | undefined, typeDoc: string) => (
    <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5 }}>{label}</Typography>
      {doc ? (
        <>
          <FilePreview url={doc.fichier_url} />
          <Typography
            component="a"
            href={doc.fichier_url}
            target="_blank"
            color="primary"
            sx={{ fontSize: 11, textDecoration: 'underline', display: 'block', mt: 1, mb: 1.5 }}
          >
            Ouvrir en plein écran
          </Typography>
          <label>
            <input
              type="file"
              hidden
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleChange(doc.id, typeDoc, file)
                e.target.value = ''
              }}
              disabled={remplacant === typeDoc}
            />
            <Button
              component="span"
              size="small"
              variant="outlined"
              fullWidth
              disabled={remplacant === typeDoc}
              startIcon={
                remplacant === typeDoc
                  ? <CircularProgress size={12} />
                  : <UploadFileOutlined sx={{ fontSize: 14 }} />
              }
            >
              Remplacer
            </Button>
          </label>
        </>
      ) : (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          Aucun document téléversé pour ce créneau
        </Typography>
      )}
    </Box>
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
          Laboratoire — {new Date(archive.date).toLocaleDateString('fr-FR')}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseOutlined /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 2 }}>
          Comparez les arrêtés matin et soir de cette journée. En cas d'incohérence, remplacez le fichier concerné.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          {renderSlot('Arrêté matin', docMatin, 'arrete_matin')}
          {renderSlot('Arrêté soir',  docSoir,  'arrete_soir')}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Ligne d'une archive ──────────────────────────────────────

function ArchiveRow({
  archive,
  onUpload,
  onUploadLigne,
  onDownloadZip,
  onOuvrirLaboratoire,
  onOuvrirDossier,
  onOuvrirCouples,
}: {
  archive:        Archive
  onUpload:       (archiveId: number, typeDoc: string, file: File) => void | Promise<void>
  onUploadLigne:  (archiveId: number, typeDoc: string, ligne: number, file: File) => void | Promise<void>
  onDownloadZip:  (archive: Archive) => void
  onOuvrirLaboratoire:  (archive: Archive) => void
  onOuvrirDossier: (archive: Archive) => void
  onOuvrirCouples: (archive: Archive) => void
}) {
  const [open, setOpen]           = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  const statut = getStatut(archive)
  const typesUniques = getTypesUniques(archive)

  const handleUpload = async (typeDoc: string, file: File) => {
    setUploading(typeDoc)
    await onUpload(archive.id, typeDoc, file)
    setUploading(null)
  }

  const handleUploadLigne = async (typeDoc: string, ligne: number, file: File) => {
    const key = `${ligne}-${typeDoc}`
    setUploading(key)
    await onUploadLigne(archive.id, typeDoc, ligne, file)
    setUploading(null)
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mb: 1 }}>
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: '10px 16px',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
          {new Date(archive.date).toLocaleDateString('fr-FR', {
            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
          })}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={statut.label}
            color={statut.color}
            size="small"
            sx={{ fontSize: 11, height: 22 }}
          />
          <Tooltip title="Consulter le dossier">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onOuvrirDossier(archive) }}
            >
              <FolderOpenOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {getLigneConfigs(archive.produit_nom).length > 0 && (
            <Tooltip title="Afficher les couples">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onOuvrirCouples(archive) }}
              >
                <TableRowsOutlined sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Ouvrir laboratoire (comparer matin/soir)">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onOuvrirLaboratoire(archive) }}
            >
              <ScienceOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Télécharger ZIP">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onDownloadZip(archive) }}
            >
              <DownloadOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {open ? (
            <ExpandLessOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
          ) : (
            <ExpandMoreOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
          )}
        </Box>
      </Box>

      {statut.color !== 'success' && (
        <LinearProgress
          variant="determinate"
          value={statut.total > 0 ? Math.round((statut.done / statut.total) * 100) : 0}
          color={statut.color === 'error' ? 'error' : 'warning'}
          sx={{ height: 2 }}
        />
      )}

      <Collapse in={open} unmountOnExit>
        <CardContent sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
          <Typography
            sx={{ fontSize: 11, color: 'text.secondary', mb: 1, fontWeight: 500, letterSpacing: '0.05em' }}
          >
            Documents du jour
          </Typography>
          <Grid container spacing={1}>
            {typesUniques.map(({ value, label }) => {
              const doc = archive.documents.find(d => d.type_doc === value)
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={value}>
                  <DocSlotFusion
                    typeDoc={value}
                    label={label}
                    document={doc}
                    onUpload={handleUpload}
                    uploading={uploading === value}
                  />
                </Grid>
              )
            })}
          </Grid>

          <LignesClientsSection
            archive={archive}
            onUpload={handleUploadLigne}
            uploadingKey={uploading}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
            <Button
              size="small"
              startIcon={<DownloadOutlined />}
              onClick={() => onDownloadZip(archive)}
            >
              Télécharger ZIP
            </Button>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  )
}

// ─── Bloc agence ──────────────────────────────────────────────

function AgenceBloc({
  agence,
  onUpload,
  onUploadLigne,
  onDownloadZip,
  onOuvrirLaboratoire,
  onOuvrirDossier,
  onOuvrirCouples,
}: {
  agence:              AgenceGroupe
  onUpload:            (archiveId: number, typeDoc: string, file: File) => void | Promise<void>
  onUploadLigne:       (archiveId: number, typeDoc: string, ligne: number, file: File) => void | Promise<void>
  onDownloadZip:       (archive: Archive) => void
  onOuvrirLaboratoire: (archive: Archive) => void
  onOuvrirDossier:     (archive: Archive) => void
  onOuvrirCouples:     (archive: Archive) => void
}) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <ApartmentOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
          {agence.agenceNom}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          ({agence.agenceCode})
        </Typography>
        <Chip
          label={`${agence.archives.length} archive${agence.archives.length !== 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 10, height: 20, ml: 0.5 }}
        />
      </Box>

      <Box sx={{ pl: { xs: 0, sm: 3 } }}>
        {agence.archives.map(archive => (
          <ArchiveRow
            key={archive.id}
            archive={archive}
            onUpload={onUpload}
            onUploadLigne={onUploadLigne}
            onDownloadZip={onDownloadZip}
            onOuvrirLaboratoire={onOuvrirLaboratoire}
            onOuvrirDossier={onOuvrirDossier}
            onOuvrirCouples={onOuvrirCouples}
          />
        ))}
      </Box>
    </Box>
  )
}

// ─── Section accordéon par produit ────────────────────────────

function ProduitAccordeon({
  groupe,
  onUpload,
  onUploadLigne,
  onDownloadZip,
  onOuvrirLaboratoire,
  onOuvrirDossier,
  onOuvrirCouples,
}: {
  groupe:        ProduitGroupe
  onUpload:      (archiveId: number, typeDoc: string, file: File) => void | Promise<void>
  onUploadLigne: (archiveId: number, typeDoc: string, ligne: number, file: File) => void | Promise<void>
  onDownloadZip: (archive: Archive) => void
  onOuvrirLaboratoire: (archive: Archive) => void
  onOuvrirDossier: (archive: Archive) => void
  onOuvrirCouples: (archive: Archive) => void
}) {
  const style = getProduitStyle(groupe.produitNom)

  return (
    <Accordion
      variant="outlined"
      defaultExpanded
      sx={{ borderRadius: 2, mb: 1.5, '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', flexWrap: 'wrap' }}>
          <Chip
            label={groupe.produitNom}
            size="small"
            sx={{
              bgcolor: style.bg,
              color:   style.color,
              fontWeight: 600,
              fontSize: 12,
              height: 26,
            }}
          />
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {groupe.agences.length} agence{groupe.agences.length !== 1 ? 's' : ''}
            {' · '}
            {groupe.totalArchives} archive{groupe.totalArchives !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
        {groupe.agences.map(agence => (
          <AgenceBloc
            key={agence.agenceId}
            agence={agence}
            onUpload={onUpload}
            onUploadLigne={onUploadLigne}
            onDownloadZip={onDownloadZip}
            onOuvrirLaboratoire={onOuvrirLaboratoire}
            onOuvrirDossier={onOuvrirDossier}
            onOuvrirCouples={onOuvrirCouples}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  )
}

// ─── Modal nouvelle archive ────────────────────────────────────

function NouvelleArchiveModal({
  open,
  agences,
  produits,
  onClose,
  onCreate,
}: {
  open:     boolean
  agences:  Agence[]
  produits: Produit[]
  onClose:  () => void
  onCreate: (data: { agence: number; produit: number; date: string }) => Promise<void>
}) {
  const [agenceId,  setAgenceId]  = useState<number | ''>('')
  const [produitId, setProduitId] = useState<number | ''>('')
  const [date,      setDate]      = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const produitNom = produits.find(p => p.id === produitId)?.nom ?? ''

  const TYPES_PREVIEW: Record<string, string[]> = {
    western_union: ['Réconciliation','API','Arrêté de caisse (matin)','Arrêté de caisse (soir)','Journal de transaction','+ 1 bloc par client (reçu, bordereau, pièce)'],
    change:        ['Mouvement de caisse','Arrêté de caisse (matin)','Arrêté de caisse (soir)','Journal de transaction','+ 1 bloc par client (reçu, pièce, justificatif)'],
    visa:          ['Arrêté (matin)','Arrêté (soir)','Bordereau','+ 1 bloc par souscription (fiche souscription, pièce)','+ 1 bloc par réclamation (fiche réclamation, pièce)'],
    momo:          ['Arrêté de caisse (matin)','Arrêté de caisse (soir)'],
    airtel_money:  ['Arrêté (matin)','Arrêté (soir)'],
  }

  const handleSubmit = async () => {
    if (!agenceId || !produitId || !date) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onCreate({ agence: agenceId as number, produit: produitId as number, date })
      setAgenceId(''); setProduitId(''); setDate('')
      onClose()
    } catch (err: any) {
      const dataErr    = err?.response?.data
      const messageErr = typeof dataErr === 'string' ? dataErr : JSON.stringify(dataErr ?? {})

      if (err?.response?.status === 403 || messageErr.toLowerCase().includes('classeur') || messageErr.toLowerCase().includes('verrou')) {
        setError('Ce mois est clôturé (classeur verrouillé). Veuillez déverrouiller le classeur mensuel correspondant.')
      } else {
        setError('Erreur lors de la création. Veuillez réessayer.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 16, fontWeight: 500 }}>Nouvelle archive</Typography>
        <IconButton size="small" onClick={onClose}><CloseOutlined /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <FormControl fullWidth size="small">
          <InputLabel>Agence</InputLabel>
          <Select
            value={agenceId}
            label="Agence"
            onChange={e => setAgenceId(e.target.value as number)}
          >
            {agences.map(a => (
              <MenuItem key={a.id} value={a.id}>{a.nom} ({a.code})</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Produit</InputLabel>
          <Select
            value={produitId}
            label="Produit"
            onChange={e => setProduitId(e.target.value as number)}
          >
            {produits.filter(p => p.is_active).map(p => (
              <MenuItem key={p.id} value={p.id}>{p.nom_display}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <DatePicker
          label="Date"
          value={strToDayjs(date)}
          onChange={(v) => setDate(dayjsToStr(v))}
          format="DD/MM/YYYY"
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />

        {produitNom && TYPES_PREVIEW[produitNom] && (
          <Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.75 }}>
              Documents requis pour ce produit
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {TYPES_PREVIEW[produitNom].map(label => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <RadioButtonUncheckedOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Créer l'archive
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Modal Laboratoire — comparaison entre deux dates ───────────

interface ComparaisonResult {
  archive_id:   number
  date:         string
  arrete_matin: DocumentArchive | null
  arrete_soir:  DocumentArchive | null
}

function LaboratoireComparaisonModal({
  open,
  agences,
  produits,
  onClose,
  onComparer,
  onRemplace,
}: {
  open:       boolean
  agences:    Agence[]
  produits:   Produit[]
  onClose:    () => void
  onComparer: (params: { agence_id: number; produit_id: number; date1: string; date2: string }) =>
                Promise<{ date1: ComparaisonResult | null; date2: ComparaisonResult | null }>
  onRemplace: (archiveId: number, docId: number, file: File) => Promise<void>
}) {
  const [agenceId,  setAgenceId]  = useState<number | ''>('')
  const [produitId, setProduitId] = useState<number | ''>('')
  const [date1,     setDate1]     = useState('')
  const [date2,     setDate2]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [resultat,  setResultat]  = useState<{ date1: ComparaisonResult | null; date2: ComparaisonResult | null } | null>(null)
  const [remplacant, setRemplacant] = useState<string | null>(null)

  const reset = () => {
    setAgenceId(''); setProduitId(''); setDate1(''); setDate2('')
    setResultat(null); setError('')
  }

  const handleFermer = () => { reset(); onClose() }

  const handleComparer = async () => {
    if (!agenceId || !produitId || !date1 || !date2) {
      setError('Agence, produit et les deux dates sont obligatoires.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await onComparer({
        agence_id: agenceId as number,
        produit_id: produitId as number,
        date1, date2,
      })
      setResultat(res)
    } catch {
      setError('Erreur lors de la comparaison.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemplace = async (
    archiveId: number | undefined,
    docId: number | undefined,
    slotKey: string,
    file: File
  ) => {
    if (!archiveId || !docId) return
    setRemplacant(slotKey)
    await onRemplace(archiveId, docId, file)
    setRemplacant(null)
    if (agenceId && produitId && date1 && date2) {
      const res = await onComparer({ agence_id: agenceId as number, produit_id: produitId as number, date1, date2 })
      setResultat(res)
    }
  }

  const renderColonne = (label: string, data: ComparaisonResult | null, slotPrefix: string) => (
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>{label}</Typography>
      {!data ? (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Aucune archive pour cette date</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {(['arrete_matin', 'arrete_soir'] as const).map((champ) => {
            const doc = data[champ]
            const slotKey = `${slotPrefix}-${champ}`
            return (
              <Box key={champ} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 500, mb: 1 }}>
                  {champ === 'arrete_matin' ? 'Arrêté matin' : 'Arrêté soir'}
                </Typography>
                {doc ? (
                  <>
                    <FilePreview url={doc.fichier_url} height={200} />
                    <Typography
                      component="a" href={doc.fichier_url} target="_blank" color="primary"
                      sx={{ fontSize: 11, textDecoration: 'underline', display: 'block', mt: 1, mb: 1 }}
                    >
                      Ouvrir en plein écran
                    </Typography>
                    <label>
                      <input
                        type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleRemplace(data.archive_id, doc.id, slotKey, file)
                          e.target.value = ''
                        }}
                        disabled={remplacant === slotKey}
                      />
                      <Button
                        component="span" size="small" variant="outlined" fullWidth
                        disabled={remplacant === slotKey}
                        startIcon={remplacant === slotKey ? <CircularProgress size={12} /> : <UploadFileOutlined sx={{ fontSize: 13 }} />}
                        sx={{ fontSize: 11 }}
                      >
                        Remplacer
                      </Button>
                    </label>
                  </>
                ) : (
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Manquant</Typography>
                )}
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )

  return (
    <Dialog open={open} onClose={handleFermer} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 16, fontWeight: 500 }}>Laboratoire — Comparaison entre deux dates</Typography>
        <IconButton size="small" onClick={handleFermer}><CloseOutlined /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={1.5} sx={{ mb: resultat ? 3 : 0 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Agence</InputLabel>
              <Select value={agenceId} label="Agence" onChange={e => setAgenceId(e.target.value as number)}>
                {agences.map(a => <MenuItem key={a.id} value={a.id}>{a.nom} ({a.code})</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Produit</InputLabel>
              <Select value={produitId} label="Produit" onChange={e => setProduitId(e.target.value as number)}>
                {produits.map(p => <MenuItem key={p.id} value={p.id}>{p.nom_display}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DatePicker
              label="Date 1"
              value={strToDayjs(date1)}
              onChange={(v) => setDate1(dayjsToStr(v))}
              format="DD/MM/YYYY"
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DatePicker
              label="Date 2"
              value={strToDayjs(date2)}
              onChange={(v) => setDate2(dayjsToStr(v))}
              format="DD/MM/YYYY"
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
        </Grid>

        {resultat && (
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            {renderColonne(new Date(date1).toLocaleDateString('fr-FR'), resultat.date1, 'd1')}
            {renderColonne(new Date(date2).toLocaleDateString('fr-FR'), resultat.date2, 'd2')}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleFermer}>Fermer</Button>
        <Button
          variant="contained"
          onClick={handleComparer}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <ScienceOutlined />}
        >
          Comparer
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Page principale ─────────────────────────────────────────────

function MouvementsAgencesContent() {
  const searchParams = useSearchParams()

  const [archives,     setArchives]     = useState<Archive[]>([])
  const [agences,      setAgences]      = useState<Agence[]>([])
  const [produits,     setProduits]     = useState<Produit[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [modalOpen,    setModalOpen]    = useState(false)

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [villes,      setVilles]      = useState<Ville[]>([])
  const estConformitePrincipale =
    currentUser?.role === 'conformite' && !currentUser?.ville

  const [contexteClasseur, setContexteClasseur] = useState<string | null>(null)

  // Filtres
  const [filtreAgence,  setFiltreAgence]  = useState('')
  const [filtreProduit, setFiltreProduit] = useState('')
  const [filtreStatut,  setFiltreStatut]  = useState('')
  const [filtreDebut,   setFiltreDebut]   = useState('')
  const [filtreFin,     setFiltreFin]     = useState('')
  const [filtreVille,   setFiltreVille]   = useState('')

  const [labJourOpen,    setLabJourOpen]    = useState(false)
  const [labJourArchive, setLabJourArchive] = useState<Archive | null>(null)

  const [labComparaisonOpen, setLabComparaisonOpen] = useState(false)

  // Modal "consulter le dossier"
  const [dossierOpen,    setDossierOpen]    = useState(false)
  const [dossierArchive, setDossierArchive] = useState<Archive | null>(null)

  // Modal "Afficher les couples"
  const [couplesOpen,    setCouplesOpen]    = useState(false)
  const [couplesArchive, setCouplesArchive] = useState<Archive | null>(null)

  // ── Chargement initial ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [archRes, agRes, prRes, meRes] = await Promise.all([
          archiveAgenceAPI.liste(),
          agenceAPI.liste(),
          produitAPI.liste(),
          userAPI.me(),
        ])
        setArchives(archRes.data.results ?? archRes.data)
        setAgences(agRes.data.results   ?? agRes.data)
        setProduits(prRes.data.results  ?? prRes.data)
        setCurrentUser(meRes.data)

        if (meRes.data?.role === 'conformite' && !meRes.data?.ville) {
          const villesRes = await villeAPI.liste()
          setVilles(villesRes.data.results ?? villesRes.data)
        }
      } catch {
        setError('Impossible de charger les données.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Préremplissage filtres depuis l'URL ─────────────────────
  useEffect(() => {
    const agenceId = searchParams.get('agence_id')
    const dd = searchParams.get('date_debut')
    const df = searchParams.get('date_fin')
    if (agenceId) setFiltreAgence(agenceId)
    if (dd) setFiltreDebut(dd)
    if (df) setFiltreFin(df)

    if (agenceId && dd && agences.length > 0) {
      const ag = agences.find(a => String(a.id) === agenceId)
      if (ag) {
        const moisAnnee = new Date(dd + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        setContexteClasseur(`${ag.code} — ${moisAnnee}`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, agences])

  // ── Filtrage local ───────────────────────────────────────────
  const archivesFiltrees = archives.filter(a => {
    if (filtreAgence  && String(a.agence)  !== filtreAgence)  return false
    if (filtreProduit && String(a.produit) !== filtreProduit) return false
    if (filtreDebut   && a.date < filtreDebut)                return false
    if (filtreFin     && a.date > filtreFin)                  return false
    if (estConformitePrincipale && filtreVille && String(a.agence_ville) !== filtreVille) return false
    if (filtreStatut) {
      const st = getStatut(a)
      if (filtreStatut === 'complet' && st.color !== 'success') return false
      if (filtreStatut === 'partiel' && st.color !== 'warning') return false
      if (filtreStatut === 'vide'    && st.color !== 'error')   return false
    }
    return true
  })

  const groupes = useMemo(
    () => regrouperParProduitEtAgence(archivesFiltrees),
    [archivesFiltrees]
  )

  const handleCreate = async (data: { agence: number; produit: number; date: string }) => {
    const res = await archiveAgenceAPI.creer(data)
    setArchives(prev => [res.data, ...prev])
  }

  // ── Téléverser un document unique (jour) ─────────────────────
  // Si un document de ce type existe déjà (bouton « Remplacer »), on passe
  // par remplacerDocument au lieu de recréer un document. Sinon, le backend
  // rejette le doublon (type_doc, ligne=1).
  const handleUpload = async (archiveId: number, typeDoc: string, file: File) => {
    const existant = archives
      .find(a => a.id === archiveId)
      ?.documents.find(d => d.type_doc === typeDoc && (d.ligne ?? 1) === 1)

    try {
      let res
      if (existant) {
        const fd = new FormData()
        fd.append('fichier', file)
        res = await archiveAgenceAPI.remplacerDocument(archiveId, existant.id, fd)
      } else {
        const formData = new FormData()
        formData.append('type_doc', typeDoc)
        formData.append('fichier',  file)

        const token = localStorage.getItem('access_token')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          formData.append('uploade_par', String(payload.user_id))
        }
        res = await archiveAgenceAPI.uploadDoc(archiveId, formData)
      }

      const docSauvegarde: DocumentArchive = { ...res.data, ligne: res.data.ligne ?? 1 }

      setArchives(prev =>
        prev.map(a =>
          a.id === archiveId
            ? {
                ...a,
                documents: [
                  ...a.documents.filter(d => !(d.type_doc === typeDoc && (d.ligne ?? 1) === 1)),
                  docSauvegarde,
                ],
              }
            : a
        )
      )
    } catch (err: any) {
      console.error('Upload échoué', {
        status: err?.response?.status,
        data:   err?.response?.data,
        message: err?.message,
        typeDoc,
      })
      if (err?.response?.status === 403) {
        setError("Ce classeur mensuel est verrouillé. Déverrouillez-le pour téléverser un document.")
      } else {
        setError(`Erreur lors du téléversement (${detailErreurApi(err)}).`)
      }
    }
  }

  // ── Téléverser un document de couple (opération client) ─────
  // Envoie le numéro de ligne au backend pour distinguer plusieurs
  // documents partageant le même type_doc au sein d'une même archive.
  // Si un document existe déjà à cette ligne pour ce type (bouton
  // « Remplacer »), on passe par remplacerDocument plutôt que de recréer
  // un document, pour éviter un conflit d'unicité côté Django.
  const handleUploadLigne = async (archiveId: number, typeDoc: string, ligne: number, file: File) => {
    const existant = archives
      .find(a => a.id === archiveId)
      ?.documents.find(d => d.type_doc === typeDoc && (d.ligne ?? 1) === ligne)

    try {
      let res
      if (existant) {
        const fd = new FormData()
        fd.append('fichier', file)
        res = await archiveAgenceAPI.remplacerDocument(archiveId, existant.id, fd)
      } else {
        const formData = new FormData()
        formData.append('type_doc', typeDoc)
        formData.append('fichier',  file)
        formData.append('ligne',    String(ligne))

        const token = localStorage.getItem('access_token')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          formData.append('uploade_par', String(payload.user_id))
        }
        res = await archiveAgenceAPI.uploadDoc(archiveId, formData)
      }

      const docSauvegarde: DocumentArchive = { ...res.data, ligne: res.data.ligne ?? ligne }

      setArchives(prev =>
        prev.map(a =>
          a.id === archiveId
            ? {
                ...a,
                documents: [
                  ...a.documents.filter(d => !(d.type_doc === typeDoc && (d.ligne ?? 1) === ligne)),
                  docSauvegarde,
                ],
              }
            : a
        )
      )
    } catch (err: any) {
      console.error('Upload échoué', {
        status: err?.response?.status,
        data:   err?.response?.data,
        message: err?.message,
        typeDoc,
        ligne,
      })
      if (err?.response?.status === 403) {
        setError("Ce classeur mensuel est verrouillé. Déverrouillez-le pour téléverser un document.")
      } else {
        setError(`Erreur lors de l'enregistrement de la ligne (${detailErreurApi(err)}).`)
      }
    }
  }

  const handleDownloadZip = async (archive: Archive) => {
    try {
      const res  = await archiveAgenceAPI.telechargerZip(archive.id)
      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href  = url
      const fileName = `${archive.produit_nom}_${archive.date}.zip`
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      console.error('Échec du téléchargement ZIP')
    }
  }

  const handleOuvrirLaboratoire = (archive: Archive) => {
    setLabJourArchive(archive)
    setLabJourOpen(true)
  }

  const handleOuvrirDossier = (archive: Archive) => {
    setDossierArchive(archive)
    setDossierOpen(true)
  }

  const handleOuvrirCouples = (archive: Archive) => {
    setCouplesArchive(archive)
    setCouplesOpen(true)
  }

  const handleRemplacerDocument = async (archiveId: number, docId: number, file: File) => {
    const formData = new FormData()
    formData.append('fichier', file)
    try {
      const res = await archiveAgenceAPI.remplacerDocument(archiveId, docId, formData)
      setArchives(prev =>
        prev.map(a =>
          a.id === archiveId
            ? { ...a, documents: a.documents.map(d => d.id === docId ? res.data : d) }
            : a
        )
      )
      setLabJourArchive(prev =>
        prev && prev.id === archiveId
          ? { ...prev, documents: prev.documents.map(d => d.id === docId ? res.data : d) }
          : prev
      )
    } catch (err: any) {
      console.error('Remplacement échoué', err.response?.data)
      setError(
        err.response?.status === 403
          ? "Ce classeur mensuel est verrouillé. Déverrouillez-le pour remplacer un document."
          : 'Erreur lors du remplacement du document.'
      )
    }
  }

  const handleComparer = async (params: { agence_id: number; produit_id: number; date1: string; date2: string }) => {
    const res = await archiveAgenceAPI.comparer(params)
    return res.data
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* En-tête */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2.5,
          flexWrap: 'wrap',
          gap: 1.5
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceOutlined sx={{ color: '#185FA5', fontSize: 26 }} />
            <Typography  sx={{ fontSize: 20, fontWeight: 500 }}>
              Mouvements agences
            </Typography>
          </Box>
          {contexteClasseur && (
            <Chip
              label={`Classeur : ${contexteClasseur}`}
              size="small"
              sx={{ mt: 1, bgcolor: '#1e293b', color: 'white', fontWeight: 600 }}
              onDelete={() => setContexteClasseur(null)}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ScienceOutlined />}
            onClick={() => setLabComparaisonOpen(true)}
          >
            Ouvrir laboratoire
          </Button>
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setModalOpen(true)}>
            Nouvelle archive
          </Button>
        </Box>
      </Box>

      {/* Filtres */}
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 2.5 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, md: 2 }} >
              <FormControl fullWidth size="small">
                <InputLabel>Agence</InputLabel>
                <Select
                  value={filtreAgence}
                  label="Agence"
                  onChange={e => setFiltreAgence(e.target.value)}
                >
                  <MenuItem value="">Toutes</MenuItem>
                  {agences.map(a => (
                    <MenuItem key={a.id} value={String(a.id)}>{a.nom}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Produit</InputLabel>
                <Select
                  value={filtreProduit}
                  label="Produit"
                  onChange={e => setFiltreProduit(e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  {produits.map(p => (
                    <MenuItem key={p.id} value={String(p.id)}>{p.nom_display}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <DatePicker
                label="Du"
                value={strToDayjs(filtreDebut)}
                onChange={(v) => setFiltreDebut(dayjsToStr(v))}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <DatePicker
                label="Au"
                value={strToDayjs(filtreFin)}
                onChange={(v) => setFiltreFin(dayjsToStr(v))}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            {estConformitePrincipale && (
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Ville</InputLabel>
                  <Select
                    value={filtreVille}
                    label="Ville"
                    onChange={e => setFiltreVille(e.target.value)}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {villes.map(v => (
                      <MenuItem key={v.id} value={String(v.id)}>
                        {v.nom}{v.pays_nom ? ` (${v.pays_nom})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filtreStatut}
                  label="Statut"
                  onChange={e => setFiltreStatut(e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="complet">Complet</MenuItem>
                  <MenuItem value="partiel">Partiel</MenuItem>
                  <MenuItem value="vide">Vide</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                size="small"
                onClick={() => {
                  setFiltreAgence('')
                  setFiltreProduit('')
                  setFiltreStatut('')
                  setFiltreDebut('')
                  setFiltreFin('')
                  setFiltreVille('')
                  setContexteClasseur(null)
                }}
              >
                Réinitialiser
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Compteur */}
      <Typography sx={{ fontSize: 14, mb: 2, color: 'text.secondary' }}>
        {archivesFiltrees.length} archive{archivesFiltrees.length !== 1 ? 's' : ''}
        {' · '}
        {groupes.length} produit{groupes.length !== 1 ? 's' : ''}
      </Typography>

      {loading && <LinearProgress />}

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {!loading && archivesFiltrees.length === 0 && (
        <Box sx={{textAlign: 'center', py: 6, color: 'text.secondary'}}>
          <FolderOffOutlined sx={{ fontSize: 40, mb: 1.5, opacity: 0.4 }} />
          <Typography sx={{ fontSize: 14 }}>Aucune archive trouvée</Typography>
        </Box>
      )}

      {groupes.map(groupe => (
        <ProduitAccordeon
          key={groupe.produitId}
          groupe={groupe}
          onUpload={handleUpload}
          onUploadLigne={handleUploadLigne}
          onDownloadZip={handleDownloadZip}
          onOuvrirLaboratoire={handleOuvrirLaboratoire}
          onOuvrirDossier={handleOuvrirDossier}
          onOuvrirCouples={handleOuvrirCouples}
        />
      ))}

      <NouvelleArchiveModal
        open={modalOpen}
        agences={agences}
        produits={produits}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />

      <LaboratoireJourModal
        open={labJourOpen}
        archive={labJourArchive}
        onClose={() => { setLabJourOpen(false); setLabJourArchive(null) }}
        onRemplace={handleRemplacerDocument}
      />

      <LaboratoireComparaisonModal
        open={labComparaisonOpen}
        agences={agences}
        produits={produits}
        onClose={() => setLabComparaisonOpen(false)}
        onComparer={handleComparer}
        onRemplace={handleRemplacerDocument}
      />

      <DossierViewModal
        open={dossierOpen}
        archive={dossierArchive}
        onClose={() => { setDossierOpen(false); setDossierArchive(null) }}
      />

      <CouplesViewModal
        open={couplesOpen}
        archive={couplesArchive}
        onClose={() => { setCouplesOpen(false); setCouplesArchive(null) }}
      />

    </Box>
    </LocalizationProvider>
  )
}

export default function MouvementsAgencesPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>}>
      <MouvementsAgencesContent />
    </Suspense>
  )
}