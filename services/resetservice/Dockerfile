FROM node:18-alpine

RUN apk --no-cache add build-base python3

WORKDIR /usr/app

COPY services/common services/common
COPY services/resetservice/src services/resetservice/src
COPY services/resetservice/package.json services/resetservice/.
COPY package.json .
COPY yarn.lock .
COPY .yarnrc.yml .
COPY .yarn .yarn

ENV NODE_ENV production

RUN corepack enable && \
    corepack prepare yarn@stable --activate

RUN yarn workspaces focus --production @microrealestate/resetservice 

CMD ["node", "services/resetservice/src/index.js"]
