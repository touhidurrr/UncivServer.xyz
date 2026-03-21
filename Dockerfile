FROM dhi.io/bun:1-dev AS build
WORKDIR /build

COPY . .

RUN bun run build

ENV NODE_ENV=production
RUN bun build \
  --compile-exec-argv="--smol" \
  --bytecode --minify --sourcemap --format=esm \
  --compile src/index.ts --outfile uncivserver

FROM dhi.io/debian-base:trixie
WORKDIR /usr/touhidurrr/app

COPY LICENSE .
COPY bunfig.toml .
COPY --from=build /build/public public
COPY --from=build --chmod=+x /build/uncivserver .

EXPOSE 1557
CMD ["./uncivserver"]
