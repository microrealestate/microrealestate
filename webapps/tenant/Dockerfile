FROM node:16.18-alpine

RUN apk --no-cache add build-base python3

WORKDIR /usr/app

COPY package.json .
COPY yarn.lock .
COPY .yarnrc.yml .
COPY .yarn .yarn
COPY .eslintrc.json .
COPY webapps/commonui webapps/commonui
COPY webapps/tenant/public webapps/tenant/public
COPY webapps/tenant/locales webapps/tenant/locales
COPY webapps/tenant/src webapps/tenant/src
COPY webapps/tenant/.eslintrc.json webapps/tenant
COPY webapps/tenant/i18n.js webapps/tenant
COPY webapps/tenant/next.config.js webapps/tenant
COPY webapps/tenant/package.json webapps/tenant
COPY webapps/tenant/LICENSE webapps/tenant

ARG BASE_PATH
ENV BASE_PATH $BASE_PATH

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && \
    corepack prepare yarn@stable --activate

RUN yarn workspaces focus @microrealestate/tenant && \
    yarn workspace @microrealestate/tenant run build

# TODO: check why using user node is failing
# RUN chown -R node:node /usr/app

# USER node

CMD yarn workspace @microrealestate/tenant start -p $PORT