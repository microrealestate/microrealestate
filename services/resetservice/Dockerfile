FROM node:16-alpine

WORKDIR /usr/app

COPY services/common services/common
COPY services/resetservice/src services/resetservice/src
COPY services/resetservice/package.json services/resetservice/.
COPY package.json .
COPY yarn.lock .

ENV NODE_ENV production

RUN yarn global add pm2 && \
    yarn workspace resetservice install --frozen-lockfile --production && \
    yarn cache clean

RUN chown -R node:node /usr/app

USER node

CMD ["pm2-runtime", "services/resetservice/src/index.js"]
