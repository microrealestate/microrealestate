FROM node:16-alpine

WORKDIR /usr/app

COPY services/common services/common
COPY services/authenticator services/authenticator
COPY package.json .
COPY yarn.lock .

RUN yarn workspace authenticator install --frozen-lockfile

RUN chown -R node:node /usr/app

USER node

CMD ["yarn", "workspace", "authenticator", "run", "dev"]