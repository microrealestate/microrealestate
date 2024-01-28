FROM node:20-alpine AS base

FROM base AS deps
RUN apk --no-cache add build-base python3
RUN corepack enable && \
    corepack prepare yarn@3.3.0 --activate
WORKDIR /usr/app
COPY package.json .
COPY .yarnrc.yml .
COPY yarn.lock .
COPY .yarn/plugins .yarn/plugins
COPY .yarn/releases .yarn/releases
COPY services/common/package.json services/common/package.json
COPY services/api/package.json services/api/package.json
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus --production @microrealestate/api

FROM base
ENV NODE_ENV production
RUN apk --no-cache add mongodb-tools
WORKDIR /usr/app
COPY --from=deps /usr/app ./
COPY services/api/src ./services/api/src
COPY services/api/scripts ./services/api/scripts
COPY services/common/models ./services/common/models
COPY services/common/utils ./services/common/utils
COPY services/common/config.js ./services/common/config.js
CMD ["node", "services/api/src/index.js"]
