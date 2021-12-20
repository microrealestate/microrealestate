FROM node:16-stretch

RUN wget -qO - https://www.mongodb.org/static/pgp/server-3.6.asc | apt-key add -
RUN echo "deb http://repo.mongodb.org/apt/debian stretch/mongodb-org/3.6 main" | tee /etc/apt/sources.list.d/mongodb-org-3.6.list
RUN apt-get update -qq && \
    apt-get upgrade -qqy && \
    apt-get install -qqy mongodb-org-tools python3 make g++

WORKDIR /usr/app
COPY services/common services/common
COPY services/api/src services/api/src
COPY services/api/bkp/demodb services/api/bkp/demodb
COPY services/api/scripts services/api/scripts
COPY services/api/LICENSE services/api/.
COPY services/api/package.json services/api/.
COPY package.json .
COPY yarn.lock .

RUN yarn global add forever && \
    yarn workspace api install --production && \
    yarn cache clean

CMD forever services/api/src/index.js