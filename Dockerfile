# syntax=docker/dockerfile:1

# ---- Estagio de build ----
# Imagem com Node so existe aqui; nao vai para a imagem final.
FROM node:20-alpine AS build
WORKDIR /build

# Copia so os manifests primeiro para cachear as dependencias em uma layer
# separada - so reinstala tudo se package*.json mudar, nao a cada mudanca de
# codigo.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Estagio de runtime ----
# Nginx alpine "unprivileged" so serve os arquivos estaticos gerados - nao
# precisa de Node nem do Angular CLI na imagem final, e ja roda sem ser root
# (ouve na porta 8080, nao na 80, sem precisar de privilegio nenhum).
FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist/invest-renda-web/browser /usr/share/nginx/html

EXPOSE 8080
