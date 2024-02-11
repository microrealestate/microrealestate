FROM node:20-alpine AS base

FROM base AS deps
RUN apk --no-cache add libc6-compat
RUN corepack enable && \
    corepack prepare yarn@3.3.0 --activate
WORKDIR /usr/app
COPY package.json .
COPY .yarnrc.yml .
COPY yarn.lock .
COPY .yarn/plugins .yarn/plugins
COPY .yarn/releases .yarn/releases
COPY webapps/commonui/package.json webapps/commonui/package.json
COPY webapps/landlord/package.json webapps/landlord/package.json
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus @microrealestate/landlord

FROM base
ARG BASE_PATH
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /usr/app
COPY --from=deps /usr/app ./
CMD node webapps/commonui/scripts/generateruntimeenvfile.js -- --path ./webapps/landlord && \
    yarn workspace @microrealestate/landlord run dev -p $PORT
