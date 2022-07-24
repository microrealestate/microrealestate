FROM node:16-alpine

RUN apk --no-cache add --virtual .builds-deps build-base python3

WORKDIR /usr/app

COPY package.json .
COPY yarn.lock .
COPY services/common services/common
COPY services/resetservice services/resetservice

RUN yarn workspace resetservice install --frozen-lockfile

RUN chown -R node:node /usr/app

USER node

CMD ["yarn", "workspace", "resetservice", "run", "dev"]