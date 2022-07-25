FROM node:16-alpine

RUN apk --no-cache add build-base python3

WORKDIR /usr/app

COPY services/common services/common
COPY services/authenticator services/authenticator
COPY package.json .
COPY yarn.lock .

RUN yarn workspace authenticator install --frozen-lockfile

RUN chown -R node:node /usr/app

USER node

CMD ["yarn", "workspace", "authenticator", "run", "dev"]