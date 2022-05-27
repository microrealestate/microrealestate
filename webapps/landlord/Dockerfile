FROM node:16-stretch

WORKDIR /usr/

COPY package.json .
COPY yarn.lock .
COPY .eslintrc.json .
COPY services/common services/common
COPY webapps/landlord/public webapps/landlord/public
COPY webapps/landlord/locales webapps/landlord/locales
COPY webapps/landlord/src webapps/landlord/src
COPY webapps/landlord/.eslintrc.json webapps/landlord
COPY webapps/landlord/i18n.json webapps/landlord
COPY webapps/landlord/next.config.js webapps/landlord
COPY webapps/landlord/package.json webapps/landlord
COPY webapps/landlord/LICENSE webapps/landlord

ARG BASE_PATH
ENV BASE_PATH $BASE_PATH

ENV NEXT_TELEMETRY_DISABLED=1

RUN yarn workspace landlord install && \
    yarn cache clean && \
    yarn workspace landlord run build

ENTRYPOINT yarn workspace landlord start -p $PORT