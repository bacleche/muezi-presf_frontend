import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Variables d'environnement
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  },

  // Autoriser les accès depuis ton IP locale
  allowedDevOrigins: ["192.168.100.52"],
};

export default nextConfig;