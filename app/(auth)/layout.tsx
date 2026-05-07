"use client"

import { SnackbarProvider } from 'notistack'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>
            <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                {children}
            </SnackbarProvider>
        </>
}



