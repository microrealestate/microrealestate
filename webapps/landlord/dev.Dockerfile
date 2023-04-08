FROM node:18-alpine

RUN apk --no-cache add build-base python3

WORKDIR /usr/app

COPY package.json .
COPY yarn.lock .
COPY .yarnrc.yml .
COPY .yarn .yarn
COPY .eslintrc.json .
COPY webapps/commonui webapps/commonui
COPY webapps/landlord/public webapps/landlord/public
COPY webapps/landlord/locales webapps/landlord/locales
COPY webapps/landlord/src webapps/landlord/src
COPY webapps/landlord/.eslintrc.json webapps/landlord
COPY webapps/landlord/i18n.js webapps/landlord
COPY webapps/landlord/next.config.js webapps/landlord
COPY webapps/landlord/package.json webapps/landlord
COPY webapps/landlord/LICENSE webapps/landlord

ARG PORT
ARG LOGGER_LEVEL
ARG BASE_PATH
ARG GATEWAY_URL
ARG DOCKER_GATEWAY_URL
ARG APP_URL
ARG REFRESH_TOKEN_SECRET
ARG SIGNUP
ARG CORS_ENABLED
ARG NEXT_PUBLIC_DEMO_MODE
ARG NEXT_PUBLIC_SIGNUP
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GATEWAY_URL
ARG NEXT_PUBLIC_CORS_ENABLED
ARG NEXT_PUBLIC_BASE_PATH

ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=$PORT
ENV LOGGER_LEVEL=$LOGGER_LEVEL
ENV BASE_PATH=$BASE_PATH
ENV GATEWAY_URL=$GATEWAY_URL
ENV DOCKER_GATEWAY_URL=$DOCKER_GATEWAY_URL
ENV APP_URL=$APP_URL
ENV REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET
ENV SIGNUP=$SIGNUP
ENV CORS_ENABLED=$CORS_ENABLED
ENV NEXT_PUBLIC_DEMO_MODE=$NEXT_PUBLIC_DEMO_MODE
ENV NEXT_PUBLIC_SIGNUP=$NEXT_PUBLIC_SIGNUP
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_GATEWAY_URL=$NEXT_PUBLIC_GATEWAY_URL
ENV NEXT_PUBLIC_CORS_ENABLED=$NEXT_PUBLIC_CORS_ENABLED
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

RUN corepack enable && \
    corepack prepare yarn@stable --activate

RUN yarn workspaces focus @microrealestate/landlord

# TODO: check why using user node is failing
# RUN chown -R node:node /usr/app

# USER node

CMD yarn workspace @microrealestate/landlord run dev -p $PORT
