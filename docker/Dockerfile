FROM node:22.17-alpine
WORKDIR /app
COPY docker/* .
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]
