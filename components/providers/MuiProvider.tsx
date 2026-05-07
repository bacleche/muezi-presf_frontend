'use client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { frFR } from '@mui/material/locale'
import { useServerInsertedHTML } from 'next/navigation'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { useState } from 'react'

const theme = createTheme({
  palette: {
    primary:    { main: process.env.NEXT_PUBLIC_APP_COLOR || '#1565C0', light: '#42A5F5', dark: '#0D47A1' },
    secondary:  { main: '#FF6F00' },
    success:    { main: '#2E7D32' },
    error:      { main: '#C62828' },
    warning:    { main: '#F57F17' },
    background: { default: '#F4F6F9', paper: '#FFFFFF' },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 } } },
    MuiCard:   { styleOverrides: { root: { borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' } } },
    MuiChip:   { styleOverrides: { root: { fontWeight: 600 } } },
  },
}, frFR)

export default function MuiProvider({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => {
    const c = createCache({ key: 'css' })
    c.compat = true
    return c
  })

  useServerInsertedHTML(() => {
    const names = Object.keys(cache.inserted)
    if (!names.length) return null
    let styles = ''
    for (const name of names) {
      if (cache.inserted[name] !== true) styles += cache.inserted[name]
    }
    return (
      <style
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    )
  })

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  )
}