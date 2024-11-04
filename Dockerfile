FROM oven/bun:1
RUN ls
WORKDIR /usr
RUN ls
WORKDIR /src
RUN ls
WORKDIR /app
RUN ls

# install dependencies into temp directory
# this will cache them and speed up future builds
RUN mkdir -p /temp/install
COPY package.json bun.lockb /temp/install/
RUN cd /temp/install && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
COPY /temp/install/node_modules node_modules
COPY . .

COPY /usr/src/index.ts .
COPY /usr/src/package.json .

# run the app
USER bun
EXPOSE 1557/tcp
ENTRYPOINT [ "bun", "start" ]
