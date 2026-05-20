FROM node:20-bookworm-slim AS build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json frontend/.npmrc ./
RUN npm ci
COPY frontend/ ./

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_LOGO_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_LOGO_URL
ARG NEXT_PUBLIC_R2_PUBLIC_BASE_URL

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_LOGO_URL=$NEXT_PUBLIC_LOGO_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_LOGO_URL=$NEXT_PUBLIC_APP_LOGO_URL
ENV NEXT_PUBLIC_R2_PUBLIC_BASE_URL=$NEXT_PUBLIC_R2_PUBLIC_BASE_URL

RUN set -eu; \
  : "${NEXT_PUBLIC_API_BASE_URL:?required}"; \
  : "${NEXT_PUBLIC_LOGO_URL:?required}"; \
  : "${NEXT_PUBLIC_R2_PUBLIC_BASE_URL:?required}"; \
  npm run build

FROM node:20-bookworm-slim AS runner

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=build /app/frontend/public ./public
COPY --from=build --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 8081

CMD ["node", "server.js"]
