FROM oven/bun:slim
WORKDIR /usr/touhidurrr/app

COPY package.json package.json
COPY bun.lock bun.lock
COPY tsconfig.json tsconfig.json
COPY .prettierrc.yaml .prettierrc.yaml
COPY src src

# build app
COPY site site
COPY scripts scripts
RUN bun run build
COPY public public

# run the app
EXPOSE 1557/tcp
ENTRYPOINT [ "bun", "start" ]
