FROM node:18-alpine AS base

FROM base AS deps
RUN apk --no-cache add libc6-compat
RUN corepack enable && \
    corepack prepare yarn@3.3.0 --activate
ARG TENANT_BASE_PATH
ENV BASE_PATH=$TENANT_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=$TENANT_BASE_PATH
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /usr/app
COPY package.json .
COPY .yarnrc.yml .
COPY yarn.lock .
COPY .yarn/plugins .yarn/plugins
COPY .yarn/releases .yarn/releases
COPY types types
COPY webapps/commonui webapps/commonui
COPY webapps/tenant webapps/tenant
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus @microrealestate/tenant && \
    yarn workspace @microrealestate/types run build 

FROM base
ENV NEXT_TELEMETRY_DISABLED=1
ARG TENANT_BASE_PATH
ENV BASE_PATH=$TENANT_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=$TENANT_BASE_PATH
WORKDIR /usr/app
COPY --from=deps /usr/app ./
CMD yarn workspace @microrealestate/tenant run dev -p $PORT
