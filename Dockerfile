FROM oven/bun:1
WORKDIR /usr/local/app

# install dependencies into temp directory
# this will cache them and speed up future builds
RUN mkdir -p /temp/install
COPY package.json bun.lockb /temp/install/
RUN cd /temp/install && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
COPY /temp/install/node_modules node_modules
COPY public .
COPY src .

# run the app
USER bun
EXPOSE 1557/tcp
ENTRYPOINT [ "bun", "start" ]
