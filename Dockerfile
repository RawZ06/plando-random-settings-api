# Stage 1: Build
FROM node:22-alpine AS builder

# Installation de pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copie des fichiers de configuration pnpm et installation des dépendances
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# Copie du reste du code source
COPY . .

# Build de l'application NestJS
RUN pnpm build

# Installation des dépendances de production uniquement pour l'image finale
RUN pnpm prune --prod

# Stage 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

# Copie des fichiers nécessaires depuis le builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/weights ./weights

# Exposition du port (NestJS écoute par défaut sur 3000)
EXPOSE 3000

# Commande de démarrage
CMD ["node", "dist/main"]
