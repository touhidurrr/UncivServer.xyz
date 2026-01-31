FROM dhi.io/bun:1-dev AS build
WORKDIR /usr/touhidurrr/app

# Copy files and build
COPY . .
RUN bun run build

# Remove unnecessary files in the build stage
RUN rm -rf scripts bun.lock site .eleventy.js

FROM dhi.io/bun:1
WORKDIR /usr/touhidurrr/app

COPY --from=build /usr/touhidurrr/app .

EXPOSE 1557
CMD ["bun", "src"]
