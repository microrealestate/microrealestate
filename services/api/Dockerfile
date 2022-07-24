FROM node:16-alpine

RUN apk --no-cache add --virtual .builds-deps build-base python3 mongodb-tools

WORKDIR /usr/app

COPY services/common services/common
COPY services/api/src services/api/src
COPY services/api/scripts services/api/scripts
COPY services/api/LICENSE services/api/.
COPY services/api/package.json services/api/.
COPY package.json .
COPY yarn.lock .

ENV NODE_ENV production

RUN yarn global add pm2 && \
    yarn workspace api install --frozen-lockfile --production && \
    yarn cache clean

RUN chown -R node:node /usr/app

USER node

CMD ["pm2-runtime", "services/api/src/index.js"]