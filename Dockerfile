# ---- base ----------------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- dev: usado pelo docker-compose no localhost -------------------------
FROM base AS dev
# node_modules vive num volume anônimo (ver docker-compose) porque o binário
# SWC do Next é específico de plataforma e não pode vir do Windows.
CMD ["sh", "-c", "npm install && npm run migrar && npm run dev"]

# ---- deps ----------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# ---- builder -------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner: imagem de produção -----------------------------------------
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
