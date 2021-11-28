FROM node:14-slim

WORKDIR /usr/app

COPY . .

RUN npm install --silent

CMD npm run dev