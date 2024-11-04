FROM oven/bun:1 AS base
WORKDIR /usr/local/app

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
COPY package.json .
COPY public/ src/ ./

# run the app
USER bun
EXPOSE 1557/tcp
ENTRYPOINT [ "bun", "start" ]
