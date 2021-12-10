FROM node:16-slim

WORKDIR /usr/app
COPY services/common services/common
COPY services/resetservice/src services/resetservice/src
COPY services/resetservice/package.json services/resetservice/.
COPY package.json .
COPY yarn.lock .

RUN yarn global add forever && \
    yarn workspace resetservice install --production && \
    yarn cache clean

CMD forever services/resetservice/src/index.js
