FROM dhi.io/bun:1-dev AS build
WORKDIR /build

COPY . .

RUN bun run build

ENV NODE_ENV=production
RUN bun build \
  --compile-exec-argv="--smol" --production \
  --bytecode --minify --sourcemap --format=esm \
  --compile src/index.ts --outfile uncivserver

FROM dhi.io/bun:1
WORKDIR /touhidurrr/uncivserver

COPY LICENSE .
COPY bunfig.toml .
COPY --from=build --chmod=+x /build/uncivserver /usr/local/bin/bun

EXPOSE 1557
