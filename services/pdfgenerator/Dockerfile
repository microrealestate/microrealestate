FROM node:16-slim

RUN apt-get update \
    && apt-get install -y wget gnupg

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer installs, work.
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN="google-chrome"

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /usr/app
COPY services/common services/common
COPY services/pdfgenerator/data services/pdfgenerator/data
COPY services/pdfgenerator/src services/pdfgenerator/src
COPY services/pdfgenerator/templates services/pdfgenerator/templates
COPY services/pdfgenerator/package.json services/pdfgenerator/.
COPY services/pdfgenerator/LICENSE services/pdfgenerator/.
COPY package.json .
COPY yarn.lock .

RUN yarn global add forever && \
    yarn workspace pdfgenerator install --production && \
    yarn cache clean

CMD forever services/pdfgenerator/src/index.js
