FROM oven/bun:slim AS build
WORKDIR /build

COPY . .

RUN bun run build

ENV NODE_ENV=production
RUN bun compile

FROM oven/bun:slim
WORKDIR /touhidurrr/uncivserver

COPY *.map .
COPY LICENSE .
COPY bunfig.toml .
COPY --from=build --chmod=+x /build/uncivserver /usr/local/bin/bun

EXPOSE 1557
