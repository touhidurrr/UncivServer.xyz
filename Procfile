# with local redis
web: (bash -e build/cloudflare &) && (redis-server --save "" --appendonly no &) && node src/server.js
# no local redis
web: (bash -e build/cloudflare &) && node src/server.js
