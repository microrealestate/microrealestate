FROM node:18-alpine AS build

RUN apk --no-cache add build-base python3

WORKDIR /usr/app

COPY services/common services/common
COPY services/emailer/src services/emailer/src
COPY services/emailer/package.json services/emailer/.
COPY services/emailer/LICENSE services/emailer/.
COPY package.json .
COPY .yarnrc.yml .
COPY .yarn .yarn
COPY yarn.lock .

RUN corepack enable && \
    corepack prepare yarn@stable --activate

RUN yarn workspaces focus --production @microrealestate/emailer

FROM node:18-slim
ENV NODE_ENV production
WORKDIR /usr/app
COPY --from=build /usr/app ./
CMD ["node", "services/emailer/src/index.js"]