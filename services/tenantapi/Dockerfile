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
COPY services/tenantapi services/tenantapi
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus @microrealestate/tenantapi && \
    yarn workspace @microrealestate/types run build && \
    yarn workspace @microrealestate/common run build && \
    yarn workspace @microrealestate/tenantapi run build

FROM base AS deps
WORKDIR /usr/app
COPY --from=build /usr/app/package.json .
COPY --from=build /usr/app/.yarnrc.yml .
COPY --from=build /usr/app/yarn.lock .
COPY --from=build /usr/app/.yarn/plugins .yarn/plugins
COPY --from=build /usr/app/.yarn/releases .yarn/releases
COPY --from=build /usr/app/types/package.json types/package.json
COPY --from=build /usr/app/services/common/package.json ./services/common/package.json
COPY --from=build /usr/app/services/tenantapi/package.json ./services/tenantapi/package.json
COPY --from=build /usr/app/services/common/dist ./services/common/dist
COPY --from=build /usr/app/services/tenantapi/dist ./services/tenantapi/dist
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus --production @microrealestate/tenantapi

FROM base
ENV NODE_ENV production
WORKDIR /usr/app
COPY --from=deps /usr/app ./
CMD ["node", "services/tenantapi/dist/index.js"]
