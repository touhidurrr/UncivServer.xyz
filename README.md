# Elysia with Bun runtime

An open source, free to play, Unciv multiplayer server written in TypeScript.

## To run locally

Install bun from https://bun.sh/ then run:

```bash
bun install
bun start
```

If any error is thrown because of missing environment variables, create a `.env` file at the root
directory and add missing environment variables.

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
