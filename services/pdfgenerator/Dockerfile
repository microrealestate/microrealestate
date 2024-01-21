FROM node:20-alpine AS base

FROM base AS deps
RUN apk --no-cache add build-base python3
RUN corepack enable && \
    corepack prepare yarn@3.3.0 --activate
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
WORKDIR /usr/app
COPY package.json .
COPY .yarnrc.yml .
COPY yarn.lock .
COPY .yarn/plugins .yarn/plugins
COPY .yarn/releases .yarn/releases
COPY services/common/package.json services/common/package.json
COPY services/pdfgenerator/package.json services/pdfgenerator/package.json
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus --production @microrealestate/pdfgenerator

FROM base
RUN apk --no-cache add chromium
ENV NODE_ENV production
ENV CHROMIUM_BIN "/usr/bin/chromium-browser"
WORKDIR /usr/app
COPY --from=deps /usr/app ./
COPY services/pdfgenerator/data ./services/pdfgenerator/data
COPY services/pdfgenerator/src ./services/pdfgenerator/src
COPY services/pdfgenerator/templates ./services/pdfgenerator/templates
COPY services/common/models ./services/common/models
COPY services/common/utils ./services/common/utils
COPY services/common/config.js ./services/common/config.js
CMD ["node", "services/pdfgenerator/src/index.js"]
