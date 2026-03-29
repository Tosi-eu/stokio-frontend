# Debian/glibc: Vite/Rollup precisam do binding nativo certo; em Alpine (musl)
# o @rollup/rollup-linux-x64-musl costuma faltar por causa de optional deps + lockfile.
# A imagem final continua nginx:alpine.
FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_LOGO_URL
ARG VITE_PUBLIC_APP_NAME
ARG VITE_PUBLIC_APP_LOGO_URL
ARG VITE_R2_PUBLIC_BASE_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_LOGO_URL=$VITE_LOGO_URL
ENV VITE_PUBLIC_APP_NAME=$VITE_PUBLIC_APP_NAME
ENV VITE_PUBLIC_APP_LOGO_URL=$VITE_PUBLIC_APP_LOGO_URL
ENV VITE_R2_PUBLIC_BASE_URL=$VITE_R2_PUBLIC_BASE_URL

RUN npm run build

FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/spa /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/app.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
