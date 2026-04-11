FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000 3002

CMD ["node", "apps/cli/bin/ultra-dex.js", "serve"]
