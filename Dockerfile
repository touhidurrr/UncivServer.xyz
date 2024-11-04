FROM oven/bun:latest

COPY package.json ./
COPY src ./

RUN bun install

EXPOSE 1557/tcp
ENTRYPOINT [ "bun", "start" ]
