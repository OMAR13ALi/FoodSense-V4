FROM node:20-alpine

RUN apk add --no-cache git bash

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

EXPOSE 8081 19000 19001 19002

CMD ["npx", "expo", "start", "--host", "lan"]
