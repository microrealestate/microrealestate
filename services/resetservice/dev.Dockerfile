FROM node:14-slim

RUN apt-get update \
    && apt-get install -y build-essential \
    && apt-get install -y python

WORKDIR /usr/app

COPY . .

RUN npm install --silent

CMD npm run dev