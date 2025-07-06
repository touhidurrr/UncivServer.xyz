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
RUN bun install --production --frozen-lockfile

# remove unnecessary files
RUN rm -rf package.json bun.lock
RUN rm -rf scripts site .eleventy.js

# run the app
EXPOSE 1557/tcp
ENTRYPOINT [ "bun", "start" ]
