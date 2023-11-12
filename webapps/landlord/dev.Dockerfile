FROM node:18-alpine AS base

FROM base AS deps
RUN apk --no-cache add libc6-compat
RUN corepack enable && \
    corepack prepare yarn@3.3.0 --activate
ARG LANDLORD_BASE_PATH
ENV BASE_PATH=$LANDLORD_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=$LANDLORD_BASE_PATH
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /usr/app
COPY package.json .
COPY .yarnrc.yml .
COPY yarn.lock .
COPY .yarn/plugins .yarn/plugins
COPY .yarn/releases .yarn/releases
COPY webapps/commonui webapps/commonui
COPY webapps/landlord webapps/landlord
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus @microrealestate/landlord

FROM base
ENV NEXT_TELEMETRY_DISABLED=1
ARG LANDLORD_BASE_PATH
ENV BASE_PATH=$LANDLORD_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=$LANDLORD_BASE_PATH
WORKDIR /usr/app
COPY --from=deps /usr/app ./
CMD yarn workspace @microrealestate/landlord run generateRuntimeEnvFile && \
    yarn workspace @microrealestate/landlord run dev -p $PORT
