FROM dhi.io/bun
WORKDIR /usr/touhidurrr/app

COPY . .

# build app
RUN bun run build

# remove unnecessary files
RUN rm -rf scripts bun.lock site .eleventy.js

# run the app
EXPOSE 1557/tcp
ENTRYPOINT [ "bun", "start" ]
