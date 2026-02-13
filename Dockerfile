# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || npm install

COPY . .
RUN test -f prisma/seed.mjs || (echo "ERROR: prisma/seed.mjs not found in build context" && exit 1)
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package.json ./

# Prisma CLI + bcrypt + effect (시드·db push용)
RUN npm install prisma bcrypt effect --omit=dev && chown -R nextjs:nodejs /app
COPY --from=builder /app/prisma/seed.mjs ./prisma/seed.mjs
COPY --from=builder /app/prisma/seed.mjs ./seed.mjs

# SQLite DB & uploads (use volume in production for persistence)
RUN mkdir -p /app/prisma /app/public/uploads && chown -R nextjs:nodejs /app/prisma /app/public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Sync DB schema then start (DATABASE_URL must be set)
ENV DATABASE_URL="file:./prisma/dev.db"
CMD ["sh", "-c", "npx prisma db push 2>/dev/null || true && node server.js"]
