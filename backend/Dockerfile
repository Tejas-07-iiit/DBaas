# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies required for native builds and Prisma
RUN apk add --no-cache openssl

# Install app dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copy application source
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Install runtime dependencies for Prisma
RUN apk add --no-cache openssl

# Set node environment
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S dbaas && \
    adduser -u 1001 -S dbaas -G dbaas

# Copy production artifacts
COPY --chown=dbaas:dbaas package*.json ./
COPY --chown=dbaas:dbaas prisma ./prisma/
COPY --chown=dbaas:dbaas --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=dbaas:dbaas --from=builder /usr/src/app/dist ./dist

# Switch to non-root user
USER dbaas

EXPOSE 3000

CMD ["node", "dist/main"]
