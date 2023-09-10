FROM node:18-alpine AS build

RUN apk --no-cache add build-base python3

WORKDIR /usr/app

COPY services/common services/common
COPY services/api/src services/api/src
COPY services/api/scripts services/api/scripts
COPY services/api/LICENSE services/api/.
COPY services/api/package.json services/api/.
COPY package.json .
COPY .yarnrc.yml .
COPY .yarn .yarn
COPY yarn.lock .

RUN corepack enable && \
    corepack prepare yarn@stable --activate

RUN yarn workspaces focus --production @microrealestate/api

FROM node:18-alpine
ENV NODE_ENV production
RUN apk --no-cache add mongodb-tools
WORKDIR /usr/app
COPY --from=build /usr/app ./
CMD ["node", "services/api/src/index.js"]