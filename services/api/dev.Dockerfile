FROM node:16-stretch

RUN wget -qO - https://www.mongodb.org/static/pgp/server-3.6.asc | apt-key add -
# RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
RUN echo "deb http://repo.mongodb.org/apt/debian stretch/mongodb-org/3.6 main" | tee /etc/apt/sources.list.d/mongodb-org-3.6.list
RUN apt-get update -qq && \
    apt-get upgrade -qqy && \
    apt-get install -qqy mongodb-org-tools nasm python3 make g++

WORKDIR /usr/app
COPY package.json .
COPY yarn.lock .
COPY services/common services/common
COPY services/api services/api

RUN yarn workspace api install

CMD yarn workspace api run dev