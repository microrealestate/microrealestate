FROM node:14-slim

RUN apt-get update && \
    apt-get install -y wget gnupg && \
    apt-get install -y build-essential && \
    apt-get install -y python

WORKDIR /usr/app
COPY src src
COPY package.json .
COPY package-lock.json .
COPY LICENSE .

RUN npm set progress=false && \
    npm config set depth 0 && \
    npm install forever -g --silent && \
    npm ci --silent --only=production

CMD forever ./src/index.js
