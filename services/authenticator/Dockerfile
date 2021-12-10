FROM node:16-slim

WORKDIR /usr/app
COPY services/common services/common
COPY services/authenticator/src services/authenticator/src
COPY services/authenticator/LICENSE services/authenticator/.
COPY services/authenticator/package.json services/authenticator/.
COPY package.json .
COPY yarn.lock .

RUN yarn global add forever && \
    yarn workspace authenticator install --production && \
    yarn cache clean

CMD forever services/authenticator/src/index.js
