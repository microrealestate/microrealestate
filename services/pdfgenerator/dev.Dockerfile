FROM node:16-alpine

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

ENV CHROMIUM_BIN "/usr/bin/chromium-browser"

RUN apk add chromium

WORKDIR /usr/app

COPY package.json .
COPY yarn.lock .
COPY services/common services/common
COPY services/pdfgenerator services/pdfgenerator

RUN yarn workspace pdfgenerator install --frozen-lockfile

RUN chown -R node:node /usr/app

USER node

CMD ["yarn", "workspace", "pdfgenerator", "run", "dev"]