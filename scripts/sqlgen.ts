import { rm, cp } from 'fs/promises';

const cleanup = async () => {
  const glob = new Bun.Glob('prisma/*.db**').scan({ onlyFiles: true });

  await Promise.all([
    rm('prisma/migrations', { force: true, recursive: true }),
    Array.fromAsync(glob).then(files => Promise.all(files.map(file => rm(file)))),
  ]);
};

await cleanup();
await Bun.$`prisma migrate dev --name temp`;
await Array.fromAsync(new Bun.Glob('prisma/**/migration.sql').scan()).then(files =>
  Promise.all(files.map(file => cp(file, 'prisma/generated.sql')))
);
await cleanup();
