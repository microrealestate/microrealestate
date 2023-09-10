FROM node:18-alpine AS build

RUN apk --no-cache add build-base python3

WORKDIR /usr/app

COPY services/common services/common
COPY services/resetservice/src services/resetservice/src
COPY services/resetservice/package.json services/resetservice/.
COPY package.json .
COPY yarn.lock .
COPY .yarnrc.yml .
COPY .yarn .yarn

RUN corepack enable && \
    corepack prepare yarn@stable --activate

RUN yarn workspaces focus --production @microrealestate/resetservice 

FROM node:18-slim
ENV NODE_ENV production
WORKDIR /usr/app
COPY --from=build /usr/app ./
CMD ["node", "services/resetservice/src/index.js"]
