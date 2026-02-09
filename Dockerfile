FROM node:22.12-slim AS base

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package files
COPY api/package.json api/
COPY shared/package.json shared/
COPY web/package.json web/

# Install all dependencies
RUN npm ci --ignore-scripts

# Copy all source files
COPY . .

# Generate Prisma client and build API
RUN cd api && npx prisma generate && npm run build

EXPOSE ${PORT:-5000}

CMD cd api && npx prisma migrate deploy && npm run start
