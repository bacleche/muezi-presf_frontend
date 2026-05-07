import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Optionnel : Ajoute ceci si tu veux éviter des erreurs lors des appels API cross-origin
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  },
};

export default nextConfig;