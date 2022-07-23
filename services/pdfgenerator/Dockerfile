FROM node:16-alpine

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

ENV CHROMIUM_BIN "/usr/bin/chromium-browser"

RUN apk add chromium

WORKDIR /usr/app

COPY services/common services/common
COPY services/pdfgenerator/data services/pdfgenerator/data
COPY services/pdfgenerator/src services/pdfgenerator/src
COPY services/pdfgenerator/templates services/pdfgenerator/templates
COPY services/pdfgenerator/package.json services/pdfgenerator/.
COPY services/pdfgenerator/LICENSE services/pdfgenerator/.
COPY package.json .
COPY yarn.lock .

ENV NODE_ENV production

RUN yarn global add pm2 && \
    yarn workspace pdfgenerator install --frozen-lockfile --production && \
    yarn cache clean

RUN chown -R node:node /usr/app

USER node

CMD ["pm2-runtime", "services/pdfgenerator/src/index.js"]
