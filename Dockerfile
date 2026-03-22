FROM node:20-alpine as build

WORKDIR /repo

COPY sdk/package.json sdk/package-lock.json* ./sdk/
COPY sdk/tsconfig.json ./sdk/
COPY sdk/src ./sdk/src

RUN cd sdk && npm install && npm run build

COPY frontend/package.json frontend/package-lock.json* ./frontend/
WORKDIR /repo/frontend
RUN npm install

COPY frontend .

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
COPY --from=build /repo/frontend/dist/spa /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/app.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
