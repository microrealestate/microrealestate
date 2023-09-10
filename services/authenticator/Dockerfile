FROM node:18-alpine

RUN apk --no-cache add build-base python3

WORKDIR /usr/app

COPY services/common services/common
COPY services/authenticator/src services/authenticator/src
COPY services/authenticator/LICENSE services/authenticator/.
COPY services/authenticator/package.json services/authenticator/.
COPY package.json .
COPY .yarnrc.yml .
COPY .yarn .yarn
COPY yarn.lock .

ENV NODE_ENV production

RUN corepack enable && \
    corepack prepare yarn@stable --activate

RUN yarn workspaces focus --production @microrealestate/authenticator

CMD ["node", "services/authenticator/src/index.js"]
