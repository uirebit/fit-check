FROM node:18

WORKDIR /app

# Copia solo package.json primero (para cache de dependencias)
COPY package*.json ./

RUN npm install

# Copia todo el proyecto (incluye prisma/)
COPY . .

# Genera Prisma Client
RUN npx prisma generate

