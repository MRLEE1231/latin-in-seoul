# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# DATABASE_URL at build time so Next.js/Prisma use it (runtime value comes from --env-file when running the container)
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

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

# Prisma CLI + bcrypt + effect + sharp (시드·db push·업로드 압축 스크립트용)
RUN npm install prisma bcrypt effect sharp --omit=dev && chown -R nextjs:nodejs /app
COPY --from=builder /app/prisma/seed.mjs ./prisma/seed.mjs
COPY --from=builder /app/prisma/seed.mjs ./seed.mjs
COPY --from=builder /app/scripts/wait-for-db.sh ./scripts/wait-for-db.sh
COPY --from=builder /app/scripts/compress-uploaded-images.mjs ./scripts/compress-uploaded-images.mjs
RUN chmod +x ./scripts/wait-for-db.sh && chown nextjs:nodejs ./scripts/wait-for-db.sh ./scripts/compress-uploaded-images.mjs

# SQLite DB & uploads & 광고 이미지 (use volume in production for persistence)
RUN mkdir -p /app/prisma /app/public/uploads /app/public/ads && chown -R nextjs:nodejs /app/prisma /app/public/uploads /app/public/ads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# DB 연결 가능할 때까지 대기 후 마이그레이션·앱 기동 (Postgres보다 앱이 먼저 떠서 P1000 나는 것 방지)
CMD ["sh", "-c", "./scripts/wait-for-db.sh latin-postgres 5432 && npx prisma migrate deploy 2>/dev/null || true && node server.js"]
