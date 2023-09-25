# with local redis
web: (bash -e build/cloudflare &) && (redis-server --save "" --appendonly no &) && node src/server.js
# no local redis
web: (bash -e build/cloudflare &) && node src/server.js
# with local redis and bun
web: (bash -e build/cloudflare &) && (redis-server --save "" --appendonly no &) && bun --bun run src/server.js
# no local redis but bun
web: (bash -e build/cloudflare &) && bun -v && bun --bun run src/server.js
