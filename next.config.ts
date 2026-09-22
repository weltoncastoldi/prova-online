import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera .next/standalone: é o formato que a Hostinger usa para rodar o app Node.
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
