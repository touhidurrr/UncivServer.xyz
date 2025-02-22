FROM oven/bun:slim
WORKDIR /usr/touhidurrr/app

COPY package.json package.json
COPY bun.lock bun.lock
COPY tsconfig.json tsconfig.json
COPY public public
COPY src src

# build app
COPY scripts scripts
RUN bun run build

# run the app
EXPOSE 1557/tcp
ENTRYPOINT [ "bun", "start" ]
