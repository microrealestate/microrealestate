FROM node:16-alpine

RUN apk --no-cache add build-base python3

WORKDIR /usr/app

COPY services/common services/common
COPY services/emailer/src services/emailer/src
COPY services/emailer/package.json services/emailer/.
COPY services/emailer/LICENSE services/emailer/.
COPY package.json .
COPY yarn.lock .

ENV NODE_ENV production

RUN yarn config set network-timeout 600000 -g && \
    yarn global add pm2 && \
    yarn workspace @microrealestate/emailer install --frozen-lockfile --production && \
    yarn cache clean

RUN chown -R node:node /usr/app

USER node

CMD ["pm2-runtime", "services/emailer/src/index.js"]