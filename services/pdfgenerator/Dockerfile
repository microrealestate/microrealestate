FROM node:20-alpine AS base

FROM base AS build
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
COPY types types
COPY services/common services/common
COPY services/pdfgenerator/package.json services/pdfgenerator/package.json
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus @microrealestate/pdfgenerator && \
    yarn workspace @microrealestate/types run build && \
    yarn workspace @microrealestate/common run build

FROM base AS deps
WORKDIR /usr/app
COPY --from=build /usr/app/package.json .
COPY --from=build /usr/app/.yarnrc.yml .
COPY --from=build /usr/app/yarn.lock .
COPY --from=build /usr/app/.yarn/plugins .yarn/plugins
COPY --from=build /usr/app/.yarn/releases .yarn/releases
COPY --from=build /usr/app/types/package.json types/package.json
COPY --from=build /usr/app/services/common/package.json ./services/common/package.json
COPY --from=build /usr/app/services/pdfgenerator/package.json ./services/pdfgenerator/package.json
COPY --from=build /usr/app/services/common/dist ./services/common/dist
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus --production @microrealestate/pdfgenerator

FROM base
RUN apk --no-cache add chromium
ENV NODE_ENV production
ENV CHROMIUM_BIN "/usr/bin/chromium-browser"
WORKDIR /usr/app
COPY --from=deps /usr/app ./
COPY services/pdfgenerator ./services/pdfgenerator
CMD ["node", "services/pdfgenerator/src/index.js"]
