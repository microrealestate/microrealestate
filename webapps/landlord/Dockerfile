FROM node:14-slim

RUN apt-get update

WORKDIR /usr/app

RUN npm set progress=false && \
    npm config set depth 0

COPY public public
COPY locales locales
COPY src src
COPY .eslintrc.json .
COPY i18n.json .
COPY next.config.js .
COPY package.json .
COPY package-lock.json .
COPY LICENSE .

ARG BASE_PATH
ENV BASE_PATH $BASE_PATH

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm ci --silent && \
    npm run build

ENTRYPOINT npm start -- -p $PORT