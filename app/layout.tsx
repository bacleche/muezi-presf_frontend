import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MuiProvider from "@/components/providers/MuiProvider";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PRESF Archivis",
  description: "Système d'archivage financier",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <MuiProvider>
          {children}
        </MuiProvider>
      </body>
    </html>
  );
}