FROM oven/bun:1
WORKDIR /usr/touhidurrr/app

COPY package.json package.json
COPY bun.lockb bun.lockb
COPY tsconfig.json tsconfig.json
COPY public public
COPY src src

# build app
COPY scripts scripts
RUN bun run build

# run the app
EXPOSE 1557/tcp
ENTRYPOINT [ "bun", "start" ]
