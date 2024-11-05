FROM oven/bun:1 AS base
WORKDIR /usr/touhidurrr/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/install
COPY package.json bun.lockb /temp/install/
RUN cd /temp/install && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS release
COPY --from=install /temp/install/node_modules node_modules
COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY public public
COPY src src

# run the app
EXPOSE 1557/tcp
ENTRYPOINT [ "bun", "start" ]
