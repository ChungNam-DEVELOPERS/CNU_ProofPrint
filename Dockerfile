# ── 의존성 ──────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── 빌드 ────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 이 단계에는 DB 가 없다. 모든 화면이 동적 렌더라 빌드에 DB 가 필요하지 않다.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── 실행 ────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 컨테이너 시작 시 DB 를 기다리기 위해 필요
RUN apk add --no-cache postgresql16-client

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# standalone 산출물 (필요한 node_modules 만 포함)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 마이그레이션과 시드는 standalone 에 포함되지 않으므로 따로 넣는다.
# standalone 의 node_modules 에는 postgres 가 없다(앱 번들 안으로 들어감).
# 스크립트가 직접 import 하므로 패키지를 따로 넣어 준다.
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres ./node_modules/postgres
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
