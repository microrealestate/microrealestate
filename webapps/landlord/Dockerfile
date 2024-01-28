FROM node:20-alpine AS base

FROM base AS deps
RUN apk --no-cache add libc6-compat
RUN corepack enable && \
    corepack prepare yarn@3.3.0 --activate
WORKDIR /usr/app
COPY package.json .
COPY .yarnrc.yml .
COPY yarn.lock .
COPY .yarn/plugins .yarn/plugins
COPY .yarn/releases .yarn/releases
COPY webapps/commonui/package.json webapps/commonui/package.json
COPY webapps/landlord/package.json webapps/landlord/package.json
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus @microrealestate/landlord

FROM base AS build
WORKDIR /usr/app
ENV BASE_PATH=/__MRE_BASE_PATH__
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /usr/app ./
COPY webapps/commonui/.eslintrc.json webapps/commonui
COPY webapps/commonui/components webapps/commonui/components
COPY webapps/commonui/locales webapps/commonui/locales
COPY webapps/commonui/scripts webapps/commonui/scripts
COPY webapps/commonui/utils webapps/commonui/utils
COPY webapps/landlord/.eslintrc.json webapps/landlord
COPY webapps/landlord/locales webapps/landlord/locales
COPY webapps/landlord/public webapps/landlord/public
COPY webapps/landlord/src webapps/landlord/src
COPY webapps/landlord/i18n.js webapps/landlord
COPY webapps/landlord/next.config.js webapps/landlord
COPY webapps/landlord/package.json webapps/landlord
RUN  yarn workspace @microrealestate/landlord run build

FROM base
WORKDIR /usr/app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /usr/app/webapps/landlord/public ./public
COPY --from=build /usr/app/webapps/landlord/.next/standalone/node_modules ./node_modules
COPY --from=build /usr/app/webapps/landlord/.next/standalone/webapps/landlord ./
COPY --from=build /usr/app/webapps/landlord/.next/static ./.next/static
COPY --from=build /usr/app/webapps/commonui/scripts/generateruntimeenvfile.js ./generateruntimeenvfile.js
COPY --from=build /usr/app/webapps/commonui/scripts/replacebasepath.js ./replacebasepath.js
CMD ["/bin/sh", "-c", "node replacebasepath;node generateruntimeenvfile.js;node server.js"]
