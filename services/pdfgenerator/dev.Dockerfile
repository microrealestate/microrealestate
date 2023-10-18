FROM node:18-alpine AS build

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN apk --no-cache add build-base python3

WORKDIR /usr/app

COPY package.json .
COPY yarn.lock .
COPY .yarnrc.yml .
COPY .yarn .yarn
COPY services/common services/common
COPY services/pdfgenerator services/pdfgenerator

RUN corepack enable && \
    corepack prepare yarn@stable --activate

RUN yarn workspaces focus @microrealestate/pdfgenerator

FROM node:18-alpine
ENV CHROMIUM_BIN "/usr/bin/chromium-browser"
RUN apk --no-cache add chromium
WORKDIR /usr/app
COPY --from=build /usr/app ./
CMD ["yarn", "workspace", "@microrealestate/pdfgenerator", "run", "dev"]