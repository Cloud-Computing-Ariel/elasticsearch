FROM node:18-alpine

USER root

WORKDIR /usr/app

COPY package*.json ./

RUN npm install -g npm && npm ci

RUN npm install -g @nestjs/cli

COPY . .

EXPOSE 3002

CMD ["npm","run","start:dev"]