FROM node:16-slim

WORKDIR /usr/app
COPY services/common services/common
COPY services/emailer/src services/emailer/src
COPY services/emailer/package.json services/emailer/.
COPY services/emailer/LICENSE services/emailer/.
COPY package.json .
COPY yarn.lock .

RUN yarn global add forever && \
    yarn workspace emailer install --production && \
    yarn cache clean

CMD forever services/emailer/src/index.js