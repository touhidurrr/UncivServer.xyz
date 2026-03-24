FROM dhi.io/bun:1-dev AS build
WORKDIR /build

COPY . .

RUN bun run build

ENV NODE_ENV=production
RUN bun build \
  --compile-exec-argv="--smol" \
  --bytecode --minify --sourcemap --format=esm \
  --compile src/index.ts --outfile uncivserver

RUN rm -rf node_modules
RUN bun add react@19 react-dom@19 react-icons@5

FROM dhi.io/debian-base:trixie
WORKDIR /touhidurrr/uncivserver

COPY LICENSE .
COPY bunfig.toml .
COPY --from=build /build/public public
COPY --from=build /build/node_modules node_modules
COPY --from=build --chmod=+x /build/uncivserver .

EXPOSE 1557
CMD ["./uncivserver"]
