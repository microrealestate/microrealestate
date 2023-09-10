FROM node:18-alpine

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

ENV NODE_ENV production

RUN corepack enable && \
    corepack prepare yarn@stable --activate

RUN yarn workspaces focus --production @microrealestate/emailer

CMD ["node", "services/emailer/src/index.js"]