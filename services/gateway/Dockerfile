FROM node:18-alpine

RUN apk --no-cache add build-base python3

WORKDIR /usr/app

COPY services/common services/common
COPY services/gateway/src services/gateway/src
COPY services/gateway/package.json services/gateway/.
COPY services/gateway/LICENSE services/gateway/.
COPY package.json .
COPY .yarnrc.yml .
COPY .yarn .yarn
COPY yarn.lock .

ENV NODE_ENV production

RUN corepack enable && \
    corepack prepare yarn@stable --activate

RUN yarn workspaces focus --production @microrealestate/gateway

CMD ["node", "services/gateway/src/index.js"]