FROM node:20.11.1-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20.11.1-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]
