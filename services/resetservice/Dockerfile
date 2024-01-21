FROM node:20-alpine AS base

FROM base AS deps
RUN apk --no-cache add build-base python3 libc6-compat
RUN corepack enable && \
    corepack prepare yarn@3.3.0 --activate
WORKDIR /usr/app
COPY package.json .
COPY .yarnrc.yml .
COPY yarn.lock .
COPY .yarn/plugins .yarn/plugins
COPY .yarn/releases .yarn/releases
COPY services/common/package.json services/common/package.json
COPY services/resetservice/package.json services/resetservice/package.json
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus --production @microrealestate/resetservice 

FROM node:20-slim
ENV NODE_ENV production
WORKDIR /usr/app
COPY --from=deps /usr/app ./
COPY services/resetservice/src ./services/resetservice/src
COPY services/common/models ./services/common/models
COPY services/common/utils ./services/common/utils
COPY services/common/config.js ./services/common/config.js
CMD ["node", "services/resetservice/src/index.js"]
