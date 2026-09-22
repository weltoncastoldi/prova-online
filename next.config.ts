import type { NextConfig } from "next";

/** Rotas cujo conteúdo depende da hora exata: nunca podem ser servidas de cache. */
const ROTAS_SEMPRE_FRESCAS = ["/", "/p/:slug", "/prova/:caminho*", "/resultado/:caminho*", "/admin/:caminho*"];

const nextConfig: NextConfig = {
  // Gera .next/standalone: é o formato que a Hostinger usa para rodar o app Node.
  output: "standalone",
  poweredByHeader: false,

  experimental: {
    // Não reaproveitar páginas dinâmicas já visitadas ao navegar pelo site.
    // Sem isto, o aluno que abriu a capa antes da hora podia continuar vendo
    // a versão "prova fechada" ao voltar para ela.
    staleTimes: { dynamic: 0, static: 0 },
  },

  async headers() {
    return [
      {
        source: "/:caminho*",
        // Vale para navegador e para qualquer proxy no caminho (a Hostinger
        // põe um na frente da aplicação Node). Os arquivos de /_next/static
        // não passam por aqui e seguem com cache normal.
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
        missing: [{ type: "header", key: "next-router-prefetch" }],
      },
      ...ROTAS_SEMPRE_FRESCAS.map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          { key: "CDN-Cache-Control", value: "no-store" },
        ],
      })),
    ];
  },
};

export default nextConfig;
