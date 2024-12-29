import { cp, rm } from 'fs/promises';

const PRISMA_FOLDER = 'prisma';
const OUT_FILE = 'prisma/generated.sql';

const cleanup = async () => {
  const glob = new Bun.Glob(`${PRISMA_FOLDER}/**.db*`).scan({ onlyFiles: true });

  await Promise.all([
    rm(`${PRISMA_FOLDER}/migrations`, { force: true, recursive: true }),
    Array.fromAsync(glob).then(files => Promise.all(files.map(file => rm(file)))),
  ]);
};

await cleanup();
await Bun.$`prisma migrate dev --name temp`;
await Array.fromAsync(new Bun.Glob(`${PRISMA_FOLDER}/**/migration.sql`).scan()).then(files =>
  Promise.all(files.map(file => cp(file, OUT_FILE)))
);
await Bun.$`prettier --write ${OUT_FILE}`;
await cleanup();
