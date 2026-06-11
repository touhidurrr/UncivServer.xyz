FROM dhi.io/bun:1-dev AS build
WORKDIR /build

COPY . .

RUN bun run build

ENV NODE_ENV=production
RUN bun compile

FROM dhi.io/bun:1
WORKDIR /touhidurrr/uncivserver

COPY *.map .
COPY LICENSE .
COPY bunfig.toml .
COPY --from=build --chmod=+x /build/uncivserver /usr/local/bin/bun

EXPOSE 1557
