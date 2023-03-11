FROM node:18-alpine

RUN npm install -g nodemon

WORKDIR /usr/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3002

CMD ["npm","run","start:dev"]