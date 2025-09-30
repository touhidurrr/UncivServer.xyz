FROM oven/bun:slim
WORKDIR /usr/touhidurrr/app

COPY package.json package.json
COPY bun.lock bun.lock
COPY tsconfig.json tsconfig.json
COPY scripts scripts
COPY src src

# build app
COPY site site
COPY .eleventy.js .eleventy.js
RUN bun run build

# remove dev dependencies
RUN rm -rf node_modules
RUN bun install --production --frozen-lockfile

# remove unnecessary files
RUN rm -rf scripts bun.lock
RUN rm -rf site .eleventy.js

# run the app
EXPOSE 1557/tcp
ENTRYPOINT [ "bun", "start" ]
