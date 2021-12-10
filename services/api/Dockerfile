FROM node:16-stretch

RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
RUN echo "deb http://repo.mongodb.org/apt/debian stretch/mongodb-org/3.6 main" | tee /etc/apt/sources.list.d/mongodb-org-3.6.list
RUN apt-get update -qq && \
    apt-get upgrade -qqy && \
    apt-get install -qqy mongodb-org-tools

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