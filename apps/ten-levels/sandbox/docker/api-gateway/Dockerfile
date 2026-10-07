FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
USER root
EXPOSE 8080
CMD ["node", "server.js"]
