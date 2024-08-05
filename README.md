# UncivServer.xyz

An open source, free to play, Unciv multiplayer server written in TypeScript.

## To run locally

To run UncivServer.xyz locally, you would need:

1. Git: If you are on linux then git should be installed by default. On windows, install from
   [here](https://git-scm.com/download/win).
2. Bun: Install from https://bun.sh/
3. MongoDB: You can run a local MongoDB instance with `docker run -d --name some-mongo -e MONGO_INITDB_DATABASE=unciv -p 27017:27017 mongo`. Alternatively, you can make a free MongoDB instance with the database name `unciv` from
   [here](https://www.mongodb.com/cloud/atlas/register).


All of your data would be hosted at your MongoDB server. Now clone this project and open the
directory and make a file named `.env`.

```bash
git clone https://github.com/touhidurrr/UncivServer.xyz.git
cd UncivServer.xyz

# if running via docker, should be "MONGO_URL=mongodb://localhost"
echo "MONGO_URL=<Your MongoDB URL>" > .env
```

Now run the following commands to start your server! By default, the server will start at
`http://0.0.0.0:3000`, which you can access from `http://localhost:3000` from your browser. However,
you can change this behavior setting `PORT` and `HOST` environment variables in the `.env` file you
just made. Note that both of these variables are optional.


```bash
bun install
bun start
```

## Development

To start the development server run:

```bash
bun dev
```

Don't forget to lint, format and test the code before submitting a pull request.

```bash
bun lint
bun format
bun test
```
