FROM node:20.11.1-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27.0-alpine
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
CMD ["nginx", "-g", "daemon off;"]
