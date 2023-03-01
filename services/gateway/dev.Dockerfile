FROM node:16.18-alpine

RUN apk --no-cache add build-base python3

WORKDIR /usr/app

COPY services/common services/common
COPY services/gateway services/gateway
COPY package.json .
COPY .yarnrc.yml .
COPY .yarn .yarn
COPY yarn.lock .

RUN corepack enable && \
    corepack prepare yarn@stable --activate

RUN yarn workspaces focus @microrealestate/gateway

RUN chown -R node:node /usr/app

USER node

CMD ["yarn", "workspace", "@microrealestate/gateway", "run", "dev"]