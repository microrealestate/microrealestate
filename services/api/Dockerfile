FROM node:18-alpine

RUN apk --no-cache add build-base python3 mongodb-tools

WORKDIR /usr/app

COPY services/common services/common
COPY services/api/src services/api/src
COPY services/api/scripts services/api/scripts
COPY services/api/LICENSE services/api/.
COPY services/api/package.json services/api/.
COPY package.json .
COPY .yarnrc.yml .
COPY .yarn .yarn
COPY yarn.lock .

ENV NODE_ENV production

RUN corepack enable && \
    corepack prepare yarn@stable --activate

RUN yarn workspaces focus --production @microrealestate/api

CMD ["node", "services/api/src/index.js"]