FROM node:20-alpine AS base

FROM base AS build
RUN apk --no-cache add build-base python3
RUN corepack enable && \
    corepack prepare yarn@3.3.0 --activate
WORKDIR /usr/app
COPY package.json .
COPY .yarnrc.yml .
COPY yarn.lock .
COPY .yarn/plugins .yarn/plugins
COPY .yarn/releases .yarn/releases
COPY types types
COPY services/common services/common
COPY services/gateway services/gateway
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus @microrealestate/gateway && \
    yarn workspace @microrealestate/types run build && \
    yarn workspace @microrealestate/common run build && \
    yarn workspace @microrealestate/gateway run build

FROM base AS deps
WORKDIR /usr/app
COPY --from=build /usr/app/package.json .
COPY --from=build /usr/app/.yarnrc.yml .
COPY --from=build /usr/app/yarn.lock .
COPY --from=build /usr/app/.yarn/plugins .yarn/plugins
COPY --from=build /usr/app/.yarn/releases .yarn/releases
COPY --from=build /usr/app/types/package.json types/package.json
COPY --from=build /usr/app/services/common/package.json ./services/common/package.json
COPY --from=build /usr/app/services/gateway/package.json ./services/gateway/package.json
COPY --from=build /usr/app/services/common/dist ./services/common/dist
COPY --from=build /usr/app/services/gateway/dist ./services/gateway/dist
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus --production @microrealestate/gateway

FROM base
ENV NODE_ENV production
WORKDIR /usr/app
COPY --from=deps /usr/app ./
CMD ["node", "services/gateway/dist/index.js"]
