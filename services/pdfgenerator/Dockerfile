FROM node:18-alpine AS build

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN apk --no-cache add build-base python3

WORKDIR /usr/app

COPY services/common services/common
COPY services/pdfgenerator/data services/pdfgenerator/data
COPY services/pdfgenerator/src services/pdfgenerator/src
COPY services/pdfgenerator/templates services/pdfgenerator/templates
COPY services/pdfgenerator/package.json services/pdfgenerator/.
COPY services/pdfgenerator/LICENSE services/pdfgenerator/.
COPY package.json .
COPY yarn.lock .
COPY .yarnrc.yml .
COPY .yarn .yarn

RUN corepack enable && \
    corepack prepare yarn@stable --activate

RUN yarn workspaces focus --production @microrealestate/pdfgenerator

FROM node:18-alpine
ENV NODE_ENV production
ENV CHROMIUM_BIN "/usr/bin/chromium-browser"
RUN apk --no-cache add chromium
WORKDIR /usr/app
COPY --from=build /usr/app ./
CMD ["node", "services/pdfgenerator/src/index.js"]
