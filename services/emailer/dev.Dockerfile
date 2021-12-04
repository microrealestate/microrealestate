FROM node:16-slim

WORKDIR /usr/app

COPY package.json .
COPY yarn.lock .
COPY common common
COPY services/emailer services/emailer

RUN yarn workspace emailer install

CMD yarn workspace emailer run dev