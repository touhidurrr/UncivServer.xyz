FROM oven/bun:1
WORKDIR /usr/touhidurrr/app

COPY package.json package.json
COPY bun.lockb bun.lockb
RUN bun install --frozen-lockfile
COPY tsconfig.json tsconfig.json
COPY public public
COPY src src

# run the app
EXPOSE 1557/tcp
ENTRYPOINT [ "bun", "start" ]
