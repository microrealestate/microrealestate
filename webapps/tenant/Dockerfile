FROM node:20-bookworm-slim AS base

FROM base AS deps
WORKDIR /usr/app
COPY package.json .
COPY .yarnrc.yml .
COPY yarn.lock .
COPY .yarn/plugins .yarn/plugins
COPY .yarn/releases .yarn/releases
COPY types/package.json types/package.json
COPY webapps/tenant/package.json webapps/tenant/package.json
RUN --mount=type=cache,id=node_modules,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn \
    yarn workspaces focus @microrealestate/tenant

FROM base AS build
WORKDIR /usr/app
ENV BASE_PATH=/__MRE_BASE_PATH__
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /usr/app ./
COPY types types
COPY webapps/commonui/scripts webapps/commonui/scripts
COPY webapps/tenant/.eslintrc.json webapps/tenant
COPY webapps/tenant/components.json webapps/tenant
COPY webapps/tenant/next.config.js webapps/tenant
COPY webapps/tenant/package.json webapps/tenant
COPY webapps/tenant/postcss.config.js webapps/tenant
COPY webapps/tenant/tailwind.config.ts webapps/tenant
COPY webapps/tenant/tsconfig.json webapps/tenant
COPY webapps/tenant/locales webapps/tenant/locales
COPY webapps/tenant/public webapps/tenant/public
COPY webapps/tenant/src webapps/tenant/src
RUN yarn workspace @microrealestate/types run build && \
    yarn workspace @microrealestate/tenant run build
# following lines needed to be able to run webapps/commonui/scripts at container runtime
RUN chown -R 1000 /usr/app/webapps/tenant/.next && \
    chown -R 1000 /usr/app/webapps/tenant/public

FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /usr/app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /usr/app/webapps/tenant/public ./public
COPY --from=build /usr/app/webapps/tenant/.next/standalone/node_modules ./node_modules
COPY --from=build /usr/app/webapps/tenant/.next/standalone/webapps/tenant ./
COPY --from=build /usr/app/webapps/tenant/.next/static ./.next/static
COPY --from=build /usr/app/webapps/commonui/scripts/replacebasepath.js ./
COPY --from=build /usr/app/webapps/commonui/scripts/runner.js ./

USER 1000
CMD ["runner.js"]
