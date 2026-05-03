# Debian/glibc para builds Node estáveis.
FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_LOGO_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_LOGO_URL
ARG NEXT_PUBLIC_R2_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_X_API_KEY

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_LOGO_URL=$NEXT_PUBLIC_LOGO_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_LOGO_URL=$NEXT_PUBLIC_APP_LOGO_URL
ENV NEXT_PUBLIC_R2_PUBLIC_BASE_URL=$NEXT_PUBLIC_R2_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_X_API_KEY=$NEXT_PUBLIC_X_API_KEY

RUN npm run build

FROM node:20-bookworm-slim AS runner

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8081
# Next standalone: bind em todas as interfaces. Em Docker, HOSTNAME costuma ser sobrescrito pelo
# runtime — defina HOSTNAME=0.0.0.0 também no compose (service frontend).
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8081

CMD ["node", "server.js"]
