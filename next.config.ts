import type { NextConfig } from "next";

// const localIP = process.env.LOCAL_IP || "192.168.100.244";


const nextConfig: NextConfig = {
  reactCompiler: true,

  allowedDevOrigins: [
    "192.168.100.52",
    // "192.168.100.216",
    "localhost",
  ],
};

export default nextConfig;