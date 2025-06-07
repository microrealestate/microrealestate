FROM node:20-bookworm-slim AS base

FROM base AS build
WORKDIR /usr/app
COPY package.json .
COPY .yarnrc.yml .
COPY yarn.lock .
COPY .yarn/plugins .yarn/plugins
COPY .yarn/releases .yarn/releases
COPY types types
COPY services/common services/common
COPY services/resetservice services/resetservice
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus @microrealestate/resetservice && \
    yarn workspace @microrealestate/types run build && \
    yarn workspace @microrealestate/common run build && \
    yarn workspace @microrealestate/resetservice run build

FROM base AS deps
WORKDIR /usr/app
COPY --from=build /usr/app/package.json .
COPY --from=build /usr/app/.yarnrc.yml .
COPY --from=build /usr/app/yarn.lock .
COPY --from=build /usr/app/.yarn/plugins .yarn/plugins
COPY --from=build /usr/app/.yarn/releases .yarn/releases
COPY --from=build /usr/app/types/package.json types/package.json
COPY --from=build /usr/app/services/common/package.json ./services/common/package.json
COPY --from=build /usr/app/services/resetservice/package.json ./services/resetservice/package.json
COPY --from=build /usr/app/services/common/dist ./services/common/dist
COPY --from=build /usr/app/services/resetservice/dist ./services/resetservice/dist
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus --production @microrealestate/resetservice

FROM gcr.io/distroless/nodejs20-debian12
ENV NODE_ENV production
WORKDIR /usr/app
COPY --from=deps /usr/app ./

USER 1000
CMD ["services/resetservice/dist/index.js"]
